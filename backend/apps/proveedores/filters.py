"""
Filtros personalizados para el módulo de Proveedores
Sistema de Gestión StrateKaz
"""
import django_filters
from .models import Proveedor


class ProveedorFilter(django_filters.FilterSet):
    """
    Filtro personalizado para Proveedores con búsqueda case-insensitive
    """

    # Filtro de ciudad con case-insensitive contains
    ciudad = django_filters.CharFilter(
        field_name='ciudad',
        lookup_expr='icontains',
        label='Ciudad'
    )

    # Filtro de departamento con case-insensitive contains
    departamento = django_filters.CharFilter(
        field_name='departamento',
        lookup_expr='icontains',
        label='Departamento'
    )

    # Filtro de subtipo_materia por elemento en array JSON
    subtipo_materia = django_filters.CharFilter(
        method='filter_subtipo_materia',
        label='Subtipo de materia prima'
    )

    class Meta:
        model = Proveedor
        fields = {
            'tipo_proveedor': ['exact'],
            'modalidad_logistica': ['exact'],
            'is_active': ['exact'],
            'unidad_negocio': ['exact'],
        }

    def filter_subtipo_materia(self, queryset, name, value):
        """
        Filtrar por subtipo de materia prima contenido en el array JSON
        MySQL/MariaDB requiere JSON_CONTAINS para buscar en arrays
        """
        if not value:
            return queryset

        # Usar JSON_CONTAINS para buscar en el array JSON
        from django.db.models import Q
        return queryset.extra(
            where=["JSON_CONTAINS(subtipo_materia, %s)"],
            params=[f'"{value}"']
        )
