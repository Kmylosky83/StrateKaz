"""
Services: Analytics — Contrato publico del modulo.

Otros modulos NUNCA importan directamente de este modulo.
En su lugar, usan estos services como API interna.

Patron:
    from apps.analytics.services import AnalyticsService
    resultado = AnalyticsService.get_entity(id)
"""


class AnalyticsService:
    """Contrato publico del modulo analytics."""

    pass
