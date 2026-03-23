"""
Signals de Colaboradores

1. Auto-creacion: Cuando se crea un User con cargo, genera un Colaborador.
2. Sync foto: Cuando User.photo cambia, sincroniza con Colaborador.foto.
3. Sync telefono: Colaborador.telefono_movil → User.phone
4. Sync nombre: Colaborador nombres/apellidos → User.first_name/last_name
5. Sync documento: Colaborador.numero_identificacion → User.document_number
6. Invalida cache onboarding: User, Colaborador e InfoPersonal al guardarse
"""
import logging
from datetime import date

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

logger = logging.getLogger(__name__)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def auto_create_colaborador(sender, instance, created, **kwargs):
    """
    Crea automaticamente un Colaborador cuando se crea un User con cargo.

    Requisitos para auto-creacion:
    - Usuario recien creado (created=True)
    - Cargo asignado (user.cargo is not None)
    - Cargo con area asignada (user.cargo.area is not None)
    - No existe Colaborador previo para este usuario
    - Existe EmpresaConfig en el tenant actual

    Si alguno falta, se logea un warning y se omite la creacion.
    """
    if not created:
        return

    user = instance

    # Omitir si viene del flujo de contratacion (ya creo Colaborador)
    if getattr(user, '_from_contratacion', False):
        return

    # A6+: Superuser sin cargo — crear cargo 'Administrador General' como fallback
    # para que tenga Colaborador y pueda acceder a Mi Portal completamente (gap U3).
    if user.is_superuser and not user.cargo:
        try:
            from django.apps import apps as _apps
            from apps.core.models import Cargo

            admin_cargo, _ = Cargo.objects.get_or_create(
                code='ADMIN_GENERAL',
                defaults={
                    'name': 'Administrador General',
                    'nivel_jerarquico': 'ESTRATEGICO',
                    'is_active': True,
                },
            )

            # Asignar área principal si existe y el cargo no la tiene aún
            if not admin_cargo.area:
                try:
                    Area = _apps.get_model('organizacion', 'Area')
                    area = Area.objects.filter(is_active=True).first()
                    if area:
                        admin_cargo.area = area
                        admin_cargo.save(update_fields=['area'])
                    else:
                        logger.warning(
                            'A6+: No existe ningún Area activa para asignar al cargo ADMIN_GENERAL '
                            '(User superuser %s). Se omite auto-create Colaborador.',
                            user.id,
                        )
                        return
                except LookupError:
                    logger.warning(
                        'A6+: App "organizacion" no disponible. '
                        'Se omite auto-create Colaborador para superuser %s.',
                        user.id,
                    )
                    return

            if admin_cargo.area:
                user.cargo = admin_cargo
                user.save(update_fields=['cargo'])
                logger.info(
                    'A6+: Cargo ADMIN_GENERAL asignado a superuser %s (%s) '
                    'para auto-crear Colaborador.',
                    user.id, user.email,
                )
            else:
                logger.warning(
                    'A6+: Cargo ADMIN_GENERAL no tiene área asignada. '
                    'Se omite auto-create Colaborador para superuser %s.',
                    user.id,
                )
                return

        except Exception as exc:
            logger.error(
                'A6+: Error creando cargo ADMIN_GENERAL para superuser %s: %s',
                user.id, exc, exc_info=True,
            )
            return

    # Requisito: usuario debe tener cargo asignado
    if not user.cargo:
        return

    # Requisito: cargo debe tener area asignada
    if not user.cargo.area:
        logger.warning(
            'Auto-create Colaborador omitido para User %s (%s): '
            'El cargo "%s" no tiene area asignada.',
            user.id, user.email, user.cargo.name
        )
        return

    # Verificar que no exista ya un Colaborador vinculado
    from .models import Colaborador
    if Colaborador.objects.filter(usuario=user).exists():
        return

    # Obtener empresa del tenant actual via helper centralizado (C0)
    from apps.core.base_models.mixins import get_tenant_empresa
    empresa = get_tenant_empresa()
    if not empresa:
        logger.warning(
            'Auto-create Colaborador omitido para User %s (%s): '
            'No hay EmpresaConfig en el tenant actual.',
            user.id, user.email
        )
        return

    # Mapeo de document_type User -> Colaborador
    doc_type_map = {
        'CC': 'CC', 'CE': 'CE', 'TI': 'TI',
        'PA': 'PA', 'PEP': 'PEP', 'PPT': 'PPT',
    }

    try:
        colaborador = Colaborador.objects.create(
            empresa=empresa,
            usuario=user,
            primer_nombre=user.first_name or user.username,
            primer_apellido=user.last_name or '',
            numero_identificacion=user.document_number or f'PEND-{user.id}',
            tipo_documento=doc_type_map.get(user.document_type, 'CC'),
            cargo=user.cargo,
            area=user.cargo.area,
            foto=user.photo if user.photo else None,
            fecha_ingreso=date.today(),
            tipo_contrato=(
                'prestacion_servicios'
                if getattr(user.cargo, 'is_externo', False)
                else 'indefinido'
            ),
            salario=0,  # Placeholder - requiere configuracion manual
            estado='activo',
            created_by=user,
        )
        logger.info(
            'Colaborador #%s creado automaticamente para User %s (%s)',
            colaborador.id, user.id, user.email
        )
    except Exception as e:
        logger.error(
            'Error al crear Colaborador para User %s (%s): %s',
            user.id, user.email, e,
            exc_info=True
        )


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def sync_user_photo_to_colaborador(sender, instance, **kwargs):
    """
    Sincroniza User.photo con Colaborador.foto cuando cambia.

    Solo actua cuando save() se llama con update_fields que incluye 'photo'.
    Esto ocurre en UserViewSet.upload_photo() via UserPhotoUploadSerializer.save().
    """
    update_fields = kwargs.get('update_fields')
    if not update_fields:
        return
    if 'photo' not in update_fields:
        return

    from .models import Colaborador
    try:
        colaborador = Colaborador.objects.get(usuario=instance)
        if instance.photo:
            colaborador.foto = instance.photo
        else:
            colaborador.foto = None
        colaborador.save(update_fields=['foto'])
        logger.info(
            'Foto sincronizada User %s -> Colaborador %s',
            instance.id, colaborador.id
        )
    except Colaborador.DoesNotExist:
        pass
    except Exception as e:
        logger.error(
            'Error sincronizando foto User %s -> Colaborador: %s',
            instance.id, e
        )


# ==============================================================================
# A4 — SYNC Colaborador → User
# ==============================================================================

@receiver(post_save, sender='colaboradores.Colaborador')
def sync_colaborador_phone_to_user(sender, instance, **kwargs):
    """
    Sincroniza Colaborador.telefono_movil con User.phone.

    Solo actúa cuando save() se llama con update_fields que incluye
    'telefono_movil', evitando loops infinitos.
    """
    update_fields = kwargs.get('update_fields')
    if not update_fields or 'telefono_movil' not in update_fields:
        return

    user = getattr(instance, 'usuario', None)
    if not user:
        return

    try:
        user.phone = instance.telefono_movil or None
        user.save(update_fields=['phone'])
        logger.debug(
            'Teléfono sincronizado Colaborador %s -> User %s',
            instance.pk, user.pk
        )
    except Exception as exc:
        logger.error(
            'Error sincronizando teléfono Colaborador %s -> User %s: %s',
            instance.pk, user.pk, exc
        )


@receiver(post_save, sender='colaboradores.Colaborador')
def sync_colaborador_name_to_user(sender, instance, **kwargs):
    """
    Sincroniza nombres/apellidos del Colaborador con User.first_name y User.last_name.

    Solo actúa cuando update_fields incluye al menos uno de:
    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido.

    Formato:
        first_name = primer_nombre [segundo_nombre]  (máx 150 chars)
        last_name  = primer_apellido [segundo_apellido] (máx 150 chars)
    """
    update_fields = kwargs.get('update_fields')
    if not update_fields:
        return

    name_fields = {'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido'}
    if not name_fields.intersection(update_fields):
        return

    user = getattr(instance, 'usuario', None)
    if not user:
        return

    try:
        first_name_parts = [
            p for p in [
                getattr(instance, 'primer_nombre', ''),
                getattr(instance, 'segundo_nombre', ''),
            ] if p
        ]
        last_name_parts = [
            p for p in [
                getattr(instance, 'primer_apellido', ''),
                getattr(instance, 'segundo_apellido', ''),
            ] if p
        ]
        user.first_name = ' '.join(first_name_parts)[:150]
        user.last_name = ' '.join(last_name_parts)[:150]
        user.save(update_fields=['first_name', 'last_name'])
        logger.debug(
            'Nombre sincronizado Colaborador %s -> User %s',
            instance.pk, user.pk
        )
    except Exception as exc:
        logger.error(
            'Error sincronizando nombre Colaborador %s -> User %s: %s',
            instance.pk, user.pk, exc
        )


@receiver(post_save, sender='colaboradores.Colaborador')
def sync_colaborador_document_to_user(sender, instance, **kwargs):
    """
    Sincroniza Colaborador.numero_identificacion con User.document_number.

    Solo actúa cuando update_fields incluye 'numero_identificacion',
    evitando loops infinitos.
    """
    update_fields = kwargs.get('update_fields')
    if not update_fields or 'numero_identificacion' not in update_fields:
        return

    user = getattr(instance, 'usuario', None)
    if not user:
        return

    try:
        user.document_number = instance.numero_identificacion
        user.save(update_fields=['document_number'])
        logger.debug(
            'Documento sincronizado Colaborador %s -> User %s',
            instance.pk, user.pk
        )
    except Exception as exc:
        logger.error(
            'Error sincronizando documento Colaborador %s -> User %s: %s',
            instance.pk, user.pk, exc
        )


# ==============================================================================
# A4 — Invalidación de cache de onboarding
# ==============================================================================

def _invalidate_onboarding(user_id: int) -> None:
    """Helper para invalidar cache de onboarding sin crashear si el servicio falla."""
    try:
        from apps.core.services.onboarding_service import OnboardingService
        OnboardingService.invalidate_cache(user_id)
    except Exception as exc:
        logger.debug(
            'No se pudo invalidar cache onboarding para user_id=%s: %s',
            user_id, exc
        )


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def invalidate_onboarding_cache_on_user_save(sender, instance, **kwargs):
    """
    Invalida el cache de onboarding cuando se modifica cualquier campo del User.

    No actúa en creaciones nuevas (handled by compute al crear UserOnboarding).
    Solo actúa cuando update_fields está definido (cambios explícitos).
    """
    if kwargs.get('created'):
        return
    update_fields = kwargs.get('update_fields')
    if not update_fields:
        return
    _invalidate_onboarding(instance.pk)


@receiver(post_save, sender='colaboradores.Colaborador')
def invalidate_onboarding_cache_on_colaborador_save(sender, instance, **kwargs):
    """
    Invalida el cache de onboarding cuando se modifica el Colaborador.

    Solo actúa cuando update_fields está definido para evitar invalidaciones
    masivas innecesarias.
    """
    update_fields = kwargs.get('update_fields')
    if not update_fields:
        return
    user = getattr(instance, 'usuario', None)
    if user:
        _invalidate_onboarding(user.pk)


@receiver(post_save, sender='colaboradores.InfoPersonal')
def invalidate_onboarding_cache_on_info_personal_save(sender, instance, **kwargs):
    """
    Invalida el cache de onboarding cuando se modifica InfoPersonal.

    Solo actúa cuando update_fields está definido para evitar invalidaciones
    masivas innecesarias.
    """
    update_fields = kwargs.get('update_fields')
    if not update_fields:
        return
    try:
        colaborador = getattr(instance, 'colaborador', None)
        if colaborador:
            user = getattr(colaborador, 'usuario', None)
            if user:
                _invalidate_onboarding(user.pk)
    except Exception as exc:
        logger.debug(
            'Error obteniendo user desde InfoPersonal %s para invalidar cache: %s',
            instance.pk, exc
        )
