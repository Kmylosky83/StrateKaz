"""
H-SC-RUTA-02 (2026-04-26): VoucherRecepcion.proveedor pasa a nullable.

En modalidad RECOLECCION la mercancía viene de la RUTA (no de un proveedor
único). El detalle por productor vive en los N VoucherRecoleccion asociados.
Validación condicional en clean(): proveedor obligatorio solo en modalidades
DIRECTO o TRANSPORTE_INTERNO.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sc_recepcion", "0007_voucher_recoleccion_origen"),
        ("catalogo_productos", "0020_proveedor_drop_sede_empresa_origen"),
    ]

    operations = [
        migrations.AlterField(
            model_name="voucherrecepcion",
            name="proveedor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="vouchers_recepcion",
                to="catalogo_productos.proveedor",
                verbose_name="Proveedor",
                help_text=(
                    "Proveedor que entrega. OPCIONAL en modalidad RECOLECCION "
                    "(la fuente es la ruta + sus vouchers de recolección)."
                ),
            ),
        ),
    ]
