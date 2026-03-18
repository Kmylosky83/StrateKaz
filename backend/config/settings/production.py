"""
StrateKaz - Production Settings

Para producción.
Uso: DJANGO_SETTINGS_MODULE=config.settings.production
"""

from .base import *
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

# =============================================================================
# DEBUG - NUNCA True en producción
# =============================================================================
DEBUG = False

# =============================================================================
# SECURITY
# =============================================================================
SECRET_KEY = config('SECRET_KEY')  # REQUERIDO - sin default

ALLOWED_HOSTS = config('ALLOWED_HOSTS').split(',')

# HTTPS settings
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# =============================================================================
# CORS - Allow all tenant subdomains
# =============================================================================
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://[\w-]+\.stratekaz\.com$',
]
CORS_ALLOW_CREDENTIALS = True
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
# CSRF - Trust all tenant subdomains
# =============================================================================
CSRF_TRUSTED_ORIGINS = [
    'https://app.stratekaz.com',
    'https://*.stratekaz.com',
]

# =============================================================================
# DATABASE
# =============================================================================
DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': config('DB_CONN_MAX_AGE', default=60, cast=int),
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}

# =============================================================================
# SENTRY ERROR TRACKING
# =============================================================================
SENTRY_DSN = config('SENTRY_DSN', default='')

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        environment=config('SENTRY_ENVIRONMENT', default='production'),
        traces_sample_rate=config('SENTRY_TRACES_SAMPLE_RATE', default=0.1, cast=float),
        profiles_sample_rate=config('SENTRY_PROFILES_SAMPLE_RATE', default=0.1, cast=float),
        send_default_pii=False,
    )

# =============================================================================
# EMAIL
# =============================================================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@stratekaz.com')

# =============================================================================
# LOGGING - RotatingFileHandler para evitar logs gigantes
# =============================================================================
LOGGING['handlers']['file'] = {
    'class': 'logging.handlers.RotatingFileHandler',
    'filename': '/var/log/stratekaz/django.log',
    'maxBytes': 10 * 1024 * 1024,  # 10 MB
    'backupCount': 5,
    'formatter': 'verbose',
}
LOGGING['handlers']['error_file'] = {
    'class': 'logging.handlers.RotatingFileHandler',
    'filename': '/var/log/stratekaz/error.log',
    'maxBytes': 10 * 1024 * 1024,  # 10 MB
    'backupCount': 5,
    'formatter': 'verbose',
    'level': 'ERROR',
}
LOGGING['loggers']['django']['handlers'] = ['console', 'file', 'error_file']
LOGGING['loggers']['django']['level'] = 'WARNING'
LOGGING['loggers']['apps']['handlers'] = ['console', 'file', 'error_file']
LOGGING['loggers']['apps']['level'] = 'INFO'

# =============================================================================
# STATIC FILES
# =============================================================================
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# =============================================================================
# FRONTEND URL (para links en emails)
# =============================================================================
FRONTEND_URL = config('FRONTEND_URL', default='https://app.stratekaz.com')

# =============================================================================
# DJANGO-TENANTS
# =============================================================================
SHOW_PUBLIC_IF_NO_TENANT_FOUND = False
