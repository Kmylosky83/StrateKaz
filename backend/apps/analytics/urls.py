"""
URLs del módulo Analytics — solo incluye sub-apps activas en INSTALLED_APPS.
"""
from django.apps import apps as django_apps
from django.urls import path, include

app_name = 'analytics'

urlpatterns = []

# Config Indicadores: /api/analytics/config/
if django_apps.is_installed('apps.analytics.config_indicadores'):
    urlpatterns.append(path('config/', include('apps.analytics.config_indicadores.urls')))

# Exportación: /api/analytics/exportacion/
if django_apps.is_installed('apps.analytics.exportacion_integracion'):
    urlpatterns.append(path('exportacion/', include('apps.analytics.exportacion_integracion.urls')))

# Dashboard Gerencial: /api/analytics/dashboards/
if django_apps.is_installed('apps.analytics.dashboard_gerencial'):
    urlpatterns.append(path('dashboards/', include('apps.analytics.dashboard_gerencial.urls')))

# Indicadores Área (valores, acciones, alertas): /api/analytics/
if django_apps.is_installed('apps.analytics.indicadores_area'):
    urlpatterns.append(path('', include('apps.analytics.indicadores_area.urls')))

# Análisis de Tendencias: /api/analytics/analisis/
if django_apps.is_installed('apps.analytics.analisis_tendencias'):
    urlpatterns.append(path('analisis/', include('apps.analytics.analisis_tendencias.urls')))

# Generador de Informes: /api/analytics/informes/
if django_apps.is_installed('apps.analytics.generador_informes'):
    urlpatterns.append(path('informes/', include('apps.analytics.generador_informes.urls')))

# Planes de Acción KPI: /api/analytics/planes-accion/
if django_apps.is_installed('apps.analytics.acciones_indicador'):
    urlpatterns.append(path('planes-accion/', include('apps.analytics.acciones_indicador.urls')))
