"""
Serializers para la app de IA.
"""
from rest_framework import serializers


# ═══════════════════════════════════════════════════════════════════════════
# AYUDA CONTEXTUAL
# ═══════════════════════════════════════════════════════════════════════════

class ContextHelpRequestSerializer(serializers.Serializer):
    """Request para ayuda contextual."""
    module_code = serializers.CharField(
        max_length=100,
        help_text='Código del módulo (ej: planeacion_estrategica)',
    )
    tab_code = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        help_text='Código del tab activo (ej: objetivos)',
    )
    section_name = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text='Nombre de la sección específica',
    )


class ContextHelpResponseSerializer(serializers.Serializer):
    """Response de ayuda contextual."""
    title = serializers.CharField()
    description = serializers.CharField()
    tab_help = serializers.CharField(allow_blank=True)
    section_help = serializers.CharField(allow_blank=True)
    tips = serializers.ListField(child=serializers.CharField(), required=False)
    ai_response = serializers.CharField(required=False, allow_blank=True)
    ai_enhanced = serializers.BooleanField()
    tokens_used = serializers.IntegerField(required=False)


# ═══════════════════════════════════════════════════════════════════════════
# ASISTENTE DE TEXTO
# ═══════════════════════════════════════════════════════════════════════════

class TextAssistRequestSerializer(serializers.Serializer):
    """Request para asistencia de texto."""
    text = serializers.CharField(
        max_length=5000,
        help_text='Texto a procesar',
    )
    action = serializers.ChoiceField(
        choices=[
            ('improve', 'Mejorar redacción'),
            ('formal', 'Lenguaje formal'),
            ('summarize', 'Resumir'),
            ('expand', 'Expandir'),
            ('proofread', 'Revisar ortografía'),
        ],
        default='improve',
        help_text='Acción a ejecutar sobre el texto',
    )


class TextAssistResponseSerializer(serializers.Serializer):
    """Response de asistencia de texto."""
    success = serializers.BooleanField()
    text = serializers.CharField(allow_blank=True)
    error = serializers.CharField(allow_blank=True, required=False)
    tokens_used = serializers.IntegerField()
    model = serializers.CharField()
    provider = serializers.CharField()
    processing_time_ms = serializers.FloatField()


# ═══════════════════════════════════════════════════════════════════════════
# DISPONIBILIDAD
# ═══════════════════════════════════════════════════════════════════════════

class IAStatusResponseSerializer(serializers.Serializer):
    """Response del estado de IA."""
    available = serializers.BooleanField()
    provider = serializers.CharField(allow_blank=True)
    message = serializers.CharField()
