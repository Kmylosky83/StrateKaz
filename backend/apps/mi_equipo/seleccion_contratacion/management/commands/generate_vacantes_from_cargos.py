"""
Management command para generar VacanteActiva desde Cargos existentes.

Uso:
    python manage.py generate_vacantes_from_cargos

Crea una VacanteActiva por cada Cargo que:
  - NO sea de sistema (is_system=False)
  - Tenga cantidad_posiciones >= 1
  - NO tenga ya una VacanteActiva vinculada (idempotente)

Replica la misma logica del signal auto_crear_vacante_desde_cargo
pero para cargos que ya existian antes de implementar el signal.
"""
import logging

from django.core.management.base import BaseCommand
from django.utils import timezone

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Genera VacanteActiva para Cargos existentes que no tengan vacante vinculada'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Solo muestra lo que se haría sin crear registros',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        from apps.core.models import Cargo
        from apps.mi_equipo.seleccion_contratacion.models import (
            VacanteActiva,
            TipoContrato,
        )
        from apps.core.base_models.mixins import get_tenant_empresa

        empresa = get_tenant_empresa(auto_create=True)
        if not empresa:
            self.stdout.write(self.style.ERROR(
                '  No se encontro EmpresaConfig. Abortando.'
            ))
            return

        # Tipo de contrato por defecto
        tipo_contrato = TipoContrato.objects.filter(is_active=True).first()
        if not tipo_contrato:
            self.stdout.write(self.style.ERROR(
                '  No hay TipoContrato activo configurado. Cree uno primero.'
            ))
            return

        # Cargos elegibles: no sistema, con posiciones, sin vacante vinculada
        cargos = Cargo.objects.filter(
            is_system=False,
            cantidad_posiciones__gte=1,
        ).exclude(
            vacantes_activas__isnull=False
        ).select_related('area')

        total = cargos.count()

        if total == 0:
            self.stdout.write(self.style.WARNING(
                '  No hay cargos pendientes de vacante. Todos ya tienen una VacanteActiva vinculada.'
            ))
            return

        self.stdout.write(self.style.MIGRATE_HEADING(
            f'\n  Generando vacantes para {total} cargo(s)...\n'
        ))

        created_count = 0
        year = timezone.now().year

        for cargo in cargos:
            # Generar codigo unico
            ultimo = VacanteActiva.objects.filter(
                codigo_vacante__startswith=f'VAC-{year}-'
            ).order_by('-codigo_vacante').first()

            if ultimo:
                try:
                    num = int(ultimo.codigo_vacante.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    num = 1
            else:
                num = 1

            codigo = f'VAC-{year}-{num:04d}'

            # Construir requisitos desde el cargo
            requisitos = []
            if hasattr(cargo, 'nivel_educativo') and cargo.nivel_educativo:
                requisitos.append(f'Educacion: {cargo.get_nivel_educativo_display()}')
            if hasattr(cargo, 'experiencia_requerida') and cargo.experiencia_requerida:
                requisitos.append(f'Experiencia: {cargo.get_experiencia_requerida_display()}')

            area_nombre = cargo.area.name if cargo.area else ''

            if dry_run:
                self.stdout.write(
                    f'  [DRY RUN] Cargo: {cargo.name} ({cargo.code}) '
                    f'-> {codigo} ({cargo.cantidad_posiciones} posiciones)'
                )
            else:
                try:
                    VacanteActiva.objects.create(
                        empresa=empresa,
                        cargo=cargo,
                        codigo_vacante=codigo,
                        titulo=cargo.name,
                        cargo_requerido=cargo.name,
                        area=area_nombre,
                        descripcion=cargo.objetivo_cargo or f'Posicion de {cargo.name}',
                        requisitos_minimos='\n'.join(requisitos) if requisitos else 'Ver manual del cargo',
                        funciones_principales=cargo.objetivo_cargo or 'Ver manual del cargo',
                        tipo_contrato=tipo_contrato,
                        numero_posiciones=cargo.cantidad_posiciones,
                        estado='abierta',
                        prioridad='media',
                        modalidad='presencial',
                        horario='Lunes a Viernes 8:00 AM - 5:00 PM',
                        ubicacion=area_nombre or 'Por definir',
                        responsable_proceso_id=cargo.created_by_id,
                    )
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(
                        f'  + {codigo} -> {cargo.name} ({cargo.cantidad_posiciones} posiciones)'
                    ))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f'  x Error en {cargo.name}: {e}'
                    ))

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'\n  [DRY RUN] Se crearian {total} vacante(s). '
                f'Ejecute sin --dry-run para aplicar.\n'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'\n  COMPLETADO: {created_count}/{total} vacante(s) creada(s).\n'
            ))
