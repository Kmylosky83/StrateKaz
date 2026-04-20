"""
RemoveModel: organizacion.UnidadMedida (legacy).

Post-consolidacion S7. Datos migrados al canonico
catalogo_productos.UnidadMedida (ver catalogo_productos.0006).
FK SedeEmpresa.unidad_capacidad reapuntada al canonico
(ver configuracion.0004_alter_sedeempresa_unidad_capacidad).

Tabla `configuracion_unidad_medida` eliminada de cada tenant schema.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('organizacion', '0003_migrate_node_position_to_tenant_model'),
        ('configuracion', '0004_alter_sedeempresa_unidad_capacidad'),
    ]

    operations = [
        migrations.DeleteModel(
            name='UnidadMedida',
        ),
    ]
