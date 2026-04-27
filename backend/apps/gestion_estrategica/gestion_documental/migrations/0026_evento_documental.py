# Migración 0026: EventoDocumental — log granular de eventos (ISO 27001 §A.8.10)
#
# Crea modelo `documental_evento` para auditar VISTA, DESCARGA_PDF, DESCARGA_DOCX,
# IMPRESION, EXPORT_DRIVE y ACCESO_DENEGADO con snapshot de versión, IP y user-agent.
# Los contadores `numero_descargas` y `numero_impresiones` del Documento se siguen
# manteniendo por compatibilidad y se actualizan vía signal post_save.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_documental', '0025_add_archivo_hash_sha256'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='EventoDocumental',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True,
                    primary_key=True,
                    serialize=False,
                    verbose_name='ID',
                )),
                ('created_at', models.DateTimeField(
                    auto_now_add=True,
                    db_index=True,
                    verbose_name='Fecha de creación',
                )),
                ('updated_at', models.DateTimeField(
                    auto_now=True,
                    verbose_name='Última actualización',
                )),
                ('is_deleted', models.BooleanField(
                    db_index=True,
                    default=False,
                    verbose_name='Eliminado',
                )),
                ('deleted_at', models.DateTimeField(
                    blank=True,
                    null=True,
                    verbose_name='Fecha de eliminación',
                )),
                ('tipo_evento', models.CharField(
                    choices=[
                        ('VISTA', 'Vista de detalle'),
                        ('DESCARGA_PDF', 'Descarga PDF'),
                        ('DESCARGA_DOCX', 'Descarga DOCX'),
                        ('IMPRESION', 'Impresión'),
                        ('EXPORT_DRIVE', 'Export a Drive'),
                        ('ACCESO_DENEGADO', 'Acceso denegado'),
                    ],
                    db_index=True,
                    max_length=20,
                    verbose_name='Tipo de Evento',
                )),
                ('version_documento', models.CharField(
                    blank=True,
                    default='',
                    help_text='Snapshot de la versión al momento del evento',
                    max_length=20,
                    verbose_name='Versión del Documento',
                )),
                ('ip_address', models.GenericIPAddressField(
                    blank=True,
                    null=True,
                    verbose_name='Dirección IP',
                )),
                ('user_agent', models.CharField(
                    blank=True,
                    default='',
                    max_length=500,
                    verbose_name='User Agent',
                )),
                ('metadatos', models.JSONField(
                    blank=True,
                    default=dict,
                    help_text='Contexto adicional: motivo, ruta, formato, etc.',
                    verbose_name='Metadatos',
                )),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='+',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Creado por',
                )),
                ('deleted_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='+',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Eliminado por',
                )),
                ('updated_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='+',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Actualizado por',
                )),
                ('documento', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='eventos',
                    to='gestion_documental.documento',
                    verbose_name='Documento',
                )),
                ('usuario', models.ForeignKey(
                    help_text='Usuario que ejecutó la acción (null si fue sistema)',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='eventos_documentales',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Usuario',
                )),
            ],
            options={
                'verbose_name': 'Evento Documental',
                'verbose_name_plural': 'Eventos Documentales',
                'db_table': 'documental_evento',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='eventodocumental',
            index=models.Index(
                fields=['documento', 'tipo_evento'],
                name='doc_evt_doc_tipo_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='eventodocumental',
            index=models.Index(
                fields=['usuario', '-created_at'],
                name='doc_evt_usr_ts_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='eventodocumental',
            index=models.Index(
                fields=['tipo_evento', '-created_at'],
                name='doc_evt_tipo_ts_idx',
            ),
        ),
    ]
