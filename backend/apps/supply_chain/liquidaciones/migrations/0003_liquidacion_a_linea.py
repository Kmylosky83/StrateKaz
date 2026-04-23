"""
Migración S3.2: Liquidacion pasa de OneToOne a VoucherRecepcion
a OneToOne a VoucherLineaMP.

1. Agrega campo `linea` nullable.
2. Data migration: vincula cada Liquidacion con la VoucherLineaMP
   correspondiente a su antiguo `voucher`.
3. Hace `linea` obligatorio (NOT NULL).
4. Elimina el campo `voucher`.
"""
import django.db.models.deletion
from django.db import migrations, models


def migrar_liquidacion_a_linea(apps, schema_editor):
    """
    Vincula cada Liquidacion con la única VoucherLineaMP
    del voucher que tenía antes.
    """
    Liquidacion = apps.get_model('liquidaciones', 'Liquidacion')
    VoucherLineaMP = apps.get_model('sc_recepcion', 'VoucherLineaMP')
    for liq in Liquidacion.objects.select_related('voucher').all():
        try:
            linea = VoucherLineaMP.objects.get(voucher_id=liq.voucher_id)
            liq.linea_id = linea.id
            liq.save(update_fields=['linea_id'])
        except VoucherLineaMP.DoesNotExist:
            # Liquidacion sin línea — skip silencioso (dato huérfano)
            pass
        except VoucherLineaMP.MultipleObjectsReturned:
            # Si hay múltiples líneas, toma la primera
            linea = VoucherLineaMP.objects.filter(voucher_id=liq.voucher_id).first()
            liq.linea_id = linea.id
            liq.save(update_fields=['linea_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('liquidaciones', '0002_initial'),
        ('sc_recepcion', '0003_voucher_linea_mp'),
    ]

    operations = [
        # 1. Agregar campo linea nullable para poder hacer la data migration
        migrations.AddField(
            model_name='liquidacion',
            name='linea',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='liquidacion',
                to='sc_recepcion.voucherlineamp',
                verbose_name='Línea de voucher de recepción',
            ),
        ),

        # 2. Data migration: vincular con la línea correcta
        migrations.RunPython(migrar_liquidacion_a_linea, migrations.RunPython.noop),

        # 3. Hacer linea obligatoria (NOT NULL)
        migrations.AlterField(
            model_name='liquidacion',
            name='linea',
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='liquidacion',
                to='sc_recepcion.voucherlineamp',
                verbose_name='Línea de voucher de recepción',
            ),
        ),

        # 4. Eliminar índice sobre voucher antes de eliminar el campo
        migrations.RemoveIndex(
            model_name='liquidacion',
            name='supply_chai_voucher_2c5b60_idx',
        ),

        # 5. Eliminar el campo voucher (ahora apuntamos a la línea)
        migrations.RemoveField(
            model_name='liquidacion',
            name='voucher',
        ),

        # 6. Agregar índice sobre linea
        migrations.AddIndex(
            model_name='liquidacion',
            index=models.Index(fields=['linea'], name='supply_chai_linea_liq_idx'),
        ),
    ]
