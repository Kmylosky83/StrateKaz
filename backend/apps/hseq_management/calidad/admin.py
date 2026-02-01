"""
Admin para Gestión de Calidad
"""
from django.contrib import admin
from .models import (
    NoConformidad,
    AccionCorrectiva,
    SalidaNoConforme,
    SolicitudCambio,
    ControlCambio
)


@admin.register(NoConformidad)
class NoConformidadAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'titulo', 'tipo', 'origen', 'severidad', 'estado', 'fecha_deteccion']
    list_filter = ['estado', 'tipo', 'origen', 'severidad', 'fecha_deteccion']
    search_fields = ['codigo', 'titulo', 'descripcion']
    date_hierarchy = 'fecha_deteccion'


@admin.register(AccionCorrectiva)
class AccionCorrectivaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'no_conformidad', 'tipo', 'estado', 'responsable', 'fecha_limite']
    list_filter = ['estado', 'tipo', 'fecha_limite']
    search_fields = ['codigo', 'descripcion']
    date_hierarchy = 'fecha_planificada'


@admin.register(SalidaNoConforme)
class SalidaNoConformeAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'descripcion_producto', 'tipo', 'estado', 'bloqueada', 'fecha_deteccion']
    list_filter = ['estado', 'tipo', 'bloqueada', 'disposicion']
    search_fields = ['codigo', 'descripcion_producto', 'lote_numero']
    date_hierarchy = 'fecha_deteccion'


@admin.register(SolicitudCambio)
class SolicitudCambioAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'titulo', 'tipo', 'estado', 'prioridad', 'solicitante', 'fecha_solicitud']
    list_filter = ['estado', 'tipo', 'prioridad', 'fecha_solicitud']
    search_fields = ['codigo', 'titulo', 'descripcion_cambio']
    date_hierarchy = 'fecha_solicitud'


@admin.register(ControlCambio)
class ControlCambioAdmin(admin.ModelAdmin):
    list_display = ['solicitud_cambio', 'fecha_inicio_implementacion', 'fecha_fin_implementacion', 'eficaz']
    list_filter = ['eficaz', 'verificacion_realizada']
    search_fields = ['solicitud_cambio__codigo', 'solicitud_cambio__titulo']
