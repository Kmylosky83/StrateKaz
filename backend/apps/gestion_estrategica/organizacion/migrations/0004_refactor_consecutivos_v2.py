# Migration for consecutivos refactor v2
# Removes area fields from ConsecutivoConfig and updates TipoDocumento

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('organizacion', '0003_populate_tipos_documento'),
    ]

    operations = [
        # =====================================================================
        # TipoDocumento - Update category choices and add new fields
        # =====================================================================
        migrations.AlterField(
            model_name='tipodocumento',
            name='category',
            field=models.CharField(
                choices=[
                    ('FINANCIERO', 'Financiero'),
                    ('COMPRAS', 'Compras'),
                    ('CALIDAD_SST', 'Calidad y SST'),
                    ('MAESTRO', 'Datos Maestros'),
                    ('MANTENIMIENTO', 'Mantenimiento'),
                    ('OPERACIONAL', 'Operacional'),
                ],
                db_index=True,
                default='OPERACIONAL',
                max_length=20,
                verbose_name='Categoría'
            ),
        ),
        migrations.AddField(
            model_name='tipodocumento',
            name='prefijo_sugerido',
            field=models.CharField(
                blank=True,
                max_length=10,
                verbose_name='Prefijo Sugerido',
                help_text='Prefijo sugerido para el consecutivo (ej: FAC, OC, NC)',
                default=''
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='tipodocumento',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='tipos_documento_created',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Creado por'
            ),
        ),

        # =====================================================================
        # ConsecutivoConfig - Remove area fields (simplification)
        # =====================================================================
        migrations.RemoveField(
            model_name='consecutivoconfig',
            name='area',
        ),
        migrations.RemoveField(
            model_name='consecutivoconfig',
            name='include_area',
        ),
    ]
