# Generated manually - Sprint contratos-onboarding-1
# Adds FK from FirmaDocumento to HistorialContrato for contract traceability

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("onboarding_induccion", "0001_initial"),
        ("seleccion_contratacion", "0008_add_firma_digital_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="firmadocumento",
            name="historial_contrato",
            field=models.ForeignKey(
                blank=True,
                help_text="Vínculo al contrato laboral del módulo de contratación",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="firmas_onboarding",
                to="seleccion_contratacion.historialcontrato",
                verbose_name="Contrato asociado",
            ),
        ),
    ]
