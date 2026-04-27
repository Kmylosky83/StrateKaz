"""
ViewSets para Recepción — Supply Chain S3
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import connection, transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    MedicionCalidad,
    ParametroCalidad,
    RangoCalidad,
    RecepcionCalidad,
    VoucherLineaMP,
    VoucherRecepcion,
)
from .serializers import (
    MedicionCalidadBulkCreateSerializer,
    MedicionCalidadSerializer,
    ParametroCalidadSerializer,
    RangoCalidadSerializer,
    RecepcionCalidadSerializer,
    RegistrarQCSerializer,
    VoucherRecepcionListSerializer,
    VoucherRecepcionSerializer,
)


class VoucherRecepcionViewSet(viewsets.ModelViewSet):
    """
    CRUD de vouchers de recepción de materia prima.

    Filtros: proveedor, almacen_destino, modalidad_entrega, estado, fecha_viaje.
    Búsqueda: proveedor__nombre_comercial, observaciones.
    """

    queryset = VoucherRecepcion.objects.select_related(
        'proveedor', 'ruta_recoleccion',
        'almacen_destino', 'operador_bascula', 'orden_compra',
    ).prefetch_related(
        'lineas__producto',
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'proveedor', 'almacen_destino',
        'modalidad_entrega', 'estado', 'fecha_viaje',
        'ruta_recoleccion', 'orden_compra',
    ]
    search_fields = [
        'proveedor__nombre_comercial',
        'observaciones',
    ]
    ordering_fields = ['fecha_viaje', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return VoucherRecepcionListSerializer
        return VoucherRecepcionSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    # ─── Resumen de merma por ruta + fecha (H-SC-04) ──────────────────
    @action(detail=False, methods=['get'], url_path='merma-resumen')
    def merma_resumen(self, request):
        """Resumen agregado de merma por ruta + fecha."""
        ruta_id = request.query_params.get('ruta_id')
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        qs = self.get_queryset().filter(
            modalidad_entrega='RECOLECCION', estado='APROBADO',
        )
        if ruta_id:
            qs = qs.filter(ruta_recoleccion_id=ruta_id)
        if fecha_desde:
            qs = qs.filter(fecha_viaje__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_viaje__lte=fecha_hasta)

        resultado = []
        for v in qs.select_related('ruta_recoleccion').prefetch_related(
            'vouchers_recoleccion', 'lineas',
        ):
            if v.merma_kg is None:
                continue
            resultado.append({
                'voucher_id': v.id,
                'fecha_viaje': v.fecha_viaje,
                'ruta_id': v.ruta_recoleccion_id,
                'ruta_codigo': (
                    v.ruta_recoleccion.codigo if v.ruta_recoleccion else None
                ),
                'peso_recolectado': v.peso_total_recolectado,
                'peso_recibido': v.peso_total_recibido,
                'merma_kg': v.merma_kg,
                'merma_porcentaje': v.merma_porcentaje,
            })
        return Response(resultado)

    # ─── Vínculo M2M con vouchers de recolección (H-SC-RUTA-02 refactor 2) ──
    @action(detail=True, methods=['post'], url_path='asociar-recolecciones')
    def asociar_recolecciones(self, request, pk=None):
        """
        Asocia/desasocia N VoucherRecoleccion con esta recepción consolidada.

        Body: {"vouchers_recoleccion": [<id>, <id>, ...]}
        Lista vacía = desasociar todos.

        El inventario YA ENTRÓ con esta recepción — los vouchers de recolección
        son evidencia/detalle para liquidar cada productor por separado. Se
        permite reasociar mientras la recepción no esté LIQUIDADA.

        Validación: todos los IDs deben ser vouchers existentes. Si alguno
        está en BORRADOR, queda registrado el vínculo pero la liquidación
        del periodo se bloqueará (ver D-2 en LiquidacionViewSet).
        """
        voucher = self.get_object()
        if voucher.estado == voucher.EstadoVoucher.LIQUIDADO:
            raise ValidationError({
                'detail': 'No se puede modificar el vínculo: la recepción ya fue liquidada.',
            })

        ids = request.data.get('vouchers_recoleccion', [])
        if not isinstance(ids, list):
            raise ValidationError({
                'vouchers_recoleccion': 'Se esperaba una lista de IDs.',
            })

        from apps.supply_chain.recoleccion.models import VoucherRecoleccion
        if ids:
            existentes = VoucherRecoleccion.objects.filter(pk__in=ids)
            ids_existentes = set(existentes.values_list('id', flat=True))
            ids_faltantes = set(int(i) for i in ids) - ids_existentes
            if ids_faltantes:
                raise ValidationError({
                    'vouchers_recoleccion': (
                        f'No existen los vouchers de recolección con IDs: {sorted(ids_faltantes)}.'
                    ),
                })
            voucher.vouchers_recoleccion.set(existentes)
        else:
            voucher.vouchers_recoleccion.clear()

        voucher.updated_by = request.user
        voucher.save(update_fields=['updated_by', 'updated_at'])

        serializer = VoucherRecepcionSerializer(voucher, context={'request': request})
        return Response(serializer.data)

    # ─── Transiciones de estado (H-SC-03) ─────────────────────────────
    @action(detail=True, methods=['post'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        """
        Transiciona el voucher a APROBADO.

        Bloquea si alguna línea tiene un producto con `requiere_qc_recepcion=True`
        y no existe un RecepcionCalidad registrado (o si el QC fue RECHAZADO).

        Dispara el signal post_save que crea MovimientoInventario e
        Inventario por cada línea en el almacén destino.
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

    # H-SC-TALONARIO: Asociar talonario manual desde planta
    # Transcribe vouchers de recoleccion post-hoc + asocia al M2M.
    # Delega creacion al endpoint canonico de recoleccion.
    @action(detail=True, methods=['post'], url_path='asociar-talonario-planta')
    def asociar_talonario_planta(self, request, pk=None):
        """
        Transcribe un talonario manual y asocia los vouchers creados a esta
        recepcion. Body equivalente a /recoleccion/vouchers/transcribir-talonario/
        pero ruta_id se infiere de voucher.ruta_recoleccion.
        """
        from apps.supply_chain.recoleccion.models import VoucherRecoleccion
        from apps.supply_chain.recoleccion.serializers import (
            TranscribirTalonarioSerializer,
            VoucherRecoleccionSerializer,
        )

        voucher = self.get_object()

        if voucher.estado == voucher.EstadoVoucher.LIQUIDADO:
            raise ValidationError({
                'detail': 'No se puede modificar una recepción ya liquidada.',
            })
        if voucher.modalidad_entrega != VoucherRecepcion.ModalidadEntrega.RECOLECCION:
            raise ValidationError({
                'detail': (
                    'Solo recepciones de modalidad RECOLECCION admiten '
                    'transcripción de talonario manual.'
                ),
            })
        if not voucher.ruta_recoleccion_id:
            raise ValidationError({
                'detail': (
                    'La recepción no tiene ruta asignada. Asigne la ruta '
                    'antes de transcribir el talonario.'
                ),
            })

        payload = dict(request.data)
        payload['ruta_id'] = voucher.ruta_recoleccion_id

        serializer = TranscribirTalonarioSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        operador_id = data.get('operador_id')
        ruta_id = data['ruta_id']
        fecha = data['fecha_recoleccion']
        user = request.user

        creados = []
        with transaction.atomic():
            for parada in data['paradas']:
                vrc = VoucherRecoleccion(
                    ruta_id=ruta_id,
                    fecha_recoleccion=fecha,
                    proveedor_id=parada['proveedor_id'],
                    producto_id=parada['producto_id'],
                    cantidad=parada['cantidad_kg'],
                    operador_id=operador_id,
                    origen_registro=VoucherRecoleccion.OrigenRegistro.TRANSCRIPCION_PLANTA,
                    numero_talonario=parada.get('numero_talonario', ''),
                    registrado_por_planta=user,
                    estado=VoucherRecoleccion.Estado.COMPLETADO,
                    notas=parada.get('notas', ''),
                    created_by=user,
                    updated_by=user,
                )
                vrc.full_clean()
                vrc.save()
                creados.append(vrc)

            voucher.vouchers_recoleccion.add(*creados)
            voucher.updated_by = user
            voucher.save(update_fields=['updated_by', 'updated_at'])

        out = VoucherRecoleccionSerializer(creados, many=True)
        return Response(
            {
                'creados': out.data,
                'total': len(creados),
                'voucher_recepcion_id': voucher.id,
            },
            status=status.HTTP_201_CREATED,
        )

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

    # ─── Impresión térmica 80mm (PDF via VoucherPDFService) ──────────
    @action(detail=True, methods=['get'], url_path='print-80mm')
    def print_80mm(self, request, pk=None):
        """Devuelve PDF 80mm imprimible del voucher (H-SC-01 refactor)."""
        from .services import VoucherPDFService

        voucher = self.get_object()
        pdf_bytes = VoucherPDFService.generar_pdf_80mm(voucher)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = (
            f'inline; filename="voucher-{voucher.id}-80mm.pdf"'
        )
        return response

    @action(detail=True, methods=['get'], url_path='pdf-carta')
    def pdf_carta(self, request, pk=None):
        """PDF carta del voucher para archivo / consulta formal (H-SC-01)."""
        from .services import VoucherPDFService

        voucher = self.get_object()
        pdf_bytes = VoucherPDFService.generar_pdf_carta(voucher)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="voucher-{voucher.id}.pdf"'
        )
        return response



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


# ══════════════════════════════════════════════════════════════════════
# QC CONFIGURABLE (H-SC-11 Fase 1)
# ══════════════════════════════════════════════════════════════════════


class ParametroCalidadViewSet(viewsets.ModelViewSet):
    """CRUD de parámetros de calidad configurables por tenant."""

    queryset = ParametroCalidad.objects.prefetch_related('ranges').all()
    serializer_class = ParametroCalidadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['code', 'name']
    ordering_fields = ['order', 'name', 'created_at']
    ordering = ['order', 'name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class RangoCalidadViewSet(viewsets.ModelViewSet):
    """
    CRUD de rangos de clasificación por parámetro.

    Filtrar por parámetro: ?parameter=<id>
    """

    queryset = RangoCalidad.objects.select_related('parameter').all()
    serializer_class = RangoCalidadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['parameter', 'is_active']
    ordering_fields = ['order', 'min_value']
    ordering = ['parameter', 'order']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class MedicionCalidadViewSet(viewsets.ModelViewSet):
    """
    CRUD de mediciones por línea de voucher.

    Filtrar por línea: ?voucher_line=<id>
    Filtrar por voucher: ?voucher_line__voucher=<id>
    """

    queryset = MedicionCalidad.objects.select_related(
        'parameter', 'classified_range', 'voucher_line', 'measured_by'
    ).all()
    serializer_class = MedicionCalidadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'voucher_line': ['exact'],
        'voucher_line__voucher': ['exact'],
        'parameter': ['exact'],
        'classified_range': ['exact'],
    }
    ordering_fields = ['measured_at']
    ordering = ['-measured_at']

    def perform_create(self, serializer):
        user = self.request.user
        # Si no se pasa measured_by, usar request.user (comportamiento sano
        # para UI que asume "yo registro la medición ahora mismo").
        extra = {'created_by': user, 'updated_by': user}
        if not serializer.validated_data.get('measured_by'):
            extra['measured_by'] = user
        serializer.save(**extra)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class VoucherLineMeasurementsBulkView(APIView):
    """
    Bulk-create de mediciones sobre una línea de voucher.

    Endpoint: POST /voucher-lines/<pk>/measurements/bulk/
    Body: {"measurements": [{parameter_id, measured_value, observations?}, ...]}

    Crea N mediciones atómicamente asociadas a la línea. Falla todo si
    algún item es inválido (único por (voucher_line, parameter) activo).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        linea = get_object_or_404(VoucherLineaMP, pk=pk)

        serializer = MedicionCalidadBulkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items = serializer.validated_data['measurements']

        user = request.user
        created_objs = []
        with transaction.atomic():
            for item in items:
                parameter = get_object_or_404(
                    ParametroCalidad, pk=item['parameter_id']
                )
                med = MedicionCalidad(
                    voucher_line=linea,
                    parameter=parameter,
                    measured_value=item['measured_value'],
                    observations=item.get('observations', ''),
                    measured_by=user,
                    created_by=user,
                    updated_by=user,
                )
                med.save()
                created_objs.append(med)

        out = MedicionCalidadSerializer(created_objs, many=True)
        return Response(out.data, status=status.HTTP_201_CREATED)
