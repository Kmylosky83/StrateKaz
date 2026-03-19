"""
Servicio de sellado PDF con pyHanko — Mejora 2 (ISO 27001).

Sella documentos PUBLICADOS con firma digital X.509 + estampa visual,
generando un PDF inmutable con hash SHA-256 verificable.
"""
import hashlib
import logging
import os
from datetime import datetime
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import connection
from django.utils import timezone

logger = logging.getLogger(__name__)


class PDFSealingService:
    """Servicio de sellado PDF con certificado X.509 via pyHanko."""

    @staticmethod
    def _get_cert_paths():
        """Retorna rutas del certificado y clave privada del tenant actual."""
        schema = connection.schema_name
        cert_dir = os.path.join(settings.MEDIA_ROOT, 'certificados', schema)
        cert_path = os.path.join(cert_dir, 'certificado.pem')
        key_path = os.path.join(cert_dir, 'clave_privada.key')
        return cert_path, key_path

    @staticmethod
    def _get_empresa_info():
        """Obtiene nombre de empresa para la estampa visual."""
        try:
            from apps.gestion_estrategica.configuracion.models import Empresa
            empresa = Empresa.objects.first()
            if empresa:
                return getattr(empresa, 'nombre', 'StrateKaz SGI')
        except Exception:
            pass
        return 'StrateKaz SGI'

    @classmethod
    def sellar_documento(cls, documento):
        """
        Sella un documento con firma digital X.509 + estampa visual.

        Args:
            documento: Instancia de Documento (debe tener archivo_pdf o contenido HTML)

        Returns:
            dict con: archivo_path, hash_sha256, metadatos

        Raises:
            ValueError: si falta certificado o archivo PDF
            RuntimeError: si falla el proceso de firma
        """
        from pyhanko.sign import signers, fields as sig_fields
        from pyhanko.sign.general import load_cert_list_from_pemder
        from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
        from pyhanko_certvalidator import CertificateValidator
        from cryptography.hazmat.primitives.serialization import load_pem_private_key
        from cryptography.x509 import load_pem_x509_certificate

        cert_path, key_path = cls._get_cert_paths()

        if not os.path.exists(cert_path) or not os.path.exists(key_path):
            raise ValueError(
                'No se encontró certificado X.509 para este tenant. '
                'Ejecute: python manage.py generar_certificado_x509'
            )

        # Obtener PDF base
        pdf_buffer = cls._obtener_pdf_base(documento)

        # Cargar certificado y clave
        with open(cert_path, 'rb') as f:
            cert_pem = f.read()
        with open(key_path, 'rb') as f:
            key_pem = f.read()

        cert = load_pem_x509_certificate(cert_pem)
        key = load_pem_private_key(key_pem, password=None)

        # Configurar signer pyHanko
        signer = signers.SimpleSigner.load_pkcs12(
            pfx_file=None,
        ) if False else None  # noqa — usamos from_pem directamente

        # Crear signer desde PEM
        from pyhanko.keys import load_certs_from_pemder
        from pyhanko.sign.signers.pdf_signer import SimpleSigner

        signer = SimpleSigner(
            signing_cert=cert,
            signing_key=key,
            cert_registry=None,
        )

        empresa_nombre = cls._get_empresa_info()
        ahora = timezone.now()
        fecha_str = ahora.strftime('%Y-%m-%d %H:%M')

        # Texto de la estampa visual
        stamp_text = (
            f'DOCUMENTO CONTROLADO\n'
            f'{documento.codigo} v{documento.version_actual}\n'
            f'{empresa_nombre}\n'
            f'Sellado: {fecha_str}'
        )

        # Firmar PDF con estampa visual
        pdf_input = BytesIO(pdf_buffer.read())
        writer = IncrementalPdfFileWriter(pdf_input)

        # Configurar campo de firma visual
        sig_field_spec = sig_fields.SigFieldSpec(
            sig_field_name='SelloDocumental',
            on_page=0,
            box=(50, 50, 300, 130),
        )

        # Crear apariencia textual
        from pyhanko.stamp import TextStampStyle

        stamp_style = TextStampStyle(
            stamp_text=stamp_text,
            background=None,
        )

        # Firmar
        output = BytesIO()
        signers.sign_pdf(
            writer,
            signers.PdfSignatureMetadata(
                field_name='SelloDocumental',
                md_algorithm='sha256',
                reason=f'Sellado documental — {documento.codigo}',
                location='Colombia',
                contact_info=empresa_nombre,
            ),
            signer=signer,
            new_field_spec=sig_field_spec,
            output=output,
        )

        output.seek(0)
        pdf_sellado_bytes = output.read()

        # Calcular hash SHA-256
        hash_sha256 = hashlib.sha256(pdf_sellado_bytes).hexdigest()

        # Guardar en modelo
        filename = (
            f'{documento.codigo}_v{documento.version_actual}_sellado.pdf'
        )
        documento.pdf_sellado.save(
            filename,
            ContentFile(pdf_sellado_bytes),
            save=False,
        )
        documento.hash_pdf_sellado = hash_sha256
        documento.fecha_sellado = ahora
        documento.sellado_estado = 'COMPLETADO'
        documento.sellado_metadatos = {
            'certificado_serial': format(cert.serial_number, 'x'),
            'algoritmo': 'sha256WithRSA',
            'subject': cert.subject.rfc4514_string(),
            'valido_hasta': cert.not_valid_after_utc.isoformat(),
            'tamano_bytes': len(pdf_sellado_bytes),
            'fecha_sellado': ahora.isoformat(),
        }
        documento.save(update_fields=[
            'pdf_sellado', 'hash_pdf_sellado', 'fecha_sellado',
            'sellado_estado', 'sellado_metadatos',
        ])

        logger.info(
            f'[SELLADO] Documento {documento.codigo} sellado exitosamente '
            f'(hash: {hash_sha256[:16]}...)'
        )

        return {
            'hash_sha256': hash_sha256,
            'metadatos': documento.sellado_metadatos,
        }

    @classmethod
    def _obtener_pdf_base(cls, documento):
        """
        Obtiene el PDF base del documento.
        Prioridad: archivo_pdf existente > generar desde contenido HTML.
        """
        if documento.archivo_pdf and documento.archivo_pdf.name:
            file_path = documento.archivo_pdf.path
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    buffer = BytesIO(f.read())
                return buffer

        # Generar PDF desde contenido HTML
        if documento.contenido:
            from ..exporters.pdf_generator import DocumentoPDFGenerator

            empresa = None
            try:
                from apps.gestion_estrategica.configuracion.models import Empresa
                empresa = Empresa.objects.first()
            except Exception:
                pass

            generator = DocumentoPDFGenerator(empresa=empresa)
            return generator.generate_documento_pdf(documento)

        raise ValueError(
            f'El documento {documento.codigo} no tiene archivo PDF ni contenido HTML '
            f'para generar el sellado.'
        )

    @classmethod
    def verificar_integridad(cls, documento):
        """
        Verifica integridad del PDF sellado recalculando SHA-256.

        Returns:
            dict con: integro (bool), hash_actual, hash_almacenado
        """
        if not documento.pdf_sellado or not documento.pdf_sellado.name:
            return {
                'integro': False,
                'error': 'No existe PDF sellado',
                'hash_actual': None,
                'hash_almacenado': documento.hash_pdf_sellado,
            }

        try:
            file_path = documento.pdf_sellado.path
            if not os.path.exists(file_path):
                return {
                    'integro': False,
                    'error': 'Archivo PDF sellado no encontrado en disco',
                    'hash_actual': None,
                    'hash_almacenado': documento.hash_pdf_sellado,
                }

            with open(file_path, 'rb') as f:
                hash_actual = hashlib.sha256(f.read()).hexdigest()

            return {
                'integro': hash_actual == documento.hash_pdf_sellado,
                'hash_actual': hash_actual,
                'hash_almacenado': documento.hash_pdf_sellado,
            }
        except Exception as e:
            return {
                'integro': False,
                'error': str(e),
                'hash_actual': None,
                'hash_almacenado': documento.hash_pdf_sellado,
            }
