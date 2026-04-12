"""
Migration: gestion_documental → BaseCompanyModel

Migra 8 modelos de models.Model a BaseCompanyModel (Punto 2 auditoría).

MANUAL — no auto-generada. Razón: Django auto-genera RemoveField(empresa_id) +
AddField(empresa) que PIERDE DATOS. Ambos mapean a columna empresa_id en la BD.

Estrategia data-preserving:
- empresa_id (PositiveBigIntegerField) → empresa (FK EmpresaConfig):
  usa SeparateDatabaseAndState para cambiar solo metadata + agregar FK constraint.
- activo → is_active en TRD: RenameField (preserva datos).
- Campos existentes (created_at, updated_at, is_active, created_by): AlterField.
- Campos nuevos (deleted_at, updated_by, created_by donde no existía): AddField.

Verificado: 79 registros en tenant_demo, 0 empresa_id huérfanos, 0 nulls.
"""
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


# Modelos que tenían empresa_id como PositiveBigIntegerField
EMPRESA_ID_MODELS = [
    'tipodocumento',
    'plantilladocumento',
    'documento',
    'versiondocumento',
    'campoformulario',
    'controldocumental',
    'aceptaciondocumental',
    'tablaretenciondocumental',
]

# Definición del campo empresa FK (heredado de BaseCompanyModel)
EMPRESA_FK_FIELD = models.ForeignKey(
    blank=True,
    help_text='Empresa a la que pertenece este registro',
    null=True,
    on_delete=django.db.models.deletion.CASCADE,
    related_name='%(app_label)s_%(class)s_set',
    to='configuracion.empresaconfig',
    verbose_name='Empresa',
)

# Definición de campos audit comunes de BaseCompanyModel
DELETED_AT_FIELD = models.DateTimeField(
    blank=True, db_index=True, null=True,
    help_text='Fecha y hora de eliminación lógica (null = no eliminado)',
    verbose_name='Fecha de Eliminación',
)

UPDATED_BY_FIELD = models.ForeignKey(
    blank=True, null=True,
    help_text='Usuario que realizó la última actualización',
    on_delete=django.db.models.deletion.PROTECT,
    related_name='%(app_label)s_%(class)s_updated',
    to=settings.AUTH_USER_MODEL,
    verbose_name='Actualizado por',
)

CREATED_BY_FIELD = models.ForeignKey(
    blank=True, null=True,
    help_text='Usuario que creó el registro',
    on_delete=django.db.models.deletion.PROTECT,
    related_name='%(app_label)s_%(class)s_created',
    to=settings.AUTH_USER_MODEL,
    verbose_name='Creado por',
)

IS_ACTIVE_FIELD = models.BooleanField(
    db_index=True, default=True,
    help_text='Indica si el registro está activo o ha sido eliminado lógicamente',
    verbose_name='Activo',
)

# Timestamps de BaseCompanyModel (via TimestampedModel)
CREATED_AT_FIELD = models.DateTimeField(
    auto_now_add=True, db_index=True,
    verbose_name='Fecha de Creación',
    help_text='Fecha y hora de creación del registro (automático)',
)

UPDATED_AT_FIELD = models.DateTimeField(
    auto_now=True, db_index=True,
    verbose_name='Última Actualización',
    help_text='Fecha y hora de la última actualización (automático)',
)


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0003_unify_sede_unidadnegocio'),
        ('gestion_documental', '0021_trd_fase2_campos_eliminado'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ================================================================
        # PASO 1: Remover índices viejos que referencian empresa_id
        # (los índices de BCM se crearán automáticamente por Meta)
        # ================================================================
        migrations.RemoveIndex(
            model_name='aceptaciondocumental',
            name='documental__empresa_335867_idx',
        ),
        migrations.RemoveIndex(
            model_name='aceptaciondocumental',
            name='documental__empresa_9ec622_idx',
        ),
        migrations.RemoveIndex(
            model_name='campoformulario',
            name='documental__empresa_52c254_idx',
        ),
        migrations.RemoveIndex(
            model_name='campoformulario',
            name='documental__empresa_763f38_idx',
        ),
        migrations.RemoveIndex(
            model_name='controldocumental',
            name='documental__empresa_1a04e7_idx',
        ),
        migrations.RemoveIndex(
            model_name='controldocumental',
            name='documental__empresa_48de04_idx',
        ),
        migrations.RemoveIndex(
            model_name='documento',
            name='documental__empresa_ede4d9_idx',
        ),
        migrations.RemoveIndex(
            model_name='documento',
            name='documental__empresa_4a0935_idx',
        ),
        migrations.RemoveIndex(
            model_name='documento',
            name='documental__empresa_59cbc0_idx',
        ),
        migrations.RemoveIndex(
            model_name='plantilladocumento',
            name='documental__empresa_944044_idx',
        ),
        migrations.RemoveIndex(
            model_name='plantilladocumento',
            name='documental__empresa_e6003c_idx',
        ),
        migrations.RemoveIndex(
            model_name='tablaretenciondocumental',
            name='documental__empresa_93de1e_idx',
        ),
        migrations.RemoveIndex(
            model_name='tipodocumento',
            name='documental__empresa_f410d4_idx',
        ),
        migrations.RemoveIndex(
            model_name='versiondocumento',
            name='documental__empresa_ab4e0c_idx',
        ),

        # ================================================================
        # PASO 2: empresa_id → empresa FK (DATA-PRESERVING)
        #
        # SeparateDatabaseAndState: la columna BD ya se llama empresa_id
        # en ambos casos. Solo cambiamos el state de Django (field metadata)
        # y agregamos la FK constraint.
        # ================================================================
        *[
            migrations.SeparateDatabaseAndState(
                state_operations=[
                    migrations.RemoveField(
                        model_name=model,
                        name='empresa_id',
                    ),
                    migrations.AddField(
                        model_name=model,
                        name='empresa',
                        field=EMPRESA_FK_FIELD,
                    ),
                ],
                database_operations=[
                    # La columna empresa_id ya existe con datos válidos.
                    # Solo agregamos la FK constraint.
                    migrations.AlterField(
                        model_name=model,
                        name='empresa_id',
                        field=models.ForeignKey(
                            blank=True, null=True,
                            on_delete=django.db.models.deletion.CASCADE,
                            related_name='+',
                            to='configuracion.empresaconfig',
                            db_column='empresa_id',
                        ),
                    ),
                ],
            )
            for model in EMPRESA_ID_MODELS
        ],

        # ================================================================
        # PASO 3: TRD — Renombrar activo → is_active (preserva datos)
        # ================================================================
        migrations.RenameField(
            model_name='tablaretenciondocumental',
            old_name='activo',
            new_name='is_active',
        ),

        # ================================================================
        # PASO 4: AlterField en campos que ya existían con semántica idéntica
        # (solo cambia metadata: db_index, verbose_name, help_text)
        # ================================================================

        # --- created_at / updated_at (agregar db_index=True donde no estaba) ---
        *[
            migrations.AlterField(
                model_name=model,
                name='created_at',
                field=CREATED_AT_FIELD,
            )
            for model in [
                'tipodocumento', 'plantilladocumento', 'documento',
                'campoformulario', 'controldocumental',
                'aceptaciondocumental', 'tablaretenciondocumental',
            ]
        ],
        *[
            migrations.AlterField(
                model_name=model,
                name='updated_at',
                field=UPDATED_AT_FIELD,
            )
            for model in [
                'tipodocumento', 'plantilladocumento', 'documento',
                'campoformulario', 'controldocumental',
                'aceptaciondocumental', 'tablaretenciondocumental',
            ]
        ],

        # --- created_by: SET_NULL → PROTECT (4 modelos que ya lo tenían) ---
        *[
            migrations.AlterField(
                model_name=model,
                name='created_by',
                field=CREATED_BY_FIELD,
            )
            for model in [
                'tipodocumento', 'plantilladocumento',
                'campoformulario', 'controldocumental',
            ]
        ],

        # --- is_active: agregar db_index y help_text (2 modelos que ya lo tenían) ---
        *[
            migrations.AlterField(
                model_name=model,
                name='is_active',
                field=IS_ACTIVE_FIELD,
            )
            for model in ['tipodocumento', 'campoformulario', 'tablaretenciondocumental']
        ],

        # ================================================================
        # PASO 5: AddField para campos NUEVOS de BaseCompanyModel
        # ================================================================

        # --- deleted_at (nuevo en todos) ---
        *[
            migrations.AddField(
                model_name=model,
                name='deleted_at',
                field=DELETED_AT_FIELD,
            )
            for model in EMPRESA_ID_MODELS
        ],

        # --- updated_by (nuevo en todos) ---
        *[
            migrations.AddField(
                model_name=model,
                name='updated_by',
                field=UPDATED_BY_FIELD,
            )
            for model in EMPRESA_ID_MODELS
        ],

        # --- created_by (nuevo en 3 modelos que no lo tenían) ---
        *[
            migrations.AddField(
                model_name=model,
                name='created_by',
                field=CREATED_BY_FIELD,
            )
            for model in ['documento', 'aceptaciondocumental', 'tablaretenciondocumental']
        ],

        # --- is_active (nuevo en 5 modelos que no lo tenían) ---
        *[
            migrations.AddField(
                model_name=model,
                name='is_active',
                field=IS_ACTIVE_FIELD,
            )
            for model in [
                'plantilladocumento', 'documento', 'controldocumental',
                'aceptaciondocumental', 'versiondocumento',
            ]
        ],

        # --- created_at + updated_at (nuevo solo en VersionDocumento) ---
        migrations.AddField(
            model_name='versiondocumento',
            name='created_at',
            field=models.DateTimeField(
                auto_now_add=True, db_index=True,
                default=django.utils.timezone.now,
                verbose_name='Fecha de Creación',
                help_text='Fecha y hora de creación del registro (automático)',
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='versiondocumento',
            name='updated_at',
            field=models.DateTimeField(
                auto_now=True, db_index=True,
                verbose_name='Última Actualización',
                help_text='Fecha y hora de la última actualización (automático)',
            ),
        ),

        # --- created_by (nuevo en VersionDocumento) ---
        migrations.AddField(
            model_name='versiondocumento',
            name='created_by',
            field=CREATED_BY_FIELD,
        ),
    ]
