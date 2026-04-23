"""
Views para catalogos - supply_chain
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Almacen, TipoAlmacen
from .serializers import AlmacenSerializer, TipoAlmacenSerializer


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
    """CRUD para Almacenes.

    Filtros extra (H-SC-07):
    - ?para_recepcion=1: filtra almacenes habilitados para recepción en la
      sede del operador (request.user.sede_asignada). Si el user no tiene
      sede_asignada, cae al fallback de todos los permite_recepcion activos.
    - ?sede=<id>: filtra almacenes de una sede específica (usado por UI de
      "almacenes de esta sede").
    """
    queryset = Almacen.objects.all()
    serializer_class = AlmacenSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'es_principal', 'permite_despacho', 'permite_recepcion',
        'tipo_almacen', 'sede', 'is_active',
    ]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']

    def get_queryset(self):
        qs = super().get_queryset().select_related(
            'tipo_almacen', 'sede', 'created_by', 'updated_by',
        )

        params = self.request.query_params

        # ?para_recepcion=1 → filtrar por sede del operador + permite_recepcion.
        if params.get('para_recepcion') in ('1', 'true', 'True'):
            user = self.request.user
            sede_usuario = getattr(user, 'sede_asignada', None)
            qs = qs.filter(permite_recepcion=True, is_active=True)
            if sede_usuario is not None:
                qs = qs.filter(sede=sede_usuario)
            # Si el user no tiene sede_asignada, cae al fallback de todos
            # los permite_recepcion activos (ya aplicado arriba).

        # ?sede=<id> ya lo resuelve filterset_fields, no-op aquí.
        return qs
