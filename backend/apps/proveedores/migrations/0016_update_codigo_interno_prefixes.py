# Generated migration to update codigo_interno prefixes
# MP for MATERIA_PRIMA_EXTERNO and UNIDAD_NEGOCIO
# PS for PRODUCTO_SERVICIO

from django.db import migrations


def actualizar_prefijos_codigo(apps, schema_editor):
    """
    Actualiza los prefijos de codigo_interno de proveedores existentes:
    - PRV-XXXX con tipo MATERIA_PRIMA_EXTERNO o UNIDAD_NEGOCIO -> MP-XXXX
    - PRV-XXXX con tipo PRODUCTO_SERVICIO -> PS-XXXX
    """
    Proveedor = apps.get_model('proveedores', 'Proveedor')

    # Contadores para cada prefijo
    mp_counter = 1
    ps_counter = 1

    # Procesar todos los proveedores ordenados por id
    proveedores = Proveedor.objects.all().order_by('id')

    for proveedor in proveedores:
        if proveedor.tipo_proveedor == 'PRODUCTO_SERVICIO':
            nuevo_codigo = f'PS-{ps_counter:04d}'
            ps_counter += 1
        else:
            # MATERIA_PRIMA_EXTERNO y UNIDAD_NEGOCIO
            nuevo_codigo = f'MP-{mp_counter:04d}'
            mp_counter += 1

        proveedor.codigo_interno = nuevo_codigo
        proveedor.save(update_fields=['codigo_interno'])


def revertir_prefijos_codigo(apps, schema_editor):
    """
    Revierte los códigos a formato PRV-XXXX
    """
    Proveedor = apps.get_model('proveedores', 'Proveedor')

    counter = 1
    proveedores = Proveedor.objects.all().order_by('id')

    for proveedor in proveedores:
        proveedor.codigo_interno = f'PRV-{counter:04d}'
        proveedor.save(update_fields=['codigo_interno'])
        counter += 1


class Migration(migrations.Migration):

    dependencies = [
        ('proveedores', '0015_add_codigo_interno'),
    ]

    operations = [
        migrations.RunPython(
            actualizar_prefijos_codigo,
            revertir_prefijos_codigo,
        ),
    ]
