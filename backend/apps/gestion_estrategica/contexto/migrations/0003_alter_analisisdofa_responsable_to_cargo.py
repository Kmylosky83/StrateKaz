"""
Migración para cambiar responsable de User a Cargo en AnalisisDOFA.

Cambio organizacional: El responsable de un análisis DOFA ahora es un Cargo
en lugar de un usuario específico. Esto es más estable porque:
- Si cambia la persona en el cargo, el análisis sigue asignado correctamente
- Alineado con ISO 9001 (responsabilidades por rol, no por persona)
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),  # Asegura que Cargo existe
        ('gestion_estrategica_contexto', '0002_add_comunicacion_iso_fields'),
    ]

    operations = [
        # Paso 1: Eliminar el campo responsable actual (FK a User)
        migrations.RemoveField(
            model_name='analisisdofa',
            name='responsable',
        ),
        # Paso 2: Agregar nuevo campo responsable (FK a Cargo)
        migrations.AddField(
            model_name='analisisdofa',
            name='responsable',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='dofa_responsable',
                to='core.cargo',
                verbose_name='Cargo Responsable',
            ),
        ),
    ]
