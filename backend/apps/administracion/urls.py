"""
URLs para Administración — Módulo V2 (Cascada)
Sistema de Gestión StrateKaz

Sub-apps: Presupuesto, Activos Fijos, Servicios Generales
"""
from django.urls import path, include

app_name = 'administracion'

urlpatterns = [
    path('presupuesto/', include('apps.administracion.presupuesto.urls')),
    path('activos-fijos/', include('apps.administracion.activos_fijos.urls')),
    path('servicios-generales/', include('apps.administracion.servicios_generales.urls')),
]
