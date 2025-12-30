"""
Middleware de seguridad personalizado para detectar y prevenir ataques.
"""
import logging
import re
from django.core.cache import cache
from django.http import JsonResponse
from django.conf import settings

logger = logging.getLogger('django.security')

class SecurityMiddleware:
    """
    Middleware personalizado para:
    - Detectar patrones de SQL injection
    - Log de intentos de acceso no autorizado
    - Throttling por IP
    """

    # Patrones de SQL injection comunes
    SQL_INJECTION_PATTERNS = [
        r"(\bunion\b.*\bselect\b)",
        r"(\bor\b.*=.*)",
        r"(\band\b.*=.*)",
        r"(--)",
        r"(;.*drop\b)",
        r"(;.*delete\b)",
        r"(;.*update\b)",
        r"(;.*insert\b)",
        r"(\bexec\b.*\()",
        r"(\bexecute\b.*\()",
        r"('.*or.*'.*=.*')",
        r"(\".*or.*\".*=.*\")",
    ]

    # Patrones de XSS
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"onerror\s*=",
        r"onload\s*=",
    ]

    def __init__(self, get_response):
        self.get_response = get_response
        self.sql_regex = [re.compile(pattern, re.IGNORECASE) for pattern in self.SQL_INJECTION_PATTERNS]
        self.xss_regex = [re.compile(pattern, re.IGNORECASE) for pattern in self.XSS_PATTERNS]

    def __call__(self, request):
        # Obtener IP del cliente
        ip = self.get_client_ip(request)

        # Verificar throttling por IP
        if self.is_ip_throttled(ip):
            logger.warning(
                f"IP throttled: {ip}",
                extra={
                    'ip': ip,
                    'path': request.path,
                    'method': request.method,
                }
            )
            return JsonResponse({
                'error': 'Demasiadas solicitudes. Por favor, intente más tarde.'
            }, status=429)

        # Detectar SQL injection en parámetros GET
        if self.detect_sql_injection(request.GET):
            self.log_security_event(request, ip, 'SQL_INJECTION_ATTEMPT', 'GET parameters')
            return JsonResponse({
                'error': 'Solicitud inválida detectada.'
            }, status=400)

        # Detectar SQL injection en parámetros POST
        if request.method == 'POST' and hasattr(request, 'POST'):
            if self.detect_sql_injection(request.POST):
                self.log_security_event(request, ip, 'SQL_INJECTION_ATTEMPT', 'POST parameters')
                return JsonResponse({
                    'error': 'Solicitud inválida detectada.'
                }, status=400)

        response = self.get_response(request)

        # Log de accesos no autorizados
        if response.status_code in [401, 403]:
            self.log_security_event(request, ip, 'UNAUTHORIZED_ACCESS', f'Status: {response.status_code}')

        return response

    def get_client_ip(self, request):
        """Obtener IP real del cliente considerando proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def is_ip_throttled(self, ip):
        """
        Verificar si la IP ha excedido el límite de requests.
        Límite: 200 requests por minuto por IP.
        """
        cache_key = f'throttle_ip_{ip}'
        requests = cache.get(cache_key, 0)

        if requests >= 200:
            return True

        cache.set(cache_key, requests + 1, 60)  # 60 segundos
        return False

    def detect_sql_injection(self, params):
        """Detectar patrones de SQL injection en parámetros."""
        for key, value in params.items():
            if isinstance(value, str):
                for regex in self.sql_regex:
                    if regex.search(value):
                        return True
        return False

    def detect_xss(self, params):
        """Detectar patrones de XSS en parámetros."""
        for key, value in params.items():
            if isinstance(value, str):
                for regex in self.xss_regex:
                    if regex.search(value):
                        return True
        return False

    def log_security_event(self, request, ip, event_type, details):
        """Log de eventos de seguridad."""
        logger.warning(
            f"Security event: {event_type}",
            extra={
                'event_type': event_type,
                'ip': ip,
                'path': request.path,
                'method': request.method,
                'user': request.user.username if request.user.is_authenticated else 'anonymous',
                'details': details,
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            }
        )

        # Incrementar contador de eventos de seguridad para esta IP
        cache_key = f'security_events_{ip}'
        events = cache.get(cache_key, 0)
        cache.set(cache_key, events + 1, 3600)  # 1 hora

        # Si hay más de 10 eventos de seguridad en 1 hora, bloquear IP temporalmente
        if events >= 10:
            cache.set(f'blocked_ip_{ip}', True, 3600)  # Bloquear por 1 hora
            logger.critical(
                f"IP blocked due to multiple security events: {ip}",
                extra={'ip': ip, 'events_count': events}
            )


class IPBlockMiddleware:
    """
    Middleware para bloquear IPs que han sido marcadas como sospechosas.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip = self.get_client_ip(request)

        # Verificar si la IP está bloqueada
        if cache.get(f'blocked_ip_{ip}'):
            logger.warning(
                f"Blocked IP attempted access: {ip}",
                extra={'ip': ip, 'path': request.path}
            )
            return JsonResponse({
                'error': 'Acceso denegado. Su IP ha sido bloqueada temporalmente.'
            }, status=403)

        return self.get_response(request)

    def get_client_ip(self, request):
        """Obtener IP real del cliente considerando proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
