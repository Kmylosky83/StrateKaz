"""
Modelos para la app de IA.

AICallLog: Registra cada llamada a la API de IA para auditoría, costos y cuotas.
AIQuotaConfig: Configuración de cuotas de uso de IA por tenant.
"""

from django.conf import settings
from django.db import models

from utils.models import TenantModel


# ═══════════════════════════════════════════════════════════════════════════
# CHOICES
# ═══════════════════════════════════════════════════════════════════════════

AI_ACTION_CHOICES = [
    ('context_help', 'Ayuda Contextual'),
    ('text_assist', 'Asistente de Texto'),
    ('text_improve', 'Mejorar Texto'),
    ('text_expand', 'Expandir Texto'),
    ('text_summarize', 'Resumir Texto'),
    ('text_formalize', 'Formalizar Texto'),
    ('text_simplify', 'Simplificar Texto'),
    ('text_proofread', 'Revisar Ortografía'),
]

AI_PROVIDER_CHOICES = [
    ('gemini', 'Google Gemini'),
    ('deepseek', 'DeepSeek'),
    ('openai', 'OpenAI'),
    ('claude', 'Anthropic Claude'),
]


# ═══════════════════════════════════════════════════════════════════════════
# AICallLog — Registro de llamadas IA
# ═══════════════════════════════════════════════════════════════════════════

class AICallLog(TenantModel):
    """
    Registra cada llamada a la API de IA para auditoría,
    seguimiento de costos y enforcement de cuotas.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ai_calls',
        verbose_name='Usuario',
    )
    action = models.CharField(
        max_length=50,
        choices=AI_ACTION_CHOICES,
        verbose_name='Acción',
    )
    provider = models.CharField(
        max_length=30,
        choices=AI_PROVIDER_CHOICES,
        blank=True,
        verbose_name='Proveedor',
    )
    model_used = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Modelo utilizado',
    )
    module = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Módulo',
        help_text='Módulo desde donde se invocó la IA',
    )

    # Métricas de rendimiento
    input_tokens = models.PositiveIntegerField(
        default=0,
        verbose_name='Tokens de entrada',
    )
    output_tokens = models.PositiveIntegerField(
        default=0,
        verbose_name='Tokens de salida',
    )
    latency_ms = models.PositiveIntegerField(
        default=0,
        verbose_name='Latencia (ms)',
    )

    # Estado
    success = models.BooleanField(
        default=True,
        verbose_name='Exitoso',
    )
    error_message = models.TextField(
        blank=True,
        verbose_name='Mensaje de error',
    )

    # Cache
    was_cached = models.BooleanField(
        default=False,
        verbose_name='Respuesta cacheada',
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
        verbose_name = 'Log de llamada IA'
        verbose_name_plural = 'Logs de llamadas IA'

    def __str__(self):
        return f"{self.user} - {self.get_action_display()} - {self.provider} ({self.created_at})"


# ═══════════════════════════════════════════════════════════════════════════
# AIQuotaConfig — Configuración de cuotas
# ═══════════════════════════════════════════════════════════════════════════

class AIQuotaConfig(TenantModel):
    """
    Configuración de cuotas de uso de IA por tenant.

    Solo debe existir un registro por tenant (singleton pattern).
    Se crea automáticamente con valores por defecto cuando se consulta.
    """

    daily_limit = models.PositiveIntegerField(
        default=100,
        verbose_name='Límite diario',
        help_text='Máximo de llamadas IA por usuario por día',
    )
    monthly_limit = models.PositiveIntegerField(
        default=2000,
        verbose_name='Límite mensual',
        help_text='Máximo de llamadas IA por usuario por mes',
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='IA habilitada',
        help_text='Habilitar/deshabilitar IA para este tenant',
    )

    class Meta:
        verbose_name = 'Configuración de cuota IA'
        verbose_name_plural = 'Configuraciones de cuota IA'

    def __str__(self):
        return f"Cuota IA: {self.daily_limit}/día, {self.monthly_limit}/mes"

    @classmethod
    def get_config(cls):
        """
        Obtiene o crea la configuración de cuota del tenant actual.
        Singleton: solo un registro por tenant.
        """
        config = cls.objects.first()
        if not config:
            config = cls.objects.create()
        return config
