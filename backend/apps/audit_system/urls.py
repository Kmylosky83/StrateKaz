"""
URLs principales del módulo Audit System
"""
from django.urls import path, include

app_name = 'audit_system'

urlpatterns = [
    # Logs del Sistema
    path('logs/', include('apps.audit_system.logs_sistema.urls')),

    # Centro de Notificaciones
    path('notificaciones/', include('apps.audit_system.centro_notificaciones.urls')),

    # Configuración de Alertas
    path('alertas/', include('apps.audit_system.config_alertas.urls')),

    # Tareas y Recordatorios
    path('tareas/', include('apps.audit_system.tareas_recordatorios.urls')),
]
