"""
Fix: Desmarcar is_system en cargos de negocio y desactivar ADMIN/USUARIO.

Problema: Todos los cargos seed quedaron con is_system=True, lo que impide
que aparezcan en Perfiles de Cargo y otros listados filtrados.

Solución:
1. Desmarcar is_system=True en cargos de negocio (excluye ADMIN/USUARIO)
2. Desactivar cargos ADMIN y USUARIO (anti-patrón arquitectónico eliminado)
3. Limpiar cargo de usuarios que tenían ADMIN/USUARIO asignado

Uso:
    python manage.py fix_cargo_is_system
    python manage.py fix_cargo_is_system --dry-run
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django_tenants.utils import schema_context


class Command(BaseCommand):
    help = 'Desmarcar is_system en cargos de negocio y desactivar ADMIN/USUARIO (todos los tenants)'

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
        self.stdout.write('  FIX CARGO IS_SYSTEM — TODOS LOS TENANTS')
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

                # 1. Desmarcar is_system en cargos de negocio
                business = Cargo.objects.exclude(
                    code__in=['ADMIN', 'USUARIO']
                ).filter(is_system=True)

                count = business.count()
                if count > 0:
                    if not dry_run:
                        business.update(is_system=False)
                    self.stdout.write(
                        f'  Cargos negocio desmarcados is_system: {count}'
                        + (' [DRY-RUN]' if dry_run else '')
                    )

                # 2. Desactivar ADMIN y USUARIO
                system_cargos = Cargo.objects.filter(
                    code__in=['ADMIN', 'USUARIO'],
                    is_active=True,
                )
                system_count = system_cargos.count()
                if system_count > 0:
                    if not dry_run:
                        system_cargos.update(is_active=False)
                    self.stdout.write(
                        f'  ADMIN/USUARIO desactivados: {system_count}'
                        + (' [DRY-RUN]' if dry_run else '')
                    )

                # 3. Limpiar cargo de usuarios que tenían ADMIN/USUARIO
                orphaned = User.objects.filter(
                    cargo__code__in=['ADMIN', 'USUARIO'],
                    is_active=True,
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

                if count == 0 and system_count == 0 and orphaned_count == 0:
                    self.stdout.write('  Sin cambios necesarios')
