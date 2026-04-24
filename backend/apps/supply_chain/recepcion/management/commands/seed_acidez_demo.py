"""
Seed demo para QC configurable: Parámetro "Acidez" + 6 rangos clásicos
del negocio de acopio de grasas (Tipo A/B/B-II/B-III/B-IV/C).

Este comando es idempotente — usa update_or_create por code.
Debe correrse dentro del schema del tenant (NO en public):

    # Schema específico
    python manage.py tenant_command seed_acidez_demo --schema=tenant_demo

    # Todos los tenants
    python manage.py seed_acidez_demo  # dentro de un schema con activate()

H-SC-11 Fase 1.
"""
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Crea el parámetro Acidez + 6 rangos (Tipo A..C) en el tenant actual.'

    @transaction.atomic
    def handle(self, *args, **options):
        from apps.supply_chain.recepcion.models import (
            ParametroCalidad,
            RangoCalidad,
        )

        param, created = ParametroCalidad.objects.update_or_create(
            code='ACIDEZ',
            defaults={
                'name': 'Acidez',
                'description': (
                    'Porcentaje de acidez libre medido al recibir materia '
                    'prima. Clasifica el tipo del lote (Tipo A/B/C).'
                ),
                'unit': '%',
                'decimals': 2,
                'is_active': True,
                'order': 10,
            },
        )
        label = 'CREADO' if created else 'ACTUALIZADO'
        self.stdout.write(self.style.SUCCESS(
            f'Parámetro ACIDEZ {label} (id={param.pk})'
        ))

        rangos = [
            {
                'code': 'TIPO_A', 'name': 'Tipo A',
                'min_value': Decimal('1.0000'), 'max_value': Decimal('5.0000'),
                'color_hex': '#10B981', 'order': 1,
            },
            {
                'code': 'TIPO_B', 'name': 'Tipo B',
                'min_value': Decimal('5.0001'), 'max_value': Decimal('8.0000'),
                'color_hex': '#22C55E', 'order': 2,
            },
            {
                'code': 'TIPO_B_II', 'name': 'Tipo B-II',
                'min_value': Decimal('8.0001'), 'max_value': Decimal('10.0000'),
                'color_hex': '#EAB308', 'order': 3,
            },
            {
                'code': 'TIPO_B_III', 'name': 'Tipo B-III',
                'min_value': Decimal('10.0001'), 'max_value': Decimal('15.0000'),
                'color_hex': '#F59E0B', 'order': 4,
            },
            {
                'code': 'TIPO_B_IV', 'name': 'Tipo B-IV',
                'min_value': Decimal('15.0001'), 'max_value': Decimal('20.0000'),
                'color_hex': '#F97316', 'order': 5,
            },
            {
                'code': 'TIPO_C', 'name': 'Tipo C',
                'min_value': Decimal('20.0001'), 'max_value': None,
                'color_hex': '#EF4444', 'order': 6,
            },
        ]

        created_count = 0
        updated_count = 0
        for data in rangos:
            _, was_created = RangoCalidad.objects.update_or_create(
                parameter=param,
                code=data['code'],
                defaults={
                    'name': data['name'],
                    'min_value': data['min_value'],
                    'max_value': data['max_value'],
                    'color_hex': data['color_hex'],
                    'order': data['order'],
                    'is_active': True,
                },
            )
            if was_created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Rangos: {created_count} creados | {updated_count} actualizados'
        ))
