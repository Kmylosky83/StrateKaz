"""
ViewSets para Datos Maestros Compartidos — Core (C0)

Departamentos, Ciudades y Tipos de Documento de Identidad.
Migrados desde supply_chain.gestion_proveedores.
"""
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from apps.core.models import TipoDocumentoIdentidad, Departamento, Ciudad
from .serializers_datos_maestros import (
    TipoDocumentoIdentidadSerializer,
    DepartamentoSerializer,
    CiudadSerializer,
)


class DatosMaestrosBaseViewSet(viewsets.ModelViewSet):
    """ViewSet base para catálogos de datos maestros."""
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Catálogos pequeños, no necesitan paginación
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        queryset = super().get_queryset()
        solo_activos = self.request.query_params.get('solo_activos', 'false')
        if solo_activos.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        return queryset


class TipoDocumentoIdentidadViewSet(DatosMaestrosBaseViewSet):
    """ViewSet para Tipos de Documento de Identidad."""
    queryset = TipoDocumentoIdentidad.objects.all()
    serializer_class = TipoDocumentoIdentidadSerializer
    search_fields = ['codigo', 'nombre']
    filterset_fields = ['is_active']
    ordering_fields = ['orden', 'nombre']


class DepartamentoViewSet(DatosMaestrosBaseViewSet):
    """
    ViewSet para Departamentos de Colombia.

    Endpoints adicionales:
    - GET .../departamentos/{id}/ciudades/ — Ciudades del departamento
    """
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    search_fields = ['codigo', 'nombre', 'codigo_dane']
    filterset_fields = ['is_active']
    ordering_fields = ['orden', 'nombre']

    @action(detail=True, methods=['get'])
    def ciudades(self, request, pk=None):
        departamento = self.get_object()
        ciudades = departamento.ciudades.filter(is_active=True).order_by('nombre')
        serializer = CiudadSerializer(ciudades, many=True)
        return Response({
            'departamento': departamento.nombre,
            'ciudades': serializer.data
        })


class CiudadViewSet(DatosMaestrosBaseViewSet):
    """
    ViewSet para Ciudades de Colombia.

    Endpoints adicionales:
    - GET .../ciudades/autocomplete/?q=&departamento_id=
    """
    queryset = Ciudad.objects.all()
    serializer_class = CiudadSerializer
    search_fields = ['codigo', 'nombre', 'codigo_dane']
    filterset_fields = ['departamento', 'is_active', 'es_capital']
    ordering_fields = ['nombre', 'departamento__nombre']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('departamento')

    @action(detail=False, methods=['get'])
    def autocomplete(self, request):
        query = request.query_params.get('q', '').strip()
        departamento_id = request.query_params.get('departamento_id')
        limit = min(int(request.query_params.get('limit', 10)), 50)

        queryset = Ciudad.objects.filter(is_active=True).select_related('departamento')

        if departamento_id:
            queryset = queryset.filter(departamento_id=departamento_id)

        if len(query) < 2:
            return Response([])

        queryset = queryset.filter(
            Q(nombre__icontains=query) | Q(codigo__icontains=query)
        )[:limit]

        serializer = CiudadSerializer(queryset, many=True)
        return Response(serializer.data)
