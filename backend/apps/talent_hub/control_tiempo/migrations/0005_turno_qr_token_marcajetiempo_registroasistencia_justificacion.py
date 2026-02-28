# Generated manually - Sprint control-tiempo-1
# Adds: Turno.qr_token, MarcajeTiempo model, RegistroAsistencia.justificacion

import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def populate_qr_tokens(apps, schema_editor):
    """Genera tokens QR únicos para turnos existentes."""
    Turno = apps.get_model('control_tiempo', 'Turno')
    for turno in Turno.objects.all():
        turno.qr_token = uuid.uuid4()
        turno.save(update_fields=['qr_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('control_tiempo', '0004_turno_horas_semanales_maximas_turno_tipo_jornada_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Step 1: Add qr_token as nullable first
        migrations.AddField(
            model_name='turno',
            name='qr_token',
            field=models.UUIDField(
                null=True,
                blank=True,
                db_index=True,
                verbose_name='Token QR',
                help_text='Token único para marcaje por QR'
            ),
        ),
        # Step 2: Populate unique values for existing rows
        migrations.RunPython(populate_qr_tokens, migrations.RunPython.noop),
        # Step 3: Make it required and unique
        migrations.AlterField(
            model_name='turno',
            name='qr_token',
            field=models.UUIDField(
                default=uuid.uuid4,
                unique=True,
                db_index=True,
                verbose_name='Token QR',
                help_text='Token único para marcaje por QR'
            ),
        ),
        # Step 4: Add justificacion field to RegistroAsistencia
        migrations.AddField(
            model_name='registroasistencia',
            name='justificacion',
            field=models.TextField(
                blank=True,
                default='',
                verbose_name='Justificación',
                help_text='Justificación de ausencia o tardanza'
            ),
            preserve_default=False,
        ),
        # Step 5: Create MarcajeTiempo model
        migrations.CreateModel(
            name='MarcajeTiempo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Fecha y hora de creación del registro (automático)', verbose_name='Fecha de Creación')),
                ('updated_at', models.DateTimeField(auto_now=True, db_index=True, help_text='Fecha y hora de la última actualización (automático)', verbose_name='Última Actualización')),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, help_text='Fecha y hora de eliminación lógica (null = no eliminado)', null=True, verbose_name='Fecha de Eliminación')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Indica si el registro está activo o ha sido eliminado lógicamente', verbose_name='Activo')),
                ('tipo', models.CharField(
                    choices=[
                        ('entrada', 'Entrada'),
                        ('salida', 'Salida'),
                        ('entrada_almuerzo', 'Entrada Almuerzo'),
                        ('salida_almuerzo', 'Salida Almuerzo'),
                    ],
                    max_length=20,
                    verbose_name='Tipo de Marcaje'
                )),
                ('metodo', models.CharField(
                    choices=[
                        ('manual', 'Manual'),
                        ('web', 'Plataforma Web'),
                        ('qr', 'Código QR'),
                        ('movil', 'Aplicación Móvil'),
                    ],
                    default='web',
                    max_length=20,
                    verbose_name='Método de Marcaje'
                )),
                ('fecha_hora', models.DateTimeField(db_index=True, verbose_name='Fecha y Hora del Marcaje')),
                ('latitud', models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True, verbose_name='Latitud')),
                ('longitud', models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True, verbose_name='Longitud')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True, verbose_name='Dirección IP')),
                ('user_agent', models.CharField(blank=True, max_length=500, verbose_name='User Agent')),
                ('colaborador', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='marcajes',
                    to='colaboradores.colaborador',
                    verbose_name='Colaborador'
                )),
                ('created_by', models.ForeignKey(
                    blank=True, help_text='Usuario que creó el registro', null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='control_tiempo_marcajetiempo_created',
                    to=settings.AUTH_USER_MODEL, verbose_name='Creado por'
                )),
                ('empresa', models.ForeignKey(
                    blank=True, help_text='Empresa a la que pertenece este registro', null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='control_tiempo_marcajetiempo_set',
                    to='configuracion.empresaconfig', verbose_name='Empresa'
                )),
                ('registro_asistencia', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='marcajes',
                    to='control_tiempo.registroasistencia',
                    verbose_name='Registro de Asistencia'
                )),
                ('updated_by', models.ForeignKey(
                    blank=True, help_text='Usuario que realizó la última actualización', null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='control_tiempo_marcajetiempo_updated',
                    to=settings.AUTH_USER_MODEL, verbose_name='Actualizado por'
                )),
            ],
            options={
                'verbose_name': 'Marcaje de Tiempo',
                'verbose_name_plural': 'Marcajes de Tiempo',
                'db_table': 'talent_hub_marcaje_tiempo',
                'ordering': ['-fecha_hora'],
            },
        ),
        migrations.AddIndex(
            model_name='marcajetiempo',
            index=models.Index(fields=['colaborador', 'fecha_hora'], name='talent_hub_marcaje_colab_fh_idx'),
        ),
        migrations.AddIndex(
            model_name='marcajetiempo',
            index=models.Index(fields=['empresa', 'fecha_hora'], name='talent_hub_marcaje_emp_fh_idx'),
        ),
        migrations.AddIndex(
            model_name='marcajetiempo',
            index=models.Index(fields=['tipo'], name='talent_hub_marcaje_tipo_idx'),
        ),
    ]
