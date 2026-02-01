"""
Admin para logs_sistema - audit_system
"""
from django.contrib import admin
from .models import (
    ConfiguracionAuditoria,
    LogAcceso,
    LogCambio,
    LogConsulta
)


@admin.register(ConfiguracionAuditoria)
class ConfiguracionAuditoriaAdmin(admin.ModelAdmin):
    """Admin para ConfiguracionAuditoria"""

    list_display = [
        'modulo',
        'modelo',
        'auditar_creacion',
        'auditar_modificacion',
        'auditar_eliminacion',
        'auditar_consulta',
        'dias_retencion',
        'is_active'
    ]
    list_filter = ['modulo', 'is_active', 'auditar_consulta']
    search_fields = ['modulo', 'modelo']
    ordering = ['modulo', 'modelo']


@admin.register(LogAcceso)
class LogAccesoAdmin(admin.ModelAdmin):
    """Admin para LogAcceso (solo lectura)"""

    list_display = [
        'created_at',
        'usuario',
        'tipo_evento',
        'ip_address',
        'fue_exitoso',
        'dispositivo'
    ]
    list_filter = ['tipo_evento', 'fue_exitoso', 'created_at']
    search_fields = ['usuario__first_name', 'usuario__last_name', 'ip_address']
    date_hierarchy = 'created_at'
    readonly_fields = [
        'usuario',
        'tipo_evento',
        'ip_address',
        'user_agent',
        'ubicacion',
        'dispositivo',
        'navegador',
        'fue_exitoso',
        'mensaje_error',
        'created_at'
    ]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(LogCambio)
class LogCambioAdmin(admin.ModelAdmin):
    """Admin para LogCambio (solo lectura)"""

    list_display = [
        'created_at',
        'usuario',
        'content_type',
        'object_repr',
        'accion'
    ]
    list_filter = ['accion', 'content_type', 'created_at']
    search_fields = ['object_repr', 'usuario__first_name', 'usuario__last_name']
    date_hierarchy = 'created_at'
    readonly_fields = [
        'usuario',
        'content_type',
        'object_id',
        'object_repr',
        'accion',
        'cambios',
        'ip_address',
        'created_at'
    ]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(LogConsulta)
class LogConsultaAdmin(admin.ModelAdmin):
    """Admin para LogConsulta (solo lectura)"""

    list_display = [
        'created_at',
        'usuario',
        'modulo',
        'registros_accedidos',
        'fue_exportacion',
        'formato_exportacion'
    ]
    list_filter = ['modulo', 'fue_exportacion', 'formato_exportacion', 'created_at']
    search_fields = ['modulo', 'endpoint', 'usuario__first_name', 'usuario__last_name']
    date_hierarchy = 'created_at'
    readonly_fields = [
        'usuario',
        'modulo',
        'endpoint',
        'parametros',
        'registros_accedidos',
        'fue_exportacion',
        'formato_exportacion',
        'ip_address',
        'created_at'
    ]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
