"""
URLs del módulo Gestión Estratégica - Nivel 1: Dirección Estratégica

Este módulo agrupa las sub-apps:
- organizacion: Estructura organizacional (Áreas, Cargos, Documentos)
- configuracion: Configuración del sistema (Empresa, Sedes, Integraciones)
- identidad: Identidad corporativa (Misión, Visión, Valores, Política)
- contexto: Contexto Organizacional (DOFA, PESTEL, Porter, TOWS, Partes Interesadas - ISO 4.1, 4.2)
- planeacion: Planeación estratégica (Plan, Objetivos, Mapa BSC)
- gestion_proyectos: Gestión de Proyectos (PMI/PMBOK)
- revision_direccion: Revisión por la Dirección (ISO 9001:2015 - 9.3)
- planificacion_sistema: Planificación del Sistema (Plan Anual, Objetivos BSC, Programas)

Endpoints a nivel de módulo (rutas canónicas):
- /corporate-identity/ - Identidad corporativa
- /corporate-values/ - Valores corporativos
- /strategic-plans/ - Planes estratégicos
- /strategic-objectives/ - Objetivos estratégicos
- /strategic-stats/ - Estadísticas de gestión estratégica
"""
from django.apps import apps as django_apps
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# ViewSets locales del módulo Gestión Estratégica
# NOTA v4.0: Tab 1/Tab 2 ViewSets movidos a sub-apps (identidad/, planeacion/)
from .viewsets_strategic import (
    StrategicStatsViewSet,
)

app_name = 'gestion_estrategica'

# Router para ViewSets a nivel de módulo
router = DefaultRouter()

# NOTA v4.0: Tab 1 endpoints activos en /api/identidad/ (identidad sub-app)
# NOTA v4.0: Tab 2 endpoints activos en /api/planeacion/ (planeacion sub-app)

# Estadísticas de Gestión Estratégica
router.register(r'strategic-stats', StrategicStatsViewSet, basename='strategic-stats')

urlpatterns = [
    # Endpoints canónicos a nivel de módulo (router)
    path('', include(router.urls)),

    # Sub-apps del módulo Gestión Estratégica — CASCADA LEVEL 10 (activas)
    path('organizacion/', include('apps.gestion_estrategica.organizacion.urls')),
    path('configuracion/', include('apps.gestion_estrategica.configuracion.urls')),
    path('identidad/', include('apps.gestion_estrategica.identidad.urls')),
    path('contexto/', include('apps.gestion_estrategica.contexto.urls')),

    # CASCADA LEVEL 15: GESTIÓN DOCUMENTAL (guard condicional)
    *([path('gestion-documental/', include('apps.gestion_estrategica.gestion_documental.urls'))]
      if django_apps.is_installed('apps.gestion_estrategica.gestion_documental') else []),

    # CASCADA LEVEL 20+ (descomentar al activar cada nivel)
    # path('planeacion/', include('apps.gestion_estrategica.planeacion.urls')),
    # path('proyectos/', include('apps.gestion_estrategica.gestion_proyectos.urls')),
    # path('revision-direccion/', include('apps.gestion_estrategica.revision_direccion.urls')),
    # path('planificacion-sistema/', include('apps.gestion_estrategica.planificacion_sistema.urls')),
    # path('mejora-continua/', include('apps.hseq_management.mejora_continua.urls')),
]
