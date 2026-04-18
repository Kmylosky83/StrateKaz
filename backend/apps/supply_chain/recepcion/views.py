"""
ViewSets para Recepción — Supply Chain S3
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import RecepcionCalidad, VoucherRecepcion
from .serializers import (
    RecepcionCalidadSerializer,
    VoucherRecepcionListSerializer,
    VoucherRecepcionSerializer,
)


class VoucherRecepcionViewSet(viewsets.ModelViewSet):
    """
    CRUD de vouchers de recepción de materia prima.

    Filtros: proveedor, producto, almacen_destino, modalidad_entrega, estado, fecha_viaje.
    Búsqueda: proveedor__nombre_comercial, producto__nombre, observaciones.
    """

    queryset = VoucherRecepcion.objects.select_related(
        'proveedor', 'producto', 'uneg_transportista',
        'almacen_destino', 'operador_bascula', 'orden_compra',
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'proveedor', 'producto', 'almacen_destino',
        'modalidad_entrega', 'estado', 'fecha_viaje',
        'uneg_transportista', 'orden_compra',
    ]
    search_fields = [
        'proveedor__nombre_comercial',
        'producto__nombre',
        'observaciones',
    ]
    ordering_fields = ['fecha_viaje', 'created_at', 'peso_neto_kg']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return VoucherRecepcionListSerializer
        return VoucherRecepcionSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class RecepcionCalidadViewSet(viewsets.ModelViewSet):
    """CRUD de resultados de control de calidad por voucher."""

    queryset = RecepcionCalidad.objects.select_related('voucher', 'analista').all()
    serializer_class = RecepcionCalidadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['voucher', 'resultado', 'analista']
    ordering_fields = ['fecha_analisis', 'created_at']
    ordering = ['-fecha_analisis']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
