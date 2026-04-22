"""
ViewSets para Recepción — Supply Chain S3
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import RecepcionCalidad, VoucherRecepcion
from .serializers import (
    RecepcionCalidadSerializer,
    RegistrarQCSerializer,
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

    # ─── Transiciones de estado (H-SC-03) ─────────────────────────────
    @action(detail=True, methods=['post'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        """
        Transiciona el voucher a APROBADO.

        Bloquea si el producto tiene `requiere_qc_recepcion=True` y no
        existe un RecepcionCalidad registrado (o si el QC fue RECHAZADO).

        Dispara el signal post_save que crea MovimientoInventario e
        Inventario en el almacén destino.
        """
        voucher = self.get_object()
        try:
            voucher.aprobar()
        except DjangoValidationError as e:
            # Normaliza ValidationError de Django a DRF
            messages = e.messages if hasattr(e, 'messages') else [str(e)]
            raise ValidationError({'detail': messages[0] if messages else str(e)})

        serializer = VoucherRecepcionSerializer(voucher, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        """Transiciona el voucher a RECHAZADO. Idempotente."""
        voucher = self.get_object()
        if voucher.estado == VoucherRecepcion.EstadoVoucher.RECHAZADO:
            serializer = VoucherRecepcionSerializer(voucher, context={'request': request})
            return Response(serializer.data)
        if voucher.estado not in (
            VoucherRecepcion.EstadoVoucher.PENDIENTE_QC,
        ):
            raise ValidationError({
                'detail': f'No se puede rechazar un voucher en estado {voucher.get_estado_display()}.'
            })
        voucher.estado = VoucherRecepcion.EstadoVoucher.RECHAZADO
        voucher.observaciones = (
            (voucher.observaciones or '')
            + f'\n[{timezone.now():%Y-%m-%d %H:%M}] Rechazado: '
            + str(request.data.get('motivo', 'sin motivo'))
        ).strip()
        voucher.save(update_fields=['estado', 'observaciones', 'updated_at'])
        serializer = VoucherRecepcionSerializer(voucher, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='registrar-qc')
    def registrar_qc(self, request, pk=None):
        """
        Registra o actualiza el control de calidad del voucher.

        H-SC-03: valida que todos los parámetros críticos estén presentes
        y dentro de rango si el resultado es APROBADO. Si existe un
        RecepcionCalidad previo, se actualiza (upsert).
        """
        voucher = self.get_object()
        if voucher.estado not in (
            VoucherRecepcion.EstadoVoucher.PENDIENTE_QC,
        ):
            raise ValidationError({
                'detail': (
                    f'Solo se puede registrar QC en vouchers PENDIENTE_QC '
                    f'(actual: {voucher.get_estado_display()}).'
                )
            })

        serializer = RegistrarQCSerializer(
            data=request.data,
            context={'voucher': voucher, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        analista_id = data.get('analista') or request.user.id
        fecha_analisis = data.get('fecha_analisis') or timezone.now()

        calidad, created = RecepcionCalidad.objects.get_or_create(
            voucher=voucher,
            defaults={
                'parametros_medidos': data['parametros_medidos'],
                'resultado': data['resultado'],
                'analista_id': analista_id,
                'fecha_analisis': fecha_analisis,
                'observaciones': data.get('observaciones', ''),
                'created_by': request.user,
                'updated_by': request.user,
            },
        )
        if not created:
            calidad.parametros_medidos = data['parametros_medidos']
            calidad.resultado = data['resultado']
            calidad.analista_id = analista_id
            calidad.fecha_analisis = fecha_analisis
            calidad.observaciones = data.get('observaciones', '')
            calidad.updated_by = request.user
            calidad.save()

        out = RecepcionCalidadSerializer(calidad, context={'request': request})
        return Response(
            out.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


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
