"""
Fix: Desmarcar is_system en datos de negocio (cargos y áreas/procesos).

Problema: Seeds marcan datos como is_system=True, lo que impide editarlos
y eliminarlos desde la UI.

Solución:
1. Desmarcar is_system=True en cargos de negocio
2. Desmarcar is_system=True en áreas/procesos de negocio
3. Eliminar cargos ADMIN/USUARIO (anti-patrón eliminado)

Uso:
    python manage.py fix_cargo_is_system
    python manage.py fix_cargo_is_system --dry-run
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django_tenants.utils import schema_context


class Command(BaseCommand):
    help = 'Desmarcar is_system en cargos y áreas de negocio (todos los tenants)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar cambios sin ejecutar',
        )

    def handle(self, *args, **options):
        from apps.tenant.models import Tenant

        dry_run = options.get('dry_run', False)

        tenants = Tenant.objects.filter(
            is_active=True,
        ).exclude(schema_name='public')

        if not tenants.exists():
            self.stdout.write(self.style.WARNING('No hay tenants activos'))
            return

        self.stdout.write('\n' + '=' * 50)
        self.stdout.write('  FIX IS_SYSTEM — TODOS LOS TENANTS')
        self.stdout.write('=' * 50)

        for tenant in tenants:
            self.stdout.write(f'\n[*] {tenant.name} ({tenant.schema_name})')
            self._fix_tenant(tenant.schema_name, dry_run)

        self.stdout.write(self.style.SUCCESS('\nFix completado en todos los tenants.'))
        self.stdout.write('')

    def _fix_tenant(self, schema_name, dry_run):
        with schema_context(schema_name):
            with transaction.atomic():
                from apps.core.models import Cargo, User

                # =============================================
                # 1. Cargos de negocio → is_system=False
                # =============================================
                business_cargos = Cargo.objects.exclude(
                    code__in=['ADMIN', 'USUARIO']
                ).filter(is_system=True)

                count = business_cargos.count()
                if count > 0:
                    if not dry_run:
                        business_cargos.update(is_system=False)
                    self.stdout.write(
                        f'  Cargos desmarcados is_system: {count}'
                        + (' [DRY-RUN]' if dry_run else '')
                    )

                # =============================================
                # 2. Eliminar ADMIN/USUARIO físicamente
                # =============================================
                system_cargos = Cargo.objects.filter(
                    code__in=['ADMIN', 'USUARIO'],
                )
                system_count = system_cargos.count()
                if system_count > 0:
                    if not dry_run:
                        system_cargos.delete()
                    self.stdout.write(
                        f'  ADMIN/USUARIO eliminados: {system_count}'
                        + (' [DRY-RUN]' if dry_run else '')
                    )

                # =============================================
                # 3. Limpiar cargo de usuarios huérfanos
                # =============================================
                orphaned = User.objects.filter(
                    cargo__isnull=False,
                ).exclude(
                    cargo__is_active=True,
                )
                orphaned_count = orphaned.count()
                if orphaned_count > 0:
                    emails = list(orphaned.values_list('email', flat=True))
                    if not dry_run:
                        orphaned.update(cargo=None)
                    self.stdout.write(
                        f'  Usuarios limpiados: {orphaned_count} ({", ".join(emails)})'
                        + (' [DRY-RUN]' if dry_run else '')
                    )

                # =============================================
                # 4. Áreas/Procesos → is_system=False
                # =============================================
                try:
                    from apps.gestion_estrategica.organizacion.models import Area
                    system_areas = Area.objects.filter(is_system=True)
                    area_count = system_areas.count()
                    if area_count > 0:
                        if not dry_run:
                            system_areas.update(is_system=False)
                        self.stdout.write(
                            f'  Áreas desmarcadas is_system: {area_count}'
                            + (' [DRY-RUN]' if dry_run else '')
                        )
                except Exception:
                    pass  # App no instalada

                if count == 0 and system_count == 0 and orphaned_count == 0 and area_count == 0:
                    self.stdout.write('  Sin cambios necesarios')
