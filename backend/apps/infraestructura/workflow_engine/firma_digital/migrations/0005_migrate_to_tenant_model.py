# Migración: Cambiar herencia de BaseCompanyModel/TimestampedModel a TenantModel
# BaseCompanyModel: is_active + empresa + created_by + updated_by + created_at + updated_at + deleted_at
# TenantModel: is_deleted + deleted_at + deleted_by + created_by + updated_by + created_at + updated_at
#
# Modelos BaseCompanyModel (5): ConfiguracionFlujoFirma, FlowNode, DelegacionFirma,
#                                ConfiguracionRevision, HistorialVersion
# Modelos TimestampedModel (3): FirmaDigital, HistorialFirma, AlertaRevision

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def forwards_data(apps, schema_editor):
    """
    Invertir is_active → is_deleted para los 5 modelos BaseCompanyModel.
    is_active=True → is_deleted=False (default, ya establecido)
    is_active=False → is_deleted=True
    """
    db_alias = schema_editor.connection.alias

    for table in [
        'workflow_configuracion_flujo_firma',
        'workflow_flow_node',
        'workflow_delegacion_firma',
        'workflow_configuracion_revision',
        'workflow_historial_version',
    ]:
        schema_editor.execute(
            f'UPDATE "{table}" SET is_deleted = TRUE WHERE is_active = FALSE',
        )


def backwards_data(apps, schema_editor):
    """Invertir is_deleted → is_active"""
    for table in [
        'workflow_configuracion_flujo_firma',
        'workflow_flow_node',
        'workflow_delegacion_firma',
        'workflow_configuracion_revision',
        'workflow_historial_version',
    ]:
        schema_editor.execute(
            f'UPDATE "{table}" SET is_active = FALSE WHERE is_deleted = TRUE',
        )


class Migration(migrations.Migration):

    dependencies = [
        ("infra_firma_digital", "0004_firmantes_por_defecto"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # =====================================================================
        # PASO 1: Agregar campos nuevos de TenantModel a los 5 modelos BaseCompanyModel
        # (is_deleted, deleted_by — ya tienen created_by, updated_by, created_at, updated_at, deleted_at)
        # =====================================================================

        # --- ConfiguracionFlujoFirma ---
        migrations.AddField(
            model_name="configuracionflujofirma",
            name="is_deleted",
            field=models.BooleanField(
                db_index=True, default=False, verbose_name="Eliminado"
            ),
        ),
        migrations.AddField(
            model_name="configuracionflujofirma",
            name="deleted_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Eliminado por",
            ),
        ),

        # --- FlowNode ---
        migrations.AddField(
            model_name="flownode",
            name="is_deleted",
            field=models.BooleanField(
                db_index=True, default=False, verbose_name="Eliminado"
            ),
        ),
        migrations.AddField(
            model_name="flownode",
            name="deleted_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Eliminado por",
            ),
        ),

        # --- DelegacionFirma ---
        migrations.AddField(
            model_name="delegacionfirma",
            name="is_deleted",
            field=models.BooleanField(
                db_index=True, default=False, verbose_name="Eliminado"
            ),
        ),
        migrations.AddField(
            model_name="delegacionfirma",
            name="deleted_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Eliminado por",
            ),
        ),

        # --- ConfiguracionRevision ---
        migrations.AddField(
            model_name="configuracionrevision",
            name="is_deleted",
            field=models.BooleanField(
                db_index=True, default=False, verbose_name="Eliminado"
            ),
        ),
        migrations.AddField(
            model_name="configuracionrevision",
            name="deleted_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Eliminado por",
            ),
        ),

        # --- HistorialVersion ---
        migrations.AddField(
            model_name="historialversion",
            name="is_deleted",
            field=models.BooleanField(
                db_index=True, default=False, verbose_name="Eliminado"
            ),
        ),
        migrations.AddField(
            model_name="historialversion",
            name="deleted_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Eliminado por",
            ),
        ),

        # =====================================================================
        # PASO 2: Agregar TODOS los campos de TenantModel a los 3 modelos TimestampedModel
        # (is_deleted, deleted_at, deleted_by, created_by, updated_by)
        # =====================================================================

        # --- FirmaDigital ---
        migrations.AddField(
            model_name="firmadigital",
            name="is_deleted",
            field=models.BooleanField(
                db_index=True, default=False, verbose_name="Eliminado"
            ),
        ),
        migrations.AddField(
            model_name="firmadigital",
            name="deleted_at",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="Fecha de eliminación"
            ),
        ),
        migrations.AddField(
            model_name="firmadigital",
            name="deleted_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Eliminado por",
            ),
        ),
        migrations.AddField(
            model_name="firmadigital",
            name="created_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Creado por",
            ),
        ),
        migrations.AddField(
            model_name="firmadigital",
            name="updated_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Actualizado por",
            ),
        ),

        # --- HistorialFirma ---
        migrations.AddField(
            model_name="historialfirma",
            name="is_deleted",
            field=models.BooleanField(
                db_index=True, default=False, verbose_name="Eliminado"
            ),
        ),
        migrations.AddField(
            model_name="historialfirma",
            name="deleted_at",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="Fecha de eliminación"
            ),
        ),
        migrations.AddField(
            model_name="historialfirma",
            name="deleted_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Eliminado por",
            ),
        ),
        migrations.AddField(
            model_name="historialfirma",
            name="created_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Creado por",
            ),
        ),
        migrations.AddField(
            model_name="historialfirma",
            name="updated_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Actualizado por",
            ),
        ),

        # --- AlertaRevision ---
        migrations.AddField(
            model_name="alertarevision",
            name="is_deleted",
            field=models.BooleanField(
                db_index=True, default=False, verbose_name="Eliminado"
            ),
        ),
        migrations.AddField(
            model_name="alertarevision",
            name="deleted_at",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="Fecha de eliminación"
            ),
        ),
        migrations.AddField(
            model_name="alertarevision",
            name="deleted_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Eliminado por",
            ),
        ),
        migrations.AddField(
            model_name="alertarevision",
            name="created_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Creado por",
            ),
        ),
        migrations.AddField(
            model_name="alertarevision",
            name="updated_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Actualizado por",
            ),
        ),

        # =====================================================================
        # PASO 3: Migrar datos is_active → is_deleted (invertir lógica)
        # =====================================================================
        migrations.RunPython(forwards_data, backwards_data),

        # =====================================================================
        # PASO 4: Eliminar campo is_active de los 5 modelos BaseCompanyModel
        # =====================================================================
        migrations.RemoveField(
            model_name="configuracionflujofirma",
            name="is_active",
        ),
        migrations.RemoveField(
            model_name="flownode",
            name="is_active",
        ),
        migrations.RemoveField(
            model_name="delegacionfirma",
            name="is_active",
        ),
        migrations.RemoveField(
            model_name="configuracionrevision",
            name="is_active",
        ),
        migrations.RemoveField(
            model_name="historialversion",
            name="is_active",
        ),

        # =====================================================================
        # PASO 5: Eliminar campo empresa de los 5 modelos BaseCompanyModel
        # =====================================================================
        migrations.RemoveField(
            model_name="configuracionflujofirma",
            name="empresa",
        ),
        migrations.RemoveField(
            model_name="flownode",
            name="empresa",
        ),
        migrations.RemoveField(
            model_name="delegacionfirma",
            name="empresa",
        ),
        migrations.RemoveField(
            model_name="configuracionrevision",
            name="empresa",
        ),
        migrations.RemoveField(
            model_name="historialversion",
            name="empresa",
        ),

        # =====================================================================
        # PASO 6: Eliminar índices legacy de BaseCompanyModel (empresa + is_active)
        # =====================================================================

        # Los índices compuestos de BaseCompanyModel Meta (emp_act_cre, emp_upd, emp_del)
        # se eliminan automáticamente con RemoveField de empresa.
        # No es necesario RemoveIndex explícito.

        # =====================================================================
        # PASO 7: Actualizar managers — SoftDeleteManager se aplica via modelo
        # Django detecta el cambio de base automáticamente al re-crear
        # el estado del modelo. No se necesitan operaciones adicionales.
        # =====================================================================
    ]
