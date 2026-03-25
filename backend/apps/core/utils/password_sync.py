"""
Sincronización de passwords User <-> TenantUser.

Cuando un User cambia su password en el schema del tenant,
el TenantUser en el schema public debe actualizarse para que
el login funcione (check_password se hace contra TenantUser).
"""
import logging
import time

logger = logging.getLogger(__name__)
security_logger = logging.getLogger('security')

# Constantes de retry para sync de password
SYNC_MAX_RETRIES = 3
SYNC_RETRY_DELAY = 0.5  # segundos entre intentos


def sync_password_to_tenant_user(user):
    """
    Sincroniza el password hasheado del User (tenant schema) al TenantUser (public schema).

    Implementa retry con 3 intentos y delay de 0.5s entre cada uno.
    Si falla después de todos los intentos, loguea ERROR de seguridad y
    lanza tarea Celery para notificar al admin del tenant.

    Args:
        user: Instancia de User con password ya actualizado (set_password ya llamado)

    Returns:
        bool: True si se sincronizó exitosamente, False en caso de error
    """
    if not user or not user.email:
        return False

    last_exception = None

    for attempt in range(1, SYNC_MAX_RETRIES + 1):
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
                        'Password sincronizado: User %s -> TenantUser #%s (%s) '
                        '(intento %d/%d)',
                        user.id, tenant_user.id, user.email,
                        attempt, SYNC_MAX_RETRIES,
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
            last_exception = e
            logger.warning(
                'Error sincronizando password de User %s (%s) a TenantUser '
                '(intento %d/%d): %s',
                user.id, user.email, attempt, SYNC_MAX_RETRIES, e,
            )
            if attempt < SYNC_MAX_RETRIES:
                time.sleep(SYNC_RETRY_DELAY)

    # Todos los intentos fallaron
    security_logger.error(
        'C11: Fallo definitivo sincronizando password de User %s (%s) '
        'a TenantUser después de %d intentos. Último error: %s',
        user.id, user.email, SYNC_MAX_RETRIES, last_exception,
        exc_info=True,
    )

    # Notificar al admin del tenant via Celery
    try:
        from apps.core.tasks import notify_admin_password_sync_failure
        notify_admin_password_sync_failure.delay(
            user_id=user.id,
            user_email=user.email,
        )
    except Exception as notify_exc:
        logger.error(
            'C11: Error lanzando tarea de notificación para fallo de sync '
            'de password (User %s): %s',
            user.id, notify_exc,
        )

    return False
