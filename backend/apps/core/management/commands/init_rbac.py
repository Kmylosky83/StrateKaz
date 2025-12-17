"""
Management command para inicializar el sistema RBAC

Crea todos los permisos, cargos, roles y grupos definidos en permissions_constants.py
La asignación de permisos a cargos/roles/grupos se hace dinámicamente en la BD.

Uso:
    python manage.py init_rbac
    python manage.py init_rbac --reset  # Elimina y recrea todo
    python manage.py init_rbac --permissions-only  # Solo permisos
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.core.models import Cargo, Permiso, Role, Group
from apps.core.permissions_constants import (
    PERMISSIONS_DEFINITIONS,
    CARGOS_DEFINITIONS,
    ROLES_DEFINITIONS,
    GROUPS_DEFINITIONS,
)


class Command(BaseCommand):
    help = 'Inicializa el sistema RBAC con permisos, cargos, roles y grupos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Elimina todos los datos RBAC y los recrea',
        )
        parser.add_argument(
            '--permissions-only',
            action='store_true',
            help='Solo crea/actualiza permisos',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Muestra información detallada',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        reset = options['reset']
        permissions_only = options['permissions_only']
        verbose = options['verbose']

        if reset:
            self.stdout.write(self.style.WARNING('Reseteando sistema RBAC...'))
            self._reset_rbac()

        # Siempre crear permisos
        self._create_permissions(verbose)

        if not permissions_only:
            self._create_cargos(verbose)
            self._create_roles(verbose)
            self._create_groups(verbose)

        self.stdout.write(self.style.SUCCESS('Sistema RBAC inicializado correctamente'))
        self._print_summary()

    def _reset_rbac(self):
        """Elimina todos los datos RBAC para recrear desde cero"""
        # No eliminamos CargoPermiso, RolePermiso, etc. porque se eliminan en cascada
        Group.objects.all().delete()
        Role.objects.all().delete()
        # No eliminamos Cargo porque tiene usuarios asignados
        # No eliminamos Permiso porque puede tener asignaciones históricas
        self.stdout.write('  - Roles y Grupos eliminados')

    def _create_permissions(self, verbose):
        """Crea o actualiza todos los permisos"""
        created = 0
        updated = 0

        for perm_def in PERMISSIONS_DEFINITIONS:
            permiso, was_created = Permiso.objects.update_or_create(
                code=perm_def['code'],
                defaults={
                    'name': perm_def['name'],
                    'description': perm_def.get('description', ''),
                    'module': perm_def['module'],
                    'action': perm_def['action'],
                    'scope': perm_def.get('scope', 'ALL'),
                    'is_active': True,
                }
            )

            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Permiso creado: {perm_def["code"]}')
            else:
                updated += 1

        self.stdout.write(
            f'Permisos: {created} creados, {updated} actualizados '
            f'(Total: {Permiso.objects.count()})'
        )

    def _create_cargos(self, verbose):
        """Crea o actualiza todos los cargos"""
        created = 0
        updated = 0

        for cargo_def in CARGOS_DEFINITIONS:
            cargo, was_created = Cargo.objects.update_or_create(
                code=cargo_def['code'],
                defaults={
                    'name': cargo_def['name'],
                    'description': cargo_def.get('description', ''),
                    'level': cargo_def['level'],
                    'is_active': True,
                }
            )

            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Cargo creado: {cargo_def["code"]}')
            else:
                updated += 1

        # Asignar parent_cargo en segunda pasada
        for cargo_def in CARGOS_DEFINITIONS:
            if cargo_def.get('parent_code'):
                cargo = Cargo.objects.get(code=cargo_def['code'])
                parent = Cargo.objects.filter(code=cargo_def['parent_code']).first()
                if parent:
                    cargo.parent_cargo = parent
                    cargo.save(update_fields=['parent_cargo'])

        self.stdout.write(
            f'Cargos: {created} creados, {updated} actualizados '
            f'(Total: {Cargo.objects.count()})'
        )

    def _create_roles(self, verbose):
        """Crea o actualiza todos los roles"""
        created = 0
        updated = 0

        for role_def in ROLES_DEFINITIONS:
            role, was_created = Role.objects.update_or_create(
                code=role_def['code'],
                defaults={
                    'name': role_def['name'],
                    'description': role_def.get('description', ''),
                    'is_active': True,
                }
            )

            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Rol creado: {role_def["code"]}')
            else:
                updated += 1

        self.stdout.write(
            f'Roles: {created} creados, {updated} actualizados '
            f'(Total: {Role.objects.count()})'
        )

    def _create_groups(self, verbose):
        """Crea o actualiza todos los grupos"""
        created = 0
        updated = 0

        for group_def in GROUPS_DEFINITIONS:
            group, was_created = Group.objects.update_or_create(
                code=group_def['code'],
                defaults={
                    'name': group_def['name'],
                    'description': group_def.get('description', ''),
                    'is_active': True,
                }
            )

            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Grupo creado: {group_def["code"]}')
            else:
                updated += 1

        self.stdout.write(
            f'Grupos: {created} creados, {updated} actualizados '
            f'(Total: {Group.objects.count()})'
        )

    def _print_summary(self):
        """Imprime resumen del sistema RBAC"""
        self.stdout.write('')
        self.stdout.write(self.style.HTTP_INFO('=== Resumen Sistema RBAC ==='))
        self.stdout.write(f'  Permisos totales: {Permiso.objects.filter(is_active=True).count()}')
        self.stdout.write(f'  Cargos totales: {Cargo.objects.filter(is_active=True).count()}')
        self.stdout.write(f'  Roles totales: {Role.objects.filter(is_active=True).count()}')
        self.stdout.write(f'  Grupos totales: {Group.objects.filter(is_active=True).count()}')

        # Permisos por módulo
        self.stdout.write('')
        self.stdout.write('  Permisos por módulo:')
        from django.db.models import Count
        modules = Permiso.objects.filter(is_active=True).values('module').annotate(
            count=Count('id')
        ).order_by('module')
        for m in modules:
            self.stdout.write(f'    - {m["module"]}: {m["count"]}')
