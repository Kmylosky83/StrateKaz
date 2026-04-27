"""
ViewSets para Liquidaciones — Supply Chain (H-SC-12 header+líneas + H-SC-02).
"""
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    ESTADOS_EDITABLES,
    EstadoLiquidacion,
    HistorialAjusteLiquidacion,
    Liquidacion,
    LiquidacionLinea,
    LiquidacionPeriodica,
    PagoLiquidacion,
)
from .serializers import (
    LiquidacionListSerializer,
    LiquidacionPeriodicaSerializer,
    LiquidacionSerializer,
    PagoLiquidacionSerializer,
)


class LiquidacionViewSet(viewsets.ModelViewSet):
    queryset = (
        Liquidacion.objects.select_related(
            'voucher',
            'voucher__proveedor',
            'aprobado_por',
        )
        .prefetch_related(
            'lineas_liquidacion__voucher_linea__producto',
            'historial_ajustes',
        )
        .all()
    )
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

    # ─── Ajuste de línea con historial (H-SC-02) ───────────────────────
    @action(
        detail=True,
        methods=['patch'],
        url_path=r'lineas/(?P<linea_id>\d+)/ajuste',
    )
    def ajustar_linea(self, request, pk=None, linea_id=None):
        """
        PATCH /liquidaciones/<id>/lineas/<linea_id>/ajuste/

        Body:
        {
          "ajuste_calidad_pct": "10.00",       # opcional
          "precio_unitario": "3500.00",        # opcional
          "observaciones": "...",              # opcional
          "motivo": "Ajuste por humedad alta"  # OBLIGATORIO si hay cambio
        }

        - Solo en estados editables (SUGERIDA / AJUSTADA / BORRADOR legacy).
        - Motivo OBLIGATORIO cuando se modifica precio o calidad.
        - Crea HistorialAjusteLiquidacion (append-only) por cada cambio.
        - Si la liquidación estaba SUGERIDA, transiciona a AJUSTADA.
        """
        liquidacion = self.get_object()
        if liquidacion.estado not in ESTADOS_EDITABLES:
            return Response(
                {
                    'detail': (
                        f'Solo se pueden ajustar líneas en liquidaciones '
                        f'editables (SUGERIDA / AJUSTADA). Estado actual: '
                        f'{liquidacion.estado}.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        linea = get_object_or_404(
            LiquidacionLinea,
            pk=linea_id,
            liquidacion=liquidacion,
        )

        # Parsear cambios
        cambios = []  # list[(tipo_ajuste, anterior, nuevo)]
        nuevo_ajuste = request.data.get('ajuste_calidad_pct', None)
        nuevo_precio = request.data.get('precio_unitario', None)
        nueva_observacion = request.data.get('observaciones', None)
        motivo = (request.data.get('motivo') or '').strip()

        if nuevo_ajuste is not None:
            try:
                nuevo_ajuste_dec = Decimal(str(nuevo_ajuste))
            except (InvalidOperation, ValueError):
                return Response(
                    {'ajuste_calidad_pct': 'Valor inválido.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            anterior = linea.ajuste_calidad_pct or Decimal('0.00')
            if nuevo_ajuste_dec != anterior:
                cambios.append(
                    (
                        HistorialAjusteLiquidacion.TipoAjuste.CALIDAD,
                        anterior,
                        nuevo_ajuste_dec,
                    )
                )
                linea.ajuste_calidad_pct = nuevo_ajuste_dec

        if nuevo_precio is not None:
            try:
                nuevo_precio_dec = Decimal(str(nuevo_precio))
            except (InvalidOperation, ValueError):
                return Response(
                    {'precio_unitario': 'Valor inválido.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            anterior = linea.precio_unitario or Decimal('0.00')
            if nuevo_precio_dec != anterior:
                cambios.append(
                    (
                        HistorialAjusteLiquidacion.TipoAjuste.PRECIO,
                        anterior,
                        nuevo_precio_dec,
                    )
                )
                linea.precio_unitario = nuevo_precio_dec

        # Motivo es obligatorio cuando hay cambios contables (precio/calidad).
        if cambios and not motivo:
            return Response(
                {
                    'motivo': (
                        'El motivo es obligatorio para ajustar precio o '
                        'porcentaje de calidad.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if nueva_observacion is not None:
            linea.observaciones = nueva_observacion or ''

        with transaction.atomic():
            linea.updated_by = request.user
            linea.save()

            for tipo_ajuste, anterior, nuevo in cambios:
                HistorialAjusteLiquidacion.objects.create(
                    liquidacion=liquidacion,
                    linea=linea,
                    tipo_ajuste=tipo_ajuste,
                    valor_anterior=anterior,
                    valor_nuevo=nuevo,
                    motivo=motivo,
                    origen=HistorialAjusteLiquidacion.Origen.MANUAL,
                    modificado_por=request.user,
                    created_by=request.user,
                )

            liquidacion.recalcular_totales()

            # Transición SUGERIDA → AJUSTADA si hubo cambios contables.
            if cambios and liquidacion.estado == EstadoLiquidacion.SUGERIDA:
                liquidacion.estado = EstadoLiquidacion.AJUSTADA
                liquidacion.save(update_fields=['estado', 'updated_at'])

        liquidacion.refresh_from_db()
        return Response(LiquidacionSerializer(liquidacion).data)

    # ─── Confirmar (CONFIRMADA + archivado GD) ─────────────────────────
    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        """
        Transiciona la liquidación a CONFIRMADA y la archiva en GD.

        Solo se permite desde SUGERIDA / AJUSTADA / BORRADOR (legacy).

        H-SC-RUTA-02 D-2: si la recepción tiene N vouchers de recolección
        asociados (M2M), TODOS deben estar en COMPLETADO.
        """
        liquidacion = self.get_object()
        if liquidacion.estado not in ESTADOS_EDITABLES:
            return Response(
                {
                    'detail': (
                        f'Solo se pueden confirmar liquidaciones editables '
                        f'(SUGERIDA / AJUSTADA). Estado actual: '
                        f'{liquidacion.estado}.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # D-2: validar vouchers de recolección asociados.
        voucher = liquidacion.voucher
        if voucher is not None:
            try:
                from apps.supply_chain.recoleccion.models import (
                    VoucherRecoleccion,
                )

                borradores = list(
                    voucher.vouchers_recoleccion.filter(
                        estado=VoucherRecoleccion.Estado.BORRADOR,
                    ).values('id', 'codigo', 'proveedor__nombre_comercial')
                )
            except Exception:
                borradores = []
            if borradores:
                codigos = ', '.join(b['codigo'] for b in borradores)
                return Response(
                    {
                        'detail': (
                            f'No se puede confirmar la liquidación: hay '
                            f'{len(borradores)} voucher(s) de recolección '
                            f'asociado(s) en BORRADOR ({codigos}). Complete '
                            f'cada parada antes de confirmar.'
                        ),
                        'vouchers_borrador': borradores,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        liquidacion.confirmar(request.user)
        return Response(LiquidacionSerializer(liquidacion).data)

    # ─── Backward-compat: aprobar() = confirmar() ──────────────────────
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """
        Alias de `confirmar` por compatibilidad con clientes existentes.

        Misma validación D-2 (vouchers de recolección). Se mantendrá hasta
        que el FE migre a `confirmar`.
        """
        return self.confirmar(request, pk=pk)


class PagoLiquidacionViewSet(viewsets.ModelViewSet):
    queryset = (
        PagoLiquidacion.objects.select_related(
            'liquidacion',
            'liquidacion__voucher',
            'liquidacion__voucher__proveedor',
            'registrado_por',
        ).all()
    )
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


class LiquidacionPeriodicaViewSet(viewsets.ModelViewSet):
    """
    ViewSet del agregado periódico H-SC-06 (preservado de upstream).

    Endpoints:
    - GET/POST /liquidaciones-periodicas/
    - GET/PATCH/DELETE /liquidaciones-periodicas/<pk>/
    - POST /liquidaciones-periodicas/<pk>/confirmar/
    - POST /liquidaciones-periodicas/<pk>/marcar_pagada/
    """

    queryset = (
        LiquidacionPeriodica.objects.select_related(
            'proveedor', 'aprobado_por'
        )
        .prefetch_related('liquidaciones')
        .all()
    )
    serializer_class = LiquidacionPeriodicaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['estado', 'proveedor', 'frecuencia']
    ordering_fields = ['periodo_fin', 'created_at', 'total']
    ordering = ['-periodo_fin']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        """BORRADOR -> CONFIRMADA. Snapshot del aprobador + timestamp."""
        instance = self.get_object()
        if instance.estado != LiquidacionPeriodica.Estado.BORRADOR:
            return Response(
                {'error': 'Solo se confirma en estado BORRADOR'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.estado = LiquidacionPeriodica.Estado.CONFIRMADA
        instance.aprobado_por = request.user
        instance.fecha_aprobacion = timezone.now()
        instance.save(
            update_fields=[
                'estado',
                'aprobado_por',
                'fecha_aprobacion',
                'updated_at',
            ]
        )
        return Response(LiquidacionPeriodicaSerializer(instance).data)

    @action(detail=True, methods=['post'])
    def marcar_pagada(self, request, pk=None):
        """CONFIRMADA -> PAGADA. Cierre del ciclo."""
        instance = self.get_object()
        if instance.estado != LiquidacionPeriodica.Estado.CONFIRMADA:
            return Response(
                {'error': 'Solo se marca pagada si está CONFIRMADA'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.estado = LiquidacionPeriodica.Estado.PAGADA
        instance.save(update_fields=['estado', 'updated_at'])
        return Response(LiquidacionPeriodicaSerializer(instance).data)


# Re-export para imports relativos en tests u otros módulos.
__all__ = [
    'LiquidacionViewSet',
    'PagoLiquidacionViewSet',
    'LiquidacionPeriodicaViewSet',
]
