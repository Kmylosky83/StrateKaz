"""
Comando de Gestión: Cargar Unidades de Medida del Sistema

Carga las unidades de medida predefinidas del sistema en la base de datos.
Este comando es idempotente (puede ejecutarse múltiples veces sin duplicar datos).

Uso:
    python manage.py cargar_unidades_sistema
    python manage.py cargar_unidades_sistema --force
"""
from django.core.management.base import BaseCommand
# Modelo migrado a organizacion
from apps.gestion_estrategica.organizacion.models_unidades import UnidadMedida


class Command(BaseCommand):
    help = 'Carga las unidades de medida predefinidas del sistema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Fuerza la carga incluso si ya existen unidades',
        )

    def handle(self, *args, **options):
        force = options['force']

        # Banner
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 70))
        self.stdout.write(self.style.SUCCESS('CARGA DE UNIDADES DE MEDIDA DEL SISTEMA'))
        self.stdout.write(self.style.SUCCESS('=' * 70 + '\n'))

        # Verificar si ya existen unidades
        total_existentes = UnidadMedida.objects.filter(es_sistema=True).count()

        if total_existentes > 0 and not force:
            self.stdout.write(
                self.style.WARNING(
                    f'Ya existen {total_existentes} unidades del sistema.\n'
                    'Use --force para forzar la recarga.\n'
                )
            )
            return

        # Cargar unidades
        self.stdout.write('Cargando unidades del sistema...\n')

        try:
            creadas = UnidadMedida.cargar_unidades_sistema()

            self.stdout.write('\n' + '=' * 70)
            self.stdout.write(self.style.SUCCESS('RESUMEN'))
            self.stdout.write('=' * 70)
            self.stdout.write(self.style.SUCCESS(f'Unidades creadas: {creadas}'))
            self.stdout.write(self.style.SUCCESS(f'Total unidades del sistema: {UnidadMedida.objects.filter(es_sistema=True).count()}'))
            self.stdout.write('')

            # Mostrar unidades por categoría
            self.stdout.write('\n' + self.style.SUCCESS('UNIDADES CARGADAS POR CATEGORÍA:'))
            self.stdout.write('=' * 70)

            categorias = UnidadMedida.objects.filter(
                es_sistema=True
            ).values_list('categoria', flat=True).distinct()

            for categoria in categorias:
                unidades = UnidadMedida.objects.filter(
                    es_sistema=True,
                    categoria=categoria
                ).order_by('orden_display')

                categoria_display = dict(UnidadMedida._meta.get_field('categoria').choices)[categoria]
                self.stdout.write(f'\n{categoria_display}:')

                for unidad in unidades:
                    base_info = ''
                    if unidad.unidad_base:
                        base_info = f' (base: {unidad.unidad_base.simbolo}, factor: {unidad.factor_conversion})'

                    self.stdout.write(
                        f'  • {unidad.nombre} ({unidad.simbolo}) - {unidad.codigo}{base_info}'
                    )

            self.stdout.write('\n' + self.style.SUCCESS('[COMPLETADO] Unidades cargadas exitosamente\n'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n✗ Error cargando unidades: {str(e)}\n'))
            raise
