"""
Views para Recolección en Ruta — H-SC-RUTA-02.
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import VoucherRecoleccion, LineaVoucherRecoleccion
from .serializers import (
    VoucherRecoleccionSerializer,
    LineaVoucherRecoleccionSerializer,
)


class VoucherRecoleccionViewSet(viewsets.ModelViewSet):
    """CRUD de Vouchers de Recolección en Ruta (H-SC-RUTA-02)."""

    queryset = VoucherRecoleccion.objects.select_related(
        'ruta', 'operador'
    ).prefetch_related('lineas__proveedor', 'lineas__producto')
    serializer_class = VoucherRecoleccionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['ruta', 'estado', 'fecha_recoleccion', 'operador']
    search_fields = ['codigo', 'notas', 'ruta__codigo', 'ruta__nombre']
    ordering_fields = ['fecha_recoleccion', 'codigo', 'created_at']
    ordering = ['-fecha_recoleccion', '-created_at']

    def perform_create(self, serializer):
        serializer.save(
            operador=self.request.user,
            created_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Marca el voucher como COMPLETADO (cierra captura). No reversible vía API."""
        voucher = self.get_object()
        if voucher.estado != VoucherRecoleccion.Estado.BORRADOR:
            return Response(
                {'detail': f'Solo vouchers en BORRADOR pueden completarse '
                           f'(actual: {voucher.get_estado_display()}).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not voucher.lineas.exists():
            return Response(
                {'detail': 'No se puede completar un voucher sin líneas.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        voucher.estado = VoucherRecoleccion.Estado.COMPLETADO
        voucher.updated_by = request.user
        voucher.save(update_fields=['estado', 'updated_by', 'updated_at'])
        return Response(self.get_serializer(voucher).data)


class LineaVoucherRecoleccionViewSet(viewsets.ModelViewSet):
    """CRUD de Líneas de Voucher de Recolección."""

    queryset = LineaVoucherRecoleccion.objects.select_related(
        'voucher', 'proveedor', 'producto'
    )
    serializer_class = LineaVoucherRecoleccionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['voucher', 'proveedor', 'producto']
    ordering_fields = ['voucher', 'created_at']
    ordering = ['voucher', 'id']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
