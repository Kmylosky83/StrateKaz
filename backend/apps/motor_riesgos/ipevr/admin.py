"""
Admin para IPEVR - Identificacion de Peligros, Evaluacion y Valoracion de Riesgos
=================================================================================

Configuracion del admin Django para los modelos de IPEVR segun GTC-45.
"""
from django.contrib import admin
from .models import ClasificacionPeligro, PeligroGTC45, MatrizIPEVR, ControlSST


class PeligroGTC45Inline(admin.TabularInline):
    """Inline para peligros dentro de una clasificacion."""
    model = PeligroGTC45
    extra = 1
    fields = ['codigo', 'nombre', 'descripcion', 'orden']


class ControlSSTInline(admin.TabularInline):
    """Inline para controles dentro de una matriz IPEVR."""
    model = ControlSST
    extra = 1
    fields = ['tipo_control', 'descripcion', 'responsable', 'estado', 'efectividad']


@admin.register(ClasificacionPeligro)
class ClasificacionPeligroAdmin(admin.ModelAdmin):
    """Admin para Clasificaciones de Peligros."""
    list_display = ['codigo', 'nombre', 'categoria', 'color', 'orden', 'is_active', 'created_at']
    list_filter = ['categoria', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['orden', 'categoria', 'codigo']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [PeligroGTC45Inline]

    fieldsets = (
        ('Informacion General', {
            'fields': ('codigo', 'nombre', 'categoria', 'descripcion')
        }),
        ('Visualizacion', {
            'fields': ('color', 'icono', 'orden')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PeligroGTC45)
class PeligroGTC45Admin(admin.ModelAdmin):
    """Admin para Peligros GTC-45."""
    list_display = ['codigo', 'clasificacion', 'nombre', 'orden', 'is_active', 'created_at']
    list_filter = ['clasificacion__categoria', 'clasificacion', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion', 'efectos_posibles']
    ordering = ['clasificacion', 'orden', 'codigo']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['clasificacion']

    fieldsets = (
        ('Informacion General', {
            'fields': ('clasificacion', 'codigo', 'nombre')
        }),
        ('Descripcion', {
            'fields': ('descripcion', 'efectos_posibles')
        }),
        ('Orden', {
            'fields': ('orden',)
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MatrizIPEVR)
class MatrizIPEVRAdmin(admin.ModelAdmin):
    """Admin para Matriz IPEVR."""
    list_display = [
        'id', 'area', 'cargo', 'peligro_display', 'nivel_riesgo_display',
        'interpretacion_nr', 'aceptabilidad', 'estado', 'empresa', 'created_at'
    ]
    list_filter = [
        'estado', 'rutinaria', 'peligro__clasificacion__categoria',
        'is_active'
    ]
    search_fields = ['area', 'cargo', 'proceso', 'actividad', 'tarea']
    readonly_fields = [
        'nivel_probabilidad', 'interpretacion_np',
        'nivel_riesgo', 'interpretacion_nr', 'aceptabilidad',
        'significado_aceptabilidad',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]
    date_hierarchy = 'fecha_valoracion'
    raw_id_fields = ['peligro', 'responsable']
    inlines = [ControlSSTInline]

    fieldsets = (
        ('Identificacion', {
            'fields': ('empresa', 'area', 'cargo', 'proceso', 'actividad', 'tarea', 'rutinaria')
        }),
        ('Peligro Identificado', {
            'fields': ('peligro', 'fuente', 'medio', 'trabajador', 'efectos')
        }),
        ('Controles Existentes', {
            'fields': ('control_fuente', 'control_medio', 'control_individuo')
        }),
        ('Evaluacion GTC-45', {
            'fields': (
                ('nivel_deficiencia', 'nivel_exposicion'),
                ('nivel_probabilidad', 'interpretacion_np'),
                'nivel_consecuencia',
                ('nivel_riesgo', 'interpretacion_nr', 'aceptabilidad'),
                'significado_aceptabilidad'
            )
        }),
        ('Informacion Adicional', {
            'fields': ('num_expuestos', 'peor_consecuencia', 'requisito_legal')
        }),
        ('Medidas de Intervencion Propuestas', {
            'fields': ('eliminacion', 'sustitucion', 'controles_ingenieria', 'controles_administrativos', 'epp'),
            'classes': ('collapse',)
        }),
        ('Gestion', {
            'fields': ('responsable', 'fecha_valoracion', 'fecha_proxima_revision', 'estado')
        }),
        ('Estado del Registro', {
            'fields': ('is_active',)
        }),
        ('Auditoria', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def peligro_display(self, obj):
        return f"{obj.peligro.clasificacion.codigo} - {obj.peligro.nombre[:30]}"
    peligro_display.short_description = 'Peligro'

    def nivel_riesgo_display(self, obj):
        return f"NR: {obj.nivel_riesgo}"
    nivel_riesgo_display.short_description = 'Nivel Riesgo'


@admin.register(ControlSST)
class ControlSSTAdmin(admin.ModelAdmin):
    """Admin para Controles SST."""
    list_display = [
        'matriz_ipevr', 'tipo_control', 'descripcion_corta',
        'responsable', 'fecha_implementacion', 'estado', 'efectividad', 'empresa'
    ]
    list_filter = ['tipo_control', 'estado', 'efectividad', 'is_active']
    search_fields = ['descripcion', 'observaciones']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    raw_id_fields = ['matriz_ipevr', 'responsable']

    fieldsets = (
        ('Informacion General', {
            'fields': ('empresa', 'matriz_ipevr', 'tipo_control')
        }),
        ('Descripcion del Control', {
            'fields': ('descripcion', 'observaciones')
        }),
        ('Implementacion', {
            'fields': ('responsable', 'fecha_implementacion', 'estado', 'efectividad', 'evidencia')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoria', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def descripcion_corta(self, obj):
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripcion'
