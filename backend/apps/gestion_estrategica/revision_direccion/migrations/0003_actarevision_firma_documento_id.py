# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('revision_direccion', '0002_analisistemaacta_created_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='actarevision',
            name='firma_documento_id',
            field=models.PositiveBigIntegerField(
                blank=True,
                db_index=True,
                help_text='ID de FirmaDocumento en workflow_engine.firma_digital',
                null=True,
            ),
        ),
    ]
