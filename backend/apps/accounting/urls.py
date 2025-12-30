"""
URLs para Accounting - Módulo 12 (ACTIVABLE)
Sistema de Gestión Grasas y Huesos del Norte

Consolidación de todas las apps del módulo contable:
- config_contable: Configuración del plan de cuentas
- movimientos: Comprobantes y asientos contables
- informes_contables: Reportes financieros
- integracion: Integración con otros módulos
"""
from django.urls import path, include

app_name = 'accounting'

urlpatterns = [
    path('config/', include('apps.accounting.config_contable.urls')),
    path('movimientos/', include('apps.accounting.movimientos.urls')),
    path('informes/', include('apps.accounting.informes_contables.urls')),
    path('integracion/', include('apps.accounting.integracion.urls')),
]
