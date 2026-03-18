"""
Migración consolidada para Fases 4, 6, 7, 8 de Gestión Documental.
- Fase 6: score_cumplimiento, score_detalle, score_actualizado_at
- Fase 7: drive_file_id, drive_exportado_at
- Fase 8: plantilla_maestra_codigo, es_personalizada (en PlantillaDocumento)
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_documental', '0002_documento_ocr_fields'),
    ]

    operations = [
        # === FASE 6: Scoring ===
        migrations.AddField(
            model_name='documento',
            name='score_cumplimiento',
            field=models.IntegerField(
                default=0,
                db_index=True,
                help_text='Puntuación 0-100 basada en completitud del documento',
                verbose_name='Score de Cumplimiento',
            ),
        ),
        migrations.AddField(
            model_name='documento',
            name='score_detalle',
            field=models.JSONField(
                blank=True,
                default=dict,
                verbose_name='Detalle del Score',
            ),
        ),
        migrations.AddField(
            model_name='documento',
            name='score_actualizado_at',
            field=models.DateTimeField(
                blank=True,
                null=True,
                verbose_name='Score Actualizado',
            ),
        ),

        # === FASE 7: Google Drive ===
        migrations.AddField(
            model_name='documento',
            name='drive_file_id',
            field=models.CharField(
                blank=True,
                default='',
                max_length=100,
                verbose_name='Google Drive File ID',
            ),
        ),
        migrations.AddField(
            model_name='documento',
            name='drive_exportado_at',
            field=models.DateTimeField(
                blank=True,
                null=True,
                verbose_name='Exportado a Drive',
            ),
        ),

        # === FASE 8: Biblioteca Maestra (PlantillaDocumento) ===
        migrations.AddField(
            model_name='plantilladocumento',
            name='plantilla_maestra_codigo',
            field=models.CharField(
                blank=True,
                db_index=True,
                default='',
                max_length=50,
                help_text='Referencia a BibliotecaPlantilla en schema public',
                verbose_name='Código Plantilla Maestra',
            ),
        ),
        migrations.AddField(
            model_name='plantilladocumento',
            name='es_personalizada',
            field=models.BooleanField(
                default=True,
                help_text='False si es copia exacta de plantilla maestra',
                verbose_name='Personalizada',
            ),
        ),
    ]
