"""
Signals para sincronización User <-> TenantUser.

Cuando se crea/actualiza un User en una BD de tenant,
se sincroniza automáticamente con TenantUser en la BD master.
"""
import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth.hashers import make_password

logger = logging.getLogger(__name__)


def sync_user_to_tenant_user(user_instance, tenant_code=None):
    """
    Sincroniza un User de Django con TenantUser en BD master.

    Esta función se puede llamar manualmente o desde signals.
    """
    from apps.tenant.models import TenantUser, Tenant, TenantUserAccess

    try:
        # Obtener o crear TenantUser
        tenant_user, created = TenantUser.objects.using('default').get_or_create(
            email=user_instance.email,
            defaults={
                'first_name': user_instance.first_name or '',
                'last_name': user_instance.last_name or '',
                'password': user_instance.password,  # Ya hasheado
                'is_active': user_instance.is_active,
                'is_superadmin': user_instance.is_superuser,
            }
        )

        if not created:
            # Actualizar datos si ya existe
            tenant_user.first_name = user_instance.first_name or tenant_user.first_name
            tenant_user.last_name = user_instance.last_name or tenant_user.last_name
            tenant_user.is_active = user_instance.is_active
            # No sobrescribir password si el User no tiene uno nuevo
            if user_instance.password and not user_instance.password.startswith('!'):
                tenant_user.password = user_instance.password
            tenant_user.save(using='default')

        # Si se especifica tenant_code, crear acceso
        if tenant_code:
            try:
                tenant = Tenant.objects.using('default').get(code=tenant_code)
                TenantUserAccess.objects.using('default').get_or_create(
                    tenant_user=tenant_user,
                    tenant=tenant,
                    defaults={
                        'role': 'admin' if user_instance.is_superuser else 'user',
                        'is_active': True,
                    }
                )
            except Tenant.DoesNotExist:
                logger.warning(f"Tenant {tenant_code} no encontrado para sincronizar usuario")

        action = 'creado' if created else 'actualizado'
        logger.info(f"TenantUser {action}: {user_instance.email}")
        return tenant_user, created

    except Exception as e:
        logger.error(f"Error sincronizando usuario {user_instance.email}: {e}")
        return None, False


def sync_tenant_user_to_user(tenant_user_instance, db_alias):
    """
    Sincroniza un TenantUser con User en una BD de tenant específica.

    Args:
        tenant_user_instance: Instancia de TenantUser
        db_alias: Alias de la BD del tenant (ej: 'demo')
    """
    from apps.core.models import User

    try:
        # Buscar o crear User en la BD del tenant
        user, created = User.objects.using(db_alias).get_or_create(
            email=tenant_user_instance.email,
            defaults={
                'username': tenant_user_instance.email,
                'first_name': tenant_user_instance.first_name,
                'last_name': tenant_user_instance.last_name,
                'password': tenant_user_instance.password,
                'is_active': tenant_user_instance.is_active,
                'is_superuser': tenant_user_instance.is_superadmin,
                'is_staff': tenant_user_instance.is_superadmin,
            }
        )

        if not created:
            user.first_name = tenant_user_instance.first_name
            user.last_name = tenant_user_instance.last_name
            user.password = tenant_user_instance.password
            user.is_active = tenant_user_instance.is_active
            user.is_superuser = tenant_user_instance.is_superadmin
            user.is_staff = tenant_user_instance.is_superadmin
            user.save(using=db_alias)

        action = 'creado' if created else 'actualizado'
        logger.info(f"User {action} en {db_alias}: {tenant_user_instance.email}")
        return user, created

    except Exception as e:
        logger.error(f"Error sincronizando TenantUser a User: {e}")
        return None, False
