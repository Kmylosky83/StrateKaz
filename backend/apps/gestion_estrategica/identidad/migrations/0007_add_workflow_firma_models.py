# Generated manually for workflow de firmas
# Migration for ConfiguracionFlujoFirma, ProcesoFirmaPolitica, FirmaPolitica, HistorialFirmaPolitica
# NOTA: Evita dependencias circulares usando swappable_dependency para AUTH_USER_MODEL

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('identidad', '0006_migrate_integral_policy_to_politica_integral'),
    ]

    operations = [
        # ConfiguracionFlujoFirma
        migrations.CreateModel(
            name='ConfiguracionFlujoFirma',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')),
                ('nombre', models.CharField(help_text='Nombre descriptivo del flujo de firma', max_length=200, verbose_name='Nombre del Flujo')),
                ('descripcion', models.TextField(blank=True, null=True, verbose_name='Descripción')),
                ('tipo_politica', models.CharField(
                    choices=[('INTEGRAL', 'Política Integral'), ('ESPECIFICA', 'Política Específica')],
                    db_index=True,
                    max_length=20,
                    verbose_name='Tipo de Política'
                )),
                ('pasos_firma', models.JSONField(
                    default=list,
                    help_text='Lista ordenada de pasos de firma en formato JSON',
                    verbose_name='Pasos de Firma'
                )),
                ('es_activo', models.BooleanField(db_index=True, default=True, verbose_name='Activo')),
                ('requiere_firma_secuencial', models.BooleanField(
                    default=True,
                    help_text='Si es True, las firmas deben seguir el orden estricto',
                    verbose_name='Requiere Firma Secuencial'
                )),
            ],
            options={
                'verbose_name': 'Configuración de Flujo de Firma',
                'verbose_name_plural': 'Configuraciones de Flujos de Firma',
                'db_table': 'identidad_config_flujo_firma',
                'ordering': ['tipo_politica', 'nombre'],
            },
        ),
        # ProcesoFirmaPolitica
        migrations.CreateModel(
            name='ProcesoFirmaPolitica',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')),
                ('tipo_politica', models.CharField(
                    choices=[('INTEGRAL', 'Política Integral'), ('ESPECIFICA', 'Política Específica')],
                    max_length=20,
                    verbose_name='Tipo de Política'
                )),
                ('estado', models.CharField(
                    choices=[
                        ('EN_PROCESO', 'En Proceso'),
                        ('COMPLETADO', 'Completado'),
                        ('RECHAZADO', 'Rechazado'),
                        ('CANCELADO', 'Cancelado'),
                    ],
                    db_index=True,
                    default='EN_PROCESO',
                    max_length=20,
                    verbose_name='Estado'
                )),
                ('paso_actual', models.PositiveIntegerField(
                    default=1,
                    help_text='Número del paso actual en el flujo',
                    verbose_name='Paso Actual'
                )),
                ('fecha_inicio', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Inicio')),
                ('fecha_completado', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de Completado')),
                ('contenido_hash', models.CharField(
                    blank=True,
                    default='',
                    help_text='SHA-256 del contenido de la política al iniciar el proceso',
                    max_length=64,
                    verbose_name='Hash del Contenido'
                )),
                ('observaciones', models.TextField(blank=True, null=True, verbose_name='Observaciones')),
                ('flujo_firma', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='procesos',
                    to='identidad.configuracionflujofirma',
                    verbose_name='Flujo de Firma'
                )),
                ('iniciado_por', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='procesos_firma_iniciados',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Iniciado Por'
                )),
                ('politica_especifica', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='procesos_firma',
                    to='identidad.politicaespecifica',
                    verbose_name='Política Específica'
                )),
                ('politica_integral', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='procesos_firma',
                    to='identidad.politicaintegral',
                    verbose_name='Política Integral'
                )),
            ],
            options={
                'verbose_name': 'Proceso de Firma de Política',
                'verbose_name_plural': 'Procesos de Firma de Políticas',
                'db_table': 'identidad_proceso_firma_politica',
                'ordering': ['-fecha_inicio'],
            },
        ),
        migrations.AddIndex(
            model_name='procesofirmapolitica',
            index=models.Index(fields=['estado', '-fecha_inicio'], name='identidad_p_estado_c3f0cd_idx'),
        ),
        migrations.AddIndex(
            model_name='procesofirmapolitica',
            index=models.Index(fields=['tipo_politica', 'estado'], name='identidad_p_tipo_po_4e9a8f_idx'),
        ),
        # FirmaPolitica - usando string reference para Cargo para evitar dependencia circular
        migrations.CreateModel(
            name='FirmaPolitica',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')),
                ('orden', models.PositiveIntegerField(help_text='Orden del paso en el flujo', verbose_name='Orden')),
                ('rol_firmante', models.CharField(
                    choices=[
                        ('ELABORO', 'Elaboró'),
                        ('REVISO_TECNICO', 'Revisó Técnico'),
                        ('REVISO_JURIDICO', 'Revisó Jurídico'),
                        ('APROBO_DIRECTOR', 'Aprobó Director'),
                        ('APROBO_GERENTE', 'Aprobó Gerente'),
                        ('APROBO_REPRESENTANTE_LEGAL', 'Aprobó Representante Legal'),
                    ],
                    max_length=30,
                    verbose_name='Rol del Firmante'
                )),
                ('estado', models.CharField(
                    choices=[
                        ('PENDIENTE', 'Pendiente'),
                        ('FIRMADO', 'Firmado'),
                        ('RECHAZADO', 'Rechazado'),
                        ('REVOCADO', 'Revocado'),
                    ],
                    db_index=True,
                    default='PENDIENTE',
                    max_length=20,
                    verbose_name='Estado'
                )),
                ('firma_imagen', models.TextField(
                    blank=True,
                    help_text='Imagen de la firma en formato Base64 (data URL)',
                    null=True,
                    verbose_name='Firma (Base64)'
                )),
                ('firma_hash', models.CharField(
                    blank=True,
                    help_text='SHA-256 de la firma + metadata para verificación',
                    max_length=64,
                    null=True,
                    verbose_name='Hash de Firma'
                )),
                ('ip_address', models.GenericIPAddressField(
                    blank=True,
                    help_text='Dirección IP desde donde se firmó',
                    null=True,
                    verbose_name='IP Address'
                )),
                ('user_agent', models.TextField(
                    blank=True,
                    help_text='Navegador/dispositivo usado para firmar',
                    null=True,
                    verbose_name='User Agent'
                )),
                ('geolocalizacion', models.JSONField(
                    blank=True,
                    help_text='Coordenadas GPS si están disponibles',
                    null=True,
                    verbose_name='Geolocalización'
                )),
                ('fecha_asignacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Asignación')),
                ('fecha_firma', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de Firma')),
                ('fecha_limite', models.DateTimeField(
                    blank=True,
                    help_text='Fecha límite para firmar (SLA)',
                    null=True,
                    verbose_name='Fecha Límite'
                )),
                ('fecha_rechazo', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de Rechazo')),
                ('motivo_rechazo', models.TextField(blank=True, null=True, verbose_name='Motivo de Rechazo')),
                ('fecha_revocacion', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de Revocación')),
                ('motivo_revocacion', models.TextField(blank=True, null=True, verbose_name='Motivo de Revocación')),
                ('comentarios', models.TextField(
                    blank=True,
                    help_text='Comentarios opcionales del firmante',
                    null=True,
                    verbose_name='Comentarios'
                )),
                ('es_delegada', models.BooleanField(
                    default=False,
                    help_text='Indica si esta firma fue delegada',
                    verbose_name='Es Delegada'
                )),
                # FK a Cargo usando string reference para evitar dependencia circular
                ('cargo', models.ForeignKey(
                    help_text='Cargo que debe firmar',
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='firmas_politicas',
                    to='core.cargo',
                    verbose_name='Cargo'
                )),
                ('delegado_por', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='firmas_delegadas',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Delegado Por'
                )),
                ('proceso_firma', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='firmas',
                    to='identidad.procesofirmapolitica',
                    verbose_name='Proceso de Firma'
                )),
                ('revocado_por', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='firmas_revocadas',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Revocado Por'
                )),
                ('usuario', models.ForeignKey(
                    blank=True,
                    help_text='Usuario que firmó (persona física)',
                    null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='firmas_politicas',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Usuario'
                )),
            ],
            options={
                'verbose_name': 'Firma de Política',
                'verbose_name_plural': 'Firmas de Políticas',
                'db_table': 'identidad_firma_politica',
                'ordering': ['proceso_firma', 'orden'],
            },
        ),
        migrations.AddConstraint(
            model_name='firmapolitica',
            constraint=models.UniqueConstraint(fields=('proceso_firma', 'orden'), name='unique_proceso_orden'),
        ),
        migrations.AddIndex(
            model_name='firmapolitica',
            index=models.Index(fields=['estado', 'fecha_limite'], name='identidad_f_estado_b7a5e5_idx'),
        ),
        migrations.AddIndex(
            model_name='firmapolitica',
            index=models.Index(fields=['usuario', '-fecha_firma'], name='identidad_f_usuario_6d7e89_idx'),
        ),
        migrations.AddIndex(
            model_name='firmapolitica',
            index=models.Index(fields=['cargo', 'estado'], name='identidad_f_cargo_i_8a3b2c_idx'),
        ),
        # HistorialFirmaPolitica
        migrations.CreateModel(
            name='HistorialFirmaPolitica',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')),
                ('accion', models.CharField(
                    help_text='Acción realizada (ASIGNADO, FIRMADO, RECHAZADO, REVOCADO)',
                    max_length=50,
                    verbose_name='Acción'
                )),
                ('detalles', models.JSONField(
                    default=dict,
                    help_text='Detalles adicionales de la acción en formato JSON',
                    verbose_name='Detalles'
                )),
                ('fecha', models.DateTimeField(auto_now_add=True, verbose_name='Fecha')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True, verbose_name='IP Address')),
                ('firma', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='historial',
                    to='identidad.firmapolitica',
                    verbose_name='Firma'
                )),
                ('usuario', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='historial_firmas',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Usuario'
                )),
            ],
            options={
                'verbose_name': 'Historial de Firma',
                'verbose_name_plural': 'Historiales de Firmas',
                'db_table': 'identidad_historial_firma_politica',
                'ordering': ['-fecha'],
            },
        ),
        migrations.AddIndex(
            model_name='historialfirmapolitica',
            index=models.Index(fields=['firma', '-fecha'], name='identidad_h_firma_i_f8b3a4_idx'),
        ),
    ]
