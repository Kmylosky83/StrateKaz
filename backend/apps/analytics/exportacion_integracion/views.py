"""Views para Exportación e Integración"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.core.mixins import StandardViewSetMixin
from apps.core.permissions import GranularActionPermission
from .models import ConfiguracionExportacion, LogExportacion
from .serializers import ConfiguracionExportacionSerializer, LogExportacionSerializer

class ConfiguracionExportacionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = ConfiguracionExportacion.objects.all()
    serializer_class = ConfiguracionExportacionSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'exportacion_integracion'
    filterset_fields = ['tipo_exportacion', 'formato_archivo', 'destino', 'esta_activa', 'is_active']
    ordering = ['nombre']

class LogExportacionViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = LogExportacion.objects.select_related('configuracion', 'usuario')
    serializer_class = LogExportacionSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'exportacion_integracion'
    filterset_fields = ['configuracion', 'tipo', 'estado', 'usuario', 'is_active']
    ordering = ['-fecha_ejecucion']
