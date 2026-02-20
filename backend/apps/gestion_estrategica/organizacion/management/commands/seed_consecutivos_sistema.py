"""
Seed command para crear los consecutivos del sistema.

Crea los ConsecutivoConfig base definidos en CONSECUTIVOS_SISTEMA
más los consecutivos adicionales referenciados en módulos de negocio.

Uso:
    python manage.py seed_consecutivos_sistema
"""
from django.core.management.base import BaseCommand
from django.db import transaction


# Consecutivos adicionales referenciados en módulos pero no definidos en el modelo
CONSECUTIVOS_ADICIONALES = [
    {
        'codigo': 'REQUISICION_COMPRA',
        'nombre': 'Requisición de Compra',
        'categoria': 'COMPRAS',
        'prefix': 'RC',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'PROGRAMACION_ABASTECIMIENTO',
        'nombre': 'Programación de Abastecimiento',
        'categoria': 'COMPRAS',
        'prefix': 'PA',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'PRUEBA_ACIDEZ',
        'nombre': 'Prueba de Acidez',
        'categoria': 'CALIDAD',
        'prefix': 'PAC',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'MOVIMIENTO_INV',
        'nombre': 'Movimiento de Inventario',
        'categoria': 'INVENTARIO',
        'prefix': 'MOV',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'PQRS',
        'nombre': 'PQRS',
        'categoria': 'VENTAS',
        'prefix': 'PQR',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'ENCUESTA_SATISFACCION',
        'nombre': 'Encuesta de Satisfacción',
        'categoria': 'VENTAS',
        'prefix': 'ENC',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'RECEPCION_MATERIA_PRIMA',
        'nombre': 'Recepción de Materia Prima',
        'categoria': 'PRODUCCION',
        'prefix': 'RMP',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'LOTE_PRODUCCION',
        'nombre': 'Lote de Producción',
        'categoria': 'PRODUCCION',
        'prefix': 'LOT',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'ACTIVO_PRODUCCION',
        'nombre': 'Activo de Producción',
        'categoria': 'PRODUCCION',
        'prefix': 'ACT',
        'padding': 4,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'EQUIPO_MEDICION',
        'nombre': 'Equipo de Medición',
        'categoria': 'PRODUCCION',
        'prefix': 'EM',
        'padding': 4,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'ORDEN_TRABAJO',
        'nombre': 'Orden de Trabajo',
        'categoria': 'PRODUCCION',
        'prefix': 'OT',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
]


class Command(BaseCommand):
    help = 'Crea los consecutivos del sistema (base + módulos de negocio)'

    def handle(self, *args, **options):
        from apps.gestion_estrategica.organizacion.models_consecutivos import (
            ConsecutivoConfig,
            CONSECUTIVOS_SISTEMA,
        )
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig

        empresa = EmpresaConfig.objects.first()
        if not empresa:
            self.stderr.write(self.style.ERROR('No existe EmpresaConfig en este tenant.'))
            return

        all_consecutivos = CONSECUTIVOS_SISTEMA + CONSECUTIVOS_ADICIONALES
        created = 0
        skipped = 0

        with transaction.atomic():
            for data in all_consecutivos:
                codigo = data['codigo']
                if ConsecutivoConfig.objects.filter(codigo=codigo, empresa_id=empresa.id).exists():
                    skipped += 1
                    continue

                ConsecutivoConfig.objects.create(empresa_id=empresa.id, **data)
                self.stdout.write(self.style.SUCCESS(f'  [OK] {codigo}'))
                created += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nConsecutivos: {created} creados, {skipped} existentes'
        ))
