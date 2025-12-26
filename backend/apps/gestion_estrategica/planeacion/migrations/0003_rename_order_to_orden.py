# Generated manually for field rename
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('planeacion', '0002_causaefecto_gestioncambio_kpiobjetivo_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='strategicobjective',
            old_name='order',
            new_name='orden',
        ),
    ]
