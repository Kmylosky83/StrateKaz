"""
H-GD-A2: GIN index dedicado para búsqueda full-text sobre texto_extraido.

Contexto:
- 0002_documento_ocr_fields.py creó un GIN compuesto sobre
  COALESCE(texto_extraido) || titulo || resumen, sin diferenciar confianza.
- A partir de esta migración, el SearchVector del DocumentoViewSet
  filtra texto_extraido por confianza OCR >= 0.7 para evitar ruido.
- Este índice GIN dedicado acelera el tsvector('spanish', texto_extraido)
  cuando texto_extraido es no nulo y largo.

Estrategia:
- Usar to_tsvector('spanish', COALESCE(texto_extraido, '')) para evitar
  errores cuando el campo está NULL/vacío.
- IF NOT EXISTS para idempotencia en re-runs y multi-tenant.
- Nombre del índice descriptivo y único para no chocar con 0002.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('infra_gestion_documental', '0023_revert_to_tenant_model'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS documental_documento_texto_extraido_gin
                ON documental_documento
                USING GIN (
                    to_tsvector('spanish', COALESCE(texto_extraido, ''))
                );
            """,
            reverse_sql=(
                "DROP INDEX IF EXISTS documental_documento_texto_extraido_gin;"
            ),
        ),
    ]
