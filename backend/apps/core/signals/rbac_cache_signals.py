"""
Signals para Invalidación Automática de Cache RBAC - StrateKaz v4.1

Invalida la cache de permisos cuando cambian las fuentes de permisos:
1. User.cargo cambia → invalidar cache del user
2. CargoSectionAccess cambia → invalidar users con ese cargo
3. UserRolAdicional asignado/revocado → invalidar cache del user
4. UserGroup asignado/revocado → invalidar cache del user
5. RolAdicionalSectionAccess cambia → invalidar users con ese rol (si existe)
6. GroupSectionAccess cambia → invalidar users en ese group

NOTA: CargoSectionAccess save/delete ya se invalida en rbac_signals.py
(invalidate_cache_on_access_change / invalidate_cache_on_access_delete).
Aquí se cubren las fuentes restantes que NO estaban cubiertas.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import logging

logger = logging.getLogger('rbac')


# =============================================================================
# Signal 1: User.cargo cambia → invalidar cache del user
# =============================================================================
@receiver(post_save, sender='core.User')
def invalidate_cache_on_user_cargo_change(sender, instance, **kwargs):
    """
    Cuando se modifica el cargo de un usuario, invalidar su cache de permisos.

    Solo se ejecuta si update_fields incluye 'cargo' o 'cargo_id',
    o si update_fields no se especificó (save completo).
    """
    update_fields = kwargs.get('update_fields')

    # If update_fields is specified and cargo is not in it, skip
    if update_fields is not None:
        cargo_fields = {'cargo', 'cargo_id'}
        if not cargo_fields.intersection(set(update_fields)):
            return

    try:
        from apps.core.services.permission_cache import PermissionCacheService
        PermissionCacheService.invalidate_user(instance.id)
        logger.debug(
            "CACHE_INVALIDATED: user %d (cargo change)", instance.id
        )
    except Exception as e:
        logger.warning(
            "CACHE_INVALIDATE_ERROR: user %d cargo change - %s",
            instance.id, e
        )


# =============================================================================
# Signal 2: UserRolAdicional asignado/revocado → invalidar cache del user
# =============================================================================
@receiver(post_save, sender='core.UserRolAdicional')
@receiver(post_delete, sender='core.UserRolAdicional')
def invalidate_cache_on_rol_adicional_change(sender, instance, **kwargs):
    """
    Cuando se asigna o revoca un RolAdicional a un user, invalidar su cache.
    """
    try:
        from apps.core.services.permission_cache import PermissionCacheService
        PermissionCacheService.invalidate_user(instance.user_id)
        logger.debug(
            "CACHE_INVALIDATED: user %d (rol adicional change)",
            instance.user_id
        )
    except Exception as e:
        logger.warning(
            "CACHE_INVALIDATE_ERROR: user %d rol adicional - %s",
            instance.user_id, e
        )


# =============================================================================
# Signal 3: UserGroup asignado/revocado → invalidar cache del user
# =============================================================================
@receiver(post_save, sender='core.UserGroup')
@receiver(post_delete, sender='core.UserGroup')
def invalidate_cache_on_user_group_change(sender, instance, **kwargs):
    """
    Cuando se asigna o revoca un Group a un user, invalidar su cache.
    """
    try:
        from apps.core.services.permission_cache import PermissionCacheService
        PermissionCacheService.invalidate_user(instance.user_id)
        logger.debug(
            "CACHE_INVALIDATED: user %d (group change)", instance.user_id
        )
    except Exception as e:
        logger.warning(
            "CACHE_INVALIDATE_ERROR: user %d group change - %s",
            instance.user_id, e
        )


# =============================================================================
# Signal 4: GroupSectionAccess cambia → invalidar users en ese group
# =============================================================================
@receiver(post_save, sender='core.GroupSectionAccess')
@receiver(post_delete, sender='core.GroupSectionAccess')
def invalidate_cache_on_group_section_change(sender, instance, **kwargs):
    """
    Cuando cambian los permisos de sección de un grupo, invalidar el cache
    de todos los usuarios miembros de ese grupo.
    """
    try:
        from apps.core.models import UserGroup
        from apps.core.services.permission_cache import PermissionCacheService

        user_ids = list(
            UserGroup.objects.filter(
                group_id=instance.group_id
            ).values_list('user_id', flat=True)
        )

        for uid in user_ids:
            PermissionCacheService.invalidate_user(uid)

        if user_ids:
            logger.debug(
                "CACHE_INVALIDATED: group %d section access change, "
                "%d users affected",
                instance.group_id, len(user_ids)
            )
    except Exception as e:
        logger.warning(
            "CACHE_INVALIDATE_ERROR: group %d section change - %s",
            instance.group_id, e
        )


# =============================================================================
# Signal 5: RolAdicionalSectionAccess cambia → invalidar users con ese rol
# (Solo si el modelo existe — creado por agente H)
# =============================================================================
try:
    from apps.core.models import RolAdicionalSectionAccess  # noqa: F401

    @receiver(post_save, sender='core.RolAdicionalSectionAccess')
    @receiver(post_delete, sender='core.RolAdicionalSectionAccess')
    def invalidate_cache_on_rol_section_change(sender, instance, **kwargs):
        """
        Cuando cambian los permisos de sección de un rol adicional,
        invalidar el cache de todos los usuarios con ese rol.
        """
        try:
            from apps.core.models import UserRolAdicional
            from apps.core.services.permission_cache import (
                PermissionCacheService,
            )

            user_ids = list(
                UserRolAdicional.objects.filter(
                    rol_adicional_id=instance.rol_adicional_id,
                    is_active=True
                ).values_list('user_id', flat=True)
            )

            for uid in user_ids:
                PermissionCacheService.invalidate_user(uid)

            if user_ids:
                logger.debug(
                    "CACHE_INVALIDATED: rol adicional %d section change, "
                    "%d users affected",
                    instance.rol_adicional_id, len(user_ids)
                )
        except Exception as e:
            logger.warning(
                "CACHE_INVALIDATE_ERROR: rol adicional section change - %s",
                e
            )

except ImportError:
    # RolAdicionalSectionAccess does not exist yet — skip signal
    pass
