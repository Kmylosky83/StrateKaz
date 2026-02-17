"""
Funciones de cache con aislamiento por tenant.

Prefija todas las claves de cache con el schema_name del tenant actual,
garantizando que los datos cacheados no se filtren entre tenants.
"""


def make_tenant_cache_key(key, key_prefix, version):
    """
    Genera una clave de cache con prefijo de tenant para aislamiento multi-tenant.

    Patron de clave: {schema_name}:{key_prefix}:{version}:{key}

    - schema_name: Schema del tenant activo (ej: 'tenant_acme'), obtenido de
      django.db.connection.schema_name. Usa 'public' como fallback.
    - key_prefix: Prefijo configurado en CACHES['KEY_PREFIX'] (puede estar vacio).
    - version: Version de la clave de cache.
    - key: La clave original solicitada por el codigo.

    Compatible con django_redis y el framework de cache de Django.
    """
    from django.db import connection

    tenant_prefix = getattr(connection, 'schema_name', 'public') or 'public'
    return f'{tenant_prefix}:{key_prefix}:{version}:{key}'
