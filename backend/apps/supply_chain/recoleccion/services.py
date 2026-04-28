"""Servicios de Recoleccion — Supply Chain.

Incluye:
  - VoucherRecoleccionPDFService.generar_pdf(voucher) -> bytes (WeasyPrint),
    on-demand para impresion/descarga.
  - archivar_voucher_en_gd(voucher, user) -> registra trazabilidad en GD
    sin almacenar PDF (documento-vivo).

H-SC-GD-ARCHIVE (refactor 2026-04-28 — patrón documento-vivo):
GD guarda solo metadata + GenericFK al voucher. El PDF se regenera
on-demand cuando el usuario lo solicita desde el endpoint print/pdf.
Esto evita duplicar storage; el voucher es la fuente de verdad y los
estados terminales (COMPLETADO) ya garantizan inmutabilidad.
"""
import logging

from django.template.loader import render_to_string
from weasyprint import HTML

logger = logging.getLogger(__name__)


class VoucherRecoleccionPDFService:
    """Genera el PDF (A4 simple) del voucher on-demand."""

    @staticmethod
    def generar_pdf(voucher) -> bytes:
        html = render_to_string(
            'voucher_recoleccion/voucher_recoleccion.html',
            {'voucher': voucher},
        )
        return HTML(string=html).write_pdf()


def _resolver_proceso_default():
    """Devuelve un Area del tenant para usar como 'proceso' en GD.

    Estrategia: primero un Area de tipo MISIONAL activa (Supply Chain encaja
    como misional), luego cualquier Area activa. Si no hay ninguna, retorna
    None y el archivado se omite (con warning).
    """
    try:
        from apps.gestion_estrategica.organizacion.models import Area
    except Exception:
        return None
    area = Area.objects.filter(is_active=True, tipo='MISIONAL').first()
    if area is None:
        area = Area.objects.filter(is_active=True).first()
    return area


def archivar_voucher_en_gd(voucher, user):
    """Registra el voucher en GD como documento-vivo (sin PDF físico).

    Idempotente: si voucher.documento_archivado_id ya esta seteado, no hace nada.
    Falla silencioso: cualquier excepcion se loguea como warning y NO rompe
    la transicion del voucher (el archivado en GD es secundario al estado).
    """
    if voucher.documento_archivado_id:
        return None

    try:
        from apps.gestion_estrategica.gestion_documental.services.documento_service import (
            DocumentoService,
        )

        proceso = _resolver_proceso_default()
        if proceso is None:
            logger.warning(
                'archivar_voucher_en_gd: tenant sin Areas; skip voucher %s',
                voucher.id,
            )
            return None

        documento = DocumentoService.archivar_registro(
            pdf_file=None,  # documento-vivo: PDF on-demand desde el voucher
            tipo_codigo='VOUCHER_RECOLEC_SC',
            proceso=proceso,
            usuario=user,
            modulo_origen='supply_chain.recoleccion',
            referencia=voucher,
            titulo=f'Voucher Recoleccion {voucher.codigo}',
            resumen=(
                f'Voucher de recoleccion en ruta {voucher.ruta.codigo} '
                f'al proveedor {voucher.proveedor.nombre_comercial}.'
            ),
        )
        voucher.documento_archivado_id = documento.id
        voucher.save(update_fields=['documento_archivado_id'])
        logger.info(
            'archivar_voucher_en_gd: voucher %s registrado en GD como documento %s (sin PDF)',
            voucher.id, documento.id,
        )
        return documento
    except Exception as exc:  # noqa: BLE001 — falla silencioso por diseño
        logger.warning(
            'archivar_voucher_en_gd: no se pudo archivar voucher %s en GD: %s',
            voucher.id, exc,
        )
        return None
