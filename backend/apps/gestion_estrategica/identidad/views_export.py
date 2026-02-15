"""
Views de Exportacion para Identidad Corporativa v4.0
=====================================================

Endpoints para exportar documentos en formato PDF y DOCX.

Endpoints:
- GET /export/identidad/{id}/pdf/ - Exportar identidad corporativa completa a PDF
- GET /export/identidad/{id}/docx/ - Exportar identidad corporativa completa a DOCX

NOTA v4.0: Las politicas se gestionan desde Gestion Documental.
Los endpoints de exportacion de politica han sido eliminados.
"""

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import CorporateIdentity
from .exporters import (
    IdentidadPDFGenerator,
    IdentidadDOCXGenerator,
)


def _get_empresa_from_identity(identity):
    """Obtiene la empresa asociada a la identidad"""
    try:
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig
        return EmpresaConfig.objects.filter(is_active=True).first()
    except Exception:
        return None


# =============================================================================
# EXPORTACION DE IDENTIDAD CORPORATIVA COMPLETA
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_identidad_completa_pdf(request, pk):
    """
    Exporta la identidad corporativa completa a PDF.

    Query params:
    - include_valores: bool (default: true) - Incluir valores corporativos
    - include_alcances: bool (default: true) - Incluir alcances del sistema

    Response:
    - Content-Type: application/pdf
    - Content-Disposition: attachment; filename="identidad-corporativa-v{version}.pdf"
    """
    identity = get_object_or_404(CorporateIdentity, pk=pk, is_active=True)

    # Obtener parametros
    include_valores = request.query_params.get('include_valores', 'true').lower() == 'true'
    include_alcances = request.query_params.get('include_alcances', 'true').lower() == 'true'

    empresa = _get_empresa_from_identity(identity)

    try:
        generator = IdentidadPDFGenerator(empresa=empresa)
        pdf_buffer = generator.generate_identidad_completa_pdf(
            identity=identity,
            include_valores=include_valores,
            include_alcances=include_alcances,
        )

        response = HttpResponse(
            pdf_buffer.getvalue(),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="identidad-corporativa-v{identity.version}.pdf"'
        response['X-Document-Version'] = identity.version

        return response

    except ImportError:
        return Response(
            {"error": "WeasyPrint no esta instalado. Ejecute: pip install weasyprint"},
            status=500
        )
    except Exception as e:
        return Response(
            {"error": f"Error al generar PDF: {str(e)}"},
            status=500
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_identidad_completa_docx(request, pk):
    """
    Exporta la identidad corporativa completa a DOCX (Word).

    Query params:
    - include_valores: bool (default: true) - Incluir valores corporativos
    - include_alcances: bool (default: true) - Incluir alcances del sistema

    Response:
    - Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
    - Content-Disposition: attachment; filename="identidad-corporativa-v{version}.docx"
    """
    identity = get_object_or_404(CorporateIdentity, pk=pk, is_active=True)

    # Obtener parametros
    include_valores = request.query_params.get('include_valores', 'true').lower() == 'true'
    include_alcances = request.query_params.get('include_alcances', 'true').lower() == 'true'

    empresa = _get_empresa_from_identity(identity)

    try:
        generator = IdentidadDOCXGenerator(empresa=empresa)
        docx_buffer = generator.generate_identidad_completa_docx(
            identity=identity,
            include_valores=include_valores,
            include_alcances=include_alcances,
        )

        content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        response = HttpResponse(
            docx_buffer.getvalue(),
            content_type=content_type
        )
        response['Content-Disposition'] = f'attachment; filename="identidad-corporativa-v{identity.version}.docx"'
        response['X-Document-Version'] = identity.version

        return response

    except ImportError:
        return Response(
            {"error": "python-docx no esta instalado. Ejecute: pip install python-docx"},
            status=500
        )
    except Exception as e:
        return Response(
            {"error": f"Error al generar DOCX: {str(e)}"},
            status=500
        )
