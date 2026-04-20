# Refactor 2026-04-21: Proveedor → catalogo_productos
# Manual reorder: AlterUniqueTogether debe ir ANTES de RemoveField que la compone.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogo_productos", "0008_copy_proveedor_data_from_supply_chain"),
        ("gestion_proveedores", "0005_precio_producto_not_null"),
    ]

    operations = [
        # ── 1) Deshacer unique_together PRIMERO para poder eliminar campos ──
        migrations.AlterUniqueTogether(
            name="detalleevaluacion",
            unique_together=None,
        ),
        migrations.AlterUniqueTogether(
            name="evaluacionproveedor",
            unique_together=None,
        ),

        # ── 2) Borrar M2M / FKs de modelos a eliminar ──
        migrations.RemoveField(
            model_name="criterioevaluacion",
            name="aplica_a_tipo",
        ),
        migrations.RemoveField(
            model_name="detalleevaluacion",
            name="criterio",
        ),
        migrations.RemoveField(
            model_name="detalleevaluacion",
            name="evaluacion",
        ),
        migrations.RemoveField(
            model_name="evaluacionproveedor",
            name="aprobado_por",
        ),
        migrations.RemoveField(
            model_name="evaluacionproveedor",
            name="evaluado_por",
        ),
        migrations.RemoveField(
            model_name="evaluacionproveedor",
            name="proveedor",
        ),

        # ── 3) Limpieza de campos en Proveedor (eliminados) ──
        migrations.RemoveField(
            model_name="proveedor",
            name="formas_pago",
        ),
        migrations.RemoveField(
            model_name="proveedor",
            name="created_by",
        ),
        migrations.RemoveField(
            model_name="proveedor",
            name="deleted_by",
        ),
        migrations.RemoveField(
            model_name="proveedor",
            name="departamento",
        ),
        migrations.RemoveField(
            model_name="proveedor",
            name="modalidad_logistica",
        ),
        migrations.RemoveField(
            model_name="proveedor",
            name="productos_suministrados",
        ),
        migrations.RemoveField(
            model_name="proveedor",
            name="tipo_cuenta",
        ),
        migrations.RemoveField(
            model_name="proveedor",
            name="tipo_documento",
        ),
        migrations.RemoveField(
            model_name="proveedor",
            name="tipo_proveedor",
        ),
        migrations.RemoveField(
            model_name="proveedor",
            name="updated_by",
        ),

        # ── 4) Repuntar FK de PrecioMP + HistorialPrecio a catalogo_productos ──
        migrations.AlterField(
            model_name="preciomateriaprima",
            name="proveedor",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="precios_materia_prima",
                to="catalogo_productos.proveedor",
                verbose_name="Proveedor",
            ),
        ),
        migrations.AlterField(
            model_name="historialprecioproveedor",
            name="proveedor",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="historial_precios",
                to="catalogo_productos.proveedor",
                verbose_name="Proveedor",
            ),
        ),
        migrations.AlterField(
            model_name="historialprecioproveedor",
            name="precio_anterior",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True
            ),
        ),
        migrations.AlterField(
            model_name="historialprecioproveedor",
            name="precio_nuevo",
            field=models.DecimalField(decimal_places=2, max_digits=10),
        ),
        migrations.AlterField(
            model_name="modalidadlogistica",
            name="descripcion",
            field=models.TextField(blank=True, null=True),
        ),

        # ── 5) Eliminar modelos huérfanos (no hay datos) ──
        migrations.DeleteModel(
            name="CondicionComercialProveedor",
        ),
        migrations.DeleteModel(
            name="CriterioEvaluacion",
        ),
        migrations.DeleteModel(
            name="DetalleEvaluacion",
        ),
        migrations.DeleteModel(
            name="EvaluacionProveedor",
        ),
        migrations.DeleteModel(
            name="FormaPago",
        ),
        migrations.DeleteModel(
            name="TipoCuentaBancaria",
        ),
        migrations.DeleteModel(
            name="TipoProveedor",
        ),
    ]
