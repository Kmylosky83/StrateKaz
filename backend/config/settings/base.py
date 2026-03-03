"""
StrateKaz - Settings Base

Configuración compartida entre todos los entornos.
NO usar directamente - usar development.py, production.py o testing.py
"""

from pathlib import Path
from datetime import timedelta
from decouple import config

# =============================================================================
# PATHS
# =============================================================================
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent  # Directorio raíz del proyecto

# =============================================================================
# SECURITY
# =============================================================================
SECRET_KEY = config('SECRET_KEY')  # REQUERIDO — sin default para forzar configuracion en .env
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# URL del frontend (para links en emails de reset de contraseña, notificaciones, etc.)
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3010')

# Email subject prefix (Django default es "[Django] " — lo eliminamos)
EMAIL_SUBJECT_PREFIX = ''

# =============================================================================
# DJANGO-TENANTS CONFIGURATION
# =============================================================================
# Apps compartidas (schema public) - se cargan para TODOS los tenants
SHARED_APPS = [
    # django-tenants DEBE ir primero
    'django_tenants',

    # Django core (compartido)
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party (compartidos)
    'rest_framework',
    'rest_framework_simplejwt',
    # NOTA: token_blacklist movido a TENANT_APPS porque depende de core.User
    'corsheaders',
    'django_filters',
    'drf_spectacular',

    # Celery (global - un solo scheduler/backend para toda la plataforma)
    'django_celery_beat',
    'django_celery_results',

    # Apps compartidas (schema public)
    'apps.tenant',  # Modelos: Tenant, Plan, TenantUser, Domain
]

# Apps de tenant (schema tenant_xxx) - aisladas por tenant
TENANT_APPS = [
    # Django apps que necesitan ser por tenant
    'django.contrib.admin',  # Admin por tenant (depende de core.User)
    'django.contrib.auth',  # Necesario para permisos por tenant
    'django.contrib.contenttypes',

    # Third party por tenant
    'rest_framework_simplejwt.token_blacklist',  # Depende de core.User
    'auditlog',
    'csp',

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 0: CORE BASE
    # ═══════════════════════════════════════════════════════════════════════════
    'apps.core',
    'apps.ia',  # IA: GeminiService, ayuda contextual, asistente de texto

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 1: ESTRATÉGICO
    # ═══════════════════════════════════════════════════════════════════════════
    'apps.gestion_estrategica.configuracion',
    'apps.gestion_estrategica.organizacion',
    'apps.gestion_estrategica.identidad',
    'apps.gestion_estrategica.planeacion',
    'apps.gestion_estrategica.contexto',
    'apps.gestion_estrategica.encuestas',
    'apps.gestion_estrategica.gestion_proyectos',
    'apps.gestion_estrategica.revision_direccion',
    'apps.gestion_estrategica.gestion_documental',
    'apps.gestion_estrategica.planificacion_sistema',

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 2: CUMPLIMIENTO
    # ═══════════════════════════════════════════════════════════════════════════
    'apps.motor_cumplimiento.matriz_legal',
    'apps.motor_cumplimiento.requisitos_legales',
    # partes_interesadas ELIMINADO — la fuente canónica está en gestion_estrategica.contexto (ISO 9001:2015 Cláusula 4.2)
    'apps.motor_cumplimiento.reglamentos_internos',
    'apps.motor_cumplimiento.evidencias',

    'apps.motor_riesgos.riesgos_procesos',
    'apps.motor_riesgos.ipevr',
    'apps.motor_riesgos.aspectos_ambientales',
    'apps.motor_riesgos.riesgos_viales',
    'apps.motor_riesgos.seguridad_informacion',
    'apps.motor_riesgos.sagrilaft_ptee',

    'apps.workflow_engine.disenador_flujos',
    'apps.workflow_engine.ejecucion',
    'apps.workflow_engine.monitoreo',
    'apps.workflow_engine.firma_digital',

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 3: TORRE DE CONTROL - HSEQ
    # ═══════════════════════════════════════════════════════════════════════════
    'apps.hseq_management.accidentalidad',
    'apps.hseq_management.seguridad_industrial',
    'apps.hseq_management.higiene_industrial',
    'apps.hseq_management.medicina_laboral',
    'apps.hseq_management.emergencias',
    'apps.hseq_management.gestion_ambiental',
    'apps.hseq_management.calidad',
    'apps.hseq_management.mejora_continua',
    'apps.hseq_management.gestion_comites',
    # NOTA: planificacion_sistema fue migrado a apps.gestion_estrategica.planificacion_sistema

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 4: CADENA DE VALOR
    # ═══════════════════════════════════════════════════════════════════════════
    'apps.supply_chain.catalogos',
    'apps.supply_chain.gestion_proveedores',
    'apps.supply_chain.compras',
    'apps.supply_chain.almacenamiento',
    'apps.supply_chain.programacion_abastecimiento',

    'apps.production_ops.recepcion',
    'apps.production_ops.procesamiento',
    'apps.production_ops.producto_terminado',
    'apps.production_ops.mantenimiento',

    'apps.logistics_fleet.gestion_flota',
    'apps.logistics_fleet.gestion_transporte',

    'apps.sales_crm.gestion_clientes',
    'apps.sales_crm.pipeline_ventas',
    'apps.sales_crm.pedidos_facturacion',
    'apps.sales_crm.servicio_cliente',

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 5: HABILITADORES
    # ═══════════════════════════════════════════════════════════════════════════
    'apps.talent_hub.estructura_cargos',
    'apps.talent_hub.seleccion_contratacion',
    'apps.talent_hub.colaboradores',
    'apps.talent_hub.onboarding_induccion',
    'apps.talent_hub.formacion_reinduccion',
    'apps.talent_hub.desempeno',
    'apps.talent_hub.control_tiempo',
    'apps.talent_hub.novedades',
    'apps.talent_hub.nomina',
    'apps.talent_hub.proceso_disciplinario',
    'apps.talent_hub.off_boarding',

    'apps.admin_finance.presupuesto',
    'apps.admin_finance.tesoreria',
    'apps.admin_finance.activos_fijos',
    'apps.admin_finance.servicios_generales',

    'apps.accounting.config_contable',
    'apps.accounting.movimientos',
    'apps.accounting.informes_contables',
    'apps.accounting.integracion',

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 6: INTELIGENCIA
    # ═══════════════════════════════════════════════════════════════════════════
    'apps.analytics.config_indicadores',
    'apps.analytics.indicadores_area',
    'apps.analytics.acciones_indicador',
    'apps.analytics.dashboard_gerencial',
    'apps.analytics.generador_informes',
    'apps.analytics.analisis_tendencias',
    'apps.analytics.exportacion_integracion',

    'apps.audit_system.logs_sistema',
    'apps.audit_system.config_alertas',
    'apps.audit_system.centro_notificaciones',
    'apps.audit_system.tareas_recordatorios',
]

# INSTALLED_APPS es la combinación de ambas
INSTALLED_APPS = list(SHARED_APPS) + [
    app for app in TENANT_APPS if app not in SHARED_APPS
]

# =============================================================================
# DJANGO-TENANTS MODELS
# =============================================================================
TENANT_MODEL = 'tenant.Tenant'
TENANT_DOMAIN_MODEL = 'tenant.Domain'

# =============================================================================
# MIDDLEWARE
# =============================================================================
MIDDLEWARE = [
    # django-tenants DEBE ir primero
    'django_tenants.middleware.main.TenantMainMiddleware',
    # Multi-tenant auth: cambia schema si hay X-Tenant-ID header
    'apps.tenant.middleware.TenantAuthenticationMiddleware',

    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'csp.middleware.CSPMiddleware',
    'auditlog.middleware.AuditlogMiddleware',
    # Validar que módulos estén activos antes de permitir acceso a APIs
    'apps.core.middleware.ModuleAccessMiddleware',
]

ROOT_URLCONF = 'config.urls'

# =============================================================================
# TEMPLATES
# =============================================================================
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

WSGI_APPLICATION = 'config.wsgi.application'

# =============================================================================
# DATABASE - PostgreSQL con django-tenants
# =============================================================================
DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': config('DB_NAME', default='stratekaz'),
        'USER': config('DB_USER', default='stratekaz'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': config('DB_CONN_MAX_AGE', default=60, cast=int),
    }
}

# Router de base de datos para django-tenants
DATABASE_ROUTERS = ['django_tenants.routers.TenantSyncRouter']

# =============================================================================
# PASSWORD VALIDATION
# =============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# =============================================================================
# INTERNATIONALIZATION
# =============================================================================
LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# =============================================================================
# STATIC & MEDIA FILES
# =============================================================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# =============================================================================
# DEFAULT PRIMARY KEY
# =============================================================================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'core.User'

# =============================================================================
# REST FRAMEWORK
# =============================================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # HybridJWTAuthentication soporta tokens de TenantUser en contexto de tenant
        'apps.tenant.authentication.HybridJWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/minute',
        'user': '120/minute',
        'login': '5/minute',
        'password_reset': '3/minute',
    },
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=config('JWT_REFRESH_TOKEN_LIFETIME', default=10080, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,  # Desactivado para multi-tenant (TenantUser maneja su propio last_login)
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# =============================================================================
# API DOCUMENTATION (drf-spectacular)
# =============================================================================
SPECTACULAR_SETTINGS = {
    'TITLE': 'StrateKaz API',
    'DESCRIPTION': 'API del Sistema de Gestión Integral StrateKaz - Multi-tenant SaaS',
    'VERSION': '4.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': '/api/',
}

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3010,http://127.0.0.1:3010'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# =============================================================================
# CSRF CONFIGURATION
# =============================================================================
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:3010,http://127.0.0.1:3010'
).split(',')

# =============================================================================
# SECURITY HEADERS (CSP)
# =============================================================================
CSP_DEFAULT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "'unsafe-eval'")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")

# =============================================================================
# CELERY CONFIGURATION
# =============================================================================
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/1')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutos

# =============================================================================
# CACHE CONFIGURATION
# =============================================================================
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_FUNCTION': 'utils.cache.make_tenant_cache_key',
    }
}

# =============================================================================
# LOGGING
# =============================================================================
# Configuración base de logging - solo consola
# Los handlers de archivo se agregan en production.py si es necesario
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# =============================================================================
# SECURITY HEADERS
# =============================================================================
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True

# =============================================================================
# AUDITLOG
# =============================================================================
# Deshabilitado globalmente - los modelos deben registrarse explícitamente
# Esto evita que intente auditar modelos en schemas donde auditlog no existe
AUDITLOG_INCLUDE_ALL_MODELS = False
