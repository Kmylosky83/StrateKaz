"""
Management command: reset_tenant

Resetea un tenant a estado "como nuevo":
1. Elimina datos C2-C6 (TRUNCATE CASCADE)
2. Elimina TODOS los Users excepto superadmin (schema tenant)
3. Limpia TenantUserAccess del tenant (public schema)
4. Elimina TenantUsers huérfanos (public schema)

Preserva:
- Superadmin(s) del tenant
- C0: RBAC, permisos, menú, módulos de sistema
- C1: Empresa, estructura organizacional, identidad
- Schema PostgreSQL intacto

PELIGRO: Esta operación es irreversible.

Uso:
  python manage.py reset_tenant --tenant demo --dry-run
  python manage.py reset_tenant --tenant demo --confirm
"""
import logging
from django.apps import apps
from django.core.management.base import BaseCommand
from django.db import connection
from django_tenants.utils import schema_context

logger = logging.getLogger(__name__)

# Apps que se PRESERVAN (C0 + C1 + sistema)
KEEP_APPS = {
    # Django internals
    'admin', 'auth', 'contenttypes', 'sessions',
    # Third party
    'token_blacklist', 'auditlog', 'csp',
    # C0 — Core
    'core', 'ia',
    # C1 — Fundación (configuración, organización, identidad)
    'configuracion', 'organizacion', 'identidad',
    # C1 opcional
    'planeacion', 'contexto', 'encuestas',
    'gestion_proyectos', 'revision_direccion',
    'gestion_documental', 'planificacion_sistema',
}


class Command(BaseCommand):
    help = 'Resetea un tenant a estado nuevo (C2-C6 + usuarios no-admin)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            required=True,
            help='Schema name del tenant (ej: demo, grasas)',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            default=False,
            help='Ejecutar el reset (sin esto es dry-run)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Mostrar qué se eliminaría sin ejecutar',
        )

    def handle(self, *args, **options):
        schema_name = options['tenant']
        confirm = options['confirm']
        dry_run = not confirm or options['dry_run']

        from apps.tenant.models import Tenant, TenantUser, TenantUserAccess

        # Verificar tenant
        try:
            tenant = Tenant.objects.get(schema_name=schema_name)
        except Tenant.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                f"\n✗ Tenant '{schema_name}' no encontrado."
            ))
            return

        # ====================================================================
        # 1. Analizar Users en el schema del tenant
        # ====================================================================
        User = apps.get_model('core', 'User')

        with schema_context(schema_name):
            superusers = list(User.objects.filter(is_superuser=True).values(
                'id', 'email', 'username'
            ))
            superuser_ids = [su['id'] for su in superusers]

            users_to_delete = User.objects.filter(is_superuser=False)
            users_count = users_to_delete.count()
            users_emails = list(users_to_delete.values_list('email', flat=True)[:30])

        # ====================================================================
        # 2. Analizar tablas C2-C6 a limpiar
        # ====================================================================
        with schema_context(schema_name):
            tables_to_clean = []
            for model in apps.get_models():
                app_label = model._meta.app_label
                table_name = model._meta.db_table

                if app_label in KEEP_APPS:
                    continue

                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT EXISTS (
                            SELECT 1 FROM information_schema.tables
                            WHERE table_schema = %s AND table_name = %s
                        )
                    """, [schema_name, table_name])
                    exists = cursor.fetchone()[0]

                if exists:
                    with connection.cursor() as cursor:
                        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                        count = cursor.fetchone()[0]
                    if count > 0:
                        tables_to_clean.append((app_label, table_name, count))

        total_records = sum(t[2] for t in tables_to_clean)

        # ====================================================================
        # 3. Analizar public schema (TenantUserAccess + TenantUsers)
        # ====================================================================
        accesses = TenantUserAccess.objects.filter(tenant=tenant)
        non_admin_accesses = accesses.filter(tenant_user__is_superadmin=False)
        admin_accesses = accesses.filter(tenant_user__is_superadmin=True)

        # TenantUsers que quedarían huérfanos
        orphan_tus = []
        for access in non_admin_accesses.select_related('tenant_user'):
            tu = access.tenant_user
            remaining = TenantUserAccess.objects.filter(
                tenant_user=tu
            ).exclude(tenant=tenant).count()
            if remaining == 0:
                orphan_tus.append(tu)

        # ====================================================================
        # MOSTRAR RESUMEN
        # ====================================================================
        self.stdout.write(f"\n{'=' * 70}")
        self.stdout.write(self.style.ERROR(
            "  ⚠ RESET COMPLETO DE TENANT"
        ))
        self.stdout.write(f"{'=' * 70}")
        self.stdout.write(f"  Tenant:  {tenant.name} (schema: {schema_name})")
        self.stdout.write(f"  ID:      {tenant.id}")
        self.stdout.write(f"  Estado:  {'Activo' if tenant.is_active else 'Inactivo'}")

        # Superadmins preservados
        self.stdout.write(f"\n  ✓ SUPERADMINS PRESERVADOS: {len(superusers)}")
        for su in superusers:
            self.stdout.write(f"    ✓ {su['email']} (ID: {su['id']})")

        # Usuarios a eliminar
        self.stdout.write(f"\n  ✗ USUARIOS A ELIMINAR: {users_count}")
        for email in users_emails:
            self.stdout.write(f"    ✗ {email}")
        if users_count > 30:
            self.stdout.write(f"    ... y {users_count - 30} más")

        # Tablas C2-C6
        self.stdout.write(f"\n  DATOS C2-C6 A ELIMINAR:")
        self.stdout.write(f"    Tablas con datos: {len(tables_to_clean)}")
        self.stdout.write(f"    Registros total:  {total_records}")
        if tables_to_clean:
            by_app = {}
            for app_label, _, count in tables_to_clean:
                by_app[app_label] = by_app.get(app_label, 0) + count
            for app, count in sorted(by_app.items(), key=lambda x: -x[1])[:15]:
                self.stdout.write(f"      {app:<35} {count:>6} registros")
            if len(by_app) > 15:
                self.stdout.write(f"      ... y {len(by_app) - 15} apps más")

        # Public schema
        self.stdout.write(f"\n  PUBLIC SCHEMA:")
        self.stdout.write(f"    TenantUserAccess a eliminar: {non_admin_accesses.count()}")
        self.stdout.write(f"    TenantUserAccess preservados: {admin_accesses.count()} (superadmin)")
        self.stdout.write(f"    TenantUsers huérfanos a eliminar: {len(orphan_tus)}")

        # Plan de ejecución
        self.stdout.write(f"\n  PLAN DE EJECUCIÓN:")
        self.stdout.write(f"    1. TRUNCATE {len(tables_to_clean)} tablas C2-C6 CASCADE")
        self.stdout.write(f"    2. Nullificar audit fields (created_by, updated_by) en C0/C1")
        self.stdout.write(f"    3. DELETE {users_count} Users no-superuser del schema")
        self.stdout.write(f"    4. DELETE {non_admin_accesses.count()} TenantUserAccess (public)")
        self.stdout.write(f"    5. DELETE {len(orphan_tus)} TenantUsers huérfanos (public)")

        self.stdout.write(f"\n  SE PRESERVA:")
        self.stdout.write(f"    ✓ {len(superusers)} Superadmin(s)")
        self.stdout.write(f"    ✓ C0: RBAC, permisos, menú, módulos de sistema")
        self.stdout.write(f"    ✓ C1: Empresa, estructura, identidad, organización")
        self.stdout.write(f"    ✓ Schema PostgreSQL")

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"\n  [DRY RUN] Sin cambios. Usa --confirm para ejecutar."
            ))
            return

        # Confirmación con texto exacto
        self.stdout.write('')
        expected = f'RESETEAR {schema_name.upper()}'
        resp = input(
            f'⚠ ESTA ACCIÓN ES IRREVERSIBLE.\n'
            f'Se eliminarán {users_count} usuarios + {total_records} registros C2-C6.\n'
            f'Escribe "{expected}" para confirmar: '
        ).strip()
        if resp != expected:
            self.stdout.write(self.style.WARNING('Operación cancelada.'))
            return

        # ====================================================================
        # EJECUTAR
        # ====================================================================
        self.stdout.write('\n  Ejecutando reset...')

        # Paso 1: TRUNCATE C2-C6
        if tables_to_clean:
            with schema_context(schema_name):
                table_names = [t[1] for t in tables_to_clean]
                tables_sql = ', '.join(f'"{t}"' for t in table_names)
                with connection.cursor() as cursor:
                    cursor.execute(f'TRUNCATE TABLE {tables_sql} CASCADE')
            self.stdout.write(
                f"    ✓ {total_records} registros C2-C6 eliminados "
                f"({len(tables_to_clean)} tablas)"
            )

        # Paso 2-3: Nullificar FKs + Delete Users en schema tenant
        with schema_context(schema_name):
            # Nullificar audit fields en tablas C0/C1 que apuntan a users a eliminar
            nullified_total = 0
            for model in apps.get_models():
                app_label = model._meta.app_label
                if app_label not in KEEP_APPS:
                    continue

                table_name = model._meta.db_table
                for field in model._meta.get_fields():
                    if not hasattr(field, 'related_model'):
                        continue
                    if field.related_model != User:
                        continue
                    if not hasattr(field, 'column') or not field.null:
                        continue

                    col_name = field.column
                    try:
                        with connection.cursor() as cursor:
                            if superuser_ids:
                                cursor.execute(
                                    f'UPDATE "{table_name}" SET "{col_name}" = NULL '
                                    f'WHERE "{col_name}" IS NOT NULL '
                                    f'AND "{col_name}" NOT IN %s',
                                    [tuple(superuser_ids)]
                                )
                            else:
                                cursor.execute(
                                    f'UPDATE "{table_name}" SET "{col_name}" = NULL '
                                    f'WHERE "{col_name}" IS NOT NULL'
                                )
                            if cursor.rowcount > 0:
                                nullified_total += cursor.rowcount
                    except Exception as e:
                        logger.warning(
                            f"No se pudo limpiar {table_name}.{col_name}: {e}"
                        )

            if nullified_total > 0:
                self.stdout.write(
                    f"    ✓ {nullified_total} referencias audit nullificadas en C0/C1"
                )

            # Delete Users no-superuser
            deleted = User.objects.filter(is_superuser=False).delete()
            user_deleted_count = deleted[0]
            self.stdout.write(
                f"    ✓ {user_deleted_count} Users eliminados del schema"
            )

        # Paso 4: Delete TenantUserAccess (public schema)
        access_deleted = non_admin_accesses.delete()
        self.stdout.write(
            f"    ✓ {access_deleted[0]} TenantUserAccess eliminados (public)"
        )

        # Paso 5: Delete TenantUsers huérfanos (public schema)
        if orphan_tus:
            tu_ids = [tu.id for tu in orphan_tus]
            tu_deleted = TenantUser.objects.filter(
                id__in=tu_ids,
                is_superadmin=False
            ).delete()
            self.stdout.write(
                f"    ✓ {tu_deleted[0]} TenantUsers huérfanos eliminados (public)"
            )

        # ====================================================================
        # RESUMEN FINAL
        # ====================================================================
        self.stdout.write(self.style.SUCCESS(
            f"\n  ✅ Tenant '{schema_name}' reseteado completamente."
        ))
        self.stdout.write(self.style.SUCCESS(
            f"  Solo quedan superadmin(s) + configuración C0/C1."
        ))
        self.stdout.write(self.style.SUCCESS(
            f"\n  Siguientes pasos:"
        ))
        self.stdout.write(
            f"    1. Re-ejecutar seeds si es necesario:"
        )
        self.stdout.write(
            f"       python manage.py deploy_seeds_all_tenants --tenant {schema_name}"
        )
        self.stdout.write(
            f"    2. Crear nuevos usuarios desde Admin Global"
        )
