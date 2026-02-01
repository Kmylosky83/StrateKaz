"""
Views para integracion - accounting
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db import models
from django.db.models import Count

from .models import ParametrosIntegracion, LogIntegracion, ColaContabilizacion
from .serializers import (
    ParametrosIntegracionListSerializer, ParametrosIntegracionSerializer,
    LogIntegracionListSerializer, LogIntegracionSerializer,
    ColaContabilizacionListSerializer, ColaContabilizacionSerializer, ColaContabilizacionCreateSerializer
)


class ParametrosIntegracionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Parámetros de Integración."""
    queryset = ParametrosIntegracion.objects.select_related('empresa', 'cuenta_contable').filter(is_active=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'modulo', 'activo']
    search_fields = ['clave', 'descripcion', 'cuenta_contable__codigo', 'cuenta_contable__nombre']
    ordering_fields = ['modulo', 'clave', 'created_at']
    ordering = ['modulo', 'clave']

    def get_serializer_class(self):
        if self.action == 'list':
            return ParametrosIntegracionListSerializer
        return ParametrosIntegracionSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def por_modulo(self, request):
        """Obtiene parámetros agrupados por módulo."""
        modulo = request.query_params.get('modulo')
        if not modulo:
            return Response({'error': 'Debe especificar el parámetro modulo'}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(modulo=modulo, activo=True)
        serializer = ParametrosIntegracionListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Obtiene resumen de parámetros por módulo."""
        empresa_id = request.query_params.get('empresa')
        queryset = self.get_queryset()
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        resumen = queryset.values('modulo').annotate(
            total=Count('id'),
            activos=Count('id', filter=models.Q(activo=True))
        )
        return Response(list(resumen))

    @action(detail=True, methods=['post'])
    def toggle_activo(self, request, pk=None):
        """Activa o desactiva un parámetro."""
        parametro = self.get_object()
        parametro.activo = not parametro.activo
        parametro.save(update_fields=['activo', 'updated_at'])
        return Response({'status': 'actualizado', 'activo': parametro.activo})


class LogIntegracionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Logs de Integración."""
    queryset = LogIntegracion.objects.select_related('empresa', 'comprobante', 'created_by')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'modulo_origen', 'estado']
    search_fields = ['descripcion', 'documento_origen_tipo']
    ordering_fields = ['created_at', 'procesado_at', 'estado']
    ordering = ['-created_at']
    http_method_names = ['get', 'head', 'options']  # Solo lectura

    def get_serializer_class(self):
        if self.action == 'list':
            return LogIntegracionListSerializer
        return LogIntegracionSerializer

    @action(detail=False, methods=['get'])
    def por_documento(self, request):
        """Busca logs por documento origen."""
        modulo = request.query_params.get('modulo')
        tipo = request.query_params.get('tipo')
        documento_id = request.query_params.get('documento_id')
        if not all([modulo, tipo, documento_id]):
            return Response({'error': 'Debe especificar modulo, tipo y documento_id'}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(
            modulo_origen=modulo,
            documento_origen_tipo=tipo,
            documento_origen_id=documento_id
        )
        serializer = LogIntegracionSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def errores_recientes(self, request):
        """Obtiene los errores recientes de integración."""
        empresa_id = request.query_params.get('empresa')
        limit = int(request.query_params.get('limit', 20))
        queryset = self.get_queryset().filter(estado='error')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        queryset = queryset[:limit]
        serializer = LogIntegracionListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtiene estadísticas de integración."""
        empresa_id = request.query_params.get('empresa')
        queryset = self.get_queryset()
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        stats = queryset.values('estado').annotate(total=Count('id'))
        return Response({item['estado']: item['total'] for item in stats})


class ColaContabilizacionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de Cola de Contabilización."""
    queryset = ColaContabilizacion.objects.select_related('empresa', 'comprobante_generado')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['empresa', 'modulo_origen', 'estado', 'prioridad']
    search_fields = ['documento_origen_tipo']
    ordering_fields = ['prioridad', 'created_at', 'procesado_at']
    ordering = ['prioridad', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ColaContabilizacionListSerializer
        if self.action == 'create':
            return ColaContabilizacionCreateSerializer
        return ColaContabilizacionSerializer

    @action(detail=True, methods=['post'])
    def reintentar(self, request, pk=None):
        """Reintenta el procesamiento de un elemento de la cola."""
        item = self.get_object()
        if not item.puede_reintentar():
            return Response({'error': 'Se alcanzó el máximo de intentos'}, status=status.HTTP_400_BAD_REQUEST)
        if item.estado not in ['error', 'pendiente']:
            return Response({'error': 'Solo se pueden reintentar elementos en estado error o pendiente'}, status=status.HTTP_400_BAD_REQUEST)
        item.estado = 'pendiente'
        item.mensaje_error = ''
        item.proximo_intento_at = timezone.now()
        item.save(update_fields=['estado', 'mensaje_error', 'proximo_intento_at'])
        return Response({'status': 'reintentando', 'cola_id': item.id})

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela un elemento de la cola."""
        item = self.get_object()
        if item.estado == 'completado':
            return Response({'error': 'No se puede cancelar un elemento completado'}, status=status.HTTP_400_BAD_REQUEST)
        if item.estado == 'procesando':
            return Response({'error': 'No se puede cancelar un elemento en procesamiento'}, status=status.HTTP_400_BAD_REQUEST)
        item.delete()
        return Response({'status': 'cancelado'})

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Obtiene elementos pendientes de procesar."""
        empresa_id = request.query_params.get('empresa')
        queryset = self.get_queryset().filter(estado='pendiente')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        serializer = ColaContabilizacionListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def errores(self, request):
        """Obtiene elementos con error."""
        empresa_id = request.query_params.get('empresa')
        queryset = self.get_queryset().filter(estado='error')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        serializer = ColaContabilizacionListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def reintentar_todos(self, request):
        """Reintenta todos los elementos con error que pueden reintentar."""
        empresa_id = request.data.get('empresa')
        if not empresa_id:
            return Response({'error': 'Debe especificar empresa'}, status=status.HTTP_400_BAD_REQUEST)
        updated = ColaContabilizacion.objects.filter(
            empresa_id=empresa_id,
            estado='error'
        ).exclude(intentos__gte=models.F('max_intentos')).update(
            estado='pendiente',
            mensaje_error='',
            proximo_intento_at=timezone.now()
        )
        return Response({'status': 'reintentando', 'total_reintentados': updated})

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtiene estadísticas de la cola."""
        empresa_id = request.query_params.get('empresa')
        queryset = self.get_queryset()
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        stats = queryset.values('estado').annotate(total=Count('id'))
        por_modulo = queryset.values('modulo_origen').annotate(total=Count('id'))
        return Response({
            'por_estado': {item['estado']: item['total'] for item in stats},
            'por_modulo': {item['modulo_origen']: item['total'] for item in por_modulo}
        })
