# Ley 2466/2025 - HistorialContrato para trazabilidad de contratos

import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("seleccion_contratacion", "0001_initial"),
        ("colaboradores", "0001_initial"),
        ("configuracion", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="HistorialContrato",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Fecha de Creación")),
                ("updated_at", models.DateTimeField(auto_now=True, db_index=True, verbose_name="Última Actualización")),
                ("is_active", models.BooleanField(db_index=True, default=True, verbose_name="Activo")),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True, verbose_name="Fecha de Eliminación")),
                ("numero_contrato", models.CharField(db_index=True, max_length=50, verbose_name="Número de Contrato")),
                ("fecha_inicio", models.DateField(db_index=True, verbose_name="Fecha de Inicio")),
                ("fecha_fin", models.DateField(blank=True, null=True, verbose_name="Fecha de Fin", help_text="Nulo para contratos a término indefinido")),
                ("salario_pactado", models.DecimalField(decimal_places=2, max_digits=12, verbose_name="Salario Pactado")),
                ("objeto_contrato", models.TextField(blank=True, verbose_name="Objeto del Contrato")),
                ("tipo_movimiento", models.CharField(
                    choices=[
                        ("contrato_inicial", "Contrato Inicial"),
                        ("renovacion", "Renovación"),
                        ("otrosi", "Otrosí"),
                        ("prorroga", "Prórroga"),
                    ],
                    default="contrato_inicial",
                    max_length=20,
                    verbose_name="Tipo de Movimiento",
                )),
                ("numero_renovacion", models.PositiveIntegerField(default=0, verbose_name="Número de Renovación")),
                ("justificacion_tipo_contrato", models.TextField(blank=True, verbose_name="Justificación del Tipo de Contrato", help_text="Ley 2466/2025: Requerido si no es indefinido")),
                ("fecha_preaviso_terminacion", models.DateField(blank=True, null=True, verbose_name="Fecha de Preaviso")),
                ("preaviso_entregado", models.BooleanField(default=False, verbose_name="Preaviso Entregado")),
                ("firmado", models.BooleanField(default=False, verbose_name="Firmado")),
                ("fecha_firma", models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Firma")),
                ("archivo_contrato", models.FileField(blank=True, null=True, upload_to="talent_hub/contratos/", verbose_name="Archivo del Contrato")),
                ("colaborador", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="historial_contratos", to="colaboradores.colaborador", verbose_name="Colaborador")),
                ("tipo_contrato", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="historial_contratos", to="seleccion_contratacion.tipocontrato", verbose_name="Tipo de Contrato")),
                ("contrato_padre", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="movimientos", to="seleccion_contratacion.historialcontrato", verbose_name="Contrato Padre")),
                ("empresa", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="%(app_label)s_%(class)s_set", to="configuracion.empresaconfig", verbose_name="Empresa")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL, verbose_name="Creado por")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="%(app_label)s_%(class)s_updated", to=settings.AUTH_USER_MODEL, verbose_name="Actualizado por")),
            ],
            options={
                "verbose_name": "Historial de Contrato",
                "verbose_name_plural": "Historial de Contratos",
                "db_table": "talent_hub_historial_contrato",
                "ordering": ["-fecha_inicio"],
                "unique_together": {("empresa", "numero_contrato")},
            },
        ),
        migrations.AddIndex(
            model_name="historialcontrato",
            index=models.Index(fields=["empresa", "colaborador"], name="th_hist_cont_emp_col_idx"),
        ),
        migrations.AddIndex(
            model_name="historialcontrato",
            index=models.Index(fields=["fecha_inicio"], name="th_hist_cont_fecha_idx"),
        ),
        migrations.AddIndex(
            model_name="historialcontrato",
            index=models.Index(fields=["tipo_movimiento"], name="th_hist_cont_tipo_mov_idx"),
        ),
        migrations.AddIndex(
            model_name="historialcontrato",
            index=models.Index(fields=["numero_contrato"], name="th_hist_cont_num_idx"),
        ),
    ]
