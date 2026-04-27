"""
H-SC-RUTA-02 (2026-04-26 refactor 2): cambia FK simple a M2M.

Antes: VoucherRecepcion.voucher_recoleccion_origen → 1 VoucherRecoleccion.
Ahora: VoucherRecepcion.vouchers_recoleccion → N VoucherRecoleccion (M2M).

Razón: en refactor 2, cada VoucherRecoleccion = 1 parada. Una recepción
consolidada en planta puede vincularse a N vouchers (uno por proveedor
visitado). El usuario aprobó borrar datos legacy.
"""
from django.db import migrations, models


def borrar_vinculos_legacy(apps, schema_editor):
    """Limpia el FK antes de drop (rows ya borradas en sc_recoleccion 0002)."""
    VoucherRecepcion = apps.get_model('sc_recepcion', 'VoucherRecepcion')
    VoucherRecepcion.objects.filter(
        voucher_recoleccion_origen__isnull=False,
    ).update(voucher_recoleccion_origen=None)


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("sc_recepcion", "0008_proveedor_nullable_recoleccion"),
        ("sc_recoleccion", "0002_voucher_atomico_por_parada"),
    ]

    operations = [
        # 1. Limpiar FK legacy (defensivo)
        migrations.RunPython(borrar_vinculos_legacy, reverse_code=reverse_noop),

        # 2. Drop FK simple (índice asociado se va con él)
        migrations.RemoveIndex(
            model_name="voucherrecepcion",
            name="sc_vr_voucher_rec_orig_idx",
        ),
        migrations.RemoveField(
            model_name="voucherrecepcion",
            name="voucher_recoleccion_origen",
        ),

        # 3. Crear M2M
        migrations.AddField(
            model_name="voucherrecepcion",
            name="vouchers_recoleccion",
            field=models.ManyToManyField(
                blank=True,
                related_name="recepciones_consolidadas",
                to="sc_recoleccion.voucherrecoleccion",
                verbose_name="Vouchers de recolección asociados",
                help_text=(
                    "N vouchers de recolección (uno por parada visitada) que "
                    "se consolidaron en esta recepción."
                ),
            ),
        ),
    ]
