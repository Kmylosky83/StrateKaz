"""
Views para Generador de Informes - Analytics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from apps.core.mixins import StandardViewSetMixin
from .models import PlantillaInforme, InformeDinamico, ProgramacionInforme, HistorialInforme
from .serializers import (
    PlantillaInformeSerializer, InformeDinamicoSerializer,
    ProgramacionInformeSerializer, HistorialInformeSerializer
)


class PlantillaInformeViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para PlantillaInforme"""
    queryset = PlantillaInforme.objects.select_related('empresa')
    serializer_class = PlantillaInformeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_informe', 'formato_salida', 'es_predefinida', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion', 'norma_relacionada']
    ordering_fields = ['codigo', 'nombre', 'tipo_informe', 'created_at']
    ordering = ['codigo']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset


class InformeDinamicoViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para InformeDinamico"""
    queryset = InformeDinamico.objects.select_related('plantilla', 'empresa', 'generado_por')
    serializer_class = InformeDinamicoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plantilla', 'estado', 'is_active']
    search_fields = ['nombre', 'plantilla__nombre']
    ordering_fields = ['fecha_generacion', 'created_at']
    ordering = ['-fecha_generacion']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset


class ProgramacionInformeViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para ProgramacionInforme"""
    queryset = ProgramacionInforme.objects.select_related('plantilla', 'empresa')
    serializer_class = ProgramacionInformeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['plantilla', 'frecuencia', 'esta_activa', 'is_active']
    search_fields = ['nombre', 'plantilla__nombre']
    ordering_fields = ['proxima_ejecucion', 'created_at']
    ordering = ['proxima_ejecucion']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset


class HistorialInformeViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para HistorialInforme"""
    queryset = HistorialInforme.objects.select_related('programacion', 'informe', 'empresa')
    serializer_class = HistorialInformeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['programacion', 'fue_exitoso', 'fue_enviado', 'is_active']
    search_fields = ['programacion__nombre', 'informe__nombre']
    ordering_fields = ['fecha_ejecucion']
    ordering = ['-fecha_ejecucion']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset
