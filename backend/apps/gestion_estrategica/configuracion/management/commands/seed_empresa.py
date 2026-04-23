"""
Comando de Gestión: Seed de Empresa StrateKaz (Propietario del Software)

Carga datos iniciales de StrateKaz S.A.S. como empresa propietaria del software.
En un entorno multi-tenant, cada cliente tendría su propia configuración.

NOTA: Este seed es para el desarrollo y demostración del software.
En producción multi-tenant, cada empresa configura sus propios datos.

Uso:
    python manage.py seed_empresa
    python manage.py seed_empresa --force
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.gestion_estrategica.configuracion.models import (
    EmpresaConfig,
    SedeEmpresa,
)


class Command(BaseCommand):
    help = 'Carga datos de StrateKaz S.A.S. (propietario del software)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Fuerza la carga incluso si ya existen datos',
        )

    def handle(self, *args, **options):
        force = options['force']

        self.stdout.write(self.style.SUCCESS('\n' + '=' * 70))
        self.stdout.write(self.style.SUCCESS('SEED DE STRATEKAZ S.A.S.'))
        self.stdout.write(self.style.SUCCESS('=' * 70 + '\n'))

        try:
            with transaction.atomic():
                empresa_created = self._crear_empresa(force)
                sedes = self._crear_sedes(force)

                self.stdout.write('\n' + '=' * 70)
                self.stdout.write(self.style.SUCCESS('RESUMEN'))
                self.stdout.write('=' * 70)
                self.stdout.write(self.style.SUCCESS(f'Empresa Config: {"Creada" if empresa_created else "Ya existía"}'))
                self.stdout.write(self.style.SUCCESS(f'Sedes: {sedes}'))
                self.stdout.write('\n' + self.style.SUCCESS('[COMPLETADO] Seed de StrateKaz exitoso\n'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n[ERROR] {str(e)}\n'))
            raise

    def _crear_empresa(self, force):
        """Crea la configuración de StrateKaz S.A.S."""
        self.stdout.write('Configurando StrateKaz S.A.S...')

        existing = EmpresaConfig.get_instance()
        if existing and not force:
            self.stdout.write(self.style.WARNING(f'  Ya existe: {existing.razon_social}'))
            return False

        if existing:
            self.stdout.write(self.style.WARNING('  Eliminando empresa existente...'))
            existing.delete()

        empresa = EmpresaConfig(
            nit='901000000-0',
            razon_social='StrateKaz S.A.S.',
            separador_miles='.',
            separador_decimales=',',
        )
        empresa.save()

        self.stdout.write(self.style.SUCCESS(f'  + Empresa creada: {empresa.razon_social}'))
        return True

    def _crear_sedes(self, force):
        """Crea la sede principal de StrateKaz"""
        self.stdout.write('Creando sedes...')

        if SedeEmpresa.objects.exists() and not force:
            count = SedeEmpresa.objects.count()
            self.stdout.write(self.style.WARNING(f'  Ya existen {count} sedes'))
            return 0

        # H-SC-10: ciudad es FK (nullable), departamento CharField eliminado.
        # Dejamos ciudad NULL y que el admin la asigne desde UI.
        sedes = [
            {
                'codigo': 'SEDE-PRINCIPAL',
                'nombre': 'Sede Principal StrateKaz',
                'direccion': 'Por definir',
                'es_sede_principal': True,
            },
        ]

        creados = 0
        for sede_data in sedes:
            obj, created = SedeEmpresa.objects.update_or_create(
                codigo=sede_data['codigo'],
                defaults=sede_data
            )
            if created:
                creados += 1
                self.stdout.write(f'  + {sede_data["codigo"]} - {sede_data["nombre"]}')

        self.stdout.write(self.style.SUCCESS(f'  Sedes creadas: {creados}'))
        return creados
