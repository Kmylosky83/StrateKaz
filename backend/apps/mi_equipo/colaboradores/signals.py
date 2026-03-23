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
        # C14: Verificar que EmpresaConfig existe ANTES de intentar crear cargo/Colaborador
        from apps.core.base_models.mixins import get_tenant_empresa as _get_empresa
        empresa_check = _get_empresa(auto_create=False)
        if not empresa_check:
            logger.warning(
                'C14: No se puede crear Colaborador para superuser %s (%s): '
                'EmpresaConfig no encontrada. Se creará cuando el admin '
                'configure la empresa.',
                user.id, user.email,
            )
            return

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


# ==============================================================================
# C14 — Retry Colaborador para superusers cuando EmpresaConfig se crea
# ==============================================================================

@receiver(post_save, sender='configuracion.EmpresaConfig')
def retry_colaborador_for_superusers_on_empresa_create(sender, instance, created, **kwargs):
    """
    C14: Cuando EmpresaConfig se crea por primera vez, busca superusers sin
    Colaborador y re-intenta la creación automática.

    Esto cubre el caso donde un superuser fue creado ANTES de que existiera
    EmpresaConfig en el tenant (bootstrap race condition).
    """
    if not created:
        return

    from django.contrib.auth import get_user_model
    from .models import Colaborador

    User = get_user_model()

    superusers_sin_colaborador = User.objects.filter(
        is_superuser=True,
        is_active=True,
    ).exclude(
        id__in=Colaborador.objects.values_list('usuario_id', flat=True)
    )

    for user in superusers_sin_colaborador:
        logger.info(
            'C14: Re-intentando auto-create Colaborador para superuser %s (%s) '
            'tras creación de EmpresaConfig.',
            user.id, user.email,
        )
        # Disparar la lógica de auto_create_colaborador manualmente
        # Usamos post_save.send() para re-ejecutar el signal con created=True
        try:
            auto_create_colaborador(
                sender=User,
                instance=user,
                created=True,
            )
        except Exception as exc:
            logger.error(
                'C14: Error re-creando Colaborador para superuser %s tras '
                'EmpresaConfig: %s',
                user.id, exc, exc_info=True,
            )

# ==============================================================================
# C1 — SYNC Colaborador → User (cargo, salario, fecha_ingreso, tipo_contrato,
#      estado) — 5 campos duplicados sin sync previo
# ==============================================================================

# Mapping: Colaborador.estado (lowercase) → User.estado_empleado (UPPERCASE)
_ESTADO_COL_TO_USER = {
    'activo': 'ACTIVO',
    'inactivo': 'RETIRADO',
    'suspendido': 'SUSPENDIDO',
    'retirado': 'RETIRADO',
}

# Mapping: Colaborador.tipo_contrato (lowercase) → User.tipo_contrato (UPPERCASE)
_TIPO_CONTRATO_COL_TO_USER = {
    'indefinido': 'INDEFINIDO',
    'fijo': 'FIJO',
    'obra_labor': 'OBRA_LABOR',
    'aprendizaje': 'APRENDIZAJE',
    'prestacion_servicios': 'PRESTACION_SERVICIOS',
}

# Mapping inverso: User.tipo_contrato (UPPERCASE) → Colaborador (lowercase)
_TIPO_CONTRATO_USER_TO_COL = {v: k for k, v in _TIPO_CONTRATO_COL_TO_USER.items()}
# TEMPORAL solo existe en User; no se mapea a Colaborador.


@receiver(post_save, sender='colaboradores.Colaborador')
def sync_colaborador_cargo_to_user(sender, instance, **kwargs):
    """C1: Sincronizar Colaborador.cargo → User.cargo."""
    update_fields = kwargs.get('update_fields')
    if update_fields and 'cargo' not in update_fields:
        return

    user = getattr(instance, 'usuario', None)
    if not user:
        return

    # Evitar loop con sync_user_cargo_to_colaborador
    if getattr(instance, '_syncing_cargo_from_user', False):
        return

    try:
        from apps.core.models import User
        if user.cargo_id != instance.cargo_id:
            User.objects.filter(pk=user.pk).update(cargo=instance.cargo_id)
            logger.debug(
                'Cargo sincronizado Colaborador %s -> User %s',
                instance.pk, user.pk,
            )
    except Exception as exc:
        logger.error(
            'Error sync cargo Colaborador %s -> User %s: %s',
            instance.pk, user.pk, exc,
        )


@receiver(post_save, sender='colaboradores.Colaborador')
def sync_colaborador_salario_to_user(sender, instance, **kwargs):
    """C1: Sincronizar Colaborador.salario → User.salario_base."""
    update_fields = kwargs.get('update_fields')
    if update_fields and 'salario' not in update_fields:
        return

    user = getattr(instance, 'usuario', None)
    if not user:
        return

    try:
        from apps.core.models import User
        if user.salario_base != instance.salario:
            User.objects.filter(pk=user.pk).update(
                salario_base=instance.salario,
            )
            logger.debug(
                'Salario sincronizado Colaborador %s -> User %s',
                instance.pk, user.pk,
            )
    except Exception as exc:
        logger.error(
            'Error sync salario Colaborador %s -> User %s: %s',
            instance.pk, user.pk, exc,
        )


@receiver(post_save, sender='colaboradores.Colaborador')
def sync_colaborador_fecha_ingreso_to_user(sender, instance, **kwargs):
    """C1: Sincronizar Colaborador.fecha_ingreso → User.fecha_ingreso."""
    update_fields = kwargs.get('update_fields')
    if update_fields and 'fecha_ingreso' not in update_fields:
        return

    user = getattr(instance, 'usuario', None)
    if not user:
        return

    try:
        from apps.core.models import User
        if user.fecha_ingreso != instance.fecha_ingreso:
            User.objects.filter(pk=user.pk).update(
                fecha_ingreso=instance.fecha_ingreso,
            )
            logger.debug(
                'Fecha ingreso sincronizada Colaborador %s -> User %s',
                instance.pk, user.pk,
            )
    except Exception as exc:
        logger.error(
            'Error sync fecha_ingreso Colaborador %s -> User %s: %s',
            instance.pk, user.pk, exc,
        )


@receiver(post_save, sender='colaboradores.Colaborador')
def sync_colaborador_tipo_contrato_to_user(sender, instance, **kwargs):
    """C1: Sincronizar Colaborador.tipo_contrato → User.tipo_contrato.

    Mapping: lowercase → UPPERCASE (ej: 'indefinido' → 'INDEFINIDO').
    """
    update_fields = kwargs.get('update_fields')
    if update_fields and 'tipo_contrato' not in update_fields:
        return

    user = getattr(instance, 'usuario', None)
    if not user:
        return

    try:
        from apps.core.models import User
        mapped = _TIPO_CONTRATO_COL_TO_USER.get(instance.tipo_contrato)
        if mapped is None:
            # Valor desconocido en Colaborador — no sincronizar
            logger.warning(
                'tipo_contrato "%s" de Colaborador %s no tiene mapping a User',
                instance.tipo_contrato, instance.pk,
            )
            return
        if user.tipo_contrato != mapped:
            User.objects.filter(pk=user.pk).update(tipo_contrato=mapped)
            logger.debug(
                'Tipo contrato sincronizado Colaborador %s -> User %s '
                '(%s -> %s)',
                instance.pk, user.pk, instance.tipo_contrato, mapped,
            )
    except Exception as exc:
        logger.error(
            'Error sync tipo_contrato Colaborador %s -> User %s: %s',
            instance.pk, user.pk, exc,
        )


@receiver(post_save, sender='colaboradores.Colaborador')
def sync_colaborador_estado_to_user(sender, instance, **kwargs):
    """C1: Sincronizar Colaborador.estado → User.estado_empleado.

    Mapping:
        activo → ACTIVO
        inactivo → RETIRADO
        suspendido → SUSPENDIDO
        retirado → RETIRADO
    """
    update_fields = kwargs.get('update_fields')
    if update_fields and 'estado' not in update_fields:
        return

    user = getattr(instance, 'usuario', None)
    if not user:
        return

    try:
        from apps.core.models import User
        mapped = _ESTADO_COL_TO_USER.get(instance.estado)
        if mapped is None:
            logger.warning(
                'estado "%s" de Colaborador %s no tiene mapping a User',
                instance.estado, instance.pk,
            )
            return
        if user.estado_empleado != mapped:
            User.objects.filter(pk=user.pk).update(estado_empleado=mapped)
            logger.debug(
                'Estado sincronizado Colaborador %s -> User %s (%s -> %s)',
                instance.pk, user.pk, instance.estado, mapped,
            )
    except Exception as exc:
        logger.error(
            'Error sync estado Colaborador %s -> User %s: %s',
            instance.pk, user.pk, exc,
        )


# ==============================================================================
# C1 — SYNC InfoPersonal → User (tipo_sangre, eps, arl, fondo_pensiones,
#      caja_compensacion) — 5 campos duplicados sin sync previo
# ==============================================================================

_INFO_PERSONAL_SYNC_FIELDS = {
    'tipo_sangre', 'eps', 'arl', 'fondo_pensiones', 'caja_compensacion',
}


@receiver(post_save, sender='colaboradores.InfoPersonal')
def sync_info_personal_to_user(sender, instance, **kwargs):
    """C1: Sincronizar InfoPersonal → User para 5 campos SST.

    Campos: tipo_sangre, eps, arl, fondo_pensiones, caja_compensacion.
    Todos son CharField con copia directa (mismo formato en ambos modelos).
    """
    update_fields = kwargs.get('update_fields')
    if update_fields and not _INFO_PERSONAL_SYNC_FIELDS.intersection(
        update_fields
    ):
        return

    # Chain: InfoPersonal → Colaborador → User
    colaborador = getattr(instance, 'colaborador', None)
    if not colaborador:
        return
    user = getattr(colaborador, 'usuario', None)
    if not user:
        return

    try:
        from apps.core.models import User

        # Calcular qué campos realmente cambiaron
        updates = {}
        fields_to_check = (
            _INFO_PERSONAL_SYNC_FIELDS.intersection(update_fields)
            if update_fields
            else _INFO_PERSONAL_SYNC_FIELDS
        )

        for field in fields_to_check:
            new_val = getattr(instance, field, '') or ''
            old_val = getattr(user, field, '') or ''
            if new_val != old_val:
                updates[field] = new_val or None  # '' → None para User

        if updates:
            User.objects.filter(pk=user.pk).update(**updates)
            logger.debug(
                'InfoPersonal sincronizada -> User %s: %s',
                user.pk, list(updates.keys()),
            )
    except Exception as exc:
        logger.error(
            'Error sync InfoPersonal %s -> User %s: %s',
            instance.pk, user.pk, exc,
        )


# ==============================================================================
# C1 — SYNC bidireccional: User.cargo → Colaborador.cargo
# ==============================================================================

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def sync_user_cargo_to_colaborador(sender, instance, **kwargs):
    """C1: Sincronizar User.cargo → Colaborador.cargo (bidireccional).

    Necesario porque el admin puede cambiar cargo desde el panel de usuarios.
    Solo actúa cuando update_fields incluye 'cargo'.
    Usa flag _syncing_cargo_from_user para evitar loop infinito con
    sync_colaborador_cargo_to_user.
    """
    update_fields = kwargs.get('update_fields')
    if not update_fields or 'cargo' not in update_fields:
        return

    from .models import Colaborador
    try:
        colaborador = Colaborador.objects.get(usuario=instance)
    except Colaborador.DoesNotExist:
        return

    try:
        if colaborador.cargo_id != instance.cargo_id:
            # Flag anti-loop: sync_colaborador_cargo_to_user la revisa
            colaborador._syncing_cargo_from_user = True
            Colaborador.objects.filter(pk=colaborador.pk).update(
                cargo=instance.cargo_id,
            )
            logger.debug(
                'Cargo sincronizado User %s -> Colaborador %s',
                instance.pk, colaborador.pk,
            )
    except Exception as exc:
        logger.error(
            'Error sync cargo User %s -> Colaborador %s: %s',
            instance.pk, colaborador.pk, exc,
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
