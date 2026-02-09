"""
Comando para reparar el estado de schemas de tenants.

Verifica la integridad de cada tenant comparando su schema_status
con el estado real del schema en PostgreSQL.

Uso:
    python manage.py repair_tenant_status            # Dry-run
    python manage.py repair_tenant_status --confirm  # Aplicar correcciones
"""
import logging
from django.core.management.base import BaseCommand
from django.db import connection

from apps.tenant.models import Tenant

logger = logging.getLogger(__name__)

# Número esperado de tablas en un schema completo (aproximado)
EXPECTED_TABLE_COUNT = 600


class Command(BaseCommand):
    help = 'Verifica y repara el schema_status de tenants basado en el estado real de PostgreSQL'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            default=False,
            help='Aplicar correcciones (sin esto, solo reporta)',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            default=False,
            help='Verificar todos los tenants, no solo los que tienen status != ready',
        )

    def handle(self, *args, **options):
        confirm = options['confirm']
        check_all = options['all']

        self.stdout.write(self.style.MIGRATE_HEADING('=== Reparación de Estado de Tenants ==='))
        self.stdout.write('')

        # Obtener tenants a verificar
        if check_all:
            tenants = Tenant.objects.exclude(schema_name='public')
        else:
            tenants = Tenant.objects.exclude(
                schema_name='public'
            ).exclude(
                schema_status='ready'
            )

        if not tenants.exists():
            self.stdout.write(self.style.SUCCESS('Todos los tenants tienen status correcto.'))
            return

        repairs = []

        for tenant in tenants:
            schema = tenant.schema_name

            # Verificar si el schema existe
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*)
                    FROM information_schema.schemata
                    WHERE schema_name = %s
                """, [schema])
                schema_exists = cursor.fetchone()[0] > 0

            table_count = 0
            if schema_exists:
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT COUNT(*)
                        FROM information_schema.tables
                        WHERE table_schema = %s
                    """, [schema])
                    table_count = cursor.fetchone()[0]

            # Determinar estado correcto
            current_status = tenant.schema_status

            if not schema_exists:
                correct_status = 'failed'
                reason = 'Schema no existe en PostgreSQL'
            elif table_count >= EXPECTED_TABLE_COUNT:
                correct_status = 'ready'
                reason = f'Schema completo ({table_count} tablas)'
            elif table_count > 0:
                correct_status = 'failed'
                reason = f'Schema incompleto ({table_count}/{EXPECTED_TABLE_COUNT} tablas)'
            else:
                correct_status = 'failed'
                reason = 'Schema existe pero sin tablas'

            if current_status != correct_status:
                repairs.append({
                    'tenant': tenant,
                    'current_status': current_status,
                    'correct_status': correct_status,
                    'table_count': table_count,
                    'reason': reason,
                })

                status_color = self.style.WARNING if correct_status == 'failed' else self.style.SUCCESS
                self.stdout.write(
                    f'  Tenant: {tenant.name} (ID={tenant.id})\n'
                    f'    Schema: {schema}\n'
                    f'    Status actual: {current_status}\n'
                    f'    Status correcto: {status_color(correct_status)}\n'
                    f'    Razón: {reason}\n'
                )
            else:
                self.stdout.write(
                    f'  Tenant: {tenant.name} (ID={tenant.id}) - '
                    f'Status correcto ({current_status}, {table_count} tablas)'
                )

        self.stdout.write('')

        if not repairs:
            self.stdout.write(self.style.SUCCESS('No se requieren reparaciones.'))
            return

        self.stdout.write(f'Reparaciones necesarias: {len(repairs)}')

        if not confirm:
            self.stdout.write(self.style.NOTICE(
                '\nModo DRY-RUN: No se realizaron cambios.\n'
                'Ejecuta con --confirm para aplicar las correcciones.'
            ))
            return

        # Aplicar reparaciones
        self.stdout.write(self.style.MIGRATE_HEADING('\nAplicando reparaciones...'))

        for repair in repairs:
            tenant = repair['tenant']
            try:
                tenant.schema_status = repair['correct_status']
                if repair['correct_status'] == 'failed':
                    tenant.schema_error = repair['reason']
                else:
                    tenant.schema_error = ''
                tenant.save(update_fields=['schema_status', 'schema_error'])
                self.stdout.write(self.style.SUCCESS(
                    f'  {tenant.name}: {repair["current_status"]} -> {repair["correct_status"]}'
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'  Error reparando {tenant.name}: {e}'
                ))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Reparación completada.'))
