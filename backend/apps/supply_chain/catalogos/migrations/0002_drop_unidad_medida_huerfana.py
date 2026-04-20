"""
DROP supply_chain.catalogos.UnidadMedida (modelo huerfano post S7).

Contexto
--------
La consolidacion S7 (commit 79a516ae) unifico UnidadMedida en el canonico
`apps.catalogo_productos.UnidadMedida` (CT-layer, source-of-truth unico).
La clase `supply_chain.catalogos.UnidadMedida` quedo eliminada del codigo
pero sin migracion de DROP: la tabla `supply_chain_unidad_medida` sobrevive
en cada tenant schema (tenant_demo, test) como huerfana.

Hallazgo registrado: `H-S7-supply-chain-tabla-unidad-medida-huerfana` (BAJA)
en docs/architecture/HALLAZGOS-PENDIENTES-2026-04.md.

Operacion
---------
SeparateDatabaseAndState:
- state: RemoveModel('UnidadMedida') — sincroniza el historial de migraciones
  con el codigo (clase ya no existe en models.py).
- database: DROP TABLE IF EXISTS supply_chain_unidad_medida CASCADE —
  defensivo: no falla si la tabla no existe en un schema nuevo.

Reversibilidad
--------------
Irreversible a nivel DB (no recreamos la tabla legacy). Si alguien corre
migrate --backwards, la operacion es noop. El canonico esta en
catalogo_productos y no se toca.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name='UnidadMedida'),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql='DROP TABLE IF EXISTS supply_chain_unidad_medida CASCADE;',
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
        ),
    ]
