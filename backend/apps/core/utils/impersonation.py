"""
Utilidades de impersonación — Soporte para superadmins viendo como otro usuario.

Cuando un superadmin impersona a un usuario desde Admin Global, el JWT sigue
siendo del superadmin. Los endpoints de portal (mi-empresa, mi-portal) necesitan
saber cuál es el usuario "efectivo" para devolver los datos correctos.

Seguridad:
- Solo superusers pueden impersonar
- El usuario target debe existir, estar activo y no eliminado
- Se valida en cada request (sin cache)
- Acciones destructivas bloqueadas durante impersonación
"""
import logging
from functools import wraps

from django.contrib.auth import get_user_model
from rest_framework import status as drf_status
from rest_framework.response import Response

logger = logging.getLogger('apps')
security_logger = logging.getLogger('security')

IMPERSONATION_HEADER = 'HTTP_X_IMPERSONATED_USER_ID'


def is_impersonating(request):
    """
    Verifica si la request actual es una sesión de impersonación válida.

    Returns:
        bool: True si un superadmin está impersonando a otro usuario.
    """
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        return False

    impersonated_id = request.META.get(IMPERSONATION_HEADER)
    if not impersonated_id:
        return False

    return request.user.is_superuser


def get_impersonation_context(request):
    """
    Retorna contexto de impersonación para audit logging.

    Returns:
        dict: {'impersonated_by': superadmin_id, 'target_user_id': id}
              o dict vacío si no es impersonación.
    """
    if not is_impersonating(request):
        return {}

    impersonated_id = request.META.get(IMPERSONATION_HEADER)
    try:
        target_id = int(impersonated_id)
    except (ValueError, TypeError):
        return {}

    return {
        'impersonated_by': request.user.id,
        'impersonated_by_username': request.user.username,
        'target_user_id': target_id,
    }


def get_effective_user(request):
    """
    Retorna el usuario efectivo para la request.

    Si el request incluye el header X-Impersonated-User-ID y el usuario
    autenticado es superuser, retorna el usuario impersonado.
    En cualquier otro caso, retorna request.user.

    Returns:
        User: El usuario efectivo (impersonado o real)
    """
    impersonated_id = request.META.get(IMPERSONATION_HEADER)

    if not impersonated_id or not request.user.is_superuser:
        return request.user

    try:
        User = get_user_model()
        target_user = User.objects.select_related(
            'cargo', 'cargo__area'
        ).get(
            pk=int(impersonated_id),
            is_active=True,
            deleted_at__isnull=True,
        )
        return target_user
    except (User.DoesNotExist, ValueError, TypeError):
        logger.warning(
            f'Impersonation failed: user_id={impersonated_id} '
            f'requested by {request.user.username}'
        )
        return request.user


def block_during_impersonation(message=None):
    """
    Decorator para bloquear acciones destructivas durante impersonación.

    Uso en ViewSet actions:
        @action(detail=True, methods=['post'])
        @block_during_impersonation("No se puede cambiar la contraseña durante impersonación")
        def change_password(self, request, pk=None):
            ...

    Uso en APIView methods:
        @block_during_impersonation("No se puede deshabilitar 2FA durante impersonación")
        def post(self, request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            if is_impersonating(request):
                msg = message or (
                    'Esta acción no está permitida durante impersonación'
                )
                security_logger.warning(
                    f"IMPERSONATION_BLOCKED: action='{func.__name__}' "
                    f"superadmin='{request.user.username}' (ID:{request.user.id}) "
                    f"target_header='{request.META.get(IMPERSONATION_HEADER)}' "
                    f"endpoint='{request.path}'"
                )
                return Response(
                    {'error': msg},
                    status=drf_status.HTTP_403_FORBIDDEN,
                )
            return func(self, request, *args, **kwargs)
        return wrapper
    return decorator
