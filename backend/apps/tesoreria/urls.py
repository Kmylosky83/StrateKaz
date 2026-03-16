"""
URLs para Tesorería — Módulo V2 (Cascada)
Sistema de Gestión StrateKaz

Sub-apps: Tesorería (flujo de caja, pagos, cobros)
"""
from django.urls import path, include

urlpatterns = [
    path('', include('apps.tesoreria.tesoreria.urls')),
]
