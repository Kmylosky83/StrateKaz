"""
Fix: Desmarcar is_system en cargos de negocio y desactivar ADMIN/USUARIO.

Problema: Todos los cargos seed quedaron con is_system=True, lo que impide
que aparezcan en Perfiles de Cargo y otros listados filtrados.

Solución:
1. Desmarcar is_system=True en cargos de negocio (excluye ADMIN/USUARIO)
2. Desactivar cargos ADMIN y USUARIO (anti-patrón arquitectónico eliminado)

Uso:
    python manage.py fix_cargo_is_system
    python manage.py fix_cargo_is_system --dry-run
"""
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Desmarcar is_system en cargos de negocio y desactivar ADMIN/USUARIO'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar cambios sin ejecutar',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        from apps.core.models import Cargo

        dry_run = options.get('dry_run', False)

        self.stdout.write('\n' + '=' * 50)
        self.stdout.write('  FIX CARGO IS_SYSTEM')
        self.stdout.write('=' * 50)

        # 1. Desmarcar is_system en cargos de negocio
        business = Cargo.objects.exclude(
            code__in=['ADMIN', 'USUARIO']
        ).filter(is_system=True)

        count = business.count()
        self.stdout.write(f'\nCargos de negocio con is_system=True: {count}')

        if count > 0:
            for c in business.values('code', 'name'):
                self.stdout.write(f'  - {c["code"]}: {c["name"]}')

            if not dry_run:
                business.update(is_system=False)
                self.stdout.write(self.style.SUCCESS(f'  Desmarcados: {count}'))
            else:
                self.stdout.write(self.style.WARNING(f'  [DRY-RUN] Se desmarcarían: {count}'))

        # 2. Desactivar ADMIN y USUARIO
        system_cargos = Cargo.objects.filter(
            code__in=['ADMIN', 'USUARIO'],
            is_active=True,
        )
        system_count = system_cargos.count()
        self.stdout.write(f'\nCargos ADMIN/USUARIO activos: {system_count}')

        if system_count > 0:
            if not dry_run:
                system_cargos.update(is_active=False)
                self.stdout.write(self.style.SUCCESS(f'  Desactivados: {system_count}'))
            else:
                self.stdout.write(self.style.WARNING(f'  [DRY-RUN] Se desactivarían: {system_count}'))

        # 3. Reasignar usuarios que tenían cargo ADMIN/USUARIO
        from apps.core.models import User
        orphaned = User.objects.filter(
            cargo__code__in=['ADMIN', 'USUARIO'],
            is_active=True,
        )
        orphaned_count = orphaned.count()
        self.stdout.write(f'\nUsuarios con cargo ADMIN/USUARIO: {orphaned_count}')

        if orphaned_count > 0:
            for u in orphaned.values('email', 'cargo__code'):
                self.stdout.write(f'  - {u["email"]} (cargo: {u["cargo__code"]})')

            if not dry_run:
                orphaned.update(cargo=None)
                self.stdout.write(self.style.SUCCESS(
                    f'  Cargo eliminado de {orphaned_count} usuario(s). '
                    'Asignar cargo de negocio manualmente.'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'  [DRY-RUN] Se eliminaría cargo de {orphaned_count} usuario(s)'
                ))

        self.stdout.write(self.style.SUCCESS('\nFix completado.'))
        self.stdout.write('')
