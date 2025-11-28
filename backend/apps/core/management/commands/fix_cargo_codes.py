"""
Comando para corregir los códigos de cargo en la base de datos.
Cambia códigos con formato incorrecto (PascalCase/Mixto) a lowercase.
"""
from django.core.management.base import BaseCommand
from apps.core.models import Cargo


class Command(BaseCommand):
    help = 'Corrige los códigos de cargo a formato lowercase'

    def handle(self, *args, **options):
        self.stdout.write('=' * 60)
        self.stdout.write('Corrigiendo códigos de cargo...')
        self.stdout.write('=' * 60)

        # Mapeo de códigos incorrectos a correctos
        corrections = {
            'Profesional_SST': 'profesional_sst',
            'PROFESIONAL_SST': 'profesional_sst',
            'Lider_Talento_Humano': 'lider_talento_humano',
            'LIDER_TALENTO_HUMANO': 'lider_talento_humano',
            'supervisor_logistico': 'supervisor_planta',
            'Supervisor_Logistico': 'supervisor_planta',
            'SUPERVISOR_LOGISTICO': 'supervisor_planta',
        }

        updated_count = 0
        for old_code, new_code in corrections.items():
            try:
                cargo = Cargo.objects.get(code=old_code)
                old_name = cargo.name
                cargo.code = new_code

                # Actualizar nombre si corresponde
                if old_code.lower() == 'supervisor_logistico':
                    cargo.name = 'Supervisor de Planta'
                    cargo.description = 'Supervisor de planta de producción'

                cargo.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✓ Actualizado: {old_code} → {new_code}'
                    )
                )
            except Cargo.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'  - No encontrado: {old_code}')
                )

        # Mostrar resumen
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('RESUMEN'))
        self.stdout.write('=' * 60)
        self.stdout.write(f'\nCargos actualizados: {updated_count}')

        self.stdout.write('\n📋 Cargos actuales en el sistema:')
        for cargo in Cargo.objects.all().order_by('level', 'name'):
            self.stdout.write(f'  - [{cargo.level}] {cargo.name} ({cargo.code})')

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('✓ Proceso completado'))
        self.stdout.write('=' * 60 + '\n')
