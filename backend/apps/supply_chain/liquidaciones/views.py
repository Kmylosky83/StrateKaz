"""
ViewSets para Liquidaciones — Supply Chain (H-SC-12 header+líneas)
"""
from decimal import Decimal

from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import EstadoLiquidacion, Liquidacion, LiquidacionLinea, PagoLiquidacion
from .serializers import (
    LiquidacionLineaSerializer,
    LiquidacionListSerializer,
    LiquidacionSerializer,
    PagoLiquidacionSerializer,
)


class LiquidacionViewSet(viewsets.ModelViewSet):
    queryset = Liquidacion.objects.select_related(
        'voucher',
        'voucher__proveedor',
        'aprobado_por',
    ).prefetch_related(
        'lineas_liquidacion__voucher_linea__producto',
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['estado', 'voucher']
    ordering_fields = ['created_at', 'total', 'numero']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return LiquidacionListSerializer
        return LiquidacionSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(
        detail=True,
        methods=['patch'],
        url_path=r'lineas/(?P<linea_id>\d+)/ajuste',
    )
    def ajustar_linea(self, request, pk=None, linea_id=None):
        """
        PATCH /liquidaciones/<id>/lineas/<linea_id>/ajuste/
        Actualiza ajuste_calidad_pct y/o observaciones de una línea y
        recalcula los totales del header. Solo en estado BORRADOR.
        """
        liquidacion = self.get_object()
        if liquidacion.estado != EstadoLiquidacion.BORRADOR:
            return Response(
                {
                    'detail': (
                        f'Solo se pueden ajustar líneas en liquidaciones '
                        f'BORRADOR (actual: {liquidacion.estado}).'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        linea = get_object_or_404(
            LiquidacionLinea,
            pk=linea_id,
            liquidacion=liquidacion,
        )

        ajuste = request.data.get('ajuste_calidad_pct')
        if ajuste is not None:
            try:
                linea.ajuste_calidad_pct = Decimal(str(ajuste))
            except Exception:
                return Response(
                    {'ajuste_calidad_pct': 'Valor inválido.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        if 'observaciones' in request.data:
            linea.observaciones = request.data.get('observaciones') or ''
        linea.updated_by = request.user
        linea.save()
        liquidacion.recalcular_totales()
        liquidacion.refresh_from_db()
        return Response(LiquidacionSerializer(liquidacion).data)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """
        Aprobar liquidación (BORRADOR → APROBADA).

        H-SC-RUTA-02 D-2 (refactor 2): si la recepción de esta liquidación
        tiene N vouchers de recolección asociados (M2M), TODOS deben estar
        en COMPLETADO. Si CUALQUIERA está en BORRADOR → bloquea con
        mensaje listando los pendientes.

        Razón operativa: hasta que todos los PVs recolectados estén
        registrados como COMPLETADO, no se puede liquidar al periodo
        sin perder trazabilidad de pago a algún productor.
        """
        liquidacion = self.get_object()
        if liquidacion.estado != EstadoLiquidacion.BORRADOR:
            return Response(
                {
                    'detail': (
                        f'Solo se pueden aprobar liquidaciones en BORRADOR '
                        f'(actual: {liquidacion.estado}).'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # D-2 refactor 2: validar M2M vouchers_recoleccion (si la recepción
        # tiene asociados, todos deben estar COMPLETADOS).
        voucher = liquidacion.voucher
        from apps.supply_chain.recoleccion.models import VoucherRecoleccion
        borradores = list(
            voucher.vouchers_recoleccion.filter(
                estado=VoucherRecoleccion.Estado.BORRADOR,
            ).values('id', 'codigo', 'proveedor__nombre_comercial')
        )
        if borradores:
            codigos = ', '.join(b['codigo'] for b in borradores)
            return Response(
                {
                    'detail': (
                        f'No se puede aprobar la liquidación: hay '
                        f'{len(borradores)} voucher(s) de recolección '
                        f'asociado(s) en BORRADOR ({codigos}). Complete cada '
                        f'parada (Supply Chain → Recolección en Ruta) antes '
                        f'de liquidar.'
                    ),
                    'vouchers_borrador': borradores,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        liquidacion.aprobar(request.user)
        return Response(LiquidacionSerializer(liquidacion).data)


class PagoLiquidacionViewSet(viewsets.ModelViewSet):
    queryset = PagoLiquidacion.objects.select_related(
        'liquidacion',
        'liquidacion__voucher',
        'liquidacion__voucher__proveedor',
        'registrado_por',
    ).all()
    serializer_class = PagoLiquidacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['metodo', 'liquidacion']
    ordering_fields = ['fecha_pago', 'created_at']
    ordering = ['-fecha_pago', '-created_at']

    def perform_create(self, serializer):
        serializer.save(
            registrado_por=self.request.user,
            created_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
