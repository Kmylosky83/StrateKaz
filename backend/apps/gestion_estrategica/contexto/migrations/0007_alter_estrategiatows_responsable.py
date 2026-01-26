# Generated manually - 2026-01-25
# Migración para cambiar EstrategiaTOWS.responsable de User a Cargo
# Esto sigue el patrón ISO 9001 de estabilidad organizacional

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('gestion_estrategica_contexto', '0006_add_tipo_analisis_pestel'),
    ]

    operations = [
        migrations.AlterField(
            model_name='estrategiatows',
            name='responsable',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='estrategias_tows_responsable',
                to='core.cargo',
                verbose_name='Cargo Responsable',
            ),
        ),
    ]
