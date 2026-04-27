"""
H-SC-02 — Liquidación: estados ampliados (SUGERIDA/AJUSTADA/CONFIRMADA),
historial de ajustes append-only, snapshot precio_kg_sugerido y referencia
a documento archivado en Gestión Documental.

Backfill al final:
- BORRADOR  → SUGERIDA
- APROBADA  → CONFIRMADA
- LiquidacionLinea.precio_kg_sugerido = LiquidacionLinea.precio_unitario
"""
from decimal import Decimal

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def forwards_backfill(apps, schema_editor):
    """Backfill de estados deprecated y precio_kg_sugerido en líneas."""
    Liquidacion = apps.get_model("liquidaciones", "Liquidacion")
    LiquidacionLinea = apps.get_model("liquidaciones", "LiquidacionLinea")

    Liquidacion.objects.filter(estado="BORRADOR").update(estado="SUGERIDA")
    Liquidacion.objects.filter(estado="APROBADA").update(estado="CONFIRMADA")

    # Snapshot precio_kg_sugerido = precio_unitario para registros previos.
    for linea in LiquidacionLinea.objects.filter(
        precio_kg_sugerido__isnull=True
    ).iterator():
        LiquidacionLinea.objects.filter(pk=linea.pk).update(
            precio_kg_sugerido=linea.precio_unitario or Decimal("0.00")
        )


def backwards_noop(apps, schema_editor):
    """No revertir backfill: estados nuevos no caben en choices viejos."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("liquidaciones", "0007_liquidacionperiodica_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="liquidacion",
            name="documento_archivado_id",
            field=models.PositiveIntegerField(
                blank=True,
                db_index=True,
                help_text="ID del Documento de Gestión Documental generado al confirmar la liquidación. Se llena vía servicio (cross-app, sin FK).",
                null=True,
                verbose_name="ID Documento archivado en GD",
            ),
        ),
        migrations.AddField(
            model_name="liquidacionlinea",
            name="precio_kg_sugerido",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Snapshot del precio vigente al crear. Inmutable.",
                max_digits=14,
                null=True,
                verbose_name="Precio kg sugerido (snapshot)",
            ),
        ),
        migrations.AlterField(
            model_name="liquidacion",
            name="aprobado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="liquidaciones_aprobadas",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Aprobado / confirmado por",
            ),
        ),
        migrations.AlterField(
            model_name="liquidacion",
            name="estado",
            field=models.CharField(
                choices=[
                    ("SUGERIDA", "Sugerida (auto-creada)"),
                    ("AJUSTADA", "Ajustada (precio modificado)"),
                    ("CONFIRMADA", "Confirmada por responsable"),
                    ("PAGADA", "Pagada"),
                    ("ANULADA", "Anulada"),
                    ("BORRADOR", "[deprecated] Borrador"),
                    ("APROBADA", "[deprecated] Aprobada"),
                ],
                db_index=True,
                default="SUGERIDA",
                max_length=20,
                verbose_name="Estado",
            ),
        ),
        migrations.AlterField(
            model_name="liquidacion",
            name="fecha_aprobacion",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="Fecha de aprobación / confirmación"
            ),
        ),
        migrations.CreateModel(
            name="HistorialAjusteLiquidacion",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                        db_index=True,
                        verbose_name="Fecha de creación",
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True, verbose_name="Última actualización"
                    ),
                ),
                (
                    "is_deleted",
                    models.BooleanField(
                        db_index=True, default=False, verbose_name="Eliminado"
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Fecha de eliminación"
                    ),
                ),
                (
                    "tipo_ajuste",
                    models.CharField(
                        choices=[
                            ("PRECIO", "Precio"),
                            ("CALIDAD", "Ajuste de calidad"),
                            ("CANTIDAD", "Cantidad"),
                        ],
                        max_length=20,
                        verbose_name="Tipo de ajuste",
                    ),
                ),
                (
                    "valor_anterior",
                    models.DecimalField(
                        decimal_places=4, max_digits=14, verbose_name="Valor anterior"
                    ),
                ),
                (
                    "valor_nuevo",
                    models.DecimalField(
                        decimal_places=4, max_digits=14, verbose_name="Valor nuevo"
                    ),
                ),
                ("motivo", models.TextField(verbose_name="Motivo")),
                (
                    "origen",
                    models.CharField(
                        choices=[
                            ("QC", "Control de calidad"),
                            ("MANUAL", "Manual"),
                            ("CORRECCION", "Corrección de error"),
                        ],
                        default="MANUAL",
                        max_length=20,
                        verbose_name="Origen",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Creado por",
                    ),
                ),
                (
                    "deleted_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Eliminado por",
                    ),
                ),
                (
                    "linea",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="historial_ajustes",
                        to="liquidaciones.liquidacionlinea",
                        verbose_name="Línea",
                    ),
                ),
                (
                    "liquidacion",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="historial_ajustes",
                        to="liquidaciones.liquidacion",
                        verbose_name="Liquidación",
                    ),
                ),
                (
                    "modificado_por",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="ajustes_liquidacion",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Modificado por",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Actualizado por",
                    ),
                ),
            ],
            options={
                "verbose_name": "Historial de ajuste de liquidación",
                "verbose_name_plural": "Historial de ajustes de liquidación",
                "db_table": "supply_chain_liquidacion_historial_ajuste",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["liquidacion", "-created_at"],
                        name="supply_chai_liquida_83d2cd_idx",
                    ),
                    models.Index(
                        fields=["linea", "-created_at"],
                        name="supply_chai_linea_i_c46803_idx",
                    ),
                ],
            },
        ),
        # Backfill: BORRADOR→SUGERIDA, APROBADA→CONFIRMADA, snapshot precio.
        migrations.RunPython(forwards_backfill, backwards_noop),
    ]
