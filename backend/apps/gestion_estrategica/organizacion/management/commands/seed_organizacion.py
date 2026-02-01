"""
Comando de Gestión: Seed de Organización Empresarial (DEMO)

NOTA: Este comando carga datos de DEMOSTRACIÓN.
En producción, cada empresa configura su propia estructura organizacional:
- Categorías de Documento
- Tipos de Documento
- Áreas/Departamentos
- Consecutivos

Uso:
    python manage.py seed_organizacion --demo
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Muestra información sobre configuración de organización (datos son específicos por empresa)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--demo',
            action='store_true',
            help='Este comando ya no carga datos. Cada empresa configura su estructura.',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 70))
        self.stdout.write(self.style.SUCCESS('CONFIGURACIÓN DE ORGANIZACIÓN EMPRESARIAL'))
        self.stdout.write(self.style.SUCCESS('=' * 70 + '\n'))

        self.stdout.write(self.style.WARNING(
            'NOTA: La estructura organizacional es específica de cada empresa.\n'
            'No hay datos precargados del sistema.\n'
        ))

        self.stdout.write('Cada empresa debe configurar:\n')
        self.stdout.write('  1. Categorías de Documento (Admin > Organización > Categorías)')
        self.stdout.write('  2. Tipos de Documento (Admin > Organización > Tipos)')
        self.stdout.write('  3. Áreas/Departamentos (Admin > Organización > Áreas)')
        self.stdout.write('  4. Consecutivos (Admin > Organización > Consecutivos)')
        self.stdout.write('')

        self.stdout.write(self.style.SUCCESS(
            'Use el panel de administración Django para configurar estos datos.\n'
        ))
