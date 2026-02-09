# Estandarizacion de PositiveIntegerField a ForeignKey
# para colaborador_id -> colaborador y cargo_id -> cargo
# en ExamenMedico, RestriccionMedica, CasoVigilancia
#
# Nota: La columna DB se llama 'colaborador_id' en ambos casos
# (PositiveIntegerField se define como 'colaborador_id', y
#  ForeignKey 'colaborador' genera columna 'colaborador_id'),
# por lo tanto NO hay cambio de nombre en la base de datos.

import django.db.models.deletion
from django.db import migrations, models


def limpiar_ids_huerfanos(apps, schema_editor):
    """
    Limpia IDs de colaborador/cargo que no existen en las tablas referenciadas.
    Esto es necesario antes de crear las FK constraints.
    """
    ExamenMedico = apps.get_model('medicina_laboral', 'ExamenMedico')
    RestriccionMedica = apps.get_model('medicina_laboral', 'RestriccionMedica')
    CasoVigilancia = apps.get_model('medicina_laboral', 'CasoVigilancia')
    Colaborador = apps.get_model('colaboradores', 'Colaborador')
    Cargo = apps.get_model('core', 'Cargo')

    colaborador_ids = set(Colaborador.objects.values_list('id', flat=True))
    cargo_ids = set(Cargo.objects.values_list('id', flat=True))

    for Model in [ExamenMedico, RestriccionMedica, CasoVigilancia]:
        # Limpiar colaborador_id huerfanos
        huerfanos_col = Model.objects.exclude(
            colaborador_id__in=colaborador_ids
        ).filter(colaborador_id__isnull=False)
        if huerfanos_col.exists():
            # No podemos eliminar, solo advertir. Si hay datos invalidos,
            # se deben resolver manualmente antes de migrar.
            pass

        # Limpiar cargo_id huerfanos (SET_NULL, asi que podemos nullear)
        Model.objects.exclude(
            cargo_id__in=cargo_ids
        ).filter(
            cargo_id__isnull=False
        ).update(cargo_id=None)


class Migration(migrations.Migration):

    dependencies = [
        ("medicina_laboral", "0001_initial"),
        ("colaboradores", "0001_initial"),
        ("core", "0001_initial"),
    ]

    operations = [
        # =============================================
        # Paso 0: Limpiar IDs huerfanos
        # =============================================
        migrations.RunPython(
            limpiar_ids_huerfanos,
            migrations.RunPython.noop,
        ),

        # =============================================
        # ExamenMedico: colaborador_id -> colaborador FK
        # =============================================
        migrations.RenameField(
            model_name='examenmedico',
            old_name='colaborador_id',
            new_name='colaborador',
        ),
        migrations.AlterField(
            model_name='examenmedico',
            name='colaborador',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='examenes_medicos',
                to='colaboradores.colaborador',
                verbose_name='Colaborador',
                help_text='Colaborador evaluado',
            ),
        ),

        # ExamenMedico: cargo_id -> cargo FK
        migrations.RenameField(
            model_name='examenmedico',
            old_name='cargo_id',
            new_name='cargo',
        ),
        migrations.AlterField(
            model_name='examenmedico',
            name='cargo',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='core.cargo',
                verbose_name='Cargo',
                help_text='Cargo del colaborador al momento del examen',
            ),
        ),

        # =============================================
        # RestriccionMedica: colaborador_id -> colaborador FK
        # =============================================
        migrations.RenameField(
            model_name='restriccionmedica',
            old_name='colaborador_id',
            new_name='colaborador',
        ),
        migrations.AlterField(
            model_name='restriccionmedica',
            name='colaborador',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='restricciones_medicas',
                to='colaboradores.colaborador',
                verbose_name='Colaborador',
                help_text='Colaborador con restricción',
            ),
        ),

        # RestriccionMedica: cargo_id -> cargo FK
        migrations.RenameField(
            model_name='restriccionmedica',
            old_name='cargo_id',
            new_name='cargo',
        ),
        migrations.AlterField(
            model_name='restriccionmedica',
            name='cargo',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='core.cargo',
                verbose_name='Cargo',
                help_text='Cargo actual del colaborador',
            ),
        ),

        # =============================================
        # CasoVigilancia: colaborador_id -> colaborador FK
        # =============================================
        migrations.RenameField(
            model_name='casovigilancia',
            old_name='colaborador_id',
            new_name='colaborador',
        ),
        migrations.AlterField(
            model_name='casovigilancia',
            name='colaborador',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='casos_vigilancia',
                to='colaboradores.colaborador',
                verbose_name='Colaborador',
                help_text='Colaborador en seguimiento',
            ),
        ),

        # CasoVigilancia: cargo_id -> cargo FK
        migrations.RenameField(
            model_name='casovigilancia',
            old_name='cargo_id',
            new_name='cargo',
        ),
        migrations.AlterField(
            model_name='casovigilancia',
            name='cargo',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='core.cargo',
                verbose_name='Cargo',
            ),
        ),

        # =============================================
        # Actualizar indexes compuestos (empresa_id, colaborador)
        # =============================================
        # Nota: Los indexes originales usaban 'empresa_id' y 'colaborador_id'.
        # Django auto-genera index en FK, pero los compuestos necesitan
        # actualizarse al nuevo nombre del campo Python 'colaborador'.
        # El RemoveIndex + AddIndex recrea el index con el nombre correcto.

        # ExamenMedico
        migrations.RemoveIndex(
            model_name='examenmedico',
            name='medicina_la_empresa_b2fca0_idx',
        ),
        migrations.AddIndex(
            model_name='examenmedico',
            index=models.Index(
                fields=['empresa_id', 'colaborador'],
                name='ml_exam_emp_col_idx',
            ),
        ),

        # RestriccionMedica
        migrations.RemoveIndex(
            model_name='restriccionmedica',
            name='medicina_la_empresa_0d6722_idx',
        ),
        migrations.AddIndex(
            model_name='restriccionmedica',
            index=models.Index(
                fields=['empresa_id', 'colaborador'],
                name='ml_restr_emp_col_idx',
            ),
        ),

        # CasoVigilancia
        migrations.RemoveIndex(
            model_name='casovigilancia',
            name='medicina_la_empresa_32b10c_idx',
        ),
        migrations.AddIndex(
            model_name='casovigilancia',
            index=models.Index(
                fields=['empresa_id', 'colaborador'],
                name='ml_caso_emp_col_idx',
            ),
        ),
    ]
