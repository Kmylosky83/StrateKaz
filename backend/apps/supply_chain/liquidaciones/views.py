"""
ViewSets para Liquidaciones — Supply Chain S3
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Liquidacion
from .serializers import LiquidacionSerializer


class LiquidacionViewSet(viewsets.ModelViewSet):
    queryset = Liquidacion.objects.select_related(
        'linea', 'linea__voucher', 'linea__voucher__proveedor', 'linea__producto',
    ).all()
    serializer_class = LiquidacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['estado', 'linea', 'linea__voucher']
    ordering_fields = ['created_at', 'total_liquidado']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar liquidación (PENDIENTE → APROBADA)."""
        liquidacion = self.get_object()
        if liquidacion.estado != Liquidacion.EstadoLiquidacion.PENDIENTE:
            return Response(
                {'detail': f'Solo se pueden aprobar liquidaciones en estado PENDIENTE '
                           f'(actual: {liquidacion.estado}).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        liquidacion.estado = Liquidacion.EstadoLiquidacion.APROBADA
        liquidacion.updated_by = request.user
        liquidacion.save(update_fields=['estado', 'updated_by', 'updated_at'])
        return Response(LiquidacionSerializer(liquidacion).data)
