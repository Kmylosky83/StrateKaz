"""
Utilidades de Caché - Core
Sistema de Gestión StrateKaz

Funciones helper para gestionar el caché Redis de forma eficiente.
Incluye decoradores y funciones para cachear queries, serializers y listas.

Autor: Sistema de Gestión
Fecha: 2025-12-30
"""
from django.core.cache import cache
from django.conf import settings
from functools import wraps
import hashlib
import json
from typing import Any, Callable, Optional


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """
    Genera una clave de caché única basada en prefijo y argumentos.

    Args:
        prefix: Prefijo para la clave (ej: 'catalogo_tipos_cliente')
        *args: Argumentos posicionales para incluir en la clave
        **kwargs: Argumentos con nombre para incluir en la clave

    Returns:
        Clave de caché única

    Ejemplo:
        >>> generate_cache_key('cliente', empresa_id=1, is_active=True)
        'grasas_huesos:cliente:empresa_1:active_true'
    """
    key_parts = [settings.CACHES['default']['KEY_PREFIX'], prefix]

    # Agregar args
    for arg in args:
        if arg is not None:
            key_parts.append(str(arg))

    # Agregar kwargs (ordenados para consistencia)
    for k, v in sorted(kwargs.items()):
        if v is not None:
            key_parts.append(f"{k}_{v}")

    # Generar hash si la clave es muy larga
    key = ':'.join(key_parts)
    if len(key) > 250:  # Límite de Redis
        key_hash = hashlib.md5(key.encode()).hexdigest()
        key = f"{settings.CACHES['default']['KEY_PREFIX']}:{prefix}:hash_{key_hash}"

    return key


def cache_queryset(prefix: str, timeout: int = 300):
    """
    Decorador para cachear resultados de QuerySets.

    Args:
        prefix: Prefijo para la clave de caché
        timeout: Tiempo de expiración en segundos (default: 5 minutos)

    Ejemplo:
        @cache_queryset('tipos_cliente', timeout=3600)
        def get_tipos_cliente_activos(empresa_id):
            return TipoCliente.objects.filter(empresa_id=empresa_id, is_active=True)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generar clave de caché
            cache_key = generate_cache_key(prefix, *args, **kwargs)

            # Intentar obtener del caché
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Ejecutar función y cachear resultado
            result = func(*args, **kwargs)

            # Convertir QuerySet a lista para serialización
            if hasattr(result, 'model'):
                result_to_cache = list(result)
            else:
                result_to_cache = result

            cache.set(cache_key, result_to_cache, timeout)
            return result

        return wrapper
    return decorator


def cache_serializer_data(prefix: str, timeout: int = 300):
    """
    Decorador para cachear datos serializados (listas de diccionarios).

    Args:
        prefix: Prefijo para la clave de caché
        timeout: Tiempo de expiración en segundos (default: 5 minutos)

    Ejemplo:
        @cache_serializer_data('estados_pedido', timeout=7200)
        def get_estados_pedido_dict():
            estados = EstadoPedido.objects.filter(activo=True)
            return EstadoPedidoSerializer(estados, many=True).data
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = generate_cache_key(prefix, *args, **kwargs)

            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result

        return wrapper
    return decorator


def invalidate_cache(prefix: str, *args, **kwargs) -> bool:
    """
    Invalida una entrada específica del caché.

    Args:
        prefix: Prefijo de la clave de caché
        *args: Argumentos posicionales usados al generar la clave
        **kwargs: Argumentos con nombre usados al generar la clave

    Returns:
        True si se eliminó, False si no existía

    Ejemplo:
        >>> invalidate_cache('cliente', empresa_id=1, is_active=True)
        True
    """
    cache_key = generate_cache_key(prefix, *args, **kwargs)
    return cache.delete(cache_key)


def invalidate_cache_pattern(pattern: str) -> int:
    """
    Invalida todas las claves de caché que coincidan con un patrón.

    NOTA: Esta función requiere django-redis. Si no está instalado,
    solo invalida el caché completo.

    Args:
        pattern: Patrón para buscar claves (ej: 'grasas_huesos:cliente:*')

    Returns:
        Número de claves eliminadas

    Ejemplo:
        >>> invalidate_cache_pattern('grasas_huesos:cliente:empresa_1:*')
        5
    """
    try:
        from django_redis import get_redis_connection
        redis_conn = get_redis_connection('default')

        # Buscar claves que coincidan
        keys = redis_conn.keys(pattern)

        if keys:
            return redis_conn.delete(*keys)
        return 0

    except ImportError:
        # Si no está django-redis, limpiar todo el caché
        cache.clear()
        return -1  # Indicar que se limpió todo


def get_or_set_cache(key: str, callable_func: Callable, timeout: int = 300) -> Any:
    """
    Obtiene un valor del caché o lo calcula y almacena si no existe.

    Args:
        key: Clave de caché
        callable_func: Función a ejecutar si no hay caché
        timeout: Tiempo de expiración en segundos

    Returns:
        Valor cacheado o calculado

    Ejemplo:
        >>> def get_clientes_activos():
        ...     return Cliente.objects.filter(is_active=True).count()
        >>> count = get_or_set_cache('clientes_activos_count', get_clientes_activos, 600)
    """
    cached_value = cache.get(key)

    if cached_value is not None:
        return cached_value

    value = callable_func()
    cache.set(key, value, timeout)
    return value


# =================== DECORADORES ESPECÍFICOS PARA EL PROYECTO ===================

def cache_catalogo(catalog_name: str, timeout: int = 7200):
    """
    Decorador específico para cachear catálogos del sistema.
    Catálogos tienen timeout largo (2 horas default) porque cambian poco.

    Args:
        catalog_name: Nombre del catálogo (ej: 'tipo_cliente', 'estado_pedido')
        timeout: Tiempo de expiración en segundos (default: 2 horas)

    Ejemplo:
        @cache_catalogo('tipos_cliente', timeout=3600)
        def get_tipos_cliente():
            return TipoCliente.objects.filter(activo=True)
    """
    return cache_queryset(f'catalogo:{catalog_name}', timeout=timeout)


def cache_empresa_data(empresa_id: int, data_type: str, timeout: int = 600):
    """
    Cachea datos específicos de una empresa.

    Args:
        empresa_id: ID de la empresa
        data_type: Tipo de datos (ej: 'clientes', 'pedidos')
        timeout: Tiempo de expiración en segundos (default: 10 minutos)

    Ejemplo:
        >>> cache_empresa_data(1, 'clientes_activos', timeout=300)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = generate_cache_key(f'empresa_{empresa_id}', data_type, *args, **kwargs)

            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result

        return wrapper
    return decorator


def invalidate_empresa_cache(empresa_id: int, data_type: Optional[str] = None):
    """
    Invalida el caché de una empresa específica.

    Args:
        empresa_id: ID de la empresa
        data_type: Tipo de datos específico a invalidar (opcional)

    Ejemplo:
        >>> invalidate_empresa_cache(1)  # Invalida todo el caché de empresa 1
        >>> invalidate_empresa_cache(1, 'clientes')  # Solo invalida clientes
    """
    if data_type:
        pattern = f"grasas_huesos:empresa_{empresa_id}:{data_type}:*"
    else:
        pattern = f"grasas_huesos:empresa_{empresa_id}:*"

    return invalidate_cache_pattern(pattern)


# =================== FUNCIONES HELPER PARA VIEWSETS ===================

def cache_list_view(viewset_name: str, timeout: int = 300):
    """
    Decorador para cachear la acción 'list' de un ViewSet.

    Args:
        viewset_name: Nombre del ViewSet
        timeout: Tiempo de expiración en segundos

    Ejemplo (en un ViewSet):
        @cache_list_view('cliente_viewset', timeout=600)
        def list(self, request, *args, **kwargs):
            return super().list(request, *args, **kwargs)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            # Generar clave basada en query params
            query_params = dict(request.query_params)
            empresa_id = getattr(request.user, 'empresa_id', None)

            cache_key = generate_cache_key(
                f'viewset:{viewset_name}:list',
                empresa_id=empresa_id,
                **query_params
            )

            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            result = func(self, request, *args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result

        return wrapper
    return decorator


__all__ = [
    'generate_cache_key',
    'cache_queryset',
    'cache_serializer_data',
    'invalidate_cache',
    'invalidate_cache_pattern',
    'get_or_set_cache',
    'cache_catalogo',
    'cache_empresa_data',
    'invalidate_empresa_cache',
    'cache_list_view',
]
