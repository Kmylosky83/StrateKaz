"""
API Views para Plantillas de Estructura Organizacional

Endpoints:
- GET  /api/core/org-templates/       → Lista templates disponibles
- POST /api/core/org-templates/apply/  → Aplica un template al tenant actual
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.services.org_templates import get_all_templates, get_template, apply_template


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def org_templates_list(request):
    """
    Lista todas las plantillas de estructura organizacional disponibles.

    Retorna templates con sus áreas y cargos predefinidos.
    """
    templates = get_all_templates()
    return Response(templates)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def org_templates_apply(request):
    """
    Aplica una plantilla al tenant actual.

    Body: {"template_code": "manufactura"}

    Crea áreas y cargos del template. Es idempotente: si ya existen (por code), los omite.
    """
    template_code = request.data.get('template_code')

    if not template_code:
        return Response(
            {'detail': 'El campo template_code es requerido.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    template = get_template(template_code)
    if not template:
        return Response(
            {'detail': f'Plantilla "{template_code}" no encontrada.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        result = apply_template(template_code)
        return Response(result, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'detail': f'Error al aplicar plantilla: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
