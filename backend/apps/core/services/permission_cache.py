"""
Servicio de Cache de Permisos - RBAC StrateKaz v4.1

Implementa cache para permisos de usuarios, reduciendo queries a BD
en cada request de verificación de permisos.

Características:
- Cache en Django cache framework (soporta Redis, Memcached, memoria)
- TTL configurable (por defecto 5 minutos)
- Invalidación selectiva por usuario/cargo/sección
- Fallback graceful si el cache no está disponible

Uso:
    # Obtener permisos cacheados
    cached = PermissionCacheService.get_user_section_access(user_id)

    # Invalidar cuando cambian permisos
    PermissionCacheService.invalidate_cargo(cargo_id)
"""
from django.core.cache import cache
from django.conf import settings
from typing import Dict, Optional, Set
import json
import logging

logger = logging.getLogger('rbac')


class PermissionCacheService:
    """
    Servicio de cache para permisos de usuario.

    Estructura de cache:
    - rbac:user_perms:{user_id} → Set de códigos de permisos
    - rbac:user_sections:{user_id} → Dict de section_id → {can_view, can_create, ...}
    - rbac:cargo_sections:{cargo_id} → Dict de section_id → permisos

    Configuración en settings.py:
        RBAC_CACHE_TTL = 300  # 5 minutos
        RBAC_CACHE_ENABLED = True
    """

    CACHE_PREFIX = 'rbac'
    DEFAULT_TTL = getattr(settings, 'RBAC_CACHE_TTL', 300)  # 5 minutos
    CACHE_ENABLED = getattr(settings, 'RBAC_CACHE_ENABLED', True)

    # ==========================================================================
    # HELPERS DE CLAVES
    # ==========================================================================
    @classmethod
    def _key(cls, key_type: str, identifier: int | str) -> str:
        """Genera clave de cache con prefijo."""
        return f"{cls.CACHE_PREFIX}:{key_type}:{identifier}"

    @classmethod
    def _is_enabled(cls) -> bool:
        """Verifica si el cache está habilitado."""
        return cls.CACHE_ENABLED

    # ==========================================================================
    # PERMISOS DE USUARIO (códigos de permisos legacy)
    # ==========================================================================
    @classmethod
    def get_user_permissions(cls, user_id: int) -> Optional[Set[str]]:
        """
        Obtiene códigos de permisos cacheados de un usuario.

        Args:
            user_id: ID del usuario

        Returns:
            Set de códigos de permisos o None si no está en cache
        """
        if not cls._is_enabled():
            return None

        try:
            key = cls._key('user_perms', user_id)
            cached = cache.get(key)

            if cached is not None:
                return set(json.loads(cached))

            return None
        except Exception as e:
            logger.warning(f"CACHE_GET_ERROR: user_perms:{user_id} - {e}")
            return None

    @classmethod
    def set_user_permissions(cls, user_id: int, permissions: Set[str], ttl: int = None) -> None:
        """
        Cachea códigos de permisos de un usuario.

        Args:
            user_id: ID del usuario
            permissions: Set de códigos de permisos
            ttl: Time-to-live en segundos (opcional)
        """
        if not cls._is_enabled():
            return

        try:
            key = cls._key('user_perms', user_id)
            cache.set(key, json.dumps(list(permissions)), ttl or cls.DEFAULT_TTL)
        except Exception as e:
            logger.warning(f"CACHE_SET_ERROR: user_perms:{user_id} - {e}")

    # ==========================================================================
    # ACCESO A SECCIONES DE USUARIO
    # ==========================================================================
    @classmethod
    def get_user_section_access(cls, user_id: int) -> Optional[Dict]:
        """
        Obtiene accesos a secciones cacheados de un usuario.

        Args:
            user_id: ID del usuario

        Returns:
            Dict de section_id → {section_code, can_view, can_create, can_edit, can_delete, custom_actions}
            o None si no está en cache
        """
        if not cls._is_enabled():
            return None

        try:
            key = cls._key('user_sections', user_id)
            cached = cache.get(key)

            if cached is not None:
                return json.loads(cached)

            return None
        except Exception as e:
            logger.warning(f"CACHE_GET_ERROR: user_sections:{user_id} - {e}")
            return None

    @classmethod
    def set_user_section_access(cls, user_id: int, accesses: Dict, ttl: int = None) -> None:
        """
        Cachea accesos a secciones de un usuario.

        Args:
            user_id: ID del usuario
            accesses: Dict de section_id → permisos
            ttl: Time-to-live en segundos (opcional)
        """
        if not cls._is_enabled():
            return

        try:
            key = cls._key('user_sections', user_id)
            cache.set(key, json.dumps(accesses), ttl or cls.DEFAULT_TTL)
        except Exception as e:
            logger.warning(f"CACHE_SET_ERROR: user_sections:{user_id} - {e}")

    # ==========================================================================
    # ACCESO A SECCIONES DE CARGO
    # ==========================================================================
    @classmethod
    def get_cargo_section_access(cls, cargo_id: int) -> Optional[Dict]:
        """
        Obtiene accesos a secciones cacheados de un cargo.

        Args:
            cargo_id: ID del cargo

        Returns:
            Dict de section_id → permisos o None si no está en cache
        """
        if not cls._is_enabled():
            return None

        try:
            key = cls._key('cargo_sections', cargo_id)
            cached = cache.get(key)

            if cached is not None:
                return json.loads(cached)

            return None
        except Exception as e:
            logger.warning(f"CACHE_GET_ERROR: cargo_sections:{cargo_id} - {e}")
            return None

    @classmethod
    def set_cargo_section_access(cls, cargo_id: int, accesses: Dict, ttl: int = None) -> None:
        """
        Cachea accesos a secciones de un cargo.

        Args:
            cargo_id: ID del cargo
            accesses: Dict de section_id → permisos
            ttl: Time-to-live en segundos (opcional)
        """
        if not cls._is_enabled():
            return

        try:
            key = cls._key('cargo_sections', cargo_id)
            cache.set(key, json.dumps(accesses), ttl or cls.DEFAULT_TTL)
        except Exception as e:
            logger.warning(f"CACHE_SET_ERROR: cargo_sections:{cargo_id} - {e}")

    # ==========================================================================
    # INVALIDACIÓN DE CACHE
    # ==========================================================================
    @classmethod
    def invalidate_user(cls, user_id: int) -> None:
        """
        Invalida todo el cache de un usuario.

        Args:
            user_id: ID del usuario
        """
        if not cls._is_enabled():
            return

        try:
            keys = [
                cls._key('user_perms', user_id),
                cls._key('user_sections', user_id),
            ]
            cache.delete_many(keys)
            logger.debug(f"CACHE_INVALIDATED: user {user_id}")
        except Exception as e:
            logger.warning(f"CACHE_INVALIDATE_ERROR: user:{user_id} - {e}")

    @classmethod
    def invalidate_cargo(cls, cargo_id: int) -> None:
        """
        Invalida cache de un cargo y sus usuarios asociados.

        Args:
            cargo_id: ID del cargo

        Nota: También invalida el cache de todos los usuarios
        que tienen asignado este cargo.
        """
        if not cls._is_enabled():
            return

        try:
            # Importar aquí para evitar imports circulares
            from apps.core.models import User

            # Invalidar cache del cargo
            cache.delete(cls._key('cargo_sections', cargo_id))

            # Invalidar cache de usuarios con este cargo
            user_ids = User.objects.filter(
                cargo_id=cargo_id,
                is_active=True,
                deleted_at__isnull=True
            ).values_list('id', flat=True)

            for user_id in user_ids:
                cls.invalidate_user(user_id)

            logger.debug(f"CACHE_INVALIDATED: cargo {cargo_id} y {len(user_ids)} usuarios")
        except Exception as e:
            logger.warning(f"CACHE_INVALIDATE_ERROR: cargo:{cargo_id} - {e}")

    @classmethod
    def invalidate_section(cls, section_id: int) -> None:
        """
        Invalida cache de todos los cargos que tienen acceso a una sección.

        Args:
            section_id: ID de la sección

        Nota: Esta es una operación costosa. Usar con moderación.
        """
        if not cls._is_enabled():
            return

        try:
            from apps.core.models import CargoSectionAccess

            cargo_ids = CargoSectionAccess.objects.filter(
                section_id=section_id
            ).values_list('cargo_id', flat=True).distinct()

            for cargo_id in cargo_ids:
                cls.invalidate_cargo(cargo_id)

            logger.info(f"CACHE_INVALIDATED: section {section_id} afectó {len(cargo_ids)} cargos")
        except Exception as e:
            logger.warning(f"CACHE_INVALIDATE_ERROR: section:{section_id} - {e}")

    @classmethod
    def invalidate_all(cls) -> None:
        """
        Invalida todo el cache de permisos RBAC.

        ADVERTENCIA: Usa con precaución. Esto puede afectar el rendimiento
        temporalmente mientras se regenera el cache.

        Casos de uso:
        - Migración masiva de permisos
        - Cambio en la estructura de secciones
        - Debugging
        """
        if not cls._is_enabled():
            return

        try:
            # Patrón para encontrar todas las claves RBAC
            # Nota: delete_pattern no está disponible en todos los backends
            # Usamos una aproximación segura

            # Intentar usar delete_pattern si está disponible (Redis)
            if hasattr(cache, 'delete_pattern'):
                cache.delete_pattern(f'{cls.CACHE_PREFIX}:*')
            else:
                # Fallback: invalidar manualmente si tenemos acceso a las claves
                logger.warning("CACHE_INVALIDATE_ALL: Backend no soporta delete_pattern")

            logger.warning("CACHE_INVALIDATED: all RBAC cache cleared")
        except Exception as e:
            logger.error(f"CACHE_INVALIDATION_FAILED: {e}")

    # ==========================================================================
    # UTILIDADES
    # ==========================================================================
    @classmethod
    def warm_cache_for_user(cls, user) -> Dict:
        """
        Pre-carga el cache de permisos para un usuario.

        Útil para llamar después del login para mejorar la experiencia.

        Args:
            user: Instancia de User

        Returns:
            Dict con los accesos cacheados
        """
        if not cls._is_enabled():
            return {}

        try:
            from apps.core.services.permission_service import CombinedPermissionService

            # Cargar y cachear accesos
            accesses = CombinedPermissionService.get_all_section_permissions(user)

            logger.debug(f"CACHE_WARMED: user {user.id} con {len(accesses)} secciones")
            return accesses
        except Exception as e:
            logger.warning(f"CACHE_WARM_ERROR: user:{user.id} - {e}")
            return {}

    @classmethod
    def get_cache_stats(cls) -> Dict:
        """
        Obtiene estadísticas del cache (si el backend las soporta).

        Returns:
            Dict con estadísticas o vacío si no está soportado
        """
        try:
            if hasattr(cache, 'get_stats'):
                return cache.get_stats()
            return {'message': 'Stats not supported by cache backend'}
        except Exception:
            return {'message': 'Error getting cache stats'}
