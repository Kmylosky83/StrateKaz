"""
Admin para la app de IA.
"""

from django.contrib import admin

from .models import AICallLog, AIQuotaConfig


@admin.register(AICallLog)
class AICallLogAdmin(admin.ModelAdmin):
    """Admin para logs de llamadas IA."""

    list_display = [
        'user',
        'action',
        'provider',
        'model_used',
        'success',
        'latency_ms',
        'input_tokens',
        'output_tokens',
        'was_cached',
        'created_at',
    ]
    list_filter = ['action', 'provider', 'success', 'was_cached', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'module', 'error_message']
    readonly_fields = [
        'user',
        'action',
        'provider',
        'model_used',
        'module',
        'input_tokens',
        'output_tokens',
        'latency_ms',
        'success',
        'error_message',
        'was_cached',
        'created_at',
        'updated_at',
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(AIQuotaConfig)
class AIQuotaConfigAdmin(admin.ModelAdmin):
    """Admin para configuración de cuotas IA."""

    list_display = ['daily_limit', 'monthly_limit', 'is_active', 'updated_at']
    fields = ['daily_limit', 'monthly_limit', 'is_active']
