"""
Views para Recolección en Ruta — H-SC-RUTA-02.
"""
from django.db import connection
from django.http import HttpResponse
from django.utils import timezone
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

    # ─── Impresión térmica 58mm (entregar al productor en ruta) ──────
    @action(detail=True, methods=['get'], url_path='print-58mm')
    def print_58mm(self, request, pk=None):
        """
        HTML optimizado para impresora térmica 58mm — voucher de recolección
        que se entrega al productor en cada parada (sin precios, solo cantidad).

        Auto-print al cargar (window.onload).
        """
        voucher = self.get_object()

        # ── Branding del tenant ───────────────────────────────────────
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
        if not nit:
            try:
                from apps.gestion_estrategica.configuracion.models import EmpresaConfig
                empresa_config = EmpresaConfig.get_instance()
                if empresa_config:
                    nit = empresa_config.nit or ''
            except Exception:
                pass

        # ── Datos del voucher ─────────────────────────────────────────
        fecha_recoleccion = (
            voucher.fecha_recoleccion.strftime('%d-%m-%Y')
            if voucher.fecha_recoleccion else '—'
        )
        emision = timezone.localtime(voucher.created_at).strftime('%d-%m-%Y %H:%M')
        ruta = voucher.ruta
        ruta_nombre = f"{ruta.codigo} — {ruta.nombre}" if ruta else '—'
        estado = voucher.get_estado_display()

        # Operador (cargo + nombre)
        try:
            operador_nombre = (
                voucher.operador.get_full_name() or str(voucher.operador)
            )
        except AttributeError:
            operador_nombre = '—'
        operador_cargo = ''
        op = voucher.operador
        if op is not None:
            if getattr(op, 'is_superuser', False) and not op.cargo_id:
                operador_cargo = 'Administrador del Sistema'
            else:
                cargo = getattr(op, 'cargo', None)
                if cargo is not None:
                    operador_cargo = (
                        getattr(cargo, 'nombre', '') or getattr(cargo, 'name', '') or ''
                    )
                if not operador_cargo:
                    colab = getattr(op, 'colaborador', None)
                    if colab is not None and getattr(colab, 'cargo', None):
                        operador_cargo = getattr(colab.cargo, 'nombre', '') or ''

        def fmt_kg(value):
            try:
                return f"{float(value):.2f}"
            except (TypeError, ValueError):
                return '0.00'

        def _trunc(text, maxlen=28):
            text = (text or '').strip()
            return text if len(text) <= maxlen else text[:maxlen - 1] + '…'

        # ── Líneas (parada por parada) ───────────────────────────────
        lineas = list(
            voucher.lineas.select_related('proveedor', 'producto').all()
        )
        lineas_rows = ''
        for linea in lineas:
            prov_nombre = _trunc(getattr(linea.proveedor, 'nombre_comercial', ''))
            prod_nombre = _trunc(getattr(linea.producto, 'nombre', ''))
            lineas_rows += (
                f'<div class="prov">{prov_nombre}</div>'
                f'<div class="prod">{prod_nombre}</div>'
                f'<div class="kilos"><b>{fmt_kg(linea.cantidad)} kg</b></div>'
            )

        SEP = '-' * 32
        total_kg = voucher.total_kilos

        notas_block = ''
        if voucher.notas and voucher.notas.strip():
            notas_text = voucher.notas.strip().replace('<', '&lt;').replace('>', '&gt;')
            notas_block = (
                f'<div class="notas">{notas_text}</div>'
                f'<div class="sep">{SEP}</div>'
            )

        html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{voucher.codigo}</title>
<style>
  /* Voucher de RECOLECCIÓN en ruta — formato 58mm. SIN precios. */
  @page {{ size: 58mm auto; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
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
  .indent {{ padding-left: 3mm; }}
  .prov {{ padding-left: 2mm; font-weight: bold; margin-top: 1.5mm; }}
  .prod {{ padding-left: 4mm; font-size: 8.5pt; }}
  .kilos {{ padding-left: 4mm; font-size: 9.5pt; margin-bottom: 0.5mm; }}
  .notas {{ font-size: 8pt; white-space: pre-wrap; word-break: break-word; }}
  .operador-block {{ margin-top: 2mm; text-align: center; }}
  .operador-block .nombre {{ font-weight: bold; font-size: 9pt; }}
  .operador-block .cargo {{ font-size: 7.5pt; opacity: 0.85; }}
  .brand {{ text-align: center; }}
  .brand img {{ display: block; margin: 0 auto; max-width: 40mm; max-height: 15mm; }}
  .brand .nombre {{ font-weight: bold; }}
  .brand .nit {{ font-size: 8pt; }}
  .footer {{ text-align: center; font-size: 8pt; margin-top: 1mm; }}
  @media print {{
    body {{ width: 58mm; padding: 3mm 4mm; margin: 0; }}
    @page {{ size: 58mm auto; margin: 0; }}
  }}
</style>
</head>
<body>
<div class="sep">{SEP}</div>
<div class="brand">
  {f'<img src="{logo_url}" alt="" />' if logo_url else ''}
  <div class="nombre">{empresa}</div>
  {f'<div class="nit">NIT: {nit}</div>' if nit else ''}
</div>
<div class="sep">{SEP}</div>
<div class="center bold">VOUCHER DE RECOLECCIÓN</div>
<div class="center" style="font-size:8pt;">{voucher.codigo}</div>
<div class="sep">{SEP}</div>
<div class="row"><span class="label">Fecha:</span><span class="val">{fecha_recoleccion}</span></div>
<div class="row"><span class="label">Emitido:</span><span class="val">{emision}</span></div>
<div class="sep">{SEP}</div>
<div class="bold">RUTA</div>
<div class="indent">{ruta_nombre}</div>
<div class="sep">{SEP}</div>
<div class="bold">RECOLECCIONES ({len(lineas)})</div>
{lineas_rows or '<div class="indent" style="font-size:8pt;">— Sin líneas registradas —</div>'}
<div class="sep">{SEP}</div>
<div class="row bold"><span class="label">TOTAL:</span><span class="val">{fmt_kg(total_kg)} kg</span></div>
<div class="sep">{SEP}</div>
<div class="row" style="margin-top:1mm;"><span class="label">Estado:</span><span class="val">{estado}</span></div>
<div class="sep">{SEP}</div>
{notas_block}
<div class="operador-block">
  <div style="font-size:7.5pt; opacity:0.7;">REGISTRADO POR</div>
  <div class="nombre">{operador_nombre}</div>
  {f'<div class="cargo">{operador_cargo}</div>' if operador_cargo else ''}
</div>
<div class="footer center" style="margin-top:3mm;">Este documento NO incluye precios.</div>
<div class="footer center" style="font-size:7pt; margin-top:2mm;">Powered by StrateKaz</div>
</body>
<script>window.onload = function(){{ window.print(); }};</script>
</html>"""

        return HttpResponse(html, content_type='text/html; charset=utf-8')

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
