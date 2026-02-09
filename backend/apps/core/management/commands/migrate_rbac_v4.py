"""
Management Command: Migrar a RBAC v4.1 - StrateKaz

Comando de migración inicial que:
1. Crea las plantillas de permisos predefinidas (Admin, Viewer, Editor, Manager)
2. Opcionalmente propaga secciones existentes a cargos
3. Configura el sistema RBAC v4.1

Uso:
    # Ejecutar migración completa
    python manage.py migrate_rbac_v4

    # Solo crear plantillas (sin propagar)
    python manage.py migrate_rbac_v4 --templates-only

    # Ver qué se haría
    python manage.py migrate_rbac_v4 --dry-run
"""
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Migra el sistema de permisos a RBAC v4.1'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué se haría sin hacer cambios'
        )
        parser.add_argument(
            '--templates-only',
            action='store_true',
            help='Solo crear plantillas, no propagar permisos'
        )
        parser.add_argument(
            '--propagate',
            action='store_true',
            help='Propagar secciones a cargos existentes'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        templates_only = options.get('templates_only')
        propagate = options.get('propagate')

        self.stdout.write('')
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING('  MIGRACIÓN A RBAC v4.1'))
        self.stdout.write('=' * 70)

        if dry_run:
            self.stdout.write(self.style.WARNING('\n  [MODO DRY-RUN] No se realizarán cambios\n'))

        with transaction.atomic():
            # Paso 1: Crear plantillas predefinidas
            self.stdout.write('\n  PASO 1: Creando plantillas de permisos...')
            templates_created = self._create_default_templates(dry_run)
            self.stdout.write(
                self.style.SUCCESS(f'    ✓ {templates_created} plantillas creadas/actualizadas')
            )

            # Paso 2: Propagar secciones (opcional)
            if propagate and not templates_only:
                self.stdout.write('\n  PASO 2: Propagando secciones a cargos...')
                propagated = self._propagate_existing_sections(dry_run)
                self.stdout.write(
                    self.style.SUCCESS(f'    ✓ {propagated} accesos creados')
                )
            elif not templates_only:
                self.stdout.write('\n  PASO 2: Propagación de secciones omitida')
                self.stdout.write('           Use --propagate para propagar secciones')

            if dry_run:
                transaction.set_rollback(True)

        # Resumen
        self.stdout.write('\n' + '-' * 70)
        if dry_run:
            self.stdout.write(self.style.WARNING('  [DRY-RUN] No se realizaron cambios'))
        else:
            self.stdout.write(self.style.SUCCESS('  Migración a RBAC v4.1 completada'))
        self.stdout.write('-' * 70)

        # Próximos pasos
        self.stdout.write('\n  PRÓXIMOS PASOS:')
        self.stdout.write('  1. Ejecutar migraciones: python manage.py migrate')
        self.stdout.write('  2. Verificar plantillas: python manage.py apply_permission_template --list')
        if not propagate:
            self.stdout.write('  3. Propagar permisos: python manage.py sync_permissions --dry-run')
        self.stdout.write('')

    def _create_default_templates(self, dry_run: bool) -> int:
        """Crea las plantillas de permisos predefinidas del sistema."""
        from apps.core.models.models_permission_templates import PermissionTemplate

        templates = [
            {
                'code': 'admin',
                'name': 'Administrador',
                'description': 'Acceso total a todas las secciones. Para gerentes y directores.',
                'template_type': 'ADMIN',
                'default_can_view': True,
                'default_can_create': True,
                'default_can_edit': True,
                'default_can_delete': True,
                'is_system': True,
                'orden': 1,
            },
            {
                'code': 'manager',
                'name': 'Gestor',
                'description': 'Puede ver, crear y editar, pero no eliminar. Para coordinadores.',
                'template_type': 'MANAGER',
                'default_can_view': True,
                'default_can_create': True,
                'default_can_edit': True,
                'default_can_delete': False,
                'is_system': True,
                'orden': 2,
            },
            {
                'code': 'editor',
                'name': 'Editor',
                'description': 'Puede ver y editar registros existentes. Para supervisores.',
                'template_type': 'EDITOR',
                'default_can_view': True,
                'default_can_create': False,
                'default_can_edit': True,
                'default_can_delete': False,
                'is_system': True,
                'orden': 3,
            },
            {
                'code': 'viewer',
                'name': 'Solo Lectura',
                'description': 'Solo puede visualizar información. Para consultas y reportes.',
                'template_type': 'VIEWER',
                'default_can_view': True,
                'default_can_create': False,
                'default_can_edit': False,
                'default_can_delete': False,
                'is_system': True,
                'orden': 4,
            },
            {
                'code': 'operativo_basico',
                'name': 'Operativo Básico',
                'description': 'Acceso mínimo para personal operativo. Ver y crear.',
                'template_type': 'CUSTOM',
                'default_can_view': True,
                'default_can_create': True,
                'default_can_edit': False,
                'default_can_delete': False,
                'is_system': True,
                'orden': 5,
            },
            {
                'code': 'externo',
                'name': 'Usuario Externo',
                'description': 'Acceso limitado para contratistas, consultores y auditores.',
                'template_type': 'CUSTOM',
                'default_can_view': True,
                'default_can_create': False,
                'default_can_edit': False,
                'default_can_delete': False,
                'is_system': True,
                'orden': 6,
                # Excluir secciones sensibles para externos
                'excluded_sections': [
                    'roles',
                    'cargos',
                    'colaboradores',
                    'groups',
                ],
            },
        ]

        count = 0
        for t_data in templates:
            if dry_run:
                self.stdout.write(f'      [DRY] {t_data["code"]}: {t_data["name"]}')
                count += 1
            else:
                template, created = PermissionTemplate.objects.update_or_create(
                    code=t_data['code'],
                    defaults=t_data
                )
                action = 'creada' if created else 'actualizada'
                self.stdout.write(f'      {template.code}: {template.name} ({action})')
                count += 1

        return count

    def _propagate_existing_sections(self, dry_run: bool) -> int:
        """Propaga secciones existentes a cargos sin acceso configurado."""
        from apps.core.models import TabSection, Cargo, CargoSectionAccess
        from apps.core.signals.rbac_signals import PermissionPropagationConfig

        sections = TabSection.objects.filter(is_enabled=True)
        cargos = Cargo.objects.filter(is_active=True)

        count = 0
        for section in sections:
            for cargo in cargos:
                # Verificar si ya existe
                exists = CargoSectionAccess.objects.filter(
                    cargo=cargo,
                    section=section
                ).exists()

                if exists:
                    continue

                # Obtener permisos por defecto
                defaults = PermissionPropagationConfig.get_default_permissions(
                    cargo.nivel_jerarquico
                )

                # Solo crear si tiene can_view
                if not defaults.get('can_view', False):
                    continue

                if not dry_run:
                    CargoSectionAccess.objects.create(
                        cargo=cargo,
                        section=section,
                        can_view=defaults['can_view'],
                        can_create=defaults['can_create'],
                        can_edit=defaults['can_edit'],
                        can_delete=defaults['can_delete'],
                    )

                count += 1

        return count
