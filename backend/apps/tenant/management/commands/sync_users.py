"""
Comando para sincronizar usuarios entre User y TenantUser.

Uso:
    # Sincronizar Users de un tenant a TenantUser (BD master)
    python manage.py sync_users --from-tenant=demo

    # Sincronizar TenantUser a User en un tenant
    python manage.py sync_users --to-tenant=demo

    # Sincronizar en ambas direcciones
    python manage.py sync_users --bidirectional --tenant=demo
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import connections

from apps.tenant.models import Tenant, TenantUser, TenantUserAccess
from apps.tenant.signals import sync_user_to_tenant_user, sync_tenant_user_to_user


class Command(BaseCommand):
    help = 'Sincroniza usuarios entre User (tenant BD) y TenantUser (master BD)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--from-tenant',
            type=str,
            help='Sincronizar Users del tenant hacia TenantUser'
        )
        parser.add_argument(
            '--to-tenant',
            type=str,
            help='Sincronizar TenantUsers hacia User del tenant'
        )
        parser.add_argument(
            '--tenant',
            type=str,
            help='Tenant para sincronizacion bidireccional'
        )
        parser.add_argument(
            '--bidirectional',
            action='store_true',
            help='Sincronizar en ambas direcciones'
        )

    def handle(self, *args, **options):
        from_tenant = options.get('from_tenant')
        to_tenant = options.get('to_tenant')
        tenant_code = options.get('tenant')
        bidirectional = options.get('bidirectional')

        if bidirectional and not tenant_code:
            raise CommandError('--bidirectional requiere --tenant=CODE')

        if bidirectional:
            self.sync_from_tenant(tenant_code)
            self.sync_to_tenant(tenant_code)
        elif from_tenant:
            self.sync_from_tenant(from_tenant)
        elif to_tenant:
            self.sync_to_tenant(to_tenant)
        else:
            raise CommandError(
                'Especifique --from-tenant, --to-tenant, o --bidirectional con --tenant'
            )

        self.stdout.write(self.style.SUCCESS('Sincronizacion completada'))

    def sync_from_tenant(self, tenant_code):
        """Sincroniza Users del tenant hacia TenantUser"""
        self.stdout.write(f'\n=== Sincronizando Users de {tenant_code} a TenantUser ===')

        # Obtener tenant
        try:
            tenant = Tenant.objects.get(code=tenant_code)
        except Tenant.DoesNotExist:
            raise CommandError(f'Tenant {tenant_code} no encontrado')

        # Configurar conexion al tenant
        db_config = tenant.get_database_config()
        connections.databases[tenant_code] = db_config

        try:
            # Importar User model
            from apps.core.models import User

            # Obtener usuarios del tenant
            users = User.objects.using(tenant_code).all()
            self.stdout.write(f'Encontrados {users.count()} usuarios en {tenant_code}')

            created_count = 0
            updated_count = 0
            error_count = 0

            for user in users:
                try:
                    tenant_user, created = sync_user_to_tenant_user(user, tenant_code)
                    if tenant_user:
                        if created:
                            created_count += 1
                        else:
                            updated_count += 1
                    else:
                        error_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Error con {user.email}: {e}')
                    )
                    error_count += 1

            self.stdout.write(
                f'Resultado: {created_count} creados, {updated_count} actualizados, '
                f'{error_count} errores'
            )

        finally:
            # Limpiar conexion
            if tenant_code in connections.databases:
                del connections.databases[tenant_code]

    def sync_to_tenant(self, tenant_code):
        """Sincroniza TenantUsers hacia User del tenant"""
        self.stdout.write(f'\n=== Sincronizando TenantUser a Users de {tenant_code} ===')

        # Obtener tenant
        try:
            tenant = Tenant.objects.get(code=tenant_code)
        except Tenant.DoesNotExist:
            raise CommandError(f'Tenant {tenant_code} no encontrado')

        # Configurar conexion al tenant
        db_config = tenant.get_database_config()
        connections.databases[tenant_code] = db_config

        try:
            # Obtener TenantUsers con acceso a este tenant
            accesses = TenantUserAccess.objects.filter(
                tenant=tenant,
                is_active=True
            ).select_related('tenant_user')

            self.stdout.write(
                f'Encontrados {accesses.count()} usuarios con acceso a {tenant_code}'
            )

            created_count = 0
            updated_count = 0
            error_count = 0

            for access in accesses:
                tenant_user = access.tenant_user
                try:
                    user, created = sync_tenant_user_to_user(tenant_user, tenant_code)
                    if user:
                        if created:
                            created_count += 1
                        else:
                            updated_count += 1
                    else:
                        error_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Error con {tenant_user.email}: {e}')
                    )
                    error_count += 1

            self.stdout.write(
                f'Resultado: {created_count} creados, {updated_count} actualizados, '
                f'{error_count} errores'
            )

        finally:
            # Limpiar conexion
            if tenant_code in connections.databases:
                del connections.databases[tenant_code]
