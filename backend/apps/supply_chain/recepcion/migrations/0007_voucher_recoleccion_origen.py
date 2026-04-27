"""
H-SC-RUTA-02 D-1: agrega FK VoucherRecepcion.voucher_recoleccion_origen.

Permite vincular una recepción consolidada en planta con el voucher de
recolección de ruta que la originó (1 ruta → N proveedores → 1 camión).
El inventario sigue entrando con la recepción; el voucher de recolección
es evidencia/detalle para liquidar cada productor por separado.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sc_recepcion", "0006_qc_configurable"),
        ("sc_recoleccion", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="voucherrecepcion",
            name="voucher_recoleccion_origen",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="recepciones_consolidadas",
                to="sc_recoleccion.voucherrecoleccion",
                verbose_name="Voucher de recolección origen",
                help_text=(
                    "Si la mercancía proviene de una salida de ruta, se vincula al "
                    "VoucherRecoleccion del que salió (líneas por productor visitado)."
                ),
            ),
        ),
        migrations.AddIndex(
            model_name="voucherrecepcion",
            index=models.Index(
                fields=["voucher_recoleccion_origen"],
                name="sc_vr_voucher_rec_orig_idx",
            ),
        ),
    ]
