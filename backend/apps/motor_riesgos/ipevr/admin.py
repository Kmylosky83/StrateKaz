"""
Admin para IPEVR - GTC-45
"""
from django.contrib import admin
from .models import ClasificacionPeligro, Peligro, MatrizIPEVR, ControlPropuesto


@admin.register(ClasificacionPeligro)
class ClasificacionPeligroAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'tipo', 'nombre', 'is_active', 'created_at']
    list_filter = ['tipo', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['tipo', 'codigo']


@admin.register(Peligro)
class PeligroAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'clasificacion', 'descripcion', 'fuente', 'empresa_id']
    list_filter = ['clasificacion__tipo', 'clasificacion', 'empresa_id']
    search_fields = ['codigo', 'descripcion', 'fuente', 'efectos']
    raw_id_fields = ['clasificacion', 'created_by']


@admin.register(MatrizIPEVR)
class MatrizIPEVRAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'proceso', 'actividad', 'peligro',
        'nivel_riesgo', 'interpretacion_nr', 'aceptabilidad',
        'estado', 'empresa_id'
    ]
    list_filter = [
        'estado', 'interpretacion_nr', 'aceptabilidad',
        'rutinaria', 'empresa_id'
    ]
    search_fields = ['codigo', 'proceso', 'zona_lugar', 'actividad', 'tarea']
    readonly_fields = [
        'nivel_probabilidad', 'nivel_riesgo',
        'interpretacion_nr', 'aceptabilidad',
        'created_at', 'updated_at'
    ]
    raw_id_fields = ['peligro', 'created_by']
    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'proceso', 'zona_lugar', 'actividad', 'tarea', 'rutinaria')
        }),
        ('Peligro', {
            'fields': ('peligro',)
        }),
        ('Controles Existentes', {
            'fields': ('control_fuente', 'control_medio', 'control_individuo')
        }),
        ('Evaluación GTC-45', {
            'fields': (
                'nivel_deficiencia', 'nivel_exposicion', 'nivel_probabilidad',
                'nivel_consecuencia', 'nivel_riesgo', 'interpretacion_nr', 'aceptabilidad'
            )
        }),
        ('Información Adicional', {
            'fields': ('num_expuestos', 'peor_consecuencia', 'requisito_legal')
        }),
        ('Gestión', {
            'fields': ('estado', 'fecha_evaluacion', 'proxima_revision')
        }),
        ('Multi-tenancy', {
            'fields': ('empresa_id',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ControlPropuesto)
class ControlPropuestoAdmin(admin.ModelAdmin):
    list_display = [
        'matriz', 'tipo_control', 'descripcion',
        'responsable', 'fecha_implementacion', 'estado', 'empresa_id'
    ]
    list_filter = ['tipo_control', 'estado', 'empresa_id']
    search_fields = ['descripcion', 'matriz__codigo']
    raw_id_fields = ['matriz', 'responsable']
