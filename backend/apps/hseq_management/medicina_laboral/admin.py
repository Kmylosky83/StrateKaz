"""
Admin para Medicina Laboral - HSEQ Management
"""
from django.contrib import admin
from .models import (
    TipoExamen,
    ExamenMedico,
    RestriccionMedica,
    ProgramaVigilancia,
    CasoVigilancia,
    DiagnosticoOcupacional,
    EstadisticaMedica
)


@admin.register(TipoExamen)
class TipoExamenAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'periodicidad', 'is_active']
    list_filter = ['tipo', 'periodicidad', 'is_active']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ExamenMedico)
class ExamenMedicoAdmin(admin.ModelAdmin):
    list_display = ['numero_examen', 'tipo_examen', 'empresa_id', 'fecha_programada', 'concepto_aptitud', 'estado']
    list_filter = ['empresa_id', 'tipo_examen', 'estado', 'concepto_aptitud']
    search_fields = ['numero_examen']
    date_hierarchy = 'fecha_programada'
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RestriccionMedica)
class RestriccionMedicaAdmin(admin.ModelAdmin):
    list_display = ['codigo_restriccion', 'empresa_id', 'tipo_restriccion', 'categoria', 'estado', 'fecha_inicio']
    list_filter = ['empresa_id', 'tipo_restriccion', 'categoria', 'estado']
    search_fields = ['codigo_restriccion', 'descripcion']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ProgramaVigilancia)
class ProgramaVigilanciaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'estado', 'empresa_id']
    list_filter = ['empresa_id', 'tipo', 'estado']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CasoVigilancia)
class CasoVigilanciaAdmin(admin.ModelAdmin):
    list_display = ['numero_caso', 'programa', 'empresa_id', 'severidad', 'estado', 'fecha_apertura']
    list_filter = ['empresa_id', 'programa', 'severidad', 'estado']
    search_fields = ['numero_caso', 'descripcion_caso']
    date_hierarchy = 'fecha_apertura'
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DiagnosticoOcupacional)
class DiagnosticoOcupacionalAdmin(admin.ModelAdmin):
    list_display = ['codigo_cie10', 'nombre', 'origen', 'is_active']
    list_filter = ['origen', 'is_active', 'requiere_vigilancia']
    search_fields = ['codigo_cie10', 'nombre']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EstadisticaMedica)
class EstadisticaMedicaAdmin(admin.ModelAdmin):
    list_display = ['empresa_id', 'anio', 'mes', 'examenes_realizados', 'casos_vigilancia_activos']
    list_filter = ['empresa_id', 'anio']
    readonly_fields = ['created_at', 'updated_at']
