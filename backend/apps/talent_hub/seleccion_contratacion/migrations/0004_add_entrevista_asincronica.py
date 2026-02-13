# Generated manually for EntrevistaAsincronica model

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0002_initial'),
        ('seleccion_contratacion', '0003_add_pruebas_dinamicas'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='EntrevistaAsincronica',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activo')),
                ('titulo', models.CharField(help_text='Ej: Entrevista tecnica, Entrevista de competencias', max_length=200, verbose_name='Titulo de la entrevista')),
                ('instrucciones', models.TextField(blank=True, default='', help_text='Instrucciones que vera el candidato antes de responder', verbose_name='Instrucciones para el candidato')),
                ('preguntas', models.JSONField(default=list, help_text='Array de preguntas: [{id, pregunta, descripcion, tipo, obligatoria, opciones, orden}]', verbose_name='Preguntas de la entrevista')),
                ('token', models.CharField(db_index=True, help_text='Token unico para acceso publico sin autenticacion', max_length=64, unique=True, verbose_name='Token de acceso')),
                ('estado', models.CharField(choices=[('pendiente', 'Pendiente de envio'), ('enviada', 'Enviada al candidato'), ('en_progreso', 'En progreso'), ('completada', 'Completada por candidato'), ('evaluada', 'Evaluada por HR'), ('vencida', 'Vencida'), ('cancelada', 'Cancelada')], db_index=True, default='pendiente', max_length=20, verbose_name='Estado')),
                ('email_enviado', models.BooleanField(default=False, verbose_name='Email enviado')),
                ('fecha_envio', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de envio del email')),
                ('fecha_vencimiento', models.DateTimeField(blank=True, null=True, verbose_name='Fecha limite para responder')),
                ('fecha_inicio', models.DateTimeField(blank=True, null=True, verbose_name='Fecha en que el candidato comenzo a responder')),
                ('fecha_completado', models.DateTimeField(blank=True, null=True, verbose_name='Fecha en que el candidato envio sus respuestas')),
                ('respuestas', models.JSONField(blank=True, default=dict, help_text='Dict {pregunta_id: respuesta}', verbose_name='Respuestas del candidato')),
                ('fecha_evaluacion', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de evaluacion')),
                ('calificacion_general', models.PositiveIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)], verbose_name='Calificacion general (0-100)')),
                ('recomendacion', models.CharField(blank=True, choices=[('contratar', 'Recomendado para contratar'), ('segunda_entrevista', 'Segunda entrevista'), ('rechazar', 'No recomendado'), ('pendiente', 'Decision pendiente')], max_length=20, null=True, verbose_name='Recomendacion')),
                ('fortalezas_identificadas', models.TextField(blank=True, null=True, verbose_name='Fortalezas identificadas')),
                ('aspectos_mejorar', models.TextField(blank=True, null=True, verbose_name='Aspectos a mejorar')),
                ('observaciones_evaluador', models.TextField(blank=True, null=True, verbose_name='Observaciones del evaluador')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True, verbose_name='IP del candidato')),
                ('user_agent', models.TextField(blank=True, null=True, verbose_name='User agent del navegador')),
                ('candidato', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='entrevistas_asincronicas', to='seleccion_contratacion.candidato', verbose_name='Candidato')),
                ('empresa', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='entrevistas_asincronicas', to='configuracion.empresaconfig', verbose_name='Empresa')),
                ('evaluador', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='entrevistas_async_evaluadas', to=settings.AUTH_USER_MODEL, verbose_name='Evaluador')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Creado por')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Actualizado por')),
            ],
            options={
                'verbose_name': 'Entrevista Asincronica',
                'verbose_name_plural': 'Entrevistas Asincronicas',
                'db_table': 'talent_hub_entrevista_asincronica',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='entrevistaasincronica',
            index=models.Index(fields=['candidato', 'estado'], name='talent_hub__candidat_async_idx'),
        ),
        migrations.AddIndex(
            model_name='entrevistaasincronica',
            index=models.Index(fields=['token'], name='talent_hub__token_async_idx'),
        ),
        migrations.AddIndex(
            model_name='entrevistaasincronica',
            index=models.Index(fields=['estado', 'is_active'], name='talent_hub__estado_async_idx'),
        ),
        migrations.AddIndex(
            model_name='entrevistaasincronica',
            index=models.Index(fields=['empresa', 'estado'], name='talent_hub__empresa_async_idx'),
        ),
        migrations.AddIndex(
            model_name='entrevistaasincronica',
            index=models.Index(fields=['fecha_vencimiento'], name='talent_hub__venci_async_idx'),
        ),
    ]
