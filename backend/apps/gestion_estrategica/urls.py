"""
URLs del módulo Gestión Estratégica - Nivel 1: Dirección Estratégica

Este módulo agrupa las sub-apps:
- organizacion: Estructura organizacional (Áreas, Cargos, Documentos)
- configuracion: Configuración del sistema (Empresa, Sedes, Integraciones)
- identidad: Identidad corporativa (Misión, Visión, Valores, Política)
- planeacion: Planeación estratégica (Plan, Objetivos, Mapa BSC)
- gestion_proyectos: Gestión de Proyectos (PMI/PMBOK)
- revision_direccion: Revisión por la Dirección (ISO 9001:2015 - 9.3)
"""
from django.urls import path, include

app_name = 'gestion_estrategica'

urlpatterns = [
    # Sub-apps del módulo Gestión Estratégica
    path('organizacion/', include('apps.gestion_estrategica.organizacion.urls')),
    path('configuracion/', include('apps.gestion_estrategica.configuracion.urls')),
    path('identidad/', include('apps.gestion_estrategica.identidad.urls')),
    path('planeacion/', include('apps.gestion_estrategica.planeacion.urls')),
    path('proyectos/', include('apps.gestion_estrategica.gestion_proyectos.urls')),
    path('revision-direccion/', include('apps.gestion_estrategica.revision_direccion.urls')),
]
