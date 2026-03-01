"""
GeminiService — Servicio base para llamadas a la API de Gemini.

Busca la IntegracionExterna tipo 'IA' activa del tenant actual
y realiza llamadas HTTP directas (sin SDK adicional).

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
    provider: str = 'gemini'
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
# SERVICIO PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════

class GeminiService:
    """
    Servicio estático para interactuar con Gemini AI.

    Busca la integración IA activa del tenant y ejecuta llamadas.
    Si no hay integración configurada, retorna error descriptivo.
    """

    # Modelo por defecto
    DEFAULT_MODEL = 'gemini-2.0-flash'

    # Timeout para llamadas HTTP
    REQUEST_TIMEOUT = 30  # segundos

    @staticmethod
    def _get_integration():
        """
        Obtiene la IntegracionExterna de tipo IA activa para el tenant actual.

        Returns:
            IntegracionExterna | None
        """
        try:
            from apps.gestion_estrategica.configuracion.models import IntegracionExterna
            return IntegracionExterna.objects.filter(
                tipo_servicio__code='IA',
                is_active=True,
                is_deleted=False,
            ).select_related('tipo_servicio', 'proveedor').first()
        except Exception as e:
            logger.error(f'Error buscando integración IA: {e}')
            return None

    @staticmethod
    def _detect_provider(endpoint_url: str) -> str:
        """Detecta el proveedor por la URL."""
        url_lower = (endpoint_url or '').lower()
        if 'googleapis.com' in url_lower or 'generativelanguage' in url_lower:
            return 'gemini'
        if 'openai.com' in url_lower:
            return 'openai'
        if 'anthropic.com' in url_lower:
            return 'claude'
        return 'gemini'  # default

    @classmethod
    def is_available(cls) -> bool:
        """Verifica si hay una integración IA configurada y activa."""
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
        Genera texto usando la API de Gemini.

        Args:
            prompt: Texto/pregunta del usuario
            system_instruction: Instrucción de sistema (contexto)
            max_tokens: Máximo de tokens en respuesta
            temperature: Creatividad (0.0 - 1.0)
            model: Modelo específico (override)

        Returns:
            AIResult con el texto generado o error
        """
        start_time = time.time()

        # 1. Obtener integración
        integration = cls._get_integration()
        if not integration:
            return AIResult(
                success=False,
                error='No hay integración de IA configurada. '
                      'Ve a Configuración → Integraciones y configura un servicio de IA.',
                processing_time_ms=(time.time() - start_time) * 1000,
            )

        # 2. Obtener credenciales
        try:
            creds = integration.credenciales or {}
            api_key = creds.get('api_key', '')
            if not api_key:
                return AIResult(
                    success=False,
                    error='La integración de IA no tiene API key configurada.',
                    processing_time_ms=(time.time() - start_time) * 1000,
                )
        except Exception as e:
            logger.error(f'Error descifrando credenciales IA: {e}')
            return AIResult(
                success=False,
                error='Error al leer credenciales de la integración IA.',
                processing_time_ms=(time.time() - start_time) * 1000,
            )

        # 3. Determinar proveedor y modelo
        endpoint_url = integration.endpoint_url or ''
        provider = cls._detect_provider(endpoint_url)
        use_model = model or cls.DEFAULT_MODEL

        # 4. Ejecutar llamada según proveedor
        try:
            if provider == 'gemini':
                result = cls._call_gemini(
                    api_key=api_key,
                    prompt=prompt,
                    system_instruction=system_instruction,
                    model=use_model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
            elif provider == 'openai':
                result = cls._call_openai(
                    api_key=api_key,
                    endpoint_url=endpoint_url,
                    prompt=prompt,
                    system_instruction=system_instruction,
                    model=use_model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
            else:
                result = cls._call_gemini(
                    api_key=api_key,
                    prompt=prompt,
                    system_instruction=system_instruction,
                    model=use_model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )

            # Actualizar estadísticas de la integración
            try:
                from django.utils import timezone
                integration.ultima_conexion_exitosa = timezone.now()
                integration.contador_llamadas = (integration.contador_llamadas or 0) + 1
                integration.save(update_fields=['ultima_conexion_exitosa', 'contador_llamadas'])
            except Exception:
                pass  # No fallar por stats

            result.processing_time_ms = (time.time() - start_time) * 1000
            return result

        except requests.Timeout:
            logger.warning(f'Timeout llamando a {provider}')
            return AIResult(
                success=False,
                error=f'La llamada a {provider} excedió el tiempo límite ({cls.REQUEST_TIMEOUT}s).',
                provider=provider,
                processing_time_ms=(time.time() - start_time) * 1000,
            )
        except requests.RequestException as e:
            logger.error(f'Error HTTP llamando a {provider}: {e}')
            return AIResult(
                success=False,
                error=f'Error de conexión con {provider}: {str(e)}',
                provider=provider,
                processing_time_ms=(time.time() - start_time) * 1000,
            )
        except Exception as e:
            logger.error(f'Error inesperado en GeminiService: {e}', exc_info=True)
            return AIResult(
                success=False,
                error=f'Error inesperado: {str(e)}',
                provider=provider,
                processing_time_ms=(time.time() - start_time) * 1000,
            )

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

        # Construir body
        contents = [{'parts': [{'text': prompt}]}]
        body = {
            'contents': contents,
            'generationConfig': {
                'maxOutputTokens': max_tokens,
                'temperature': temperature,
            },
        }

        # System instruction (Gemini 1.5+)
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
            return AIResult(
                success=False,
                error=f'Gemini API error ({response.status_code}): {error_detail}',
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
    def _call_openai(
        cls,
        api_key: str,
        endpoint_url: str,
        prompt: str,
        system_instruction: str,
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> AIResult:
        """Llamada a OpenAI API (compatible)."""
        url = f'{endpoint_url.rstrip("/")}/chat/completions'

        messages = []
        if system_instruction:
            messages.append({'role': 'system', 'content': system_instruction})
        messages.append({'role': 'user', 'content': prompt})

        body = {
            'model': model or 'gpt-4o-mini',
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
            return AIResult(
                success=False,
                error=f'OpenAI API error ({response.status_code}): {error_detail}',
                provider='openai',
                model=model,
            )

        data = response.json()
        text = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        tokens_used = data.get('usage', {}).get('total_tokens', 0)

        return AIResult(
            success=True,
            text=text.strip(),
            tokens_used=tokens_used,
            model=model or 'gpt-4o-mini',
            provider='openai',
        )
