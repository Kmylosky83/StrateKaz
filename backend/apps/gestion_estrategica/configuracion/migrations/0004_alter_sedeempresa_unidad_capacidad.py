"""
AlterField: SedeEmpresa.unidad_capacidad pasa de apuntar a
organizacion.UnidadMedida (legacy) a catalogo_productos.UnidadMedida
(canonico CT-layer).

Los IDs ya fueron reasignados en catalogo_productos.0006 (data migration).
Esta migracion solo cambia el target de la FK a nivel schema.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0003_unify_sede_unidadnegocio'),
        ('catalogo_productos', '0006_migrar_unidades_desde_legacy'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sedeempresa',
            name='unidad_capacidad',
            field=models.ForeignKey(
                blank=True,
                help_text='Unidad de medida de la capacidad (ej: kg, ton, m³, pallets)',
                null=True,
                on_delete=models.deletion.PROTECT,
                related_name='sedes_capacidad',
                to='catalogo_productos.unidadmedida',
                verbose_name='Unidad de Capacidad',
            ),
        ),
    ]
