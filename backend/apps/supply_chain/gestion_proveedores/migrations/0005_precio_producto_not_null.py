# Migracion S7 post-cleanup: enforce producto NOT NULL en PrecioMateriaPrima.
#
# Tras eliminar la coexistencia D3 (tipo_materia legacy) en 0004, cada precio
# debe apuntar obligatoriamente a un producto del catalogo canonico. El modelo
# cambia null=False, blank=False.
#
# Orden:
#   1. RunPython defensivo: borra huerfanos (producto IS NULL) con hard delete.
#   2. AlterField: producto.null=False, blank=False.
#
# Reverse del Paso 1 es no-op intencional (datos borrados no se restauran).

import django.db.models.deletion
from django.db import migrations, models


def borrar_huerfanos(apps, schema_editor):
    """Hard delete de precios sin producto (deuda pre-not-null)."""
    PrecioMP = apps.get_model('gestion_proveedores', 'PrecioMateriaPrima')
    huerfanos = PrecioMP.objects.filter(producto__isnull=True)
    if huerfanos.exists():
        ids = list(huerfanos.values_list('pk', flat=True))
        print(f'  Borrando {len(ids)} PrecioMateriaPrima huerfanos: {ids}')
        huerfanos.delete()


def reverse_noop(apps, schema_editor):
    """No se puede reversar: los datos fueron borrados intencionalmente."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("gestion_proveedores", "0004_remove_tipomateriaprima_categoria_and_more"),
    ]

    operations = [
        migrations.RunPython(borrar_huerfanos, reverse_noop),
        migrations.AlterField(
            model_name="preciomateriaprima",
            name="producto",
            field=models.ForeignKey(
                help_text="Producto maestro del catalogo_productos (tipo=MATERIA_PRIMA)",
                on_delete=django.db.models.deletion.PROTECT,
                related_name="precios_proveedor",
                to="catalogo_productos.producto",
                verbose_name="Producto del catálogo",
            ),
        ),
    ]
