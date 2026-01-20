# Generated migration for UserSession model
# MS-002-A: Sesiones activas de usuario

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_add_pwa_fields_to_branding'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('refresh_token_hash', models.CharField(
                    db_index=True,
                    help_text='SHA256 del refresh token para identificación',
                    max_length=64,
                    unique=True,
                    verbose_name='Hash del Refresh Token'
                )),
                ('user_agent', models.TextField(
                    help_text='User-Agent completo del navegador',
                    verbose_name='User Agent'
                )),
                ('device_type', models.CharField(
                    default='desktop',
                    help_text='desktop, mobile, tablet',
                    max_length=20,
                    verbose_name='Tipo de Dispositivo'
                )),
                ('device_os', models.CharField(
                    blank=True,
                    default='',
                    help_text='Windows, macOS, Linux, iOS, Android',
                    max_length=50,
                    verbose_name='Sistema Operativo'
                )),
                ('device_browser', models.CharField(
                    blank=True,
                    default='',
                    help_text='Chrome, Firefox, Safari, Edge',
                    max_length=50,
                    verbose_name='Navegador'
                )),
                ('device_name', models.CharField(
                    blank=True,
                    default='',
                    help_text='Nombre personalizado por el usuario',
                    max_length=100,
                    verbose_name='Nombre del Dispositivo'
                )),
                ('ip_address', models.GenericIPAddressField(verbose_name='Dirección IP')),
                ('country', models.CharField(
                    blank=True,
                    default='',
                    max_length=100,
                    verbose_name='País'
                )),
                ('city', models.CharField(
                    blank=True,
                    default='',
                    max_length=100,
                    verbose_name='Ciudad'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Inicio')),
                ('last_activity', models.DateTimeField(auto_now=True, verbose_name='Última Actividad')),
                ('expires_at', models.DateTimeField(verbose_name='Fecha de Expiración')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activa')),
                ('is_current', models.BooleanField(
                    default=False,
                    help_text='Marcador temporal para indicar la sesión del request actual',
                    verbose_name='Es Sesión Actual'
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='sessions',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Usuario'
                )),
            ],
            options={
                'verbose_name': 'Sesión de Usuario',
                'verbose_name_plural': 'Sesiones de Usuario',
                'db_table': 'core_user_session',
                'ordering': ['-last_activity'],
            },
        ),
        migrations.AddIndex(
            model_name='usersession',
            index=models.Index(fields=['user', 'is_active'], name='core_user_s_user_id_is_act_idx'),
        ),
        migrations.AddIndex(
            model_name='usersession',
            index=models.Index(fields=['refresh_token_hash'], name='core_user_s_refresh_tok_idx'),
        ),
        migrations.AddIndex(
            model_name='usersession',
            index=models.Index(fields=['expires_at'], name='core_user_s_expires_at_idx'),
        ),
    ]
