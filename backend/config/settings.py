from pathlib import Path
from decouple import config
from datetime import timedelta
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = config('SECRET_KEY')  # REQUERIDO - Sin default por seguridad (P0-02)
DEBUG = config('DEBUG', default=False, cast=bool)  # P0-06: False por defecto en producción
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
        max_request_body_size='medium',  # Actualizado para sentry-sdk 2.x (antes: request_bodies)
        max_breadcrumbs=50,
    )

# ═══════════════════════════════════════════════════════════════════════════
# SISTEMA MODULAR DE APPS - ACTIVAR POR NIVELES (6 NIVELES)
# ═══════════════════════════════════════════════════════════════════════════
# Referencia: docs/planificacion/CRONOGRAMA-26-SEMANAS.md
#
# ARQUITECTURA DE 6 NIVELES:
# ┌─────────────────────────────────────────────────────────────────────────┐
# │ Nivel 0: CORE BASE    → Usuarios, RBAC, Menú, Config Sistema           │
# │ Nivel 1: ESTRATÉGICO  → Dirección Estratégica (6 apps)                 │
# │ Nivel 2: CUMPLIMIENTO → Motor Cumplimiento + Riesgos + Workflows (14)  │
# │ Nivel 3: TORRE CTRL   → HSEQ Management (11 apps)                      │
# │ Nivel 4: CADENA VALOR → Supply + Production + Logistics + Sales (18)   │
# │ Nivel 5: HABILITADORES→ Talent + Finance + Accounting (19 apps)        │
# │ Nivel 6: INTELIGENCIA → Analytics + Audit System (11 apps)             │
# └─────────────────────────────────────────────────────────────────────────┘
#
# INSTRUCCIONES:
# 1. Comenzar con NIVEL 0 (solo core base)
# 2. Probar: migrate + createsuperuser + runserver + admin
# 3. Si funciona, descomentar NIVEL 1
# 4. Repetir hasta tener todos los módulos funcionando
# ═══════════════════════════════════════════════════════════════════════════

INSTALLED_APPS = [
    # ─────────────────────────────────────────────────────────────────────────
    # DJANGO CORE (siempre activo)
    # ─────────────────────────────────────────────────────────────────────────
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # ─────────────────────────────────────────────────────────────────────────
    # THIRD PARTY (siempre activo)
    # ─────────────────────────────────────────────────────────────────────────
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'csp',
    'django_filters',
    'auditlog',
    'drf_spectacular',
    'django_celery_beat',
    'django_celery_results',

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 0: CORE BASE (Usuarios, RBAC, Menú, Configuración Sistema)
    # ═══════════════════════════════════════════════════════════════════════════
    'apps.core',

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 1: ESTRATÉGICO - Dirección Estratégica (6 apps)
    # Deploy: Semana 6 a Producción
    # ═══════════════════════════════════════════════════════════════════════════
    'apps.gestion_estrategica.configuracion',      # EmpresaConfig, SedeEmpresa, NormaISO, TipoCambio
    'apps.gestion_estrategica.organizacion',       # Area, ConsecutivoConfig
    'apps.gestion_estrategica.identidad',          # CorporateIdentity, AlcanceSistema
    'apps.gestion_estrategica.planeacion',         # StrategicPlan, StrategicObjective, GestionCambio
    'apps.gestion_estrategica.planeacion.contexto', # DOFA, PESTEL, Porter (ISO Clausula 4.1)
    'apps.gestion_estrategica.gestion_proyectos',  # Portafolio, Programa, Proyecto
    'apps.gestion_estrategica.revision_direccion', # ActaRevision, CompromisoRevision
    'apps.gestion_estrategica.gestion_documental', # Documento, Version (migrado desde N3)

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 2: CUMPLIMIENTO - Motor Cumplimiento + Riesgos + Workflows (14 apps)
    # Deploy: Semana 10 a Producción
    # Activado: DÍA 7 de refactorización (2026-01-05)
    # ═══════════════════════════════════════════════════════════════════════════
    # --- Motor de Cumplimiento (4 apps) ---
    'apps.motor_cumplimiento.matriz_legal',        # MatrizLegal, NormaLegal
    'apps.motor_cumplimiento.requisitos_legales',  # Requisito, Evaluacion
    'apps.motor_cumplimiento.partes_interesadas',  # ParteInteresada, Comunicacion
    'apps.motor_cumplimiento.reglamentos_internos',# Reglamento, Publicacion
    # --- Motor de Riesgos (7 apps) ---
    'apps.motor_riesgos.riesgos_procesos',         # Riesgo, Control, Tratamiento
    'apps.motor_riesgos.ipevr',                    # Peligro, RiesgoSST (GTC-45)
    'apps.motor_riesgos.aspectos_ambientales',     # AspectoAmbiental (ISO 14001)
    'apps.motor_riesgos.riesgos_viales',           # RiesgoVial (PESV)
    'apps.motor_riesgos.sagrilaft_ptee',           # RiesgoLAFT, Señal
    'apps.motor_riesgos.seguridad_informacion',    # RiesgoTI (ISO 27001)
    # --- Workflow Engine (4 apps) ---
    'apps.workflow_engine.disenador_flujos',       # PlantillaFlujo, Paso (BPMN)
    'apps.workflow_engine.ejecucion',              # InstanciaFlujo, TareaActiva
    'apps.workflow_engine.monitoreo',              # MetricaFlujo, AlertaFlujo
    'apps.workflow_engine.firma_digital',          # FirmaDigital, ConfiguracionFlujoFirma (Fase 0.3.4)

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 3: TORRE DE CONTROL - HSEQ Management (10 apps)
    # Deploy: Semana 14 a Producción
    # Activado: DÍA 8 de refactorización (2026-01-05)
    # NOTA: sistema_documental migrado a N1 (gestion_estrategica.gestion_documental)
    # ═══════════════════════════════════════════════════════════════════════════
    'apps.hseq_management.planificacion_sistema',  # PlanAnual, Objetivo, Meta
    'apps.hseq_management.calidad',                # NoConformidad, AccionCorrectiva
    'apps.hseq_management.medicina_laboral',       # ExamenMedico, Restriccion
    'apps.hseq_management.seguridad_industrial',   # Inspeccion, PermisoTrabajo
    'apps.hseq_management.higiene_industrial',     # Medicion, AgenteRiesgo
    'apps.hseq_management.gestion_comites',        # Comite, Reunion, Acta
    'apps.hseq_management.accidentalidad',         # Accidente, Incidente
    'apps.hseq_management.emergencias',            # PlanEmergencia, Simulacro
    'apps.hseq_management.gestion_ambiental',      # ProgramaAmbiental, Residuo
    'apps.hseq_management.mejora_continua',        # Auditoria, Hallazgo

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 4: CADENA DE VALOR - Supply + Production + Logistics + Sales (17 apps)
    # Deploy: Semana 18 a Producción
    # Activado: DÍA 9 de refactorización (2026-01-05)
    # ═══════════════════════════════════════════════════════════════════════════
    # --- Supply Chain (5 apps) ---
    'apps.supply_chain.catalogos',                 # TipoMateriaPrima, UnidadMedida
    'apps.supply_chain.gestion_proveedores',       # Proveedor, Evaluacion, Contrato
    'apps.supply_chain.programacion_abastecimiento', # Programacion, Ruta
    'apps.supply_chain.compras',                   # OrdenCompra, Recepcion
    'apps.supply_chain.almacenamiento',            # Bodega, Inventario, Movimiento
    # --- Production Ops (4 apps) ---
    'apps.production_ops.recepcion',               # RecepcionMP, PesajeBruto
    'apps.production_ops.procesamiento',           # Lote, Proceso, Rendimiento
    'apps.production_ops.mantenimiento',           # Equipo, OrdenTrabajo
    'apps.production_ops.producto_terminado',      # Stock, Producto, Despacho
    # --- Logistics Fleet (4 apps) ---
    'apps.logistics_fleet.gestion_flota',          # Vehiculo, Conductor
    'apps.logistics_fleet.gestion_transporte',     # Ruta, Despacho, GuiaTransporte
    'apps.logistics_fleet.despachos',              # Despachos de mercancía
    'apps.logistics_fleet.pesv_operativo',         # PESV operativo (placeholder)
    # --- Sales CRM (4 apps) ---
    'apps.sales_crm.gestion_clientes',             # Cliente, Contacto, Segmento
    'apps.sales_crm.pipeline_ventas',              # Oportunidad, Cotizacion
    'apps.sales_crm.pedidos_facturacion',          # Pedido, Factura (DIAN)
    'apps.sales_crm.servicio_cliente',             # Ticket, Reclamacion

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 5: HABILITADORES - Talent + Finance + Accounting (19 apps)
    # Deploy: Semana 22 a Producción
    # Activado: DÍA 10 de refactorización (2026-01-05)
    # ═══════════════════════════════════════════════════════════════════════════
    # --- Talent Hub (11 apps) ---
    'apps.talent_hub.estructura_cargos',           # Profesiograma, NivelSalarial
    'apps.talent_hub.seleccion_contratacion',      # Vacante, Candidato
    'apps.talent_hub.colaboradores',               # Colaborador, Contrato
    'apps.talent_hub.onboarding_induccion',        # PlanInduccion, Checklist
    'apps.talent_hub.formacion_reinduccion',       # Curso, Capacitacion (LMS)
    'apps.talent_hub.desempeno',                   # Evaluacion360, Reconocimiento
    'apps.talent_hub.control_tiempo',              # Marcacion, HoraExtra
    'apps.talent_hub.novedades',                   # Incapacidad, Licencia, Vacaciones
    'apps.talent_hub.proceso_disciplinario',       # Descargo, Sancion
    'apps.talent_hub.nomina',                      # Nomina, Devengado, Deduccion
    'apps.talent_hub.off_boarding',                # EntrevistaRetiro, PazSalvo
    # --- Admin Finance (4 apps) ---
    'apps.admin_finance.tesoreria',                # CuentaBancaria, FlujoCaja
    'apps.admin_finance.presupuesto',              # Presupuesto, CDP, CRP
    'apps.admin_finance.activos_fijos',            # Activo, Depreciacion
    'apps.admin_finance.servicios_generales',      # Contrato, Gasto
    # --- Accounting (4 apps) - Siempre instalado, control por permisos/licencia ---
    'apps.accounting.config_contable',             # PUC, CuentaContable
    'apps.accounting.movimientos',                 # Comprobante, Detalle
    'apps.accounting.informes_contables',          # Balance, EstadoResultados
    'apps.accounting.integracion',                 # ColaContabilizacion

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 6: INTELIGENCIA - Analytics + Audit System (11 apps)
    # Deploy: Semana 26 - GO-LIVE COMPLETO
    # Activado: DÍA 10 de refactorización (2026-01-05)
    # ═══════════════════════════════════════════════════════════════════════════
    # --- Analytics (7 apps) ---
    'apps.analytics.config_indicadores',           # Indicador, Formula, MetaKPI
    'apps.analytics.dashboard_gerencial',          # Dashboard, Widget
    'apps.analytics.indicadores_area',             # ValorIndicador, Seguimiento
    'apps.analytics.analisis_tendencias',          # Tendencia, Proyeccion
    'apps.analytics.generador_informes',           # PlantillaInforme
    'apps.analytics.acciones_indicador',           # PlanAccion
    'apps.analytics.exportacion_integracion',      # ConfigExportacion
    # --- Audit System (4 apps) ---
    'apps.audit_system.logs_sistema',              # LogActividad, LogAcceso
    'apps.audit_system.centro_notificaciones',     # Notificacion, Canal
    'apps.audit_system.config_alertas',            # ReglaAlerta, Destinatario
    'apps.audit_system.tareas_recordatorios',      # Tarea, Recordatorio
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'csp.middleware.CSPMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
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
        # P1-15: Connection pooling - mantener conexiones abiertas
        'CONN_MAX_AGE': config('DB_CONN_MAX_AGE', default=60, cast=int),
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
    'TITLE': 'SGI StrateKaz API',
    'DESCRIPTION': '''
    API del Sistema de Gestión Integral para StrateKaz

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
        'name': 'StrateKaz',
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

# En desarrollo permitir todos los orígenes
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:5173,http://localhost:3000,http://localhost:3010').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

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
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Content Security Policy (CSP)
# Configuración diferenciada por entorno
if DEBUG:
    # Desarrollo: más permisivo para hot-reload y debugging
    CSP_DEFAULT_SRC = ("'self'",)
    CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "'unsafe-eval'")
    CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
    CSP_IMG_SRC = ("'self'", "data:", "blob:", "https:")
    CSP_FONT_SRC = ("'self'", "data:")
    CSP_CONNECT_SRC = ("'self'", "http://localhost:5173", "http://localhost:3000", "http://localhost:3010", "ws://localhost:5173")
    CSP_FRAME_ANCESTORS = ("'none'",)
    CSP_BASE_URI = ("'self'",)
    CSP_FORM_ACTION = ("'self'",)
else:
    # Producción: más restrictivo
    CSP_DEFAULT_SRC = ("'self'",)
    CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")  # Sin unsafe-eval en producción
    CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
    CSP_IMG_SRC = ("'self'", "data:", "blob:", "https:")
    CSP_FONT_SRC = ("'self'", "data:", "https://fonts.gstatic.com")
    # CSP_CONNECT_SRC se configura dinámicamente desde CORS_ALLOWED_ORIGINS
    _csp_connect = ["'self'"]
    if 'CORS_ALLOWED_ORIGINS' in dir():
        _csp_connect.extend(CORS_ALLOWED_ORIGINS)
    CSP_CONNECT_SRC = tuple(_csp_connect)
    CSP_FRAME_ANCESTORS = ("'none'",)
    CSP_BASE_URI = ("'self'",)
    CSP_FORM_ACTION = ("'self'",)
    # Reportar violaciones CSP (opcional, requiere endpoint)
    # CSP_REPORT_URI = '/api/csp-report/'

# ═══════════════════════════════════════════════════
# RATE LIMITING
# ═══════════════════════════════════════════════════
RATELIMIT_ENABLE = config('RATELIMIT_ENABLE', default=not DEBUG, cast=bool)
RATELIMIT_USE_CACHE = 'default'
RATELIMIT_VIEW = 'apps.core.views.ratelimit_error_view'

# ═══════════════════════════════════════════════════
# CSRF PROTECTION
# ═══════════════════════════════════════════════════
CSRF_FAILURE_VIEW = 'apps.core.views.csrf_failure_view'
# P1-10: CSRF cookie HTTPOnly - El frontend usa JWT, no necesita leer el CSRF cookie
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='http://localhost:5173,http://localhost:3000,http://localhost:3010').split(',')

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

# ═══════════════════════════════════════════════════
# EMAIL CONFIGURATION
# ═══════════════════════════════════════════════════
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@grasasyhuesos.com')
EMAIL_SUBJECT_PREFIX = config('EMAIL_SUBJECT_PREFIX', default='[StrateKaz] ')

# ═══════════════════════════════════════════════════
# FRONTEND URL (para links en emails de notificacion)
# ═══════════════════════════════════════════════════
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

# ═══════════════════════════════════════════════════
# ENVIRONMENT DETECTION (cPanel vs Docker/VPS)
# ═══════════════════════════════════════════════════
# En cPanel no hay Redis ni Celery workers disponibles
# USE_CPANEL=True activa alternativas basadas en base de datos
USE_CPANEL = config('USE_CPANEL', default=False, cast=bool)

# ═══════════════════════════════════════════════════
# CELERY CONFIGURATION
# ═══════════════════════════════════════════════════
if USE_CPANEL:
    # cPanel: Ejecutar tareas de forma síncrona (sin worker)
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True
    # No necesita broker ni backend en modo eager
    CELERY_BROKER_URL = None
    CELERY_RESULT_BACKEND = None
else:
    # Docker/VPS: Usar Redis como broker
    CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/1')
    CELERY_TASK_ALWAYS_EAGER = False

# Configuración de serialización y formatos (común)
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

# Configuración de worker (solo aplica en Docker/VPS)
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

# Almacenar resultados en base de datos
CELERY_RESULT_BACKEND_DB = 'django-db'
CELERY_CACHE_BACKEND = 'django-cache'

# Configuración de logging de Celery
CELERY_WORKER_HIJACK_ROOT_LOGGER = False

# ═══════════════════════════════════════════════════
# CACHE CONFIGURATION
# ═══════════════════════════════════════════════════
if USE_CPANEL:
    # cPanel: Usar cache basado en base de datos
    # Requiere ejecutar: python manage.py createcachetable
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
            'LOCATION': 'django_cache_table',
            'TIMEOUT': 300,  # 5 minutos por defecto
            'OPTIONS': {
                'MAX_ENTRIES': 1000,
                'CULL_FREQUENCY': 3,
            }
        }
    }
else:
    # Docker/VPS: Usar Redis para cache
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': config('REDIS_URL', default='redis://redis:6379/2'),
            'KEY_PREFIX': 'grasas_huesos',
            'TIMEOUT': 300,  # 5 minutos por defecto
        },
        'sessions': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': config('REDIS_URL', default='redis://redis:6379/3'),
            'KEY_PREFIX': 'session',
            'TIMEOUT': 86400,  # 24 horas
        }
    }

# Usar Redis para sesiones (solo en Docker/VPS)
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
