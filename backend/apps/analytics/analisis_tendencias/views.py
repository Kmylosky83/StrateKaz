"""
Views para Análisis de Tendencias - Analytics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from apps.core.mixins import StandardViewSetMixin
from .models import AnalisisKPI, TendenciaKPI, AnomaliaDetectada
from .serializers import (
    AnalisisKPISerializer, TendenciaKPISerializer, AnomaliaDetectadaSerializer
)


class AnalisisKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para AnalisisKPI"""
    queryset = AnalisisKPI.objects.select_related('kpi', 'empresa')
    serializer_class = AnalisisKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['kpi', 'tipo_analisis', 'direccion', 'is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre', 'observaciones']
    ordering_fields = ['periodo_analisis', 'variacion_porcentual', 'created_at']
    ordering = ['-periodo_analisis']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def resumen_por_direccion(self, request):
        """Obtener resumen de análisis agrupados por dirección"""
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset()
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        resultado = queryset.values('direccion').annotate(
            total=Count('id')
        ).order_by('direccion')

        return Response(list(resultado))


class TendenciaKPIViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para TendenciaKPI"""
    queryset = TendenciaKPI.objects.select_related('kpi', 'empresa')
    serializer_class = TendenciaKPISerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['kpi', 'tipo_tendencia', 'is_active']
    search_fields = ['kpi__codigo', 'kpi__nombre']
    ordering_fields = ['periodo_fin', 'r_cuadrado', 'created_at']
    ordering = ['-periodo_fin']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def por_tipo_tendencia(self, request):
        """Obtener tendencias agrupadas por tipo"""
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset()
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        resultado = queryset.values('tipo_tendencia').annotate(
            total=Count('id')
        ).order_by('tipo_tendencia')

        return Response(list(resultado))


class AnomaliaDetectadaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para AnomaliaDetectada"""
    queryset = AnomaliaDetectada.objects.select_related(
        'valor_kpi', 'valor_kpi__kpi', 'empresa', 'usuario_revision'
    )
    serializer_class = AnomaliaDetectadaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_anomalia', 'severidad', 'esta_revisada', 'es_falso_positivo', 'is_active']
    search_fields = ['valor_kpi__kpi__codigo', 'valor_kpi__kpi__nombre', 'accion_tomada']
    ordering_fields = ['fecha_deteccion', 'severidad', 'desviacion_std']
    ordering = ['-fecha_deteccion']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=True, methods=['post'])
    def marcar_revisada(self, request, pk=None):
        """Marcar anomalía como revisada"""
        from django.utils import timezone

        anomalia = self.get_object()

        if anomalia.esta_revisada:
            return Response(
                {'error': 'Esta anomalía ya ha sido revisada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        anomalia.esta_revisada = True
        anomalia.fecha_revision = timezone.now()
        anomalia.usuario_revision = request.user
        anomalia.accion_tomada = request.data.get('accion_tomada', '')
        anomalia.es_falso_positivo = request.data.get('es_falso_positivo', False)
        anomalia.save()

        serializer = self.get_serializer(anomalia)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pendientes_revision(self, request):
        """Obtener anomalías pendientes de revisión"""
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset()
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        queryset = queryset.filter(esta_revisada=False).order_by('-severidad', '-fecha_deteccion')

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def resumen_por_severidad(self, request):
        """Obtener resumen de anomalías por severidad"""
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset()
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        resultado = queryset.values('severidad').annotate(
            total=Count('id'),
            pendientes=Count('id', filter=Q(esta_revisada=False))
        ).order_by('severidad')

        return Response(list(resultado))
