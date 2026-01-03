# Generated migration for IntegracionExterna model
from django.db import migrations, models
import django.db.models.deletion


def add_integraciones_section(apps, schema_editor):
    """
    Agrega la sección 'Integraciones Externas' al tab Configuración
    """
    ModuleTab = apps.get_model('core', 'ModuleTab')
    TabSection = apps.get_model('core', 'TabSection')

    try:
        tab_configuracion = ModuleTab.objects.get(code='configuracion')
    except ModuleTab.DoesNotExist:
        return

    # Verificar si ya existe la sección
    if TabSection.objects.filter(tab=tab_configuracion, code='integraciones').exists():
        return

    # Obtener el último orden
    # Usar 'orden' ya que el campo fue renombrado de 'order' a 'orden'
    last_section = TabSection.objects.filter(tab=tab_configuracion).order_by('-orden').first()
    new_orden = (last_section.orden + 1) if last_section else 5

    # Crear la sección de integraciones
    TabSection.objects.create(
        tab=tab_configuracion,
        code='integraciones',
        name='Integraciones Externas',
        description='Configuración de servicios externos (Email, DIAN, SMS, Almacenamiento, etc.)',
        icon='Plug',
        orden=new_orden,
        is_enabled=True,
        is_core=False
    )


def remove_integraciones_section(apps, schema_editor):
    """Elimina la sección 'integraciones' del tab Configuración"""
    TabSection = apps.get_model('core', 'TabSection')
    ModuleTab = apps.get_model('core', 'ModuleTab')

    try:
        tab_configuracion = ModuleTab.objects.get(code='configuracion')
        TabSection.objects.filter(tab=tab_configuracion, code='integraciones').delete()
    except ModuleTab.DoesNotExist:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0003_sede_empresa'),
        ('core', '0008_populate_system_modules_tree'),
    ]

    operations = [
        # Crear el modelo IntegracionExterna
        migrations.CreateModel(
            name='IntegracionExterna',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(
                    help_text='Nombre descriptivo de la integración (ej: "Email Corporativo Gmail")',
                    max_length=150,
                    verbose_name='Nombre'
                )),
                ('tipo_servicio', models.CharField(
                    choices=[
                        ('EMAIL', 'Servicio de Email'),
                        ('SMS', 'Mensajería SMS'),
                        ('WHATSAPP', 'Mensajería WhatsApp'),
                        ('NOTIFICACIONES', 'Notificaciones Push'),
                        ('FACTURACION', 'Facturación Electrónica'),
                        ('NOMINA', 'Nómina Electrónica'),
                        ('RADIAN', 'RADIAN (Validación Facturas)'),
                        ('ALMACENAMIENTO', 'Almacenamiento en la Nube'),
                        ('CDN', 'Content Delivery Network'),
                        ('BACKUP', 'Backup y Recuperación'),
                        ('BI', 'Business Intelligence'),
                        ('ANALYTICS', 'Analytics y Métricas'),
                        ('REPORTES', 'Generación de Reportes'),
                        ('PAGOS', 'Pasarela de Pagos'),
                        ('PSE', 'PSE (Pagos Electrónicos)'),
                        ('BANCARIO', 'Integración Bancaria'),
                        ('MAPAS', 'Mapas y Geocodificación'),
                        ('RASTREO', 'Rastreo GPS'),
                        ('FIRMA_DIGITAL', 'Firma Digital Certificada'),
                        ('ERP', 'Integración con ERP Externo'),
                        ('CRM', 'Integración con CRM Externo'),
                        ('API_TERCEROS', 'API de Terceros'),
                        ('WEBHOOK', 'Webhooks'),
                        ('OTRO', 'Otro Servicio'),
                    ],
                    db_index=True,
                    help_text='Categoría del servicio externo',
                    max_length=30,
                    verbose_name='Tipo de Servicio'
                )),
                ('proveedor', models.CharField(
                    choices=[
                        ('GMAIL', 'Gmail / Google Workspace'),
                        ('OUTLOOK', 'Outlook / Microsoft 365'),
                        ('SENDGRID', 'SendGrid'),
                        ('MAILGUN', 'Mailgun'),
                        ('SES', 'Amazon SES'),
                        ('TWILIO', 'Twilio'),
                        ('INFOBIP', 'Infobip'),
                        ('MESSAGEBIRD', 'MessageBird'),
                        ('DIAN', 'DIAN (Directo)'),
                        ('CARVAJAL', 'Carvajal Tecnología y Servicios'),
                        ('EDICOM', 'EDICOM'),
                        ('SIIGO', 'Siigo'),
                        ('ALEGRA', 'Alegra'),
                        ('AWS_S3', 'Amazon S3'),
                        ('GOOGLE_DRIVE', 'Google Drive'),
                        ('DROPBOX', 'Dropbox'),
                        ('AZURE_BLOB', 'Azure Blob Storage'),
                        ('ONEDRIVE', 'OneDrive'),
                        ('POWER_BI', 'Microsoft Power BI'),
                        ('TABLEAU', 'Tableau'),
                        ('LOOKER', 'Looker / Google Data Studio'),
                        ('METABASE', 'Metabase'),
                        ('PAYU', 'PayU Latam'),
                        ('MERCADOPAGO', 'MercadoPago'),
                        ('STRIPE', 'Stripe'),
                        ('WOMPI', 'Wompi'),
                        ('EVERTEC', 'Evertec (PlacetoPay)'),
                        ('GOOGLE_MAPS', 'Google Maps Platform'),
                        ('MAPBOX', 'Mapbox'),
                        ('HERE', 'HERE Technologies'),
                        ('CERTICAMARA', 'Certicámara'),
                        ('GSE', 'GSE (Gobierno en Línea)'),
                        ('ANDES_SCD', 'Andes SCD'),
                        ('PERSONALIZADO', 'Servicio Personalizado'),
                        ('OTRO', 'Otro Proveedor'),
                    ],
                    db_index=True,
                    help_text='Proveedor del servicio',
                    max_length=50,
                    verbose_name='Proveedor'
                )),
                ('descripcion', models.TextField(
                    blank=True,
                    help_text='Descripción detallada del propósito de la integración',
                    null=True,
                    verbose_name='Descripción'
                )),
                ('endpoint_url', models.URLField(
                    blank=True,
                    help_text='URL base de la API del servicio (ej: https://api.servicio.com/v1)',
                    max_length=500,
                    null=True,
                    verbose_name='URL del Endpoint'
                )),
                ('metodo_autenticacion', models.CharField(
                    choices=[
                        ('API_KEY', 'API Key'),
                        ('BEARER_TOKEN', 'Bearer Token'),
                        ('OAUTH2', 'OAuth 2.0'),
                        ('OAUTH1', 'OAuth 1.0'),
                        ('BASIC_AUTH', 'Basic Authentication (Usuario/Contraseña)'),
                        ('JWT', 'JSON Web Token (JWT)'),
                        ('SERVICE_ACCOUNT', 'Service Account (Cuenta de Servicio)'),
                        ('CERTIFICATE', 'Certificado Digital (TLS/SSL Client Certificate)'),
                        ('HMAC', 'HMAC Signature'),
                        ('CUSTOM', 'Autenticación Personalizada'),
                    ],
                    default='API_KEY',
                    help_text='Tipo de autenticación utilizado',
                    max_length=30,
                    verbose_name='Método de Autenticación'
                )),
                ('_credenciales_encrypted', models.TextField(
                    blank=True,
                    db_column='credenciales_encrypted',
                    help_text='Almacena credenciales encriptadas (API keys, tokens, passwords, etc.)',
                    null=True,
                    verbose_name='Credenciales (Encriptadas)'
                )),
                ('configuracion_adicional', models.JSONField(
                    blank=True,
                    default=dict,
                    help_text='Parámetros específicos del servicio (timeouts, límites, etc.)',
                    verbose_name='Configuración Adicional'
                )),
                ('ambiente', models.CharField(
                    choices=[
                        ('PRODUCCION', 'Producción'),
                        ('SANDBOX', 'Sandbox / Pruebas'),
                        ('DESARROLLO', 'Desarrollo'),
                    ],
                    default='PRODUCCION',
                    help_text='Ambiente de la integración',
                    max_length=20,
                    verbose_name='Ambiente'
                )),
                ('is_active', models.BooleanField(
                    db_index=True,
                    default=True,
                    help_text='Si la integración está activa y puede usarse',
                    verbose_name='Activo'
                )),
                ('ultima_conexion_exitosa', models.DateTimeField(
                    blank=True,
                    help_text='Fecha y hora de la última conexión exitosa',
                    null=True,
                    verbose_name='Última Conexión Exitosa'
                )),
                ('ultima_falla', models.DateTimeField(
                    blank=True,
                    help_text='Fecha y hora de la última falla de conexión',
                    null=True,
                    verbose_name='Última Falla'
                )),
                ('contador_llamadas', models.IntegerField(
                    default=0,
                    help_text='Total de llamadas realizadas (para rate limiting)',
                    verbose_name='Contador de Llamadas'
                )),
                ('errores_recientes', models.JSONField(
                    blank=True,
                    default=list,
                    help_text='Lista de los últimos 10 errores con timestamp y detalle',
                    verbose_name='Errores Recientes'
                )),
                ('limite_llamadas_dia', models.IntegerField(
                    blank=True,
                    help_text='Límite máximo de llamadas permitidas por día (null = sin límite)',
                    null=True,
                    verbose_name='Límite de Llamadas por Día'
                )),
                ('alerta_porcentaje_limite', models.IntegerField(
                    default=80,
                    help_text='Porcentaje del límite para enviar alerta (ej: 80 = alerta al 80%)',
                    verbose_name='% para Alerta de Límite'
                )),
                ('created_at', models.DateTimeField(
                    auto_now_add=True,
                    verbose_name='Fecha de Creación'
                )),
                ('updated_at', models.DateTimeField(
                    auto_now=True,
                    verbose_name='Última Actualización'
                )),
                ('deleted_at', models.DateTimeField(
                    blank=True,
                    help_text='Fecha de eliminación lógica (soft delete)',
                    null=True,
                    verbose_name='Fecha de Eliminación'
                )),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='integraciones_creadas',
                    to='core.user',
                    verbose_name='Creado por'
                )),
                ('updated_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='integraciones_actualizadas',
                    to='core.user',
                    verbose_name='Actualizado por'
                )),
            ],
            options={
                'verbose_name': 'Integración Externa',
                'verbose_name_plural': 'Integraciones Externas',
                'db_table': 'configuracion_integracion_externa',
                'ordering': ['tipo_servicio', 'nombre'],
            },
        ),
        # Índices
        migrations.AddIndex(
            model_name='integracionexterna',
            index=models.Index(fields=['tipo_servicio', 'is_active'], name='config_tipo_active_idx'),
        ),
        migrations.AddIndex(
            model_name='integracionexterna',
            index=models.Index(fields=['proveedor', 'is_active'], name='config_prov_active_idx'),
        ),
        migrations.AddIndex(
            model_name='integracionexterna',
            index=models.Index(fields=['ambiente'], name='config_ambiente_idx'),
        ),
        migrations.AddIndex(
            model_name='integracionexterna',
            index=models.Index(fields=['deleted_at'], name='config_deleted_integ_idx'),
        ),
        # Agregar la sección al tab de Configuración
        migrations.RunPython(add_integraciones_section, remove_integraciones_section),
    ]
