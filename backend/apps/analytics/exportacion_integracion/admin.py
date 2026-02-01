"""Admin para Exportación e Integración"""
from django.contrib import admin
from .models import ConfiguracionExportacion, LogExportacion

@admin.register(ConfiguracionExportacion)
class ConfiguracionExportacionAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo_exportacion', 'formato_archivo', 'destino', 'esta_activa', 'is_active']
    list_filter = ['tipo_exportacion', 'formato_archivo', 'destino', 'esta_activa', 'is_active']
    search_fields = ['nombre']
    ordering = ['nombre']

@admin.register(LogExportacion)
class LogExportacionAdmin(admin.ModelAdmin):
    list_display = ['configuracion', 'tipo', 'estado', 'registros_exportados', 'fecha_ejecucion', 'usuario']
    list_filter = ['tipo', 'estado', 'is_active']
    search_fields = ['configuracion__nombre']
    ordering = ['-fecha_ejecucion']
