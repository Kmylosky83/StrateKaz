"""
Vistas de autenticación con rate limiting y logging de seguridad.

Estas vistas envuelven las vistas JWT de SimpleJWT para agregar:
- Protección contra ataques de fuerza bruta (rate limiting)
- Logging de intentos de login fallidos (P1-14)
"""
import logging
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.response import Response
from rest_framework import status

from apps.core.decorators import login_rate_limit, api_rate_limit

# Logger de seguridad para auditoría
security_logger = logging.getLogger('security')


@method_decorator(login_rate_limit, name='post')
class RateLimitedTokenObtainPairView(TokenObtainPairView):
    """
    Vista de login con rate limiting y logging de seguridad.

    Límite: 5 intentos por minuto por IP.
    Esto protege contra ataques de fuerza bruta.

    P1-14: Logging de intentos fallidos para detección de ataques.
    """

    def post(self, request, *args, **kwargs):
        # Capturar información para logging
        username = request.data.get('username', 'unknown')
        ip_address = self._get_client_ip(request)

        try:
            response = super().post(request, *args, **kwargs)

            # Login exitoso
            if response.status_code == 200:
                security_logger.info(
                    f"Login exitoso - User: {username} - IP: {ip_address}"
                )
            return response

        except Exception as e:
            # Login fallido - loggear para detección de ataques
            security_logger.warning(
                f"Login fallido - User: {username} - IP: {ip_address} - "
                f"Error: {type(e).__name__}"
            )
            raise

    def _get_client_ip(self, request):
        """Obtiene la IP real del cliente, considerando proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


@method_decorator(api_rate_limit, name='post')
class RateLimitedTokenRefreshView(TokenRefreshView):
    """
    Vista de refresh token con rate limiting.

    Límite: 100 requests por minuto por IP.
    Más permisivo ya que el refresh es una operación legítima frecuente.
    """
    pass
