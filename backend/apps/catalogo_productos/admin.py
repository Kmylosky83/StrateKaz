"""Admin básico para Catálogo de Productos."""
from django.contrib import admin

from .models import CategoriaProducto, UnidadMedida, Producto


@admin.register(CategoriaProducto)
class CategoriaProductoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'parent', 'codigo', 'orden', 'is_deleted']
    list_filter = ['is_deleted']
    search_fields = ['nombre', 'codigo']
    ordering = ['orden', 'nombre']


@admin.register(UnidadMedida)
class UnidadMedidaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'abreviatura', 'tipo', 'es_base', 'orden', 'is_deleted']
    list_filter = ['tipo', 'es_base', 'is_deleted']
    search_fields = ['nombre', 'abreviatura']
    ordering = ['tipo', 'orden', 'nombre']


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'categoria', 'unidad_medida', 'precio_referencia', 'is_deleted']
    list_filter = ['tipo', 'categoria', 'is_deleted']
    search_fields = ['codigo', 'nombre', 'sku']
    ordering = ['codigo']
    raw_id_fields = ['categoria', 'unidad_medida']
