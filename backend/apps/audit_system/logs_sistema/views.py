"""
Views del módulo Logs del Sistema - Audit System
"""

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    ConfiguracionAuditoria,
    LogAcceso,
    LogCambio,
    LogConsulta
)
from .serializers import (
    ConfiguracionAuditoriaSerializer,
    LogAccesoSerializer,
    LogCambioSerializer,
    LogConsultaSerializer
)


class ConfiguracionAuditoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para ConfiguracionAuditoria"""

    queryset = ConfiguracionAuditoria.objects.all()
    serializer_class = ConfiguracionAuditoriaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['modulo', 'modelo', 'is_active']
    search_fields = ['modulo', 'modelo']
    ordering_fields = ['modulo', 'modelo', 'created_at']
    ordering = ['modulo', 'modelo']


class LogAccesoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para LogAcceso (solo lectura)"""

    queryset = LogAcceso.objects.select_related('usuario')
    serializer_class = LogAccesoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['usuario', 'tipo_evento', 'fue_exitoso']
    search_fields = ['usuario__first_name', 'usuario__last_name', 'ip_address']
    ordering_fields = ['created_at', 'tipo_evento']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='por-usuario')
    def por_usuario(self, request):
        """Logs de acceso por usuario"""
        usuario_id = request.query_params.get('usuario_id')
        if usuario_id:
            queryset = self.get_queryset().filter(usuario_id=usuario_id)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        return Response([])


class LogCambioViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para LogCambio (solo lectura)"""

    queryset = LogCambio.objects.select_related('usuario', 'content_type')
    serializer_class = LogCambioSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['usuario', 'accion', 'content_type']
    search_fields = ['object_repr', 'usuario__first_name', 'usuario__last_name']
    ordering_fields = ['created_at', 'accion']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='por-objeto')
    def por_objeto(self, request):
        """Logs de cambio de un objeto específico"""
        content_type_id = request.query_params.get('content_type_id')
        object_id = request.query_params.get('object_id')

        if content_type_id and object_id:
            queryset = self.get_queryset().filter(
                content_type_id=content_type_id,
                object_id=object_id
            )
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        return Response([])

    @action(detail=False, methods=['get'], url_path='por-usuario')
    def por_usuario(self, request):
        """Logs de cambio por usuario"""
        usuario_id = request.query_params.get('usuario_id')
        if usuario_id:
            queryset = self.get_queryset().filter(usuario_id=usuario_id)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        return Response([])


class LogConsultaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para LogConsulta (solo lectura)"""

    queryset = LogConsulta.objects.select_related('usuario')
    serializer_class = LogConsultaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['usuario', 'modulo', 'fue_exportacion']
    search_fields = ['modulo', 'endpoint', 'usuario__first_name', 'usuario__last_name']
    ordering_fields = ['created_at', 'modulo']
    ordering = ['-created_at']
