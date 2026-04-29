"""
Management command para limpiar módulos legacy del sidebar

Este comando:
1. Desactiva módulos que NO están en la Estructura Final 22
2. Mantiene solo los 14 módulos oficiales

Uso:
    docker exec stratekaz_backend python manage.py cleanup_legacy_modules
    docker exec stratekaz_backend python manage.py cleanup_legacy_modules --delete  # Para eliminar
"""
from django.core.management.base import BaseCommand
from apps.core.models import SystemModule, ModuleTab


# Códigos oficiales de la Estructura Final 22
OFFICIAL_MODULES = [
    'gestion_estrategica',      # 10
    'motor_cumplimiento',       # 20
    'motor_riesgos',            # 21
    'infra_workflow_engine',    # 22
    'hseq_management',          # 30
    'supply_chain',             # 40
    'production_ops',           # 41
    'logistics_fleet',          # 42
    'sales_crm',                # 43
    'talent_hub',               # 50
    'admin_finance',            # 51
    'accounting',               # 52
    'analytics',                # 60
    'audit_system',             # 61
]


class Command(BaseCommand):
    help = 'Limpia módulos legacy que no están en la Estructura Final 22'

    def add_arguments(self, parser):
        parser.add_argument(
            '--delete',
            action='store_true',
            help='Eliminar módulos legacy en lugar de solo desactivarlos'
        )

    def handle(self, *args, **options):
        delete_mode = options['delete']

        self.stdout.write('=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  LIMPIEZA DE MÓDULOS LEGACY'
        ))
        self.stdout.write('=' * 70)

        # Encontrar módulos que NO están en la lista oficial
        legacy_modules = SystemModule.objects.exclude(code__in=OFFICIAL_MODULES)

        if not legacy_modules.exists():
            self.stdout.write(
                self.style.SUCCESS('\n  ✓ No hay módulos legacy - Todo limpio!')
            )
            return

        self.stdout.write(f'\n  Módulos legacy encontrados: {legacy_modules.count()}\n')

        for module in legacy_modules:
            tab_count = module.tabs.count()

            if delete_mode:
                module.delete()
                self.stdout.write(
                    self.style.ERROR(f'  ✗ ELIMINADO: [{module.order:02d}] {module.name} ({tab_count} tabs)')
                )
            else:
                module.is_enabled = False
                module.save()
                self.stdout.write(
                    self.style.WARNING(f'  ⊘ DESACTIVADO: [{module.order:02d}] {module.name} ({tab_count} tabs)')
                )

        self.stdout.write('\n' + '=' * 70)
        if delete_mode:
            self.stdout.write(self.style.SUCCESS('  ✓ Módulos legacy ELIMINADOS'))
        else:
            self.stdout.write(self.style.SUCCESS('  ✓ Módulos legacy DESACTIVADOS'))
            self.stdout.write('  → Usa --delete para eliminarlos completamente')
        self.stdout.write('=' * 70)

        # Mostrar estado actual
        self.stdout.write('\n  MÓDULOS ACTIVOS AHORA:')
        self.stdout.write('  ' + '-' * 50)

        active_modules = SystemModule.objects.filter(
            is_enabled=True
        ).order_by('order')

        for module in active_modules:
            tab_count = module.tabs.filter(is_enabled=True).count()
            self.stdout.write(
                f'  [{module.order:02d}] {module.name:<30} ({tab_count} tabs)'
            )

        self.stdout.write('')
