"""
URLs principales del módulo Audit System
"""
from django.apps import apps
from django.urls import path, include

app_name = 'audit_system'

urlpatterns = [
    # Logs del Sistema
    path('logs/', include('apps.audit_system.logs_sistema.urls')),

    # Configuración de Alertas
    path('alertas/', include('apps.audit_system.config_alertas.urls')),

    # Tareas y Recordatorios
    path('tareas/', include('apps.audit_system.tareas_recordatorios.urls')),
]

# Centro de Notificaciones — solo si la app está habilitada en TENANT_APPS
if apps.is_installed('apps.audit_system.centro_notificaciones'):
    urlpatterns.append(
        path('notificaciones/', include('apps.audit_system.centro_notificaciones.urls')),
    )
