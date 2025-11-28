"""
Filtros personalizados para el módulo de Programaciones
Sistema de Gestión Grasas y Huesos del Norte
"""
import django_filters
from .models import Programacion


class ProgramacionFilter(django_filters.FilterSet):
    """
    Filtro personalizado para Programaciones
    """

    # Filtro de ecoaliado
    ecoaliado = django_filters.NumberFilter(
        field_name='ecoaliado',
        lookup_expr='exact',
        label='Ecoaliado'
    )

    # Filtro de programado por (comercial)
    programado_por = django_filters.NumberFilter(
        field_name='programado_por',
        lookup_expr='exact',
        label='Programado por'
    )

    # Filtro de recolector asignado
    recolector_asignado = django_filters.NumberFilter(
        field_name='recolector_asignado',
        lookup_expr='exact',
        label='Recolector asignado'
    )

    # Filtro de estado
    estado = django_filters.ChoiceFilter(
        field_name='estado',
        choices=Programacion.ESTADO_CHOICES,
        label='Estado'
    )

    # Filtro de tipo de programación
    tipo_programacion = django_filters.ChoiceFilter(
        field_name='tipo_programacion',
        choices=Programacion.TIPO_CHOICES,
        label='Tipo de programación'
    )

    # Filtro de rango de fechas (fecha desde)
    fecha_desde = django_filters.DateFilter(
        field_name='fecha_programada',
        lookup_expr='gte',
        label='Fecha desde'
    )

    # Filtro de rango de fechas (fecha hasta)
    fecha_hasta = django_filters.DateFilter(
        field_name='fecha_programada',
        lookup_expr='lte',
        label='Fecha hasta'
    )

    # Filtro de ciudad (del ecoaliado)
    ciudad = django_filters.CharFilter(
        field_name='ecoaliado__ciudad',
        lookup_expr='icontains',
        label='Ciudad'
    )

    # Filtro de departamento (del ecoaliado)
    departamento = django_filters.CharFilter(
        field_name='ecoaliado__departamento',
        lookup_expr='icontains',
        label='Departamento'
    )

    # Filtro de código de ecoaliado
    ecoaliado_codigo = django_filters.CharFilter(
        field_name='ecoaliado__codigo',
        lookup_expr='icontains',
        label='Código ecoaliado'
    )

    # Filtro de razón social de ecoaliado
    ecoaliado_razon_social = django_filters.CharFilter(
        field_name='ecoaliado__razon_social',
        lookup_expr='icontains',
        label='Razón social ecoaliado'
    )

    # Filtro para programaciones sin recolector asignado
    sin_recolector = django_filters.BooleanFilter(
        method='filter_sin_recolector',
        label='Sin recolector asignado'
    )

    # Filtro para programaciones pendientes (PROGRAMADA o CONFIRMADA)
    pendientes = django_filters.BooleanFilter(
        method='filter_pendientes',
        label='Pendientes'
    )

    # Filtro para programaciones activas (no CANCELADA, no COMPLETADA, no REPROGRAMADA)
    activas = django_filters.BooleanFilter(
        method='filter_activas',
        label='Activas'
    )

    # Filtro para programaciones vencidas (fecha pasada y no completadas)
    vencidas = django_filters.BooleanFilter(
        method='filter_vencidas',
        label='Vencidas'
    )

    class Meta:
        model = Programacion
        fields = {
            'ecoaliado': ['exact'],
            'programado_por': ['exact'],
            'recolector_asignado': ['exact'],
            'estado': ['exact'],
            'tipo_programacion': ['exact'],
        }

    def filter_sin_recolector(self, queryset, name, value):
        """
        Filtrar programaciones sin recolector asignado
        """
        if value is True:
            return queryset.filter(recolector_asignado__isnull=True)
        elif value is False:
            return queryset.filter(recolector_asignado__isnull=False)
        return queryset

    def filter_pendientes(self, queryset, name, value):
        """
        Filtrar programaciones pendientes (PROGRAMADA o CONFIRMADA)
        """
        if value is True:
            return queryset.filter(estado__in=['PROGRAMADA', 'CONFIRMADA'])
        elif value is False:
            return queryset.exclude(estado__in=['PROGRAMADA', 'CONFIRMADA'])
        return queryset

    def filter_activas(self, queryset, name, value):
        """
        Filtrar programaciones activas (no finalizadas)
        """
        if value is True:
            return queryset.exclude(estado__in=['CANCELADA', 'COMPLETADA', 'REPROGRAMADA'])
        elif value is False:
            return queryset.filter(estado__in=['CANCELADA', 'COMPLETADA', 'REPROGRAMADA'])
        return queryset

    def filter_vencidas(self, queryset, name, value):
        """
        Filtrar programaciones vencidas (fecha pasada y no completadas)
        """
        from django.utils import timezone

        if value is True:
            return queryset.filter(
                fecha_programada__lt=timezone.now().date()
            ).exclude(
                estado__in=['COMPLETADA', 'CANCELADA', 'REPROGRAMADA']
            )
        elif value is False:
            return queryset.filter(
                fecha_programada__gte=timezone.now().date()
            ) | queryset.filter(
                estado__in=['COMPLETADA', 'CANCELADA', 'REPROGRAMADA']
            )
        return queryset
