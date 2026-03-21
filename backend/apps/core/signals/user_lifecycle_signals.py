"""
Signals del Ciclo de Vida del Usuario - StrateKaz

Cuando se crea un User dentro de un tenant schema:
1. Auto-crea TenantUser en schema public (para login global)
2. Auto-crea TenantUserAccess (vincula TenantUser con el tenant actual)
3. Auto-llena VacanteActiva del cargo asignado (solo flujo manual)
4. Envia email de bienvenida via Celery
5. Auto-asigna nivel_firma basado en cargo.nivel_jerarquico

Los signals respetan el flag _from_contratacion para evitar duplicados
cuando ContratacionService ya maneja la vacante y el Colaborador.
"""
import logging

from django.db import connection
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

logger = logging.getLogger(__name__)

# Mapeo: nivel_jerarquico del Cargo → nivel_firma del User
NIVEL_JERARQUICO_TO_NIVEL_FIRMA = {
    'ESTRATEGICO': 3,  # TOTP + Email OTP
    'TACTICO': 2,      # TOTP obligatorio
    'OPERATIVO': 1,    # Solo firma manuscrita
    'APOYO': 1,        # Solo firma manuscrita
    'EXTERNO': 1,      # Solo firma manuscrita
}


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

        # Crear acceso al tenant actual si no existe.
        # Si ya existe pero está inactivo (ej: offboarding previo), NO se
        # reactiva automáticamente — requiere acción explícita de un admin
        # para evitar bypass del proceso de retiro.
        access, access_created = TenantUserAccess.objects.get_or_create(
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
        elif not access.is_active:
            # El acceso existía pero estaba desactivado (offboarding u otra
            # desactivación intencional). NO reactivar automáticamente.
            logger.warning(
                'TenantUserAccess INACTIVO encontrado para TenantUser #%s '
                '-> Tenant "%s". El acceso NO fue reactivado '
                'automáticamente. Requiere acción de un administrador.',
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
        from apps.mi_equipo.seleccion_contratacion.models import VacanteActiva

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
    # MB-TENANT: connection.tenant puede ser None en contexto de señales/Celery.
    # Fallback robusto: buscar tenant real desde TenantUser si connection falla.
    current_tenant = getattr(connection, 'tenant', None)
    tenant_name = getattr(current_tenant, 'name', None)

    if not tenant_name:
        try:
            from apps.tenant.models import TenantUser
            tu = TenantUser.objects.filter(
                user_email=user.email, is_active=True
            ).select_related('tenant').first()
            if tu and tu.tenant:
                current_tenant = tu.tenant
                tenant_name = tu.tenant.name
        except Exception:
            pass
        if not tenant_name:
            tenant_name = 'StrateKaz'

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


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def auto_assign_nivel_firma(sender, instance, **kwargs):
    """
    Auto-asigna nivel_firma basado en cargo.nivel_jerarquico.

    Se ejecuta en creación Y actualización del usuario para cubrir:
    - Creación de usuario con cargo asignado
    - Cambio de cargo en usuario existente

    Si nivel_firma_manual=True, NO se sobreescribe (override del admin).
    Usa update() directo para evitar loop infinito de post_save.
    """
    user = instance

    # Respetar override manual
    if user.nivel_firma_manual:
        return

    # Calcular nivel esperado
    if user.cargo and hasattr(user.cargo, 'nivel_jerarquico'):
        expected = NIVEL_JERARQUICO_TO_NIVEL_FIRMA.get(
            user.cargo.nivel_jerarquico, 1
        )
    else:
        expected = 1

    # Solo actualizar si cambió (evitar queries innecesarios)
    if user.nivel_firma != expected:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.filter(pk=user.pk).update(nivel_firma=expected)
        logger.info(
            'nivel_firma auto-asignado: User %s (%s) → nivel %d '
            '(cargo: %s, nivel_jerarquico: %s)',
            user.pk, user.email, expected,
            getattr(user.cargo, 'code', 'N/A'),
            getattr(user.cargo, 'nivel_jerarquico', 'N/A'),
        )


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def retro_asignar_firmas_pendientes(sender, instance, **kwargs):
    """
    Cuando un usuario se asigna a un cargo, busca documentos que necesitan
    firmante de ese cargo (configurados en firmantes_por_defecto de la plantilla)
    y crea FirmaDigital records automáticamente + envía notificación.

    Esto cubre el caso: se creó un documento ANTES de que existiera un usuario
    con el cargo requerido. Cuando el usuario se crea/actualiza y tiene cargo,
    las firmas pendientes se retro-asignan inmediatamente.
    """
    user = instance

    # Solo procesar si el usuario tiene cargo activo
    if not user.cargo or not user.is_active:
        return

    cargo_code = getattr(user.cargo, 'code', None)
    if not cargo_code:
        return

    try:
        from django.apps import apps
        from django.contrib.contenttypes.models import ContentType

        PlantillaDocumento = apps.get_model('gestion_documental', 'PlantillaDocumento')
        Documento = apps.get_model('gestion_documental', 'Documento')
        FirmaDigital = apps.get_model('firma_digital', 'FirmaDigital')
        HistorialFirma = apps.get_model('firma_digital', 'HistorialFirma')

        # Buscar plantillas que requieren este cargo en firmantes_por_defecto
        plantillas_con_cargo = PlantillaDocumento.objects.filter(
            firmantes_por_defecto__contains=[{'cargo_code': cargo_code}],
        ).values_list('id', flat=True)

        if not plantillas_con_cargo:
            # Búsqueda alternativa: filtrar en Python (JSON contains puede fallar)
            all_plantillas = PlantillaDocumento.objects.exclude(
                firmantes_por_defecto=[]
            ).exclude(firmantes_por_defecto__isnull=True)

            plantillas_ids = []
            for p in all_plantillas:
                for f in (p.firmantes_por_defecto or []):
                    if f.get('cargo_code') == cargo_code:
                        plantillas_ids.append(p.id)
                        break
            plantillas_con_cargo = plantillas_ids

        if not plantillas_con_cargo:
            return

        # Buscar documentos activos de esas plantillas (BORRADOR o EN_REVISION)
        documentos = Documento.objects.filter(
            plantilla_id__in=plantillas_con_cargo,
            estado__in=['BORRADOR', 'EN_REVISION'],
        )

        if not documentos.exists():
            return

        doc_ct = ContentType.objects.get_for_model(Documento)
        firmas_creadas = 0

        for doc in documentos:
            plantilla = doc.plantilla
            if not plantilla or not plantilla.firmantes_por_defecto:
                continue

            for config in plantilla.firmantes_por_defecto:
                if config.get('cargo_code') != cargo_code:
                    continue

                rol_firma = config.get('rol_firma', 'ELABORO')

                # Verificar que no exista ya una firma para este doc+cargo+rol
                ya_existe = FirmaDigital.objects.filter(
                    content_type=doc_ct,
                    object_id=doc.pk,
                    cargo=user.cargo,
                    rol_firma=rol_firma,
                ).exists()

                if ya_existe:
                    continue

                # Crear FirmaDigital
                firma = FirmaDigital.objects.create(
                    content_type=doc_ct,
                    object_id=doc.pk,
                    configuracion_flujo=None,
                    nodo_flujo=None,
                    usuario=user,
                    cargo=user.cargo,
                    rol_firma=rol_firma,
                    orden=config.get('orden', 0),
                    estado='PENDIENTE',
                    firma_imagen='',
                    documento_hash='pending',
                    ip_address='0.0.0.0',
                    user_agent='retro-assigned-on-user-cargo',
                )

                HistorialFirma.objects.create(
                    firma=firma,
                    accion='FIRMA_CREADA',
                    usuario=user,
                    descripcion=(
                        f'Retro-asignado al crear/actualizar usuario con cargo '
                        f'"{user.cargo.name}": {rol_firma} → {user.get_full_name()}'
                    ),
                    metadatos={
                        'plantilla_codigo': plantilla.codigo,
                        'cargo_code': cargo_code,
                        'retro_asignado': True,
                        'documento_codigo': doc.codigo,
                    },
                    ip_address='0.0.0.0',
                )
                firmas_creadas += 1

                # Si el doc estaba en BORRADOR, pasarlo a EN_REVISION
                if doc.estado == 'BORRADOR':
                    doc.estado = 'EN_REVISION'
                    doc.save(update_fields=['estado', 'updated_at'])

                # Notificar al usuario
                try:
                    from apps.audit_system.centro_notificaciones.services import (
                        NotificationService,
                    )
                    NotificationService.send_notification(
                        tipo_codigo='FIRMA_PENDIENTE',
                        usuario=user,
                        titulo='Firma pendiente',
                        mensaje=(
                            f'Tiene una firma pendiente como {rol_firma} '
                            f'en el documento "{doc.titulo}" ({doc.codigo}).'
                        ),
                        url=f'/gestion-documental?doc={doc.pk}',
                        datos_extra={
                            'documento_id': str(doc.pk),
                            'documento_codigo': doc.codigo,
                            'rol_firma': rol_firma,
                        },
                        prioridad='alta',
                    )
                except Exception as notif_err:
                    logger.warning(
                        'No se pudo notificar firma pendiente a %s: %s',
                        user.email, notif_err,
                    )

        if firmas_creadas:
            logger.info(
                '[firma-retro] %d firma(s) retro-asignadas a %s (%s) cargo=%s',
                firmas_creadas, user.get_full_name(), user.email, cargo_code,
            )

    except Exception as e:
        logger.warning(
            'Error en retro_asignar_firmas_pendientes para User %s: %s',
            getattr(user, 'pk', '?'), e,
        )
