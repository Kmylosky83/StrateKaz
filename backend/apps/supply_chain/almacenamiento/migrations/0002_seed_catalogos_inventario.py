"""
Migración 0002: seed de catálogos base de inventario (H-SC-11).

Crea los registros fundamentales en `TipoMovimientoInventario` y
`EstadoInventario` que el signal de recepción requiere para generar
movimientos al aprobar un voucher.

Sin estos registros, `crear_movimiento_inventario_al_aprobar` falla
silenciosamente con `DoesNotExist` y el inventario no se afecta.
"""
from django.db import migrations


TIPOS_MOVIMIENTO = [
    {
        'codigo': 'ENTRADA',
        'nombre': 'Entrada',
        'descripcion': 'Ingreso de producto al almacén (recepción de MP, devoluciones).',
        'afecta_stock': 'POSITIVO',
        'requiere_origen': False,
        'requiere_destino': True,
        'requiere_documento': True,
        'orden': 1,
    },
    {
        'codigo': 'SALIDA',
        'nombre': 'Salida',
        'descripcion': 'Egreso de producto del almacén (consumo, venta, despacho).',
        'afecta_stock': 'NEGATIVO',
        'requiere_origen': True,
        'requiere_destino': False,
        'requiere_documento': True,
        'orden': 2,
    },
    {
        'codigo': 'TRASLADO',
        'nombre': 'Traslado',
        'descripcion': 'Movimiento entre dos almacenes dentro del mismo tenant.',
        'afecta_stock': 'NEUTRO',
        'requiere_origen': True,
        'requiere_destino': True,
        'requiere_documento': True,
        'orden': 3,
    },
    {
        'codigo': 'AJUSTE',
        'nombre': 'Ajuste',
        'descripcion': 'Corrección manual de inventario por conteo físico u otra razón.',
        'afecta_stock': 'NEUTRO',
        'requiere_origen': False,
        'requiere_destino': True,
        'requiere_documento': False,
        'orden': 4,
    },
    {
        'codigo': 'DEVOLUCION',
        'nombre': 'Devolución',
        'descripcion': 'Reintegro de producto al almacén desde el cliente o proveedor.',
        'afecta_stock': 'POSITIVO',
        'requiere_origen': False,
        'requiere_destino': True,
        'requiere_documento': True,
        'orden': 5,
    },
]


ESTADOS_INVENTARIO = [
    {
        'codigo': 'DISPONIBLE',
        'nombre': 'Disponible',
        'descripcion': 'Inventario libre para uso, venta o consumo.',
        'permite_uso': True,
        'color_hex': '#10B981',
        'orden': 1,
    },
    {
        'codigo': 'RESERVADO',
        'nombre': 'Reservado',
        'descripcion': 'Comprometido a una orden o proceso, no disponible para otros usos.',
        'permite_uso': False,
        'color_hex': '#F59E0B',
        'orden': 2,
    },
    {
        'codigo': 'BLOQUEADO',
        'nombre': 'Bloqueado',
        'descripcion': 'Retenido por razones administrativas o calidad, no disponible.',
        'permite_uso': False,
        'color_hex': '#EF4444',
        'orden': 3,
    },
    {
        'codigo': 'EN_CUARENTENA',
        'nombre': 'En Cuarentena',
        'descripcion': 'Pendiente de validación de calidad antes de liberar.',
        'permite_uso': False,
        'color_hex': '#8B5CF6',
        'orden': 4,
    },
]


def seed_catalogos_forward(apps, schema_editor):
    """Crea los registros base (idempotente via update_or_create por codigo)."""
    TipoMovimiento = apps.get_model('almacenamiento', 'TipoMovimientoInventario')
    Estado = apps.get_model('almacenamiento', 'EstadoInventario')

    for tipo_data in TIPOS_MOVIMIENTO:
        TipoMovimiento.objects.update_or_create(
            codigo=tipo_data['codigo'],
            defaults={
                'nombre': tipo_data['nombre'],
                'descripcion': tipo_data['descripcion'],
                'afecta_stock': tipo_data['afecta_stock'],
                'requiere_origen': tipo_data['requiere_origen'],
                'requiere_destino': tipo_data['requiere_destino'],
                'requiere_documento': tipo_data['requiere_documento'],
                'orden': tipo_data['orden'],
                'is_active': True,
            },
        )

    for estado_data in ESTADOS_INVENTARIO:
        Estado.objects.update_or_create(
            codigo=estado_data['codigo'],
            defaults={
                'nombre': estado_data['nombre'],
                'descripcion': estado_data['descripcion'],
                'permite_uso': estado_data['permite_uso'],
                'color_hex': estado_data['color_hex'],
                'orden': estado_data['orden'],
                'is_active': True,
            },
        )


def seed_catalogos_reverse(apps, schema_editor):
    """Noop — no eliminamos los seeds al revertir (puede romper referential integrity)."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('almacenamiento', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_catalogos_forward, seed_catalogos_reverse),
    ]
