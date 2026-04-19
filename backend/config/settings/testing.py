"""
StrateKaz - Testing Settings

Para ejecutar tests en CI y local.
Uso: DJANGO_SETTINGS_MODULE=config.settings.testing

NOTA: Habilita TODAS las apps (incluyendo las comentadas en base.py)
para que pytest pueda importar y testear modelos de cualquier módulo.
Esto NO afecta producción — solo el entorno de testing.
"""

from .base import *

# =============================================================================
# SECURITY - Testing defaults
# =============================================================================
SECRET_KEY = config('SECRET_KEY', default='django-insecure-testing-only-key-NOT-FOR-PRODUCTION')
DEBUG = False
ALLOWED_HOSTS = ['*']  # Tests pueden usar cualquier Host header (tenant.test.com, etc.)

# =============================================================================
# DATABASE - PostgreSQL obligatorio (django-tenants requiere schemas)
# Hereda ENGINE, USER, PASSWORD, HOST, PORT de base.py.
# Solo sobreescribimos el nombre de la DB para aislar tests de dev.
# =============================================================================
DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': config('DB_NAME', default='stratekaz_test'),
        'USER': config('DB_USER', default='stratekaz'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='db'),
        'PORT': config('DB_PORT', default='5432'),
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

# =============================================================================
# HABILITAR TODAS LAS APPS PARA TESTING
# Apps comentadas en base.py se agregan aquí para que pytest pueda
# importar modelos y ejecutar tests de cualquier módulo.
# Esto es independiente de producción — refactorizar apps no afecta este
# settings porque se regenera automáticamente con la cascada.
# =============================================================================

_TESTING_EXTRA_APPS = [
    # Gamificación
    'apps.gamificacion.juego_sst',

    # Gestión Estratégica — Planeación y Proyectos
    'apps.gestion_estrategica.planeacion',
    'apps.gestion_estrategica.gestion_proyectos',
    'apps.gestion_estrategica.planificacion_sistema',
    'apps.gestion_estrategica.revision_direccion',

    # Motor de Cumplimiento
    'apps.motor_cumplimiento.matriz_legal',
    'apps.motor_cumplimiento.requisitos_legales',
    'apps.motor_cumplimiento.reglamentos_internos',
    'apps.motor_cumplimiento.evidencias',

    # Motor de Riesgos
    'apps.motor_riesgos.riesgos_procesos',
    'apps.motor_riesgos.ipevr',
    'apps.motor_riesgos.aspectos_ambientales',
    'apps.motor_riesgos.riesgos_viales',
    'apps.motor_riesgos.seguridad_informacion',
    'apps.motor_riesgos.sagrilaft_ptee',

    # HSEQ Management
    'apps.hseq_management.accidentalidad',
    'apps.hseq_management.seguridad_industrial',
    'apps.hseq_management.higiene_industrial',
    'apps.hseq_management.medicina_laboral',
    'apps.hseq_management.emergencias',
    'apps.hseq_management.gestion_ambiental',
    'apps.hseq_management.calidad',
    'apps.hseq_management.mejora_continua',
    'apps.hseq_management.gestion_comites',

    # Supply Chain
    'apps.supply_chain.catalogos',
    'apps.supply_chain.gestion_proveedores',
    'apps.supply_chain.compras',
    'apps.supply_chain.almacenamiento',
    'apps.supply_chain.recepcion',
    'apps.supply_chain.liquidaciones',

    # Production Ops
    'apps.production_ops.recepcion',
    'apps.production_ops.procesamiento',
    'apps.production_ops.producto_terminado',
    'apps.production_ops.mantenimiento',

    # Logistics & Fleet
    'apps.logistics_fleet.gestion_flota',
    'apps.logistics_fleet.gestion_transporte',

    # Sales CRM
    'apps.sales_crm.gestion_clientes',
    'apps.sales_crm.pipeline_ventas',
    'apps.sales_crm.pedidos_facturacion',
    'apps.sales_crm.servicio_cliente',

    # Talent Hub — Gestión continua
    'apps.talent_hub.novedades',
    'apps.talent_hub.formacion_reinduccion',
    'apps.talent_hub.desempeno',
    'apps.talent_hub.control_tiempo',
    'apps.talent_hub.nomina',
    'apps.talent_hub.proceso_disciplinario',
    'apps.talent_hub.off_boarding',
    'apps.talent_hub.consultores_externos',

    # Administración y Finanzas
    'apps.administracion.presupuesto',
    'apps.administracion.activos_fijos',
    'apps.administracion.servicios_generales',
    'apps.tesoreria.tesoreria',

    # Contabilidad
    'apps.accounting.config_contable',
    'apps.accounting.movimientos',
    'apps.accounting.informes_contables',
    'apps.accounting.integracion',

    # Analytics
    'apps.analytics.indicadores_area',
    'apps.analytics.acciones_indicador',
    'apps.analytics.dashboard_gerencial',
    'apps.analytics.generador_informes',
    'apps.analytics.analisis_tendencias',
]

# Agregar solo las que no estén ya en INSTALLED_APPS
for app in _TESTING_EXTRA_APPS:
    if app not in INSTALLED_APPS:
        INSTALLED_APPS.append(app)

# Actualizar TENANT_APPS para que django-tenants las reconozca en tests
for app in _TESTING_EXTRA_APPS:
    if app not in TENANT_APPS:
        TENANT_APPS.append(app)
