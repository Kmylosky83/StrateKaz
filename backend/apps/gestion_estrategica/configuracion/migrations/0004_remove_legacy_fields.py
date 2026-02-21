"""
Remove deprecated legacy fields:
- SedeEmpresa.tipo_sede_legacy (replaced by tipo_sede FK)
- IntegracionExterna.tipo_servicio_legacy (replaced by tipo_servicio FK)
- IntegracionExterna.proveedor_legacy (replaced by proveedor FK)
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0003_alter_empresaconfig_options_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='sedeempresa',
            name='tipo_sede_legacy',
        ),
        migrations.RemoveField(
            model_name='integracionexterna',
            name='tipo_servicio_legacy',
        ),
        migrations.RemoveField(
            model_name='integracionexterna',
            name='proveedor_legacy',
        ),
    ]
