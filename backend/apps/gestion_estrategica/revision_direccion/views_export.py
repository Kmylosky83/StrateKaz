"""
Views de Exportación para Revisión por la Dirección
=====================================================
Endpoints para exportar actas de revisión en formato PDF.

Endpoints:
- GET /export/acta/{pk}/pdf/ - Exportar acta a PDF
- GET /export/informe-gerencial/{pk}/pdf/ - Exportar informe gerencial a PDF
"""
from datetime import date, timedelta

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.base_models.mixins import get_tenant_empresa
from .models import ActaRevision, ProgramaRevision
from .exporters import ActaRevisionPDFGenerator
from .exporters.informe_gerencial_pdf import InformeGerencialPDFGenerator
from .services.aggregator import RevisionDireccionAggregator


def _get_empresa():
    """Obtiene la EmpresaConfig del tenant actual."""
    try:
        return get_tenant_empresa(auto_create=False)
    except Exception:
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_acta_pdf(request, pk):
    """Exporta un acta de revisión por la dirección a PDF."""
    acta = get_object_or_404(
        ActaRevision.objects.select_related(
            'programa',
            'elaborado_por',
            'revisado_por',
            'aprobado_por',
        ).prefetch_related(
            'programa__participantes__usuario',
            'analisis_temas__tema',
            'analisis_temas__presentado_por',
            'compromisos__responsable',
            'compromisos__tema_relacionado',
        ),
        pk=pk,
    )
    empresa = _get_empresa()

    try:
        generator = ActaRevisionPDFGenerator(empresa=empresa)
        pdf_buffer = generator.generate_acta_pdf(acta)

        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        filename = f'Acta-Revision-{acta.numero_acta}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    except ImportError:
        return Response(
            {"error": "WeasyPrint no está instalado. Ejecute: pip install weasyprint"},
            status=500,
        )
    except Exception as e:
        return Response({"error": f"Error al generar PDF: {str(e)}"}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_informe_gerencial_pdf(request, pk):
    """
    GET /export/informe-gerencial/{pk}/pdf/
    Genera un PDF completo del informe gerencial para una programación de revisión.

    Incluye:
    - Portada con branding
    - Resumen ejecutivo
    - 14 secciones de módulos C2 con datos consolidados
    - Sección de firmas
    """
    programa = get_object_or_404(ProgramaRevision, pk=pk)
    empresa = _get_empresa()

    # Obtener parámetros de fechas opcionales
    fecha_desde_str = request.query_params.get('fecha_desde')
    fecha_hasta_str = request.query_params.get('fecha_hasta')

    hoy = date.today()
    try:
        fecha_desde = date.fromisoformat(fecha_desde_str) if fecha_desde_str else (hoy - timedelta(days=180))
    except (ValueError, TypeError):
        fecha_desde = hoy - timedelta(days=180)

    try:
        fecha_hasta = date.fromisoformat(fecha_hasta_str) if fecha_hasta_str else hoy
    except (ValueError, TypeError):
        fecha_hasta = hoy

    try:
        # Consolidar datos
        aggregator = RevisionDireccionAggregator(fecha_desde, fecha_hasta)
        informe_data = aggregator.consolidar()

        # Generar PDF
        generator = InformeGerencialPDFGenerator(empresa=empresa)
        pdf_buffer = generator.generate_informe_pdf(programa, informe_data, fecha_desde, fecha_hasta)

        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        filename = f'Informe-Gerencial-{programa.periodo.replace(" ", "_")}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    except ImportError:
        return Response(
            {"error": "WeasyPrint no está instalado. Ejecute: pip install weasyprint"},
            status=500,
        )
    except Exception as e:
        return Response({"error": f"Error al generar PDF del informe: {str(e)}"}, status=500)
