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

    # ─── Impresión térmica 58mm (H-SC-03) ─────────────────────────────
    @action(detail=True, methods=['get'], url_path='print-58mm')
    def print_58mm(self, request, pk=None):
        """
        Retorna HTML optimizado para impresora térmica de 58mm.

        El HTML incluye auto-print via window.onload para facilitar
        la impresión directa desde el navegador.
        """
        voucher = self.get_object()

        # ── Branding del tenant (H-SC-13) ─────────────────────────────
        # El header muestra los datos del tenant (la empresa que emite el
        # voucher), no del proveedor del software. Fuente primaria: modelo
        # Tenant (nit, nombre_comercial, logo). Fallback: EmpresaConfig.
        tenant = getattr(connection, 'tenant', None)
        empresa = 'StrateKaz'
        nit = ''
        logo_url = ''
        if tenant is not None:
            empresa = (
                getattr(tenant, 'nombre_comercial', None)
                or getattr(tenant, 'razon_social', None)
                or getattr(tenant, 'name', None)
                or 'StrateKaz'
            )
            nit = getattr(tenant, 'nit', '') or ''
            logo_field = getattr(tenant, 'logo', None)
            if logo_field and hasattr(logo_field, 'url'):
                try:
                    logo_url = request.build_absolute_uri(logo_field.url)
                except Exception:
                    logo_url = ''
        # Fallback: EmpresaConfig (si el Tenant no trae NIT configurado)
        if not nit:
            try:
                from apps.gestion_estrategica.configuracion.models import EmpresaConfig
                empresa_config = EmpresaConfig.get_instance()
                if empresa_config:
                    nit = empresa_config.nit or ''
            except Exception:
                pass

        # ── Helpers de formato ────────────────────────────────────────
        def fmt_kg(value):
            """Formato 1 decimal: 56.0kg (antes 56.000kg)."""
            try:
                return f"{float(value):.1f}"
            except (TypeError, ValueError):
                return '0.0'

        # ── Datos del voucher ─────────────────────────────────────────
        fecha_viaje = voucher.fecha_viaje.strftime('%d-%m-%Y') if voucher.fecha_viaje else '—'

        created_at_local = timezone.localtime(voucher.created_at)
        emision = created_at_local.strftime('%d-%m-%Y %H:%M')

        prov = voucher.proveedor
        _prov_nombre = getattr(prov, 'nombre_comercial', str(prov)) if prov else '—'
        _prov_codigo = getattr(prov, 'codigo_interno', '') if prov else ''
        proveedor_nombre = f"{_prov_codigo} - {_prov_nombre}" if _prov_codigo else _prov_nombre
        almacen_nombre = getattr(voucher.almacen_destino, 'nombre', str(voucher.almacen_destino))
        modalidad = voucher.get_modalidad_entrega_display()
        estado = voucher.get_estado_display()

        try:
            full_name = voucher.operador_bascula.get_full_name() or str(voucher.operador_bascula)
        except AttributeError:
            full_name = '—'

        # Cargo del operador para mostrar bajo el nombre.
        # Para superadmin (sin cargo) usamos el label canónico del sistema
        # (ver CLAUDE.md → "Superadmin — Reglas de Identidad").
        operador_cargo = ''
        op = voucher.operador_bascula
        if op is not None:
            if getattr(op, 'is_superuser', False) and not op.cargo_id:
                operador_cargo = 'Administrador del Sistema'
            else:
                cargo = getattr(op, 'cargo', None)
                if cargo is not None:
                    operador_cargo = (
                        getattr(cargo, 'nombre', '')
                        or getattr(cargo, 'name', '')
                        or ''
                    )
                if not operador_cargo:
                    colab = getattr(op, 'colaborador', None)
                    if colab is not None and getattr(colab, 'cargo', None):
                        operador_cargo = getattr(colab.cargo, 'nombre', '') or ''

        # Ruta de recolección (solo aplica a modalidades de recolección).
        ruta_nombre = ''
        if voucher.ruta_recoleccion_id:
            ruta_nombre = getattr(voucher.ruta_recoleccion, 'nombre', '') or ''

        # QC resumen: "N/A" si el voucher no requiere QC; si lo requiere y
        # las mediciones ya se imprimieron inline por línea, no se repite al
        # final. Si no hay QC registrado se marca "Pendiente".
        if voucher.requiere_qc:
            qc_resumen = 'Registrado' if voucher.tiene_qc else 'Pendiente'
        else:
            qc_resumen = 'N/A'

        # Estado compacto para ticket térmico (el display completo es largo:
        # "Aprobado — listo para liquidar" no cabe bien en 58mm).
        estado_compacto = {
            'PENDIENTE_QC': 'PENDIENTE QC',
            'APROBADO': 'APROBADO',
            'RECHAZADO': 'RECHAZADO',
            'LIQUIDADO': 'LIQUIDADO',
        }.get(voucher.estado, estado)

        # ── Bloque de líneas con mediciones QC ────────────────────────
        lineas = list(
            voucher.lineas
            .select_related('producto')
            .prefetch_related('measurements__parameter', 'measurements__classified_range')
            .all()
        )
        peso_total = voucher.peso_neto_total

        def fmt_val(value, decimals=1):
            try:
                return f"{float(value):.{decimals}f}"
            except (TypeError, ValueError):
                return '0'

        # Formato por línea optimizado para 58mm:
        #   Nombre del producto (truncado si largo)
        #     B:56.0 T:0.0 N:56.0 kg          ← pesos en una sola fila
        #     QC Acidez 8.0% (Tipo B)          ← medición con clasificación
        def _trunc(text, maxlen=28):
            text = (text or '').strip()
            return text if len(text) <= maxlen else text[:maxlen - 1] + '…'

        lineas_rows = ''
        for linea in lineas:
            prod_nombre = _trunc(getattr(linea.producto, 'nombre', str(linea.producto)))
            tara = float(linea.peso_tara_kg or 0)
            # Omitir tara si es 0 para ahorrar ancho
            if tara > 0:
                pesos_line = (
                    f'B:{fmt_kg(linea.peso_bruto_kg)} '
                    f'T:{fmt_kg(linea.peso_tara_kg)} '
                    f'<b>N:{fmt_kg(linea.peso_neto_kg)}</b>'
                )
            else:
                pesos_line = (
                    f'B:{fmt_kg(linea.peso_bruto_kg)} '
                    f'<b>N:{fmt_kg(linea.peso_neto_kg)}</b> kg'
                )
            lineas_rows += (
                f'<div class="prod">{prod_nombre}</div>'
                f'<div class="pesos">{pesos_line}</div>'
            )
            # Mediciones QC inline con clasificación (H-SC-E2E mejora):
            for med in linea.measurements.all():
                param_name = getattr(med.parameter, 'name', '') if med.parameter else ''
                unit = getattr(med.parameter, 'unit', '') if med.parameter else ''
                rango = getattr(med.classified_range, 'name', '') if med.classified_range_id else ''
                rango_txt = f' ({rango})' if rango else ''
                lineas_rows += (
                    f'<div class="qc">QC {param_name} '
                    f'{fmt_val(med.measured_value)}{unit}{rango_txt}</div>'
                )

        SEP = '-' * 32

        # ── Bloque de observaciones (condicional) ─────────────────────
        obs_block = ''
        if voucher.observaciones and voucher.observaciones.strip():
            obs_text = voucher.observaciones.strip().replace('<', '&lt;').replace('>', '&gt;')
            obs_block = f'<div class="obs">{obs_text}</div><div class="sep">{SEP}</div>'

        # ── HTML ──────────────────────────────────────────────────────
        html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Voucher #{voucher.pk:04d}</title>
<style>
  /* Diseno profesional ticket termico 58mm:
     - @page sin margenes (el body los define internamente con padding)
     - body ocupa los 58mm completos con padding simetrico → el contenido
       queda CENTRADO en el papel fisico. */
  @page {{
    size: 58mm auto;
    margin: 0;
  }}
  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}
  body {{
    font-family: 'Courier New', Courier, monospace;
    font-size: 9pt;
    line-height: 1.3;
    width: 58mm;
    padding: 3mm 4mm;
    margin: 0 auto;
    color: #000;
    background: #fff;
  }}
  .center {{ text-align: center; }}
  .bold {{ font-weight: bold; }}
  .sep {{ letter-spacing: 0; white-space: pre; line-height: 1; }}
  .row {{ display: flex; justify-content: space-between; }}
  .label {{ white-space: nowrap; }}
  .val {{ text-align: right; }}
  .indent {{ padding-left: 4mm; }}
  .prod {{ padding-left: 3mm; font-weight: bold; margin-top: 1mm; }}
  .pesos {{ padding-left: 3mm; font-size: 8.5pt; }}
  .qc {{ padding-left: 3mm; font-size: 8pt; font-style: italic; }}
  .obs {{ font-size: 8pt; white-space: pre-wrap; word-break: break-word; }}
  .operador-block {{
    margin-top: 2mm;
    text-align: center;
  }}
  .operador-block .nombre {{ font-weight: bold; font-size: 9pt; }}
  .operador-block .cargo {{ font-size: 7.5pt; opacity: 0.85; }}
  .footer {{ text-align: center; font-size: 8pt; margin-top: 1mm; }}
  @media print {{
    body {{ width: 58mm; padding: 3mm 4mm; margin: 0; }}
    @page {{ size: 58mm auto; margin: 0; }}
  }}
</style>
</head>
<body>
<div class="sep">{SEP}</div>
{f'<div class="center"><img src="{logo_url}" style="max-width:40mm;max-height:15mm;" /></div>' if logo_url else ''}
<div class="center bold">{empresa}</div>
{f'<div class="center" style="font-size:8pt;">NIT: {nit}</div>' if nit else ''}
<div class="sep">{SEP}</div>
<div class="center bold">VOUCHER RECEPCION MP</div>
<div class="center" style="font-size:8pt;">No. {voucher.pk:04d}</div>
<div class="sep">{SEP}</div>
<div class="row"><span class="label">Fecha viaje:</span><span class="val">{fecha_viaje}</span></div>
<div class="row"><span class="label">Emitido:</span><span class="val">{emision}</span></div>
<div class="sep">{SEP}</div>
<div class="bold">PROVEEDOR</div>
<div class="indent">{proveedor_nombre}</div>
{f'<div class="bold" style="margin-top:1mm;">RUTA</div><div class="indent">{ruta_nombre}</div>' if ruta_nombre else ''}
<div class="bold" style="margin-top:1mm;">MODALIDAD</div>
<div class="indent">{modalidad}</div>
<div class="sep">{SEP}</div>
<div class="bold">MATERIAS PRIMAS ({len(lineas)})</div>
{lineas_rows}
<div class="sep">{SEP}</div>
<div class="row bold"><span class="label">TOTAL NETO:</span><span class="val">{fmt_kg(peso_total)} kg</span></div>
<div class="sep">{SEP}</div>
<div class="bold">ALMACEN DESTINO</div>
<div class="indent">{almacen_nombre}</div>
<div class="row" style="margin-top:1mm;"><span class="label">Estado:</span><span class="val">{estado_compacto}</span></div>
<div class="row"><span class="label">QC:</span><span class="val">{qc_resumen}</span></div>
<div class="sep">{SEP}</div>
{obs_block}
<div class="operador-block">
  <div style="font-size:7.5pt; opacity:0.7;">REALIZADO POR</div>
  <div class="nombre">{full_name}</div>
  {f'<div class="cargo">{operador_cargo}</div>' if operador_cargo else ''}
</div>
<div class="footer center" style="margin-top:3mm;">Powered by StrateKaz</div>
<div class="footer center" style="font-size:7pt;">stratekaz.com · Consultoría 4.0</div>
</body>
<script>window.onload = function(){{ window.print(); }};</script>
</html>"""

        return HttpResponse(html, content_type='text/html; charset=utf-8')


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
