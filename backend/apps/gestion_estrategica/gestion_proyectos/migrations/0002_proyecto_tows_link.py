"""
Migration: Add TOWS strategy link to Proyecto

Adds:
- ESTRATEGIA_TOWS choice to OrigenProyecto enum
- origen_estrategia_tows FK to gestion_estrategica_contexto.EstrategiaTOWS
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_proyectos', '0001_initial'),
        ('gestion_estrategica_contexto', '0004_parteinteresada_canales_adicionales'),
    ]

    operations = [
        # 1. Update tipo_origen choices to include ESTRATEGIA_TOWS
        migrations.AlterField(
            model_name='proyecto',
            name='tipo_origen',
            field=models.CharField(
                choices=[
                    ('manual', 'Creación Manual'),
                    ('cambio', 'Desde Gestión de Cambios'),
                    ('objetivo', 'Desde Objetivo Estratégico'),
                    ('estrategia_tows', 'Desde Estrategia TOWS'),
                    ('auditoria', 'Desde Hallazgo de Auditoría'),
                    ('riesgo', 'Desde Tratamiento de Riesgo'),
                    ('mejora', 'Desde Acción de Mejora'),
                ],
                default='manual',
                help_text='Indica cómo se originó el proyecto',
                max_length=20,
                verbose_name='Tipo de Origen',
            ),
        ),
        # 2. Add FK to EstrategiaTOWS
        migrations.AddField(
            model_name='proyecto',
            name='origen_estrategia_tows',
            field=models.ForeignKey(
                blank=True,
                help_text='Estrategia TOWS que originó este proyecto',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='proyectos_generados',
                to='gestion_estrategica_contexto.estrategiatows',
                verbose_name='Estrategia TOWS de Origen',
            ),
        ),
    ]
