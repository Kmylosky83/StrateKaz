# Generated manually 2026-04-25 — H-SC-RUTA-01
# Permite codigo en blanco para que save() lo auto-genere (RUTA-001...).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogos", "0005_backfill_rutas_desde_sedes"),
    ]

    operations = [
        migrations.AlterField(
            model_name="rutarecoleccion",
            name="codigo",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="Código único de la ruta (ej: RUTA-001). Se auto-genera si viene vacío.",
                max_length=50,
                unique=True,
                verbose_name="Código",
            ),
        ),
    ]
