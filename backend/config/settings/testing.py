"""
StrateKaz - Testing Settings

Para ejecutar tests.
Uso: DJANGO_SETTINGS_MODULE=config.settings.testing
"""

from .base import *

# =============================================================================
# SECURITY - Testing defaults
# =============================================================================
SECRET_KEY = config('SECRET_KEY', default='django-insecure-testing-only-key-NOT-FOR-PRODUCTION')
DEBUG = False

# =============================================================================
# DATABASE - Lee de env vars (CI con PostgreSQL), fallback a SQLite (local)
# =============================================================================
_db_engine = config('DB_ENGINE', default='django.db.backends.sqlite3')

if 'postgresql' in _db_engine:
    # CI / multi-tenant tests: PostgreSQL con django-tenants
    DATABASES = {
        'default': {
            'ENGINE': _db_engine,
            'NAME': config('DB_NAME', default='stratekaz_test'),
            'USER': config('DB_USER', default='test_user'),
            'PASSWORD': config('DB_PASSWORD', default='test_password'),
            'HOST': config('DB_HOST', default='127.0.0.1'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }
else:
    # Local: SQLite en memoria para tests rapidos
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }

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
