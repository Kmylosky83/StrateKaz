"""
Remove deprecated legacy field iso_standards_legacy from StrategicObjective.
The normas_iso ManyToManyField is the replacement.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('planeacion', '0003_gestion_cambio_add_change_type'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='strategicobjective',
            name='iso_standards_legacy',
        ),
    ]
