"""
H-SC-RUTA-02 refactor 2 (2026-04-26):
1 voucher = 1 parada (atómico). Eliminar LineaVoucherRecoleccion y mover
proveedor + producto + cantidad al header del voucher.

Datos legacy: el usuario aprobó borrar todos los vouchers existentes
(eran de prueba). Esta migración hace clean wipe.
"""
import django.db.models.deletion
from django.db import migrations, models


def borrar_datos_legacy(apps, schema_editor):
    """Borra todos los vouchers y líneas existentes (eran de prueba)."""
    LineaVoucherRecoleccion = apps.get_model('sc_recoleccion', 'LineaVoucherRecoleccion')
    VoucherRecoleccion = apps.get_model('sc_recoleccion', 'VoucherRecoleccion')

    # Primero limpiar el FK de VoucherRecepcion → VoucherRecoleccion (si lo apuntaba)
    VoucherRecepcion = apps.get_model('sc_recepcion', 'VoucherRecepcion')
    VoucherRecepcion.objects.filter(
        voucher_recoleccion_origen__isnull=False,
    ).update(voucher_recoleccion_origen=None)

    LineaVoucherRecoleccion.objects.all().delete()
    VoucherRecoleccion.objects.all().delete()


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    # PostgreSQL: no podemos correr DELETE de rows con FK + ALTER TABLE en la
    # misma transacción atómica (genera "pending trigger events" → falla en
    # tenants con datos). Marcamos atomic=False para que cada operación corra
    # en su propia transacción (DELETE commitea, luego ALTER corre limpio).
    atomic = False

    dependencies = [
        # Encadenado después del rename de índices auto-generado (commit 888b9b56)
        # para evitar conflicto de leaf nodes en el grafo de migraciones.
        ("sc_recoleccion", "0002_rename_sc_vrc_lin_v_p_idx_supply_chai_voucher_b10258_idx_and_more"),
        ("sc_recepcion", "0007_voucher_recoleccion_origen"),
        ("catalogo_productos", "0020_proveedor_drop_sede_empresa_origen"),
    ]

    operations = [
        # 1. Borrar datos legacy ANTES de eliminar tabla
        migrations.RunPython(borrar_datos_legacy, reverse_code=reverse_noop),

        # 2. Agregar campos al header (proveedor, producto, cantidad ahora viven aquí)
        migrations.AddField(
            model_name="voucherrecoleccion",
            name="proveedor",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="vouchers_recoleccion",
                to="catalogo_productos.proveedor",
                verbose_name="Proveedor (productor)",
                # Default temporal para satisfacer NOT NULL en backfill (no aplica
                # porque borramos todos los rows arriba).
                null=True,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="voucherrecoleccion",
            name="producto",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="vouchers_recoleccion",
                to="catalogo_productos.producto",
                verbose_name="Producto (MP)",
                null=True,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="voucherrecoleccion",
            name="cantidad",
            field=models.DecimalField(
                decimal_places=3,
                help_text="Kilos entregados por el productor en esta parada.",
                max_digits=12,
                null=True,
                verbose_name="Cantidad (kilos)",
            ),
            preserve_default=False,
        ),

        # 3. Marcar campos como NOT NULL ahora que la tabla está vacía
        migrations.AlterField(
            model_name="voucherrecoleccion",
            name="proveedor",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="vouchers_recoleccion",
                to="catalogo_productos.proveedor",
                verbose_name="Proveedor (productor)",
            ),
        ),
        migrations.AlterField(
            model_name="voucherrecoleccion",
            name="producto",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="vouchers_recoleccion",
                to="catalogo_productos.producto",
                verbose_name="Producto (MP)",
            ),
        ),
        migrations.AlterField(
            model_name="voucherrecoleccion",
            name="cantidad",
            field=models.DecimalField(
                decimal_places=3,
                help_text="Kilos entregados por el productor en esta parada.",
                max_digits=12,
                verbose_name="Cantidad (kilos)",
            ),
        ),

        # 4. Estado: ahora solo BORRADOR | COMPLETADO (eliminamos CONSOLIDADO,
        # ya no aplica porque la consolidación se hace por M2M en VoucherRecepcion)
        migrations.AlterField(
            model_name="voucherrecoleccion",
            name="estado",
            field=models.CharField(
                choices=[
                    ("BORRADOR", "Borrador"),
                    ("COMPLETADO", "Completado"),
                ],
                db_index=True,
                default="BORRADOR",
                max_length=20,
                verbose_name="Estado",
            ),
        ),

        # 5. Nuevos índices
        migrations.AddIndex(
            model_name="voucherrecoleccion",
            index=models.Index(
                fields=["proveedor", "-fecha_recoleccion"],
                name="sc_vrc_prov_fecha_idx",
            ),
        ),

        # 6. Eliminar modelo LineaVoucherRecoleccion (ya no aplica)
        migrations.DeleteModel(name="LineaVoucherRecoleccion"),
    ]
