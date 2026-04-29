"""
H-SC-RUTA-02 — Crear modelo RutaParada (M2M Ruta ↔ Proveedor + metadata).
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogos", "0007_rutarecoleccion_modo_operacion"),
        ("infra_catalogo_productos", "0020_proveedor_drop_sede_empresa_origen"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="RutaParada",
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
                    "orden",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Secuencia en el recorrido (0 = primera parada).",
                        verbose_name="Orden de visita",
                    ),
                ),
                (
                    "frecuencia_pago",
                    models.CharField(
                        choices=[
                            ("SEMANAL", "Semanal"),
                            ("QUINCENAL", "Quincenal"),
                            ("MENSUAL", "Mensual"),
                        ],
                        default="MENSUAL",
                        max_length=20,
                        verbose_name="Frecuencia de pago al productor",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        db_index=True, default=True, verbose_name="Activa"
                    ),
                ),
                (
                    "notas",
                    models.TextField(
                        blank=True,
                        default="",
                        help_text="Notas internas de logística para esta parada.",
                        verbose_name="Notas operativas",
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
                (
                    "ruta",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="paradas",
                        to="catalogos.rutarecoleccion",
                        verbose_name="Ruta",
                    ),
                ),
                (
                    "proveedor",
                    models.ForeignKey(
                        help_text="Proveedor real con NIT/datos reales que la ruta visita.",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="paradas_ruta",
                        to="infra_catalogo_productos.proveedor",
                        verbose_name="Proveedor (productor visitado)",
                    ),
                ),
            ],
            options={
                "verbose_name": "Parada de Ruta",
                "verbose_name_plural": "Paradas de Ruta",
                "db_table": "supply_chain_ruta_parada",
                "ordering": ["ruta", "orden"],
                "indexes": [
                    models.Index(fields=["ruta", "orden"], name="supply_chai_ruta_id_par_idx"),
                    models.Index(fields=["proveedor"], name="supply_chai_proveed_par_idx"),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        condition=models.Q(("is_deleted", False)),
                        fields=("proveedor",),
                        name="uq_ruta_parada_proveedor_unico",
                    ),
                ],
            },
        ),
    ]
