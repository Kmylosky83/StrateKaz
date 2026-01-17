"""
Fase 0.3.4: Eliminar modelos legacy de firma de política

Esta migración elimina completamente los modelos de firma que fueron
migrados al sistema universal FirmaDigital en workflow_engine.

Modelos eliminados (de 0007_add_workflow_firma_models):
- ConfiguracionFlujoFirma -> ahora en workflow_engine.firma_digital.models
- ProcesoFirmaPolitica -> obsoleto, usar FirmaDigital directamente
- FirmaPolitica -> ahora FirmaDigital en workflow_engine
- HistorialFirmaPolitica -> obsoleto, usar HistorialFirma en workflow_engine

Modelos eliminados (de 0003_add_review_date_to_politica_integral):
- FirmaDigital -> ahora en workflow_engine.firma_digital.models
- ConfiguracionRevision -> ahora en workflow_engine.firma_digital.models
- HistorialVersion -> ahora en workflow_engine.firma_digital.models
- ConfiguracionWorkflowFirma -> ahora en workflow_engine.firma_digital.models

También actualiza:
- TipoPolitica.flujo_firma_default -> apunta a firma_digital.ConfiguracionFlujoFirma
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("identidad", "0012_remove_procesofirmapolitica_identidad_p_tipo_po_d454e4_idx_and_more"),
    ]

    operations = [
        # PASO 1: Remover FK de TipoPolitica hacia ConfiguracionFlujoFirma legacy
        migrations.RemoveField(
            model_name="tipopolitica",
            name="flujo_firma_default",
        ),

        # PASO 2: Eliminar modelos legacy de firma de política
        migrations.DeleteModel(
            name="HistorialFirmaPolitica",
        ),
        migrations.DeleteModel(
            name="FirmaPolitica",
        ),
        migrations.DeleteModel(
            name="ProcesoFirmaPolitica",
        ),
        migrations.DeleteModel(
            name="ConfiguracionFlujoFirma",
        ),

        # PASO 3: Eliminar modelos de workflow que fueron movidos a workflow_engine
        migrations.DeleteModel(
            name="FirmaDigital",
        ),
        migrations.DeleteModel(
            name="ConfiguracionRevision",
        ),
        migrations.DeleteModel(
            name="HistorialVersion",
        ),
        migrations.DeleteModel(
            name="ConfiguracionWorkflowFirma",
        ),
    ]
