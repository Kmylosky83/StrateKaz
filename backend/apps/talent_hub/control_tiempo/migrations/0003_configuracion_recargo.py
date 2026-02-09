# Ley 2466/2025 - ConfiguracionRecargo para recargos con fases graduales

import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("control_tiempo", "0002_initial"),
        ("configuracion", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ConfiguracionRecargo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Fecha de Creación")),
                ("updated_at", models.DateTimeField(auto_now=True, db_index=True, verbose_name="Última Actualización")),
                ("is_active", models.BooleanField(db_index=True, default=True, verbose_name="Activo")),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True, verbose_name="Fecha de Eliminación")),
                ("tipo_hora_extra", models.CharField(
                    choices=[
                        ("diurna", "Diurna - Recargo 25%"),
                        ("nocturna", "Nocturna - Recargo 75%"),
                        ("dominical_diurna", "Dominical Diurna - Recargo 75%"),
                        ("dominical_nocturna", "Dominical Nocturna - Recargo 110%"),
                        ("festivo_diurna", "Festivo Diurna - Recargo 75%"),
                        ("festivo_nocturna", "Festivo Nocturna - Recargo 110%"),
                    ],
                    max_length=25,
                    verbose_name="Tipo de Hora Extra",
                )),
                ("factor_vigente", models.DecimalField(
                    decimal_places=2,
                    max_digits=4,
                    verbose_name="Factor Vigente Actual",
                    help_text="Factor de recargo vigente antes de la ley",
                )),
                ("factor_fase_1", models.DecimalField(
                    decimal_places=2,
                    max_digits=4,
                    verbose_name="Factor Fase 1 (80%)",
                    help_text="Desde julio 2025 - 80% del recargo pleno",
                )),
                ("fecha_inicio_fase_1", models.DateField(
                    default="2025-07-15",
                    verbose_name="Inicio Fase 1",
                )),
                ("factor_fase_2", models.DecimalField(
                    decimal_places=2,
                    max_digits=4,
                    verbose_name="Factor Fase 2 (90%)",
                    help_text="Desde julio 2026 - 90% del recargo pleno",
                )),
                ("fecha_inicio_fase_2", models.DateField(
                    default="2026-07-15",
                    verbose_name="Inicio Fase 2",
                )),
                ("factor_fase_3", models.DecimalField(
                    decimal_places=2,
                    max_digits=4,
                    verbose_name="Factor Fase 3 (100%)",
                    help_text="Desde julio 2027 - 100% del recargo pleno",
                )),
                ("fecha_inicio_fase_3", models.DateField(
                    default="2027-07-15",
                    verbose_name="Inicio Fase 3",
                )),
                ("empresa", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="%(app_label)s_%(class)s_set",
                    to="configuracion.empresaconfig",
                    verbose_name="Empresa",
                )),
                ("created_by", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="%(app_label)s_%(class)s_created",
                    to=settings.AUTH_USER_MODEL,
                    verbose_name="Creado por",
                )),
                ("updated_by", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="%(app_label)s_%(class)s_updated",
                    to=settings.AUTH_USER_MODEL,
                    verbose_name="Actualizado por",
                )),
            ],
            options={
                "verbose_name": "Configuración de Recargo",
                "verbose_name_plural": "Configuraciones de Recargo",
                "db_table": "talent_hub_configuracion_recargo",
                "ordering": ["tipo_hora_extra"],
                "unique_together": {("empresa", "tipo_hora_extra")},
            },
        ),
    ]
