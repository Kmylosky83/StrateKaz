"""
Migración para agregar campo photo al modelo User
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_update_organigrama_sections'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='photo',
            field=models.ImageField(
                blank=True,
                help_text='Foto del usuario para el organigrama y perfil',
                null=True,
                upload_to='usuarios/fotos/',
                verbose_name='Foto de Perfil'
            ),
        ),
    ]
