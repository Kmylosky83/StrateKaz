"""
Views para movimientos - accounting
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from .models import ComprobanteContable, DetalleComprobante, SecuenciaDocumento, AsientoPlantilla
from .serializers import (
    ComprobanteContableListSerializer, ComprobanteContableSerializer, ComprobanteContableCreateSerializer,
    DetalleComprobanteSerializer, SecuenciaDocumentoSerializer,
    AsientoPlantillaListSerializer, AsientoPlantillaSerializer
)


class ComprobanteContableViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Comprobantes Contables."""
    queryset = ComprobanteContable.objects.select_related('empresa', 'tipo_documento', 'aprobado_por', 'anulado_por').prefetch_related('detalles').filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'tipo_documento', 'periodo', 'estado', 'origen_automatico', 'modulo_origen']
    search_fields = ['numero_comprobante', 'concepto']
    ordering_fields = ['numero_comprobante', 'fecha_comprobante', 'created_at', 'total_debito']
    ordering = ['-fecha_comprobante', '-numero_comprobante']

    def get_serializer_class(self):
        if self.action == 'list':
            return ComprobanteContableListSerializer
        if self.action == 'create':
            return ComprobanteContableCreateSerializer
        return ComprobanteContableSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def contabilizar(self, request, pk=None):
        comprobante = self.get_object()
        try:
            comprobante.contabilizar(usuario=request.user)
            return Response({'status': 'contabilizado', 'mensaje': f'Comprobante {comprobante.numero_comprobante} contabilizado.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        comprobante = self.get_object()
        motivo = request.data.get('motivo', '')
        if not motivo:
            return Response({'error': 'Debe especificar el motivo de anulación'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            comprobante.anular(motivo=motivo, usuario=request.user)
            return Response({'status': 'anulado', 'mensaje': f'Comprobante {comprobante.numero_comprobante} anulado.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        comprobante = self.get_object()
        if comprobante.estado != 'pendiente_aprobacion':
            return Response({'error': 'El comprobante no está pendiente de aprobación'}, status=status.HTTP_400_BAD_REQUEST)
        comprobante.estado = 'aprobado'
        comprobante.aprobado_por = request.user
        comprobante.fecha_aprobacion = timezone.now()
        comprobante.save(update_fields=['estado', 'aprobado_por', 'fecha_aprobacion', 'updated_at'])
        return Response({'status': 'aprobado', 'mensaje': f'Comprobante {comprobante.numero_comprobante} aprobado.'})

    @action(detail=True, methods=['post'])
    def recalcular_totales(self, request, pk=None):
        comprobante = self.get_object()
        comprobante.calcular_totales()
        return Response({'status': 'recalculado', 'total_debito': comprobante.total_debito, 'total_credito': comprobante.total_credito, 'diferencia': comprobante.diferencia})

    @action(detail=False, methods=['get'])
    def por_periodo(self, request):
        periodo = request.query_params.get('periodo')
        if not periodo:
            return Response({'error': 'Debe especificar el período (YYYY-MM)'}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(periodo=periodo)
        serializer = ComprobanteContableListSerializer(queryset, many=True)
        return Response(serializer.data)


class DetalleComprobanteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Detalles de Comprobantes."""
    queryset = DetalleComprobante.objects.select_related('comprobante', 'cuenta', 'tercero', 'centro_costo')
    serializer_class = DetalleComprobanteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['comprobante', 'cuenta', 'tercero', 'centro_costo']
    search_fields = ['descripcion', 'cuenta__codigo', 'cuenta__nombre']
    ordering_fields = ['secuencia', 'debito', 'credito']
    ordering = ['comprobante', 'secuencia']


class SecuenciaDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Secuencias de Documentos."""
    queryset = SecuenciaDocumento.objects.select_related('empresa', 'tipo_documento').filter(is_active=True)
    serializer_class = SecuenciaDocumentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'tipo_documento', 'periodo']
    search_fields = ['periodo']
    ordering_fields = ['periodo', 'consecutivo_actual']
    ordering = ['-periodo']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class AsientoPlantillaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Plantillas de Asientos."""
    queryset = AsientoPlantilla.objects.select_related('empresa', 'tipo_documento').filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'tipo_documento', 'es_recurrente', 'frecuencia']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'created_at']
    ordering = ['codigo']

    def get_serializer_class(self):
        if self.action == 'list':
            return AsientoPlantillaListSerializer
        return AsientoPlantillaSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def generar_comprobante(self, request, pk=None):
        plantilla = self.get_object()
        fecha_str = request.data.get('fecha_comprobante')
        concepto = request.data.get('concepto')
        if not fecha_str:
            return Response({'error': 'Debe especificar la fecha del comprobante'}, status=status.HTTP_400_BAD_REQUEST)
        from datetime import datetime
        try:
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        comprobante = plantilla.generar_comprobante(fecha_comprobante=fecha, concepto=concepto)
        comprobante.created_by = request.user
        comprobante.save()
        return Response({'status': 'generado', 'comprobante_id': comprobante.id, 'numero_comprobante': comprobante.numero_comprobante})
