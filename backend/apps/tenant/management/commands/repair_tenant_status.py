"""
Comando para reparar el schema_status de tenants.

Compara schema_status con el estado real del schema en PostgreSQL
(via TenantLifecycleService) y corrige discrepancias.

NO crea ni borra schemas. Solo actualiza schema_status y schema_error.

Uso:
    python manage.py repair_tenant_status            # Dry-run
    python manage.py repair_tenant_status --confirm  # Aplicar correcciones
    python manage.py repair_tenant_status --all      # Incluir tenants ready
"""
import logging
from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Verifica y repara schema_status de tenants basado en el estado real de PostgreSQL'

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

        from apps.tenant.models import Tenant
        from apps.tenant.services import TenantLifecycleService

        self.stdout.write(self.style.MIGRATE_HEADING(
            '=== Reparación de Estado de Tenants ==='
        ))
        self.stdout.write('')

        # ── Umbral dinámico: 90% de tablas de un tenant ready ────────
        expected_table_count = self._get_reference_table_count(
            Tenant, TenantLifecycleService,
        )
        threshold = int(expected_table_count * 0.9)

        # ── Tenants a verificar ──────────────────────────────────────
        with schema_context("public"):
            if check_all:
                tenants = Tenant.objects.exclude(schema_name='public')
            else:
                tenants = Tenant.objects.exclude(
                    schema_name='public',
                ).exclude(schema_status='ready')

        if not tenants.exists():
            self.stdout.write(self.style.SUCCESS(
                'Todos los tenants tienen status correcto.'
            ))
            return

        # ── Diagnosticar cada tenant ─────────────────────────────────
        repairs = []

        for tenant in tenants:
            status = TenantLifecycleService.validate_invariant(
                tenant.schema_name,
            )

            current_status = tenant.schema_status

            if not status.schema_exists:
                correct_status = 'failed'
                reason = 'Schema no existe en PostgreSQL'
                table_count = 0
            elif status.schema_has_tables:
                # Refinamiento: conteo exacto via servicio centralizado
                table_count = TenantLifecycleService.count_schema_tables(
                    tenant.schema_name,
                )
                if table_count >= threshold:
                    correct_status = 'ready'
                    reason = (
                        f'Schema completo ({table_count}/{expected_table_count} tablas)'
                    )
                else:
                    correct_status = 'failed'
                    reason = (
                        f'Schema incompleto ({table_count}/{expected_table_count} '
                        f'tablas, mínimo {threshold})'
                    )
            else:
                correct_status = 'failed'
                reason = 'Schema existe pero sin tablas'
                table_count = 0

            if current_status != correct_status:
                repairs.append({
                    'tenant': tenant,
                    'current_status': current_status,
                    'correct_status': correct_status,
                    'table_count': table_count,
                    'reason': reason,
                })
                status_color = (
                    self.style.WARNING if correct_status == 'failed'
                    else self.style.SUCCESS
                )
                self.stdout.write(
                    f'  Tenant: {tenant.name} (ID={tenant.id})\n'
                    f'    Schema: {tenant.schema_name}\n'
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
            self.stdout.write(self.style.SUCCESS(
                'No se requieren reparaciones.'
            ))
            return

        self.stdout.write(f'Reparaciones necesarias: {len(repairs)}')

        if not confirm:
            self.stdout.write(self.style.NOTICE(
                '\nModo DRY-RUN: No se realizaron cambios.\n'
                'Ejecuta con --confirm para aplicar las correcciones.'
            ))
            return

        # ── Aplicar reparaciones ─────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING(
            '\nAplicando reparaciones...'
        ))

        for repair in repairs:
            tenant = repair['tenant']
            try:
                with schema_context("public"):
                    tenant.schema_status = repair['correct_status']
                    if repair['correct_status'] == 'failed':
                        tenant.schema_error = repair['reason']
                    else:
                        tenant.schema_error = ''
                    tenant.save(
                        update_fields=['schema_status', 'schema_error'],
                    )
                self.stdout.write(self.style.SUCCESS(
                    f'  {tenant.name}: '
                    f'{repair["current_status"]} -> {repair["correct_status"]}'
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'  Error reparando {tenant.name}: {e}'
                ))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Reparación completada.'))

    def _get_reference_table_count(self, Tenant, service):
        """
        Conteo de tablas de un tenant 'ready' como referencia para umbral.
        Usa count_schema_tables del servicio (fuente única de verdad).
        Fallback a 600 si no hay tenant de referencia.
        """
        FALLBACK = 600

        with schema_context("public"):
            ready_tenant = Tenant.objects.filter(
                schema_status='ready',
            ).exclude(schema_name='public').first()

        if ready_tenant:
            count = service.count_schema_tables(ready_tenant.schema_name)
            self.stdout.write(
                f'  Referencia: {ready_tenant.name} ({count} tablas)\n'
            )
            return count

        self.stdout.write(
            f'  Sin tenant de referencia, usando fallback: {FALLBACK} tablas\n'
        )
        return FALLBACK
