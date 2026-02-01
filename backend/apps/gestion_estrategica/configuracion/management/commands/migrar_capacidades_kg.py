"""
Comando de Gestión: Migrar Capacidades de kg a Sistema Dinámico

Convierte las capacidades almacenadas en el campo deprecated capacidad_almacenamiento_kg
al nuevo sistema dinámico con capacidad_almacenamiento + unidad_capacidad.

Uso:
    python manage.py migrar_capacidades_kg
    python manage.py migrar_capacidades_kg --dry-run
    python manage.py migrar_capacidades_kg --verbose
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from apps.gestion_estrategica.configuracion.models import SedeEmpresa
# Modelo migrado a organizacion
from apps.gestion_estrategica.organizacion.models_unidades import UnidadMedida


class Command(BaseCommand):
    help = 'Migra capacidades de capacidad_almacenamiento_kg al sistema dinámico'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula la migración sin guardar cambios',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Muestra información detallada de cada migración',
        )
        parser.add_argument(
            '--unidad-destino',
            type=str,
            default='KG',
            help='Código de la unidad destino (default: KG)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options['verbose']
        unidad_codigo = options['unidad_destino']

        # Banner
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 70))
        self.stdout.write(self.style.SUCCESS('MIGRACIÓN DE CAPACIDADES - Sistema Dinámico de Unidades'))
        self.stdout.write(self.style.SUCCESS('=' * 70 + '\n'))

        if dry_run:
            self.stdout.write(self.style.WARNING('[MODO DRY-RUN] - No se guardarán cambios\n'))

        # Obtener unidad destino
        try:
            unidad_destino = UnidadMedida.objects.get(
                codigo=unidad_codigo,
                is_active=True,
                deleted_at__isnull=True
            )
            self.stdout.write(
                self.style.SUCCESS(f'Unidad destino: {unidad_destino.nombre} ({unidad_destino.simbolo})\n')
            )
        except UnidadMedida.DoesNotExist:
            raise CommandError(
                f'Unidad "{unidad_codigo}" no encontrada. '
                f'Ejecute primero: python manage.py cargar_unidades_sistema'
            )

        # Obtener sedes con capacidad_almacenamiento_kg pero sin capacidad_almacenamiento
        sedes_a_migrar = SedeEmpresa.objects.filter(
            capacidad_almacenamiento_kg__isnull=False,
            capacidad_almacenamiento__isnull=True,
            deleted_at__isnull=True
        )

        total_sedes = sedes_a_migrar.count()

        if total_sedes == 0:
            self.stdout.write(self.style.SUCCESS('No hay sedes para migrar. Todo está actualizado.\n'))
            return

        self.stdout.write(f'Total de sedes a migrar: {total_sedes}\n')

        # Confirmar
        if not dry_run:
            confirm = input('\n¿Desea continuar con la migración? [s/N]: ')
            if confirm.lower() not in ['s', 'si', 'yes', 'y']:
                self.stdout.write(self.style.WARNING('Migración cancelada.\n'))
                return

        # Migrar
        migradas = 0
        errores = 0

        with transaction.atomic():
            for sede in sedes_a_migrar:
                try:
                    # Convertir capacidad
                    capacidad_kg = sede.capacidad_almacenamiento_kg

                    if verbose:
                        self.stdout.write(
                            f'\nMigrando: {sede.codigo} - {sede.nombre}'
                        )
                        self.stdout.write(
                            f'  Capacidad actual: {capacidad_kg} kg'
                        )

                    # Asignar nuevos valores
                    sede.capacidad_almacenamiento = capacidad_kg
                    sede.unidad_capacidad = unidad_destino

                    if verbose:
                        self.stdout.write(
                            f'  Nueva capacidad: {sede.capacidad_almacenamiento} {unidad_destino.simbolo}'
                        )

                    if not dry_run:
                        sede.save(update_fields=['capacidad_almacenamiento', 'unidad_capacidad'])

                    migradas += 1

                    if verbose:
                        self.stdout.write(self.style.SUCCESS('  ✓ Migrado exitosamente'))

                except Exception as e:
                    errores += 1
                    self.stdout.write(
                        self.style.ERROR(f'\n✗ Error migrando {sede.codigo}: {str(e)}')
                    )

            # Si es dry-run, hacer rollback
            if dry_run:
                transaction.set_rollback(True)

        # Resumen
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(self.style.SUCCESS('RESUMEN DE MIGRACIÓN'))
        self.stdout.write('=' * 70)
        self.stdout.write(f'Total sedes procesadas: {total_sedes}')
        self.stdout.write(self.style.SUCCESS(f'Migradas exitosamente: {migradas}'))

        if errores > 0:
            self.stdout.write(self.style.ERROR(f'Errores: {errores}'))

        if dry_run:
            self.stdout.write('\n' + self.style.WARNING('[DRY-RUN] No se guardaron cambios'))
        else:
            self.stdout.write('\n' + self.style.SUCCESS('[COMPLETADO] Cambios guardados exitosamente'))

        self.stdout.write('')

        # Sugerencias post-migración
        if migradas > 0 and not dry_run:
            self.stdout.write('\n' + self.style.SUCCESS('PRÓXIMOS PASOS:'))
            self.stdout.write('1. Verificar que todas las capacidades se muestren correctamente')
            self.stdout.write('2. Actualizar el frontend para usar el nuevo sistema')
            self.stdout.write('3. Una vez validado, puede eliminar capacidad_almacenamiento_kg en una migración futura')
            self.stdout.write('')
