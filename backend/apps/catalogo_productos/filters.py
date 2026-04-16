"""Filtros para Catálogo de Productos."""
from django.db import models
from django_filters import rest_framework as filters

from .models import CategoriaProducto, UnidadMedida, Producto


class CategoriaProductoFilter(filters.FilterSet):
    nombre = filters.CharFilter(lookup_expr='icontains')
    parent_isnull = filters.BooleanFilter(field_name='parent', lookup_expr='isnull')

    class Meta:
        model = CategoriaProducto
        fields = ['nombre', 'parent', 'parent_isnull']


class UnidadMedidaFilter(filters.FilterSet):
    nombre = filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = UnidadMedida
        fields = ['nombre', 'tipo', 'es_base']


class ProductoFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')

    class Meta:
        model = Producto
        fields = ['categoria', 'tipo', 'search']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            models.Q(nombre__icontains=value) | models.Q(codigo__icontains=value)
        )
