"""
Views para la app de IA.

Endpoints:
- POST /api/ia/context-help/   — Ayuda contextual ("dónde estoy y qué puedo hacer")
- POST /api/ia/text-assist/    — Asistente de texto (mejorar, formalizar, resumir, etc.)
- GET  /api/ia/status/         — Estado de disponibilidad de IA
- GET  /api/ia/usage-stats/    — Estadísticas de uso de IA del usuario
"""

import logging
import time

from django.db.models import Count
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .models import AICallLog, AIQuotaConfig
from .serializers import (
    ContextHelpRequestSerializer,
    ContextHelpResponseSerializer,
    TextAssistRequestSerializer,
    TextAssistResponseSerializer,
    IAStatusResponseSerializer,
    AIUsageStatsResponseSerializer,
)
from .services.gemini_service import GeminiService
from .services.context_help import ContextualHelpService
from .services.text_assist import TextAssistService

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════

# Map text_assist actions to AICallLog action codes
TEXT_ASSIST_ACTION_MAP = {
    'improve': 'text_improve',
    'formal': 'text_formalize',
    'summarize': 'text_summarize',
    'expand': 'text_expand',
    'proofread': 'text_proofread',
}


def check_ai_quota(user):
    """
    Verifica si el usuario tiene cuota disponible de IA.
    Solo cuenta llamadas REALES (no cache hits ni fallidas).

    Returns:
        tuple: (allowed: bool, daily_remaining: int, monthly_remaining: int, config: AIQuotaConfig)
    """
    config = AIQuotaConfig.get_config()

    if not config.is_active:
        return False, 0, 0, config

    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Solo contar llamadas reales (excluir cache hits y fallidas)
    real_calls_base = AICallLog.objects.filter(
        user=user, was_cached=False, success=True,
    )

    daily_count = real_calls_base.filter(
        created_at__gte=today_start,
    ).count()

    monthly_count = real_calls_base.filter(
        created_at__gte=month_start,
    ).count()

    daily_remaining = max(0, config.daily_limit - daily_count)
    monthly_remaining = max(0, config.monthly_limit - monthly_count)

    allowed = daily_remaining > 0 and monthly_remaining > 0
    return allowed, daily_remaining, monthly_remaining, config


def log_ai_call(user, action, result, latency_ms, module='', was_cached=False):
    """
    Registra una llamada a IA en el log.

    Args:
        user: Usuario que hizo la llamada
        action: Código de acción (context_help, text_improve, etc.)
        result: AIResult del servicio
        latency_ms: Latencia en milisegundos
        module: Módulo desde donde se llamó
        was_cached: Si la respuesta fue de cache
    """
    try:
        AICallLog.objects.create(
            user=user,
            action=action,
            provider=result.provider if hasattr(result, 'provider') else '',
            model_used=result.model if hasattr(result, 'model') else '',
            module=module,
            input_tokens=0,  # Se podría estimar en el futuro
            output_tokens=result.tokens_used if hasattr(result, 'tokens_used') else 0,
            latency_ms=int(latency_ms),
            success=result.success if hasattr(result, 'success') else True,
            error_message=result.error if hasattr(result, 'error') else '',
            was_cached=was_cached,
        )
    except Exception as e:
        logger.error(f'Error registrando AICallLog: {e}')


def quota_exceeded_response(daily_remaining, monthly_remaining):
    """Genera respuesta 429 cuando se excede la cuota."""
    if daily_remaining <= 0:
        message = (
            'Has alcanzado el límite diario de llamadas IA. '
            'Intenta de nuevo mañana o contacta al administrador.'
        )
    else:
        message = (
            'Has alcanzado el límite mensual de llamadas IA. '
            'Contacta al administrador para aumentar tu cuota.'
        )
    return Response(
        {'error': message, 'quota_exceeded': True},
        status=status.HTTP_429_TOO_MANY_REQUESTS,
    )


# ═══════════════════════════════════════════════════════════════════════════
# CONTEXT HELP
# ═══════════════════════════════════════════════════════════════════════════

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

    # Verificar cuota
    allowed, daily_rem, monthly_rem, _config = check_ai_quota(request.user)
    if not allowed:
        return quota_exceeded_response(daily_rem, monthly_rem)

    start_time = time.time()

    result = ContextualHelpService.get_help(
        module_code=serializer.validated_data['module_code'],
        tab_code=serializer.validated_data.get('tab_code', ''),
        section_name=serializer.validated_data.get('section_name', ''),
    )

    latency_ms = (time.time() - start_time) * 1000
    is_cached = not result.get('ai_enhanced', False)

    # Solo registrar llamadas reales (no cache hits) para no inflar el contador
    if not is_cached:
        class _DictResult:
            def __init__(self, d):
                self.success = True
                self.provider = ''
                self.model = ''
                self.tokens_used = d.get('tokens_used', 0)
                self.error = ''

        log_ai_call(
            user=request.user,
            action='context_help',
            result=_DictResult(result),
            latency_ms=latency_ms,
            module=serializer.validated_data.get('module_code', ''),
            was_cached=False,
        )

    return Response(result, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════════════
# TEXT ASSIST
# ═══════════════════════════════════════════════════════════════════════════

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

    # Verificar cuota
    allowed, daily_rem, monthly_rem, _config = check_ai_quota(request.user)
    if not allowed:
        return quota_exceeded_response(daily_rem, monthly_rem)

    start_time = time.time()

    action = serializer.validated_data.get('action', 'improve')
    result = TextAssistService.assist(
        text=serializer.validated_data['text'],
        action=action,
    )

    latency_ms = (time.time() - start_time) * 1000

    # Map to log action code
    log_action = TEXT_ASSIST_ACTION_MAP.get(action, 'text_assist')

    log_ai_call(
        user=request.user,
        action=log_action,
        result=result,
        latency_ms=latency_ms,
        module=request.data.get('module', ''),
    )

    return Response(result.to_dict(), status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════════════
# IA STATUS
# ═══════════════════════════════════════════════════════════════════════════

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

    # Include quota info if available
    quota_info = {}
    if available:
        allowed, daily_rem, monthly_rem, config = check_ai_quota(request.user)
        quota_info = {
            'quota_active': config.is_active,
            'daily_remaining': daily_rem,
            'daily_limit': config.daily_limit,
        }

    return Response({
        'available': available,
        'provider': provider,
        'message': message,
        **quota_info,
    })


# ═══════════════════════════════════════════════════════════════════════════
# USAGE STATS
# ═══════════════════════════════════════════════════════════════════════════

@extend_schema(
    responses={200: AIUsageStatsResponseSerializer},
    tags=['IA'],
    summary='Estadísticas de uso de IA',
    description='Retorna estadísticas de uso de IA del usuario actual: llamadas diarias, mensuales, por acción y proveedor.',
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usage_stats_view(request):
    """
    Estadísticas de uso de IA del usuario autenticado.

    Retorna conteos diarios, mensuales, por acción y proveedor,
    más las últimas 10 llamadas recientes.
    """
    user = request.user
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    config = AIQuotaConfig.get_config()

    # Conteos (solo llamadas reales, excluir cache hits y fallidas)
    real_calls_base = AICallLog.objects.filter(
        user=user, was_cached=False, success=True,
    )

    daily_count = real_calls_base.filter(
        created_at__gte=today_start,
    ).count()

    monthly_count = real_calls_base.filter(
        created_at__gte=month_start,
    ).count()

    # Por acción (este mes)
    by_action = list(
        AICallLog.objects.filter(
            user=user,
            created_at__gte=month_start,
        )
        .values('action')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # Por proveedor (este mes)
    by_provider = list(
        AICallLog.objects.filter(
            user=user,
            created_at__gte=month_start,
        )
        .exclude(provider='')
        .values('provider')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # Últimas 10 llamadas
    recent = list(
        AICallLog.objects.filter(user=user)
        .order_by('-created_at')[:10]
        .values('action', 'provider', 'latency_ms', 'success', 'created_at')
    )

    return Response({
        'today': {
            'calls': daily_count,
            'limit': config.daily_limit,
            'remaining': max(0, config.daily_limit - daily_count),
        },
        'month': {
            'calls': monthly_count,
            'limit': config.monthly_limit,
            'remaining': max(0, config.monthly_limit - monthly_count),
        },
        'by_action': by_action,
        'by_provider': by_provider,
        'recent': recent,
    })
