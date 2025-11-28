"""
Comando de gestión para crear nuevos cargos
"""
from django.core.management.base import BaseCommand
from apps.core.models import Cargo


class Command(BaseCommand):
    help = 'Crea nuevos cargos en el sistema'

    def handle(self, *args, **options):
        self.stdout.write('='*60)
        self.stdout.write('Creando nuevos cargos...')
        self.stdout.write('='*60)

        # ============ CARGOS ============
        self.stdout.write('\n📋 CARGOS:')

        nuevos_cargos = [
            {
                'code': 'profesional_sst',
                'name': 'Profesional SST',
                'description': 'Profesional en Seguridad y Salud en el Trabajo',
                'level': 2  # Nivel Coordinación
            },
            {
                'code': 'lider_talento_humano',
                'name': 'Líder de Talento Humano',
                'description': 'Responsable de la gestión del talento humano',
                'level': 2  # Nivel Coordinación
            },
        ]

        for cargo_data in nuevos_cargos:
            cargo, created = Cargo.objects.get_or_create(
                code=cargo_data['code'],
                defaults={
                    'name': cargo_data['name'],
                    'description': cargo_data['description'],
                    'level': cargo_data['level']
                }
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Cargo creado: {cargo.name} ({cargo.code})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'  - Ya existe: {cargo.name} ({cargo.code})')
                )

        # ============ RESUMEN ============
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('RESUMEN FINAL'))
        self.stdout.write('='*60)

        self.stdout.write('\n📋 Cargos en el sistema:')
        for cargo in Cargo.objects.all().order_by('level', 'name'):
            nivel_label = dict(Cargo.LEVEL_CHOICES).get(cargo.level, 'Desconocido')
            self.stdout.write(f'  - [{nivel_label}] {cargo.name} ({cargo.code})')

        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('✓ Proceso completado exitosamente'))
        self.stdout.write('='*60 + '\n')
