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
from .mixins import verificar_acceso_documento


def _get_empresa():
    """Obtiene la EmpresaConfig del tenant actual."""
    try:
        return get_tenant_empresa(auto_create=False)
    except Exception:
        return None


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
    verificar_acceso_documento(request.user, documento)

    def _serve_file(field, filename):
        """Sirve un FileField directamente como descarga PDF."""
        try:
            with open(field.path, 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                Documento.objects.filter(pk=pk).update(
                    numero_descargas=documento.numero_descargas + 1
                )
                return response
        except (FileNotFoundError, OSError):
            return None  # archivo no existe en disco, continuar al siguiente paso

    # 1. PDF generado previamente
    if documento.archivo_pdf and documento.archivo_pdf.name:
        filename = f'{documento.codigo}-v{documento.version_actual}.pdf'
        resp = _serve_file(documento.archivo_pdf, filename)
        if resp:
            return resp

    # 2. PDF original ingestado (documento externo)
    if documento.es_externo and documento.archivo_original and documento.archivo_original.name:
        filename = f'{documento.codigo}.pdf'
        resp = _serve_file(documento.archivo_original, filename)
        if resp:
            return resp

    # 3. Generar con WeasyPrint
    empresa = _get_empresa()
    try:
        generator = DocumentoPDFGenerator(empresa=empresa)
        pdf_buffer = generator.generate_documento_pdf(documento, usuario=request.user)

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
    verificar_acceso_documento(request.user, documento)
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
