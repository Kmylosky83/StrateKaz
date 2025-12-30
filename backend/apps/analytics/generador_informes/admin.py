"""
Admin para Generador de Informes - Analytics
"""
from django.contrib import admin
from .models import PlantillaInforme, InformeDinamico, ProgramacionInforme, HistorialInforme


@admin.register(PlantillaInforme)
class PlantillaInformeAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_informe', 'formato_salida', 'es_predefinida', 'is_active']
    list_filter = ['tipo_informe', 'formato_salida', 'es_predefinida', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['tipo_informe', 'codigo']


@admin.register(InformeDinamico)
class InformeDinamicoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'plantilla', 'estado', 'fecha_generacion', 'generado_por', 'is_active']
    list_filter = ['estado', 'is_active']
    search_fields = ['nombre', 'plantilla__nombre']
    ordering = ['-fecha_generacion']


@admin.register(ProgramacionInforme)
class ProgramacionInformeAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'plantilla', 'frecuencia', 'esta_activa', 'proxima_ejecucion', 'is_active']
    list_filter = ['frecuencia', 'esta_activa', 'is_active']
    search_fields = ['nombre', 'plantilla__nombre']
    ordering = ['proxima_ejecucion']


@admin.register(HistorialInforme)
class HistorialInformeAdmin(admin.ModelAdmin):
    list_display = ['programacion', 'fecha_ejecucion', 'fue_exitoso', 'fue_enviado', 'is_active']
    list_filter = ['fue_exitoso', 'fue_enviado', 'is_active']
    search_fields = ['programacion__nombre']
    ordering = ['-fecha_ejecucion']
