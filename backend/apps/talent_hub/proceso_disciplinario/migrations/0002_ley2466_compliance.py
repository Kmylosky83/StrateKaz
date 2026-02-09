# Ley 2466/2025 - Campos de acompanante/apelacion en Descargo + nuevos modelos

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("proceso_disciplinario", "0001_initial"),
        ("colaboradores", "0001_initial"),
        ("configuracion", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # =============================================
        # Nuevos campos en Descargo (Ley 2466/2025)
        # =============================================
        migrations.AddField(
            model_name="descargo",
            name="tipo_acompanante",
            field=models.CharField(
                choices=[
                    ("ninguno", "Ninguno"),
                    ("sindical", "Representante Sindical"),
                    ("abogado", "Abogado"),
                    ("companero", "Compañero de Trabajo"),
                ],
                default="ninguno",
                max_length=20,
                verbose_name="Tipo de Acompañante",
            ),
        ),
        migrations.AddField(
            model_name="descargo",
            name="nombre_acompanante",
            field=models.CharField(
                blank=True,
                max_length=200,
                verbose_name="Nombre del Acompañante",
            ),
        ),
        migrations.AddField(
            model_name="descargo",
            name="representante_sindical",
            field=models.CharField(
                blank=True,
                max_length=200,
                verbose_name="Representante Sindical",
            ),
        ),
        migrations.AddField(
            model_name="descargo",
            name="apelado",
            field=models.BooleanField(default=False, verbose_name="Apelado"),
        ),
        migrations.AddField(
            model_name="descargo",
            name="fecha_apelacion",
            field=models.DateField(blank=True, null=True, verbose_name="Fecha de Apelación"),
        ),
        migrations.AddField(
            model_name="descargo",
            name="motivo_apelacion",
            field=models.TextField(blank=True, verbose_name="Motivo de Apelación"),
        ),
        migrations.AddField(
            model_name="descargo",
            name="resultado_apelacion",
            field=models.CharField(
                choices=[
                    ("pendiente", "Pendiente"),
                    ("confirmado", "Confirmado"),
                    ("modificado", "Modificado"),
                    ("revocado", "Revocado"),
                ],
                default="pendiente",
                max_length=15,
                verbose_name="Resultado de Apelación",
            ),
        ),
        migrations.AddField(
            model_name="descargo",
            name="resuelto_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="descargos_resueltos",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Resuelto Por",
            ),
        ),
        # =============================================
        # Nuevo modelo: NotificacionDisciplinaria
        # =============================================
        migrations.CreateModel(
            name="NotificacionDisciplinaria",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Fecha de Creación")),
                ("updated_at", models.DateTimeField(auto_now=True, db_index=True, verbose_name="Última Actualización")),
                ("is_active", models.BooleanField(db_index=True, default=True, verbose_name="Activo")),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True, verbose_name="Fecha de Eliminación")),
                ("tipo", models.CharField(
                    choices=[
                        ("citacion_descargos", "Citación a Descargos"),
                        ("notificacion_sancion", "Notificación de Sanción"),
                        ("notificacion_apelacion", "Notificación de Apelación"),
                        ("notificacion_resultado", "Notificación de Resultado"),
                    ],
                    db_index=True,
                    max_length=30,
                    verbose_name="Tipo de Notificación",
                )),
                ("contenido", models.TextField(verbose_name="Contenido de la Notificación")),
                ("fecha_entrega", models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Entrega")),
                ("acuse_recibo", models.BooleanField(default=False, verbose_name="Acuse de Recibo")),
                ("fecha_acuse", models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Acuse")),
                ("testigo_entrega", models.CharField(blank=True, max_length=200, verbose_name="Testigo de Entrega")),
                ("archivo_soporte", models.FileField(blank=True, null=True, upload_to="proceso_disciplinario/notificaciones/", verbose_name="Archivo Soporte")),
                ("colaborador", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="notificaciones_disciplinarias", to="colaboradores.colaborador")),
                ("descargo", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="notificaciones", to="proceso_disciplinario.descargo")),
                ("memorando", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="notificaciones", to="proceso_disciplinario.memorando")),
                ("empresa", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="%(app_label)s_%(class)s_set", to="configuracion.empresaconfig", verbose_name="Empresa")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL, verbose_name="Creado por")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="%(app_label)s_%(class)s_updated", to=settings.AUTH_USER_MODEL, verbose_name="Actualizado por")),
            ],
            options={
                "verbose_name": "Notificación Disciplinaria",
                "verbose_name_plural": "Notificaciones Disciplinarias",
                "db_table": "talent_hub_notificacion_disciplinaria",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="notificaciondisciplinaria",
            index=models.Index(fields=["empresa", "colaborador"], name="th_notif_disc_emp_col_idx"),
        ),
        migrations.AddIndex(
            model_name="notificaciondisciplinaria",
            index=models.Index(fields=["tipo"], name="th_notif_disc_tipo_idx"),
        ),
        # =============================================
        # Nuevo modelo: PruebaDisciplinaria
        # =============================================
        migrations.CreateModel(
            name="PruebaDisciplinaria",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Fecha de Creación")),
                ("updated_at", models.DateTimeField(auto_now=True, db_index=True, verbose_name="Última Actualización")),
                ("is_active", models.BooleanField(db_index=True, default=True, verbose_name="Activo")),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True, verbose_name="Fecha de Eliminación")),
                ("tipo_prueba", models.CharField(
                    choices=[
                        ("documental", "Documental"),
                        ("testimonial", "Testimonial"),
                        ("tecnica", "Técnica"),
                        ("fotografica", "Fotográfica"),
                        ("video", "Video"),
                    ],
                    max_length=15,
                    verbose_name="Tipo de Prueba",
                )),
                ("descripcion", models.TextField(verbose_name="Descripción")),
                ("presentada_por", models.CharField(
                    choices=[("empresa", "Empresa"), ("colaborador", "Colaborador")],
                    max_length=15,
                    verbose_name="Presentada Por",
                )),
                ("archivo", models.FileField(blank=True, null=True, upload_to="proceso_disciplinario/pruebas/", verbose_name="Archivo")),
                ("fecha_presentacion", models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Presentación")),
                ("admitida", models.BooleanField(blank=True, null=True, verbose_name="Admitida")),
                ("observaciones_admision", models.TextField(blank=True, verbose_name="Observaciones de Admisión")),
                ("descargo", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="pruebas", to="proceso_disciplinario.descargo")),
                ("empresa", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="%(app_label)s_%(class)s_set", to="configuracion.empresaconfig", verbose_name="Empresa")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="%(app_label)s_%(class)s_created", to=settings.AUTH_USER_MODEL, verbose_name="Creado por")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="%(app_label)s_%(class)s_updated", to=settings.AUTH_USER_MODEL, verbose_name="Actualizado por")),
            ],
            options={
                "verbose_name": "Prueba Disciplinaria",
                "verbose_name_plural": "Pruebas Disciplinarias",
                "db_table": "talent_hub_prueba_disciplinaria",
                "ordering": ["-fecha_presentacion"],
            },
        ),
        migrations.AddIndex(
            model_name="pruebadisciplinaria",
            index=models.Index(fields=["descargo", "presentada_por"], name="th_prueba_disc_desc_pres_idx"),
        ),
    ]
