"""
Admin para catalogos - supply_chain
"""
from django.contrib import admin
from .models import Almacen, RutaRecoleccion, TipoAlmacen


@admin.register(RutaRecoleccion)
class RutaRecoleccionAdmin(admin.ModelAdmin):
    """Admin para Rutas de Recolección (H-SC-RUTA-02)."""
    list_display = [
        'codigo', 'nombre', 'modo_operacion', 'is_active', 'is_deleted',
    ]
    list_filter = ['modo_operacion', 'is_active', 'is_deleted']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['codigo']


class CatalogoBaseAdmin(admin.ModelAdmin):
    """Admin base para catálogos dinámicos."""
    list_display = ['codigo', 'nombre', 'orden', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']


@admin.register(TipoAlmacen)
class TipoAlmacenAdmin(CatalogoBaseAdmin):
    """Admin para Tipos de Almacén."""
    list_display = ['codigo', 'nombre', 'icono', 'orden', 'is_active']
    search_fields = ['codigo', 'nombre']


@admin.register(Almacen)
class AlmacenAdmin(admin.ModelAdmin):
    """Admin para Almacenes."""
    list_display = [
        'codigo', 'nombre', 'sede', 'tipo_almacen', 'es_principal',
        'permite_recepcion', 'permite_despacho', 'is_deleted',
    ]
    list_filter = [
        'sede', 'tipo_almacen', 'es_principal',
        'permite_recepcion', 'permite_despacho', 'is_deleted',
    ]
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['codigo']
    raw_id_fields = ['sede']
    autocomplete_fields = ['tipo_almacen']
