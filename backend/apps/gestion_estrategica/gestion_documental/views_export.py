"""
Views de Exportacion para Gestion Documental
=============================================
Endpoints para exportar documentos en formato PDF y DOCX.

Endpoints:
- GET /export/documento/{pk}/pdf/ - Exportar documento a PDF
- GET /export/documento/{pk}/docx/ - Exportar documento a DOCX
"""
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.base_models.mixins import get_tenant_empresa
from .models import Documento
from .exporters import DocumentoPDFGenerator, DocumentoDOCXGenerator


def _get_empresa():
    """Obtiene la EmpresaConfig del tenant actual."""
    try:
        return get_tenant_empresa(auto_create=False)
    except Exception:
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_documento_pdf(request, pk):
    """Exporta un documento a PDF."""
    documento = get_object_or_404(
        Documento.objects.select_related(
            'tipo_documento', 'plantilla', 'elaborado_por',
            'revisado_por', 'aprobado_por'
        ),
        pk=pk,
    )
    empresa = _get_empresa()

    try:
        generator = DocumentoPDFGenerator(empresa=empresa)
        pdf_buffer = generator.generate_documento_pdf(documento)

        # Incrementar contador de descargas
        Documento.objects.filter(pk=pk).update(
            numero_descargas=documento.numero_descargas + 1
        )

        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        filename = f'{documento.codigo}-v{documento.version_actual}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
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
    empresa = _get_empresa()

    try:
        generator = DocumentoDOCXGenerator(empresa=empresa)
        docx_buffer = generator.generate_documento_docx(documento)

        # Incrementar contador de descargas
        Documento.objects.filter(pk=pk).update(
            numero_descargas=documento.numero_descargas + 1
        )

        content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        response = HttpResponse(docx_buffer.getvalue(), content_type=content_type)
        filename = f'{documento.codigo}-v{documento.version_actual}.docx'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    except ImportError:
        return Response(
            {"error": "python-docx no esta instalado. Ejecute: pip install python-docx"},
            status=500,
        )
    except Exception as e:
        return Response({"error": f"Error al generar DOCX: {str(e)}"}, status=500)
