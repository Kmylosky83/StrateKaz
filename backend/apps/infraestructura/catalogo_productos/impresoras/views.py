"""ViewSet para ImpresoraTermica."""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import ImpresoraTermica
from .serializers import ImpresoraTermicaSerializer


class ImpresoraTermicaViewSet(viewsets.ModelViewSet):
    """CRUD de impresoras termicas del tenant.

    Filtros: tipo_conexion, ancho_papel, usuario_asignado, sede, is_active.
    Busqueda: nombre, direccion.
    """

    queryset = ImpresoraTermica.objects.select_related(
        'usuario_asignado', 'sede',
    ).all()
    serializer_class = ImpresoraTermicaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'tipo_conexion',
        'ancho_papel',
        'usuario_asignado',
        'sede',
        'is_active',
    ]
    search_fields = ['nombre', 'direccion']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
