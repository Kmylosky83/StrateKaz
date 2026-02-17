"""
Agrega FK proveedor_origen al Colaborador.

Vincula contratistas (prestación de servicios) con su firma/proveedor de origen.
Ejemplo: "Auditores & Asociados SAS" envía al "Dr. Carlos Pérez" como Revisor Fiscal.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('colaboradores', '0002_initial'),
        ('gestion_proveedores', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='colaborador',
            name='proveedor_origen',
            field=models.ForeignKey(
                blank=True,
                help_text='Empresa que envía al contratista (solo aplica para prestación de servicios)',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='contratistas',
                to='gestion_proveedores.proveedor',
                verbose_name='Proveedor / Firma de Origen',
            ),
        ),
    ]
