# Migrate OrganigramaNodePosition from models.Model to TenantModel
#
# Adds: created_at, created_by, updated_by, is_deleted, deleted_at, deleted_by
# Alters: updated_at (verbose_name change)
# Removes: nothing (model only had updated_at from TM overlap)

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organizacion", "0002_add_is_system_to_area"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add TenantModel fields
        migrations.AddField(
            model_name="organigramanodeposition",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                db_index=True,
                default=django.utils.timezone.now,
                verbose_name="Fecha de creación",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="organigramanodeposition",
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
        migrations.AddField(
            model_name="organigramanodeposition",
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
        migrations.AddField(
            model_name="organigramanodeposition",
            name="is_deleted",
            field=models.BooleanField(
                db_index=True, default=False, verbose_name="Eliminado"
            ),
        ),
        migrations.AddField(
            model_name="organigramanodeposition",
            name="deleted_at",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="Fecha de eliminación"
            ),
        ),
        migrations.AddField(
            model_name="organigramanodeposition",
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
        # Alter existing updated_at to match TenantModel definition
        migrations.AlterField(
            model_name="organigramanodeposition",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True, verbose_name="Última actualización"
            ),
        ),
    ]
