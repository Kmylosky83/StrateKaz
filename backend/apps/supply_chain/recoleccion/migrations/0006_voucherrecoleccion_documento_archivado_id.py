"""H-SC-GD-ARCHIVE: agregar campo documento_archivado_id al voucher
para guardar referencia idempotente al Documento creado en Gestion Documental
cuando el voucher pasa a COMPLETADO.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sc_recoleccion', '0005_rename_sc_vrc_prov_fecha_idx_supply_chai_proveed_d8f13f_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='voucherrecoleccion',
            name='documento_archivado_id',
            field=models.IntegerField(
                blank=True,
                help_text='ID del Documento archivado en Gestion Documental al completar.',
                null=True,
                verbose_name='ID documento GD',
            ),
        ),
    ]
