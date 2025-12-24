"""
URLs del módulo Gestión Estratégica - Nivel 1: Dirección Estratégica

Este módulo agrupa las sub-apps:
- organizacion: Estructura organizacional (Áreas, Cargos, Documentos)
- configuracion: Configuración del sistema (Empresa, Sedes, Integraciones)
- identidad: Identidad corporativa (Misión, Visión, Valores, Política)
- planeacion: Planeación estratégica (Plan, Objetivos, Mapa BSC)
"""
from django.urls import path, include

app_name = 'gestion_estrategica'

urlpatterns = [
    # Sub-apps del módulo Gestión Estratégica
    path('organizacion/', include('apps.gestion_estrategica.organizacion.urls')),
    path('configuracion/', include('apps.gestion_estrategica.configuracion.urls')),
    path('identidad/', include('apps.gestion_estrategica.identidad.urls')),
    path('planeacion/', include('apps.gestion_estrategica.planeacion.urls')),
]
