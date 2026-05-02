"""
Migración 0018: Agrega Proveedor.sede_empresa_origen (OneToOneField nullable).

H-SC-05: cuando una SedeEmpresa tiene es_proveedor_interno=True, un signal
crea automáticamente un Proveedor espejo apuntando a esta FK.
La relación es 1:1 (una sede → un solo proveedor espejo).
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('infra_catalogo_productos', '0017_backfill_proveedor_modalidad_desde_precios'),
        ('configuracion', '0005_sede_ruta_recoleccion'),
    ]

    operations = [
        migrations.AddField(
            model_name='proveedor',
            name='sede_empresa_origen',
            field=models.OneToOneField(
                blank=True,
                help_text='Sede interna que origina este proveedor espejo (H-SC-05). Gestionado automáticamente.',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='proveedor_espejo',
                to='configuracion.sedeempresa',
                verbose_name='Sede de origen',
            ),
        ),
    ]
