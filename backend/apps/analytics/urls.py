"""
URLs principales del módulo Analytics
======================================

Incluye todas las sub-apps:
Semana 23:
- config_indicadores: /config/
- dashboard_gerencial: /dashboards/
- indicadores_area: / (raíz para valores, acciones, alertas)

Semana 24:
- analisis_tendencias: /analisis/
- generador_informes: /informes/
- acciones_indicador: /planes-accion/
- exportacion: /exportacion/
"""
from django.urls import path, include

app_name = 'analytics'

urlpatterns = [
    # ===== SEMANA 23 =====
    # Config Indicadores: /api/analytics/config/
    path('config/', include('apps.analytics.config_indicadores.urls')),

    # Dashboard Gerencial: /api/analytics/dashboards/
    path('dashboards/', include('apps.analytics.dashboard_gerencial.urls')),

    # Indicadores Área (valores, acciones, alertas): /api/analytics/
    path('', include('apps.analytics.indicadores_area.urls')),

    # ===== SEMANA 24 =====
    # Análisis de Tendencias: /api/analytics/analisis/
    path('analisis/', include('apps.analytics.analisis_tendencias.urls')),

    # Generador de Informes: /api/analytics/informes/
    path('informes/', include('apps.analytics.generador_informes.urls')),

    # Planes de Acción KPI: /api/analytics/planes-accion/
    path('planes-accion/', include('apps.analytics.acciones_indicador.urls')),

    # Exportación: /api/analytics/exportacion/
    path('exportacion/', include('apps.analytics.exportacion_integracion.urls')),
]
