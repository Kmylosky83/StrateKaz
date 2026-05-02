"""
Admin para disenador_flujos - workflow_engine

Registro de modelos del diseñador de flujos BPMN:
CategoriaFlujo, PlantillaFlujo, NodoFlujo, TransicionFlujo,
CampoFormulario, RolFlujo, FormularioDiligenciado
"""
from django.contrib import admin
from .models import (
    CategoriaFlujo,
    PlantillaFlujo,
    NodoFlujo,
    TransicionFlujo,
    CampoFormulario,
    RolFlujo,
    FormularioDiligenciado,
)


# ============================================================
# INLINES
# ============================================================

class NodoFlujoInline(admin.TabularInline):
    model = NodoFlujo
    extra = 0
    fields = ['codigo', 'nombre', 'tipo', 'posicion_x', 'posicion_y', 'rol_asignado']
    readonly_fields = ['created_at']
    show_change_link = True


class TransicionFlujoInline(admin.TabularInline):
    model = TransicionFlujo
    extra = 0
    fields = ['nombre', 'nodo_origen', 'nodo_destino', 'prioridad']
    readonly_fields = ['created_at']
    show_change_link = True


class CampoFormularioInline(admin.TabularInline):
    model = CampoFormulario
    extra = 0
    fields = ['nombre', 'etiqueta', 'tipo', 'orden', 'requerido']
    readonly_fields = ['created_at']


# ============================================================
# ADMIN CLASSES
# ============================================================

@admin.register(CategoriaFlujo)
class CategoriaFlujoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'color', 'orden', 'activo', 'created_at']
    list_filter = ['activo']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['orden', 'activo']

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Configuración Visual', {
            'fields': ('color', 'icono', 'orden', 'activo')
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PlantillaFlujo)
class PlantillaFlujoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'categoria', 'version', 'estado',
        'tiempo_estimado_horas', 'created_at'
    ]
    list_filter = ['estado', 'categoria', 'requiere_aprobacion_gerencia']
    search_fields = ['codigo', 'nombre', 'descripcion']
    readonly_fields = [
        'created_at', 'updated_at', 'fecha_activacion', 'fecha_obsolescencia'
    ]
    date_hierarchy = 'created_at'
    inlines = [NodoFlujoInline, TransicionFlujoInline]

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'nombre', 'descripcion', 'categoria')
        }),
        ('Versionamiento', {
            'fields': (
                'version', 'estado', 'plantilla_origen',
                'fecha_activacion', 'fecha_obsolescencia'
            )
        }),
        ('Configuración de Ejecución', {
            'fields': (
                'tiempo_estimado_horas',
                'requiere_aprobacion_gerencia',
                'permite_cancelacion',
                'etiquetas'
            )
        }),
        ('Diagrama BPMN', {
            'fields': ('xml_bpmn', 'json_diagram'),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': (
                'empresa_id', 'created_by', 'activado_por',
                'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )


@admin.register(NodoFlujo)
class NodoFlujoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'tipo', 'plantilla',
        'rol_asignado', 'tiempo_estimado_horas', 'created_at'
    ]
    list_filter = ['tipo', 'plantilla']
    search_fields = ['codigo', 'nombre', 'plantilla__nombre']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [CampoFormularioInline]

    fieldsets = (
        ('Identificación', {
            'fields': ('plantilla', 'tipo', 'codigo', 'nombre', 'descripcion')
        }),
        ('Posición en Diagrama', {
            'fields': (('posicion_x', 'posicion_y'),)
        }),
        ('Asignación', {
            'fields': ('rol_asignado', 'tiempo_estimado_horas')
        }),
        ('Configuración Avanzada', {
            'fields': ('configuracion',),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TransicionFlujo)
class TransicionFlujoAdmin(admin.ModelAdmin):
    list_display = [
        'nombre', 'plantilla', 'nodo_origen', 'nodo_destino',
        'prioridad', 'created_at'
    ]
    list_filter = ['plantilla']
    search_fields = ['nombre', 'plantilla__nombre']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('plantilla', 'nombre')
        }),
        ('Conexión', {
            'fields': ('nodo_origen', 'nodo_destino', 'prioridad')
        }),
        ('Condición', {
            'fields': ('condicion',),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CampoFormulario)
class CampoFormularioAdmin(admin.ModelAdmin):
    list_display = [
        'nombre', 'etiqueta', 'tipo', 'nodo', 'orden', 'requerido', 'created_at'
    ]
    list_filter = ['tipo', 'requerido']
    search_fields = ['nombre', 'etiqueta', 'nodo__nombre']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('nodo', 'nombre', 'etiqueta', 'tipo', 'orden')
        }),
        ('Validación', {
            'fields': ('requerido', 'valor_defecto', 'placeholder')
        }),
        ('Opciones y Validaciones', {
            'fields': ('opciones', 'validaciones', 'ayuda'),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(RolFlujo)
class RolFlujoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'tipo_asignacion', 'color',
        'permite_delegacion', 'activo', 'created_at'
    ]
    list_filter = ['tipo_asignacion', 'activo', 'permite_delegacion']
    search_fields = ['codigo', 'nombre']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Asignación', {
            'fields': (
                'tipo_asignacion',
                'rol_sistema_id', 'cargo_id',
                'grupo_usuarios_id', 'usuario_id',
                'regla_asignacion'
            )
        }),
        ('Configuración', {
            'fields': ('color', 'permite_delegacion', 'activo')
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FormularioDiligenciado)
class FormularioDiligenciadoAdmin(admin.ModelAdmin):
    list_display = [
        'numero_formulario', 'titulo', 'plantilla_flujo',
        'diligenciado_por', 'estado', 'fecha_diligenciamiento'
    ]
    list_filter = ['estado', 'plantilla_flujo']
    search_fields = ['numero_formulario', 'titulo']
    readonly_fields = ['created_at', 'updated_at', 'fecha_diligenciamiento']
    date_hierarchy = 'fecha_diligenciamiento'

    fieldsets = (
        ('Identificación', {
            'fields': (
                'numero_formulario', 'titulo', 'plantilla_flujo',
                'diligenciado_por', 'estado'
            )
        }),
        ('Entidad Relacionada', {
            'fields': ('content_type', 'object_id')
        }),
        ('Datos', {
            'fields': ('datos_formulario', 'observaciones'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': (
                'fecha_diligenciamiento', 'fecha_completado',
                'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('empresa_id', 'created_by'),
            'classes': ('collapse',)
        }),
    )
