"""
Vistas relacionadas con seguridad.
"""
from django.http import JsonResponse


def ratelimit_error_view(request, exception=None):
    """
    Vista personalizada para errores de rate limiting.
    """
    return JsonResponse({
        'error': 'Límite de solicitudes excedido',
        'message': 'Ha excedido el número máximo de solicitudes permitidas. Por favor, intente más tarde.',
        'status': 429
    }, status=429)


def csrf_failure_view(request, reason=""):
    """
    Vista personalizada para errores de CSRF.
    """
    return JsonResponse({
        'error': 'Error de validación CSRF',
        'message': 'La solicitud fue rechazada por razones de seguridad.',
        'status': 403
    }, status=403)


def permission_denied_view(request, exception=None):
    """
    Vista personalizada para errores 403 (Permission Denied).
    """
    return JsonResponse({
        'error': 'Acceso denegado',
        'message': 'No tiene permisos para acceder a este recurso.',
        'status': 403
    }, status=403)


def bad_request_view(request, exception=None):
    """
    Vista personalizada para errores 400 (Bad Request).
    """
    return JsonResponse({
        'error': 'Solicitud inválida',
        'message': 'La solicitud no pudo ser procesada.',
        'status': 400
    }, status=400)
