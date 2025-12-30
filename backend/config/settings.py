from pathlib import Path
from decouple import config
from datetime import timedelta
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# ═══════════════════════════════════════════════════
# SENTRY CONFIGURATION - ERROR TRACKING
# ═══════════════════════════════════════════════════
SENTRY_DSN = config('SENTRY_DSN', default='')
SENTRY_ENVIRONMENT = config('SENTRY_ENVIRONMENT', default='development')

if SENTRY_DSN and not DEBUG:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        environment=SENTRY_ENVIRONMENT,
        traces_sample_rate=config('SENTRY_TRACES_SAMPLE_RATE', default=0.1, cast=float),
        profiles_sample_rate=config('SENTRY_PROFILES_SAMPLE_RATE', default=0.1, cast=float),
        send_default_pii=False,
        attach_stacktrace=True,
        request_bodies='medium',
        max_breadcrumbs=50,
        before_send=lambda event, hint: event if not DEBUG else None,
    )

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'csp',
    'django_filters',
    'auditlog',
    'debug_toolbar',
    'drf_spectacular',
    'django_celery_beat',
    'django_celery_results',
    'apps.core',
    # Apps Legacy Funcionales (pendiente migración a nueva arquitectura)
    'apps.proveedores',          # LEGACY -> supply_chain/gestion_proveedores (pendiente eliminar)
    # Supply Chain (Módulo 6 - Nivel Operativo)
    'apps.supply_chain.catalogos',                   # TAB: Catálogos Supply Chain
    'apps.supply_chain.gestion_proveedores',         # TAB: Gestión de Proveedores
    'apps.supply_chain.programacion_abastecimiento', # TAB: Programación Abastecimiento
    'apps.supply_chain.compras',                     # TAB: Compras
    'apps.supply_chain.almacenamiento',              # TAB: Almacenamiento
    # Dirección Estratégica (Módulo 1) - TAB = Django App
    'apps.gestion_estrategica.configuracion',    # TAB: Configuración
    'apps.gestion_estrategica.organizacion',     # TAB: Organización
    'apps.gestion_estrategica.identidad',        # TAB: Identidad Corporativa
    'apps.gestion_estrategica.planeacion',       # TAB: Planeación Estratégica
    'apps.gestion_estrategica.gestion_proyectos',  # TAB: Gestión Proyectos (PMI)
    'apps.gestion_estrategica.revision_direccion', # TAB: Revisión por Dirección
    # Motor de Cumplimiento (Módulo 2)
    'apps.motor_cumplimiento.matriz_legal',      # Matriz Legal y Cumplimiento
    'apps.motor_cumplimiento.requisitos_legales',
    'apps.motor_cumplimiento.partes_interesadas',
    'apps.motor_cumplimiento.reglamentos_internos',
    # Motor de Riesgos (Módulo 3)
    'apps.motor_riesgos.contexto_organizacional',  # TAB: Contexto DOFA/PESTEL
    'apps.motor_riesgos.riesgos_procesos',         # TAB: Riesgos Procesos ISO 31000
    'apps.motor_riesgos.ipevr',                    # TAB: IPEVR GTC-45 (SST)
    'apps.motor_riesgos.aspectos_ambientales',     # TAB: Aspectos Ambientales ISO 14001
    'apps.motor_riesgos.riesgos_viales',           # TAB: Riesgos Viales PESV
    'apps.motor_riesgos.sagrilaft_ptee',           # TAB: SAGRILAFT/PTEE
    'apps.motor_riesgos.seguridad_informacion',    # TAB: Seguridad Info ISO 27001
    # Motor de Flujos (Módulo 4)
    'apps.workflow_engine.disenador_flujos',       # TAB: Diseñador BPMN
    'apps.workflow_engine.ejecucion',              # TAB: Ejecución de Flujos
    'apps.workflow_engine.monitoreo',              # TAB: Monitoreo y Analytics
    # HSEQ Management - Torre de Control (Módulo 5)
    'apps.hseq_management.sistema_documental',     # TAB: Sistema Documental
    'apps.hseq_management.planificacion_sistema',  # TAB: Planificación del Sistema
    'apps.hseq_management.calidad',                # TAB: Gestión de Calidad ISO 9001
    'apps.hseq_management.medicina_laboral',       # TAB: Medicina Laboral
    'apps.hseq_management.seguridad_industrial',   # TAB: Seguridad Industrial
    'apps.hseq_management.higiene_industrial',     # TAB: Higiene Industrial
    'apps.hseq_management.gestion_comites',        # TAB: Gestión de Comités
    'apps.hseq_management.accidentalidad',         # TAB: Accidentalidad
    'apps.hseq_management.emergencias',            # TAB: Emergencias
    'apps.hseq_management.gestion_ambiental',      # TAB: Gestión Ambiental ISO 14001
    'apps.hseq_management.mejora_continua',        # TAB: Mejora Continua
    # Production Ops - Operaciones de Producción (Módulo 7 - Nivel Operativo)
    'apps.production_ops.recepcion',              # TAB: Recepción de Materia Prima
    'apps.production_ops.procesamiento',          # TAB: Procesamiento y Lotes
    'apps.production_ops.mantenimiento',          # TAB: Mantenimiento de Activos
    'apps.production_ops.producto_terminado',     # TAB: Producto Terminado
    # Logistics Fleet - Logística y Flota (Módulo 8 - Nivel Operativo)
    'apps.logistics_fleet.gestion_flota',         # TAB: Gestión de Flota
    'apps.logistics_fleet.gestion_transporte',    # TAB: Gestión de Transporte
    # Sales CRM - Ventas y CRM (Módulo 9 - Nivel Comercial)
    'apps.sales_crm.gestion_clientes',            # TAB: Gestión de Clientes
    'apps.sales_crm.pipeline_ventas',             # TAB: Pipeline de Ventas
    'apps.sales_crm.pedidos_facturacion',         # TAB: Pedidos y Facturación
    'apps.sales_crm.servicio_cliente',            # TAB: Servicio al Cliente
    # Talent Hub - Gestión del Talento Humano (Módulo 10 - Habilitadores)
    'apps.talent_hub.estructura_cargos',          # TAB: Estructura de Cargos y Profesiogramas
    'apps.talent_hub.seleccion_contratacion',     # TAB: Selección y Contratación
    'apps.talent_hub.colaboradores',              # TAB: Colaboradores (Empleados)
    'apps.talent_hub.onboarding_induccion',       # TAB: Onboarding e Inducción
    'apps.talent_hub.formacion_reinduccion',      # TAB: Formación y Reinducción (LMS)
    'apps.talent_hub.desempeno',                  # TAB: Desempeño (Evaluaciones, Reconocimientos)
    'apps.talent_hub.control_tiempo',             # TAB: Control de Tiempo (Asistencia, Horas Extras)
    'apps.talent_hub.novedades',                  # TAB: Novedades (Incapacidades, Licencias, Permisos, Vacaciones)
    'apps.talent_hub.proceso_disciplinario',      # TAB: Proceso Disciplinario
    'apps.talent_hub.nomina',                     # TAB: Nómina y Prestaciones
    'apps.talent_hub.off_boarding',               # TAB: Off-Boarding y Liquidaciones
    # Admin Finance - Administración Financiera (Módulo 11 - Habilitadores)
    'apps.admin_finance.tesoreria',               # TAB: Tesorería y Flujo de Caja
    'apps.admin_finance.presupuesto',             # TAB: Presupuesto y Control
    'apps.admin_finance.activos_fijos',           # TAB: Activos Fijos y Depreciaciones
    'apps.admin_finance.servicios_generales',     # TAB: Servicios Generales
    # Accounting - Contabilidad (Módulo 12 - ACTIVABLE)
    'apps.accounting.config_contable',            # TAB: Configuración Contable (PUC)
    'apps.accounting.movimientos',                # TAB: Movimientos y Comprobantes
    'apps.accounting.informes_contables',         # TAB: Informes Contables
    'apps.accounting.integracion',                # TAB: Integración Contable
    # Analytics - Analítica y Gestión de Indicadores (Módulo 13 - Semanas 23-24)
    'apps.analytics.config_indicadores',          # TAB: Configuración de KPIs
    'apps.analytics.dashboard_gerencial',         # TAB: Dashboards Gerenciales
    'apps.analytics.indicadores_area',            # TAB: Valores y Seguimiento
    'apps.analytics.analisis_tendencias',         # TAB: Análisis de Tendencias (Semana 24)
    'apps.analytics.generador_informes',          # TAB: Generador de Informes (Semana 24)
    'apps.analytics.acciones_indicador',          # TAB: Planes de Acción KPI (Semana 24)
    'apps.analytics.exportacion_integracion',     # TAB: Exportación de Datos (Semana 24)
    # Audit System - Sistema de Auditoría y Notificaciones (Módulo 14 - Semana 25)
    'apps.audit_system.logs_sistema',             # TAB: Logs del Sistema
    'apps.audit_system.centro_notificaciones',    # TAB: Centro de Notificaciones
    'apps.audit_system.config_alertas',           # TAB: Configuración de Alertas
    'apps.audit_system.tareas_recordatorios',     # TAB: Tareas y Recordatorios
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'csp.middleware.CSPMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
    'auditlog.middleware.AuditlogMiddleware',
    # Custom Security Middleware
    'apps.core.middleware.IPBlockMiddleware',
    'apps.core.middleware.SecurityMiddleware',
]

ROOT_URLCONF = 'config.urls'

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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config('DB_NAME', default='grasas_huesos_db'),
        'USER': config('DB_USER', default='root'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='3306'),
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'core.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework_simplejwt.authentication.JWTAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=config('JWT_REFRESH_TOKEN_LIFETIME', default=1440, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ═══════════════════════════════════════════════════
# DRF-SPECTACULAR (API DOCUMENTATION)
# ═══════════════════════════════════════════════════
SPECTACULAR_SETTINGS = {
    'TITLE': 'SGI Grasas y Huesos del Norte API',
    'DESCRIPTION': '''
    API del Sistema de Gestión Integral para Grasas y Huesos del Norte S.A.S

    **Arquitectura del Sistema:**
    - 6 Niveles Organizacionales
    - 16 Módulos Principales
    - ~92 Aplicaciones Django
    - ~300 Endpoints REST

    **Módulos Principales:**
    1. Dirección Estratégica - Gestión corporativa y planeación
    2. Motor de Cumplimiento - Requisitos legales y partes interesadas
    3. Motor de Riesgos - Gestión integral de riesgos
    4. Motor de Flujos - Automatización BPMN
    5. HSEQ Management - Torre de control de calidad, seguridad y ambiente
    6. Supply Chain - Gestión de proveedores y abastecimiento
    7. Production Ops - Operaciones de producción
    8. Logistics Fleet - Logística y gestión de flota
    9. Sales CRM - Ventas y relación con clientes
    10. Talent Hub - Gestión del talento humano
    11. Admin Finance - Administración financiera
    12. Accounting - Contabilidad (activable)
    13. Analytics - Analítica e indicadores
    14. Audit System - Auditoría y notificaciones
    ''',
    'VERSION': '2.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': r'/api/',
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
        'filter': True,
        'syntaxHighlight.theme': 'monokai',
    },
    'CONTACT': {
        'name': 'Grasas y Huesos del Norte S.A.S',
        'url': 'https://grasasyhuesos.com',
        'email': 'soporte@grasasyhuesos.com',
    },
    'LICENSE': {
        'name': 'Propietario - Uso Interno',
    },
    'TAGS': [
        {'name': 'Autenticación', 'description': 'Endpoints de autenticación JWT'},
        {'name': 'Core', 'description': 'Funcionalidades centrales del sistema'},
        {'name': 'Dirección Estratégica', 'description': 'Organización, identidad y planeación'},
        {'name': 'Motor de Cumplimiento', 'description': 'Requisitos legales y cumplimiento normativo'},
        {'name': 'Motor de Riesgos', 'description': 'Gestión integral de riesgos'},
        {'name': 'HSEQ', 'description': 'Calidad, seguridad y gestión ambiental'},
        {'name': 'Supply Chain', 'description': 'Gestión de proveedores y abastecimiento'},
        {'name': 'Production Ops', 'description': 'Operaciones de producción'},
        {'name': 'Logistics Fleet', 'description': 'Logística y gestión de flota'},
        {'name': 'Sales CRM', 'description': 'Ventas y relación con clientes'},
        {'name': 'Talent Hub', 'description': 'Gestión del talento humano'},
        {'name': 'Admin Finance', 'description': 'Administración financiera'},
        {'name': 'Analytics', 'description': 'Analítica e indicadores KPI'},
        {'name': 'Audit System', 'description': 'Auditoría, notificaciones y alertas'},
    ],
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:5173,http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS = True

# ═══════════════════════════════════════════════════
# SECURITY HEADERS (OWASP)
# ═══════════════════════════════════════════════════
# Activar solo en producción
if not DEBUG:
    # SSL/HTTPS
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # HSTS (HTTP Strict Transport Security)
    SECURE_HSTS_SECONDS = 31536000  # 1 año
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Headers de seguridad (siempre activos)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Content Security Policy (CSP)
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "'unsafe-eval'")  # unsafe-eval para desarrollo
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "blob:", "https:")
CSP_FONT_SRC = ("'self'", "data:")
CSP_CONNECT_SRC = ("'self'", config('FRONTEND_URL', default='http://localhost:5173'))
CSP_FRAME_ANCESTORS = ("'none'",)
CSP_BASE_URI = ("'self'",)
CSP_FORM_ACTION = ("'self'",)

# ═══════════════════════════════════════════════════
# RATE LIMITING
# ═══════════════════════════════════════════════════
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'
RATELIMIT_VIEW = 'apps.core.views.ratelimit_error_view'

# ═══════════════════════════════════════════════════
# CSRF PROTECTION
# ═══════════════════════════════════════════════════
CSRF_FAILURE_VIEW = 'apps.core.views.csrf_failure_view'
CSRF_COOKIE_HTTPONLY = False  # Necesario para que el frontend pueda leer el cookie
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='http://localhost:5173,http://localhost:3000').split(',')

# ═══════════════════════════════════════════════════
# SESSION SECURITY
# ═══════════════════════════════════════════════════
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 86400  # 24 horas
SESSION_SAVE_EVERY_REQUEST = False

INTERNAL_IPS = ['127.0.0.1', 'localhost']
AUDITLOG_INCLUDE_ALL_MODELS = True

PRECIO_COMPRA_ECONORTE = config('PRECIO_COMPRA_ECONORTE', default=3500, cast=int)
PRECIO_REFERENCIA_COMISION = config('PRECIO_REFERENCIA_COMISION', default=3000, cast=int)
COMISION_FIJA_POR_KILO = config('COMISION_FIJA_POR_KILO', default=100, cast=int)

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@grasasyhuesos.com')

# ═══════════════════════════════════════════════════
# CELERY CONFIGURATION
# ═══════════════════════════════════════════════════
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/1')

# Configuración de serialización y formatos
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = True

# Configuración de resultados
CELERY_RESULT_EXPIRES = 3600  # 1 hora
CELERY_RESULT_EXTENDED = True
CELERY_RESULT_BACKEND_MAX_RETRIES = 10
CELERY_RESULT_BACKEND_ALWAYS_RETRY = True

# Configuración de tareas
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutos
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutos
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_TASK_DEFAULT_QUEUE = 'default'
CELERY_TASK_DEFAULT_EXCHANGE = 'default'
CELERY_TASK_DEFAULT_ROUTING_KEY = 'default'

# Configuración de worker
CELERY_WORKER_PREFETCH_MULTIPLIER = 4
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000
CELERY_WORKER_DISABLE_RATE_LIMITS = False
CELERY_WORKER_SEND_TASK_EVENTS = True
CELERY_WORKER_TASK_EVENTS = True

# Configuración de broker
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BROKER_POOL_LIMIT = 10
CELERY_BROKER_HEARTBEAT = 30
CELERY_BROKER_CONNECTION_TIMEOUT = 30

# Configuración de Beat (tareas periódicas)
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# Almacenar resultados en base de datos (opcional, además de Redis)
CELERY_RESULT_BACKEND_DB = 'django-db'
CELERY_CACHE_BACKEND = 'django-cache'

# Configuración de logging de Celery
CELERY_WORKER_HIJACK_ROOT_LOGGER = False

# ═══════════════════════════════════════════════════
# REDIS CACHE CONFIGURATION
# ═══════════════════════════════════════════════════
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/2'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
        },
        'KEY_PREFIX': 'grasas_huesos',
        'TIMEOUT': 300,  # 5 minutos por defecto
    },
    'sessions': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/3'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'session',
        'TIMEOUT': 86400,  # 24 horas
    }
}

# Usar Redis para sesiones (opcional)
# SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
# SESSION_CACHE_ALIAS = 'sessions'

# Logging Configuration
import os

# Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# Choose formatter based on DEBUG setting
# JSON for production, verbose for development
CONSOLE_FORMATTER = 'verbose' if DEBUG else 'json'
FILE_FORMATTER = 'json'  # Always use JSON for file logs

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'json': {
            '()': 'utils.logging.JSONFormatter',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': CONSOLE_FORMATTER,
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'app.log',
            'maxBytes': 1024 * 1024 * 15,  # 15 MB
            'backupCount': 10,
            'formatter': FILE_FORMATTER,
        },
        'error_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'error.log',
            'maxBytes': 1024 * 1024 * 15,  # 15 MB
            'backupCount': 10,
            'formatter': FILE_FORMATTER,
            'level': 'ERROR',
        },
        'security_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'security.log',
            'maxBytes': 1024 * 1024 * 15,  # 15 MB
            'backupCount': 10,
            'formatter': FILE_FORMATTER,
            'level': 'WARNING',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': config('DJANGO_LOG_LEVEL', default='INFO'),
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console', 'security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': config('DB_LOG_LEVEL', default='INFO'),
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'utils': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'celery': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console', 'file', 'error_file'],
        'level': 'INFO',
    },
}
