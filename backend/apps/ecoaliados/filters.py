"""
Filtros personalizados para el módulo de Ecoaliados
Sistema de Gestión Grasas y Huesos del Norte
"""
import django_filters
from .models import Ecoaliado


class EcoaliadoFilter(django_filters.FilterSet):
    """
    Filtro personalizado para Ecoaliados con búsqueda case-insensitive
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

    # Filtro de código con case-insensitive contains
    codigo = django_filters.CharFilter(
        field_name='codigo',
        lookup_expr='icontains',
        label='Código'
    )

    # Filtro de razón social con case-insensitive contains
    razon_social = django_filters.CharFilter(
        field_name='razon_social',
        lookup_expr='icontains',
        label='Razón Social'
    )

    # Filtro de precio mínimo
    precio_min = django_filters.NumberFilter(
        field_name='precio_compra_kg',
        lookup_expr='gte',
        label='Precio mínimo'
    )

    # Filtro de precio máximo
    precio_max = django_filters.NumberFilter(
        field_name='precio_compra_kg',
        lookup_expr='lte',
        label='Precio máximo'
    )

    # Filtro booleano para ecoaliados con geolocalización
    tiene_geolocalizacion = django_filters.BooleanFilter(
        method='filter_tiene_geolocalizacion',
        label='Tiene geolocalización'
    )

    class Meta:
        model = Ecoaliado
        fields = {
            'unidad_negocio': ['exact'],
            'comercial_asignado': ['exact'],
            'is_active': ['exact'],
            'documento_tipo': ['exact'],
        }

    def filter_tiene_geolocalizacion(self, queryset, name, value):
        """
        Filtrar por ecoaliados que tienen o no geolocalización
        """
        if value is True:
            # Tiene geolocalización (ambos campos no nulos)
            return queryset.exclude(latitud__isnull=True).exclude(longitud__isnull=True)
        elif value is False:
            # No tiene geolocalización (al menos uno es nulo)
            from django.db.models import Q
            return queryset.filter(Q(latitud__isnull=True) | Q(longitud__isnull=True))
        return queryset
