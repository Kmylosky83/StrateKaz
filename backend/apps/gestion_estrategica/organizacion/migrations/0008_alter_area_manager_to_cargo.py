# Generated manually — Change Area.manager FK from User to Cargo
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organizacion", "0007_area_tipo_objetivo"),
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="area",
            name="manager",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="areas_responsable",
                to="core.cargo",
                verbose_name="Cargo Responsable",
                help_text="Cargo responsable del proceso",
            ),
        ),
    ]
