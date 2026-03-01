"""
GeminiService — Servicio multi-proveedor de IA.

Busca las IntegracionExterna tipo 'IA' activas del tenant actual
y realiza llamadas HTTP directas (sin SDK adicional).
Soporta: Gemini, OpenAI, DeepSeek y cualquier API OpenAI-compatible.

Con fallback automático: si el proveedor principal falla (429, timeout, etc.),
intenta con el siguiente proveedor configurado.

Uso:
    from apps.ia.services import GeminiService

    result = GeminiService.generate(
        prompt="Mejora esta redacción: ...",
        max_tokens=500,
    )
    # result = {'success': True, 'text': '...', 'tokens_used': 123, ...}
"""

import logging
import time
from dataclasses import dataclass
from typing import Optional

import requests
from django.core.cache import cache

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# RESULTADO
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class AIResult:
    """Resultado estandarizado de una llamada a IA."""
    success: bool
    text: str = ''
    error: str = ''
    tokens_used: int = 0
    model: str = ''
    provider: str = ''
    processing_time_ms: float = 0

    def to_dict(self):
        return {
            'success': self.success,
            'text': self.text,
            'error': self.error,
            'tokens_used': self.tokens_used,
            'model': self.model,
            'provider': self.provider,
            'processing_time_ms': round(self.processing_time_ms, 2),
        }


# ═══════════════════════════════════════════════════════════════════════════
# MODELOS POR DEFECTO POR PROVEEDOR
# ═══════════════════════════════════════════════════════════════════════════

DEFAULT_MODELS = {
    'gemini': 'gemini-2.0-flash',
    'openai': 'gpt-4o-mini',
    'deepseek': 'deepseek-chat',
    'claude': 'claude-sonnet-4-20250514',
}

# Errores que justifican intentar con el siguiente proveedor
FALLBACK_STATUS_CODES = {429, 500, 502, 503, 504}


# ═══════════════════════════════════════════════════════════════════════════
# SERVICIO PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════

class GeminiService:
    """
    Servicio multi-proveedor de IA con fallback automático.

    Busca todas las integraciones IA activas del tenant y ejecuta llamadas.
    Si el proveedor principal falla, intenta con el siguiente.
    """

    # Timeout para llamadas HTTP
    REQUEST_TIMEOUT = 30  # segundos

    @staticmethod
    def _get_integrations():
        """
        Obtiene TODAS las IntegracionExterna de tipo IA activas,
        ordenadas por id (la primera registrada = principal).

        Returns:
            list[IntegracionExterna]
        """
        try:
            from apps.gestion_estrategica.configuracion.models import IntegracionExterna
            return list(
                IntegracionExterna.objects.filter(
                    tipo_servicio__code='IA',
                    is_active=True,
                ).select_related('tipo_servicio', 'proveedor')
                .order_by('id')
            )
        except Exception as e:
            logger.error(f'Error buscando integraciones IA: {e}')
            return []

    @staticmethod
    def _get_integration():
        """Compatibilidad: retorna la primera integración IA activa."""
        try:
            from apps.gestion_estrategica.configuracion.models import IntegracionExterna
            return IntegracionExterna.objects.filter(
                tipo_servicio__code='IA',
                is_active=True,
            ).select_related('tipo_servicio', 'proveedor').first()
        except Exception as e:
            logger.error(f'Error buscando integración IA: {e}')
            return None

    @staticmethod
    def _detect_provider(endpoint_url: str) -> str:
        """Detecta el proveedor por la URL del endpoint."""
        url_lower = (endpoint_url or '').lower()
        if 'googleapis.com' in url_lower or 'generativelanguage' in url_lower:
            return 'gemini'
        if 'deepseek.com' in url_lower:
            return 'deepseek'
        if 'openai.com' in url_lower:
            return 'openai'
        if 'anthropic.com' in url_lower:
            return 'claude'
        return 'gemini'  # default

    @classmethod
    def is_available(cls) -> bool:
        """Verifica si hay al menos una integración IA configurada y activa."""
        return cls._get_integration() is not None

    @classmethod
    def generate(
        cls,
        prompt: str,
        system_instruction: str = '',
        max_tokens: int = 1024,
        temperature: float = 0.7,
        model: Optional[str] = None,
    ) -> AIResult:
        """
        Genera texto usando IA con fallback multi-proveedor.

        Intenta con cada integración IA activa en orden.
        Si una falla con error recuperable (429, 5xx, timeout),
        intenta con la siguiente.

        Args:
            prompt: Texto/pregunta del usuario
            system_instruction: Instrucción de sistema (contexto)
            max_tokens: Máximo de tokens en respuesta
            temperature: Creatividad (0.0 - 1.0)
            model: Modelo específico (override, aplica solo al primer intento)

        Returns:
            AIResult con el texto generado o error
        """
        start_time = time.time()

        # 1. Obtener todas las integraciones IA activas
        integrations = cls._get_integrations()
        if not integrations:
            return AIResult(
                success=False,
                error='No hay integración de IA configurada. '
                      'Ve a Fundación → Integraciones y configura un servicio de IA.',
                processing_time_ms=(time.time() - start_time) * 1000,
            )

        last_error = ''
        last_provider = ''

        # 2. Intentar con cada integración en orden
        for i, integration in enumerate(integrations):
            # Obtener credenciales
            try:
                creds = integration.credenciales or {}
                api_key = creds.get('api_key', '')
                if not api_key:
                    logger.warning(
                        f'Integración IA #{integration.id} '
                        f'({integration.nombre}) sin API key, saltando.'
                    )
                    continue
            except Exception as e:
                logger.error(f'Error leyendo credenciales de integración #{integration.id}: {e}')
                continue

            # Determinar proveedor y modelo
            endpoint_url = integration.endpoint_url or ''
            provider = cls._detect_provider(endpoint_url)
            last_provider = provider

            # Modelo: usar el override solo en el primer intento,
            # después usar el default del proveedor
            if i == 0 and model:
                use_model = model
            else:
                use_model = DEFAULT_MODELS.get(provider, 'gemini-2.0-flash')

            is_last = (i == len(integrations) - 1)

            try:
                result = cls._call_provider(
                    provider=provider,
                    api_key=api_key,
                    endpoint_url=endpoint_url,
                    prompt=prompt,
                    system_instruction=system_instruction,
                    model=use_model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )

                if result.success:
                    # Actualizar estadísticas
                    cls._update_stats(integration)
                    result.processing_time_ms = (time.time() - start_time) * 1000
                    return result

                # Falló pero ¿es recuperable?
                last_error = result.error
                if not is_last and cls._is_fallback_error(result.error):
                    logger.info(
                        f'Proveedor {provider} falló ({result.error[:80]}), '
                        f'intentando siguiente integración...'
                    )
                    continue

                # Error no recuperable o es la última integración
                result.processing_time_ms = (time.time() - start_time) * 1000
                return result

            except requests.Timeout:
                last_error = f'Timeout de {provider} ({cls.REQUEST_TIMEOUT}s).'
                logger.warning(f'Timeout llamando a {provider} (integración #{integration.id})')
                if not is_last:
                    continue
                return AIResult(
                    success=False,
                    error=f'La llamada a {provider} excedió el tiempo límite.',
                    provider=provider,
                    processing_time_ms=(time.time() - start_time) * 1000,
                )
            except requests.RequestException as e:
                last_error = f'Error de conexión con {provider}.'
                logger.error(f'Error HTTP con {provider}: {e}')
                if not is_last:
                    continue
                return AIResult(
                    success=False,
                    error=last_error,
                    provider=provider,
                    processing_time_ms=(time.time() - start_time) * 1000,
                )
            except Exception as e:
                logger.error(f'Error inesperado con {provider}: {e}', exc_info=True)
                last_error = f'Error inesperado: {str(e)}'
                if not is_last:
                    continue
                return AIResult(
                    success=False,
                    error=last_error,
                    provider=provider,
                    processing_time_ms=(time.time() - start_time) * 1000,
                )

        # Todas las integraciones fallaron
        return AIResult(
            success=False,
            error=last_error or 'Todos los proveedores de IA fallaron.',
            provider=last_provider,
            processing_time_ms=(time.time() - start_time) * 1000,
        )

    @classmethod
    def _call_provider(
        cls,
        provider: str,
        api_key: str,
        endpoint_url: str,
        prompt: str,
        system_instruction: str,
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> AIResult:
        """Despacha la llamada al proveedor correcto."""
        if provider == 'gemini':
            return cls._call_gemini(
                api_key=api_key,
                prompt=prompt,
                system_instruction=system_instruction,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
            )
        # DeepSeek, OpenAI y cualquier API OpenAI-compatible
        return cls._call_openai_compatible(
            api_key=api_key,
            endpoint_url=endpoint_url,
            prompt=prompt,
            system_instruction=system_instruction,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            provider=provider,
        )

    @staticmethod
    def _is_fallback_error(error_msg: str) -> bool:
        """Determina si el error justifica intentar con otro proveedor."""
        fallback_keywords = [
            'cuota', 'quota', '429', 'rate limit',
            'timeout', 'tiempo límite',
            '500', '502', '503', '504',
            'conexión', 'connection',
        ]
        error_lower = error_msg.lower()
        return any(kw in error_lower for kw in fallback_keywords)

    @staticmethod
    def _update_stats(integration):
        """Actualiza estadísticas de uso de la integración."""
        try:
            from django.utils import timezone
            integration.ultima_conexion_exitosa = timezone.now()
            integration.contador_llamadas = (integration.contador_llamadas or 0) + 1
            integration.save(update_fields=['ultima_conexion_exitosa', 'contador_llamadas'])
        except Exception:
            pass

    # ═══════════════════════════════════════════════════════════════════════
    # PROVEEDORES
    # ═══════════════════════════════════════════════════════════════════════

    @classmethod
    def _call_gemini(
        cls,
        api_key: str,
        prompt: str,
        system_instruction: str,
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> AIResult:
        """Llamada a Gemini API (Google AI)."""
        base_url = 'https://generativelanguage.googleapis.com/v1beta'
        url = f'{base_url}/models/{model}:generateContent'

        contents = [{'parts': [{'text': prompt}]}]
        body = {
            'contents': contents,
            'generationConfig': {
                'maxOutputTokens': max_tokens,
                'temperature': temperature,
            },
        }

        if system_instruction:
            body['systemInstruction'] = {
                'parts': [{'text': system_instruction}]
            }

        response = requests.post(
            url,
            json=body,
            params={'key': api_key},
            headers={'Content-Type': 'application/json'},
            timeout=cls.REQUEST_TIMEOUT,
        )

        if response.status_code != 200:
            error_detail = ''
            try:
                error_data = response.json()
                error_detail = error_data.get('error', {}).get('message', response.text[:200])
            except Exception:
                error_detail = response.text[:200]

            friendly_error = cls._friendly_error(response.status_code, 'Gemini')
            logger.warning(f'Gemini API error ({response.status_code}): {error_detail}')
            return AIResult(
                success=False,
                error=friendly_error,
                provider='gemini',
                model=model,
            )

        data = response.json()
        candidates = data.get('candidates', [])
        if not candidates:
            return AIResult(
                success=False,
                error='Gemini no generó respuesta. Intenta reformular el texto.',
                provider='gemini',
                model=model,
            )

        text = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        tokens_used = data.get('usageMetadata', {}).get('totalTokenCount', 0)

        return AIResult(
            success=True,
            text=text.strip(),
            tokens_used=tokens_used,
            model=model,
            provider='gemini',
        )

    @classmethod
    def _call_openai_compatible(
        cls,
        api_key: str,
        endpoint_url: str,
        prompt: str,
        system_instruction: str,
        model: str,
        max_tokens: int,
        temperature: float,
        provider: str = 'openai',
    ) -> AIResult:
        """Llamada a API OpenAI-compatible (OpenAI, DeepSeek, etc.)."""
        url = f'{endpoint_url.rstrip("/")}/chat/completions'

        messages = []
        if system_instruction:
            messages.append({'role': 'system', 'content': system_instruction})
        messages.append({'role': 'user', 'content': prompt})

        body = {
            'model': model,
            'messages': messages,
            'max_tokens': max_tokens,
            'temperature': temperature,
        }

        response = requests.post(
            url,
            json=body,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            timeout=cls.REQUEST_TIMEOUT,
        )

        if response.status_code != 200:
            error_detail = response.text[:200]
            friendly_error = cls._friendly_error(response.status_code, provider.capitalize())
            logger.warning(f'{provider} API error ({response.status_code}): {error_detail}')
            return AIResult(
                success=False,
                error=friendly_error,
                provider=provider,
                model=model,
            )

        data = response.json()
        text = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        tokens_used = data.get('usage', {}).get('total_tokens', 0)

        return AIResult(
            success=True,
            text=text.strip(),
            tokens_used=tokens_used,
            model=model,
            provider=provider,
        )

    @staticmethod
    def _friendly_error(status_code: int, provider_name: str) -> str:
        """Genera mensaje de error amigable según el código HTTP."""
        if status_code == 429:
            return (
                f'Se agotó la cuota de {provider_name}. '
                'Espera unos minutos o revisa tu plan.'
            )
        if status_code == 401:
            return f'La API key de {provider_name} es inválida. Revísala en Fundación → Integraciones.'
        if status_code == 403:
            return f'Sin permisos para usar {provider_name}. Verifica la configuración.'
        if status_code == 400:
            return f'{provider_name} rechazó la solicitud. Verifica la configuración del modelo.'
        return f'Error de {provider_name} ({status_code}). Intenta de nuevo.'
