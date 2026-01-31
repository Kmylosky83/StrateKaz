"""
Comando para sincronizar bases de datos de tenants.

Crea la BD si no existe y aplica todas las migraciones.

Uso:
    python manage.py sync_tenant_db --tenant=demo
    python manage.py sync_tenant_db --all
"""
from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from django.db import connection, connections
from django.conf import settings

from apps.tenant.models import Tenant


class Command(BaseCommand):
    help = 'Sincroniza la base de datos de un tenant (crea BD y aplica migraciones)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            help='Codigo del tenant a sincronizar'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Sincronizar todos los tenants activos'
        )
        parser.add_argument(
            '--create-only',
            action='store_true',
            help='Solo crear la BD, no aplicar migraciones'
        )

    def handle(self, *args, **options):
        tenant_code = options.get('tenant')
        sync_all = options.get('all')
        create_only = options.get('create_only')

        if not tenant_code and not sync_all:
            raise CommandError('Debe especificar --tenant=CODIGO o --all')

        if sync_all:
            tenants = Tenant.objects.filter(is_active=True)
            self.stdout.write(f'Sincronizando {tenants.count()} tenants...')
        else:
            try:
                tenants = [Tenant.objects.get(code=tenant_code)]
            except Tenant.DoesNotExist:
                raise CommandError(f'Tenant "{tenant_code}" no encontrado')

        for tenant in tenants:
            self.sync_tenant(tenant, create_only)

        self.stdout.write(self.style.SUCCESS('Sincronizacion completada'))

    def sync_tenant(self, tenant, create_only=False):
        """Sincroniza un tenant individual"""
        self.stdout.write(f'\n{"="*50}')
        self.stdout.write(f'Tenant: {tenant.name} ({tenant.code})')
        self.stdout.write(f'BD: {tenant.db_name}')
        self.stdout.write(f'{"="*50}')

        # 1. Crear la BD si no existe
        self.create_database(tenant)

        if create_only:
            self.stdout.write(self.style.SUCCESS(f'BD {tenant.db_name} lista'))
            return

        # 2. Configurar conexion dinamica
        db_config = tenant.get_database_config()
        connections.databases[tenant.code] = db_config

        # 3. Aplicar migraciones (deshabilitar FK checks para MySQL)
        self.stdout.write(f'Aplicando migraciones a {tenant.db_name}...')
        try:
            # Deshabilitar FK checks para evitar errores de orden de migraciones
            tenant_conn = connections[tenant.code]
            with tenant_conn.cursor() as cursor:
                cursor.execute('SET FOREIGN_KEY_CHECKS=0')

            call_command(
                'migrate',
                database=tenant.code,
                verbosity=1,
                interactive=False
            )

            # Rehabilitar FK checks
            with tenant_conn.cursor() as cursor:
                cursor.execute('SET FOREIGN_KEY_CHECKS=1')

            self.stdout.write(self.style.SUCCESS(f'Migraciones aplicadas a {tenant.db_name}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error en migraciones: {e}'))
            raise

        # 4. Limpiar conexion
        if tenant.code in connections.databases:
            del connections.databases[tenant.code]

    def create_database(self, tenant):
        """Crea la base de datos del tenant si no existe"""
        db_name = tenant.db_name

        with connection.cursor() as cursor:
            # Verificar si existe
            cursor.execute(
                "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = %s",
                [db_name]
            )
            exists = cursor.fetchone()

            if exists:
                self.stdout.write(f'BD {db_name} ya existe')
            else:
                # Crear BD
                cursor.execute(
                    f"CREATE DATABASE `{db_name}` "
                    f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
                self.stdout.write(self.style.SUCCESS(f'BD {db_name} creada'))

        # Crear usuario dedicado si es necesario (opcional)
        # self.create_tenant_user(tenant)

    def create_tenant_user(self, tenant):
        """Crea un usuario MySQL dedicado para el tenant (opcional)"""
        # Este metodo es opcional y se puede habilitar para mayor aislamiento
        pass
