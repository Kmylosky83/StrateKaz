"""
Decoradores de rate limiting para endpoints críticos.
"""
from functools import wraps
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger('django.security')


def get_client_ip(request):
    """Obtener IP real del cliente."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def rate_limit(key_prefix, limit, period):
    """
    Decorador genérico de rate limiting.

    Args:
        key_prefix: Prefijo para la clave de cache
        limit: Número máximo de requests permitidos
        period: Período de tiempo en segundos
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Obtener IP del cliente
            ip = get_client_ip(request)

            # Crear clave única
            cache_key = f'{key_prefix}_{ip}'

            # Obtener contador actual
            current_requests = cache.get(cache_key, 0)

            # Verificar límite
            if current_requests >= limit:
                logger.warning(
                    f"Rate limit exceeded for {key_prefix}",
                    extra={
                        'ip': ip,
                        'key_prefix': key_prefix,
                        'limit': limit,
                        'period': period,
                        'path': request.path,
                    }
                )
                return JsonResponse({
                    'error': 'Límite de solicitudes excedido. Por favor, intente más tarde.',
                    'retry_after': period
                }, status=429)

            # Incrementar contador
            cache.set(cache_key, current_requests + 1, period)

            return view_func(request, *args, **kwargs)

        return wrapped_view
    return decorator


def login_rate_limit(view_func):
    """
    Rate limit para endpoints de login.
    Límite: 5 intentos por minuto.
    """
    return rate_limit('login_ratelimit', limit=5, period=60)(view_func)


def api_rate_limit(view_func):
    """
    Rate limit para endpoints generales de API.
    Límite: 100 requests por minuto.
    """
    return rate_limit('api_ratelimit', limit=100, period=60)(view_func)


def sensitive_rate_limit(view_func):
    """
    Rate limit para endpoints sensibles.
    Límite: 10 requests por minuto.
    """
    return rate_limit('sensitive_ratelimit', limit=10, period=60)(view_func)


def password_reset_rate_limit(view_func):
    """
    Rate limit para endpoints de reset de contraseña.
    Límite: 3 intentos por hora.
    """
    return rate_limit('password_reset_ratelimit', limit=3, period=3600)(view_func)


def registration_rate_limit(view_func):
    """
    Rate limit para endpoints de registro.
    Límite: 3 registros por hora.
    """
    return rate_limit('registration_ratelimit', limit=3, period=3600)(view_func)


def data_export_rate_limit(view_func):
    """
    Rate limit para endpoints de exportación de datos.
    Límite: 5 exportaciones por hora.
    """
    return rate_limit('data_export_ratelimit', limit=5, period=3600)(view_func)


# Decorador para ViewSets de DRF
class RateLimitMixin:
    """
    Mixin para aplicar rate limiting a ViewSets de DRF.

    Usage:
        class MyViewSet(RateLimitMixin, viewsets.ModelViewSet):
            rate_limit_key = 'my_viewset'
            rate_limit_limit = 50
            rate_limit_period = 60
    """
    rate_limit_key = 'api'
    rate_limit_limit = 100
    rate_limit_period = 60

    def dispatch(self, request, *args, **kwargs):
        ip = get_client_ip(request)
        cache_key = f'{self.rate_limit_key}_ratelimit_{ip}'

        current_requests = cache.get(cache_key, 0)

        if current_requests >= self.rate_limit_limit:
            logger.warning(
                f"Rate limit exceeded for ViewSet",
                extra={
                    'ip': ip,
                    'viewset': self.__class__.__name__,
                    'limit': self.rate_limit_limit,
                    'period': self.rate_limit_period,
                }
            )
            return JsonResponse({
                'error': 'Límite de solicitudes excedido.',
                'retry_after': self.rate_limit_period
            }, status=429)

        cache.set(cache_key, current_requests + 1, self.rate_limit_period)

        return super().dispatch(request, *args, **kwargs)
