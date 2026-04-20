"""
Filtros para Gestión de Proveedores (Supply Chain).

Post refactor 2026-04-21 (Proveedor → CT):
  Solo filtros de lo que vive en SC (historial de precios).
"""
import django_filters

from .models import HistorialPrecioProveedor


class HistorialPrecioFilter(django_filters.FilterSet):
    """Filtro para historial de precios de proveedores."""

    proveedor = django_filters.NumberFilter(
        field_name='proveedor_id',
        label='Proveedor (ID)',
    )
    proveedor_nombre = django_filters.CharFilter(
        field_name='proveedor__nombre_comercial',
        lookup_expr='icontains',
        label='Nombre del proveedor',
    )
    producto = django_filters.NumberFilter(
        field_name='producto_id',
        label='Producto (ID del catalogo_productos)',
    )
    producto_codigo = django_filters.CharFilter(
        field_name='producto__codigo',
        lookup_expr='exact',
        label='Producto (código)',
    )
    fecha_desde = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        label='Fecha desde',
    )
    fecha_hasta = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        label='Fecha hasta',
    )
    modificado_por = django_filters.NumberFilter(
        field_name='modificado_por_id',
        label='Modificado por (user ID)',
    )

    class Meta:
        model = HistorialPrecioProveedor
        fields = [
            'proveedor', 'proveedor_nombre', 'producto', 'producto_codigo',
            'fecha_desde', 'fecha_hasta', 'modificado_por',
        ]
