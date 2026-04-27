"""Servicios de Recoleccion — Supply Chain.

Incluye:
  - VoucherRecoleccionPDFService.generar_pdf(voucher) -> bytes (WeasyPrint).
  - archivar_voucher_en_gd(voucher, user) -> idempotente, falla silencioso.

H-SC-GD-ARCHIVE: cuando un VoucherRecoleccion pasa a COMPLETADO se archiva
en Gestion Documental como registro inmutable (TipoDocumento.codigo =
'VOUCHER_RECOLECCION_SC'). El ID del Documento creado se guarda en
voucher.documento_archivado_id para garantizar idempotencia.
"""
import logging

from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from weasyprint import HTML

logger = logging.getLogger(__name__)


class VoucherRecoleccionPDFService:
    """Genera el PDF (A4 simple) del voucher de recoleccion para archivar en GD."""

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
    """Archiva el voucher como Documento en Gestion Documental.

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

        pdf_bytes = VoucherRecoleccionPDFService.generar_pdf(voucher)
        pdf_file = ContentFile(pdf_bytes, name=f'{voucher.codigo}.pdf')

        documento = DocumentoService.archivar_registro(
            pdf_file=pdf_file,
            tipo_codigo='VOUCHER_RECOLECCION_SC',
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
            'archivar_voucher_en_gd: voucher %s archivado como documento %s',
            voucher.id, documento.id,
        )
        return documento
    except Exception as exc:  # noqa: BLE001 — falla silencioso por diseño
        logger.warning(
            'archivar_voucher_en_gd: no se pudo archivar voucher %s en GD: %s',
            voucher.id, exc,
        )
        return None
