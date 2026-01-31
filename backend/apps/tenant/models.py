"""
Modelos Multi-Tenant - StrateKaz

Estos modelos viven en la BD Master (stratekaz_master) y gestionan:
- Plan: Planes de suscripción con límites y features
- Tenant: Registro de cada empresa/cliente con su BD
- TenantUser: Usuarios que pueden acceder a múltiples tenants
- TenantUserAccess: Relación M:N entre usuarios y tenants
"""
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password as django_check_password


class Plan(models.Model):
    """
    Plan de suscripción para tenants.

    Define límites y características disponibles por nivel de plan.
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
        null=True,
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
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    is_default = models.BooleanField(
        default=False,
        verbose_name='Plan por defecto',
        help_text='Plan asignado a nuevos tenants'
    )

    # Orden de display
    order = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='Orden'
    )

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
        # Solo un plan puede ser default
        if self.is_default:
            Plan.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class Tenant(models.Model):
    """
    Tenant (Empresa cliente).

    Cada tenant tiene su propia base de datos.
    Este modelo vive en la BD Master y registra:
    - Datos básicos de identificación
    - Subdominio de acceso
    - Nombre de la BD del tenant
    - Estado y configuración
    """

    # Validador para subdominio (solo letras, números y guiones)
    subdominio_validator = RegexValidator(
        regex=r'^[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?$',
        message='El subdominio solo puede contener letras minúsculas, números y guiones. '
                'No puede empezar ni terminar con guión.'
    )

    # ==========================================================================
    # IDENTIFICACIÓN
    # ==========================================================================
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código interno único (ej: constructora-abc)'
    )
    name = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre de la empresa'
    )
    nit = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='NIT',
        help_text='Número de Identificación Tributaria'
    )

    # ==========================================================================
    # ACCESO (Subdominio)
    # ==========================================================================
    subdomain = models.CharField(
        max_length=63,
        unique=True,
        db_index=True,
        validators=[subdominio_validator],
        verbose_name='Subdominio',
        help_text='Subdominio de acceso (ej: constructora-abc → constructora-abc.stratekaz.com)'
    )
    custom_domain = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        verbose_name='Dominio personalizado',
        help_text='Dominio propio del cliente (ej: erp.constructora.com)'
    )

    # ==========================================================================
    # BASE DE DATOS
    # ==========================================================================
    db_name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nombre BD',
        help_text='Nombre de la base de datos del tenant'
    )
    db_host = models.CharField(
        max_length=255,
        default='localhost',
        verbose_name='Host BD',
        help_text='Host del servidor de BD (localhost o IP)'
    )
    db_port = models.CharField(
        max_length=10,
        default='3306',
        verbose_name='Puerto BD'
    )

    # ==========================================================================
    # PLAN Y LÍMITES (Plan es opcional)
    # ==========================================================================
    plan = models.ForeignKey(
        Plan,
        on_delete=models.SET_NULL,
        related_name='tenants',
        verbose_name='Plan',
        blank=True,
        null=True,
        help_text='Opcional. Si no se asigna, usar límites directos.'
    )

    # Límites directos (usados si no hay plan o para override)
    max_users = models.PositiveIntegerField(
        default=0,
        verbose_name='Máximo usuarios',
        help_text='0 = ilimitado. Si hay plan, este valor sobrescribe el del plan.'
    )
    max_storage_gb = models.PositiveIntegerField(
        default=0,
        verbose_name='Almacenamiento máximo (GB)',
        help_text='0 = ilimitado'
    )

    # Configuración de tamaño sugerido
    TIER_CHOICES = [
        ('starter', 'Starter (hasta 10 usuarios)'),
        ('small', 'Pequeña (hasta 50 usuarios)'),
        ('medium', 'Mediana (hasta 100 usuarios)'),
        ('large', 'Grande (hasta 500 usuarios)'),
        ('enterprise', 'Enterprise (ilimitado)'),
    ]
    tier = models.CharField(
        max_length=20,
        choices=TIER_CHOICES,
        default='small',
        verbose_name='Tamaño de empresa',
        help_text='Clasificación sugerida según número de usuarios'
    )

    # Módulos habilitados (si no hay plan)
    enabled_modules = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Módulos habilitados',
        help_text='Lista de módulos: ["core", "sst", "pesv", "iso", "analytics"]'
    )

    # ==========================================================================
    # ESTADO
    # ==========================================================================
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si está desactivado, no se permite acceso'
    )
    is_trial = models.BooleanField(
        default=False,
        verbose_name='Periodo de prueba'
    )
    trial_ends_at = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fin de prueba'
    )
    subscription_ends_at = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fin de suscripción',
        help_text='Fecha de vencimiento de la suscripción'
    )

    # ==========================================================================
    # BRANDING MÍNIMO (para login antes de conectar BD cliente)
    # ==========================================================================
    logo_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL del logo',
        help_text='URL pública del logo para mostrar en login'
    )
    primary_color = models.CharField(
        max_length=7,
        default='#1E40AF',
        verbose_name='Color primario',
        help_text='Color HEX para personalizar login'
    )

    # ==========================================================================
    # BACKUP CONFIGURATION
    # ==========================================================================
    backup_enabled = models.BooleanField(
        default=True,
        verbose_name='Backups habilitados'
    )
    backup_retention_days = models.PositiveSmallIntegerField(
        default=30,
        verbose_name='Retención de backups (días)'
    )

    # ==========================================================================
    # AUDITORÍA
    # ==========================================================================
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Creado por'
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas internas'
    )

    class Meta:
        db_table = 'tenant_tenant'
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
        ordering = ['name']
        indexes = [
            models.Index(fields=['subdomain', 'is_active']),
            models.Index(fields=['custom_domain']),
            models.Index(fields=['is_active', '-created_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.subdomain})"

    def save(self, *args, **kwargs):
        # Auto-generar db_name si no existe
        if not self.db_name:
            # Sanitizar code para nombre de BD
            safe_code = self.code.replace('-', '_').lower()
            self.db_name = f"stratekaz_{safe_code}"
        super().save(*args, **kwargs)

    @property
    def effective_max_users(self):
        """Retorna el límite efectivo de usuarios (directo o del plan)"""
        # Primero usar límite directo si está configurado
        if self.max_users > 0:
            return self.max_users
        # Si hay plan, usar límite del plan
        if self.plan and self.plan.max_users > 0:
            return self.plan.max_users
        # 0 = ilimitado
        return 0

    @property
    def effective_modules(self):
        """Retorna los módulos habilitados (directos o del plan)"""
        if self.enabled_modules:
            return self.enabled_modules
        if self.plan and self.plan.features:
            return self.plan.features
        return ['core']  # Mínimo: módulo core

    @property
    def is_subscription_valid(self):
        """Verifica si la suscripción está vigente"""
        if not self.is_active:
            return False
        if self.subscription_ends_at and self.subscription_ends_at < timezone.now().date():
            return False
        if self.is_trial and self.trial_ends_at and self.trial_ends_at < timezone.now().date():
            return False
        return True

    @property
    def full_domain(self):
        """Retorna el dominio completo de acceso"""
        if self.custom_domain:
            return self.custom_domain
        return f"{self.subdomain}.stratekaz.com"

    def get_database_config(self):
        """Retorna la configuración de conexión a la BD del tenant"""
        from django.conf import settings

        default_db = settings.DATABASES['default']
        return {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': self.db_name,
            'USER': default_db['USER'],
            'PASSWORD': default_db['PASSWORD'],
            'HOST': self.db_host,
            'PORT': self.db_port,
            'OPTIONS': default_db.get('OPTIONS', {}),
            'TIME_ZONE': default_db.get('TIME_ZONE'),
            'CONN_MAX_AGE': default_db.get('CONN_MAX_AGE', 0),
            'CONN_HEALTH_CHECKS': default_db.get('CONN_HEALTH_CHECKS', False),
            'AUTOCOMMIT': default_db.get('AUTOCOMMIT', True),
            'ATOMIC_REQUESTS': default_db.get('ATOMIC_REQUESTS', False),
        }


class TenantUser(models.Model):
    """
    Usuario global del sistema multi-tenant.

    Este usuario puede tener acceso a múltiples tenants.
    La autenticación se hace contra la BD Master.
    """

    # Identificación (único global)
    email = models.EmailField(
        unique=True,
        db_index=True,
        verbose_name='Email'
    )
    password = models.CharField(
        max_length=255,
        verbose_name='Password hash'
    )

    # Datos básicos
    first_name = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    last_name = models.CharField(
        max_length=100,
        verbose_name='Apellido'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Teléfono'
    )

    # Estado
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    is_superadmin = models.BooleanField(
        default=False,
        verbose_name='Super Admin',
        help_text='Acceso total a todos los tenants y configuración global'
    )

    # Acceso
    last_login = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Último acceso'
    )
    last_tenant = models.ForeignKey(
        Tenant,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='last_users',
        verbose_name='Último tenant',
        help_text='Último tenant al que accedió (para login rápido)'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Tenants a los que tiene acceso (M:N)
    tenants = models.ManyToManyField(
        Tenant,
        through='TenantUserAccess',
        related_name='global_users',
        verbose_name='Tenants'
    )

    class Meta:
        db_table = 'tenant_user'
        verbose_name = 'Usuario Global'
        verbose_name_plural = 'Usuarios Globales'
        ordering = ['email']

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_accessible_tenants(self):
        """Retorna lista de tenants activos a los que tiene acceso"""
        if self.is_superadmin:
            return Tenant.objects.filter(is_active=True)
        return self.tenants.filter(
            is_active=True,
            tenantuseraccess__is_active=True
        )

    def set_password(self, raw_password):
        """Hashea y guarda el password"""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Verifica si el password es correcto"""
        return django_check_password(raw_password, self.password)


class TenantUserAccess(models.Model):
    """
    Relación M:N entre TenantUser y Tenant.

    Define el acceso de un usuario global a un tenant específico,
    incluyendo el rol que tiene en ese tenant.
    """

    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('user', 'Usuario'),
        ('readonly', 'Solo lectura'),
    ]

    tenant_user = models.ForeignKey(
        TenantUser,
        on_delete=models.CASCADE,
        related_name='accesses',
        verbose_name='Usuario'
    )
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='user_accesses',
        verbose_name='Tenant'
    )

    # Rol en este tenant
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='user',
        verbose_name='Rol'
    )

    # Estado
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    granted_by = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Otorgado por'
    )

    class Meta:
        db_table = 'tenant_user_access'
        verbose_name = 'Acceso de Usuario'
        verbose_name_plural = 'Accesos de Usuarios'
        unique_together = ['tenant_user', 'tenant']
        ordering = ['tenant__name']

    def __str__(self):
        return f"{self.tenant_user.email} → {self.tenant.name} ({self.role})"


class TenantDomain(models.Model):
    """
    Dominios adicionales para un tenant.

    Permite que un tenant tenga múltiples dominios de acceso
    además del subdominio principal y dominio personalizado.
    """

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='additional_domains',
        verbose_name='Tenant'
    )
    domain = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        verbose_name='Dominio'
    )
    is_primary = models.BooleanField(
        default=False,
        verbose_name='Es primario'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    ssl_enabled = models.BooleanField(
        default=True,
        verbose_name='SSL habilitado'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tenant_domain'
        verbose_name = 'Dominio'
        verbose_name_plural = 'Dominios'
        ordering = ['-is_primary', 'domain']

    def __str__(self):
        return f"{self.domain} → {self.tenant.name}"
