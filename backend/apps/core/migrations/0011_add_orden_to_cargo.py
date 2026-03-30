from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0010_rename_core_group__group_i_idx_core_group__group_i_4acad1_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="cargo",
            name="orden",
            field=models.PositiveIntegerField(
                default=0,
                db_index=True,
                help_text="Orden de visualización (menor número = primero)",
                verbose_name="Orden",
            ),
        ),
        migrations.AlterModelOptions(
            name="cargo",
            options={
                "ordering": ["orden", "nivel_jerarquico", "name"],
                "verbose_name": "Cargo",
                "verbose_name_plural": "Cargos",
            },
        ),
    ]
