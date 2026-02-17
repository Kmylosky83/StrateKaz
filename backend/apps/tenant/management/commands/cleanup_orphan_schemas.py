"""
Comando para limpiar schemas huérfanos de PostgreSQL.

Detecta y elimina schemas con prefijo 'tenant_' que no tienen
un registro correspondiente en la tabla tenant_tenant.

Uso:
    python manage.py cleanup_orphan_schemas          # Dry-run (solo lista)
    python manage.py cleanup_orphan_schemas --confirm  # Ejecuta la limpieza
"""
import logging
from django.core.management.base import BaseCommand
from django.db import connection

from apps.tenant.models import Tenant, Domain

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Detecta y elimina schemas PostgreSQL huérfanos (sin registro de Tenant)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            default=False,
            help='Ejecutar la limpieza (sin esto, solo lista los huérfanos)',
        )
        parser.add_argument(
            '--include-failed',
            action='store_true',
            default=False,
            help='También limpiar tenants con schema_status=failed',
        )

    def handle(self, *args, **options):
        confirm = options['confirm']
        include_failed = options['include_failed']

        self.stdout.write(self.style.MIGRATE_HEADING('=== Limpieza de Schemas Huérfanos ==='))
        self.stdout.write('')

        # 1. Obtener schemas existentes con prefijo tenant_
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT schema_name
                FROM information_schema.schemata
                WHERE schema_name LIKE 'tenant_%%'
                ORDER BY schema_name
            """)
            db_schemas = {row[0] for row in cursor.fetchall()}

        # 2. Obtener schemas registrados en tenant_tenant
        registered_schemas = set(
            Tenant.objects.values_list('schema_name', flat=True)
        )

        # 3. Detectar huérfanos
        orphan_schemas = db_schemas - registered_schemas

        self.stdout.write(f'Schemas en PostgreSQL con prefijo tenant_: {len(db_schemas)}')
        self.stdout.write(f'Tenants registrados: {len(registered_schemas)}')
        self.stdout.write(f'Schemas huérfanos detectados: {len(orphan_schemas)}')
        self.stdout.write('')

        if orphan_schemas:
            self.stdout.write(self.style.WARNING('Schemas huérfanos (sin registro de Tenant):'))
            for schema in sorted(orphan_schemas):
                # Contar tablas en el schema
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT COUNT(*)
                        FROM information_schema.tables
                        WHERE table_schema = %s
                    """, [schema])
                    table_count = cursor.fetchone()[0]
                self.stdout.write(f'  - {schema} ({table_count} tablas)')

        # 4. Detectar registros de Tenant sin schema
        orphan_tenants = []
        for tenant in Tenant.objects.all():
            if tenant.schema_name not in db_schemas and tenant.schema_name != 'public':
                orphan_tenants.append(tenant)

        if orphan_tenants:
            self.stdout.write('')
            self.stdout.write(self.style.WARNING('Tenants registrados sin schema en PostgreSQL:'))
            for tenant in orphan_tenants:
                self.stdout.write(
                    f'  - ID={tenant.id} code={tenant.code} '
                    f'schema={tenant.schema_name} status={tenant.schema_status}'
                )

        # 5. Detectar tenants con status failed (opcional)
        failed_tenants = []
        if include_failed:
            failed_tenants = list(
                Tenant.objects.filter(schema_status='failed')
                .exclude(id__in=[t.id for t in orphan_tenants])
            )
            if failed_tenants:
                self.stdout.write('')
                self.stdout.write(self.style.WARNING('Tenants con schema_status=failed:'))
                for tenant in failed_tenants:
                    self.stdout.write(
                        f'  - ID={tenant.id} code={tenant.code} '
                        f'error={tenant.schema_error[:80] if tenant.schema_error else "N/A"}'
                    )

        # 6. Resumen
        total_to_clean = len(orphan_schemas) + len(orphan_tenants) + len(failed_tenants)
        if total_to_clean == 0:
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('No se encontraron datos huérfanos.'))
            return

        self.stdout.write('')
        if not confirm:
            self.stdout.write(self.style.NOTICE(
                'Modo DRY-RUN: No se realizaron cambios.\n'
                'Ejecuta con --confirm para aplicar la limpieza.'
            ))
            return

        # 7. Ejecutar limpieza
        self.stdout.write(self.style.MIGRATE_HEADING('Ejecutando limpieza...'))

        # 7a. Eliminar schemas huérfanos
        from psycopg2 import sql
        for schema in sorted(orphan_schemas):
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        sql.SQL('DROP SCHEMA IF EXISTS {} CASCADE').format(
                            sql.Identifier(schema)
                        )
                    )
                self.stdout.write(self.style.SUCCESS(f'  DROP SCHEMA {schema} CASCADE'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Error eliminando {schema}: {e}'))

        # 7b. Eliminar registros de Tenant sin schema
        for tenant in orphan_tenants:
            try:
                tenant_name = tenant.name
                Domain.objects.filter(tenant=tenant).delete()
                tenant.delete()
                self.stdout.write(self.style.SUCCESS(
                    f'  DELETE Tenant ID={tenant.id} ({tenant_name})'
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'  Error eliminando Tenant ID={tenant.id}: {e}'
                ))

        # 7c. Limpiar tenants con status failed
        for tenant in failed_tenants:
            try:
                schema = tenant.schema_name
                tenant_name = tenant.name
                Domain.objects.filter(tenant=tenant).delete()
                with connection.cursor() as cursor:
                    cursor.execute(
                        sql.SQL('DROP SCHEMA IF EXISTS {} CASCADE').format(
                            sql.Identifier(schema)
                        )
                    )
                tenant.delete()
                self.stdout.write(self.style.SUCCESS(
                    f'  CLEANUP failed Tenant ID={tenant.id} ({tenant_name})'
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'  Error limpiando Tenant ID={tenant.id}: {e}'
                ))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Limpieza completada.'))
