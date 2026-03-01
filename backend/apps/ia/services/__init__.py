"""
Services: IA Integration — Contrato público para otros módulos.

Uso:
    from apps.ia.services import GeminiService
    resultado = GeminiService.generate(prompt="...", tenant_schema="demo")
"""

from .gemini_service import GeminiService

__all__ = ['GeminiService']
