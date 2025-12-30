"""
Admin básico para Gestión de Transporte
"""

from django.contrib import admin
from .models import (
    TipoRuta,
    EstadoDespacho,
    Ruta,
    Conductor,
    ProgramacionRuta,
    Despacho,
    DetalleDespacho,
    Manifiesto
)


@admin.register(TipoRuta)
class TipoRutaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'orden']
    search_fields = ['codigo', 'nombre']


@admin.register(EstadoDespacho)
class EstadoDespachoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'orden']
    search_fields = ['codigo', 'nombre']


@admin.register(Ruta)
class RutaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_ruta', 'is_active']
    search_fields = ['codigo', 'nombre']


@admin.register(Conductor)
class ConductorAdmin(admin.ModelAdmin):
    list_display = ['nombre_completo', 'documento_identidad', 'is_active']
    search_fields = ['nombre_completo', 'documento_identidad']


@admin.register(ProgramacionRuta)
class ProgramacionRutaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'ruta', 'fecha_programada', 'estado']
    search_fields = ['codigo']


@admin.register(Despacho)
class DespachoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'cliente_nombre', 'programacion_ruta']
    search_fields = ['codigo', 'cliente_nombre']


@admin.register(DetalleDespacho)
class DetalleDespachoAdmin(admin.ModelAdmin):
    list_display = ['despacho', 'descripcion_producto', 'cantidad']
    search_fields = ['descripcion_producto']


@admin.register(Manifiesto)
class ManifiestoAdmin(admin.ModelAdmin):
    list_display = ['numero_manifiesto', 'programacion_ruta', 'fecha_expedicion']
    search_fields = ['numero_manifiesto']
