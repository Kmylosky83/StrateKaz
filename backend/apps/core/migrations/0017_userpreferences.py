# Generated migration for UserPreferences model
# MS-003: Preferencias personales de usuario

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_add_normas_iso_section'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserPreferences',
            fields=[
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    primary_key=True,
                    related_name='preferences',
                    serialize=False,
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Usuario'
                )),
                ('language', models.CharField(
                    choices=[('es', 'Español'), ('en', 'English')],
                    default='es',
                    help_text='Idioma de la interfaz de usuario',
                    max_length=2,
                    verbose_name='Idioma'
                )),
                ('timezone', models.CharField(
                    default='America/Bogota',
                    help_text='Zona horaria para mostrar fechas y horas',
                    max_length=50,
                    verbose_name='Zona Horaria'
                )),
                ('date_format', models.CharField(
                    choices=[
                        ('DD/MM/YYYY', 'DD/MM/YYYY'),
                        ('MM/DD/YYYY', 'MM/DD/YYYY'),
                        ('YYYY-MM-DD', 'YYYY-MM-DD')
                    ],
                    default='DD/MM/YYYY',
                    help_text='Formato para visualizar fechas',
                    max_length=15,
                    verbose_name='Formato de Fecha'
                )),
                ('created_at', models.DateTimeField(
                    auto_now_add=True,
                    verbose_name='Fecha de Creación'
                )),
                ('updated_at', models.DateTimeField(
                    auto_now=True,
                    verbose_name='Última Actualización'
                )),
            ],
            options={
                'verbose_name': 'Preferencia de Usuario',
                'verbose_name_plural': 'Preferencias de Usuario',
                'db_table': 'core_user_preferences',
                'ordering': ['user'],
            },
        ),
    ]
