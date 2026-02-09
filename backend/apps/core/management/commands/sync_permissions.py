"""
Management Command: Sincronizar Permisos - RBAC StrateKaz v4.1

Propaga secciones existentes a cargos que no tienen acceso configurado.
Útil para:
- Sincronizar permisos después de agregar nuevas secciones
- Aplicar permisos por defecto a cargos existentes
- Verificar estado actual de permisos (dry-run)

Uso:
    # Ver qué se haría sin hacer cambios
    python manage.py sync_permissions --dry-run

    # Sincronizar un cargo específico
    python manage.py sync_permissions --cargo=gerente_general

    # Sincronizar una sección específica
    python manage.py sync_permissions --section=empresa

    # Sincronizar solo cargos de un nivel
    python manage.py sync_permissions --nivel=ESTRATEGICO

    # Sincronizar todo
    python manage.py sync_permissions
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.core.models import TabSection, Cargo, CargoSectionAccess
from apps.core.signals.rbac_signals import PermissionPropagationConfig


class Command(BaseCommand):
    help = 'Sincroniza permisos de secciones a cargos existentes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué se haría sin hacer cambios'
        )
        parser.add_argument(
            '--cargo',
            type=str,
            help='Código de cargo específico a sincronizar'
        )
        parser.add_argument(
            '--section',
            type=str,
            help='Código de sección específica a propagar'
        )
        parser.add_argument(
            '--nivel',
            type=str,
            choices=['ESTRATEGICO', 'TACTICO', 'OPERATIVO', 'APOYO', 'EXTERNO'],
            help='Sincronizar solo cargos de un nivel jerárquico'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Crear accesos incluso si el nivel no tiene can_view por defecto'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Mostrar información detallada'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        cargo_code = options.get('cargo')
        section_code = options.get('section')
        nivel = options.get('nivel')
        force = options.get('force')
        verbose = options.get('verbose')

        self.stdout.write('')
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING('  SYNC PERMISSIONS - RBAC v4.1'))
        self.stdout.write('=' * 70)

        if dry_run:
            self.stdout.write(self.style.WARNING('\n  [MODO DRY-RUN] No se realizarán cambios\n'))

        # Filtrar secciones
        sections = TabSection.objects.filter(is_enabled=True)
        if section_code:
            sections = sections.filter(code=section_code)
            if not sections.exists():
                raise CommandError(f'Sección "{section_code}" no encontrada')

        # Filtrar cargos
        cargos = Cargo.objects.filter(is_active=True)
        if cargo_code:
            cargos = cargos.filter(code=cargo_code)
            if not cargos.exists():
                raise CommandError(f'Cargo "{cargo_code}" no encontrado')

        if nivel:
            cargos = cargos.filter(nivel_jerarquico=nivel)

        self.stdout.write(f'\n  Secciones a procesar: {sections.count()}')
        self.stdout.write(f'  Cargos a procesar: {cargos.count()}\n')

        # Contadores
        created_count = 0
        skipped_exists = 0
        skipped_no_view = 0

        with transaction.atomic():
            for section in sections:
                if verbose:
                    self.stdout.write(f'\n  Sección: {section.code} ({section.name})')

                for cargo in cargos:
                    # Verificar si ya existe
                    exists = CargoSectionAccess.objects.filter(
                        cargo=cargo,
                        section=section
                    ).exists()

                    if exists:
                        skipped_exists += 1
                        if verbose:
                            self.stdout.write(
                                self.style.NOTICE(f'    - {cargo.code}: ya existe')
                            )
                        continue

                    # Obtener permisos por defecto según nivel
                    defaults = PermissionPropagationConfig.get_default_permissions(
                        cargo.nivel_jerarquico
                    )

                    # Solo crear si tiene can_view (a menos que --force)
                    if not defaults.get('can_view', False) and not force:
                        skipped_no_view += 1
                        if verbose:
                            self.stdout.write(
                                self.style.NOTICE(
                                    f'    - {cargo.code}: sin can_view (nivel={cargo.nivel_jerarquico})'
                                )
                            )
                        continue

                    if not dry_run:
                        CargoSectionAccess.objects.create(
                            cargo=cargo,
                            section=section,
                            can_view=defaults.get('can_view', False),
                            can_create=defaults.get('can_create', False),
                            can_edit=defaults.get('can_edit', False),
                            can_delete=defaults.get('can_delete', False),
                        )

                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'    + {cargo.code} -> {section.code} '
                            f'[V:{defaults.get("can_view")} C:{defaults.get("can_create")} '
                            f'E:{defaults.get("can_edit")} D:{defaults.get("can_delete")}]'
                        )
                    )

            if dry_run:
                transaction.set_rollback(True)

        # Resumen
        self.stdout.write('\n' + '-' * 70)
        self.stdout.write(self.style.SUCCESS(f'  Accesos creados: {created_count}'))
        self.stdout.write(f'  Omitidos (ya existen): {skipped_exists}')
        self.stdout.write(f'  Omitidos (sin can_view): {skipped_no_view}')
        self.stdout.write('-' * 70)

        if dry_run:
            self.stdout.write(self.style.WARNING('\n  [DRY-RUN] No se realizaron cambios\n'))
        else:
            self.stdout.write(self.style.SUCCESS('\n  Sincronización completada\n'))
