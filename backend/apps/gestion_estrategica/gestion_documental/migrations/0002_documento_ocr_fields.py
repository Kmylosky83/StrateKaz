"""
Agrega campos OCR/extracción de texto al modelo Documento (Fase 5).
- texto_extraido: texto completo extraído del PDF
- ocr_estado: estado del procesamiento OCR
- ocr_metadatos: metadata JSON (método, confianza, páginas, duración)
- es_externo: flag para documentos ingresados por upload externo
- archivo_original: FileField para el PDF original subido
- GIN index para búsqueda full-text con tsvector (español)
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_documental', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='documento',
            name='texto_extraido',
            field=models.TextField(
                blank=True,
                default='',
                help_text='Texto completo extraído del PDF (pdfplumber o Tesseract OCR)',
                verbose_name='Texto Extraído',
            ),
        ),
        migrations.AddField(
            model_name='documento',
            name='ocr_estado',
            field=models.CharField(
                choices=[
                    ('PENDIENTE', 'Pendiente'),
                    ('PROCESANDO', 'Procesando'),
                    ('COMPLETADO', 'Completado'),
                    ('ERROR', 'Error'),
                    ('NO_APLICA', 'No Aplica'),
                ],
                db_index=True,
                default='NO_APLICA',
                max_length=20,
                verbose_name='Estado OCR',
            ),
        ),
        migrations.AddField(
            model_name='documento',
            name='ocr_metadatos',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='{"metodo": "pdfplumber|tesseract", "confianza": 0.95, "paginas": 10, "duracion_seg": 5.2}',
                verbose_name='Metadatos OCR',
            ),
        ),
        migrations.AddField(
            model_name='documento',
            name='es_externo',
            field=models.BooleanField(
                default=False,
                help_text='True si fue ingresado por upload de PDF externo',
                verbose_name='Documento Externo',
            ),
        ),
        migrations.AddField(
            model_name='documento',
            name='archivo_original',
            field=models.FileField(
                blank=True,
                null=True,
                upload_to='documentos/originales/%Y/%m/',
                help_text='PDF original subido externamente para OCR',
                verbose_name='Archivo Original',
            ),
        ),
        # GIN index para búsqueda full-text en español
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS documental_documento_busqueda_gin
                ON documental_documento
                USING GIN (
                    to_tsvector('spanish',
                        COALESCE(texto_extraido, '') || ' ' ||
                        COALESCE(titulo, '') || ' ' ||
                        COALESCE(resumen, '')
                    )
                );
            """,
            reverse_sql="DROP INDEX IF EXISTS documental_documento_busqueda_gin;",
        ),
    ]
