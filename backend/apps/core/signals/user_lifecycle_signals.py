"""
Signals del Ciclo de Vida del Usuario - StrateKaz

Cuando se crea un User dentro de un tenant schema:
1. Auto-crea TenantUser en schema public (para login global)
2. Auto-crea TenantUserAccess (vincula TenantUser con el tenant actual)
3. Auto-llena VacanteActiva del cargo asignado (solo flujo manual)
4. Envia email de bienvenida via Celery

Los signals respetan el flag _from_contratacion para evitar duplicados
cuando ContratacionService ya maneja la vacante y el Colaborador.
"""
import logging

from django.db import connection
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

logger = logging.getLogger(__name__)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def auto_create_tenant_user(sender, instance, created, **kwargs):
    """
    Crea TenantUser + TenantUserAccess cuando se crea un User en un tenant.

    Esto permite que el trabajador pueda hacer login global.
    El password hasheado se copia directamente del User al TenantUser.

    Superusers (is_superuser=True) se omiten porque son usuarios tecnicos
    que ya tienen TenantUser (creado al provisionar el tenant).
    """
    if not created:
        return

    user = instance

    # Omitir superusers: son usuarios tecnicos, ya tienen TenantUser
    if user.is_superuser:
        return

    # Necesitamos estar dentro de un tenant schema (no public)
    current_schema = getattr(connection, 'schema_name', 'public')
    if current_schema == 'public':
        return

    try:
        from apps.tenant.models import TenantUser, TenantUserAccess, Tenant

        # Obtener el tenant actual
        current_tenant = getattr(connection, 'tenant', None)
        if not current_tenant:
            try:
                current_tenant = Tenant.objects.get(schema_name=current_schema)
            except Tenant.DoesNotExist:
                logger.warning(
                    'Auto-create TenantUser omitido para User %s (%s): '
                    'No se encontro Tenant para schema "%s".',
                    user.id, user.email, current_schema
                )
                return

        # Verificar si ya existe un TenantUser con este email
        tenant_user, tu_created = TenantUser.objects.get_or_create(
            email=user.email.lower().strip(),
            defaults={
                'password': user.password,  # Password ya hasheado
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': True,
                'is_superadmin': False,
            }
        )

        if tu_created:
            logger.info(
                'TenantUser #%s creado para User %s (%s)',
                tenant_user.id, user.id, user.email
            )
        else:
            # Si el TenantUser existente estaba desactivado (soft-deleted),
            # reactivarlo automáticamente — el usuario está siendo creado
            # en un nuevo tenant, así que necesita poder hacer login.
            if not tenant_user.is_active:
                tenant_user.is_active = True
                tenant_user.password = user.password  # Sincronizar password
                tenant_user.save(update_fields=['is_active', 'password'])
                logger.info(
                    'TenantUser #%s REACTIVADO para User %s (%s) en tenant "%s"',
                    tenant_user.id, user.id, user.email, current_tenant.name
                )
            else:
                logger.info(
                    'TenantUser existente #%s vinculado a User %s (%s)',
                    tenant_user.id, user.id, user.email
                )

        # Crear acceso al tenant actual si no existe
        _access, access_created = TenantUserAccess.objects.get_or_create(
            tenant_user=tenant_user,
            tenant=current_tenant,
            defaults={
                'is_active': True,
            }
        )

        if access_created:
            logger.info(
                'TenantUserAccess creado: TenantUser #%s -> Tenant "%s"',
                tenant_user.id, current_tenant.name
            )

    except Exception as e:
        logger.error(
            'Error al crear TenantUser para User %s (%s): %s',
            user.id, user.email, e,
            exc_info=True
        )


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def auto_fill_vacancy_on_user_created(sender, instance, created, **kwargs):
    """
    Cuando se crea un User con cargo, incrementa posiciones_cubiertas
    en la VacanteActiva correspondiente.

    Si todas las posiciones estan cubiertas, cierra la vacante.

    Se omite si _from_contratacion=True porque ContratacionService
    ya maneja la vacante con select_for_update (thread-safe).
    """
    if not created:
        return

    user = instance

    if not user.cargo:
        return

    # Omitir superusers
    if user.is_superuser:
        return

    # Omitir si viene del flujo de contratacion (ya actualizo la vacante)
    if getattr(user, '_from_contratacion', False):
        return

    try:
        from apps.talent_hub.seleccion_contratacion.models import VacanteActiva

        # Buscar vacante abierta o en proceso para este cargo
        vacante = VacanteActiva.objects.filter(
            cargo=user.cargo,
            estado__in=['abierta', 'en_proceso'],
        ).order_by('-created_at').first()

        if not vacante:
            return

        # Incrementar posiciones cubiertas
        vacante.posiciones_cubiertas += 1

        # Si todas las posiciones estan cubiertas, cerrar vacante
        if vacante.posiciones_cubiertas >= vacante.numero_posiciones:
            vacante.estado = 'cerrada'

        vacante.save(update_fields=['posiciones_cubiertas', 'estado'])

        logger.info(
            'VacanteActiva %s actualizada: %s/%s posiciones (%s) '
            'por asignacion de User %s al cargo %s',
            vacante.codigo_vacante,
            vacante.posiciones_cubiertas,
            vacante.numero_posiciones,
            vacante.estado,
            user.id,
            user.cargo.code,
        )

    except ImportError:
        pass  # Modulo seleccion_contratacion no instalado
    except Exception as e:
        logger.error(
            'Error al actualizar vacante para User %s (cargo %s): %s',
            user.id, getattr(user.cargo, 'code', '?'), e,
            exc_info=True
        )


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def send_welcome_email_on_user_created(sender, instance, created, **kwargs):
    """
    Envia email de bienvenida asincrono cuando se crea un User.

    El email incluye:
    - Nombre del trabajador
    - Empresa (tenant)
    - Cargo asignado
    - Link para ingresar al portal
    - Password temporal (si viene del flujo de contratacion)

    NOTA: Si el usuario tiene password_setup_token, NO se envia welcome email.
    En ese caso ya se envio el email de setup de contraseña desde el viewset
    que creo el usuario (Colaboradores o Proveedores). Enviar ambos causa
    confusion porque el welcome NO tiene link de setup.
    """
    if not created:
        return

    user = instance

    # Omitir superusers
    if user.is_superuser:
        return

    if not user.email:
        return

    # Si tiene token de setup de contraseña, el email de setup ya se envía
    # desde el viewset que creó el usuario. No enviar welcome duplicado.
    if user.password_setup_token:
        logger.info(
            'Welcome email omitido para User %s (%s): '
            'tiene password_setup_token, se enviará email de setup en su lugar.',
            user.id, user.email
        )
        return

    # Obtener datos del tenant (nombre + colores para branding del email)
    current_tenant = getattr(connection, 'tenant', None)
    tenant_name = getattr(current_tenant, 'name', 'StrateKaz')
    primary_color = getattr(current_tenant, 'primary_color', '#ec268f') or '#ec268f'
    secondary_color = getattr(current_tenant, 'secondary_color', '#000000') or '#000000'

    # Si viene de contratacion, incluir indicacion de password temporal
    temp_password_hint = getattr(user, '_temp_password_hint', '')

    try:
        from apps.core.tasks import send_welcome_email_task
        from django.utils import timezone

        send_welcome_email_task.delay(
            user_email=user.email,
            user_name=user.get_full_name() or user.username,
            tenant_name=tenant_name,
            cargo_name=user.cargo.name if user.cargo else '',
            temp_password_hint=temp_password_hint,
            primary_color=primary_color,
            secondary_color=secondary_color,
            current_year=timezone.now().year,
        )

        logger.info(
            'Email de bienvenida programado para User %s (%s)',
            user.id, user.email
        )

    except Exception as e:
        logger.warning(
            'No se pudo programar email de bienvenida para User %s (%s): %s',
            user.id, user.email, e
        )
