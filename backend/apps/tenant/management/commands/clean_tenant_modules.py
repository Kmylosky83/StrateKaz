"""
Management command: clean_tenant_modules

Limpia datos de módulos C2-C6 de un tenant, manteniendo intactos:
- C0: Core (users, RBAC, permisos, menú, módulos de sistema)
- C1: Fundación (configuración, organización, identidad)
- IA: Integraciones y logs de IA

Esto permite reiniciar los módulos de negocio de un tenant sin perder
la configuración base ni los usuarios.

Uso:
  python manage.py clean_tenant_modules --tenant demo --dry-run
  python manage.py clean_tenant_modules --tenant demo --confirm
  python manage.py clean_tenant_modules --tenant demo --confirm --include-c1
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
}

# Apps C1 que se pueden limpiar opcionalmente con --include-c1
C1_OPTIONAL_APPS = {
    'planeacion', 'contexto', 'encuestas',
    'gestion_proyectos', 'revision_direccion',
    'gestion_documental', 'planificacion_sistema',
}


class Command(BaseCommand):
    help = 'Limpia datos de módulos C2-C6 de un tenant (mantiene C0+C1+Users)'

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
            help='Ejecutar la limpieza (sin esto es dry-run)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Mostrar qué se limpiaría sin ejecutar',
        )
        parser.add_argument(
            '--include-c1',
            action='store_true',
            default=False,
            help='También limpiar datos C1 opcionales (planeación, contexto, proyectos, etc.)',
        )

    def handle(self, *args, **options):
        schema_name = options['tenant']
        confirm = options['confirm']
        include_c1 = options['include_c1']
        dry_run = not confirm or options['dry_run']

        from apps.tenant.models import Tenant

        # Verificar tenant
        try:
            tenant = Tenant.objects.get(schema_name=schema_name)
        except Tenant.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                f"\n✗ Tenant '{schema_name}' no encontrado."
            ))
            return

        self.stdout.write(f"\n{'=' * 70}")
        self.stdout.write(f"  LIMPIEZA DE MÓDULOS — Tenant: {tenant.name} ({schema_name})")
        self.stdout.write(f"{'=' * 70}")

        # Determinar qué apps mantener
        keep = set(KEEP_APPS)
        if not include_c1:
            keep.update(C1_OPTIONAL_APPS)

        # Obtener tablas a limpiar dentro del schema
        with schema_context(schema_name):
            tables_to_clean = []
            tables_to_keep = []

            for model in apps.get_models():
                app_label = model._meta.app_label
                table_name = model._meta.db_table

                if app_label in keep:
                    tables_to_keep.append((app_label, table_name))
                    continue

                # Verificar que la tabla existe en el schema
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT EXISTS (
                            SELECT 1 FROM information_schema.tables
                            WHERE table_schema = %s AND table_name = %s
                        )
                    """, [schema_name, table_name])
                    exists = cursor.fetchone()[0]

                if exists:
                    # Contar registros
                    with connection.cursor() as cursor:
                        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                        count = cursor.fetchone()[0]
                    if count > 0:
                        tables_to_clean.append((app_label, table_name, count))

        # Mostrar resumen
        if not tables_to_clean:
            self.stdout.write(self.style.SUCCESS(
                "\n✅ No hay datos C2-C6 para limpiar. El tenant ya está limpio."
            ))
            return

        self.stdout.write(f"\n  Apps preservadas (C0+C1): {', '.join(sorted(keep))}")
        if include_c1:
            self.stdout.write(self.style.WARNING("  ⚠ --include-c1: también se limpiarán datos C1 opcionales"))
        self.stdout.write(f"\n  Tablas con datos a limpiar: {len(tables_to_clean)}")
        self.stdout.write(f"  {'─' * 66}")

        total_records = 0
        by_app = {}
        for app_label, table_name, count in sorted(tables_to_clean, key=lambda x: x[0]):
            self.stdout.write(f"    {app_label:<35} {table_name:<40} {count:>6} registros")
            total_records += count
            by_app[app_label] = by_app.get(app_label, 0) + count

        self.stdout.write(f"  {'─' * 66}")
        self.stdout.write(f"  TOTAL: {total_records} registros en {len(tables_to_clean)} tablas")

        self.stdout.write(f"\n  Resumen por app:")
        for app, count in sorted(by_app.items(), key=lambda x: -x[1]):
            self.stdout.write(f"    {app:<35} {count:>6}")

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"\n  [DRY RUN] Sin cambios. Usa --confirm para ejecutar."
            ))
            return

        # Confirmar
        self.stdout.write('')
        resp = input(
            f'¿Confirmas limpiar {total_records} registros del tenant "{schema_name}"?\n'
            f'Escribe "LIMPIAR {schema_name.upper()}" para confirmar: '
        ).strip()
        expected = f'LIMPIAR {schema_name.upper()}'
        if resp != expected:
            self.stdout.write(self.style.WARNING('Operación cancelada.'))
            return

        # Ejecutar TRUNCATE CASCADE
        self.stdout.write('\n  Ejecutando limpieza...')
        with schema_context(schema_name):
            table_names = [t[1] for t in tables_to_clean]
            # Usar TRUNCATE ... CASCADE para manejar FKs automáticamente
            tables_sql = ', '.join(f'"{t}"' for t in table_names)
            with connection.cursor() as cursor:
                cursor.execute(f'TRUNCATE TABLE {tables_sql} CASCADE')

        self.stdout.write(self.style.SUCCESS(
            f"\n  ✅ {total_records} registros eliminados de {len(tables_to_clean)} tablas."
        ))
        self.stdout.write(self.style.SUCCESS(
            f"  ✅ C0 (Users, RBAC, Menú) y C1 (Empresa, Estructura) intactos."
        ))
        self.stdout.write(self.style.SUCCESS(
            f"\n  Siguiente paso: re-ejecutar seeds si es necesario:"
        ))
        self.stdout.write(
            f"    python manage.py deploy_seeds_all_tenants --tenant {schema_name}"
        )
