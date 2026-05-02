"""
H-SC-RUTA-02 — Crear modelo PrecioRutaSemiAutonoma (doble precio Modelo 2).
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogos", "0008_rutaparada"),
        ("infra_catalogo_productos", "0020_proveedor_drop_sede_empresa_origen"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PrecioRutaSemiAutonoma",
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
                    "precio_ruta_paga_proveedor",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=10,
                        verbose_name="Precio que la ruta paga al productor (por kg)",
                    ),
                ),
                (
                    "precio_empresa_paga_ruta",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Debe ser >= precio_ruta_paga_proveedor (la diferencia es el ingreso operativo de la ruta).",
                        max_digits=10,
                        verbose_name="Precio que la empresa paga a la ruta (por kg)",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        db_index=True, default=True, verbose_name="Vigente"
                    ),
                ),
                (
                    "notas",
                    models.TextField(
                        blank=True, default="", verbose_name="Notas internas"
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Creado por",
                    ),
                ),
                (
                    "deleted_by",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Eliminado por",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True, null=True,
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
                        related_name="precios_internos",
                        to="catalogos.rutarecoleccion",
                        verbose_name="Ruta",
                    ),
                ),
                (
                    "proveedor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="precios_ruta_semi",
                        to="infra_catalogo_productos.proveedor",
                        verbose_name="Proveedor (productor)",
                    ),
                ),
                (
                    "producto",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="precios_ruta_semi",
                        to="infra_catalogo_productos.producto",
                        verbose_name="Producto (MP)",
                    ),
                ),
            ],
            options={
                "verbose_name": "Precio Ruta Semi-Autónoma",
                "verbose_name_plural": "Precios Rutas Semi-Autónomas",
                "db_table": "supply_chain_precio_ruta_semi",
                "ordering": ["ruta", "proveedor", "producto"],
                "indexes": [
                    models.Index(
                        fields=["ruta", "producto"], name="sc_prs_ruta_prod_idx"
                    ),
                    models.Index(
                        fields=["proveedor", "producto"], name="sc_prs_prov_prod_idx"
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        condition=models.Q(("is_deleted", False), ("is_active", True)),
                        fields=("ruta", "proveedor", "producto"),
                        name="uq_precio_ruta_semi_vigente",
                    ),
                ],
            },
        ),
    ]
