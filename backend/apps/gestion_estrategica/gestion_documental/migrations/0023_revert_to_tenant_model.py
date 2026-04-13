# Revert gestion_documental from BaseCompanyModel to TenantModel
#
# BaseCompanyModel: is_active + empresa + created_by(PROTECT) + updated_by(PROTECT)
# TenantModel:      is_deleted + deleted_by + deleted_at + created_by(SET_NULL) + updated_by(SET_NULL)
#
# 8 models: TipoDocumento, PlantillaDocumento, Documento, VersionDocumento,
#           CampoFormulario, ControlDocumental, AceptacionDocumental, TablaRetencionDocumental
#
# Data migration: is_active=False → is_deleted=True (79 records across 8 tables)

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


TABLES = [
    'documental_tipo_documento',
    'documental_plantilla_documento',
    'documental_documento',
    'documental_version_documento',
    'documental_campo_formulario',
    'documental_control_documental',
    'documental_aceptacion_documental',
    'documental_tabla_retencion',
]


def forwards_data(apps, schema_editor):
    """Invert is_active → is_deleted for all 8 models."""
    for table in TABLES:
        schema_editor.execute(
            f'UPDATE "{table}" SET is_deleted = TRUE WHERE is_active = FALSE',
        )


def backwards_data(apps, schema_editor):
    """Invert is_deleted → is_active for all 8 models."""
    for table in TABLES:
        schema_editor.execute(
            f'UPDATE "{table}" SET is_active = FALSE WHERE is_deleted = TRUE',
        )


# Helper to generate AddField for is_deleted + deleted_by on a model
def _add_soft_delete_fields(model_name):
    return [
        migrations.AddField(
            model_name=model_name,
            name="is_deleted",
            field=models.BooleanField(
                db_index=True, default=False, verbose_name="Eliminado"
            ),
        ),
        migrations.AddField(
            model_name=model_name,
            name="deleted_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Eliminado por",
            ),
        ),
    ]


# Helper to generate AlterField for TenantModel audit fields
def _alter_audit_fields(model_name):
    return [
        migrations.AlterField(
            model_name=model_name,
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True, db_index=True, verbose_name="Fecha de creación"
            ),
        ),
        migrations.AlterField(
            model_name=model_name,
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Creado por",
            ),
        ),
        migrations.AlterField(
            model_name=model_name,
            name="deleted_at",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="Fecha de eliminación"
            ),
        ),
        migrations.AlterField(
            model_name=model_name,
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True, verbose_name="Última actualización"
            ),
        ),
        migrations.AlterField(
            model_name=model_name,
            name="updated_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Actualizado por",
            ),
        ),
    ]


# Helper to generate RemoveField for empresa + is_active
def _remove_bcm_fields(model_name):
    return [
        migrations.RemoveField(model_name=model_name, name="empresa"),
        migrations.RemoveField(model_name=model_name, name="is_active"),
    ]


ALL_MODELS = [
    'aceptaciondocumental', 'campoformulario', 'controldocumental',
    'documento', 'plantilladocumento', 'tablaretenciondocumental',
    'tipodocumento', 'versiondocumento',
]


class Migration(migrations.Migration):

    dependencies = [
        ("gestion_documental", "0022_migrate_to_base_company_model"),
        ("organizacion", "0002_add_is_system_to_area"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # =====================================================================
        # PHASE 1: Update unique_together constraints (remove empresa_id)
        # Must happen before RemoveField empresa
        # =====================================================================
        migrations.AlterUniqueTogether(
            name="tipodocumento",
            unique_together={("codigo",)},
        ),
        migrations.AlterUniqueTogether(
            name="plantilladocumento",
            unique_together={("codigo",)},
        ),
        migrations.AlterUniqueTogether(
            name="documento",
            unique_together={("codigo",)},
        ),
        migrations.AlterUniqueTogether(
            name="aceptaciondocumental",
            unique_together={("documento", "version_documento", "usuario")},
        ),
        migrations.AlterUniqueTogether(
            name="tablaretenciondocumental",
            unique_together={("tipo_documento", "proceso")},
        ),

        # =====================================================================
        # PHASE 2: Add TenantModel soft-delete fields (is_deleted + deleted_by)
        # Must happen BEFORE data migration and BEFORE removing is_active
        # =====================================================================
        *[op for m in ALL_MODELS for op in _add_soft_delete_fields(m)],

        # =====================================================================
        # PHASE 3: Data migration — is_active=False → is_deleted=True
        # Both fields exist at this point, safe to copy
        # =====================================================================
        migrations.RunPython(forwards_data, backwards_data),

        # =====================================================================
        # PHASE 4: Remove BCM fields (empresa + is_active) from all 8 models
        # Safe now because is_deleted has the data and unique_together updated
        # =====================================================================
        *[op for m in ALL_MODELS for op in _remove_bcm_fields(m)],

        # =====================================================================
        # PHASE 5: Alter audit fields (PROTECT → SET_NULL, related_name → '+')
        # =====================================================================
        *[op for m in ALL_MODELS for op in _alter_audit_fields(m)],
    ]
