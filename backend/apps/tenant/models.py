"""
Modelos Multi-Tenant con django-tenants (PostgreSQL Schemas)

Estos modelos reemplazan los modelos anteriores para usar schemas de PostgreSQL
en lugar de bases de datos separadas.

Arquitectura:
- Schema 'public': Tenant, Domain, Plan, TenantUser (compartidos)
- Schema 'tenant_xxx': Todos los modelos de negocio (aislados)
"""

import hashlib
import uuid
from datetime import timedelta

from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from django.utils.crypto import constant_time_compare
from django.contrib.auth.hashers import make_password, check_password as django_check_password
from django_tenants.models import TenantMixin, DomainMixin


# ==============================================================================
# CONSTANTES DE CONFIGURACIÓN (migradas de gestion_estrategica.configuracion)
# ==============================================================================

DEPARTAMENTOS_COLOMBIA = [
    ('AMAZONAS', 'Amazonas'),
    ('ANTIOQUIA', 'Antioquia'),
    ('ARAUCA', 'Arauca'),
    ('ATLANTICO', 'Atlántico'),
    ('BOLIVAR', 'Bolívar'),
    ('BOYACA', 'Boyacá'),
    ('CALDAS', 'Caldas'),
    ('CAQUETA', 'Caquetá'),
    ('CASANARE', 'Casanare'),
    ('CAUCA', 'Cauca'),
    ('CESAR', 'Cesar'),
    ('CHOCO', 'Chocó'),
    ('CORDOBA', 'Córdoba'),
    ('CUNDINAMARCA', 'Cundinamarca'),
    ('GUAINIA', 'Guainía'),
    ('GUAVIARE', 'Guaviare'),
    ('HUILA', 'Huila'),
    ('LA_GUAJIRA', 'La Guajira'),
    ('MAGDALENA', 'Magdalena'),
    ('META', 'Meta'),
    ('NARINO', 'Nariño'),
    ('NORTE_DE_SANTANDER', 'Norte de Santander'),
    ('PUTUMAYO', 'Putumayo'),
    ('QUINDIO', 'Quindío'),
    ('RISARALDA', 'Risaralda'),
    ('SAN_ANDRES', 'San Andrés y Providencia'),
    ('SANTANDER', 'Santander'),
    ('SUCRE', 'Sucre'),
    ('TOLIMA', 'Tolima'),
    ('VALLE_DEL_CAUCA', 'Valle del Cauca'),
    ('VAUPES', 'Vaupés'),
    ('VICHADA', 'Vichada'),
]

TIPO_SOCIEDAD_CHOICES = [
    ('SAS', 'Sociedad por Acciones Simplificada (S.A.S.)'),
    ('SA', 'Sociedad Anónima (S.A.)'),
    ('LTDA', 'Sociedad Limitada (Ltda.)'),
    ('SCA', 'Sociedad en Comandita por Acciones'),
    ('SC', 'Sociedad en Comandita Simple'),
    ('COLECTIVA', 'Sociedad Colectiva'),
    ('ESAL', 'Entidad Sin Ánimo de Lucro'),
    ('PERSONA_NATURAL', 'Persona Natural'),
    ('SUCURSAL_EXTRANJERA', 'Sucursal de Sociedad Extranjera'),
    ('OTRO', 'Otro'),
]

REGIMEN_TRIBUTARIO_CHOICES = [
    ('COMUN', 'Régimen Común (Responsable de IVA)'),
    ('SIMPLE', 'Régimen Simple de Tributación (RST)'),
    ('NO_RESPONSABLE', 'No Responsable de IVA'),
    ('ESPECIAL', 'Régimen Tributario Especial'),
    ('GRAN_CONTRIBUYENTE', 'Gran Contribuyente'),
]

FORMATO_FECHA_CHOICES = [
    ('DD/MM/YYYY', 'DD/MM/YYYY (31/12/2024)'),
    ('MM/DD/YYYY', 'MM/DD/YYYY (12/31/2024)'),
    ('YYYY-MM-DD', 'YYYY-MM-DD (2024-12-31)'),
    ('DD-MM-YYYY', 'DD-MM-YYYY (31-12-2024)'),
]

MONEDA_CHOICES = [
    ('COP', 'Peso Colombiano (COP)'),
    ('USD', 'Dólar Estadounidense (USD)'),
    ('EUR', 'Euro (EUR)'),
]

TIMEZONE_CHOICES = [
    ('America/Bogota', 'Colombia (America/Bogota)'),
    ('America/New_York', 'Este EEUU (America/New_York)'),
    ('America/Los_Angeles', 'Pacífico EEUU (America/Los_Angeles)'),
    ('America/Mexico_City', 'México (America/Mexico_City)'),
    ('Europe/Madrid', 'España (Europe/Madrid)'),
    ('UTC', 'UTC'),
]


class Plan(models.Model):
    """
    Plan de suscripción para tenants.

    Define límites y características disponibles por nivel de plan.
    Vive en schema 'public'.
    """

    PLAN_CHOICES = [
        ('basic', 'Básico'),
        ('pro', 'Profesional'),
        ('enterprise', 'Enterprise'),
    ]

    # Identificación
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Código',
        help_text='Código único del plan (basic, pro, enterprise)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del plan'
    )
    description = models.TextField(
        blank=True,
        default='',
        verbose_name='Descripción'
    )

    # Límites
    max_users = models.PositiveIntegerField(
        default=10,
        verbose_name='Máximo usuarios',
        help_text='0 = ilimitado'
    )
    max_storage_gb = models.PositiveIntegerField(
        default=5,
        verbose_name='Almacenamiento máximo (GB)',
        help_text='0 = ilimitado'
    )

    # Precio
    price_monthly = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Precio mensual (USD)'
    )
    price_yearly = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Precio anual (USD)'
    )

    # Features habilitados (JSON array de códigos de módulos)
    features = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Módulos habilitados',
        help_text='Lista de códigos de módulos: ["sst", "pesv", "iso", "analytics"]'
    )

    # Estado
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    is_default = models.BooleanField(
        default=False,
        verbose_name='Plan por defecto',
        help_text='Plan asignado a nuevos tenants'
    )
    order = models.PositiveSmallIntegerField(default=0, verbose_name='Orden')

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_plan'
        verbose_name = 'Plan'
        verbose_name_plural = 'Planes'
        ordering = ['order', 'price_monthly']

    def __str__(self):
        return f"{self.name} (${self.price_monthly}/mes)"

    def save(self, *args, **kwargs):
        if self.is_default:
            Plan.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class Tenant(TenantMixin):
    """
    Tenant (Empresa cliente) - Compatible con django-tenants.

    Hereda de TenantMixin que proporciona:
    - schema_name: Nombre del schema PostgreSQL
    - auto_create_schema: Crear schema automáticamente
    - auto_drop_schema: Eliminar schema al borrar tenant

    Vive en schema 'public'.
    """

    # Validador para código/schema
    code_validator = RegexValidator(
        regex=r'^[a-z][a-z0-9_]*$',
        message='El código solo puede contener letras minúsculas, números y guiones bajos. '
                'Debe empezar con letra.'
    )

    # ==========================================================================
    # IDENTIFICACIÓN
    # ==========================================================================
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        validators=[code_validator],
        verbose_name='Código',
        help_text='Código interno único. Se usa como nombre del schema (ej: empresa_abc)'
    )
    name = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre de la empresa'
    )
    nit = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='NIT',
        help_text='Número de Identificación Tributaria'
    )

    # ==========================================================================
    # PLAN Y LÍMITES
    # ==========================================================================
    plan = models.ForeignKey(
        Plan,
        on_delete=models.SET_NULL,
        related_name='tenants',
        verbose_name='Plan',
        blank=True,
        null=True,
    )

    # Límites directos (override del plan)
    max_users = models.PositiveIntegerField(
        default=0,
        verbose_name='Máximo usuarios',
        help_text='0 = usar límite del plan'
    )
    max_storage_gb = models.PositiveIntegerField(
        default=0,
        verbose_name='Almacenamiento máximo (GB)',
        help_text='0 = usar límite del plan'
    )

    # Módulos habilitados (override del plan)
    enabled_modules = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Módulos habilitados',
        help_text='Si está vacío, usa los módulos del plan'
    )

    TIER_CHOICES = [
        ('starter', 'Starter (hasta 10 usuarios)'),
        ('small', 'Pequeña (hasta 50 usuarios)'),
        ('medium', 'Mediana (hasta 200 usuarios)'),
        ('large', 'Grande (hasta 500 usuarios)'),
        ('enterprise', 'Enterprise (ilimitado)'),
    ]
    tier = models.CharField(
        max_length=20,
        choices=TIER_CHOICES,
        default='starter',
        verbose_name='Tamaño'
    )

    # ==========================================================================
    # ESTADO Y SUSCRIPCIÓN
    # ==========================================================================
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    is_trial = models.BooleanField(
        default=True,
        verbose_name='En período de prueba'
    )
    trial_ends_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fin del trial'
    )
    subscription_ends_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fin de suscripción'
    )

    # ==========================================================================
    # ESTADO DEL SCHEMA (para creación asíncrona)
    # ==========================================================================
    SCHEMA_STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('creating', 'Creando'),
        ('ready', 'Listo'),
        ('failed', 'Fallido'),
    ]
    schema_status = models.CharField(
        max_length=20,
        choices=SCHEMA_STATUS_CHOICES,
        default='pending',
        db_index=True,
        verbose_name='Estado del schema',
        help_text='Estado de la creación del schema PostgreSQL'
    )
    schema_task_id = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name='Task ID de Celery',
        help_text='ID de la tarea Celery que está creando el schema'
    )
    schema_error = models.TextField(
        blank=True,
        default='',
        verbose_name='Error de schema',
        help_text='Mensaje de error si la creación del schema falló'
    )

    # ==========================================================================
    # DATOS FISCALES Y LEGALES (migrado de EmpresaConfig)
    # ==========================================================================
    razon_social = models.CharField(
        max_length=250,
        blank=True,
        default='',
        verbose_name='Razón Social',
        help_text='Nombre legal completo de la empresa'
    )
    nombre_comercial = models.CharField(
        max_length=200,
        blank=True,
        default='',
        verbose_name='Nombre Comercial',
        help_text='Nombre comercial o de fantasía (opcional)'
    )
    representante_legal = models.CharField(
        max_length=200,
        blank=True,
        default='',
        verbose_name='Representante Legal'
    )
    cedula_representante = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Cédula del Representante'
    )
    tipo_sociedad = models.CharField(
        max_length=30,
        choices=TIPO_SOCIEDAD_CHOICES,
        default='SAS',
        verbose_name='Tipo de Sociedad'
    )
    actividad_economica = models.CharField(
        max_length=10,
        blank=True,
        default='',
        verbose_name='Actividad Económica (CIIU)'
    )
    descripcion_actividad = models.CharField(
        max_length=300,
        blank=True,
        default='',
        verbose_name='Descripción de Actividad'
    )
    regimen_tributario = models.CharField(
        max_length=30,
        choices=REGIMEN_TRIBUTARIO_CHOICES,
        default='COMUN',
        verbose_name='Régimen Tributario'
    )

    # ==========================================================================
    # DATOS DE CONTACTO OFICIAL
    # ==========================================================================
    direccion_fiscal = models.TextField(
        blank=True,
        default='',
        verbose_name='Dirección Fiscal'
    )
    ciudad = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Ciudad'
    )
    departamento = models.CharField(
        max_length=50,
        choices=DEPARTAMENTOS_COLOMBIA,
        blank=True,
        default='',
        verbose_name='Departamento'
    )
    pais = models.CharField(
        max_length=100,
        default='Colombia',
        verbose_name='País'
    )
    codigo_postal = models.CharField(
        max_length=10,
        blank=True,
        default='',
        verbose_name='Código Postal'
    )
    telefono_principal = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Teléfono Principal'
    )
    telefono_secundario = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Teléfono Secundario'
    )
    email_corporativo = models.EmailField(
        blank=True,
        default='',
        verbose_name='Email Corporativo'
    )
    sitio_web = models.URLField(
        blank=True,
        default='',
        verbose_name='Sitio Web'
    )

    # ==========================================================================
    # DATOS DE REGISTRO MERCANTIL
    # ==========================================================================
    matricula_mercantil = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name='Matrícula Mercantil'
    )
    camara_comercio = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Cámara de Comercio'
    )
    fecha_constitucion = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Constitución'
    )
    fecha_inscripcion_registro = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Inscripción en Registro'
    )

    # ==========================================================================
    # CONFIGURACIÓN REGIONAL
    # ==========================================================================
    zona_horaria = models.CharField(
        max_length=50,
        choices=TIMEZONE_CHOICES,
        default='America/Bogota',
        verbose_name='Zona Horaria'
    )
    formato_fecha = models.CharField(
        max_length=20,
        choices=FORMATO_FECHA_CHOICES,
        default='DD/MM/YYYY',
        verbose_name='Formato de Fecha'
    )
    moneda = models.CharField(
        max_length=3,
        choices=MONEDA_CHOICES,
        default='COP',
        verbose_name='Moneda'
    )
    simbolo_moneda = models.CharField(
        max_length=5,
        default='$',
        verbose_name='Símbolo de Moneda'
    )
    separador_miles = models.CharField(
        max_length=1,
        default='.',
        verbose_name='Separador de Miles'
    )
    separador_decimales = models.CharField(
        max_length=1,
        default=',',
        verbose_name='Separador de Decimales'
    )

    # ==========================================================================
    # BRANDING - IDENTIDAD VISUAL (migrado de BrandingConfig)
    # ==========================================================================
    company_slogan = models.CharField(
        max_length=200,
        blank=True,
        default='',
        verbose_name='Slogan'
    )
    logo = models.ImageField(
        upload_to='tenants/branding/logos/',
        blank=True,
        null=True,
        verbose_name='Logo Principal'
    )
    logo_white = models.ImageField(
        upload_to='tenants/branding/logos/',
        blank=True,
        null=True,
        verbose_name='Logo Blanco (para fondos oscuros)'
    )
    logo_dark = models.ImageField(
        upload_to='tenants/branding/logos/',
        blank=True,
        null=True,
        verbose_name='Logo para Modo Oscuro'
    )
    favicon = models.ImageField(
        upload_to='tenants/branding/favicons/',
        blank=True,
        null=True,
        verbose_name='Favicon'
    )
    login_background = models.ImageField(
        upload_to='tenants/branding/backgrounds/',
        blank=True,
        null=True,
        verbose_name='Imagen de Fondo Login'
    )

    # COLORES
    primary_color = models.CharField(
        max_length=7,
        default='#ec268f',
        verbose_name='Color Primario',
        help_text='Color HEX (ej: #ec268f - Rosa StrateKaz)'
    )
    secondary_color = models.CharField(
        max_length=7,
        default='#000000',
        verbose_name='Color Secundario'
    )
    accent_color = models.CharField(
        max_length=7,
        default='#f4ec25',
        verbose_name='Color de Acento'
    )
    sidebar_color = models.CharField(
        max_length=7,
        default='#1E293B',
        verbose_name='Color del Sidebar'
    )
    background_color = models.CharField(
        max_length=7,
        default='#F5F5F5',
        verbose_name='Color de Fondo'
    )
    showcase_background = models.CharField(
        max_length=7,
        default='#1F2937',
        verbose_name='Color Fondo Presentaciones'
    )

    # GRADIENTES PARA PRESENTACIONES
    gradient_mission = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Gradiente Misión'
    )
    gradient_vision = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Gradiente Visión'
    )
    gradient_policy = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Gradiente Política'
    )
    gradient_values = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Gradientes Valores'
    )

    # PWA (Progressive Web App)
    pwa_name = models.CharField(
        max_length=200,
        blank=True,
        default='',
        verbose_name='Nombre PWA'
    )
    pwa_short_name = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name='Nombre Corto PWA'
    )
    pwa_description = models.TextField(
        blank=True,
        default='',
        verbose_name='Descripción PWA'
    )
    pwa_theme_color = models.CharField(
        max_length=7,
        blank=True,
        default='',
        verbose_name='Color de Tema PWA'
    )
    pwa_background_color = models.CharField(
        max_length=7,
        blank=True,
        default='#FFFFFF',
        verbose_name='Color de Fondo PWA'
    )
    pwa_icon_192 = models.ImageField(
        upload_to='tenants/branding/pwa/',
        blank=True,
        null=True,
        verbose_name='Icono PWA 192x192'
    )
    pwa_icon_512 = models.ImageField(
        upload_to='tenants/branding/pwa/',
        blank=True,
        null=True,
        verbose_name='Icono PWA 512x512'
    )
    pwa_icon_maskable = models.ImageField(
        upload_to='tenants/branding/pwa/',
        blank=True,
        null=True,
        verbose_name='Icono Maskable PWA'
    )

    # Campo legacy para compatibilidad (DEPRECATED)
    logo_url = models.URLField(
        blank=True,
        default='',
        verbose_name='URL del logo (DEPRECATED)',
        help_text='DEPRECATED: Usar campo "logo" en su lugar'
    )

    # ==========================================================================
    # NOTAS INTERNAS (solo visible para superadmins)
    # ==========================================================================
    notes = models.TextField(
        blank=True,
        default='',
        verbose_name='Notas internas',
        help_text='Notas internas sobre esta empresa (solo superadmins)'
    )

    # ==========================================================================
    # BACKUP (Configuracion)
    # ==========================================================================
    backup_enabled = models.BooleanField(
        default=True,
        verbose_name='Backups habilitados'
    )
    backup_retention_days = models.PositiveSmallIntegerField(
        default=30,
        verbose_name='Días de retención de backups'
    )

    # ==========================================================================
    # AUDITORÍA
    # ==========================================================================
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'TenantUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tenants'
    )

    # django-tenants config
    # IMPORTANTE: auto_create_schema = False para permitir creación asíncrona
    # La creación del schema se maneja via Celery task (apps.tenant.tasks)
    auto_create_schema = False
    auto_drop_schema = False  # Seguridad: no borrar schema automáticamente

    class Meta:
        db_table = 'tenant_tenant'
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # El schema_name se genera desde el code
        if not self.schema_name:
            self.schema_name = f"tenant_{self.code}"
        super().save(*args, **kwargs)

    # ==========================================================================
    # PROPIEDADES
    # ==========================================================================
    @property
    def effective_max_users(self) -> int:
        """Retorna el límite efectivo de usuarios."""
        if self.max_users > 0:
            return self.max_users
        if self.plan:
            return self.plan.max_users
        return 0  # ilimitado

    @property
    def effective_modules(self) -> list:
        """
        Retorna los módulos efectivos habilitados.

        Prioridad:
        1. enabled_modules explícito (aunque sea vacío = sin módulos)
        2. Plan.features como fallback (solo si enabled_modules es None)
        3. Lista vacía si nada está configurado
        """
        # enabled_modules configurado explícitamente (incluso [] = sin módulos)
        if self.enabled_modules is not None and isinstance(self.enabled_modules, list) and len(self.enabled_modules) > 0:
            return self.enabled_modules
        # Fallback al plan solo si enabled_modules no fue configurado
        if self.plan and self.plan.features:
            return self.plan.features
        return []

    @property
    def is_subscription_valid(self) -> bool:
        """Verifica si la suscripción está vigente."""
        if self.is_trial:
            if self.trial_ends_at:
                return timezone.now() < self.trial_ends_at
            return True  # Trial sin fecha límite
        if self.subscription_ends_at:
            return timezone.now() < self.subscription_ends_at
        return True  # Sin fecha de fin = válido

    @property
    def primary_domain(self) -> str:
        """Retorna el dominio principal del tenant."""
        domain = self.domains.filter(is_primary=True).first()
        return domain.domain if domain else ''

    @property
    def display_name(self) -> str:
        """Retorna el nombre a mostrar (comercial o legal)."""
        return self.nombre_comercial or self.name

    @property
    def logo_effective(self):
        """Retorna el logo efectivo (campo nuevo o URL legacy)."""
        if self.logo:
            return self.logo.url
        return self.logo_url or None

    def get_branding_dict(self) -> dict:
        """
        Retorna un diccionario con toda la configuración de branding.
        Útil para APIs públicas de branding por dominio.
        """
        return {
            'company_name': self.name,
            'company_short_name': self.nombre_comercial or self.name,
            'company_slogan': self.company_slogan,
            'logo': self.logo.url if self.logo else None,
            'logo_white': self.logo_white.url if self.logo_white else None,
            'logo_dark': self.logo_dark.url if self.logo_dark else None,
            'favicon': self.favicon.url if self.favicon else None,
            'login_background': self.login_background.url if self.login_background else None,
            'primary_color': self.primary_color,
            'secondary_color': self.secondary_color,
            'accent_color': self.accent_color,
            'sidebar_color': self.sidebar_color,
            'background_color': self.background_color,
            'showcase_background': self.showcase_background,
            'gradient_mission': self.gradient_mission,
            'gradient_vision': self.gradient_vision,
            'gradient_policy': self.gradient_policy,
            'gradient_values': self.gradient_values,
            'pwa_name': self.pwa_name or self.name,
            'pwa_short_name': self.pwa_short_name or self.nombre_comercial or self.name[:12],
            'pwa_description': self.pwa_description,
            'pwa_theme_color': self.pwa_theme_color or self.primary_color,
            'pwa_background_color': self.pwa_background_color,
            'pwa_icon_192': self.pwa_icon_192.url if self.pwa_icon_192 else None,
            'pwa_icon_512': self.pwa_icon_512.url if self.pwa_icon_512 else None,
            'pwa_icon_maskable': self.pwa_icon_maskable.url if self.pwa_icon_maskable else None,
        }


class Domain(DomainMixin):
    """
    Dominio asociado a un Tenant - Compatible con django-tenants.

    Hereda de DomainMixin que proporciona:
    - domain: Nombre del dominio
    - tenant: ForeignKey al Tenant
    - is_primary: Si es el dominio principal

    Vive en schema 'public'.
    """

    # Campos adicionales
    ssl_enabled = models.BooleanField(
        default=True,
        verbose_name='SSL habilitado'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tenant_domain'
        verbose_name = 'Dominio'
        verbose_name_plural = 'Dominios'

    def __str__(self):
        return self.domain


class TenantUser(models.Model):
    """
    Usuario global del sistema multi-tenant.

    Puede tener acceso a múltiples tenants.
    Vive en schema 'public'.
    """

    # Identificación
    email = models.EmailField(
        unique=True,
        db_index=True,
        verbose_name='Email'
    )
    password = models.CharField(
        max_length=128,
        verbose_name='Contraseña'
    )

    # Datos personales
    first_name = models.CharField(
        max_length=150,
        blank=True,
        default='',
        verbose_name='Nombre'
    )
    last_name = models.CharField(
        max_length=150,
        blank=True,
        default='',
        verbose_name='Apellido'
    )

    # Estado
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    is_superadmin = models.BooleanField(
        default=False,
        verbose_name='Super administrador',
        help_text='Acceso total a todos los tenants'
    )

    # Tracking
    last_login = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Último login'
    )
    last_tenant = models.ForeignKey(
        Tenant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='last_users',
        verbose_name='Último tenant',
        help_text='Último tenant accedido (para login rápido)'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # 2FA Mirror (sincronizado desde core.TwoFactorAuth)
    has_2fa_enabled = models.BooleanField(
        default=False,
        verbose_name='2FA habilitado',
        help_text='Mirror del estado 2FA del usuario (sincronizado al activar/desactivar)'
    )

    # Password Reset
    password_reset_token = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        verbose_name='Token de reset',
        help_text='Token temporal para restablecer contraseña'
    )
    password_reset_expires = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Expiracion del token',
        help_text='Fecha/hora de expiracion del token de reset'
    )

    # Relación M:N con tenants
    tenants = models.ManyToManyField(
        Tenant,
        through='TenantUserAccess',
        through_fields=('tenant_user', 'tenant'),
        related_name='tenant_users'
    )

    class Meta:
        db_table = 'tenant_user'
        verbose_name = 'Usuario Global'
        verbose_name_plural = 'Usuarios Globales'
        ordering = ['email']

    def __str__(self):
        return self.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or self.email

    # Propiedades requeridas por DRF para autenticación
    @property
    def is_authenticated(self) -> bool:
        """Always returns True for active users (required by DRF)."""
        return True

    @property
    def is_anonymous(self) -> bool:
        """Always returns False (required by DRF)."""
        return False

    def set_password(self, raw_password: str):
        """Establece la contraseña hasheada."""
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        """Verifica la contraseña."""
        return django_check_password(raw_password, self.password)

    # ------------------------------------------------------------------
    # Token hashing (seguridad: nunca almacenar tokens en texto plano)
    # ------------------------------------------------------------------

    @staticmethod
    def _hash_token(raw_token: str) -> str:
        """Genera SHA-256 hex digest de un token."""
        return hashlib.sha256(
            raw_token.encode('utf-8')
        ).hexdigest()

    def set_password_reset_token(self) -> str:
        """
        Genera token de reset, almacena su HASH SHA-256 en BD y
        retorna el token raw (para enviar por email).
        Expira en 1 hora.
        """
        raw_token = uuid.uuid4().hex
        self.password_reset_token = self._hash_token(raw_token)
        self.password_reset_expires = (
            timezone.now() + timedelta(hours=1)
        )
        return raw_token

    def verify_password_reset_token(self, raw_token: str) -> bool:
        """
        Verifica un token de reset comparando su hash con el
        almacenado, usando constant_time_compare contra timing.
        """
        if not self.password_reset_token or not raw_token:
            return False
        hashed_input = self._hash_token(raw_token)
        return constant_time_compare(
            hashed_input, self.password_reset_token
        )

    def get_accessible_tenants(self):
        """Retorna los tenants a los que tiene acceso activo."""
        if self.is_superadmin:
            return Tenant.objects.filter(is_active=True)
        return self.tenants.filter(
            is_active=True,
            tenantuseraccess__is_active=True
        )


class TenantUserAccess(models.Model):
    """
    Relación M:N entre TenantUser y Tenant.

    ARQUITECTURA SIMPLIFICADA (v2.0):
    ================================
    Este modelo SOLO define qué tenants puede acceder un TenantUser.
    Los permisos granulares se manejan DENTRO del tenant via:
    - User.is_superuser = True → Admin del tenant
    - User.cargo → Permisos RBAC granulares via CargoSectionAccess

    FLUJO:
    1. TenantUser (global) tiene acceso a ciertos tenants (este modelo)
    2. Al entrar al tenant, se usa/crea un User en el schema del tenant
    3. El User del tenant tiene cargo con permisos granulares

    El campo 'role' se mantiene por compatibilidad pero está DEPRECATED.
    Vive en schema 'public'.
    """

    # DEPRECATED: Se mantiene por compatibilidad con datos existentes
    # Los permisos reales se manejan via User.cargo en el schema del tenant
    ROLE_CHOICES = [
        ('admin', 'Administrador'),  # DEPRECATED
        ('user', 'Usuario'),         # DEPRECATED
        ('readonly', 'Solo lectura'), # DEPRECATED
    ]

    tenant_user = models.ForeignKey(
        TenantUser,
        on_delete=models.CASCADE,
        related_name='tenant_accesses'
    )
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='user_accesses'
    )

    # DEPRECATED: Campo mantenido por compatibilidad, NO SE USA para permisos
    # Los permisos se manejan via User.cargo dentro del tenant
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='user',
        verbose_name='Rol (DEPRECATED)',
        help_text='Campo deprecado. Usar cargo del User dentro del tenant.'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Acceso activo',
        help_text='Si False, el usuario no puede acceder a este tenant'
    )

    is_admin = models.BooleanField(
        default=False,
        verbose_name='Admin del tenant',
        help_text=(
            'Si True, el usuario obtiene is_superuser=True dentro del tenant '
            '(bypass total de RBAC). Se asigna desde Admin Global.'
        )
    )

    # Auditoría
    granted_at = models.DateTimeField(auto_now_add=True)
    granted_by = models.ForeignKey(
        TenantUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='granted_accesses'
    )

    class Meta:
        db_table = 'tenant_user_access'
        verbose_name = 'Acceso de Usuario'
        verbose_name_plural = 'Accesos de Usuarios'
        unique_together = ['tenant_user', 'tenant']

    def __str__(self):
        return f"{self.tenant_user.email} -> {self.tenant.name}"


# =============================================================================
# ONBOARDING (schema public)
# =============================================================================
from apps.tenant.models_onboarding import TenantOnboarding  # noqa: E402, F401
