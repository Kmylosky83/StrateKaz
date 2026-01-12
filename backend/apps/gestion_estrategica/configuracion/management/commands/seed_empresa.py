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
            # Datos fiscales de StrateKaz
            nit='901000000-0',  # NIT de ejemplo - actualizar con el real
            razon_social='StrateKaz S.A.S.',
            nombre_comercial='StrateKaz',
            representante_legal='Por Definir',
            tipo_sociedad='SAS',
            regimen_tributario='COMUN',
            actividad_economica='6201',  # Desarrollo de software
            descripcion_actividad='Desarrollo de sistemas de gestión empresarial',

            # Ubicación (Bogotá como sede principal)
            direccion_fiscal='Por definir',
            ciudad='Bogotá',
            departamento='CUNDINAMARCA',
            telefono_principal='6011234567',
            email_corporativo='info@stratekaz.com',

            # Configuración regional Colombia
            zona_horaria='America/Bogota',
            formato_fecha='DD/MM/YYYY',
            moneda='COP',
            simbolo_moneda='$',
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

        sedes = [
            {
                'codigo': 'SEDE-PRINCIPAL',
                'nombre': 'Sede Principal StrateKaz',
                'tipo_sede': 'SEDE_PRINCIPAL',
                'direccion': 'Por definir',
                'ciudad': 'Bogotá',
                'departamento': 'CUNDINAMARCA',
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
