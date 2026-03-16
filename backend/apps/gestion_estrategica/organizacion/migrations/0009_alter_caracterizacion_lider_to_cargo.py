"""
Migración: Cambiar CaracterizacionProceso.lider_proceso de User a Cargo

Igual que Area.manager, el líder del proceso debe ser un Cargo (posición),
no un usuario específico (ISO 9001 §4.4).
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('organizacion', '0008_alter_area_manager_to_cargo'),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='caracterizacionproceso',
            name='lider_proceso',
            field=models.ForeignKey(
                blank=True,
                help_text='Cargo responsable del proceso',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='procesos_liderados',
                to='core.cargo',
                verbose_name='Líder del Proceso',
            ),
        ),
    ]
