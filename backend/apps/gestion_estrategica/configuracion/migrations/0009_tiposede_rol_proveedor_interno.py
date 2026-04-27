"""
Migración 0009: agrega choice PROVEEDOR_INTERNO a TipoSede.rol_operacional.

H-SC-05: marca sedes que abastecen a otras como unidades propias y se
sincronizan a un Proveedor en CT vía signal post_save (configuracion/signals.py).

NO se re-introduce SedeEmpresa.es_proveedor_interno (eliminado en H-SC-10);
el rol vive en TipoSede.rol_operacional.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0008_remove_switches_redundantes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tiposede',
            name='rol_operacional',
            field=models.CharField(
                choices=[
                    ('OFICINA', 'Oficina Administrativa'),
                    ('PLANTA', 'Planta'),
                    ('CENTRO_ACOPIO', 'Centro de Acopio'),
                    ('BODEGA', 'Bodega'),
                    (
                        'PROVEEDOR_INTERNO',
                        'Proveedor interno (unidad propia que abastece a otras sedes)',
                    ),
                    ('OTRO', 'Otro'),
                ],
                default='OTRO',
                help_text=(
                    'Rol operativo del tipo de sede. Reemplaza el campo '
                    'SedeEmpresa.tipo_unidad (H-SC-10).'
                ),
                max_length=20,
                verbose_name='Rol operacional',
            ),
        ),
    ]
