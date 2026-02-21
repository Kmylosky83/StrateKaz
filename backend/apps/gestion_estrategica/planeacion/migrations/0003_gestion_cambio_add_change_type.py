"""
Migration: Add change_type CharField and remove tipo_cambio FK + change_type_legacy

The frontend expects a simple CharField with choices (ESTRATEGICO, ORGANIZACIONAL, etc.)
instead of a ForeignKey to TipoCambio.
"""
from django.db import migrations, models


def migrate_tipo_cambio_to_change_type(apps, schema_editor):
    """Migrate existing FK values to the new CharField"""
    GestionCambio = apps.get_model('planeacion', 'GestionCambio')
    for cambio in GestionCambio.objects.all():
        if cambio.tipo_cambio_id:
            try:
                TipoCambio = apps.get_model('configuracion', 'TipoCambio')
                tipo = TipoCambio.objects.get(pk=cambio.tipo_cambio_id)
                # Map TipoCambio.code to CHANGE_TYPE_CHOICES
                mapping = {
                    'ESTRATEGICO': 'ESTRATEGICO',
                    'ESTRUCTURAL': 'ORGANIZACIONAL',
                    'PROCESO': 'PROCESO',
                    'TECNOLOGICO': 'TECNOLOGICO',
                    'NORMATIVO': 'NORMATIVO',
                    'CULTURAL': 'CULTURAL',
                    'AMBIENTAL': 'OTRO',
                    'FINANCIERO': 'OTRO',
                }
                cambio.change_type = mapping.get(tipo.code, 'OTRO')
                cambio.save(update_fields=['change_type'])
            except Exception:
                pass


class Migration(migrations.Migration):

    dependencies = [
        ('planeacion', '0002_remove_circular_dependency'),
    ]

    operations = [
        # 1. Add change_type field
        migrations.AddField(
            model_name='gestioncambio',
            name='change_type',
            field=models.CharField(
                choices=[
                    ('ESTRATEGICO', 'Estratégico'),
                    ('ORGANIZACIONAL', 'Organizacional'),
                    ('PROCESO', 'Proceso'),
                    ('TECNOLOGICO', 'Tecnológico'),
                    ('CULTURAL', 'Cultural'),
                    ('NORMATIVO', 'Normativo'),
                    ('OTRO', 'Otro'),
                ],
                db_index=True,
                default='PROCESO',
                max_length=20,
                verbose_name='Tipo de Cambio',
            ),
        ),
        # 2. Migrate data from FK to CharField
        migrations.RunPython(
            migrate_tipo_cambio_to_change_type,
            reverse_code=migrations.RunPython.noop,
        ),
        # 3. Remove tipo_cambio FK
        migrations.RemoveField(
            model_name='gestioncambio',
            name='tipo_cambio',
        ),
        # 4. Remove deprecated legacy field
        migrations.RemoveField(
            model_name='gestioncambio',
            name='change_type_legacy',
        ),
        # 5. Make description optional (was required, frontend sends optional)
        migrations.AlterField(
            model_name='gestioncambio',
            name='description',
            field=models.TextField(
                blank=True,
                default='',
                help_text='Descripción detallada del cambio',
                verbose_name='Descripción',
            ),
        ),
    ]
