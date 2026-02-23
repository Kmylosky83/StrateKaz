"""
Management command: clear_tenant_users

Elimina todos los usuarios no-superadmin de un tenant específico.
Útil para limpiar datos de demo/prueba antes de usar el nuevo flujo
unificado de creación de colaboradores con acceso al sistema.

Operaciones:
  1. Elimina Users en el schema del tenant (no superusers)
  2. Elimina TenantUserAccess para ese tenant (public schema)
  3. Elimina TenantUser huérfanos (sin acceso a ningún tenant)

Uso:
  python manage.py clear_tenant_users --tenant stratekaz --dry-run
  python manage.py clear_tenant_users --tenant stratekaz
"""
from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context


class Command(BaseCommand):
    help = 'Elimina todos los usuarios (no superadmin) de un tenant específico'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            default='stratekaz',
            help='Schema name del tenant (default: stratekaz)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué se eliminaría sin realizar cambios',
        )

    def handle(self, *args, **options):
        schema_name = options['tenant']
        dry_run = options['dry_run']

        from apps.tenant.models import Tenant, TenantUser, TenantUserAccess
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # 1. Verificar que el tenant existe (public schema)
        try:
            tenant = Tenant.objects.get(schema_name=schema_name)
        except Tenant.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                f"\n✗ Tenant '{schema_name}' no encontrado en el sistema."
            ))
            return

        self.stdout.write(f"\n{'=' * 60}")
        self.stdout.write(f"  Tenant: {tenant.schema_name}")
        self.stdout.write(f"{'=' * 60}")

        # 2. Obtener Users del schema del tenant (excluir superusers)
        with schema_context(schema_name):
            user_list = list(
                User.objects.filter(is_superuser=False)
                .values('id', 'username', 'email')
                .order_by('username')
            )
            user_count = len(user_list)

        # 3. Obtener TenantUserAccess del tenant (public schema)
        accesses = TenantUserAccess.objects.filter(tenant=tenant).select_related('tenant_user')
        access_list = list(accesses)

        # 4. Identificar TenantUsers que quedarán huérfanos tras eliminar sus accesos
        tu_orphans = []
        for access in access_list:
            tu = access.tenant_user
            if tu.is_superadmin:
                continue
            remaining = TenantUserAccess.objects.filter(
                tenant_user=tu
            ).exclude(tenant=tenant).count()
            if remaining == 0:
                tu_orphans.append(tu)

        # 5. Mostrar resumen
        prefix = '[DRY RUN] ' if dry_run else ''
        self.stdout.write(f"\n{prefix}Lo que se eliminará:\n")

        self.stdout.write(f"  Users en schema '{schema_name}': {user_count}")
        for u in user_list[:25]:
            self.stdout.write(f"    • {u['username']:<30} {u['email']}")
        if user_count > 25:
            self.stdout.write(f"    ... y {user_count - 25} más")

        self.stdout.write(f"\n  TenantUserAccess del tenant: {len(access_list)}")

        self.stdout.write(f"\n  TenantUser huérfanos (sin otro tenant): {len(tu_orphans)}")
        for tu in tu_orphans[:25]:
            self.stdout.write(f"    • {tu.email}")
        if len(tu_orphans) > 25:
            self.stdout.write(f"    ... y {len(tu_orphans) - 25} más")

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"\n[DRY RUN] Sin cambios. Ejecuta sin --dry-run para proceder."
            ))
            return

        if user_count == 0 and len(access_list) == 0:
            self.stdout.write(self.style.SUCCESS("\n✅ El tenant ya está limpio. Sin cambios necesarios."))
            return

        # 6. Confirmar antes de ejecutar
        self.stdout.write('')
        confirm = input('¿Confirmas la eliminación? Escribe "yes" para continuar: ').strip().lower()
        if confirm != 'yes':
            self.stdout.write(self.style.WARNING('Operación cancelada.'))
            return

        # 7. Ejecutar eliminación
        self.stdout.write('\nEliminando...')

        # a. Eliminar Users del schema del tenant
        with schema_context(schema_name):
            result = User.objects.filter(is_superuser=False).delete()
            deleted_users = result[0]
        self.stdout.write(self.style.SUCCESS(
            f"  ✓ {deleted_users} User(s) eliminados del schema '{schema_name}'"
        ))

        # b. Eliminar TenantUserAccess
        result = TenantUserAccess.objects.filter(tenant=tenant).delete()
        deleted_accesses = result[0]
        self.stdout.write(self.style.SUCCESS(
            f"  ✓ {deleted_accesses} TenantUserAccess record(s) eliminados"
        ))

        # c. Eliminar TenantUsers huérfanos (solo no-superadmins)
        if tu_orphans:
            tu_ids = [tu.id for tu in tu_orphans]
            result = TenantUser.objects.filter(id__in=tu_ids, is_superadmin=False).delete()
            deleted_tu = result[0]
            self.stdout.write(self.style.SUCCESS(
                f"  ✓ {deleted_tu} TenantUser(s) eliminados"
            ))

        self.stdout.write(self.style.SUCCESS('\n✅ Limpieza completada exitosamente.'))
        self.stdout.write(self.style.SUCCESS(
            f"   Ahora puedes crear colaboradores con el nuevo flujo unificado."
        ))
