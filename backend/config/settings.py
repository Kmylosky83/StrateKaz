from pathlib import Path
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

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
    'django_filters',
    'auditlog',
    'debug_toolbar',
    'apps.core',
    # Apps Legacy Funcionales (pendiente migración a nueva arquitectura)
    'apps.proveedores',          # -> supply_chain/gestion_proveedores
    'apps.ecoaliados',           # -> supply_chain/gestion_proveedores
    'apps.programaciones',       # -> logistics_fleet/gestion_transporte
    'apps.recolecciones',        # -> logistics_fleet/despachos
    'apps.recepciones',          # -> production_ops/recepcion
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
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
    'auditlog.middleware.AuditlogMiddleware',
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

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:5173,http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS = True

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

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': config('DJANGO_LOG_LEVEL', default='INFO'),
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
