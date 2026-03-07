"""
Utilidades de impersonación — Soporte para superadmins viendo como otro usuario.

Cuando un superadmin impersona a un usuario desde Admin Global, el JWT sigue
siendo del superadmin. Los endpoints de portal (mi-empresa, mi-portal) necesitan
saber cuál es el usuario "efectivo" para devolver los datos correctos.

Seguridad:
- Solo superusers pueden impersonar
- El usuario target debe existir, estar activo y no eliminado
- Se valida en cada request (sin cache)
"""
import logging
from django.contrib.auth import get_user_model

logger = logging.getLogger('apps')

IMPERSONATION_HEADER = 'HTTP_X_IMPERSONATED_USER_ID'


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
            'cargo', 'cargo__area', 'proveedor', 'cliente'
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
