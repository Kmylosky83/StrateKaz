"""
Migración 0012: Agregar flag `requiere_qc_recepcion` a Producto.

Parte de H-SC-03 (QC obligatorio por producto en Recepción MP).

Política: default=False para todos los productos existentes — no cambia
comportamiento actual. Cada tenant activa el flag manualmente desde UI
producto por producto según su industria.

Sin RunPython — la semántica default=False preserva 100% los vouchers y
flujos de aprobación existentes en producción.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('infra_catalogo_productos', '0011_proveedor_replace_ciudad'),
    ]

    operations = [
        migrations.AddField(
            model_name='producto',
            name='requiere_qc_recepcion',
            field=models.BooleanField(
                default=False,
                db_index=True,
                help_text=(
                    'Si está marcado, el voucher de recepción no puede aprobarse '
                    'sin registrar un control de calidad (RecepcionCalidad) previo.'
                ),
                verbose_name='Requiere QC en recepción',
            ),
        ),
    ]
