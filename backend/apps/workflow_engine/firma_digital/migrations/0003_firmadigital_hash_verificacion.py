"""
Migración: Hash de verificación extendido para FirmaDigital (ISO 27001).
SHA-256(trazo + otp + doc_id + version + timestamp_utc + cédula)
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('firma_digital', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='firmadigital',
            name='hash_verificacion',
            field=models.CharField(
                blank=True,
                default='',
                help_text='SHA-256(trazo + otp + doc_id + version + timestamp_utc + cédula) — ISO 27001',
                max_length=64,
                verbose_name='Hash de Verificación Extendido',
            ),
        ),
    ]
