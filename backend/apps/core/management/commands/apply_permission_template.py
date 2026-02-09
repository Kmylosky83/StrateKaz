"""
Management Command: Aplicar Plantilla de Permisos - RBAC StrateKaz v4.1

Aplica una plantilla de permisos predefinida a uno o más cargos.
Las plantillas permiten estandarizar permisos de forma rápida.

Uso:
    # Ver plantillas disponibles
    python manage.py apply_permission_template --list

    # Aplicar a un cargo específico
    python manage.py apply_permission_template admin --cargo=gerente_general

    # Aplicar a todos los cargos de un nivel
    python manage.py apply_permission_template viewer --nivel=OPERATIVO

    # Aplicar a todos los cargos
    python manage.py apply_permission_template editor --all

    # Preview sin aplicar
    python manage.py apply_permission_template admin --cargo=gerente_general --dry-run
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.core.models import Cargo


class Command(BaseCommand):
    help = 'Aplica una plantilla de permisos a cargos'

    def add_arguments(self, parser):
        parser.add_argument(
            'template_code',
            type=str,
            nargs='?',
            help='Código de la plantilla a aplicar (admin, viewer, editor, manager)'
        )
        parser.add_argument(
            '--cargo',
            type=str,
            help='Código de cargo específico'
        )
        parser.add_argument(
            '--nivel',
            type=str,
            choices=['ESTRATEGICO', 'TACTICO', 'OPERATIVO', 'APOYO', 'EXTERNO'],
            help='Aplicar a todos los cargos de un nivel'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Aplicar a todos los cargos activos'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué se haría sin hacer cambios'
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='Listar plantillas disponibles'
        )
        parser.add_argument(
            '--no-replace',
            action='store_true',
            help='No reemplazar permisos existentes (solo agregar)'
        )

    def handle(self, *args, **options):
        from apps.core.models.models_permission_templates import PermissionTemplate

        # Listar plantillas
        if options.get('list'):
            return self._list_templates()

        template_code = options.get('template_code')
        if not template_code:
            raise CommandError(
                'Debe especificar un código de plantilla. '
                'Use --list para ver plantillas disponibles.'
            )

        dry_run = options['dry_run']
        replace = not options.get('no_replace')

        # Obtener plantilla
        try:
            template = PermissionTemplate.objects.get(code=template_code, is_active=True)
        except PermissionTemplate.DoesNotExist:
            raise CommandError(
                f'Plantilla "{template_code}" no encontrada o inactiva. '
                'Use --list para ver plantillas disponibles.'
            )

        # Determinar cargos
        cargos = Cargo.objects.filter(is_active=True)

        if options.get('cargo'):
            cargos = cargos.filter(code=options['cargo'])
            if not cargos.exists():
                raise CommandError(f'Cargo "{options["cargo"]}" no encontrado')

        elif options.get('nivel'):
            cargos = cargos.filter(nivel_jerarquico=options['nivel'])
            if not cargos.exists():
                raise CommandError(f'No hay cargos activos con nivel "{options["nivel"]}"')

        elif not options.get('all'):
            raise CommandError(
                'Debe especificar --cargo, --nivel o --all para indicar '
                'a qué cargos aplicar la plantilla.'
            )

        self.stdout.write('')
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING(
            f'  APLICAR PLANTILLA: {template.name}'
        ))
        self.stdout.write('=' * 70)

        if dry_run:
            self.stdout.write(self.style.WARNING('\n  [MODO DRY-RUN] No se realizarán cambios\n'))

        self.stdout.write(f'\n  Plantilla: {template.name} ({template.get_template_type_display()})')
        self.stdout.write(f'  Permisos por defecto:')
        self.stdout.write(f'    - Ver: {template.default_can_view}')
        self.stdout.write(f'    - Crear: {template.default_can_create}')
        self.stdout.write(f'    - Editar: {template.default_can_edit}')
        self.stdout.write(f'    - Eliminar: {template.default_can_delete}')
        self.stdout.write(f'  Modo: {"Reemplazar" if replace else "Solo agregar"}')
        self.stdout.write(f'  Cargos a modificar: {cargos.count()}\n')

        total_created = 0
        total_updated = 0
        total_skipped = 0

        with transaction.atomic():
            for cargo in cargos:
                if dry_run:
                    # En dry-run, solo mostrar qué se haría
                    preview = template.preview_for_cargo(cargo)
                    sections_to_apply = sum(
                        1 for p in preview
                        if not p['excluded'] and p['permissions'].get('can_view')
                    )
                    self.stdout.write(f'  [DRY] {cargo.code}: {sections_to_apply} secciones')
                    total_created += sections_to_apply
                else:
                    created, updated, skipped = template.apply_to_cargo(
                        cargo,
                        user=None,  # No hay usuario en management command
                        replace=replace
                    )
                    total_created += created
                    total_updated += updated
                    total_skipped += skipped

                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  {cargo.code}: +{created} creados, ~{updated} actualizados, '
                            f'-{skipped} omitidos'
                        )
                    )

            if dry_run:
                transaction.set_rollback(True)

        # Resumen
        self.stdout.write('\n' + '-' * 70)
        self.stdout.write(self.style.SUCCESS(f'  Total creados: {total_created}'))
        if not dry_run:
            self.stdout.write(f'  Total actualizados: {total_updated}')
            self.stdout.write(f'  Total omitidos: {total_skipped}')
        self.stdout.write('-' * 70)

        if dry_run:
            self.stdout.write(self.style.WARNING('\n  [DRY-RUN] No se realizaron cambios\n'))
        else:
            self.stdout.write(self.style.SUCCESS('\n  Plantilla aplicada exitosamente\n'))

    def _list_templates(self):
        """Lista todas las plantillas disponibles."""
        from apps.core.models.models_permission_templates import PermissionTemplate

        templates = PermissionTemplate.objects.filter(is_active=True).order_by('orden', 'name')

        self.stdout.write('')
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING('  PLANTILLAS DE PERMISOS DISPONIBLES'))
        self.stdout.write('=' * 70)

        if not templates.exists():
            self.stdout.write(self.style.WARNING(
                '\n  No hay plantillas disponibles.'
                '\n  Ejecute "python manage.py migrate_rbac_v4" para crear las plantillas predefinidas.\n'
            ))
            return

        self.stdout.write('')
        for t in templates:
            perms = []
            if t.default_can_view:
                perms.append('V')
            if t.default_can_create:
                perms.append('C')
            if t.default_can_edit:
                perms.append('E')
            if t.default_can_delete:
                perms.append('D')

            sistema = ' [SISTEMA]' if t.is_system else ''
            self.stdout.write(
                f'  {t.code:<15} {t.name:<30} [{"/".join(perms)}]{sistema}'
            )
            if t.description:
                self.stdout.write(f'                 {t.description[:50]}...')

        self.stdout.write('')
        self.stdout.write('  Leyenda: V=Ver, C=Crear, E=Editar, D=Eliminar')
        self.stdout.write('')
