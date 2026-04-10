"""
Management command: purge_tenant

Elimina un tenant completamente:
1. Limpia TenantUsers huérfanos (sin acceso a ningún otro tenant)
2. Delega al TenantLifecycleService: Domain + Tenant row + schema PostgreSQL

Renombrado de delete_tenant a purge_tenant para evitar colisión con el
command delete_tenant de django-tenants (que toma precedencia por Django
management command discovery).

Si el tenant no existe pero el schema sí (huérfano), redirige a
cleanup_orphan_schemas. Cada command tiene un propósito único.

PELIGRO: Esta operación es irreversible.

Uso:
  python manage.py purge_tenant --schema tenant_demo --dry-run
  python manage.py purge_tenant --schema tenant_demo --confirm
"""
import logging
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Elimina un tenant completamente (schema + registros public)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--schema',
            type=str,
            required=True,
            help='Schema name del tenant a eliminar (ej: tenant_demo)',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            default=False,
            help='Ejecutar la eliminación (sin esto es dry-run)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Mostrar qué se eliminaría sin ejecutar',
        )

    def handle(self, *args, **options):
        schema_name = options['schema']
        confirm = options['confirm']
        # H19: lógica redundante dry-run/confirm. Se preserva por scope.
        dry_run = not confirm or options['dry_run']

        from apps.tenant.models import Tenant, Domain, TenantUser, TenantUserAccess
        from apps.tenant.services import (
            TenantLifecycleService,
            TenantNotFoundError,
            SchemaDropFailedError,
            TenantInvariantViolationError,
            InvalidConfirmationTokenError,
        )

        # ── Validación inicial ───────────────────────────────────────
        if schema_name == 'public':
            raise CommandError("No se puede eliminar el schema 'public'.")

        # ── Buscar Tenant row ────────────────────────────────────────
        try:
            tenant = Tenant.objects.get(schema_name=schema_name)
        except Tenant.DoesNotExist:
            # ¿Schema huérfano? Redirigir a cleanup_orphan_schemas.
            status = TenantLifecycleService.validate_invariant(schema_name)
            if status.schema_exists:
                raise CommandError(
                    f"Tenant '{schema_name}' no existe en public.tenant_tenant, "
                    f"pero el schema PostgreSQL '{schema_name}' SÍ existe "
                    f"(schema huérfano). Para limpiar schemas huérfanos, usá:\n"
                    f"    python manage.py cleanup_orphan_schemas --schema {schema_name}"
                )
            raise CommandError(
                f"Tenant '{schema_name}' no existe (ni row ni schema)."
            )

        # ── Recopilar información para resumen ───────────────────────
        status = TenantLifecycleService.validate_invariant(schema_name)
        domains = Domain.objects.filter(tenant=tenant)
        accesses = TenantUserAccess.objects.filter(
            tenant=tenant,
        ).select_related('tenant_user')

        # TenantUsers que quedarían huérfanos (sin acceso a otro tenant)
        orphan_tus = []
        for access in accesses:
            tu = access.tenant_user
            if tu.is_superadmin:
                continue
            remaining = TenantUserAccess.objects.filter(
                tenant_user=tu,
            ).exclude(tenant=tenant).count()
            if remaining == 0:
                orphan_tus.append(tu)

        # ── Mostrar resumen ──────────────────────────────────────────
        self.stdout.write(f"\n{'=' * 70}")
        self.stdout.write(self.style.ERROR(
            "  ELIMINACIÓN COMPLETA DE TENANT"
        ))
        self.stdout.write(f"{'=' * 70}")
        self.stdout.write(f"  Tenant:  {tenant.name} (ID: {tenant.id})")
        self.stdout.write(
            f"  Schema:  {schema_name} "
            f"({'EXISTE' if status.schema_exists else 'NO EXISTE'})"
        )
        self.stdout.write(f"  Code:    {tenant.code}")
        self.stdout.write(
            f"  Estado:  {'Activo' if tenant.is_active else 'Inactivo'}"
        )
        self.stdout.write("")
        self.stdout.write(f"  Dominios:              {domains.count()}")
        for d in domains:
            self.stdout.write(
                f"    - {d.domain} {'(primary)' if d.is_primary else ''}"
            )
        self.stdout.write(f"  TenantUserAccess:      {accesses.count()}")
        self.stdout.write(f"  TenantUsers huérfanos: {len(orphan_tus)}")
        for tu in orphan_tus[:10]:
            self.stdout.write(f"    - {tu.email}")

        self.stdout.write(f"\n  Se ejecutará:")
        self.stdout.write(f"    1. DELETE TenantUsers huérfanos ({len(orphan_tus)})")
        self.stdout.write(
            f"    2. TenantLifecycleService.delete_tenant_with_schema "
            f"(Domain + Tenant + Schema)"
        )

        # ── Dry-run: mostrar y salir ─────────────────────────────────
        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"\n  [DRY RUN] Sin cambios. Usa --confirm para ejecutar."
            ))
            return

        # ── Prompt de confirmación interactivo ───────────────────────
        self.stdout.write('')
        expected = f'ELIMINAR {schema_name.upper()}'
        resp = input(
            f'ESTA ACCIÓN ES IRREVERSIBLE.\n'
            f'Escribe "{expected}" para confirmar: '
        ).strip()
        if resp != expected:
            self.stdout.write(self.style.WARNING('Operación cancelada.'))
            return

        # ── Ejecución ────────────────────────────────────────────────
        self.stdout.write('\n  Ejecutando eliminación...')

        # 1. Limpiar TenantUsers huérfanos (concern de gestión de usuarios,
        #    se ejecuta ANTES del servicio para que los accesses existan
        #    al momento de buscar huérfanos).
        if orphan_tus:
            tu_ids = [tu.id for tu in orphan_tus]
            count = TenantUser.objects.filter(
                id__in=tu_ids, is_superadmin=False,
            ).delete()[0]
            self.stdout.write(f"    - {count} TenantUser huérfanos eliminados")

        # Limpiar TenantUserAccess (antes del servicio, porque el servicio
        # solo borra Domain + Tenant row + schema).
        access_count = accesses.delete()[0]
        self.stdout.write(f"    - {access_count} TenantUserAccess eliminados")

        # 2. Delegar al servicio: Domain + Tenant row + schema
        try:
            TenantLifecycleService.delete_tenant_with_schema(
                schema_name=schema_name,
                confirmation_token=(
                    TenantLifecycleService.CONFIRMATION_TOKEN_TEMPLATE.format(
                        schema_name=schema_name,
                    )
                ),
                deleted_by_user_id=None,
            )
        except TenantNotFoundError as e:
            raise CommandError(f"Tenant no encontrado: {e}")
        except SchemaDropFailedError as e:
            raise CommandError(f"Error al dropear schema: {e}")
        except TenantInvariantViolationError as e:
            raise CommandError(f"Invariante violado post-delete: {e}")
        except InvalidConfirmationTokenError:
            # Bug interno: el token se genera con la misma plantilla.
            raise

        self.stdout.write(
            f"    - Tenant + Domain + Schema eliminados via servicio"
        )

        self.stdout.write(self.style.SUCCESS(
            f"\n  Tenant '{schema_name}' eliminado completamente."
        ))
