"""
URLs del módulo Gestión Estratégica - Nivel 1: Dirección Estratégica

Este módulo agrupa las sub-apps:
- organizacion: Estructura organizacional (Áreas, Cargos, Documentos)
- configuracion: Configuración del sistema (Empresa, Sedes, Integraciones)
- identidad: Identidad corporativa (Misión, Visión, Valores, Política)
- planeacion: Planeación estratégica (Plan, Objetivos, Mapa BSC)
- gestion_proyectos: Gestión de Proyectos (PMI/PMBOK)
- revision_direccion: Revisión por la Dirección (ISO 9001:2015 - 9.3)

Endpoints a nivel de módulo (rutas canónicas):
- /corporate-identity/ - Identidad corporativa
- /corporate-values/ - Valores corporativos
- /strategic-plans/ - Planes estratégicos
- /strategic-objectives/ - Objetivos estratégicos
- /strategic-stats/ - Estadísticas de gestión estratégica
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# ViewSets locales del módulo Gestión Estratégica
from .viewsets_strategic import (
    CorporateIdentityViewSet,
    CorporateValueViewSet,
    StrategicPlanViewSet,
    StrategicObjectiveViewSet,
    StrategicStatsViewSet,
)

app_name = 'gestion_estrategica'

# Router para ViewSets a nivel de módulo
router = DefaultRouter()

# Endpoints canónicos de Identidad Corporativa (Tab 1)
router.register(r'corporate-identity', CorporateIdentityViewSet, basename='corporate-identity')
router.register(r'corporate-values', CorporateValueViewSet, basename='corporate-values')

# Endpoints canónicos de Planeación Estratégica (Tab 2)
router.register(r'strategic-plans', StrategicPlanViewSet, basename='strategic-plans')
router.register(r'strategic-objectives', StrategicObjectiveViewSet, basename='strategic-objectives')

# Estadísticas de Gestión Estratégica
router.register(r'strategic-stats', StrategicStatsViewSet, basename='strategic-stats')

urlpatterns = [
    # Endpoints canónicos a nivel de módulo (router)
    path('', include(router.urls)),

    # Sub-apps del módulo Gestión Estratégica
    path('organizacion/', include('apps.gestion_estrategica.organizacion.urls')),
    path('configuracion/', include('apps.gestion_estrategica.configuracion.urls')),
    path('identidad/', include('apps.gestion_estrategica.identidad.urls')),
    path('planeacion/', include('apps.gestion_estrategica.planeacion.urls')),
    path('planeacion/contexto/', include('apps.gestion_estrategica.planeacion.contexto.urls')),
    path('proyectos/', include('apps.gestion_estrategica.gestion_proyectos.urls')),
    path('revision-direccion/', include('apps.gestion_estrategica.revision_direccion.urls')),
]
