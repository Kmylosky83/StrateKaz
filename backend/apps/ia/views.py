"""
Views para la app de IA.

Endpoints:
- POST /api/ia/context-help/   — Ayuda contextual ("dónde estoy y qué puedo hacer")
- POST /api/ia/text-assist/    — Asistente de texto (mejorar, formalizar, resumir, etc.)
- GET  /api/ia/status/         — Estado de disponibilidad de IA
"""

import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .serializers import (
    ContextHelpRequestSerializer,
    ContextHelpResponseSerializer,
    TextAssistRequestSerializer,
    TextAssistResponseSerializer,
    IAStatusResponseSerializer,
)
from .services.gemini_service import GeminiService
from .services.context_help import ContextualHelpService
from .services.text_assist import TextAssistService

logger = logging.getLogger(__name__)


@extend_schema(
    request=ContextHelpRequestSerializer,
    responses={200: ContextHelpResponseSerializer},
    tags=['IA'],
    summary='Ayuda contextual inteligente',
    description='Retorna ayuda sobre el módulo/tab actual, enriquecida con IA si está disponible.',
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def context_help_view(request):
    """
    Endpoint de ayuda contextual.

    Recibe el código de módulo y tab, retorna explicación
    de dónde está el usuario y qué puede hacer.
    """
    serializer = ContextHelpRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    result = ContextualHelpService.get_help(
        module_code=serializer.validated_data['module_code'],
        tab_code=serializer.validated_data.get('tab_code', ''),
        section_name=serializer.validated_data.get('section_name', ''),
    )

    return Response(result, status=status.HTTP_200_OK)


@extend_schema(
    request=TextAssistRequestSerializer,
    responses={200: TextAssistResponseSerializer},
    tags=['IA'],
    summary='Asistente de texto con IA',
    description='Mejora, formaliza, resume o expande textos usando IA generativa.',
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def text_assist_view(request):
    """
    Endpoint de asistencia de texto.

    Recibe texto y acción, retorna texto procesado por IA.
    """
    serializer = TextAssistRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    result = TextAssistService.assist(
        text=serializer.validated_data['text'],
        action=serializer.validated_data.get('action', 'improve'),
    )

    return Response(result.to_dict(), status=status.HTTP_200_OK)


@extend_schema(
    responses={200: IAStatusResponseSerializer},
    tags=['IA'],
    summary='Estado de disponibilidad de IA',
    description='Verifica si hay una integración de IA configurada y activa.',
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ia_status_view(request):
    """
    Verifica si la IA está disponible para el tenant actual.
    """
    available = GeminiService.is_available()

    if available:
        integration = GeminiService._get_integration()
        provider = GeminiService._detect_provider(integration.endpoint_url or '') if integration else ''
        message = 'Integración de IA activa y disponible.'
    else:
        provider = ''
        message = 'No hay integración de IA configurada. Configúrala en Fundación → Integraciones.'

    return Response({
        'available': available,
        'provider': provider,
        'message': message,
    })
