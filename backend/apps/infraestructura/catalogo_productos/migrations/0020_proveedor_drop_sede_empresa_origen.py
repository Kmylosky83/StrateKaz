"""
Migración 0020: elimina Proveedor.sede_empresa_origen (H-SC-10).

Una vez el backfill en catalogos.0005 copió los datos a Proveedor.ruta_origen
y recepcion.0004 dejó de usar la FK vieja (uneg_transportista apuntaba a
configuracion.SedeEmpresa), se puede eliminar sede_empresa_origen.

Reversible parcial: el RemoveField se puede deshacer (restaura la columna
vacía), pero los datos no se recuperan del registro de la migración.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('infra_catalogo_productos', '0019_proveedor_ruta_origen'),
        ('sc_recepcion', '0004_voucher_ruta_recoleccion'),
        ('catalogos', '0005_backfill_rutas_desde_sedes'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='proveedor',
            name='sede_empresa_origen',
        ),
    ]
