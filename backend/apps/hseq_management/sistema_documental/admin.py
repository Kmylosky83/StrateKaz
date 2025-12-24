"""
Admin para Sistema Documental - HSEQ Management
"""
from django.contrib import admin
from .models import (
    TipoDocumento,
    PlantillaDocumento,
    Documento,
    VersionDocumento,
    CampoFormulario,
    FirmaDocumento,
    ControlDocumental
)


@admin.register(TipoDocumento)
class TipoDocumentoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'nivel_documento', 'prefijo_codigo',
        'requiere_aprobacion', 'requiere_firma', 'is_active', 'orden'
    ]
    list_filter = ['nivel_documento', 'is_active', 'requiere_aprobacion', 'requiere_firma']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'codigo']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PlantillaDocumento)
class PlantillaDocumentoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre', 'tipo_documento', 'tipo_plantilla',
        'version', 'estado', 'es_por_defecto'
    ]
    list_filter = ['tipo_plantilla', 'estado', 'es_por_defecto']
    search_fields = ['codigo', 'nombre']
    ordering = ['-es_por_defecto', 'nombre']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'titulo', 'tipo_documento', 'version_actual',
        'estado', 'clasificacion', 'fecha_publicacion', 'elaborado_por'
    ]
    list_filter = ['tipo_documento', 'estado', 'clasificacion']
    search_fields = ['codigo', 'titulo', 'resumen']
    ordering = ['-fecha_publicacion', 'codigo']
    readonly_fields = ['created_at', 'updated_at', 'numero_descargas', 'numero_impresiones']
    date_hierarchy = 'fecha_publicacion'


@admin.register(VersionDocumento)
class VersionDocumentoAdmin(admin.ModelAdmin):
    list_display = [
        'documento', 'numero_version', 'tipo_cambio',
        'fecha_version', 'creado_por', 'is_version_actual'
    ]
    list_filter = ['tipo_cambio', 'is_version_actual']
    search_fields = ['documento__codigo', 'documento__titulo', 'numero_version']
    ordering = ['-fecha_version']
    readonly_fields = ['fecha_version']


@admin.register(CampoFormulario)
class CampoFormularioAdmin(admin.ModelAdmin):
    list_display = [
        'nombre_campo', 'etiqueta', 'tipo_campo', 'plantilla',
        'es_obligatorio', 'orden', 'is_active'
    ]
    list_filter = ['tipo_campo', 'es_obligatorio', 'is_active', 'plantilla']
    search_fields = ['nombre_campo', 'etiqueta']
    ordering = ['orden', 'nombre_campo']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FirmaDocumento)
class FirmaDocumentoAdmin(admin.ModelAdmin):
    list_display = [
        'documento', 'tipo_firma', 'firmante', 'cargo_firmante',
        'estado', 'orden_firma', 'fecha_solicitud', 'fecha_firma'
    ]
    list_filter = ['tipo_firma', 'estado']
    search_fields = ['documento__codigo', 'firmante__email', 'firmante__first_name']
    ordering = ['orden_firma', 'fecha_solicitud']
    readonly_fields = ['created_at', 'updated_at', 'fecha_solicitud']
    date_hierarchy = 'fecha_firma'


@admin.register(ControlDocumental)
class ControlDocumentalAdmin(admin.ModelAdmin):
    list_display = [
        'documento', 'tipo_control', 'fecha_distribucion',
        'medio_distribucion', 'numero_copias_impresas', 'created_by'
    ]
    list_filter = ['tipo_control', 'medio_distribucion']
    search_fields = ['documento__codigo', 'documento__titulo']
    ordering = ['-fecha_distribucion']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'fecha_distribucion'
