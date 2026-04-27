"""Migración 0025 — H-GD-A5

Agrega `Documento.archivo_hash_sha256` (SHA-256 del PDF al ingerir/adoptar)
para detectar duplicados antes de crear un nuevo registro.

- Campo CharField(64), blank=True, default='', db_index=True.
- No se requiere backfill: documentos existentes mantienen hash vacío
  (el chequeo de duplicados solo aplica a nuevas ingestas).
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_documental', '0024_search_texto_extraido'),
    ]

    operations = [
        migrations.AddField(
            model_name='documento',
            name='archivo_hash_sha256',
            field=models.CharField(
                blank=True,
                db_index=True,
                default='',
                help_text=(
                    'SHA-256 del PDF subido al ingestar/adoptar. Permite '
                    'detectar duplicados antes de crear el Documento.'
                ),
                max_length=64,
                verbose_name='Hash SHA-256 del archivo original',
            ),
        ),
    ]
