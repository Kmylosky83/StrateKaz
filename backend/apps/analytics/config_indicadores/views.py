"""
Views para Config Indicadores - Analytics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from apps.core.mixins import StandardViewSetMixin
from .models import CatalogoKPI, FichaTecnicaKPI, MetaKPI, ConfiguracionSemaforo
from .serializers import (
    CatalogoKPISerializer, FichaTecnicaKPISerializer,
    MetaKPISerializer, ConfiguracionSemaforoSerializer
)


class CatalogoKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para CatalogoKPI"""
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
