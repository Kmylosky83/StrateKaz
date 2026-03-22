# Generated manually — Add firma_guardada and iniciales_guardadas to User

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_rename_core_email__user_id_purpose_idx_core_email__user_id_5f5ad3_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="firma_guardada",
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name="Firma guardada",
                help_text="Imagen Base64 de la firma manuscrita del usuario",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="iniciales_guardadas",
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name="Iniciales guardadas",
                help_text="Imagen Base64 de las iniciales del usuario",
            ),
        ),
    ]
