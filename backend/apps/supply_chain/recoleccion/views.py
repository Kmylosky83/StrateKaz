"""
Views para Recolección en Ruta — H-SC-RUTA-02 refactor 2.

H-SC-TALONARIO (2026-04-27): nuevo endpoint POST /transcribir-talonario/ que
permite registrar N vouchers post-hoc desde planta cuando la ruta salió a
campo sin tablet/celular y trajo talonarios físicos.
"""
from django.db import connection, transaction
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import VoucherRecoleccion
from .serializers import (
    TranscribirTalonarioSerializer,
    VoucherRecoleccionSerializer,
)


class VoucherRecoleccionViewSet(viewsets.ModelViewSet):
    """CRUD de Vouchers de Recolección — 1 voucher = 1 parada (H-SC-RUTA-02)."""

    queryset = VoucherRecoleccion.objects.select_related(
        'ruta', 'proveedor', 'producto', 'operador', 'registrado_por_planta',
    )
    serializer_class = VoucherRecoleccionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'ruta', 'proveedor', 'producto', 'estado', 'fecha_recoleccion',
        'operador', 'origen_registro', 'registrado_por_planta',
    ]
    search_fields = [
        'codigo', 'notas', 'numero_talonario',
        'proveedor__nombre_comercial', 'proveedor__codigo_interno',
        'ruta__codigo', 'ruta__nombre',
    ]
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
        """Marca el voucher como COMPLETADO (cierra captura)."""
        voucher = self.get_object()
        if voucher.estado != VoucherRecoleccion.Estado.BORRADOR:
            return Response(
                {'detail': f'Solo vouchers en BORRADOR pueden completarse '
                           f'(actual: {voucher.get_estado_display()}).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        voucher.estado = VoucherRecoleccion.Estado.COMPLETADO
        voucher.updated_by = request.user
        voucher.save(update_fields=['estado', 'updated_by', 'updated_at'])

        # H-SC-GD-ARCHIVE: archivado idempotente al completar (falla silencioso)
        from .services import archivar_voucher_en_gd
        archivar_voucher_en_gd(voucher, request.user)
        voucher.refresh_from_db()

        return Response(self.get_serializer(voucher).data)

    # ─── H-SC-TALONARIO: transcripción post-hoc desde planta ─────────
    @action(
        detail=False,
        methods=['post'],
        url_path='transcribir-talonario',
    )
    def transcribir_talonario(self, request):
        """
        Registra N vouchers atómicamente a partir de un talonario físico.

        Body:
            {
              "ruta_id": <int>,
              "fecha_recoleccion": "YYYY-MM-DD",
              "operador_id": <int|null>,    # opcional
              "paradas": [
                {
                  "proveedor_id": <int>,
                  "producto_id": <int>,
                  "cantidad_kg": "150.000",
                  "numero_talonario": "TAL-001",
                  "notas": "..."
                },
                ...
              ]
            }

        - Cada voucher creado queda en estado COMPLETADO (talonario ya cerrado).
        - origen_registro=TRANSCRIPCION_PLANTA.
        - registrado_por_planta=request.user.
        - Atomic: o se crean todos o ninguno.
        - Validación: cada proveedor_id debe ser parada activa de la ruta.
        """
        serializer = TranscribirTalonarioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        operador_id = data.get('operador_id')
        ruta_id = data['ruta_id']
        fecha = data['fecha_recoleccion']
        user = request.user

        creados = []
        with transaction.atomic():
            for parada in data['paradas']:
                voucher = VoucherRecoleccion(
                    ruta_id=ruta_id,
                    fecha_recoleccion=fecha,
                    proveedor_id=parada['proveedor_id'],
                    producto_id=parada['producto_id'],
                    cantidad=parada['cantidad_kg'],
                    operador_id=operador_id,
                    origen_registro=(
                        VoucherRecoleccion.OrigenRegistro.TRANSCRIPCION_PLANTA
                    ),
                    numero_talonario=parada.get('numero_talonario', ''),
                    registrado_por_planta=user,
                    estado=VoucherRecoleccion.Estado.COMPLETADO,
                    notas=parada.get('notas', ''),
                    created_by=user,
                    updated_by=user,
                )
                # Defensa en profundidad: clean() valida origen vs operador.
                voucher.full_clean()
                voucher.save()
                creados.append(voucher)

        out = VoucherRecoleccionSerializer(creados, many=True)
        return Response(
            {
                'creados': out.data,
                'total': len(creados),
            },
            status=status.HTTP_201_CREATED,
        )

    # ─── Impresión térmica 58mm (entregar al productor en ruta) ──────
    @action(detail=True, methods=['get'], url_path='print-58mm')
    def print_58mm(self, request, pk=None):
        """HTML 58mm para entregar al productor. Sin precios."""
        voucher = self.get_object()

        # Branding del tenant
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

        # Datos
        fecha_str = (
            voucher.fecha_recoleccion.strftime('%d-%m-%Y')
            if voucher.fecha_recoleccion else '—'
        )
        emision = timezone.localtime(voucher.created_at).strftime('%d-%m-%Y %H:%M')
        ruta_str = f"{voucher.ruta.codigo} — {voucher.ruta.nombre}" if voucher.ruta else '—'
        prov_str = (
            f"{voucher.proveedor.codigo_interno} — {voucher.proveedor.nombre_comercial}"
            if voucher.proveedor else '—'
        )
        prov_doc = getattr(voucher.proveedor, 'numero_documento', '') if voucher.proveedor else ''
        prod_str = getattr(voucher.producto, 'nombre', '—') if voucher.producto else '—'
        estado = voucher.get_estado_display()

        # Operador (puede ser None en vouchers transcritos sin operador identificado).
        operador_nombre = '—'
        operador_cargo = ''
        op = voucher.operador
        if op is not None:
            try:
                operador_nombre = op.get_full_name() or str(op)
            except AttributeError:
                operador_nombre = '—'
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
        elif voucher.registrado_por_planta_id is not None:
            try:
                operador_nombre = (
                    voucher.registrado_por_planta.get_full_name()
                    or str(voucher.registrado_por_planta)
                )
            except AttributeError:
                operador_nombre = '—'
            operador_cargo = 'Transcrito en planta'

        def fmt_kg(value):
            try:
                return f"{float(value):.2f}"
            except (TypeError, ValueError):
                return '0.00'

        SEP = '-' * 32

        notas_block = ''
        if voucher.notas and voucher.notas.strip():
            notas_text = voucher.notas.strip().replace('<', '&lt;').replace('>', '&gt;')
            notas_block = f'<div class="notas">{notas_text}</div><div class="sep">{SEP}</div>'

        # Bloque informativo si el voucher viene de talonario manual
        # (queda explícito en el ticket impreso para auditoría).
        origen_block = ''
        if voucher.origen_registro != VoucherRecoleccion.OrigenRegistro.EN_RUTA:
            origen_label = voucher.get_origen_registro_display()
            tal = voucher.numero_talonario or ''
            tal_line = f' (Talonario: {tal})' if tal else ''
            origen_block = (
                f'<div class="center" style="font-size:7.5pt; '
                f'opacity:0.85; margin-top:1mm;">'
                f'{origen_label}{tal_line}</div>'
            )

        html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{voucher.codigo}</title>
<style>
  /* Voucher de RECOLECCIÓN en ruta — formato 58mm. SIN precios. 1 = 1 parada. */
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
  .producto {{ padding-left: 3mm; font-weight: bold; margin-top: 2mm; }}
  .kilos {{ padding-left: 3mm; font-size: 14pt; font-weight: bold; margin-top: 1mm; text-align: center; }}
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
{origen_block}
<div class="sep">{SEP}</div>
<div class="row"><span class="label">Fecha:</span><span class="val">{fecha_str}</span></div>
<div class="row"><span class="label">Emitido:</span><span class="val">{emision}</span></div>
<div class="sep">{SEP}</div>
<div class="bold">RUTA</div>
<div class="indent">{ruta_str}</div>
<div class="sep">{SEP}</div>
<div class="bold">PROVEEDOR</div>
<div class="indent">{prov_str}</div>
{f'<div class="indent" style="font-size:8pt;">Doc: {prov_doc}</div>' if prov_doc else ''}
<div class="sep">{SEP}</div>
<div class="producto">{prod_str}</div>
<div class="kilos">{fmt_kg(voucher.cantidad)} kg</div>
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
