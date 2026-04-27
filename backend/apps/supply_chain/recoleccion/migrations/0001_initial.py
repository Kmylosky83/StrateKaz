"""
H-SC-RUTA-02 — Migración inicial app recoleccion.

Crea VoucherRecoleccion + LineaVoucherRecoleccion. Ambos modelos heredan
TenantModel (timestamps + soft-delete + audit).
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("catalogos", "0008_rutaparada"),
        ("catalogo_productos", "0020_proveedor_drop_sede_empresa_origen"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="VoucherRecoleccion",
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
                    "codigo",
                    models.CharField(
                        blank=True,
                        db_index=True,
                        help_text="Código único del voucher (ej: VRC-001). Se auto-genera si viene vacío.",
                        max_length=50,
                        unique=True,
                        verbose_name="Código",
                    ),
                ),
                (
                    "fecha_recoleccion",
                    models.DateField(
                        help_text="Día en que se realizó (o se realizará) la recolección.",
                        verbose_name="Fecha de recolección",
                    ),
                ),
                (
                    "estado",
                    models.CharField(
                        choices=[
                            ("BORRADOR", "Borrador"),
                            ("COMPLETADO", "Completado"),
                            ("CONSOLIDADO", "Consolidado en recepción"),
                        ],
                        db_index=True,
                        default="BORRADOR",
                        max_length=20,
                        verbose_name="Estado",
                    ),
                ),
                (
                    "notas",
                    models.TextField(
                        blank=True,
                        default="",
                        help_text="Observaciones del operador (clima, novedades, etc.).",
                        verbose_name="Notas",
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
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="salidas_recoleccion",
                        to="catalogos.rutarecoleccion",
                        verbose_name="Ruta",
                    ),
                ),
                (
                    "operador",
                    models.ForeignKey(
                        help_text="Usuario que registra el voucher (auto desde request.user).",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="vouchers_recoleccion_operados",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Operador",
                    ),
                ),
            ],
            options={
                "verbose_name": "Voucher de Recolección",
                "verbose_name_plural": "Vouchers de Recolección",
                "db_table": "supply_chain_voucher_recoleccion",
                "ordering": ["-fecha_recoleccion", "-created_at"],
                "indexes": [
                    models.Index(
                        fields=["ruta", "-fecha_recoleccion"],
                        name="sc_vrc_ruta_fecha_idx",
                    ),
                    models.Index(
                        fields=["estado", "-fecha_recoleccion"],
                        name="sc_vrc_estado_fecha_idx",
                    ),
                    models.Index(fields=["fecha_recoleccion"], name="sc_vrc_fecha_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="LineaVoucherRecoleccion",
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
                    "cantidad",
                    models.DecimalField(
                        decimal_places=3,
                        help_text="Kilos declarados/entregados por el proveedor en esta parada.",
                        max_digits=12,
                        verbose_name="Cantidad (kilos)",
                    ),
                ),
                (
                    "notas",
                    models.CharField(
                        blank=True, default="", max_length=200, verbose_name="Notas de línea"
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
                    "voucher",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="lineas",
                        to="sc_recoleccion.voucherrecoleccion",
                        verbose_name="Voucher",
                    ),
                ),
                (
                    "proveedor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="lineas_recoleccion",
                        to="catalogo_productos.proveedor",
                        verbose_name="Proveedor (productor)",
                    ),
                ),
                (
                    "producto",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="lineas_recoleccion",
                        to="catalogo_productos.producto",
                        verbose_name="Producto (MP)",
                    ),
                ),
            ],
            options={
                "verbose_name": "Línea de Voucher de Recolección",
                "verbose_name_plural": "Líneas de Voucher de Recolección",
                "db_table": "supply_chain_voucher_recoleccion_linea",
                "ordering": ["voucher", "id"],
                "indexes": [
                    models.Index(
                        fields=["voucher", "proveedor"],
                        name="sc_vrc_lin_v_p_idx",
                    ),
                    models.Index(fields=["producto"], name="sc_vrc_lin_prod_idx"),
                ],
            },
        ),
    ]
