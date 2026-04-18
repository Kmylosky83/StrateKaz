"""
Views para catalogos - supply_chain
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Almacen, TipoAlmacen, UnidadMedida
from .serializers import AlmacenSerializer, TipoAlmacenSerializer, UnidadMedidaSerializer


class UnidadMedidaViewSet(viewsets.ModelViewSet):
    """CRUD para Unidades de Medida (catálogo compartido)."""
    queryset = UnidadMedida.objects.filter(is_active=True)
    serializer_class = UnidadMedidaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo', 'is_active']
    search_fields = ['codigo', 'nombre', 'simbolo']
    ordering_fields = ['orden', 'nombre', 'codigo']


class TipoAlmacenViewSet(viewsets.ModelViewSet):
    """CRUD para Tipos de Almacén (silo / contenedor / pallet / piso)."""
    queryset = TipoAlmacen.objects.filter(is_active=True)
    serializer_class = TipoAlmacenSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'codigo']


class AlmacenViewSet(viewsets.ModelViewSet):
    """CRUD para Almacenes."""
    queryset = Almacen.objects.all()
    serializer_class = AlmacenSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'es_principal', 'permite_despacho', 'permite_recepcion',
        'tipo_almacen', 'is_active',
    ]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']

    def get_queryset(self):
        return super().get_queryset().select_related(
            'empresa', 'tipo_almacen', 'created_by', 'updated_by',
        )
