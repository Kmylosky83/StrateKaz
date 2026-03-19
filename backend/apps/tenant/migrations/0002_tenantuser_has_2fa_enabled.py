"""
Migración: Mirror campo 2FA en TenantUser (public schema).
Permite verificar 2FA durante login sin queries cross-schema.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenant', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenantuser',
            name='has_2fa_enabled',
            field=models.BooleanField(
                default=False,
                help_text='Mirror del estado 2FA del usuario (sincronizado al activar/desactivar)',
                verbose_name='2FA habilitado',
            ),
        ),
    ]
