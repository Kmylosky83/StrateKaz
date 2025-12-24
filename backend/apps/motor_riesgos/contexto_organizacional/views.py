from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import FactorExterno, FactorInterno, AnalisisDOFA, EstrategiaDOFA
from .serializers import (
    FactorExternoSerializer,
    FactorInternoSerializer,
    AnalisisDOFASerializer,
    EstrategiaDOFASerializer
)


class FactorExternoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de factores externos (PESTEL)
    """
    queryset = FactorExterno.objects.all()
    serializer_class = FactorExternoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo', 'impacto', 'probabilidad', 'relevancia', 'is_active', 'empresa_id']
    search_fields = ['descripcion']
    ordering_fields = ['created_at', 'relevancia', 'tipo']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class FactorInternoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de factores internos (DOFA)
    """
    queryset = FactorInterno.objects.all()
    serializer_class = FactorInternoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo', 'relevancia', 'is_active', 'empresa_id']
    search_fields = ['descripcion', 'area_afectada']
    ordering_fields = ['created_at', 'relevancia', 'tipo']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AnalisisDOFAViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de análisis DOFA
    """
    queryset = AnalisisDOFA.objects.select_related(
        'elaborado_por', 'aprobado_por'
    ).prefetch_related('estrategias')
    serializer_class = AnalisisDOFASerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['periodo', 'empresa_id']
    search_fields = ['periodo', 'conclusiones']
    ordering_fields = ['fecha_analisis', 'created_at']
    ordering = ['-fecha_analisis']
    
    @action(detail=True, methods=['get'])
    def matriz_completa(self, request, pk=None):
        """
        Retorna la matriz DOFA completa con factores internos y estrategias
        """
        analisis = self.get_object()
        
        # Obtener factores internos activos de la empresa
        fortalezas = FactorInterno.objects.filter(
            empresa_id=analisis.empresa_id,
            tipo='FORTALEZA',
            is_active=True
        )
        debilidades = FactorInterno.objects.filter(
            empresa_id=analisis.empresa_id,
            tipo='DEBILIDAD',
            is_active=True
        )
        oportunidades = FactorInterno.objects.filter(
            empresa_id=analisis.empresa_id,
            tipo='OPORTUNIDAD',
            is_active=True
        )
        amenazas = FactorInterno.objects.filter(
            empresa_id=analisis.empresa_id,
            tipo='AMENAZA',
            is_active=True
        )
        
        # Obtener estrategias por tipo
        estrategias_fo = analisis.estrategias.filter(tipo='FO')
        estrategias_fa = analisis.estrategias.filter(tipo='FA')
        estrategias_do = analisis.estrategias.filter(tipo='DO')
        estrategias_da = analisis.estrategias.filter(tipo='DA')
        
        return Response({
            'analisis': AnalisisDOFASerializer(analisis).data,
            'factores': {
                'fortalezas': FactorInternoSerializer(fortalezas, many=True).data,
                'debilidades': FactorInternoSerializer(debilidades, many=True).data,
                'oportunidades': FactorInternoSerializer(oportunidades, many=True).data,
                'amenazas': FactorInternoSerializer(amenazas, many=True).data,
            },
            'estrategias': {
                'fo': EstrategiaDOFASerializer(estrategias_fo, many=True).data,
                'fa': EstrategiaDOFASerializer(estrategias_fa, many=True).data,
                'do': EstrategiaDOFASerializer(estrategias_do, many=True).data,
                'da': EstrategiaDOFASerializer(estrategias_da, many=True).data,
            },
            'resumen': {
                'total_fortalezas': fortalezas.count(),
                'total_debilidades': debilidades.count(),
                'total_oportunidades': oportunidades.count(),
                'total_amenazas': amenazas.count(),
                'total_estrategias': analisis.estrategias.count(),
            }
        })


class EstrategiaDOFAViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de estrategias DOFA
    """
    queryset = EstrategiaDOFA.objects.select_related(
        'analisis_dofa', 'responsable', 'created_by'
    )
    serializer_class = EstrategiaDOFASerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo', 'estado', 'prioridad', 'empresa_id', 'analisis_dofa']
    search_fields = ['descripcion', 'objetivo']
    ordering_fields = ['fecha_limite', 'prioridad', 'created_at']
    ordering = ['-prioridad', 'fecha_limite']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
