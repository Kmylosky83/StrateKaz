"""
StrateKaz - Testing Settings

Para ejecutar tests.
Uso: DJANGO_SETTINGS_MODULE=config.settings.testing
"""

from .base import *

# =============================================================================
# DEBUG
# =============================================================================
DEBUG = False

# =============================================================================
# DATABASE - SQLite en memoria para tests rápidos
# =============================================================================
# Nota: Para tests de multi-tenant, usar PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Para tests de multi-tenant, descomentar:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django_tenants.postgresql_backend',
#         'NAME': 'stratekaz_test',
#         'USER': 'stratekaz',
#         'PASSWORD': 'stratekaz_dev_2024',
#         'HOST': 'localhost',
#         'PORT': '5432',
#     }
# }

# =============================================================================
# PASSWORD HASHER - Más rápido para tests
# =============================================================================
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# =============================================================================
# EMAIL
# =============================================================================
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# =============================================================================
# CELERY - Síncrono para tests
# =============================================================================
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# =============================================================================
# CACHE - Local memory para tests
# =============================================================================
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# =============================================================================
# LOGGING - Silenciar en tests
# =============================================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
        'level': 'CRITICAL',
    },
}

# =============================================================================
# DJANGO-TENANTS
# =============================================================================
SHOW_PUBLIC_IF_NO_TENANT_FOUND = True
