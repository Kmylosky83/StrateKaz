"""
Admin para Riesgos de Procesos - Motor de Riesgos
=================================================

Configuración del admin Django para los modelos de riesgos de procesos ISO 31000.
"""
from django.contrib import admin
from .models import (
    CategoriaRiesgo,
    RiesgoProceso,
    TratamientoRiesgo,
    ControlOperacional,
    Oportunidad
)


class TratamientoRiesgoInline(admin.TabularInline):
    """Inline para tratamientos dentro de un riesgo."""
    model = TratamientoRiesgo
    extra = 1
    fields = ['tipo', 'descripcion', 'estado', 'responsable', 'fecha_implementacion']


class ControlOperacionalInline(admin.TabularInline):
    """Inline para controles dentro de un riesgo."""
    model = ControlOperacional
    extra = 1
    fields = ['nombre', 'tipo_control', 'frecuencia', 'efectividad', 'responsable']


@admin.register(CategoriaRiesgo)
class CategoriaRiesgoAdmin(admin.ModelAdmin):
    """Admin para Categorías de Riesgo."""
    list_display = ['codigo', 'nombre', 'color', 'orden', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'codigo']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información General', {
            'fields': ('codigo', 'nombre', 'descripcion', 'color', 'orden')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(RiesgoProceso)
class RiesgoProcesoAdmin(admin.ModelAdmin):
    """Admin para Riesgos de Proceso."""
    list_display = [
        'codigo', 'nombre', 'tipo', 'categoria', 'estado',
        'nivel_inherente_display', 'nivel_residual_display',
        'responsable', 'empresa', 'created_at'
    ]
    list_filter = ['tipo', 'estado', 'categoria', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion', 'proceso', 'causa_raiz', 'consecuencia']
    readonly_fields = [
        'created_at', 'updated_at', 'created_by', 'updated_by',
        'nivel_inherente', 'nivel_residual',
        'interpretacion_inherente', 'interpretacion_residual',
        'reduccion_riesgo_porcentaje'
    ]
    date_hierarchy = 'created_at'
    inlines = [TratamientoRiesgoInline, ControlOperacionalInline]

    fieldsets = (
        ('Identificación', {
            'fields': ('empresa', 'codigo', 'nombre', 'descripcion')
        }),
        ('Clasificación', {
            'fields': ('tipo', 'categoria', 'proceso')
        }),
        ('Análisis de Causas', {
            'fields': ('causa_raiz', 'consecuencia')
        }),
        ('Evaluación Inherente (Sin Controles)', {
            'fields': (
                ('probabilidad_inherente', 'impacto_inherente'),
                ('nivel_inherente', 'interpretacion_inherente')
            )
        }),
        ('Evaluación Residual (Con Controles)', {
            'fields': (
                ('probabilidad_residual', 'impacto_residual'),
                ('nivel_residual', 'interpretacion_residual'),
                'reduccion_riesgo_porcentaje'
            )
        }),
        ('Responsable y Estado', {
            'fields': ('responsable', 'estado')
        }),
        ('Estado del Registro', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def nivel_inherente_display(self, obj):
        return f"{obj.nivel_inherente} ({obj.interpretacion_inherente})"
    nivel_inherente_display.short_description = 'Nivel Inherente'

    def nivel_residual_display(self, obj):
        return f"{obj.nivel_residual} ({obj.interpretacion_residual})"
    nivel_residual_display.short_description = 'Nivel Residual'


@admin.register(TratamientoRiesgo)
class TratamientoRiesgoAdmin(admin.ModelAdmin):
    """Admin para Tratamientos de Riesgo."""
    list_display = [
        'riesgo', 'tipo', 'descripcion_corta', 'estado',
        'responsable', 'fecha_implementacion', 'efectividad', 'empresa'
    ]
    list_filter = ['tipo', 'estado', 'is_active']
    search_fields = ['descripcion', 'control_propuesto']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'riesgo', 'tipo')
        }),
        ('Tratamiento', {
            'fields': ('descripcion', 'control_propuesto')
        }),
        ('Planificación', {
            'fields': ('responsable', 'fecha_implementacion', 'estado', 'efectividad')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def descripcion_corta(self, obj):
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'


@admin.register(ControlOperacional)
class ControlOperacionalAdmin(admin.ModelAdmin):
    """Admin para Controles Operacionales."""
    list_display = [
        'riesgo', 'nombre', 'tipo_control', 'frecuencia',
        'efectividad', 'responsable', 'fecha_ultima_evaluacion', 'empresa'
    ]
    list_filter = ['tipo_control', 'efectividad', 'is_active']
    search_fields = ['nombre', 'descripcion', 'documentacion']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'riesgo', 'nombre', 'descripcion')
        }),
        ('Configuración del Control', {
            'fields': ('tipo_control', 'frecuencia', 'documentacion')
        }),
        ('Evaluación', {
            'fields': ('responsable', 'efectividad', 'fecha_ultima_evaluacion')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Oportunidad)
class OportunidadAdmin(admin.ModelAdmin):
    """Admin para Oportunidades."""
    list_display = [
        'codigo', 'nombre', 'fuente', 'impacto_potencial',
        'viabilidad', 'estado', 'responsable', 'empresa'
    ]
    list_filter = ['estado', 'fuente', 'impacto_potencial', 'viabilidad', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion', 'recursos_requeridos']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Identificación', {
            'fields': ('empresa', 'codigo', 'nombre', 'descripcion', 'fuente')
        }),
        ('Evaluación', {
            'fields': ('impacto_potencial', 'viabilidad', 'recursos_requeridos')
        }),
        ('Seguimiento', {
            'fields': ('responsable', 'estado')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
