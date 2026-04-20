"""
Admin para Gestión de Proveedores - Supply Chain.

Post refactor 2026-04-21 (Proveedor → CT):
  Solo se gestionan desde este admin los modelos que siguen viviendo en SC:
    - ModalidadLogistica (catálogo dinámico de SC)
    - PrecioMateriaPrima (FK ahora a catalogo_productos.Proveedor)
    - HistorialPrecioProveedor (FK ahora a catalogo_productos.Proveedor)

  Proveedor, TipoProveedor y el catálogo de proveedor → /admin/catalogo_productos/
  FormaPago, TipoCuentaBancaria, CondicionComercial, CriterioEvaluacion,
  EvaluacionProveedor, DetalleEvaluacion → ELIMINADOS (fuera de SC, scope
  Admin/Compras cuando esos módulos entren a LIVE).
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    ModalidadLogistica,
    PrecioMateriaPrima,
    HistorialPrecioProveedor,
)


@admin.register(ModalidadLogistica)
class ModalidadLogisticaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'orden', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']


@admin.register(PrecioMateriaPrima)
class PrecioMateriaPrimaAdmin(admin.ModelAdmin):
    """Precio vigente proveedor × producto."""
    list_display = [
        'proveedor', 'producto', 'precio_kg',
        'updated_by', 'updated_at',
    ]
    list_filter = ['producto__categoria']
    search_fields = [
        'proveedor__nombre_comercial', 'producto__nombre',
    ]
    raw_id_fields = ['proveedor', 'producto', 'updated_by', 'created_by']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(HistorialPrecioProveedor)
class HistorialPrecioProveedorAdmin(admin.ModelAdmin):
    """Historial de precios (append-only, solo lectura)."""
    list_display = [
        'proveedor', 'producto', 'precio_anterior', 'precio_nuevo',
        'variacion_display', 'modificado_por', 'created_at',
    ]
    list_filter = ['producto__categoria', 'modificado_por']
    search_fields = ['proveedor__nombre_comercial', 'motivo']
    ordering = ['-created_at']
    readonly_fields = [
        'proveedor', 'producto', 'precio_anterior', 'precio_nuevo',
        'modificado_por', 'motivo', 'created_at', 'updated_at',
    ]

    def variacion_display(self, obj):
        if obj.variacion_precio is not None:
            color = 'green' if obj.variacion_precio < 0 else 'red' if obj.variacion_precio > 0 else 'gray'
            return format_html(
                '<span style="color: {};">{:+.2f}%</span>',
                color, obj.variacion_precio
            )
        return "-"
    variacion_display.short_description = 'Variación'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
