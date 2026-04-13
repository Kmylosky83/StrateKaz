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
    list_display = ['codigo', 'nombre', 'nivel_documento', 'requiere_firma']
    list_filter = ['nivel_documento', 'requiere_firma']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'codigo']


@admin.register(PlantillaDocumento)
class PlantillaDocumentoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_documento', 'estado', 'es_por_defecto']
    list_filter = ['tipo_documento', 'estado', 'es_por_defecto']
    search_fields = ['codigo', 'nombre']
    ordering = ['-es_por_defecto', 'nombre']


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'titulo', 'tipo_documento', 'version_actual', 'estado', 'fecha_publicacion']
    list_filter = ['tipo_documento', 'estado', 'clasificacion']
    search_fields = ['codigo', 'titulo', 'resumen']
    ordering = ['-fecha_publicacion', 'codigo']
    date_hierarchy = 'fecha_publicacion'


@admin.register(VersionDocumento)
class VersionDocumentoAdmin(admin.ModelAdmin):
    list_display = ['documento', 'numero_version', 'tipo_cambio', 'fecha_version', 'is_version_actual']
    list_filter = ['tipo_cambio', 'is_version_actual']
    search_fields = ['documento__codigo', 'descripcion_cambios']
    ordering = ['-fecha_version']


@admin.register(CampoFormulario)
class CampoFormularioAdmin(admin.ModelAdmin):
    list_display = ['nombre_campo', 'etiqueta', 'tipo_campo', 'plantilla', 'es_obligatorio', 'orden']
    list_filter = ['tipo_campo', 'es_obligatorio']
    search_fields = ['nombre_campo', 'etiqueta']
    ordering = ['orden', 'nombre_campo']


@admin.register(ControlDocumental)
class ControlDocumentalAdmin(admin.ModelAdmin):
    list_display = ['documento', 'tipo_control', 'fecha_distribucion', 'medio_distribucion']
    list_filter = ['tipo_control', 'medio_distribucion']
    search_fields = ['documento__codigo', 'observaciones']
    ordering = ['-fecha_distribucion']
