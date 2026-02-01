# Generated manually for Migration 1 - Centro de Notificaciones

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ==================================================================
        # TipoNotificacion - Tipos de notificación configurables
        # ==================================================================
        migrations.CreateModel(
            name='TipoNotificacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Última Actualización')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activo')),
                ('codigo', models.CharField(help_text='Código único identificador del tipo', max_length=50, unique=True, verbose_name='Código')),
                ('nombre', models.CharField(max_length=200, verbose_name='Nombre')),
                ('descripcion', models.TextField(verbose_name='Descripción')),
                ('icono', models.CharField(blank=True, help_text='Icono a mostrar (bell, warning, check, etc.)', max_length=50, null=True, verbose_name='Icono')),
                ('color', models.CharField(default='blue', help_text='Color del icono/notificación', max_length=20, verbose_name='Color')),
                ('categoria', models.CharField(choices=[('sistema', 'Sistema'), ('tarea', 'Tarea'), ('alerta', 'Alerta'), ('recordatorio', 'Recordatorio'), ('aprobacion', 'Aprobación')], db_index=True, max_length=20, verbose_name='Categoría')),
                ('plantilla_titulo', models.CharField(help_text='Plantilla para el título. Ej: "Nueva {entidad} asignada"', max_length=500, verbose_name='Plantilla Título')),
                ('plantilla_mensaje', models.TextField(help_text='Plantilla para el mensaje. Usa {variable} para placeholders', verbose_name='Plantilla Mensaje')),
                ('url_template', models.CharField(blank=True, help_text='Plantilla URL para navegar. Ej: "/modulo/{id}"', max_length=500, null=True, verbose_name='URL Template')),
                ('es_email', models.BooleanField(default=False, help_text='También enviar por correo electrónico', verbose_name='Enviar Email')),
                ('es_push', models.BooleanField(default=False, help_text='Enviar notificación push', verbose_name='Enviar Push')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Creado Por')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Actualizado Por')),
            ],
            options={
                'verbose_name': 'Tipo de Notificación',
                'verbose_name_plural': 'Tipos de Notificación',
                'db_table': 'notif_tipo_notificacion',
                'ordering': ['categoria', 'nombre'],
            },
        ),
        # ==================================================================
        # Notificacion - Notificaciones individuales
        # ==================================================================
        migrations.CreateModel(
            name='Notificacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Última Actualización')),
                ('titulo', models.CharField(max_length=500, verbose_name='Título')),
                ('mensaje', models.TextField(verbose_name='Mensaje')),
                ('url', models.CharField(blank=True, help_text='URL para navegar al hacer clic', max_length=500, null=True, verbose_name='URL')),
                ('datos_extra', models.JSONField(blank=True, help_text='Datos adicionales en formato JSON', null=True, verbose_name='Datos Extra')),
                ('prioridad', models.CharField(choices=[('baja', 'Baja'), ('normal', 'Normal'), ('alta', 'Alta'), ('urgente', 'Urgente')], db_index=True, default='normal', max_length=10, verbose_name='Prioridad')),
                ('esta_leida', models.BooleanField(db_index=True, default=False, verbose_name='Está Leída')),
                ('fecha_lectura', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de Lectura')),
                ('esta_archivada', models.BooleanField(db_index=True, default=False, verbose_name='Está Archivada')),
                ('tipo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notificaciones', to='centro_notificaciones.tiponotificacion', verbose_name='Tipo')),
                ('usuario', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='notificaciones', to=settings.AUTH_USER_MODEL, verbose_name='Usuario')),
            ],
            options={
                'verbose_name': 'Notificación',
                'verbose_name_plural': 'Notificaciones',
                'db_table': 'notif_notificacion',
                'ordering': ['-created_at'],
            },
        ),
        # Índices para Notificacion
        migrations.AddIndex(
            model_name='notificacion',
            index=models.Index(fields=['usuario', '-created_at'], name='notif_notif_usuario_b1c234_idx'),
        ),
        migrations.AddIndex(
            model_name='notificacion',
            index=models.Index(fields=['usuario', 'esta_leida', '-created_at'], name='notif_notif_usuario_a5d678_idx'),
        ),
        migrations.AddIndex(
            model_name='notificacion',
            index=models.Index(fields=['tipo', '-created_at'], name='notif_notif_tipo_id_c9e012_idx'),
        ),
        # ==================================================================
        # PreferenciaNotificacion - Preferencias por usuario
        # ==================================================================
        migrations.CreateModel(
            name='PreferenciaNotificacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Última Actualización')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activo')),
                ('recibir_app', models.BooleanField(default=True, help_text='Mostrar notificación en la aplicación', verbose_name='Recibir en App')),
                ('recibir_email', models.BooleanField(default=True, help_text='Enviar por correo electrónico', verbose_name='Recibir Email')),
                ('recibir_push', models.BooleanField(default=False, help_text='Enviar notificación push', verbose_name='Recibir Push')),
                ('horario_inicio', models.TimeField(blank=True, help_text='No enviar notificaciones antes de esta hora', null=True, verbose_name='Horario Inicio')),
                ('horario_fin', models.TimeField(blank=True, help_text='No enviar notificaciones después de esta hora', null=True, verbose_name='Horario Fin')),
                ('tipo_notificacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='preferencias', to='centro_notificaciones.tiponotificacion', verbose_name='Tipo de Notificación')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='preferencias_notificacion', to=settings.AUTH_USER_MODEL, verbose_name='Usuario')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Creado Por')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Actualizado Por')),
            ],
            options={
                'verbose_name': 'Preferencia de Notificación',
                'verbose_name_plural': 'Preferencias de Notificación',
                'db_table': 'notif_preferencia_notificacion',
                'unique_together': {('usuario', 'tipo_notificacion')},
            },
        ),
        # ==================================================================
        # NotificacionMasiva - Notificaciones a múltiples usuarios
        # ==================================================================
        migrations.CreateModel(
            name='NotificacionMasiva',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Última Actualización')),
                ('titulo', models.CharField(max_length=500, verbose_name='Título')),
                ('mensaje', models.TextField(verbose_name='Mensaje')),
                ('destinatarios_tipo', models.CharField(choices=[('todos', 'Todos'), ('rol', 'Por Rol'), ('area', 'Por Área'), ('usuarios_especificos', 'Usuarios Específicos')], max_length=30, verbose_name='Tipo de Destinatarios')),
                ('total_enviadas', models.PositiveIntegerField(default=0, verbose_name='Total Enviadas')),
                ('total_leidas', models.PositiveIntegerField(default=0, verbose_name='Total Leídas')),
                ('tipo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notificaciones_masivas', to='centro_notificaciones.tiponotificacion', verbose_name='Tipo')),
                ('enviada_por', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notificaciones_masivas_enviadas', to=settings.AUTH_USER_MODEL, verbose_name='Enviada Por')),
            ],
            options={
                'verbose_name': 'Notificación Masiva',
                'verbose_name_plural': 'Notificaciones Masivas',
                'db_table': 'notif_notificacion_masiva',
                'ordering': ['-created_at'],
            },
        ),
    ]
