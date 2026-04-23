"""
Migración 0005: cleanup de índice huérfano (H-SC-10).

El campo `producto` de VoucherRecepcion fue migrado a VoucherLineaMP en
la migración 0003_voucher_linea_mp, pero el índice creado en 0001_initial
quedó registrado en el estado de Django sin ser eliminado. Esta migración
cierra esa deuda.

IRREVERSIBLE a nivel de estado — el índice original ya no existe en SQL.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('sc_recepcion', '0004_voucher_ruta_recoleccion'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='voucherrecepcion',
            name='supply_chai_product_1614fb_idx',
        ),
    ]
