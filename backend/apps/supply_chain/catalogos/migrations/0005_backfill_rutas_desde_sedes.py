"""
Migración 0005: backfill RutaRecoleccion desde SedeEmpresa + mapeo
Proveedor.sede_empresa_origen → Proveedor.ruta_origen (H-SC-10).

Pasos:
  1. Por cada SedeEmpresa con tipo_unidad='RUTA_RECOLECCION', crea una
     RutaRecoleccion (code=sede.codigo o RUTA-<pk>, nombre=sede.nombre,
     es_proveedor_interno=sede.es_proveedor_interno).
  2. Si algún Proveedor tenía sede_empresa_origen apuntando a esa sede-ruta,
     se actualiza a ruta_origen apuntando a la nueva RutaRecoleccion.
     Los Proveedor.sede_empresa_origen que apunten a sedes NO-ruta se
     dejan como están (se limpian cuando sede_empresa_origen se elimine).

Reversibilidad:
  - forwards: idempotente por codigo; si ya existe RutaRecoleccion con ese
    codigo, la reutiliza.
  - backwards: noop (no intentamos recrear sedes a partir de rutas).
"""
from django.db import migrations


def backfill_rutas(apps, schema_editor):
    SedeEmpresa = apps.get_model('configuracion', 'SedeEmpresa')
    RutaRecoleccion = apps.get_model('catalogos', 'RutaRecoleccion')
    Proveedor = apps.get_model('catalogo_productos', 'Proveedor')

    sedes_ruta = SedeEmpresa.objects.filter(tipo_unidad='RUTA_RECOLECCION')
    creadas = 0
    reusadas = 0
    provs_migrados = 0

    for sede in sedes_ruta:
        codigo = (sede.codigo or f'RUTA-{sede.pk}').strip()[:50]
        ruta, created = RutaRecoleccion.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nombre': sede.nombre,
                'descripcion': sede.descripcion or '',
                'es_proveedor_interno': bool(sede.es_proveedor_interno),
                'is_active': bool(sede.is_active),
            },
        )
        if created:
            creadas += 1
        else:
            reusadas += 1

        # Migrar FK en proveedores espejo que apuntaban a esta sede.
        count = Proveedor.objects.filter(
            sede_empresa_origen=sede, ruta_origen__isnull=True
        ).update(ruta_origen=ruta)
        provs_migrados += count

    print(
        f'\n  [H-SC-10 backfill] Sedes-ruta: {sedes_ruta.count()} | '
        f'RutaRecoleccion creadas: {creadas} | reusadas: {reusadas} | '
        f'Proveedores migrados: {provs_migrados}'
    )


def reverse_noop(apps, schema_editor):
    """Noop en reverso: las RutaRecoleccion y FKs persisten."""
    return


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0004_rutarecoleccion'),
        ('catalogo_productos', '0019_proveedor_ruta_origen'),
        ('configuracion', '0006_tiposede_rol_operacional'),
    ]

    operations = [
        migrations.RunPython(backfill_rutas, reverse_noop),
    ]
