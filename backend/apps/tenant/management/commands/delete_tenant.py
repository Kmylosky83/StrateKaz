"""
Management command: delete_tenant

Elimina un tenant completamente:
1. Elimina TenantUserAccess del tenant (public schema)
2. Elimina TenantUsers huérfanos (sin acceso a ningún otro tenant)
3. Elimina Domain del tenant (public schema)
4. Elimina el Tenant (public schema)
5. Elimina el schema PostgreSQL (DROP SCHEMA ... CASCADE)

PELIGRO: Esta operación es irreversible.

Uso:
  python manage.py delete_tenant --schema grasas --dry-run
  python manage.py delete_tenant --schema grasas --confirm
"""
import logging
from django.core.management.base import BaseCommand
from django.db import connection

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Elimina un tenant completamente (schema + registros public)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--schema',
            type=str,
            required=True,
            help='Schema name del tenant a eliminar (ej: grasas)',
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
        dry_run = not confirm or options['dry_run']

        from apps.tenant.models import Tenant, Domain, TenantUser, TenantUserAccess

        if schema_name == 'public':
            self.stdout.write(self.style.ERROR("✗ No se puede eliminar el schema 'public'."))
            return

        # Verificar tenant
        try:
            tenant = Tenant.objects.get(schema_name=schema_name)
        except Tenant.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                f"\n✗ Tenant con schema '{schema_name}' no encontrado."
            ))
            # Verificar si el schema existe huérfano
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = %s)",
                    [schema_name]
                )
                schema_exists = cursor.fetchone()[0]
            if schema_exists:
                self.stdout.write(self.style.WARNING(
                    f"  ⚠ El schema '{schema_name}' existe pero no tiene registro de Tenant."
                ))
                if not dry_run:
                    resp = input(f'¿Eliminar schema huérfano "{schema_name}"? (yes/no): ').strip()
                    if resp == 'yes':
                        with connection.cursor() as cursor:
                            cursor.execute(f'DROP SCHEMA "{schema_name}" CASCADE')
                        self.stdout.write(self.style.SUCCESS(f"  ✅ Schema '{schema_name}' eliminado."))
            return

        # Recopilar información
        domains = Domain.objects.filter(tenant=tenant)
        accesses = TenantUserAccess.objects.filter(tenant=tenant).select_related('tenant_user')

        # TenantUsers que quedarían huérfanos
        orphan_tus = []
        for access in accesses:
            tu = access.tenant_user
            if tu.is_superadmin:
                continue
            remaining = TenantUserAccess.objects.filter(
                tenant_user=tu
            ).exclude(tenant=tenant).count()
            if remaining == 0:
                orphan_tus.append(tu)

        # Verificar si el schema existe
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = %s)",
                [schema_name]
            )
            schema_exists = cursor.fetchone()[0]

        # Mostrar resumen
        self.stdout.write(f"\n{'=' * 70}")
        self.stdout.write(self.style.ERROR(
            f"  ⚠ ELIMINACIÓN COMPLETA DE TENANT"
        ))
        self.stdout.write(f"{'=' * 70}")
        self.stdout.write(f"  Tenant:  {tenant.name} (ID: {tenant.id})")
        self.stdout.write(f"  Schema:  {schema_name} ({'EXISTE' if schema_exists else 'NO EXISTE'})")
        self.stdout.write(f"  Code:    {tenant.code}")
        self.stdout.write(f"  Estado:  {'Activo' if tenant.is_active else 'Inactivo'}")
        self.stdout.write(f"")
        self.stdout.write(f"  Dominios:             {domains.count()}")
        for d in domains:
            self.stdout.write(f"    • {d.domain} {'(primary)' if d.is_primary else ''}")
        self.stdout.write(f"  TenantUserAccess:     {accesses.count()}")
        self.stdout.write(f"  TenantUsers huérfanos: {len(orphan_tus)}")
        for tu in orphan_tus[:10]:
            self.stdout.write(f"    • {tu.email}")

        self.stdout.write(f"\n  Se ejecutará:")
        self.stdout.write(f"    1. DELETE TenantUserAccess ({accesses.count()})")
        self.stdout.write(f"    2. DELETE TenantUser huérfanos ({len(orphan_tus)})")
        self.stdout.write(f"    3. DELETE Domain ({domains.count()})")
        self.stdout.write(f"    4. DELETE Tenant (ID: {tenant.id})")
        if schema_exists:
            self.stdout.write(f"    5. DROP SCHEMA \"{schema_name}\" CASCADE")

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"\n  [DRY RUN] Sin cambios. Usa --confirm para ejecutar."
            ))
            return

        # Confirmar con texto exacto
        self.stdout.write('')
        expected = f'ELIMINAR {schema_name.upper()}'
        resp = input(
            f'⚠ ESTA ACCIÓN ES IRREVERSIBLE.\n'
            f'Escribe "{expected}" para confirmar: '
        ).strip()
        if resp != expected:
            self.stdout.write(self.style.WARNING('Operación cancelada.'))
            return

        # Ejecutar
        self.stdout.write('\n  Ejecutando eliminación...')

        # 1. TenantUserAccess
        count = accesses.delete()[0]
        self.stdout.write(f"    ✓ {count} TenantUserAccess eliminados")

        # 2. TenantUsers huérfanos
        if orphan_tus:
            tu_ids = [tu.id for tu in orphan_tus]
            count = TenantUser.objects.filter(id__in=tu_ids, is_superadmin=False).delete()[0]
            self.stdout.write(f"    ✓ {count} TenantUser huérfanos eliminados")

        # 3. Domains
        count = domains.delete()[0]
        self.stdout.write(f"    ✓ {count} Domain(s) eliminados")

        # 4. Tenant
        tenant_id = tenant.id
        tenant.delete()
        self.stdout.write(f"    ✓ Tenant ID {tenant_id} eliminado")

        # 5. Schema
        if schema_exists:
            with connection.cursor() as cursor:
                cursor.execute(f'DROP SCHEMA "{schema_name}" CASCADE')
            self.stdout.write(f"    ✓ Schema '{schema_name}' eliminado de PostgreSQL")

        self.stdout.write(self.style.SUCCESS(
            f"\n  ✅ Tenant '{schema_name}' eliminado completamente."
        ))
        self.stdout.write(self.style.SUCCESS(
            f"  Para recrear: Admin Global → Crear Nuevo Tenant"
        ))
