# Generated migration for TwoFactorAuth model
# Two Factor Authentication support

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_add_usersession'),
    ]

    operations = [
        migrations.CreateModel(
            name='TwoFactorAuth',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('secret_key', models.CharField(
                    blank=True,
                    help_text='Secret key TOTP en formato base32',
                    max_length=32
                )),
                ('is_enabled', models.BooleanField(
                    default=False,
                    help_text='Si el 2FA está habilitado para este usuario'
                )),
                ('verified_at', models.DateTimeField(
                    blank=True,
                    help_text='Fecha de primera verificación exitosa',
                    null=True
                )),
                ('backup_codes', models.JSONField(
                    default=list,
                    help_text='Lista de códigos de backup hasheados'
                )),
                ('backup_codes_used', models.JSONField(
                    default=list,
                    help_text='Índices de códigos ya utilizados'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(
                    help_text='Usuario propietario de esta configuración 2FA',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='two_factor',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'verbose_name': 'Autenticación 2FA',
                'verbose_name_plural': 'Autenticaciones 2FA',
                'db_table': 'core_two_factor_auth',
            },
        ),
        migrations.AddIndex(
            model_name='twofactorauth',
            index=models.Index(fields=['user', 'is_enabled'], name='core_two_fa_user_enabled_idx'),
        ),
    ]
