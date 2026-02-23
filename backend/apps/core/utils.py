"""
Utilidades del modulo Core.

Funciones auxiliares para sincronizacion User <-> TenantUser,
manejo de passwords, etc.
"""
import logging

logger = logging.getLogger(__name__)


def sync_password_to_tenant_user(user):
    """
    Sincroniza el password hasheado del User (tenant schema) al TenantUser (public schema).

    Esto es necesario porque:
    - El login se realiza via TenantUser.check_password() en el schema public
    - Cuando un User cambia su password (setup-password, change-password),
      el TenantUser debe actualizarse para que el login funcione

    Args:
        user: Instancia de User con password ya actualizado (set_password ya llamado)

    Returns:
        bool: True si se sincronizo exitosamente, False en caso de error
    """
    if not user or not user.email:
        return False

    try:
        from django_tenants.utils import schema_context

        with schema_context('public'):
            from apps.tenant.models import TenantUser

            try:
                tenant_user = TenantUser.objects.get(
                    email=user.email.lower().strip()
                )
                tenant_user.password = user.password  # Password ya hasheado
                tenant_user.save(update_fields=['password'])

                logger.info(
                    'Password sincronizado: User %s -> TenantUser #%s (%s)',
                    user.id, tenant_user.id, user.email
                )
                return True

            except TenantUser.DoesNotExist:
                logger.warning(
                    'TenantUser no encontrado para User %s (%s). '
                    'No se pudo sincronizar password.',
                    user.id, user.email
                )
                return False

    except Exception as e:
        logger.error(
            'Error sincronizando password de User %s (%s) a TenantUser: %s',
            user.id, user.email, e,
            exc_info=True
        )
        return False
