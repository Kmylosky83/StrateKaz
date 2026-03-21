"""
Signals para Propagación Automática de Permisos RBAC - StrateKaz v4.1

Implementa la propagación automática de permisos cuando:
1. Se crea una nueva TabSection → Crear CargoSectionAccess para cargos activos
2. Se elimina una TabSection → Limpiar CargoSectionAccess huérfanos
3. Se crea un nuevo Cargo → Opcionalmente heredar permisos de plantilla
4. Se modifica CargoSectionAccess → Invalidar cache y registrar auditoría

Mejores prácticas implementadas:
- Configuración flexible por nivel jerárquico
- Transacciones atómicas
- Logging comprehensivo
- Invalidación de cache
- Registro de auditoría
"""
from django.db.models.signals import post_save, pre_delete, post_delete
from django.dispatch import receiver
from django.db import transaction
from django.conf import settings
import logging

logger = logging.getLogger('rbac')


class PermissionPropagationConfig:
    """
    Configuración de propagación de permisos por defecto.

    Define qué permisos se asignan automáticamente cuando se crea
    una nueva sección, basándose en el nivel jerárquico del cargo.

    Puede personalizarse en settings.py:
        RBAC_DEFAULT_PERMISSIONS = {
            'ESTRATEGICO': {'can_view': True, ...},
            ...
        }
    """

    # Permisos por defecto según nivel jerárquico del cargo
    DEFAULT_PERMISSIONS_BY_LEVEL = getattr(settings, 'RBAC_DEFAULT_PERMISSIONS', {
        'ESTRATEGICO': {
            'can_view': True,
            'can_create': True,
            'can_edit': True,
            'can_delete': True
        },
        'TACTICO': {
            'can_view': True,
            'can_create': True,
            'can_edit': True,
            'can_delete': False
        },
        'OPERATIVO': {
            'can_view': True,
            'can_create': False,
            'can_edit': False,
            'can_delete': False
        },
        'APOYO': {
            'can_view': True,
            'can_create': False,
            'can_edit': False,
            'can_delete': False
        },
        'EXTERNO': {
            'can_view': False,
            'can_create': False,
            'can_edit': False,
            'can_delete': False
        },
    })

    # Flag global para habilitar/deshabilitar propagación automática
    PROPAGATION_ENABLED = getattr(settings, 'RBAC_AUTO_PROPAGATION', True)

    # Flag para habilitar auditoría automática
    AUDIT_ENABLED = getattr(settings, 'RBAC_AUDIT_ENABLED', True)

    # Flag para habilitar cache
    CACHE_ENABLED = getattr(settings, 'RBAC_CACHE_ENABLED', True)

    @classmethod
    def get_default_permissions(cls, nivel_jerarquico: str) -> dict:
        """
        Obtiene los permisos por defecto para un nivel jerárquico.

        Args:
            nivel_jerarquico: ESTRATEGICO, TACTICO, OPERATIVO, APOYO, EXTERNO

        Returns:
            dict con can_view, can_create, can_edit, can_delete
        """
        return cls.DEFAULT_PERMISSIONS_BY_LEVEL.get(
            nivel_jerarquico,
            {'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False}
        )

    @classmethod
    def should_create_access(cls, defaults: dict) -> bool:
        """
        Determina si se debe crear un CargoSectionAccess basado en permisos.

        Solo se crea si tiene al menos can_view=True.
        """
        return defaults.get('can_view', False)


# =============================================================================
# SIGNAL: Al crear TabSection → Propagar a cargos existentes
# =============================================================================
@receiver(post_save, sender='core.TabSection')
def propagate_section_to_cargos(sender, instance, created, **kwargs):
    """
    Al crear una nueva TabSection, crear CargoSectionAccess para todos los cargos activos.

    Comportamiento:
    - Solo se ejecuta si created=True (nueva sección)
    - Solo si la sección está habilitada (is_enabled=True)
    - Asigna permisos por defecto según nivel jerárquico del cargo
    - Usa bulk_create con ignore_conflicts para eficiencia
    - Loggea las acciones para auditoría

    Nota: Este signal se puede deshabilitar temporalmente con:
        settings.RBAC_AUTO_PROPAGATION = False
    """
    if not created or not PermissionPropagationConfig.PROPAGATION_ENABLED:
        return

    if not instance.is_enabled:
        logger.debug(f"SECTION_SKIP: '{instance.code}' está deshabilitada, no se propaga")
        return

    # Importar aquí para evitar imports circulares
    from apps.core.models import Cargo, CargoSectionAccess

    cargos_activos = Cargo.objects.filter(is_active=True)
    accesses_to_create = []

    for cargo in cargos_activos:
        # Obtener permisos por defecto según nivel jerárquico
        defaults = PermissionPropagationConfig.get_default_permissions(
            cargo.nivel_jerarquico
        )

        # Solo crear si tiene al menos can_view
        if not PermissionPropagationConfig.should_create_access(defaults):
            continue

        accesses_to_create.append(
            CargoSectionAccess(
                cargo=cargo,
                section=instance,
                can_view=defaults['can_view'],
                can_create=defaults['can_create'],
                can_edit=defaults['can_edit'],
                can_delete=defaults['can_delete'],
                custom_actions={},
            )
        )

    if accesses_to_create:
        with transaction.atomic():
            CargoSectionAccess.objects.bulk_create(
                accesses_to_create,
                ignore_conflicts=True  # Evitar duplicados si ya existe
            )

        logger.info(
            f"SECTION_PROPAGATED: '{instance.code}' (id={instance.id}) "
            f"propagado a {len(accesses_to_create)} cargos"
        )

        # Registrar en auditoría si está habilitado
        if PermissionPropagationConfig.AUDIT_ENABLED:
            _log_propagation(instance, len(accesses_to_create))


# =============================================================================
# SIGNAL: Al eliminar TabSection → Limpiar CargoSectionAccess
# =============================================================================
@receiver(pre_delete, sender='core.TabSection')
def cleanup_section_accesses(sender, instance, **kwargs):
    """
    Al eliminar una TabSection, limpiar todos los CargoSectionAccess asociados.

    Esto evita registros huérfanos en la base de datos.
    """
    from apps.core.models import CargoSectionAccess

    deleted_count = CargoSectionAccess.objects.filter(section=instance).delete()[0]

    if deleted_count > 0:
        logger.info(
            f"SECTION_ACCESSES_CLEANED: {deleted_count} accesos eliminados "
            f"para sección '{instance.code}' (id={instance.id})"
        )


# =============================================================================
# SIGNAL: Al crear Cargo → Opcionalmente heredar permisos
# =============================================================================
@receiver(post_save, sender='core.Cargo')
def initialize_cargo_permissions(sender, instance, created, **kwargs):
    """
    Al crear un nuevo Cargo, opcionalmente copiar permisos de una plantilla.

    El cargo puede especificar una plantilla de permisos mediante:
    - instance._permission_template_id: ID de un cargo a copiar
    - instance._permission_template_code: Código de PermissionTemplate a aplicar

    Si no se especifica ninguna plantilla, se crean accesos por defecto
    basados en el nivel jerárquico del cargo.
    """
    if not created or not PermissionPropagationConfig.PROPAGATION_ENABLED:
        return

    # Opción 1: Heredar de otro cargo
    template_cargo_id = getattr(instance, '_permission_template_id', None)
    if template_cargo_id:
        _inherit_from_cargo(instance, template_cargo_id)
        return

    # Opción 2: Aplicar plantilla de permisos
    template_code = getattr(instance, '_permission_template_code', None)
    if template_code:
        _apply_permission_template(instance, template_code)
        return

    # Opción 3: Crear accesos por defecto para todas las secciones habilitadas
    auto_create_default = getattr(settings, 'RBAC_AUTO_CREATE_DEFAULT_ACCESS', True)
    if auto_create_default:
        _create_default_accesses(instance)


# =============================================================================
# SIGNAL: Al modificar CargoSectionAccess → Invalidar cache
# =============================================================================
@receiver(post_save, sender='core.CargoSectionAccess')
def invalidate_cache_on_access_change(sender, instance, created, **kwargs):
    """
    Al crear o modificar un CargoSectionAccess, invalidar el cache del cargo.
    """
    if not PermissionPropagationConfig.CACHE_ENABLED:
        return

    try:
        from apps.core.services.permission_cache import PermissionCacheService
        PermissionCacheService.invalidate_cargo(instance.cargo_id)
    except ImportError:
        pass  # Cache service no disponible aún


@receiver(post_delete, sender='core.CargoSectionAccess')
def invalidate_cache_on_access_delete(sender, instance, **kwargs):
    """
    Al eliminar un CargoSectionAccess, invalidar el cache del cargo.
    """
    if not PermissionPropagationConfig.CACHE_ENABLED:
        return

    try:
        from apps.core.services.permission_cache import PermissionCacheService
        PermissionCacheService.invalidate_cargo(instance.cargo_id)
    except ImportError:
        pass  # Cache service no disponible aún


# =============================================================================
# FUNCIONES AUXILIARES
# =============================================================================
def _inherit_from_cargo(new_cargo, template_cargo_id: int):
    """
    Copia CargoSectionAccess de un cargo existente a uno nuevo.
    """
    from apps.core.models import Cargo, CargoSectionAccess

    try:
        template_cargo = Cargo.objects.get(id=template_cargo_id, is_active=True)
    except Cargo.DoesNotExist:
        logger.warning(
            f"CARGO_TEMPLATE_NOT_FOUND: No se encontró cargo template id={template_cargo_id}"
        )
        return

    template_accesses = CargoSectionAccess.objects.filter(cargo=template_cargo)
    new_accesses = []

    for access in template_accesses:
        new_accesses.append(
            CargoSectionAccess(
                cargo=new_cargo,
                section=access.section,
                can_view=access.can_view,
                can_create=access.can_create,
                can_edit=access.can_edit,
                can_delete=access.can_delete,
                custom_actions=access.custom_actions.copy() if access.custom_actions else {},
            )
        )

    if new_accesses:
        with transaction.atomic():
            CargoSectionAccess.objects.bulk_create(new_accesses, ignore_conflicts=True)

        logger.info(
            f"CARGO_PERMISSIONS_INHERITED: '{new_cargo.code}' heredó "
            f"{len(new_accesses)} permisos de '{template_cargo.code}'"
        )


def _apply_permission_template(cargo, template_code: str):
    """
    Aplica una PermissionTemplate a un cargo.
    """
    from apps.core.models.models_permission_templates import PermissionTemplate

    try:
        template = PermissionTemplate.objects.get(code=template_code, is_active=True)
        created, updated, skipped = template.apply_to_cargo(cargo, replace=True)

        logger.info(
            f"CARGO_TEMPLATE_APPLIED: '{template_code}' aplicado a '{cargo.code}' "
            f"(created={created}, updated={updated}, skipped={skipped})"
        )
    except PermissionTemplate.DoesNotExist:
        logger.warning(
            f"PERMISSION_TEMPLATE_NOT_FOUND: No se encontró plantilla '{template_code}'"
        )


def _create_default_accesses(cargo):
    """
    Crea CargoSectionAccess por defecto para todas las secciones habilitadas.
    """
    from apps.core.models import TabSection, CargoSectionAccess

    sections = TabSection.objects.filter(is_enabled=True)
    defaults = PermissionPropagationConfig.get_default_permissions(
        cargo.nivel_jerarquico
    )

    # Solo crear si tiene al menos can_view
    if not PermissionPropagationConfig.should_create_access(defaults):
        return

    accesses = [
        CargoSectionAccess(
            cargo=cargo,
            section=section,
            can_view=defaults['can_view'],
            can_create=defaults['can_create'],
            can_edit=defaults['can_edit'],
            can_delete=defaults['can_delete'],
            custom_actions={},
        )
        for section in sections
    ]

    if accesses:
        with transaction.atomic():
            CargoSectionAccess.objects.bulk_create(accesses, ignore_conflicts=True)

        logger.info(
            f"CARGO_DEFAULT_ACCESS_CREATED: '{cargo.code}' recibió "
            f"{len(accesses)} accesos por defecto (nivel={cargo.nivel_jerarquico})"
        )


def _log_propagation(section, count: int):
    """
    Registra la propagación en el historial de cambios.

    IMPORTANTE: Usa savepoint (transaction.atomic) para que un error aquí
    NO contamine la transacción padre (post_save de TabSection).
    Sin savepoint, PostgreSQL marca la transacción como 'aborted' y
    el get_or_create padre hace rollback silencioso.
    """
    try:
        from django.contrib.contenttypes.models import ContentType
        from apps.core.models.models_permission_history import PermissionChangeLog

        ct = ContentType.objects.get_for_model(section)

        with transaction.atomic():
            PermissionChangeLog.objects.create(
                changed_by=None,
                content_type=ct,
                object_id=section.id,
                action='PROPAGATED',
                affected_entity_type='section',
                affected_entity_id=section.id,
                affected_entity_name=section.name,
                new_value={'cargos_affected': count},
                is_automatic=True,
                notes=f'Propagación automática al crear sección "{section.code}"',
            )
    except Exception as e:
        logger.error(f"ERROR_LOGGING_PROPAGATION: {e}")


# =============================================================================
# SIGNAL: Al modificar Cargo → Propagar nivel_firma a usuarios
# =============================================================================
@receiver(post_save, sender='core.Cargo')
def propagate_nivel_firma_on_cargo_change(sender, instance, created, **kwargs):
    """
    Cuando se modifica nivel_jerarquico de un Cargo, propaga nivel_firma
    a todos los usuarios con ese cargo (que no tengan nivel_firma_manual=True).

    Solo se ejecuta en actualización (no creación — los usuarios aún no existen).
    """
    if created:
        return

    from django.contrib.auth import get_user_model
    User = get_user_model()

    # Mapeo nivel_jerarquico → nivel_firma
    NIVEL_MAP = {
        'ESTRATEGICO': 3,
        'TACTICO': 2,
        'OPERATIVO': 1,
        'APOYO': 1,
        'EXTERNO': 1,
    }

    expected_nivel = NIVEL_MAP.get(instance.nivel_jerarquico, 1)

    updated = User.objects.filter(
        cargo=instance,
        nivel_firma_manual=False,
        is_active=True,
        deleted_at__isnull=True,
    ).exclude(
        nivel_firma=expected_nivel
    ).update(nivel_firma=expected_nivel)

    if updated:
        logger.info(
            "CARGO_NIVEL_FIRMA_PROPAGATED: Cargo '%s' (%s) → %d usuarios "
            "actualizados a nivel_firma=%d",
            instance.code, instance.nivel_jerarquico, updated, expected_nivel
        )
