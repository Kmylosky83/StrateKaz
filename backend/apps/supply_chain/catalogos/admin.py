"""
Admin para catalogos - supply_chain
"""
from django.contrib import admin
from .models import UnidadMedida, Almacen


class CatalogoBaseAdmin(admin.ModelAdmin):
    """Admin base para catálogos dinámicos."""
    list_display = ['codigo', 'nombre', 'orden', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']


@admin.register(UnidadMedida)
class UnidadMedidaAdmin(CatalogoBaseAdmin):
    """Admin para Unidades de Medida."""
    list_display = ['codigo', 'nombre', 'simbolo', 'tipo', 'factor_conversion_kg', 'orden', 'is_active']
    list_filter = ['is_active', 'tipo']
    search_fields = ['codigo', 'nombre', 'simbolo']
    list_editable = ['orden', 'is_active']


@admin.register(Almacen)
class AlmacenAdmin(admin.ModelAdmin):
    """Admin para Almacenes."""
    list_display = ['codigo', 'nombre', 'empresa', 'es_principal', 'permite_recepcion', 'permite_despacho', 'is_active']
    list_filter = ['empresa', 'es_principal', 'permite_recepcion', 'permite_despacho', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['codigo']
