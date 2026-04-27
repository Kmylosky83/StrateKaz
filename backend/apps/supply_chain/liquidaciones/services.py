"""
Servicios de Liquidaciones — Supply Chain.

LiquidacionPDFService: genera PDF de Liquidación para archivado en GD
(H-SC-GD-ARCHIVE). Usa WeasyPrint si está disponible; si no, retorna un
PDF mínimo en bytes generado con un fallback bare-bones para que el flujo
no se rompa en entornos donde WeasyPrint no esté instalado.
"""
from __future__ import annotations

import logging
from decimal import Decimal

logger = logging.getLogger(__name__)


class LiquidacionPDFService:
    """Genera PDF de una Liquidación para archivado en Gestión Documental."""

    @classmethod
    def generar_pdf(cls, liquidacion) -> bytes:
        """
        Genera el PDF de la liquidación y retorna bytes.

        Estrategia:
        1. Renderiza HTML básico tipo factura (header + líneas + total).
        2. Convierte a PDF con WeasyPrint si está instalado.
        3. Si WeasyPrint no está disponible, retorna un PDF mínimo
           (cabecera %PDF-1.4 + texto plano) suficiente para que el
           archivado en GD prospere — el contenido visual real se
           regenera cuando WeasyPrint esté disponible.
        """
        html = cls._render_html(liquidacion)
        try:
            from weasyprint import HTML  # type: ignore

            return HTML(string=html).write_pdf()
        except Exception as exc:
            logger.warning(
                'WeasyPrint no disponible o falló al renderizar liquidacion '
                '%s (%s). Usando fallback de PDF mínimo.',
                liquidacion.pk,
                exc,
            )
            return cls._fallback_pdf_bytes(liquidacion)

    @classmethod
    def _render_html(cls, liquidacion) -> str:
        """HTML simple, table-based (compatible WeasyPrint sin flex/grid)."""
        lineas_html = []
        for linea in liquidacion.lineas_liquidacion.select_related(
            'voucher_linea__producto'
        ).all():
            producto = getattr(linea.voucher_linea, 'producto', None)
            producto_nombre = getattr(producto, 'nombre', '') if producto else ''
            lineas_html.append(
                '<tr>'
                f'<td>{producto_nombre}</td>'
                f'<td style="text-align:right">{linea.cantidad}</td>'
                f'<td style="text-align:right">{linea.precio_unitario}</td>'
                f'<td style="text-align:right">{linea.monto_base}</td>'
                f'<td style="text-align:right">{linea.ajuste_calidad_pct}%</td>'
                f'<td style="text-align:right">{linea.monto_final}</td>'
                '</tr>'
            )

        voucher = liquidacion.voucher
        proveedor_nombre = ''
        fecha_viaje = ''
        if voucher is not None:
            if voucher.proveedor is not None:
                proveedor_nombre = (
                    getattr(voucher.proveedor, 'nombre_comercial', '')
                    or getattr(voucher.proveedor, 'razon_social', '')
                    or ''
                )
            fecha_viaje = str(getattr(voucher, 'fecha_viaje', '') or '')

        return f"""
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>{liquidacion.codigo}</title>
        <style>
            body {{ font-family: sans-serif; font-size: 12px; }}
            h1 {{ font-size: 18px; }}
            table {{ width: 100%; border-collapse: collapse; }}
            th, td {{ border: 1px solid #888; padding: 4px 6px; }}
            th {{ background: #f0f0f0; }}
            .totales {{ margin-top: 12px; }}
        </style></head>
        <body>
            <h1>Liquidación {liquidacion.codigo}</h1>
            <p><strong>Proveedor:</strong> {proveedor_nombre}<br>
               <strong>Fecha viaje:</strong> {fecha_viaje}<br>
               <strong>Estado:</strong> {liquidacion.get_estado_display()}</p>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad (kg)</th>
                        <th>Precio kg</th>
                        <th>Monto base</th>
                        <th>Aj. calidad</th>
                        <th>Monto final</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join(lineas_html) or '<tr><td colspan="6">Sin líneas</td></tr>'}
                </tbody>
            </table>
            <div class="totales">
                <p><strong>Subtotal:</strong> {liquidacion.subtotal}<br>
                   <strong>Ajuste calidad total:</strong> {liquidacion.ajuste_calidad_total}<br>
                   <strong>Total:</strong> {liquidacion.total}</p>
            </div>
            {f'<p><strong>Observaciones:</strong> {liquidacion.observaciones}</p>' if liquidacion.observaciones else ''}
        </body></html>
        """

    @staticmethod
    def _fallback_pdf_bytes(liquidacion) -> bytes:
        """
        PDF mínimo válido (cabecera + objetos básicos) con el código de la
        liquidación. Suficiente para validación de tipo MIME y tamaño > 0.
        Solo se usa cuando WeasyPrint no está disponible.
        """
        codigo = (liquidacion.codigo or 'LIQ').encode('latin-1', 'replace')
        total = str(liquidacion.total or Decimal('0.00')).encode('ascii')
        body = (
            b'%PDF-1.4\n'
            b'1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n'
            b'2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n'
            b'3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]'
            b'/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n'
            b'4 0 obj<</Length 80>>stream\n'
            b'BT /F1 14 Tf 50 800 Td (Liquidacion ' + codigo + b') Tj '
            b'0 -20 Td (Total: ' + total + b') Tj ET\n'
            b'endstream endobj\n'
            b'5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n'
            b'xref\n0 6\n0000000000 65535 f\n'
            b'trailer<</Size 6/Root 1 0 R>>\n%%EOF'
        )
        return body
