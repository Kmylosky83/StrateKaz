"""
TextAssistService — Asistente de texto con IA.

Mejora, formaliza, resume o expande textos usando Gemini.

Uso:
    from apps.ia.services.text_assist import TextAssistService

    result = TextAssistService.improve("texto a mejorar")
    result = TextAssistService.formalize("texto informal")
    result = TextAssistService.summarize("texto largo")
"""

import logging

from .gemini_service import GeminiService, AIResult

logger = logging.getLogger(__name__)


class TextAssistService:
    """
    Servicio para asistencia de texto con IA.

    Acciones disponibles:
    - improve: Mejorar redacción y gramática
    - formal: Convertir a lenguaje formal empresarial
    - summarize: Resumir texto
    - expand: Expandir con más detalles
    - proofread: Revisar ortografía y gramática
    """

    SYSTEM_INSTRUCTION = (
        'Eres un asistente de redacción empresarial para StrateKaz, '
        'un Sistema de Gestión Integral para empresas colombianas. '
        'Responde SIEMPRE en español colombiano. '
        'Retorna SOLO el texto mejorado, sin explicaciones ni comentarios adicionales. '
        'Mantén el sentido original del texto. '
        'Usa lenguaje profesional y claro.'
    )

    # Prompts por acción
    ACTION_PROMPTS = {
        'improve': (
            'Mejora la redacción del siguiente texto manteniendo su sentido original. '
            'Corrige gramática, ortografía y mejora la claridad:\n\n{text}'
        ),
        'formal': (
            'Convierte el siguiente texto a lenguaje formal empresarial colombiano. '
            'Mantén el contenido pero hazlo profesional y apropiado para documentos corporativos:\n\n{text}'
        ),
        'summarize': (
            'Resume el siguiente texto en máximo 50 palabras, '
            'conservando los puntos clave:\n\n{text}'
        ),
        'expand': (
            'Expande el siguiente texto con más detalles y contexto relevante. '
            'Máximo 200 palabras. Mantén el tono profesional:\n\n{text}'
        ),
        'proofread': (
            'Revisa la ortografía y gramática del siguiente texto. '
            'Corrige errores y retorna el texto corregido:\n\n{text}'
        ),
    }

    # Tokens máximos por acción
    ACTION_MAX_TOKENS = {
        'improve': 500,
        'formal': 500,
        'summarize': 150,
        'expand': 600,
        'proofread': 500,
    }

    @classmethod
    def assist(cls, text: str, action: str = 'improve') -> AIResult:
        """
        Ejecuta una acción de asistencia de texto.

        Args:
            text: Texto a procesar
            action: Acción a ejecutar (improve, formal, summarize, expand, proofread)

        Returns:
            AIResult con el texto procesado
        """
        if not text or not text.strip():
            return AIResult(
                success=False,
                error='El texto no puede estar vacío.',
            )

        if action not in cls.ACTION_PROMPTS:
            return AIResult(
                success=False,
                error=f'Acción no válida: {action}. '
                      f'Opciones: {", ".join(cls.ACTION_PROMPTS.keys())}',
            )

        # Limitar longitud del texto de entrada
        max_input_chars = 5000
        if len(text) > max_input_chars:
            text = text[:max_input_chars]

        prompt = cls.ACTION_PROMPTS[action].format(text=text)
        max_tokens = cls.ACTION_MAX_TOKENS.get(action, 500)

        return GeminiService.generate(
            prompt=prompt,
            system_instruction=cls.SYSTEM_INSTRUCTION,
            max_tokens=max_tokens,
            temperature=0.4,  # Menos creativo para edición de texto
        )

    # Shortcuts de conveniencia
    @classmethod
    def improve(cls, text: str) -> AIResult:
        return cls.assist(text, 'improve')

    @classmethod
    def formalize(cls, text: str) -> AIResult:
        return cls.assist(text, 'formal')

    @classmethod
    def summarize(cls, text: str) -> AIResult:
        return cls.assist(text, 'summarize')

    @classmethod
    def expand(cls, text: str) -> AIResult:
        return cls.assist(text, 'expand')

    @classmethod
    def proofread(cls, text: str) -> AIResult:
        return cls.assist(text, 'proofread')
