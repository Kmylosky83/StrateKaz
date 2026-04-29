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
    ControlDocumental,
    EventoDocumental,
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


@admin.register(EventoDocumental)
class EventoDocumentalAdmin(admin.ModelAdmin):
    """Log granular de accesos a documentos (ISO 27001 §A.8.10) — read-only."""
    list_display = [
        'created_at', 'tipo_evento', 'documento', 'usuario',
        'version_documento', 'ip_address',
    ]
    list_filter = ['tipo_evento', 'created_at']
    search_fields = [
        'documento__codigo', 'documento__titulo',
        'usuario__email', 'usuario__username', 'ip_address',
    ]
    readonly_fields = [
        'documento', 'usuario', 'tipo_evento', 'version_documento',
        'ip_address', 'user_agent', 'metadatos',
        'created_at', 'updated_at', 'created_by', 'updated_by',
    ]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    def has_add_permission(self, request):  # pragma: no cover - admin
        return False

    def has_change_permission(self, request, obj=None):  # pragma: no cover - admin
        return False
