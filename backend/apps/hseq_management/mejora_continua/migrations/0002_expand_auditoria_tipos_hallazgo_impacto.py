# Generated manually - Expand Auditoría tipos + Hallazgo impacto fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mejora_continua", "0001_initial"),
    ]

    operations = [
        # 1. Expand Auditoria.tipo choices and max_length
        migrations.AlterField(
            model_name="auditoria",
            name="tipo",
            field=models.CharField(
                choices=[
                    ("INTERNA", "Auditoría Interna"),
                    ("EXTERNA", "Auditoría Externa"),
                    ("SEGUIMIENTO", "Auditoría de Seguimiento"),
                    ("CERTIFICACION", "Auditoría de Certificación"),
                    ("RENOVACION", "Auditoría de Renovación"),
                    ("CONTROL_INTERNO", "Control Interno"),
                    ("DIAGNOSTICO", "Diagnóstico"),
                    ("PROVEEDOR", "Auditoría a Proveedor"),
                ],
                max_length=25,
            ),
        ),
        # 2. Add impacto field to Hallazgo
        migrations.AddField(
            model_name="hallazgo",
            name="impacto",
            field=models.CharField(
                blank=True,
                choices=[
                    ("ALTO", "Alto"),
                    ("MEDIO", "Medio"),
                    ("BAJO", "Bajo"),
                ],
                help_text="Nivel de impacto del hallazgo",
                max_length=10,
            ),
        ),
        # 3. Add area_impactada field to Hallazgo
        migrations.AddField(
            model_name="hallazgo",
            name="area_impactada",
            field=models.CharField(
                blank=True,
                help_text="Área específica afectada por el hallazgo",
                max_length=200,
            ),
        ),
        # 4. Add recomendacion field to Hallazgo
        migrations.AddField(
            model_name="hallazgo",
            name="recomendacion",
            field=models.TextField(
                blank=True,
                help_text="Recomendación de mejora asociada al hallazgo",
            ),
        ),
    ]
