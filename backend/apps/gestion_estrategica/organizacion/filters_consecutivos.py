"""
Filtros personalizados para Configuración de Consecutivos
Sistema de Gestión StrateKaz

100% DINÁMICO: Filtros para consumo por otras áreas del sistema.

Características:
- BooleanFilter explícito para es_sistema e is_active
- Filtros de texto con búsqueda flexible
- Filtros de rango para números
- Soporte para filtrado por categoría
"""
import django_filters
from django.db.models import Q

from .models_consecutivos import ConsecutivoConfig, CATEGORIA_CONSECUTIVO_CHOICES


class ConsecutivoConfigFilter(django_filters.FilterSet):
    """
    Filtro personalizado para Configuración de Consecutivos.

    Diseñado para:
    - Consumo por API desde frontend
    - Integración con otros módulos del sistema
    - Escalabilidad para filtros complejos futuros

    Endpoints que lo usan:
    - GET /organizacion/consecutivos/
    - GET /organizacion/consecutivos/by-categoria/
    """

    # =========================================================================
    # FILTROS BOOLEANOS (Explícitos para garantizar conversión correcta)
    # =========================================================================

    es_sistema = django_filters.BooleanFilter(
        field_name='es_sistema',
        label='Es consecutivo del sistema',
        help_text='true = consecutivos predefinidos, false = personalizados'
    )

    is_active = django_filters.BooleanFilter(
        field_name='is_active',
        label='Activo',
        help_text='true = activos, false = inactivos'
    )

    # =========================================================================
    # FILTROS DE CATEGORÍA
    # =========================================================================

    categoria = django_filters.ChoiceFilter(
        field_name='categoria',
        choices=CATEGORIA_CONSECUTIVO_CHOICES,
        label='Categoría',
        help_text='Filtrar por categoría: DOCUMENTOS, COMPRAS, VENTAS, etc.'
    )

    # =========================================================================
    # FILTROS DE TEXTO (búsqueda flexible)
    # =========================================================================

    codigo = django_filters.CharFilter(
        field_name='codigo',
        lookup_expr='iexact',
        label='Código exacto',
        help_text='Búsqueda exacta por código (case-insensitive)'
    )

    codigo_contains = django_filters.CharFilter(
        field_name='codigo',
        lookup_expr='icontains',
        label='Código contiene',
        help_text='Búsqueda parcial en código'
    )

    nombre = django_filters.CharFilter(
        field_name='nombre',
        lookup_expr='icontains',
        label='Nombre contiene',
        help_text='Búsqueda parcial en nombre'
    )

    prefix = django_filters.CharFilter(
        field_name='prefix',
        lookup_expr='iexact',
        label='Prefijo exacto',
        help_text='Búsqueda exacta por prefijo'
    )

    # =========================================================================
    # FILTROS NUMÉRICOS (para análisis y reportes)
    # =========================================================================

    current_number_min = django_filters.NumberFilter(
        field_name='current_number',
        lookup_expr='gte',
        label='Número actual mínimo',
        help_text='Consecutivos con número actual >= valor'
    )

    current_number_max = django_filters.NumberFilter(
        field_name='current_number',
        lookup_expr='lte',
        label='Número actual máximo',
        help_text='Consecutivos con número actual <= valor'
    )

    # =========================================================================
    # FILTROS DE CONFIGURACIÓN DE REINICIO
    # =========================================================================

    reset_yearly = django_filters.BooleanFilter(
        field_name='reset_yearly',
        label='Reinicio anual',
        help_text='true = reinicia cada año'
    )

    reset_monthly = django_filters.BooleanFilter(
        field_name='reset_monthly',
        label='Reinicio mensual',
        help_text='true = reinicia cada mes'
    )

    # =========================================================================
    # FILTRO DE BÚSQUEDA GLOBAL
    # =========================================================================

    search = django_filters.CharFilter(
        method='filter_search',
        label='Búsqueda global',
        help_text='Busca en código, nombre, descripción y prefijo'
    )

    class Meta:
        model = ConsecutivoConfig
        fields = [
            # Booleanos principales
            'es_sistema',
            'is_active',
            # Categoría
            'categoria',
            # Texto
            'codigo',
            'codigo_contains',
            'nombre',
            'prefix',
            # Numéricos
            'current_number_min',
            'current_number_max',
            # Configuración
            'reset_yearly',
            'reset_monthly',
            # Búsqueda global
            'search',
        ]

    def filter_search(self, queryset, name, value):
        """
        Búsqueda global en múltiples campos.

        Permite buscar un término en:
        - codigo
        - nombre
        - descripcion
        - prefix

        Uso: GET /consecutivos/?search=factura
        """
        if not value:
            return queryset

        return queryset.filter(
            Q(codigo__icontains=value) |
            Q(nombre__icontains=value) |
            Q(descripcion__icontains=value) |
            Q(prefix__icontains=value)
        )
