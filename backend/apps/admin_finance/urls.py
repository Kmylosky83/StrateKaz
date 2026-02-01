"""
URLs para Admin Finance - Módulo 11
Sistema de Gestión StrateKaz

Consolidación de todas las apps del módulo:
- Tesorería
- Presupuesto
- Activos Fijos
- Servicios Generales
"""
from django.urls import path, include

app_name = 'admin_finance'

urlpatterns = [
    path('tesoreria/', include('apps.admin_finance.tesoreria.urls')),
    path('presupuesto/', include('apps.admin_finance.presupuesto.urls')),
    path('activos-fijos/', include('apps.admin_finance.activos_fijos.urls')),
    path('servicios-generales/', include('apps.admin_finance.servicios_generales.urls')),
]
