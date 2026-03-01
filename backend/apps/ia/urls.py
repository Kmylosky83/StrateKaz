"""
URLs para la app de IA.

Endpoints:
    POST /api/ia/context-help/    — Ayuda contextual
    POST /api/ia/text-assist/     — Asistente de texto
    GET  /api/ia/status/          — Estado de disponibilidad
    GET  /api/ia/usage-stats/     — Estadísticas de uso
"""

from django.urls import path

from . import views

app_name = 'ia'

urlpatterns = [
    path('context-help/', views.context_help_view, name='context-help'),
    path('text-assist/', views.text_assist_view, name='text-assist'),
    path('status/', views.ia_status_view, name='status'),
    path('usage-stats/', views.usage_stats_view, name='usage-stats'),
]
