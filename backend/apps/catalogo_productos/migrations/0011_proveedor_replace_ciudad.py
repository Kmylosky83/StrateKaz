"""
Migración 0011: Eliminar Proveedor.ciudad (CharField) y renombrar ciudad_ref → ciudad.

Fase B de 2 migraciones (0010 + 0011). Ver 0010 para contexto.

Después de esta migración, `Proveedor.ciudad` es ForeignKey(Ciudad, null=True).
El modelo en models.py debe actualizarse en el mismo commit.

Histórico:
    2026-04-22: Completa H-CAT-05 para Proveedor.ciudad.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo_productos', '0010_proveedor_add_ciudad_fk'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='proveedor',
            name='ciudad',
        ),
        migrations.RenameField(
            model_name='proveedor',
            old_name='ciudad_ref',
            new_name='ciudad',
        ),
    ]
