"""
Migration: Add Kanban board fields to ActividadProyecto

Adds:
- kanban_column: Column in Kanban board (backlog, todo, in_progress, review, done)
- kanban_order: Order within the Kanban column
- Composite index on (proyecto, kanban_column, kanban_order) for efficient queries
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_proyectos', '0002_proyecto_tows_link'),
    ]

    operations = [
        migrations.AddField(
            model_name='actividadproyecto',
            name='kanban_column',
            field=models.CharField(
                choices=[
                    ('backlog', 'Backlog'),
                    ('todo', 'Por Hacer'),
                    ('in_progress', 'En Progreso'),
                    ('review', 'En Revisión'),
                    ('done', 'Completado'),
                ],
                db_index=True,
                default='backlog',
                help_text='Columna actual en el tablero Kanban',
                max_length=30,
                verbose_name='Columna Kanban',
            ),
        ),
        migrations.AddField(
            model_name='actividadproyecto',
            name='kanban_order',
            field=models.PositiveIntegerField(
                default=0,
                help_text='Orden dentro de la columna Kanban',
                verbose_name='Orden Kanban',
            ),
        ),
        migrations.AddIndex(
            model_name='actividadproyecto',
            index=models.Index(
                fields=['proyecto', 'kanban_column', 'kanban_order'],
                name='gestion_pro_proyect_kanban_idx',
            ),
        ),
    ]
