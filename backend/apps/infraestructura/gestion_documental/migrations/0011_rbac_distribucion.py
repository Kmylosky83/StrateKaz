"""
Migration 0011: Distribución RBAC en Documento

Agrega dos campos a Documento para controlar la audiencia de distribución:
  - aplica_a_todos (BooleanField): distribuir a todos los usuarios activos al publicar
  - cargos_distribucion (M2M a core.Cargo): distribuir a usuarios con estos cargos al publicar
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('infra_gestion_documental', '0010_fix_fecha_creacion_localdate'),
        ('core', '0011_add_orden_to_cargo'),
    ]

    operations = [
        migrations.AddField(
            model_name='documento',
            name='aplica_a_todos',
            field=models.BooleanField(
                default=False,
                help_text=(
                    'Si True, al publicar se distribuye automáticamente a todos los '
                    'usuarios activos del tenant. También aplica a nuevos usuarios.'
                ),
                verbose_name='Aplica a Todos',
            ),
        ),
        migrations.AddField(
            model_name='documento',
            name='cargos_distribucion',
            field=models.ManyToManyField(
                blank=True,
                help_text=(
                    'Al publicar, se distribuye a usuarios que tengan alguno de estos cargos. '
                    'También aplica a nuevos usuarios que se vinculen con estos cargos.'
                ),
                related_name='documentos_distribucion',
                to='core.cargo',
                verbose_name='Cargos Objetivo',
            ),
        ),
    ]
