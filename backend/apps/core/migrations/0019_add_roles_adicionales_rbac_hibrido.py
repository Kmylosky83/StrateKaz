# Generated migration for RolAdicional - Sistema RBAC Híbrido
# Grasas y Huesos del Norte / StrateKaz

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    """
    Migración para agregar el Sistema RBAC Híbrido con Roles Adicionales.

    Crea los modelos:
    - RolAdicional: Roles transversales (COPASST, Brigadista, Auditor ISO, etc.)
    - RolAdicionalPermiso: Relación M2M entre RolAdicional y Permiso
    - UserRolAdicional: Relación M2M entre User y RolAdicional con metadata

    También agrega el campo roles_adicionales al modelo User.
    """

    dependencies = [
        ('core', '0018_user_photo'),
    ]

    operations = [
        # =====================================================================
        # 1. CREAR MODELO ROLADICIONAL
        # =====================================================================
        migrations.CreateModel(
            name='RolAdicional',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(
                    db_index=True,
                    help_text='Código único del rol adicional (ej: copasst, brigadista)',
                    max_length=50,
                    unique=True,
                    verbose_name='Código'
                )),
                ('nombre', models.CharField(
                    help_text='Nombre descriptivo del rol (ej: Miembro COPASST)',
                    max_length=100,
                    verbose_name='Nombre'
                )),
                ('descripcion', models.TextField(
                    blank=True,
                    help_text='Descripción detallada de las responsabilidades del rol',
                    null=True,
                    verbose_name='Descripción'
                )),
                ('tipo', models.CharField(
                    choices=[
                        ('LEGAL_OBLIGATORIO', 'Legal Obligatorio'),
                        ('SISTEMA_GESTION', 'Sistema de Gestión'),
                        ('OPERATIVO', 'Operativo Especial'),
                        ('CUSTOM', 'Personalizado')
                    ],
                    db_index=True,
                    default='CUSTOM',
                    max_length=20,
                    verbose_name='Tipo de Rol'
                )),
                ('justificacion_legal', models.TextField(
                    blank=True,
                    help_text='Normativa que exige este rol (ej: Resolución 0312/2019)',
                    null=True,
                    verbose_name='Justificación Legal'
                )),
                ('requiere_certificacion', models.BooleanField(
                    default=False,
                    help_text='Si el rol requiere certificación o capacitación específica',
                    verbose_name='Requiere Certificación'
                )),
                ('certificacion_requerida', models.CharField(
                    blank=True,
                    help_text='Nombre de la certificación/curso requerido (ej: Curso 50h SST)',
                    max_length=200,
                    null=True,
                    verbose_name='Certificación Requerida'
                )),
                ('is_system', models.BooleanField(
                    default=False,
                    help_text='Los roles del sistema no pueden eliminarse desde la UI',
                    verbose_name='Es del sistema'
                )),
                ('is_active', models.BooleanField(
                    db_index=True,
                    default=True,
                    help_text='Si el rol está activo en el sistema',
                    verbose_name='Activo'
                )),
                ('created_at', models.DateTimeField(
                    auto_now_add=True,
                    verbose_name='Fecha de creación'
                )),
                ('updated_at', models.DateTimeField(
                    auto_now=True,
                    verbose_name='Fecha de actualización'
                )),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='roles_adicionales_creados',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Creado por'
                )),
            ],
            options={
                'verbose_name': 'Rol Adicional',
                'verbose_name_plural': 'Roles Adicionales',
                'db_table': 'core_rol_adicional',
                'ordering': ['tipo', 'nombre'],
            },
        ),

        # =====================================================================
        # 2. CREAR MODELO ROLADICIONALPERMISO (through table)
        # =====================================================================
        migrations.CreateModel(
            name='RolAdicionalPermiso',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('granted_at', models.DateTimeField(
                    auto_now_add=True,
                    verbose_name='Fecha de asignación'
                )),
                ('granted_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='permisos_rol_adicional_otorgados',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Asignado por'
                )),
                ('permiso', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='rol_adicional_permisos',
                    to='core.permiso',
                    verbose_name='Permiso'
                )),
                ('rol_adicional', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='rol_adicional_permisos',
                    to='core.roladicional',
                    verbose_name='Rol Adicional'
                )),
            ],
            options={
                'verbose_name': 'Permiso de Rol Adicional',
                'verbose_name_plural': 'Permisos de Roles Adicionales',
                'db_table': 'core_rol_adicional_permiso',
                'ordering': ['rol_adicional', 'permiso'],
            },
        ),

        # =====================================================================
        # 3. CREAR MODELO USERROLADICIONAL (through table User <-> RolAdicional)
        # =====================================================================
        migrations.CreateModel(
            name='UserRolAdicional',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('assigned_at', models.DateTimeField(
                    auto_now_add=True,
                    verbose_name='Fecha de asignación'
                )),
                ('expires_at', models.DateTimeField(
                    blank=True,
                    help_text='Fecha en que el rol expira automáticamente (opcional)',
                    null=True,
                    verbose_name='Fecha de expiración'
                )),
                ('justificacion', models.TextField(
                    blank=True,
                    help_text='Razón o justificación de la asignación del rol',
                    null=True,
                    verbose_name='Justificación'
                )),
                ('certificacion_adjunta', models.FileField(
                    blank=True,
                    help_text='Certificado o documento que acredita la capacitación',
                    null=True,
                    upload_to='roles_adicionales/certificaciones/%Y/%m/',
                    verbose_name='Certificación Adjunta'
                )),
                ('fecha_certificacion', models.DateField(
                    blank=True,
                    help_text='Fecha de emisión del certificado',
                    null=True,
                    verbose_name='Fecha de Certificación'
                )),
                ('certificacion_expira', models.DateField(
                    blank=True,
                    help_text='Fecha de vencimiento del certificado',
                    null=True,
                    verbose_name='Certificación Expira'
                )),
                ('is_active', models.BooleanField(
                    db_index=True,
                    default=True,
                    help_text='Si la asignación está activa',
                    verbose_name='Activo'
                )),
                ('assigned_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='roles_adicionales_asignados_por_mi',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Asignado por'
                )),
                ('rol_adicional', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='usuarios_asignados',
                    to='core.roladicional',
                    verbose_name='Rol Adicional'
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='usuarios_roles_adicionales',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Usuario'
                )),
            ],
            options={
                'verbose_name': 'Usuario-Rol Adicional',
                'verbose_name_plural': 'Usuarios-Roles Adicionales',
                'db_table': 'core_user_rol_adicional',
                'ordering': ['user', 'rol_adicional'],
            },
        ),

        # =====================================================================
        # 4. AGREGAR CAMPO permisos A ROLADICIONAL (ManyToMany)
        # =====================================================================
        migrations.AddField(
            model_name='roladicional',
            name='permisos',
            field=models.ManyToManyField(
                blank=True,
                help_text='Permisos que otorga este rol adicional',
                related_name='roles_adicionales',
                through='core.RolAdicionalPermiso',
                to='core.permiso',
                verbose_name='Permisos'
            ),
        ),

        # =====================================================================
        # 6. CONSTRAINTS Y UNIQUE TOGETHER
        # =====================================================================
        migrations.AlterUniqueTogether(
            name='roladicionalpermiso',
            unique_together={('rol_adicional', 'permiso')},
        ),
        migrations.AlterUniqueTogether(
            name='userroladicional',
            unique_together={('user', 'rol_adicional')},
        ),

        # =====================================================================
        # 7. INDEXES
        # =====================================================================
        migrations.AddIndex(
            model_name='roladicional',
            index=models.Index(fields=['code'], name='core_rol_ad_code_idx'),
        ),
        migrations.AddIndex(
            model_name='roladicional',
            index=models.Index(fields=['tipo', 'is_active'], name='core_rol_ad_tipo_active_idx'),
        ),
        migrations.AddIndex(
            model_name='roladicional',
            index=models.Index(fields=['is_active'], name='core_rol_ad_active_idx'),
        ),
        migrations.AddIndex(
            model_name='userroladicional',
            index=models.Index(fields=['user', 'is_active'], name='core_user_r_user_active_idx'),
        ),
        migrations.AddIndex(
            model_name='userroladicional',
            index=models.Index(fields=['expires_at'], name='core_user_r_expires_idx'),
        ),
        migrations.AddIndex(
            model_name='userroladicional',
            index=models.Index(fields=['certificacion_expira'], name='core_user_r_cert_exp_idx'),
        ),
    ]
