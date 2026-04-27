"""
H-SC-TALONARIO (2026-04-27):
Soporte para registro manual post-hoc de vouchers desde planta.

- Agrega `origen_registro` (EN_RUTA default, TRANSCRIPCION_PLANTA, TALONARIO_MANUAL).
- Agrega `numero_talonario` para referenciar el recibo físico.
- Agrega `registrado_por_planta` FK al usuario de planta que transcribió.
- Hace `operador` nullable (validación condicional vive en clean()).
- Backfill: todos los registros existentes → origen='EN_RUTA' (preserva
  la semántica histórica: si ya estaba registrado, fue capturado en ruta).

Nota técnica: el default 'EN_RUTA' del schema ya hace el backfill implícito
para AddField con default. No requiere RunPython explícito.
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sc_recoleccion", "0003_voucher_atomico_por_parada"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Hacer operador nullable (validación condicional en clean()).
        migrations.AlterField(
            model_name="voucherrecoleccion",
            name="operador",
            field=models.ForeignKey(
                blank=True,
                help_text=(
                    "Usuario que registró este voucher en ruta. Obligatorio "
                    "cuando origen=EN_RUTA. Puede quedar vacío en transcripciones "
                    "de talonario."
                ),
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="vouchers_recoleccion_operados",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Operador",
            ),
        ),

        # 2. Agregar origen_registro con default EN_RUTA (backfill implícito).
        migrations.AddField(
            model_name="voucherrecoleccion",
            name="origen_registro",
            field=models.CharField(
                choices=[
                    ("EN_RUTA", "Capturado en ruta (app/tablet)"),
                    (
                        "TRANSCRIPCION_PLANTA",
                        "Transcripción de talonario en planta",
                    ),
                    ("TALONARIO_MANUAL", "Registro manual desde planta"),
                ],
                db_index=True,
                default="EN_RUTA",
                help_text=(
                    "Indica si el voucher fue capturado en ruta o transcrito "
                    "post-hoc desde planta a partir de un talonario físico."
                ),
                max_length=30,
                verbose_name="Origen del registro",
            ),
        ),

        # 3. Agregar numero_talonario (texto libre, opcional).
        migrations.AddField(
            model_name="voucherrecoleccion",
            name="numero_talonario",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Referencia al recibo físico (papel) cuando aplica.",
                max_length=50,
                verbose_name="Número de talonario",
            ),
        ),

        # 4. Agregar registrado_por_planta FK opcional.
        migrations.AddField(
            model_name="voucherrecoleccion",
            name="registrado_por_planta",
            field=models.ForeignKey(
                blank=True,
                help_text=(
                    "Usuario de planta que transcribió el talonario. "
                    "Obligatorio cuando origen=TRANSCRIPCION_PLANTA o "
                    "TALONARIO_MANUAL."
                ),
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="vouchers_recoleccion_transcritos",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Registrado por (planta)",
            ),
        ),

        # 5. Índice por origen_registro (queries de auditoría/filtro).
        migrations.AddIndex(
            model_name="voucherrecoleccion",
            index=models.Index(
                fields=["origen_registro", "-fecha_recoleccion"],
                name="sc_vrc_origen_fecha_idx",
            ),
        ),
    ]
