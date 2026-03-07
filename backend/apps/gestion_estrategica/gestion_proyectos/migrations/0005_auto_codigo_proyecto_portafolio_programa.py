# Generated manually - auto_generate_codigo for Proyecto, Portafolio, Programa

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "gestion_proyectos",
            "0004_rename_gestion_pro_proyect_kanban_idx_gestion_pro_proyect_a4d0e4_idx",
        ),
    ]

    operations = [
        migrations.AlterField(
            model_name="portafolio",
            name="codigo",
            field=models.CharField(
                blank=True,
                help_text="Código único del portafolio (se genera automáticamente si se deja vacío)",
                max_length=20,
                verbose_name="Código",
            ),
        ),
        migrations.AlterField(
            model_name="programa",
            name="codigo",
            field=models.CharField(
                blank=True,
                help_text="Código único del programa (se genera automáticamente si se deja vacío)",
                max_length=20,
                verbose_name="Código",
            ),
        ),
        migrations.AlterField(
            model_name="proyecto",
            name="codigo",
            field=models.CharField(
                blank=True,
                help_text="Código único del proyecto (se genera automáticamente si se deja vacío)",
                max_length=30,
                verbose_name="Código",
            ),
        ),
    ]
