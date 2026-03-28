"""
Agregar campo is_admin a TenantUserAccess.

Permite asignar admin de tenant desde Admin Global sin crear
cargos ni colaboradores dentro del tenant.

default=False: usuarios existentes NO se convierten en admin automáticamente.
La data migration backfill se ejecuta en el paso siguiente (0005).
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenant', '0004_newslettersubscriber'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenantuseraccess',
            name='is_admin',
            field=models.BooleanField(
                default=False,
                help_text=(
                    'Si True, el usuario obtiene is_superuser=True dentro del tenant '
                    '(bypass total de RBAC). Se asigna desde Admin Global.'
                ),
                verbose_name='Admin del tenant',
            ),
        ),
    ]
