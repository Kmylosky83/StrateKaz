"""
Migration: Create GroupSectionAccess model.

Adds section-level access control for Groups, complementing
the existing CargoSectionAccess for cargos.
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_rol_adicional_section_access'),
    ]

    operations = [
        migrations.CreateModel(
            name='GroupSectionAccess',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'can_view',
                    models.BooleanField(
                        default=True,
                        help_text='Permite ver/acceder a esta sección',
                        verbose_name='Puede ver',
                    ),
                ),
                (
                    'can_create',
                    models.BooleanField(
                        default=False,
                        help_text='Permite crear nuevos registros en esta sección',
                        verbose_name='Puede crear',
                    ),
                ),
                (
                    'can_edit',
                    models.BooleanField(
                        default=False,
                        help_text='Permite modificar registros existentes',
                        verbose_name='Puede editar',
                    ),
                ),
                (
                    'can_delete',
                    models.BooleanField(
                        default=False,
                        help_text='Permite eliminar registros',
                        verbose_name='Puede eliminar',
                    ),
                ),
                (
                    'custom_actions',
                    models.JSONField(
                        blank=True,
                        default=dict,
                        help_text='Estado de acciones extra (ej: {"aprobar": true})',
                        verbose_name='Acciones personalizadas',
                    ),
                ),
                (
                    'granted_at',
                    models.DateTimeField(
                        auto_now_add=True,
                        verbose_name='Fecha de asignación',
                    ),
                ),
                (
                    'group',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='section_accesses',
                        to='core.group',
                        verbose_name='Grupo',
                    ),
                ),
                (
                    'section',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='group_accesses',
                        to='core.tabsection',
                        verbose_name='Sección',
                    ),
                ),
                (
                    'granted_by',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='group_section_accesses_granted',
                        to=settings.AUTH_USER_MODEL,
                        verbose_name='Otorgado por',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Acceso a Sección por Grupo',
                'verbose_name_plural': 'Accesos a Secciones por Grupo',
                'db_table': 'core_group_section_access',
                'ordering': ['group', 'section'],
                'unique_together': {('group', 'section')},
                'indexes': [
                    models.Index(
                        fields=['group'],
                        name='core_group__group_i_idx',
                    ),
                    models.Index(
                        fields=['section'],
                        name='core_group__sectio_idx',
                    ),
                ],
            },
        ),
    ]
