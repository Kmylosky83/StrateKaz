"""
Migration: Add canales_adicionales JSONField to ParteInteresada

Enables multi-channel communication for stakeholders.
The canal_principal remains as the preferred channel,
canales_adicionales stores additional channels as a JSON list.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_estrategica_contexto', '0003_partes_interesadas_v2_sprint17'),
    ]

    operations = [
        migrations.AddField(
            model_name='parteinteresada',
            name='canales_adicionales',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Lista de canales adicionales (ej: ['whatsapp', 'telefono'])",
                verbose_name='Canales Adicionales de Comunicación',
            ),
        ),
    ]
