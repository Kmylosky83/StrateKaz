"""
Admin para Config Indicadores - Analytics
"""
from django.contrib import admin
from .models import CatalogoKPI, FichaTecnicaKPI, MetaKPI, ConfiguracionSemaforo


@admin.register(CatalogoKPI)
class CatalogoKPIAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria', 'tipo_indicador', 'frecuencia_medicion', 'is_active']
    list_filter = ['categoria', 'tipo_indicador', 'frecuencia_medicion', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['categoria', 'codigo']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(FichaTecnicaKPI)
class FichaTecnicaKPIAdmin(admin.ModelAdmin):
    list_display = ['kpi', 'responsable_medicion', 'responsable_analisis', 'fecha_inicio_medicion']
    list_filter = ['is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MetaKPI)
class MetaKPIAdmin(admin.ModelAdmin):
    list_display = ['kpi', 'periodo_inicio', 'periodo_fin', 'valor_meta', 'is_active']
    list_filter = ['is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre']
    ordering = ['-periodo_inicio']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ConfiguracionSemaforo)
class ConfiguracionSemaforoAdmin(admin.ModelAdmin):
    list_display = ['kpi', 'umbral_verde_min', 'umbral_amarillo_min', 'umbral_rojo_min', 'is_active']
    list_filter = ['is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre']
    readonly_fields = ['created_at', 'updated_at']
