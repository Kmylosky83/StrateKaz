"""
Views de Exportacion para Gestion Documental
=============================================
Endpoints para exportar documentos en formato PDF y DOCX.

Endpoints:
- GET /export/documento/{pk}/pdf/ - Exportar documento a PDF
- GET /export/documento/{pk}/docx/ - Exportar documento a DOCX

Cada acceso queda registrado como EventoDocumental (ISO 27001 §A.8.10).
"""
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.base_models.mixins import get_tenant_empresa
from .models import Documento
from .exporters import DocumentoPDFGenerator, DocumentoDOCXGenerator
from .mixins import check_acceso_documento, verificar_acceso_documento
from .services import EventoDocumentalService


def _get_empresa():
    """Obtiene la EmpresaConfig del tenant actual."""
    try:
        return get_tenant_empresa(auto_create=False)
    except Exception:
        return None


def _registrar_y_verificar_acceso(request, documento, formato):
    """
    Verifica acceso al documento. Si falla, registra ACCESO_DENEGADO
    y propaga PermissionDenied.
    """
    if not check_acceso_documento(request.user, documento):
        EventoDocumentalService.registrar(
            documento=documento,
            usuario=request.user,
            tipo='ACCESO_DENEGADO',
            request=request,
            metadatos={
                'formato_solicitado': formato,
                'clasificacion': documento.clasificacion,
                'origen': f'export_documento_{formato.lower()}',
            },
        )
        raise PermissionDenied(
            'No tiene permiso para acceder a este documento. '
            'Los documentos con clasificación Confidencial o Restringido '
            'requieren autorización explícita.'
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_documento_pdf(request, pk):
    """Exporta un documento a PDF.

    Prioridad:
    1. archivo_pdf existente (generado previamente) → servir directo.
    2. archivo_original (doc externo ingestado)     → servir directo.
    3. Generar con WeasyPrint desde contenido HTML.
    """
    documento = get_object_or_404(
        Documento.objects.select_related(
            'tipo_documento', 'plantilla', 'elaborado_por',
            'revisado_por', 'aprobado_por'
        ),
        pk=pk,
    )
    _registrar_y_verificar_acceso(request, documento, 'PDF')

    def _serve_file(field, filename, origen):
        """Sirve un FileField directamente como descarga PDF."""
        try:
            with open(field.path, 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                EventoDocumentalService.registrar(
                    documento=documento,
                    usuario=request.user,
                    tipo='DESCARGA_PDF',
                    request=request,
                    metadatos={'origen': origen, 'filename': filename},
                )
                return response
        except (FileNotFoundError, OSError):
            return None  # archivo no existe en disco, continuar al siguiente paso

    # 1. PDF generado previamente
    if documento.archivo_pdf and documento.archivo_pdf.name:
        filename = f'{documento.codigo}-v{documento.version_actual}.pdf'
        resp = _serve_file(documento.archivo_pdf, filename, origen='archivo_pdf')
        if resp:
            return resp

    # 2. PDF original ingestado (documento externo)
    if documento.es_externo and documento.archivo_original and documento.archivo_original.name:
        filename = f'{documento.codigo}.pdf'
        resp = _serve_file(documento.archivo_original, filename, origen='archivo_original')
        if resp:
            return resp

    # 3. Generar con WeasyPrint
    empresa = _get_empresa()
    try:
        generator = DocumentoPDFGenerator(empresa=empresa)
        pdf_buffer = generator.generate_documento_pdf(documento, usuario=request.user)

        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        filename = f'{documento.codigo}-v{documento.version_actual}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        EventoDocumentalService.registrar(
            documento=documento,
            usuario=request.user,
            tipo='DESCARGA_PDF',
            request=request,
            metadatos={'origen': 'weasyprint_render', 'filename': filename},
        )
        return response

    except ImportError:
        return Response(
            {"error": "WeasyPrint no esta instalado. Ejecute: pip install weasyprint"},
            status=500,
        )
    except Exception as e:
        return Response({"error": f"Error al generar PDF: {str(e)}"}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_documento_docx(request, pk):
    """Exporta un documento a DOCX."""
    documento = get_object_or_404(
        Documento.objects.select_related(
            'tipo_documento', 'plantilla', 'elaborado_por',
            'revisado_por', 'aprobado_por'
        ),
        pk=pk,
    )
    _registrar_y_verificar_acceso(request, documento, 'DOCX')
    empresa = _get_empresa()

    try:
        generator = DocumentoDOCXGenerator(empresa=empresa)
        docx_buffer = generator.generate_documento_docx(documento)

        content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        response = HttpResponse(docx_buffer.getvalue(), content_type=content_type)
        filename = f'{documento.codigo}-v{documento.version_actual}.docx'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        EventoDocumentalService.registrar(
            documento=documento,
            usuario=request.user,
            tipo='DESCARGA_DOCX',
            request=request,
            metadatos={'origen': 'docx_generator', 'filename': filename},
        )
        return response

    except ImportError:
        return Response(
            {"error": "python-docx no esta instalado. Ejecute: pip install python-docx"},
            status=500,
        )
    except Exception as e:
        return Response({"error": f"Error al generar DOCX: {str(e)}"}, status=500)
