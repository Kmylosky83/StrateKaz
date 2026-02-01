"""
Filtros personalizados para Unidades de Medida
Sistema de Gestión StrateKaz

100% DINÁMICO: Filtros para consumo por otras áreas del sistema.

Catálogo transversal utilizado por:
- SedeEmpresa (capacidad de almacenamiento)
- Supply Chain (cantidades de productos)
- Gestión Ambiental (residuos, emisiones)
- Gestor Documental (tamaños de archivo)
"""
import django_filters
from django.db.models import Q

from .models_unidades import UnidadMedida, CATEGORIA_UNIDAD_CHOICES


class UnidadMedidaFilter(django_filters.FilterSet):
    """
    Filtro personalizado para Unidades de Medida.

    Diseñado para:
    - Consumo por API desde frontend
    - Integración con otros módulos del sistema
    - Escalabilidad para filtros complejos futuros

    Endpoints que lo usan:
    - GET /organizacion/unidades-medida/
    - GET /organizacion/unidades-medida/by-categoria/
    """

    # =========================================================================
    # FILTROS BOOLEANOS (Explícitos para garantizar conversión correcta)
    # =========================================================================

    es_sistema = django_filters.BooleanFilter(
        field_name='es_sistema',
        label='Es unidad del sistema',
        help_text='true = unidades predefinidas, false = personalizadas'
    )

    is_active = django_filters.BooleanFilter(
        field_name='is_active',
        label='Activo',
        help_text='true = activas, false = inactivas'
    )

    es_unidad_base = django_filters.BooleanFilter(
        method='filter_es_unidad_base',
        label='Es unidad base',
        help_text='true = unidades base (sin unidad_base asignada)'
    )

    # =========================================================================
    # FILTROS DE CATEGORÍA
    # =========================================================================

    categoria = django_filters.ChoiceFilter(
        field_name='categoria',
        choices=CATEGORIA_UNIDAD_CHOICES,
        label='Categoría',
        help_text='Filtrar por categoría: MASA, VOLUMEN, LONGITUD, etc.'
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

    simbolo = django_filters.CharFilter(
        field_name='simbolo',
        lookup_expr='iexact',
        label='Símbolo exacto',
        help_text='Búsqueda exacta por símbolo (kg, m, L)'
    )

    # =========================================================================
    # FILTROS DE RELACIÓN
    # =========================================================================

    unidad_base = django_filters.NumberFilter(
        field_name='unidad_base_id',
        label='Unidad base (ID)',
        help_text='Filtrar por unidad base de conversión'
    )

    # =========================================================================
    # FILTRO DE BÚSQUEDA GLOBAL
    # =========================================================================

    search = django_filters.CharFilter(
        method='filter_search',
        label='Búsqueda global',
        help_text='Busca en código, nombre, símbolo y descripción'
    )

    class Meta:
        model = UnidadMedida
        fields = [
            # Booleanos principales
            'es_sistema',
            'is_active',
            'es_unidad_base',
            # Categoría
            'categoria',
            # Texto
            'codigo',
            'codigo_contains',
            'nombre',
            'simbolo',
            # Relación
            'unidad_base',
            # Búsqueda global
            'search',
        ]

    def filter_es_unidad_base(self, queryset, name, value):
        """
        Filtra unidades que son base (no tienen unidad_base asignada).

        Las unidades base son aquellas que no derivan de otra unidad,
        es decir, su campo unidad_base es NULL.

        Uso: GET /unidades-medida/?es_unidad_base=true
        """
        if value is None:
            return queryset

        if value:
            # Unidades base: no tienen unidad_base asignada
            return queryset.filter(unidad_base__isnull=True)
        else:
            # Unidades derivadas: tienen unidad_base asignada
            return queryset.filter(unidad_base__isnull=False)

    def filter_search(self, queryset, name, value):
        """
        Búsqueda global en múltiples campos.

        Permite buscar un término en:
        - codigo
        - nombre
        - simbolo
        - descripcion

        Uso: GET /unidades-medida/?search=kilogramo
        """
        if not value:
            return queryset

        return queryset.filter(
            Q(codigo__icontains=value) |
            Q(nombre__icontains=value) |
            Q(simbolo__icontains=value) |
            Q(descripcion__icontains=value)
        )
