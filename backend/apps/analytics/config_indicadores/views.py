"""
Views para Config Indicadores - Analytics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from apps.core.mixins import StandardViewSetMixin
from .models import CatalogoKPI, FichaTecnicaKPI, MetaKPI, ConfiguracionSemaforo
from .serializers import (
    CatalogoKPISerializer, FichaTecnicaKPISerializer,
    MetaKPISerializer, ConfiguracionSemaforoSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary='Listar todos los KPIs',
        description='Obtiene el catálogo completo de indicadores (KPIs) configurados en el sistema',
        tags=['Analytics']
    ),
    retrieve=extend_schema(
        summary='Obtener detalle de un KPI',
        description='Obtiene la información detallada de un indicador específico',
        tags=['Analytics']
    ),
    create=extend_schema(
        summary='Crear nuevo KPI',
        description='Crea un nuevo indicador en el catálogo de KPIs',
        tags=['Analytics']
    ),
    update=extend_schema(
        summary='Actualizar KPI',
        description='Actualiza completamente un indicador existente',
        tags=['Analytics']
    ),
    partial_update=extend_schema(
        summary='Actualizar parcialmente KPI',
        description='Actualiza campos específicos de un indicador',
        tags=['Analytics']
    ),
    destroy=extend_schema(
        summary='Eliminar KPI',
        description='Elimina un indicador del catálogo (soft delete)',
        tags=['Analytics']
    )
)
class CatalogoKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de KPIs (Indicadores Clave de Desempeño)

    Permite administrar el catálogo de indicadores del sistema, incluyendo:
    - Configuración de fórmulas de cálculo
    - Definición de frecuencia de medición
    - Categorización por área funcional
    - Configuración de semáforos y alertas
    """
    queryset = CatalogoKPI.objects.select_related('empresa')
    serializer_class = CatalogoKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['categoria', 'tipo_indicador', 'frecuencia_medicion', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'categoria', 'created_at']
    ordering = ['codigo']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @extend_schema(
        summary='KPIs agrupados por categoría',
        description='Obtiene la cantidad de KPIs agrupados por categoría funcional',
        tags=['Analytics'],
        parameters=[
            OpenApiParameter(
                name='empresa_id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description='ID de la empresa para filtrar KPIs'
            )
        ]
    )
    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Obtener KPIs agrupados por categoría"""
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset()
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        resultado = queryset.values('categoria').annotate(
            total=Count('id')
        ).order_by('categoria')

        return Response(list(resultado))

    @extend_schema(
        summary='KPIs agrupados por área',
        description='Alias de por_categoria para compatibilidad con versiones anteriores',
        tags=['Analytics'],
        deprecated=True
    )
    @action(detail=False, methods=['get'])
    def por_area(self, request):
        """Alias de por_categoria para compatibilidad"""
        return self.por_categoria(request)


class FichaTecnicaKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para FichaTecnicaKPI"""
    queryset = FichaTecnicaKPI.objects.select_related('kpi', 'empresa')
    serializer_class = FichaTecnicaKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['kpi', 'is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre', 'objetivo']
    ordering_fields = ['kpi__codigo', 'created_at']
    ordering = ['kpi__codigo']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset


class MetaKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para MetaKPI"""
    queryset = MetaKPI.objects.select_related('kpi', 'empresa')
    serializer_class = MetaKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['kpi', 'is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre']
    ordering_fields = ['periodo_inicio', 'periodo_fin', 'created_at']
    ordering = ['-periodo_inicio']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset


class ConfiguracionSemaforoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para ConfiguracionSemaforo"""
    queryset = ConfiguracionSemaforo.objects.select_related('kpi', 'empresa')
    serializer_class = ConfiguracionSemaforoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['kpi', 'is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre']
    ordering_fields = ['kpi__codigo', 'created_at']
    ordering = ['kpi__codigo']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset
