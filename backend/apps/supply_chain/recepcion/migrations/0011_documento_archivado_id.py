"""
H-SC-GD-ARCHIVE (2026-04-27): agrega campo `documento_archivado_id` a
VoucherRecepcion.

Al aprobar el voucher se archiva un PDF carta en Gestión Documental como
registro/evidencia. Este campo guarda el ID del Documento creado para
idempotencia (no archivar dos veces) y para deep-linking desde la UI.

IntegerField (no FK) para evitar dependencia circular CT (gestion_documental)
↔ C2 (supply_chain). Ver CLAUDE.md → "Reglas de independencia".
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sc_recepcion", "0010_m2m_vouchers_recoleccion"),
    ]

    operations = [
        migrations.AddField(
            model_name="voucherrecepcion",
            name="documento_archivado_id",
            field=models.IntegerField(
                blank=True,
                db_index=True,
                null=True,
                help_text=(
                    "ID del Documento generado en Gestión Documental al aprobar."
                ),
                verbose_name="Documento archivado en GD",
            ),
        ),
    ]
