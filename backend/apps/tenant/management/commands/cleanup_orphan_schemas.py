"""
Comando para detectar y limpiar inconsistencias tenant row ↔ schema.

Wrapper CLI sobre TenantLifecycleService.list_inconsistencies() y
delete_tenant_with_schema(). Detecta 3 tipos de inconsistencias:
- row_orphan: Tenant row sin schema físico
- schema_orphan: Schema físico sin Tenant row
- empty_schema: Ambos existen pero 0 tablas migradas

Opcionalmente limpia tenants con schema_status='failed' (--include-failed).

Uso:
    python manage.py cleanup_orphan_schemas                        # Dry-run
    python manage.py cleanup_orphan_schemas --confirm              # Ejecutar
    python manage.py cleanup_orphan_schemas --schema tenant_viejo  # Filtrar
    python manage.py cleanup_orphan_schemas --include-failed       # + failed
    python manage.py cleanup_orphan_schemas --confirm --force      # Sin prompt
"""
import logging
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Detecta y limpia inconsistencias tenant row ↔ schema PostgreSQL'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            default=False,
            help='Ejecutar la limpieza (sin esto, solo lista inconsistencias)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            default=False,
            help='No pedir confirmación interactiva (requiere --confirm)',
        )
        parser.add_argument(
            '--schema',
            type=str,
            default=None,
            help='Filtrar a un schema específico (ej: --schema tenant_viejo)',
        )
        parser.add_argument(
            '--include-failed',
            action='store_true',
            default=False,
            help='También incluir tenants con schema_status=failed',
        )

    def handle(self, *args, **options):
        confirm = options['confirm']
        force = options['force']
        schema_filter = options.get('schema')
        include_failed = options['include_failed']

        from apps.tenant.services import (
            TenantLifecycleService,
            TenantLifecycleError,
        )

        self.stdout.write(self.style.MIGRATE_HEADING(
            '=== Auditoría de Integridad Tenant ↔ Schema ==='
        ))
        self.stdout.write('')

        # ── 1. Detectar inconsistencias via el servicio ──────────────
        report = TenantLifecycleService.list_inconsistencies()
        to_clean = list(report.inconsistencies)

        self.stdout.write(f'Tenants registrados:       {report.total_tenants}')
        self.stdout.write(f'Schemas físicos (no-reservados): {report.total_schemas}')
        self.stdout.write(f'Inconsistencias detectadas: {len(to_clean)}')

        # ── 2. --include-failed: agregar failed tenants consistentes ─
        # El servicio no sabe de schema_status (SRP). Failed tenants
        # consistentes son caso legítimo donde el operador sabe que el
        # tenant está roto aunque el invariante row↔schema se cumpla.
        if include_failed:
            from django_tenants.utils import get_tenant_model, schema_context
            Tenant = get_tenant_model()
            with schema_context("public"):
                failed_tenants = Tenant.objects.filter(schema_status='failed')
                added_failed = 0
                for tenant in failed_tenants:
                    # Dedup: no agregar si ya está en la lista
                    if any(s.schema_name == tenant.schema_name for s in to_clean):
                        continue
                    status = TenantLifecycleService.validate_invariant(
                        tenant.schema_name,
                    )
                    to_clean.append(status)
                    added_failed += 1
                if added_failed:
                    self.stdout.write(
                        f'Failed tenants agregados:  {added_failed}'
                    )

        # ── 3. Filtrar por --schema si se pidió ──────────────────────
        if schema_filter:
            to_clean = [
                s for s in to_clean if s.schema_name == schema_filter
            ]
            if not to_clean:
                raise CommandError(
                    f"No se encontró inconsistencia para schema '{schema_filter}'. "
                    f"Listá todas las inconsistencias corriendo el command sin --schema."
                )

        # ── 4. Mostrar detalle ───────────────────────────────────────
        if not to_clean:
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS(
                'No hay inconsistencias que limpiar.'
            ))
            return

        self.stdout.write('')
        self.stdout.write('Items a limpiar:')
        for status in to_clean:
            inc_type = status.inconsistency_type or 'failed_consistent'
            self.stdout.write(
                f'  - {status.schema_name}: {inc_type} '
                f'(row={status.row_exists}, schema={status.schema_exists}, '
                f'tables={status.schema_has_tables})'
            )

        # ── 5. Dry-run: mostrar y salir ──────────────────────────────
        if not confirm:
            self.stdout.write('')
            self.stdout.write(self.style.NOTICE(
                'Modo DRY-RUN: No se realizaron cambios.\n'
                'Ejecuta con --confirm para aplicar la limpieza.'
            ))
            return

        # ── 6. Prompt de confirmación (salvo --force) ────────────────
        if not force:
            self.stdout.write('')
            resp = input(
                f'Limpiar {len(to_clean)} inconsistencia(s)? (yes/no): '
            ).strip()
            if resp.lower() != 'yes':
                self.stdout.write(self.style.WARNING('Operación cancelada.'))
                return

        # ── 7. Ejecutar limpieza via el servicio ─────────────────────
        self.stdout.write('')
        self.stdout.write(self.style.MIGRATE_HEADING('Ejecutando limpieza...'))

        cleaned = 0
        errors = 0
        for status in to_clean:
            try:
                TenantLifecycleService.delete_tenant_with_schema(
                    schema_name=status.schema_name,
                    confirmation_token=(
                        TenantLifecycleService.CONFIRMATION_TOKEN_TEMPLATE
                        .format(schema_name=status.schema_name)
                    ),
                    deleted_by_user_id=None,
                )
                self.stdout.write(self.style.SUCCESS(
                    f'  - {status.schema_name}: limpiado'
                ))
                cleaned += 1
            except TenantLifecycleError as e:
                self.stdout.write(self.style.ERROR(
                    f'  - {status.schema_name}: ERROR {e}'
                ))
                errors += 1

        self.stdout.write('')
        self.stdout.write(
            f'Resultado: {cleaned} limpiados, {errors} errores.'
        )
        if errors == 0:
            self.stdout.write(self.style.SUCCESS('Limpieza completada.'))
        else:
            self.stdout.write(self.style.WARNING(
                'Limpieza parcial. Revisar errores arriba.'
            ))
