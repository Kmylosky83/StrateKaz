"""
StrateKaz - Development Settings

Para desarrollo local con Docker.
Uso: DJANGO_SETTINGS_MODULE=config.settings.development
"""

from .base import *

# =============================================================================
# SECURITY - Development defaults
# =============================================================================
SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-only-key-DO-NOT-USE-IN-PRODUCTION-2026')
DEBUG = True

# =============================================================================
# ALLOWED HOSTS
# =============================================================================
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '*.localhost',
    'backend',  # Docker service name
]

# =============================================================================
# ADDITIONAL APPS FOR DEVELOPMENT
# =============================================================================
INSTALLED_APPS += [
    'django_extensions',
]

# Debug toolbar solo si está instalado
try:
    import debug_toolbar
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
    INTERNAL_IPS = ['127.0.0.1', 'localhost']
except ImportError:
    pass

# =============================================================================
# DATABASE
# =============================================================================
DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': config('DB_NAME', default='stratekaz'),
        'USER': config('DB_USER', default='stratekaz'),
        'PASSWORD': config('DB_PASSWORD', default='stratekaz_dev_2024'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 600,  # 10 min - necesario para tareas Celery largas
    }
}

# =============================================================================
# EMAIL BACKEND (Console for development)
# =============================================================================
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# =============================================================================
# CORS - Restringido a orígenes conocidos
# =============================================================================
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3010',
    'http://127.0.0.1:3010',
    'http://localhost:5173',
]
# Regex para subdominios de tenant en desarrollo (demo.localhost:3010, etc.)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^http://[\w-]+\.localhost:\d+$',
]
CORS_ALLOW_CREDENTIALS = True
# Headers adicionales para multi-tenant
CORS_ALLOW_HEADERS = (
    'accept',
    'authorization',
    'content-type',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-tenant-id',
    'x-impersonated-user-id',
)

# =============================================================================
# LOGGING - Más verbose en desarrollo (solo consola)
# =============================================================================
LOGGING['loggers']['apps']['level'] = 'DEBUG'
LOGGING['loggers']['django.db.backends'] = {
    'handlers': ['console'],
    'level': 'DEBUG' if config('SQL_DEBUG', default=False, cast=bool) else 'WARNING',
    'propagate': False,
}
LOGGING['loggers']['django_tenants'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': False,
}

# =============================================================================
# DJANGO-TENANTS - Configuración desarrollo
# =============================================================================
# En desarrollo, permitir acceso sin tenant para pruebas
SHOW_PUBLIC_IF_NO_TENANT_FOUND = True

# =============================================================================
# CELERY - Síncrono en desarrollo (opcional)
# =============================================================================
# Descomentar para ejecutar tareas síncronamente sin worker
# CELERY_TASK_ALWAYS_EAGER = True
# CELERY_TASK_EAGER_PROPAGATES = True

print("=" * 60)
print("  STRATEKAZ - Development Mode")
print("  Database:", DATABASES['default']['NAME'])
print("  Host:", DATABASES['default']['HOST'])
print("=" * 60)
