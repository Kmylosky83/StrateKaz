"""
Sincronizar seeds en tenants existentes.

Cuando se actualizan los seeds (modulos, sidebar, permisos RBAC, cargo admin),
los tenants existentes NO reciben los cambios automaticamente porque los seeds
solo corren al momento de crear un tenant.

Este comando re-ejecuta los seeds criticos en tenants existentes para que
reciban la estructura actualizada de modulos, permisos y cargos del sistema.

Los 3 seeds criticos son idempotentes (usan update_or_create):
1. seed_estructura_final - Modulos, tabs, secciones del sidebar
2. seed_permisos_rbac    - Permisos RBAC por modulo/seccion
3. seed_admin_cargo      - Cargos ADMIN/USUARIO con acceso a todas las secciones

Uso:
    # Sincronizar todos los tenants activos
    python manage.py sync_tenant_seeds --all

    # Sincronizar un tenant especifico
    python manage.py sync_tenant_seeds --tenant-code=grasasyhuesos

    # Ver que se haria sin ejecutar
    python manage.py sync_tenant_seeds --all --dry-run

    # Solo estructura (sin permisos ni cargo admin)
    python manage.py sync_tenant_seeds --all --only-estructura

    # Produccion
    DJANGO_SETTINGS_MODULE=config.settings.production python manage.py sync_tenant_seeds --all
"""
import time
import logging
from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from django_tenants.utils import schema_context

logger = logging.getLogger('apps')


class Command(BaseCommand):
    help = 'Re-ejecutar seeds criticos en tenants existentes para sincronizar modulos, permisos y cargos'

    def add_arguments(self, parser):
        group = parser.add_mutually_exclusive_group(required=True)
        group.add_argument(
            '--tenant-code',
            type=str,
            help='Codigo del tenant a sincronizar (ej: grasasyhuesos)',
        )
        group.add_argument(
            '--all',
            action='store_true',
            help='Sincronizar todos los tenants activos con schema_status=ready',
        )

        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar que se haria sin ejecutar los seeds',
        )
        parser.add_argument(
            '--only-estructura',
            action='store_true',
            help='Solo ejecutar seed_estructura_final (modulos/sidebar)',
        )
        parser.add_argument(
            '--skip-admin-cargo',
            action='store_true',
            help='Omitir seed_admin_cargo (no actualizar cargos del sistema)',
        )

    def handle(self, *args, **options):
        from apps.tenant.models import Tenant

        # ==========================================
        # 1. Obtener tenants a sincronizar
        # ==========================================
        if options['tenant_code']:
            tenants = Tenant.objects.filter(
                code=options['tenant_code'],
            ).exclude(schema_name='public')

            if not tenants.exists():
                raise CommandError(
                    f'Tenant con code="{options["tenant_code"]}" no encontrado. '
                    f'Tenants disponibles: {list(Tenant.objects.exclude(schema_name="public").values_list("code", flat=True))}'
                )
        else:
            tenants = Tenant.objects.filter(
                schema_status='ready',
                is_active=True,
            ).exclude(schema_name='public')

        if not tenants.exists():
            self.stdout.write(self.style.WARNING('No hay tenants para sincronizar'))
            return

        # ==========================================
        # 2. Determinar seeds a ejecutar
        # ==========================================
        seeds = []
        seeds.append(('seed_estructura_final', 'Modulos, tabs y secciones del sidebar'))

        if not options['only_estructura']:
            seeds.append(('seed_permisos_rbac', 'Permisos RBAC por modulo/seccion'))

            if not options['skip_admin_cargo']:
                seeds.append(('seed_admin_cargo', 'Cargos ADMIN/USUARIO del sistema'))

        # ==========================================
        # 3. Resumen pre-ejecucion
        # ==========================================
        tenant_list = list(tenants.values_list('code', 'name', 'schema_name'))

        self.stdout.write('')
        self.stdout.write('=' * 60)
        self.stdout.write(self.style.MIGRATE_HEADING('  SYNC TENANT SEEDS'))
        self.stdout.write('=' * 60)
        self.stdout.write(f'\n  Tenants a sincronizar ({len(tenant_list)}):')
        for code, name, schema in tenant_list:
            self.stdout.write(f'    - {name} ({code}) -> {schema}')
        self.stdout.write(f'\n  Seeds a ejecutar ({len(seeds)}):')
        for seed_name, description in seeds:
            self.stdout.write(f'    - {seed_name}: {description}')

        if options['dry_run']:
            self.stdout.write(self.style.WARNING('\n  [DRY RUN] No se ejecutaron cambios'))
            self.stdout.write('')
            return

        # ==========================================
        # 4. Ejecutar seeds por tenant
        # ==========================================
        self.stdout.write('\n' + '-' * 60)
        total_start = time.time()
        success_count = 0
        error_count = 0
        errors = []

        for tenant in tenants:
            self.stdout.write(f'\n[*] {tenant.name} ({tenant.schema_name})')

            tenant_start = time.time()
            tenant_ok = True

            with schema_context(tenant.schema_name):
                for seed_name, description in seeds:
                    try:
                        call_command(seed_name, verbosity=0)
                        self.stdout.write(self.style.SUCCESS(f'   [OK] {seed_name}'))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'   [ERROR] {seed_name}: {e}'))
                        errors.append((tenant.code, seed_name, str(e)))
                        tenant_ok = False
                        logger.error(
                            f'sync_tenant_seeds: Error en {seed_name} para {tenant.code}: {e}',
                            exc_info=True,
                        )

            elapsed = time.time() - tenant_start
            if tenant_ok:
                success_count += 1
                self.stdout.write(f'   Completado en {elapsed:.1f}s')
            else:
                error_count += 1
                self.stdout.write(self.style.WARNING(f'   Completado con errores en {elapsed:.1f}s'))

        # ==========================================
        # 5. Resumen final
        # ==========================================
        total_elapsed = time.time() - total_start

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.MIGRATE_HEADING('  RESUMEN'))
        self.stdout.write('=' * 60)
        self.stdout.write(f'  Total tenants:  {len(tenant_list)}')
        self.stdout.write(self.style.SUCCESS(f'  Exitosos:       {success_count}'))
        if error_count:
            self.stdout.write(self.style.ERROR(f'  Con errores:    {error_count}'))
            for code, seed, error in errors:
                self.stdout.write(self.style.ERROR(f'    - {code}/{seed}: {error}'))
        self.stdout.write(f'  Tiempo total:   {total_elapsed:.1f}s')
        self.stdout.write('')

        if error_count:
            raise CommandError(f'{error_count} tenant(s) tuvieron errores durante la sincronizacion')
