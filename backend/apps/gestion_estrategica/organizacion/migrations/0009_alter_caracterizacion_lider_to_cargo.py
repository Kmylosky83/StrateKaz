"""
Migración: Cambiar CaracterizacionProceso.lider_proceso de User a Cargo

Igual que Area.manager, el líder del proceso debe ser un Cargo (posición),
no un usuario específico (ISO 9001 §4.4).

Paso 1: NULL los valores existentes (son User IDs, no Cargo IDs).
Paso 2: Cambiar FK target de User a Cargo.
"""
from django.db import migrations, models
import django.db.models.deletion


def nullify_lider_proceso(apps, schema_editor):
    """NULL out lider_proceso_id — old values are User IDs, not Cargo IDs."""
    CaracterizacionProceso = apps.get_model('organizacion', 'CaracterizacionProceso')
    CaracterizacionProceso.objects.filter(lider_proceso__isnull=False).update(lider_proceso=None)


class Migration(migrations.Migration):

    dependencies = [
        ('organizacion', '0008_alter_area_manager_to_cargo'),
        ('core', '0001_initial'),
    ]

    operations = [
        # 1. Limpiar datos: User IDs → NULL
        migrations.RunPython(nullify_lider_proceso, migrations.RunPython.noop),
        # 2. Cambiar FK de User a Cargo
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
