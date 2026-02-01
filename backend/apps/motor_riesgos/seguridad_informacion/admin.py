from django.contrib import admin
from .models import (
    ActivoInformacion,
    Amenaza,
    Vulnerabilidad,
    RiesgoSeguridad,
    ControlSeguridad,
    IncidenteSeguridad
)


@admin.register(ActivoInformacion)
class ActivoInformacionAdmin(admin.ModelAdmin):
    list_display = [
        'codigo',
        'nombre',
        'tipo',
        'clasificacion',
        'propietario',
        'criticidad',
        'is_active',
        'empresa_id',
    ]
    list_filter = ['tipo', 'clasificacion', 'is_active', 'empresa_id']
    search_fields = ['codigo', 'nombre', 'descripcion']
    readonly_fields = ['criticidad', 'created_at', 'updated_at']
    fieldsets = [
        ('Información Básica', {
            'fields': ['codigo', 'nombre', 'descripcion', 'tipo']
        }),
        ('Responsabilidad', {
            'fields': ['propietario', 'custodio', 'ubicacion']
        }),
        ('Clasificación y Valoración', {
            'fields': [
                'clasificacion',
                'valor_confidencialidad',
                'valor_integridad',
                'valor_disponibilidad',
                'criticidad',
            ]
        }),
        ('Otros', {
            'fields': ['is_active', 'empresa_id', 'created_at', 'updated_at']
        }),
    ]


@admin.register(Amenaza)
class AmenazaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'probabilidad_ocurrencia', 'is_active']
    list_filter = ['tipo', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Vulnerabilidad)
class VulnerabilidadAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'activo', 'facilidad_explotacion', 'is_active', 'empresa_id']
    list_filter = ['is_active', 'facilidad_explotacion', 'empresa_id']
    search_fields = ['codigo', 'descripcion', 'activo__codigo']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RiesgoSeguridad)
class RiesgoSeguridadAdmin(admin.ModelAdmin):
    list_display = [
        'activo',
        'amenaza',
        'probabilidad',
        'impacto',
        'nivel_riesgo',
        'aceptabilidad',
        'estado',
        'empresa_id',
    ]
    list_filter = ['nivel_riesgo', 'aceptabilidad', 'estado', 'empresa_id']
    search_fields = ['escenario_riesgo', 'activo__nombre', 'amenaza__nombre']
    readonly_fields = ['nivel_riesgo', 'nivel_residual', 'created_at', 'updated_at']
    fieldsets = [
        ('Identificación', {
            'fields': ['activo', 'amenaza', 'vulnerabilidad', 'escenario_riesgo']
        }),
        ('Evaluación Inherente', {
            'fields': ['probabilidad', 'impacto', 'nivel_riesgo']
        }),
        ('Controles', {
            'fields': ['controles_existentes']
        }),
        ('Evaluación Residual', {
            'fields': ['probabilidad_residual', 'impacto_residual', 'nivel_residual']
        }),
        ('Tratamiento', {
            'fields': ['aceptabilidad', 'responsable_tratamiento', 'estado']
        }),
        ('Otros', {
            'fields': ['empresa_id', 'created_at', 'updated_at']
        }),
    ]


@admin.register(ControlSeguridad)
class ControlSeguridadAdmin(admin.ModelAdmin):
    list_display = [
        'control_iso',
        'riesgo',
        'tipo_control',
        'estado_implementacion',
        'efectividad',
        'responsable',
        'empresa_id',
    ]
    list_filter = ['tipo_control', 'estado_implementacion', 'empresa_id']
    search_fields = ['control_iso', 'descripcion']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(IncidenteSeguridad)
class IncidenteSeguridadAdmin(admin.ModelAdmin):
    list_display = [
        'fecha_deteccion',
        'tipo_incidente',
        'severidad',
        'estado',
        'reportado_por',
        'empresa_id',
    ]
    list_filter = ['tipo_incidente', 'severidad', 'estado', 'empresa_id']
    search_fields = ['descripcion', 'impacto_real']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = [
        ('Información del Incidente', {
            'fields': [
                'fecha_deteccion',
                'descripcion',
                'activos_afectados',
                'tipo_incidente',
                'severidad',
                'impacto_real',
            ]
        }),
        ('Respuesta', {
            'fields': [
                'acciones_contencion',
                'acciones_erradicacion',
                'lecciones_aprendidas',
            ]
        }),
        ('Estado', {
            'fields': ['estado', 'reportado_por']
        }),
        ('Otros', {
            'fields': ['empresa_id', 'created_at', 'updated_at']
        }),
    ]
