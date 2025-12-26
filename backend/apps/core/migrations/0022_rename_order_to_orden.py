# Generated migration to rename 'order' fields to 'orden' for naming convention compliance
# Convention: Audit fields in English (created_at, is_active), business fields in Spanish (nombre, orden)
from django.db import migrations


class Migration(migrations.Migration):
    """
    Migración para renombrar campos 'order' a 'orden' según la convención de nomenclatura.

    Según CONVENCIONES-NOMENCLATURA.md:
    - Campos de auditoría: Inglés (created_at, updated_at, is_active)
    - Campos de negocio: Español (nombre, descripcion, orden)

    Modelos afectados:
    - MenuItem: order -> orden
    - SystemModule: order -> orden
    - ModuleTab: order -> orden
    - TabSection: order -> orden

    NOTA: StrategicObjective se maneja en planeacion.0003_rename_order_to_orden
    """

    dependencies = [
        ('core', '0021_add_tipos_documento_section'),
    ]

    operations = [
        # MenuItem
        migrations.RenameField(
            model_name='menuitem',
            old_name='order',
            new_name='orden',
        ),
        # SystemModule
        migrations.RenameField(
            model_name='systemmodule',
            old_name='order',
            new_name='orden',
        ),
        # ModuleTab
        migrations.RenameField(
            model_name='moduletab',
            old_name='order',
            new_name='orden',
        ),
        # TabSection
        migrations.RenameField(
            model_name='tabsection',
            old_name='order',
            new_name='orden',
        ),
    ]
