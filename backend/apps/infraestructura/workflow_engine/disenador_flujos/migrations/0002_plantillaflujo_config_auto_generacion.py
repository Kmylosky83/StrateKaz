"""
Agrega config_auto_generacion a PlantillaFlujo (Fase 4: BPM auto-gen documental).
Permite configurar qué tipo de documento y plantilla generar al completar un flujo.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('infra_disenador_flujos', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='plantillaflujo',
            name='config_auto_generacion',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='{"habilitado": true, "tipo_documento_id": 1, "plantilla_documento_id": 2, "estado_inicial": "BORRADOR"}',
                verbose_name='Configuración de Auto-Generación Documental',
            ),
        ),
    ]
