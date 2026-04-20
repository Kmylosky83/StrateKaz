# Migracion S7: eliminar TipoMateriaPrima + CategoriaMateriaPrima legacy.
# Orden correcto: primero remove_constraint (referencian tipo_materia en condition),
# luego remove_field, luego delete_model.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogo_productos", "0006_migrar_unidades_desde_legacy"),
        ("gestion_proveedores", "0003_migrar_tipos_materia_prima_a_productos"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Eliminar constraints via SQL directo (el condition Q(tipo_materia__isnull=False)
        #    no puede resolverse tras RemoveField).
        # Nota PG: UniqueConstraint con condition= se materializa como UNIQUE INDEX
        # parcial, no como ALTER TABLE CONSTRAINT. Por eso DROP INDEX + DROP CONSTRAINT
        # (ambos IF EXISTS) — defensivo ante ambos orígenes.
        migrations.RunSQL(
            sql=(
                'DROP INDEX IF EXISTS uq_precio_proveedor_tipo_materia_active;'
                'DROP INDEX IF EXISTS uq_precio_proveedor_producto_active;'
                'ALTER TABLE supply_chain_precio_materia_prima '
                'DROP CONSTRAINT IF EXISTS uq_precio_proveedor_tipo_materia_active;'
                'ALTER TABLE supply_chain_precio_materia_prima '
                'DROP CONSTRAINT IF EXISTS uq_precio_proveedor_producto_active;'
            ),
            reverse_sql=migrations.RunSQL.noop,
            state_operations=[
                migrations.RemoveConstraint(
                    model_name="preciomateriaprima",
                    name="uq_precio_proveedor_tipo_materia_active",
                ),
                migrations.RemoveConstraint(
                    model_name="preciomateriaprima",
                    name="uq_precio_proveedor_producto_active",
                ),
            ],
        ),
        # 2. Eliminar indices (defensivo: puede haberse aplicado cleanup SQL manual en S7)
        migrations.RunSQL(
            sql=(
                'DROP INDEX IF EXISTS supply_chai_proveed_d3842c_idx;'
                'DROP INDEX IF EXISTS supply_chai_tipo_ma_525f43_idx;'
            ),
            reverse_sql=migrations.RunSQL.noop,
            state_operations=[
                migrations.RemoveIndex(
                    model_name="preciomateriaprima",
                    name="supply_chai_proveed_d3842c_idx",
                ),
                migrations.RemoveIndex(
                    model_name="preciomateriaprima",
                    name="supply_chai_tipo_ma_525f43_idx",
                ),
            ],
        ),
        # 3. Eliminar FKs/M2M legacy (defensivo: columnas pueden haberse dropeado
        # manualmente durante el cleanup S7 en tenant_demo. DROP COLUMN IF EXISTS
        # hace la migracion idempotente para schemas nuevos y schemas con cleanup manual).
        migrations.RunSQL(
            sql=(
                'ALTER TABLE supply_chain_historial_precio '
                'DROP COLUMN IF EXISTS tipo_materia_id;'
                'ALTER TABLE supply_chain_precio_materia_prima '
                'DROP COLUMN IF EXISTS tipo_materia_id;'
                'DROP TABLE IF EXISTS supply_chain_proveedor_tipos_materia_prima CASCADE;'
                'ALTER TABLE supply_chain_tipo_materia_prima '
                'DROP COLUMN IF EXISTS categoria_id;'
            ),
            reverse_sql=migrations.RunSQL.noop,
            state_operations=[
                migrations.RemoveField(
                    model_name="historialprecioproveedor",
                    name="tipo_materia",
                ),
                migrations.RemoveField(
                    model_name="preciomateriaprima",
                    name="tipo_materia",
                ),
                migrations.RemoveField(
                    model_name="proveedor",
                    name="tipos_materia_prima",
                ),
                migrations.RemoveField(
                    model_name="tipomateriaprima",
                    name="categoria",
                ),
            ],
        ),
        # 5. AlterField en producto (cambio de null y help_text)
        migrations.AlterField(
            model_name="preciomateriaprima",
            name="producto",
            field=models.ForeignKey(
                blank=True,
                help_text="Producto maestro del catalogo_productos (tipo=MATERIA_PRIMA)",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="precios_proveedor",
                to="catalogo_productos.producto",
                verbose_name="Producto del catálogo",
            ),
        ),
        # 6. Re-crear constraint simplificado sobre producto
        migrations.AddConstraint(
            model_name="preciomateriaprima",
            constraint=models.UniqueConstraint(
                condition=models.Q(("is_deleted", False)),
                fields=("proveedor", "producto"),
                name="uq_precio_proveedor_producto_active",
            ),
        ),
        # 7. Eliminar modelos legacy (TipoMateriaPrima primero porque tiene FK a Categoria).
        # Defensivo: tablas pueden haberse dropeado manualmente en S7. DROP TABLE IF EXISTS
        # + state_operations hace la migracion idempotente para todos los entornos.
        migrations.RunSQL(
            sql=(
                'DROP TABLE IF EXISTS supply_chain_tipo_materia_prima CASCADE;'
                'DROP TABLE IF EXISTS supply_chain_categoria_materia_prima CASCADE;'
            ),
            reverse_sql=migrations.RunSQL.noop,
            state_operations=[
                migrations.DeleteModel(name="TipoMateriaPrima"),
                migrations.DeleteModel(name="CategoriaMateriaPrima"),
            ],
        ),
    ]
