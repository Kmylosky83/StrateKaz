"""
Admin para Gestión Documental - Gestión Estratégica (N1)
"""
from django.contrib import admin
from .models import (
    TipoDocumento,
    PlantillaDocumento,
    Documento,
    VersionDocumento,
    CampoFormulario,
    ControlDocumental
)


@admin.register(TipoDocumento)
class TipoDocumentoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'nivel_documento', 'requiere_firma', 'is_active', 'empresa_id']
    list_filter = ['nivel_documento', 'requiere_firma', 'is_active', 'empresa_id']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'codigo']


@admin.register(PlantillaDocumento)
class PlantillaDocumentoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_documento', 'estado', 'es_por_defecto', 'empresa_id']
    list_filter = ['tipo_documento', 'estado', 'es_por_defecto', 'empresa_id']
    search_fields = ['codigo', 'nombre']
    ordering = ['-es_por_defecto', 'nombre']


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'titulo', 'tipo_documento', 'version_actual', 'estado', 'fecha_publicacion', 'empresa_id']
    list_filter = ['tipo_documento', 'estado', 'clasificacion', 'empresa_id']
    search_fields = ['codigo', 'titulo', 'resumen']
    ordering = ['-fecha_publicacion', 'codigo']
    date_hierarchy = 'fecha_publicacion'


@admin.register(VersionDocumento)
class VersionDocumentoAdmin(admin.ModelAdmin):
    list_display = ['documento', 'numero_version', 'tipo_cambio', 'fecha_version', 'is_version_actual', 'empresa_id']
    list_filter = ['tipo_cambio', 'is_version_actual', 'empresa_id']
    search_fields = ['documento__codigo', 'descripcion_cambios']
    ordering = ['-fecha_version']


@admin.register(CampoFormulario)
class CampoFormularioAdmin(admin.ModelAdmin):
    list_display = ['nombre_campo', 'etiqueta', 'tipo_campo', 'plantilla', 'es_obligatorio', 'orden', 'empresa_id']
    list_filter = ['tipo_campo', 'es_obligatorio', 'is_active', 'empresa_id']
    search_fields = ['nombre_campo', 'etiqueta']
    ordering = ['orden', 'nombre_campo']


@admin.register(ControlDocumental)
class ControlDocumentalAdmin(admin.ModelAdmin):
    list_display = ['documento', 'tipo_control', 'fecha_distribucion', 'medio_distribucion', 'empresa_id']
    list_filter = ['tipo_control', 'medio_distribucion', 'empresa_id']
    search_fields = ['documento__codigo', 'observaciones']
    ordering = ['-fecha_distribucion']
