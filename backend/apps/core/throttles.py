"""
Throttles del módulo Core — Rate limiting para endpoints sensibles.
"""

from rest_framework.throttling import UserRateThrottle


class ImpersonationRateThrottle(UserRateThrottle):
    """
    Rate limit para el endpoint de impersonación.

    Limita a 10 requests por minuto por usuario autenticado.
    Previene enumeración de usuarios ante sesiones comprometidas.
    """

    scope = 'impersonation'
    rate = '10/min'
