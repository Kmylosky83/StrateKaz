"""
Modelos de Configuracion del Sistema - StrateKaz

SystemModule: Marketplace de modulos On/Off
ModuleTab: Tabs dentro de modulos
TabSection: Secciones dentro de tabs
BrandingConfig: Logo, colores, favicon
"""
from django.db import models
from django.core.exceptions import ValidationError


class SystemModule(models.Model):
    """
    Modulo del Sistema - Marketplace de modulos On/Off

    Permite activar/desactivar modulos del sistema dinamicamente.
    """

    CATEGORY_CHOICES = [
        ('ESTRATEGICO', 'Nivel Estrategico'),
        ('MOTOR', 'Motores del Sistema'),
        ('INTEGRAL', 'Gestion Integral'),
        ('MISIONAL', 'Nivel Misional'),
        ('APOYO', 'Nivel de Apoyo'),
        ('INTELIGENCIA', 'Inteligencia de Negocio'),
    ]

    COLOR_CHOICES = [
        ('purple', 'Purpura'),
        ('blue', 'Azul'),
        ('green', 'Verde'),
        ('orange', 'Naranja'),
        ('red', 'Rojo'),
        ('gray', 'Gris'),
        ('yellow', 'Amarillo'),
        ('pink', 'Rosa'),
        ('indigo', 'Indigo'),
        ('teal', 'Verde azulado'),
    ]

    # Mapeo de colores por categoria (Design System)
    CATEGORY_DEFAULT_COLORS = {
        'ESTRATEGICO': 'purple',
        'MOTOR': 'teal',
        'INTEGRAL': 'orange',
        'MISIONAL': 'blue',
        'APOYO': 'green',
        'INTELIGENCIA': 'purple',
    }

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Codigo',
        help_text='Codigo unico del modulo (ej: apps.supply_chain)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del modulo'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripcion',
        help_text='Descripcion de las funcionalidades del modulo'
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        db_index=True,
        verbose_name='Categoria'
    )
    color = models.CharField(
        max_length=20,
        choices=COLOR_CHOICES,
        blank=True,
        null=True,
        verbose_name='Color',
        help_text='Color del modulo (para visualizacion en UI)'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono de Lucide'
    )
    route = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Ruta Frontend',
        help_text='Ruta del frontend para este modulo (ej: /hseq). Si es null, se genera de code.'
    )
    is_core = models.BooleanField(
        default=False,
        verbose_name='Es modulo core',
        help_text='Los modulos core no pueden desactivarse'
    )
    is_enabled = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Habilitado',
        help_text='Si el modulo esta activo en el sistema'
    )
    requires_license = models.BooleanField(
        default=False,
        verbose_name='Requiere licencia',
        help_text='Si el modulo requiere licencia adicional'
    )
    license_expires_at = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de expiracion de licencia'
    )
    dependencies = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='dependents',
        verbose_name='Dependencias',
        help_text='Modulos que deben estar activos para que este funcione'
    )
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creacion'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualizacion'
    )

    class Meta:
        db_table = 'core_system_module'
        verbose_name = 'Modulo del Sistema'
        verbose_name_plural = 'Modulos del Sistema'
        ordering = ['category', 'orden', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"

    def can_disable(self):
        """Verifica si el modulo puede ser desactivado"""
        if self.is_core:
            return False, "Este es un modulo core y no puede desactivarse"

        # Verificar si hay modulos que dependen de este
        dependents = self.dependents.filter(is_enabled=True)
        if dependents.exists():
            names = ", ".join(dependents.values_list('name', flat=True))
            return False, f"Los siguientes modulos dependen de este: {names}"

        return True, None

    def enable(self):
        """Activa el modulo y sus dependencias"""
        # Activar dependencias primero
        for dep in self.dependencies.all():
            if not dep.is_enabled:
                dep.is_enabled = True
                dep.save(update_fields=['is_enabled'])
        self.is_enabled = True
        self.save(update_fields=['is_enabled'])

    def disable(self):
        """Desactiva el modulo si es posible"""
        can_disable, reason = self.can_disable()
        if not can_disable:
            raise ValidationError(reason)
        self.is_enabled = False
        self.save(update_fields=['is_enabled'])

    def get_enabled_tabs(self):
        """Obtiene todos los tabs habilitados del modulo"""
        return self.tabs.filter(is_enabled=True).order_by('orden', 'name')

    def get_tab_count(self):
        """Cuenta el total de tabs del modulo"""
        return self.tabs.count()

    def get_enabled_tab_count(self):
        """Cuenta los tabs habilitados del modulo"""
        return self.tabs.filter(is_enabled=True).count()

    def get_effective_color(self):
        """
        Obtiene el color efectivo del modulo.
        Si tiene color asignado lo usa, sino usa el color de la categoria.
        """
        if self.color:
            return self.color
        return self.CATEGORY_DEFAULT_COLORS.get(self.category, 'gray')


class ModuleTab(models.Model):
    """
    Tab dentro de un modulo del sistema

    Permite organizar funcionalidades de un modulo en pestanas (tabs).
    Ejemplo: En el modulo 'Direccion Estrategica' puede haber tabs como
    'Identidad Corporativa', 'Plan Estrategico', 'Indicadores', etc.
    """

    module = models.ForeignKey(
        SystemModule,
        on_delete=models.CASCADE,
        related_name='tabs',
        verbose_name='Modulo'
    )
    code = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Codigo',
        help_text='Codigo unico del tab (ej: identidad, plan_estrategico)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre visible del tab (ej: Identidad Corporativa)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripcion',
        help_text='Descripcion de las funcionalidades del tab'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono de Lucide (ej: Building2, Target, BarChart)'
    )
    route = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Ruta Frontend',
        help_text='Ruta relativa del tab (ej: sistema-documental). Si es null, se genera de code.'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de aparicion del tab'
    )
    is_enabled = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Habilitado',
        help_text='Si el tab esta activo en el sistema'
    )
    is_core = models.BooleanField(
        default=False,
        verbose_name='Es tab core',
        help_text='Los tabs core no pueden desactivarse'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creacion'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualizacion'
    )

    class Meta:
        db_table = 'core_module_tab'
        verbose_name = 'Tab de Modulo'
        verbose_name_plural = 'Tabs de Modulos'
        ordering = ['module', 'orden', 'name']
        unique_together = [['module', 'code']]
        indexes = [
            models.Index(fields=['module', 'is_enabled']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.module.name} > {self.name}"

    def can_disable(self):
        """Verifica si el tab puede ser desactivado"""
        if self.is_core:
            return False, "Este es un tab core y no puede desactivarse"
        return True, None

    def disable(self):
        """Desactiva el tab si es posible"""
        can_disable, reason = self.can_disable()
        if not can_disable:
            raise ValidationError(reason)
        self.is_enabled = False
        self.save(update_fields=['is_enabled'])

    def enable(self):
        """Activa el tab"""
        self.is_enabled = True
        self.save(update_fields=['is_enabled'])

    def get_enabled_sections(self):
        """Obtiene todas las secciones habilitadas del tab"""
        return self.sections.filter(is_enabled=True).order_by('orden', 'name')

    def get_section_count(self):
        """Cuenta el total de secciones del tab"""
        return self.sections.count()

    def get_enabled_section_count(self):
        """Cuenta las secciones habilitadas del tab"""
        return self.sections.filter(is_enabled=True).count()


class TabSection(models.Model):
    """
    Seccion/SubNavigation dentro de un Tab

    Permite organizar contenido dentro de un tab mediante secciones.
    Ejemplo: En el tab 'Identidad Corporativa' puede haber secciones como
    'Mision y Vision', 'Valores', 'Politica Integral', etc.
    """

    tab = models.ForeignKey(
        ModuleTab,
        on_delete=models.CASCADE,
        related_name='sections',
        verbose_name='Tab'
    )
    code = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Codigo',
        help_text='Codigo unico de la seccion (ej: mision_vision, valores)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre visible de la seccion (ej: Mision y Vision)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripcion',
        help_text='Descripcion del contenido de la seccion'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono de Lucide (ej: Eye, Heart, FileText)'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de aparicion de la seccion'
    )
    is_enabled = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Habilitado',
        help_text='Si la seccion esta activa en el sistema'
    )
    is_core = models.BooleanField(
        default=False,
        verbose_name='Es seccion core',
        help_text='Las secciones core no pueden desactivarse'
    )
    supported_actions = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Acciones soportadas',
        help_text='Lista de codigos de acciones extra soportadas (ej: ["enviar", "aprobar"])'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creacion'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualizacion'
    )

    class Meta:
        db_table = 'core_tab_section'
        verbose_name = 'Seccion de Tab'
        verbose_name_plural = 'Secciones de Tabs'
        ordering = ['tab', 'orden', 'name']
        unique_together = [['tab', 'code']]
        indexes = [
            models.Index(fields=['tab', 'is_enabled']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.tab.module.name} > {self.tab.name} > {self.name}"

    def can_disable(self):
        """Verifica si la seccion puede ser desactivada"""
        if self.is_core:
            return False, "Esta es una seccion core y no puede desactivarse"
        return True, None

    def disable(self):
        """Desactiva la seccion si es posible"""
        can_disable, reason = self.can_disable()
        if not can_disable:
            raise ValidationError(reason)
        self.is_enabled = False
        self.save(update_fields=['is_enabled'])

    def enable(self):
        """Activa la seccion"""
        self.is_enabled = True
        self.save(update_fields=['is_enabled'])

    @property
    def full_path(self):
        """Retorna la ruta completa de la seccion"""
        return f"{self.tab.module.code}.{self.tab.code}.{self.code}"


class BrandingConfig(models.Model):
    """
    Configuracion de Branding - Logo, Colores, Favicon

    Permite personalizar la apariencia del sistema.
    """

    company_name = models.CharField(
        max_length=200,
        default='StrateKaz',
        verbose_name='Nombre de la Empresa'
    )
    company_short_name = models.CharField(
        max_length=50,
        default='GRASHNORTE',
        verbose_name='Nombre Corto'
    )
    company_slogan = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Slogan'
    )
    logo = models.ImageField(
        upload_to='branding/logos/',
        blank=True,
        null=True,
        verbose_name='Logo Principal'
    )
    logo_white = models.ImageField(
        upload_to='branding/logos/',
        blank=True,
        null=True,
        verbose_name='Logo Blanco (para fondos oscuros)'
    )
    favicon = models.ImageField(
        upload_to='branding/favicons/',
        blank=True,
        null=True,
        verbose_name='Favicon'
    )
    primary_color = models.CharField(
        max_length=7,
        default='#16A34A',
        verbose_name='Color Primario',
        help_text='Color en formato HEX (ej: #16A34A)'
    )
    secondary_color = models.CharField(
        max_length=7,
        default='#059669',
        verbose_name='Color Secundario'
    )
    accent_color = models.CharField(
        max_length=7,
        default='#10B981',
        verbose_name='Color de Acento'
    )
    login_background = models.ImageField(
        upload_to='branding/backgrounds/',
        blank=True,
        null=True,
        verbose_name='Imagen de Fondo Login',
        help_text='Imagen de fondo para la pagina de login (recomendado: 1920x1080)'
    )
    app_version = models.CharField(
        max_length=20,
        default='1.0.0',
        verbose_name='Version de la Aplicacion',
        help_text='Version que se muestra en el login y footer'
    )

    # Campos PWA (Progressive Web App)
    pwa_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Nombre PWA',
        help_text='Nombre completo de la app para manifest.json'
    )
    pwa_short_name = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Nombre Corto PWA',
        help_text='Nombre corto para iconos de app (max 12 caracteres recomendado)'
    )
    pwa_description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripcion PWA',
        help_text='Descripcion de la aplicacion para manifest.json'
    )
    pwa_theme_color = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color de Tema PWA',
        help_text='Color de la barra de titulo del navegador (formato HEX)'
    )
    pwa_background_color = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color de Fondo PWA',
        help_text='Color de fondo del splash screen (formato HEX)'
    )
    pwa_icon_192 = models.ImageField(
        upload_to='branding/pwa/',
        blank=True,
        null=True,
        verbose_name='Icono PWA 192x192',
        help_text='Icono para manifest.json (192x192 px, PNG)'
    )
    pwa_icon_512 = models.ImageField(
        upload_to='branding/pwa/',
        blank=True,
        null=True,
        verbose_name='Icono PWA 512x512',
        help_text='Icono para manifest.json (512x512 px, PNG)'
    )
    pwa_icon_maskable = models.ImageField(
        upload_to='branding/pwa/',
        blank=True,
        null=True,
        verbose_name='Icono Maskable PWA',
        help_text='Icono maskable para Android (512x512 px, PNG con padding)'
    )

    # =========================================================================
    # COLORES ADICIONALES DE INTERFAZ (consolidados desde EmpresaConfig)
    # =========================================================================
    sidebar_color = models.CharField(
        max_length=7,
        default='#1E293B',
        verbose_name='Color del Sidebar',
        help_text='Color de fondo del sidebar en formato HEX'
    )
    background_color = models.CharField(
        max_length=7,
        default='#F5F5F5',
        verbose_name='Color de Fondo',
        help_text='Color de fondo general de la aplicacion'
    )
    showcase_background = models.CharField(
        max_length=7,
        default='#1F2937',
        verbose_name='Color Fondo Presentaciones',
        help_text='Color de fondo para secciones showcase/presentaciones'
    )

    # =========================================================================
    # GRADIENTES PARA PRESENTACIONES (consolidados desde EmpresaConfig)
    # =========================================================================
    gradient_mission = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Gradiente Mision',
        help_text='Clases Tailwind para gradiente de mision (ej: from-blue-500 to-purple-600)'
    )
    gradient_vision = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Gradiente Vision',
        help_text='Clases Tailwind para gradiente de vision'
    )
    gradient_policy = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Gradiente Politica',
        help_text='Clases Tailwind para gradiente de politica'
    )
    gradient_values = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Gradientes Valores',
        help_text='Lista de gradientes Tailwind para carrusel de valores corporativos'
    )

    # =========================================================================
    # LOGO ADICIONAL (consolidado desde EmpresaConfig)
    # =========================================================================
    logo_dark = models.ImageField(
        upload_to='branding/logos/',
        blank=True,
        null=True,
        verbose_name='Logo para Modo Oscuro',
        help_text='Version del logo optimizada para fondos claros (si difiere del principal)'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creacion'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualizacion'
    )

    class Meta:
        db_table = 'core_branding_config'
        verbose_name = 'Configuracion de Branding'
        verbose_name_plural = 'Configuraciones de Branding'

    def __str__(self):
        return f"Branding - {self.company_name}"

    def save(self, *args, **kwargs):
        if self.is_active:
            BrandingConfig.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)
