"""
Filtros personalizados para Gestión de Proveedores - Supply Chain
Sistema de Gestión StrateKaz

100% DINÁMICO: Filtros adaptados a modelos de catálogo dinámicos.
"""
import django_filters
from django.db.models import Q

from .models import (
    Proveedor,
    EvaluacionProveedor,
    HistorialPrecioProveedor,
)


class ProveedorFilter(django_filters.FilterSet):
    """
    Filtro personalizado para Proveedores con soporte para catálogos dinámicos.
    """

    # Filtros de texto con case-insensitive contains
    nombre_comercial = django_filters.CharFilter(
        field_name='nombre_comercial',
        lookup_expr='icontains',
        label='Nombre comercial'
    )

    razon_social = django_filters.CharFilter(
        field_name='razon_social',
        lookup_expr='icontains',
        label='Razón social'
    )

    ciudad = django_filters.CharFilter(
        field_name='ciudad',
        lookup_expr='icontains',
        label='Ciudad'
    )

    # Filtros de relación FK (dinámicos)
    tipo_proveedor = django_filters.NumberFilter(
        field_name='tipo_proveedor_id',
        label='Tipo de proveedor (ID)'
    )

    tipo_proveedor_codigo = django_filters.CharFilter(
        field_name='tipo_proveedor__codigo',
        lookup_expr='exact',
        label='Tipo de proveedor (código)'
    )

    departamento = django_filters.NumberFilter(
        field_name='departamento_id',
        label='Departamento (ID)'
    )

    departamento_codigo = django_filters.CharFilter(
        field_name='departamento__codigo',
        lookup_expr='exact',
        label='Departamento (código)'
    )

    modalidad_logistica = django_filters.NumberFilter(
        field_name='modalidad_logistica_id',
        label='Modalidad logística (ID)'
    )

    modalidad_logistica_codigo = django_filters.CharFilter(
        field_name='modalidad_logistica__codigo',
        lookup_expr='exact',
        label='Modalidad logística (código)'
    )

    unidad_negocio = django_filters.NumberFilter(
        field_name='unidad_negocio_id',
        label='Unidad de negocio (ID)'
    )

    # Filtros por producto (catalogo_productos canonico) y categoria
    producto_suministrado = django_filters.NumberFilter(
        method='filter_producto_suministrado',
        label='Producto suministrado (ID del catalogo maestro)'
    )

    categoria_producto = django_filters.NumberFilter(
        method='filter_categoria_producto',
        label='Categoría de producto (CategoriaProducto ID)'
    )

    forma_pago = django_filters.NumberFilter(
        method='filter_forma_pago',
        label='Forma de pago (ID)'
    )

    # Filtros booleanos
    is_active = django_filters.BooleanFilter(
        field_name='is_active',
        label='Activo'
    )

    es_materia_prima = django_filters.BooleanFilter(
        method='filter_es_materia_prima',
        label='Es proveedor de materia prima'
    )

    class Meta:
        model = Proveedor
        fields = [
            'nombre_comercial', 'razon_social', 'ciudad',
            'tipo_proveedor', 'tipo_proveedor_codigo',
            'departamento', 'departamento_codigo',
            'modalidad_logistica', 'modalidad_logistica_codigo',
            'unidad_negocio', 'producto_suministrado', 'categoria_producto',
            'forma_pago', 'is_active', 'es_materia_prima'
        ]

    def filter_producto_suministrado(self, queryset, name, value):
        """Filtrar proveedores que suministran un producto específico."""
        if not value:
            return queryset
        return queryset.filter(productos_suministrados__id=value).distinct()

    def filter_categoria_producto(self, queryset, name, value):
        """Filtrar proveedores que suministran productos de una categoría."""
        if not value:
            return queryset
        return queryset.filter(productos_suministrados__categoria_id=value).distinct()

    def filter_forma_pago(self, queryset, name, value):
        """Filtrar proveedores que aceptan una forma de pago específica."""
        if not value:
            return queryset
        return queryset.filter(formas_pago__id=value).distinct()

    def filter_es_materia_prima(self, queryset, name, value):
        """Filtrar proveedores de materia prima según flag dinámico del tipo."""
        if value is None:
            return queryset
        return queryset.filter(tipo_proveedor__requiere_materia_prima=value)


class EvaluacionProveedorFilter(django_filters.FilterSet):
    """
    Filtro personalizado para Evaluaciones de Proveedores.
    """

    proveedor = django_filters.NumberFilter(
        field_name='proveedor_id',
        label='Proveedor (ID)'
    )

    proveedor_nombre = django_filters.CharFilter(
        field_name='proveedor__nombre_comercial',
        lookup_expr='icontains',
        label='Nombre del proveedor'
    )

    estado = django_filters.CharFilter(
        field_name='estado',
        lookup_expr='exact',
        label='Estado'
    )

    periodo = django_filters.CharFilter(
        field_name='periodo',
        lookup_expr='icontains',
        label='Período'
    )

    fecha_desde = django_filters.DateFilter(
        field_name='fecha_evaluacion',
        lookup_expr='gte',
        label='Fecha desde'
    )

    fecha_hasta = django_filters.DateFilter(
        field_name='fecha_evaluacion',
        lookup_expr='lte',
        label='Fecha hasta'
    )

    calificacion_min = django_filters.NumberFilter(
        field_name='calificacion_total',
        lookup_expr='gte',
        label='Calificación mínima'
    )

    calificacion_max = django_filters.NumberFilter(
        field_name='calificacion_total',
        lookup_expr='lte',
        label='Calificación máxima'
    )

    evaluado_por = django_filters.NumberFilter(
        field_name='evaluado_por_id',
        label='Evaluado por (user ID)'
    )

    aprobado_por = django_filters.NumberFilter(
        field_name='aprobado_por_id',
        label='Aprobado por (user ID)'
    )

    class Meta:
        model = EvaluacionProveedor
        fields = [
            'proveedor', 'proveedor_nombre', 'estado', 'periodo',
            'fecha_desde', 'fecha_hasta', 'calificacion_min', 'calificacion_max',
            'evaluado_por', 'aprobado_por'
        ]


class HistorialPrecioFilter(django_filters.FilterSet):
    """
    Filtro personalizado para Historial de Precios.
    """

    proveedor = django_filters.NumberFilter(
        field_name='proveedor_id',
        label='Proveedor (ID)'
    )

    proveedor_nombre = django_filters.CharFilter(
        field_name='proveedor__nombre_comercial',
        lookup_expr='icontains',
        label='Nombre del proveedor'
    )

    producto = django_filters.NumberFilter(
        field_name='producto_id',
        label='Producto (ID del catalogo_productos)'
    )

    producto_codigo = django_filters.CharFilter(
        field_name='producto__codigo',
        lookup_expr='exact',
        label='Producto (código)'
    )

    fecha_desde = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        label='Fecha desde'
    )

    fecha_hasta = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        label='Fecha hasta'
    )

    modificado_por = django_filters.NumberFilter(
        field_name='modificado_por_id',
        label='Modificado por (user ID)'
    )

    class Meta:
        model = HistorialPrecioProveedor
        fields = [
            'proveedor', 'proveedor_nombre', 'producto', 'producto_codigo',
            'fecha_desde', 'fecha_hasta', 'modificado_por'
        ]
