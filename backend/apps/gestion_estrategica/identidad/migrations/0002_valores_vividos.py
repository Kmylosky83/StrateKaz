# Generated manually for ValorVivido and ConfiguracionMetricaValor models

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('identidad', '0001_dynamic_models_dia6'),
        ('organizacion', '0001_initial'),
        ('configuracion', '0003_dynamic_models_dia6'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # =====================================================================
        # CONFIGURACIÓN DE MÉTRICAS POR EMPRESA
        # =====================================================================
        migrations.CreateModel(
            name='ConfiguracionMetricaValor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Fecha de Creación')),
                ('updated_at', models.DateTimeField(auto_now=True, db_index=True, verbose_name='Última Actualización')),
                ('is_active', models.BooleanField(db_index=True, default=True, verbose_name='Activo')),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Fecha de Eliminación')),
                ('acciones_minimas_mensual', models.PositiveIntegerField(
                    default=5,
                    help_text='Número mínimo de acciones vinculadas a valores esperadas por mes',
                    verbose_name='Acciones mínimas mensuales'
                )),
                ('puntaje_minimo_promedio', models.DecimalField(
                    decimal_places=2,
                    default=5.0,
                    max_digits=4,
                    validators=[
                        django.core.validators.MinValueValidator(1),
                        django.core.validators.MaxValueValidator(10)
                    ],
                    verbose_name='Puntaje mínimo promedio'
                )),
                ('alertar_valores_bajos', models.BooleanField(
                    default=True,
                    help_text='Activar alertas cuando un valor tiene pocas acciones',
                    verbose_name='Alertar valores bajos'
                )),
                ('umbral_alerta_acciones', models.PositiveIntegerField(
                    default=3,
                    help_text='Umbral mínimo de acciones antes de alertar',
                    verbose_name='Umbral de alerta'
                )),
                ('categorias_prioritarias', models.JSONField(
                    blank=True,
                    default=list,
                    help_text='Categorías de acciones que tienen mayor peso',
                    verbose_name='Categorías prioritarias'
                )),
                ('pesos_tipo_vinculo', models.JSONField(
                    blank=True,
                    default=dict,
                    help_text='Pesos personalizados por tipo de vínculo',
                    verbose_name='Pesos por tipo vínculo'
                )),
                ('meses_analisis', models.PositiveIntegerField(
                    default=12,
                    help_text='Número de meses a analizar para tendencias',
                    verbose_name='Meses de análisis'
                )),
                ('empresa', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='config_metricas_valores',
                    to='configuracion.empresaconfig',
                    verbose_name='Empresa'
                )),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='%(app_label)s_%(class)s_created',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Creado por'
                )),
                ('updated_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='%(app_label)s_%(class)s_updated',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Actualizado por'
                )),
            ],
            options={
                'verbose_name': 'Configuración de Métricas de Valores',
                'verbose_name_plural': 'Configuraciones de Métricas de Valores',
                'db_table': 'identidad_config_metrica_valor',
            },
        ),
        # =====================================================================
        # VALOR VIVIDO - CONEXIÓN GENÉRICA VALOR-ACCIÓN
        # =====================================================================
        migrations.CreateModel(
            name='ValorVivido',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Fecha de Creación')),
                ('updated_at', models.DateTimeField(auto_now=True, db_index=True, verbose_name='Última Actualización')),
                ('is_active', models.BooleanField(db_index=True, default=True, verbose_name='Activo')),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Fecha de Eliminación')),
                # GenericForeignKey fields
                ('object_id', models.PositiveIntegerField(
                    db_index=True,
                    help_text='ID del objeto/acción vinculado',
                    verbose_name='ID del Objeto'
                )),
                # Categorización
                ('categoria_accion', models.CharField(
                    choices=[
                        ('PROYECTO', 'Proyecto'),
                        ('OBJETIVO', 'Objetivo Estratégico'),
                        ('INICIATIVA', 'Iniciativa'),
                        ('ACCION_CORRECTIVA', 'Acción Correctiva'),
                        ('ACCION_PREVENTIVA', 'Acción Preventiva'),
                        ('ACCION_MEJORA', 'Acción de Mejora'),
                        ('OPORTUNIDAD_MEJORA', 'Oportunidad de Mejora'),
                        ('GESTION_CAMBIO', 'Gestión del Cambio'),
                        ('INVESTIGACION_INCIDENTE', 'Investigación de Incidente'),
                        ('INSPECCION', 'Inspección'),
                        ('HALLAZGO_AUDITORIA', 'Hallazgo de Auditoría'),
                        ('NO_CONFORMIDAD', 'No Conformidad'),
                        ('ACCION_PESV', 'Acción PESV'),
                        ('OTRO', 'Otro')
                    ],
                    db_index=True,
                    help_text='Tipo de acción a la que se vincula el valor',
                    max_length=30,
                    verbose_name='Categoría de Acción'
                )),
                ('tipo_vinculo', models.CharField(
                    choices=[
                        ('REFLEJA', 'Refleja el valor'),
                        ('PROMUEVE', 'Promueve el valor'),
                        ('RESULTADO', 'Es resultado del valor'),
                        ('MEJORA', 'Mejora/fortalece el valor')
                    ],
                    db_index=True,
                    default='REFLEJA',
                    help_text='Cómo se relaciona la acción con el valor',
                    max_length=20,
                    verbose_name='Tipo de Vínculo'
                )),
                ('impacto', models.CharField(
                    choices=[
                        ('BAJO', 'Bajo'),
                        ('MEDIO', 'Medio'),
                        ('ALTO', 'Alto'),
                        ('MUY_ALTO', 'Muy Alto')
                    ],
                    db_index=True,
                    default='MEDIO',
                    help_text='Nivel de impacto de la acción sobre el valor',
                    max_length=20,
                    verbose_name='Impacto'
                )),
                ('puntaje', models.PositiveSmallIntegerField(
                    db_index=True,
                    default=5,
                    help_text='Puntaje calculado (1-10) basado en impacto y tipo',
                    validators=[
                        django.core.validators.MinValueValidator(1),
                        django.core.validators.MaxValueValidator(10)
                    ],
                    verbose_name='Puntaje'
                )),
                # Justificación y evidencia
                ('justificacion', models.TextField(
                    help_text='Explicación de por qué esta acción refleja el valor',
                    verbose_name='Justificación'
                )),
                ('evidencia', models.TextField(
                    blank=True,
                    help_text='Descripción de la evidencia que respalda el vínculo',
                    null=True,
                    verbose_name='Evidencia'
                )),
                ('archivo_evidencia', models.FileField(
                    blank=True,
                    null=True,
                    upload_to='valores_vividos/evidencias/',
                    verbose_name='Archivo de Evidencia'
                )),
                # Fechas y seguimiento
                ('fecha_vinculacion', models.DateTimeField(
                    auto_now_add=True,
                    db_index=True,
                    verbose_name='Fecha de Vinculación'
                )),
                ('verificado', models.BooleanField(
                    db_index=True,
                    default=False,
                    help_text='Indica si un supervisor verificó el vínculo',
                    verbose_name='Verificado'
                )),
                ('fecha_verificacion', models.DateTimeField(
                    blank=True,
                    null=True,
                    verbose_name='Fecha de Verificación'
                )),
                # Metadata adicional
                ('metadata', models.JSONField(
                    blank=True,
                    default=dict,
                    help_text='Datos adicionales en formato JSON',
                    verbose_name='Metadata'
                )),
                # Foreign Keys
                ('valor', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='acciones_vinculadas',
                    to='identidad.corporatevalue',
                    verbose_name='Valor Corporativo'
                )),
                ('content_type', models.ForeignKey(
                    help_text='Tipo de modelo vinculado (ej: proyecto, acción correctiva)',
                    on_delete=django.db.models.deletion.CASCADE,
                    to='contenttypes.contenttype',
                    verbose_name='Tipo de Contenido'
                )),
                ('vinculado_por', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='valores_vinculados',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Vinculado por'
                )),
                ('verificado_por', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='valores_verificados',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Verificado por'
                )),
                ('area', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='valores_vividos',
                    to='organizacion.area',
                    verbose_name='Área'
                )),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='%(app_label)s_%(class)s_created',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Creado por'
                )),
                ('updated_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='%(app_label)s_%(class)s_updated',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Actualizado por'
                )),
            ],
            options={
                'verbose_name': 'Valor Vivido',
                'verbose_name_plural': 'Valores Vividos',
                'db_table': 'identidad_valor_vivido',
                'ordering': ['-fecha_vinculacion'],
            },
        ),
        # =====================================================================
        # ÍNDICES PARA RENDIMIENTO
        # =====================================================================
        migrations.AddIndex(
            model_name='valorvivido',
            index=models.Index(
                fields=['content_type', 'object_id'],
                name='valor_vivido_ct_obj_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='valorvivido',
            index=models.Index(
                fields=['valor', 'categoria_accion'],
                name='valor_vivido_val_cat_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='valorvivido',
            index=models.Index(
                fields=['fecha_vinculacion', 'impacto'],
                name='valor_vivido_fecha_imp_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='valorvivido',
            index=models.Index(
                fields=['verificado', 'is_active'],
                name='valor_vivido_verif_act_idx'
            ),
        ),
        # =====================================================================
        # CONSTRAINT ÚNICO PARA EVITAR DUPLICADOS
        # =====================================================================
        migrations.AddConstraint(
            model_name='valorvivido',
            constraint=models.UniqueConstraint(
                condition=models.Q(is_active=True),
                fields=['valor', 'content_type', 'object_id'],
                name='unique_valor_accion_active'
            ),
        ),
    ]
