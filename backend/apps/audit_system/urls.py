"""
URLs principales del módulo Audit System
"""
from django.apps import apps
from django.urls import path, include

app_name = 'audit_system'

urlpatterns = []

# Logs del Sistema
if apps.is_installed('apps.audit_system.logs_sistema'):
    urlpatterns.append(
        path('logs/', include('apps.audit_system.logs_sistema.urls')),
    )

# Configuración de Alertas
if apps.is_installed('apps.audit_system.config_alertas'):
    urlpatterns.append(
        path('alertas/', include('apps.audit_system.config_alertas.urls')),
    )

# Centro de Notificaciones
if apps.is_installed('apps.audit_system.centro_notificaciones'):
    urlpatterns.append(
        path('notificaciones/', include('apps.audit_system.centro_notificaciones.urls')),
    )

# Tareas y Recordatorios
if apps.is_installed('apps.audit_system.tareas_recordatorios'):
    urlpatterns.append(
        path('tareas/', include('apps.audit_system.tareas_recordatorios.urls')),
    )
