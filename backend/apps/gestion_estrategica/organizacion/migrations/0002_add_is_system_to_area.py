from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizacion', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='area',
            name='is_system',
            field=models.BooleanField(
                default=False,
                help_text='Los procesos del sistema no pueden eliminarse, solo desactivarse',
                verbose_name='Es del sistema',
            ),
        ),
    ]
