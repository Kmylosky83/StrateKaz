"""
Migración 0008: eliminar switches redundantes de SedeEmpresa (H-SC-10.2).

Elimina:
- `es_unidad_negocio` — ahora derivado de `tipo_sede.rol_operacional IN (PLANTA, CENTRO_ACOPIO, BODEGA)`.
- `es_centro_acopio` — ahora derivado de si la sede tiene almacenes con `permite_recepcion=True`.

También elimina el índice en `es_unidad_negocio`.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0007_sedeempresa_geografia_y_cleanup'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='sedeempresa',
            name='configuraci_es_unid_872652_idx',
        ),
        migrations.RemoveField(
            model_name='sedeempresa',
            name='es_unidad_negocio',
        ),
        migrations.RemoveField(
            model_name='sedeempresa',
            name='es_centro_acopio',
        ),
    ]
