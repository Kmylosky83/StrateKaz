"""
Views de Exportación para Identidad Corporativa (v3.1)
======================================================

Endpoints para exportar documentos en formato PDF y DOCX.

Endpoints:
- GET /export/politica-especifica/{id}/pdf/ - Exportar política a PDF
- GET /export/politica-especifica/{id}/docx/ - Exportar política a DOCX
- GET /export/identidad/{id}/pdf/ - Exportar identidad corporativa completa a PDF
- GET /export/identidad/{id}/docx/ - Exportar identidad corporativa completa a DOCX

NOTA v3.1: /export/politica-integral/ ha sido eliminado.
Las políticas integrales ahora se exportan desde /export/politica-especifica/
con is_integral_policy=True detectado automáticamente.
"""

from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    CorporateIdentity,
    PoliticaEspecifica,
)
from .models_workflow import FirmaDigital, HistorialVersion
from .exporters import (
    IdentidadPDFGenerator,
    IdentidadDOCXGenerator,
)


def _get_firmas_documento(documento):
    """Obtiene las firmas de un documento usando GenericForeignKey"""
    content_type = ContentType.objects.get_for_model(documento)
    return FirmaDigital.objects.filter(
        content_type=content_type,
        object_id=documento.id,
        is_active=True
    ).select_related('firmante', 'cargo').order_by('orden_firma')


def _get_historial_documento(documento):
    """Obtiene el historial de versiones de un documento"""
    content_type = ContentType.objects.get_for_model(documento)
    return HistorialVersion.objects.filter(
        content_type=content_type,
        object_id=documento.id
    ).select_related('usuario').order_by('-created_at')


def _get_empresa_from_identity(identity):
    """Obtiene la empresa asociada a la identidad"""
    # Intentar obtener la empresa del sistema
    try:
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig
        return EmpresaConfig.objects.filter(is_active=True).first()
    except Exception:
        return None


# =============================================================================
# EXPORTACIÓN DE POLÍTICA (v3.1 - Unificado)
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_politica_especifica_pdf(request, pk):
    """
    Exporta una política específica a PDF.

    Query params:
    - include_firmas: bool (default: true) - Incluir tabla de firmas

    Response:
    - Content-Type: application/pdf
    - Content-Disposition: attachment; filename="{codigo}-v{version}.pdf"
    """
    politica = get_object_or_404(PoliticaEspecifica, pk=pk, is_active=True)

    include_firmas = request.query_params.get('include_firmas', 'true').lower() == 'true'
    firmas = _get_firmas_documento(politica) if include_firmas else None
    empresa = _get_empresa_from_identity(politica.identity)

    try:
        generator = IdentidadPDFGenerator(empresa=empresa)
        pdf_buffer = generator.generate_politica_especifica_pdf(
            politica=politica,
            firmas=firmas
        )

        response = HttpResponse(
            pdf_buffer.getvalue(),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="{politica.code}-v{politica.version}.pdf"'
        response['X-Document-Code'] = politica.code
        response['X-Document-Version'] = politica.version

        return response

    except ImportError:
        return Response(
            {"error": "WeasyPrint no está instalado. Ejecute: pip install weasyprint"},
            status=500
        )
    except Exception as e:
        return Response(
            {"error": f"Error al generar PDF: {str(e)}"},
            status=500
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_politica_especifica_docx(request, pk):
    """
    Exporta una política específica a DOCX (Word).

    Query params:
    - include_firmas: bool (default: true) - Incluir tabla de firmas

    Response:
    - Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
    - Content-Disposition: attachment; filename="{codigo}-v{version}.docx"
    """
    politica = get_object_or_404(PoliticaEspecifica, pk=pk, is_active=True)

    include_firmas = request.query_params.get('include_firmas', 'true').lower() == 'true'
    firmas = _get_firmas_documento(politica) if include_firmas else None
    empresa = _get_empresa_from_identity(politica.identity)

    try:
        generator = IdentidadDOCXGenerator(empresa=empresa)
        docx_buffer = generator.generate_politica_especifica_docx(
            politica=politica,
            firmas=firmas
        )

        content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        response = HttpResponse(
            docx_buffer.getvalue(),
            content_type=content_type
        )
        response['Content-Disposition'] = f'attachment; filename="{politica.code}-v{politica.version}.docx"'
        response['X-Document-Code'] = politica.code
        response['X-Document-Version'] = politica.version

        return response

    except ImportError:
        return Response(
            {"error": "python-docx no está instalado. Ejecute: pip install python-docx"},
            status=500
        )
    except Exception as e:
        return Response(
            {"error": f"Error al generar DOCX: {str(e)}"},
            status=500
        )


# =============================================================================
# EXPORTACIÓN DE IDENTIDAD CORPORATIVA COMPLETA
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_identidad_completa_pdf(request, pk):
    """
    Exporta la identidad corporativa completa a PDF.

    Query params:
    - include_valores: bool (default: true) - Incluir valores corporativos
    - include_alcances: bool (default: true) - Incluir alcances del sistema
    - include_politicas: bool (default: true) - Incluir políticas

    Response:
    - Content-Type: application/pdf
    - Content-Disposition: attachment; filename="identidad-corporativa-v{version}.pdf"
    """
    identity = get_object_or_404(CorporateIdentity, pk=pk, is_active=True)

    # Obtener parámetros
    include_valores = request.query_params.get('include_valores', 'true').lower() == 'true'
    include_alcances = request.query_params.get('include_alcances', 'true').lower() == 'true'
    include_politicas = request.query_params.get('include_politicas', 'true').lower() == 'true'

    empresa = _get_empresa_from_identity(identity)

    try:
        generator = IdentidadPDFGenerator(empresa=empresa)
        pdf_buffer = generator.generate_identidad_completa_pdf(
            identity=identity,
            include_valores=include_valores,
            include_alcances=include_alcances,
            include_politicas=include_politicas
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
            {"error": "WeasyPrint no está instalado. Ejecute: pip install weasyprint"},
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
    - include_politicas: bool (default: true) - Incluir políticas

    Response:
    - Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
    - Content-Disposition: attachment; filename="identidad-corporativa-v{version}.docx"
    """
    identity = get_object_or_404(CorporateIdentity, pk=pk, is_active=True)

    # Obtener parámetros
    include_valores = request.query_params.get('include_valores', 'true').lower() == 'true'
    include_alcances = request.query_params.get('include_alcances', 'true').lower() == 'true'
    include_politicas = request.query_params.get('include_politicas', 'true').lower() == 'true'

    empresa = _get_empresa_from_identity(identity)

    try:
        generator = IdentidadDOCXGenerator(empresa=empresa)
        docx_buffer = generator.generate_identidad_completa_docx(
            identity=identity,
            include_valores=include_valores,
            include_alcances=include_alcances,
            include_politicas=include_politicas
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
            {"error": "python-docx no está instalado. Ejecute: pip install python-docx"},
            status=500
        )
    except Exception as e:
        return Response(
            {"error": f"Error al generar DOCX: {str(e)}"},
            status=500
        )
