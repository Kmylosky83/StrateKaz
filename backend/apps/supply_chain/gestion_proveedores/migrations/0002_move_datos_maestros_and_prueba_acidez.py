"""
Migración SeparateDatabaseAndState: Eliminar modelos movidos

Elimina del estado de gestion_proveedores:
- TipoDocumentoIdentidad → ahora en core
- Departamento → ahora en core
- Ciudad → ahora en core
- PruebaAcidez → ahora en production_ops.recepcion

También actualiza las FKs de Proveedor y UnidadNegocio para apuntar
a los modelos en core en lugar de gestion_proveedores.

Solo operación de estado — las tablas DB no se tocan.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_proveedores', '0001_initial'),
        ('core', '0012_datos_maestros_from_supply_chain'),
    ]

    operations = [
        # 1. Actualizar FKs en UnidadNegocio y Proveedor para apuntar a core
        migrations.SeparateDatabaseAndState(
            state_operations=[
                # UnidadNegocio.departamento → core.Departamento
                migrations.AlterField(
                    model_name='unidadnegocio',
                    name='departamento',
                    field=models.ForeignKey(
                        blank=True,
                        help_text='Departamento de Colombia (desde catálogo dinámico)',
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='unidades_negocio',
                        to='core.departamento',
                        verbose_name='Departamento',
                    ),
                ),
                # Proveedor.tipo_documento → core.TipoDocumentoIdentidad
                migrations.AlterField(
                    model_name='proveedor',
                    name='tipo_documento',
                    field=models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='proveedores',
                        to='core.tipodocumentoidentidad',
                        verbose_name='Tipo de documento',
                    ),
                ),
                # Proveedor.departamento → core.Departamento
                migrations.AlterField(
                    model_name='proveedor',
                    name='departamento',
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='proveedores',
                        to='core.departamento',
                        verbose_name='Departamento',
                    ),
                ),
            ],
            database_operations=[],
        ),

        # 2. Eliminar modelos del estado de gestion_proveedores
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name='Ciudad'),
                migrations.DeleteModel(name='Departamento'),
                migrations.DeleteModel(name='TipoDocumentoIdentidad'),
                migrations.DeleteModel(name='PruebaAcidez'),
            ],
            database_operations=[],
        ),
    ]
