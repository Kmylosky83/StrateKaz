"""Seed de TipoDocumento para Supply Chain.

Crea (idempotente, get_or_create por codigo) los tipos de documento usados
por Supply Chain para archivar registros operativos en Gestion Documental:

  - VOUCHER_RECEPCION_SC      Vouchers de recepcion en planta.
  - VOUCHER_RECOLEC_SC    Vouchers de recoleccion en ruta.
  - LIQUIDACION_SC            Liquidaciones a productores/proveedores.

Categoria FORMULARIO (registros operativos, no documentos normativos del SGI).
"""
from django.core.management.base import BaseCommand
from django.apps import apps as django_apps


TIPOS_SC = [
    {
        'codigo': 'VOUCHER_RECEPCION_SC',
        'nombre': 'Voucher de Recepcion (SC)',
        'descripcion': (
            'Voucher emitido al recibir materia prima en planta. '
            'Generado automaticamente al completar la recepcion en Supply Chain.'
        ),
        'nivel_documento': 'OPERATIVO',
        'prefijo_codigo': 'VRP',
        'categoria': 'FORMULARIO',
        'requiere_aprobacion': False,
        'requiere_firma': False,
        'tiempo_retencion_años': 5,
        'color_identificacion': '#10B981',
        'nivel_seguridad_firma': 1,
    },
    {
        'codigo': 'VOUCHER_RECOLEC_SC',
        'nombre': 'Voucher de Recoleccion (SC)',
        'descripcion': (
            'Voucher emitido al recolectar materia prima al productor en ruta. '
            'Generado automaticamente al completar el voucher de recoleccion en Supply Chain.'
        ),
        'nivel_documento': 'OPERATIVO',
        'prefijo_codigo': 'VRC',
        'categoria': 'FORMULARIO',
        'requiere_aprobacion': False,
        'requiere_firma': False,
        'tiempo_retencion_años': 5,
        'color_identificacion': '#0EA5E9',
        'nivel_seguridad_firma': 1,
    },
    {
        'codigo': 'LIQUIDACION_SC',
        'nombre': 'Liquidacion (SC)',
        'descripcion': (
            'Liquidacion al productor/proveedor de un periodo. '
            'Generada automaticamente al completar la liquidacion en Supply Chain.'
        ),
        'nivel_documento': 'OPERATIVO',
        'prefijo_codigo': 'LIQ',
        'categoria': 'FORMULARIO',
        'requiere_aprobacion': False,
        'requiere_firma': False,
        'tiempo_retencion_años': 10,
        'color_identificacion': '#8B5CF6',
        'nivel_seguridad_firma': 1,
    },
]


class Command(BaseCommand):
    help = 'Seed idempotente de TipoDocumento para Supply Chain (3 tipos).'

    def handle(self, *args, **opts):
        try:
            TipoDocumento = django_apps.get_model('gestion_documental', 'TipoDocumento')
        except LookupError:
            self.stdout.write(self.style.ERROR(
                'App gestion_documental no instalada en este tenant. Skip.'
            ))
            return

        creados = 0
        existentes = 0
        for data in TIPOS_SC:
            obj, created = TipoDocumento.objects.get_or_create(
                codigo=data['codigo'],
                defaults=data,
            )
            if created:
                creados += 1
                self.stdout.write(self.style.SUCCESS(
                    f'  [created] {obj.codigo} - {obj.nombre}'
                ))
            else:
                existentes += 1
                self.stdout.write(f'  [exists]  {obj.codigo} - {obj.nombre}')

        self.stdout.write(self.style.SUCCESS(
            f'Seed TipoDocumento SC: {creados} creados, {existentes} ya existian.'
        ))
