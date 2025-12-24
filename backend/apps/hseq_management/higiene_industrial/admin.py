"""
Admin para Higiene Industrial - HSEQ Management
"""
from django.contrib import admin
from .models import (
    TipoAgente,
    AgenteRiesgo,
    GrupoExposicionSimilar,
    PuntoMedicion,
    MedicionAmbiental,
    ControlExposicion,
    MonitoreoBiologico
)


@admin.register(TipoAgente)
class TipoAgenteAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria', 'empresa_id', 'is_active']
    list_filter = ['categoria', 'is_active', 'empresa_id']
    search_fields = ['codigo', 'nombre']
    ordering = ['categoria', 'nombre']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AgenteRiesgo)
class AgenteRiesgoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_agente', 'empresa_id', 'is_active']
    list_filter = ['empresa_id', 'tipo_agente', 'is_active']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(GrupoExposicionSimilar)
class GrupoExposicionSimilarAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'empresa_id', 'numero_trabajadores', 'is_active']
    list_filter = ['empresa_id', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PuntoMedicion)
class PuntoMedicionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'area', 'empresa_id', 'is_active']
    list_filter = ['empresa_id', 'is_active']
    search_fields = ['codigo', 'nombre', 'area']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MedicionAmbiental)
class MedicionAmbientalAdmin(admin.ModelAdmin):
    list_display = ['numero_medicion', 'agente_riesgo', 'punto_medicion', 'fecha_medicion', 'valor_medido', 'cumplimiento']
    list_filter = ['empresa_id', 'cumplimiento', 'estado']
    search_fields = ['numero_medicion']
    date_hierarchy = 'fecha_medicion'
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ControlExposicion)
class ControlExposicionAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'agente_riesgo', 'tipo_control', 'empresa_id', 'estado']
    list_filter = ['empresa_id', 'tipo_control', 'estado', 'jerarquia_control']
    search_fields = ['codigo', 'nombre', 'descripcion']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MonitoreoBiologico)
class MonitoreoBiologicoAdmin(admin.ModelAdmin):
    list_display = ['numero_examen', 'trabajador_nombre', 'tipo_examen', 'fecha_examen', 'resultado']
    list_filter = ['empresa_id', 'tipo_examen', 'resultado']
    search_fields = ['numero_examen', 'trabajador_nombre', 'trabajador_identificacion']
    date_hierarchy = 'fecha_examen'
    readonly_fields = ['created_at', 'updated_at']
