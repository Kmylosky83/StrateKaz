"""
Comando de Gestión: Seed de Configuración del Sistema

Carga datos base del sistema para:
- TipoSede: Tipos de sedes (Sede Principal, Planta, Almacén, etc.)
- TipoServicioIntegracion: Tipos de servicios de integración
- ProveedorIntegracion: Proveedores de servicios externos
- UnidadMedida: Unidades de medida del sistema

Estos son datos del SISTEMA que vienen precargados.
Cada empresa puede agregar sus propios tipos adicionales.

Uso:
    python manage.py seed_configuracion_sistema
    python manage.py seed_configuracion_sistema --force
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.gestion_estrategica.configuracion.models import (
    TipoSede,
    TipoServicioIntegracion,
    ProveedorIntegracion,
)
from apps.gestion_estrategica.configuracion.models_unidades import UnidadMedida


class Command(BaseCommand):
    help = 'Carga datos base del sistema (tipos de sede, servicios, proveedores, unidades)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Fuerza la actualización de datos existentes',
        )

    def handle(self, *args, **options):
        force = options['force']

        self.stdout.write(self.style.SUCCESS('\n' + '=' * 70))
        self.stdout.write(self.style.SUCCESS('SEED DE CONFIGURACIÓN DEL SISTEMA'))
        self.stdout.write(self.style.SUCCESS('=' * 70 + '\n'))

        try:
            with transaction.atomic():
                # 1. Cargar tipos de sede
                tipos_sede = self._cargar_tipos_sede()

                # 2. Cargar tipos de servicio de integración
                tipos_servicio = self._cargar_tipos_servicio()

                # 3. Cargar proveedores de integración
                proveedores = self._cargar_proveedores()

                # 4. Cargar unidades de medida
                unidades = self._cargar_unidades()

                # Resumen
                self.stdout.write('\n' + '=' * 70)
                self.stdout.write(self.style.SUCCESS('RESUMEN'))
                self.stdout.write('=' * 70)
                self.stdout.write(f'  Tipos de Sede: {tipos_sede} creados')
                self.stdout.write(f'  Tipos de Servicio: {tipos_servicio} creados')
                self.stdout.write(f'  Proveedores: {proveedores} creados')
                self.stdout.write(f'  Unidades de Medida: {unidades} creadas')
                self.stdout.write('\n' + self.style.SUCCESS(
                    '[COMPLETADO] Configuración del sistema cargada\n'
                ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n[ERROR] {str(e)}\n'))
            raise

    def _cargar_tipos_sede(self):
        """Carga tipos de sede del sistema"""
        self.stdout.write('Cargando tipos de sede...')
        creados = TipoSede.cargar_tipos_sistema()
        total = TipoSede.objects.filter(es_sistema=True).count()
        self.stdout.write(self.style.SUCCESS(
            f'  + {creados} nuevos tipos de sede ({total} total del sistema)'
        ))
        return creados

    def _cargar_tipos_servicio(self):
        """Carga tipos de servicio de integración del sistema"""
        self.stdout.write('Cargando tipos de servicio de integración...')
        creados = TipoServicioIntegracion.cargar_tipos_sistema()
        total = TipoServicioIntegracion.objects.filter(es_sistema=True).count()
        self.stdout.write(self.style.SUCCESS(
            f'  + {creados} nuevos tipos de servicio ({total} total del sistema)'
        ))
        return creados

    def _cargar_proveedores(self):
        """Carga proveedores de integración del sistema"""
        self.stdout.write('Cargando proveedores de integración...')
        creados = ProveedorIntegracion.cargar_proveedores_sistema()
        total = ProveedorIntegracion.objects.filter(es_sistema=True).count()
        self.stdout.write(self.style.SUCCESS(
            f'  + {creados} nuevos proveedores ({total} total del sistema)'
        ))
        return creados

    def _cargar_unidades(self):
        """Carga unidades de medida del sistema"""
        self.stdout.write('Cargando unidades de medida...')
        creados = UnidadMedida.cargar_unidades_sistema()
        total = UnidadMedida.objects.filter(es_sistema=True).count()
        self.stdout.write(self.style.SUCCESS(
            f'  + {creados} nuevas unidades de medida ({total} total del sistema)'
        ))
        return creados
