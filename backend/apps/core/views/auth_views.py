"""
Vistas de autenticación con rate limiting.

Estas vistas envuelven las vistas JWT de SimpleJWT para agregar
protección contra ataques de fuerza bruta.
"""
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.core.decorators import login_rate_limit, api_rate_limit


@method_decorator(login_rate_limit, name='post')
class RateLimitedTokenObtainPairView(TokenObtainPairView):
    """
    Vista de login con rate limiting.

    Límite: 5 intentos por minuto por IP.
    Esto protege contra ataques de fuerza bruta.
    """
    pass


@method_decorator(api_rate_limit, name='post')
class RateLimitedTokenRefreshView(TokenRefreshView):
    """
    Vista de refresh token con rate limiting.

    Límite: 100 requests por minuto por IP.
    Más permisivo ya que el refresh es una operación legítima frecuente.
    """
    pass
