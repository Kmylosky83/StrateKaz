"""
Modelos de Configuracion del Sistema - StrateKaz

SystemModule: Marketplace de modulos On/Off
ModuleTab: Tabs dentro de modulos
TabSection: Secciones dentro de tabs

NOTA: BrandingConfig fue ELIMINADO - el branding se maneja ahora
directamente en el modelo Tenant (apps.tenant.models.Tenant)
"""
from django.db import models
from django.core.exceptions import ValidationError


class SystemModule(models.Model):
    """
    Modulo del Sistema - Marketplace de modulos On/Off

    Permite activar/desactivar modulos del sistema dinamicamente.
    """

    CATEGORY_CHOICES = [
        ('STRATEGIC', 'Nivel Estratégico'),
        ('COMPLIANCE', 'Motores del Sistema'),
        ('INTEGRATED', 'Gestión Integral'),
        ('OPERATIONAL', 'Nivel Misional'),
        ('SUPPORT', 'Nivel de Apoyo'),
        ('INTELLIGENCE', 'Inteligencia de Negocio'),
        ('INFRASTRUCTURE', 'Infraestructura'),
        ('TRANSVERSAL', 'Transversal'),
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
        'STRATEGIC': 'purple',
        'COMPLIANCE': 'teal',
        'INTEGRATED': 'orange',
        'OPERATIONAL': 'blue',
        'SUPPORT': 'green',
        'INTELLIGENCE': 'purple',
        'INFRASTRUCTURE': 'gray',
        'TRANSVERSAL': 'teal',
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

    # Cadenas de dependencia implícitas (FKs directos entre módulos)
    # Estas dependencias NO están en M2M dependencies pero sí existen a nivel de BD
    IMPLICIT_DEPENDENCY_CHAIN = {
        'talent_hub': ['hseq_management'],  # Colaborador FK en medicina_laboral, accidentalidad
        'workflow_engine': [],  # firma_digital afecta identidad, pero solo es warning
    }

    # Módulos que requieren advertencia (no bloqueo) al desactivar
    DISABLE_WARNINGS = {
        'workflow_engine': 'Desactivar este módulo afectará las firmas digitales en políticas de Identidad Corporativa.',
    }

    def can_disable(self):
        """Verifica si el modulo puede ser desactivado"""
        if self.is_core:
            return False, "Este es un modulo core y no puede desactivarse"

        # Verificar si hay modulos que dependen de este (M2M explícito)
        dependents = self.dependents.filter(is_enabled=True)
        if dependents.exists():
            names = ", ".join(dependents.values_list('name', flat=True))
            return False, f"Los siguientes modulos dependen de este: {names}"

        # Verificar cadenas de dependencia implícitas (FKs directos)
        implicit_deps = self.IMPLICIT_DEPENDENCY_CHAIN.get(self.code, [])
        if implicit_deps:
            blocking_modules = SystemModule.objects.filter(
                code__in=implicit_deps,
                is_enabled=True,
            )
            if blocking_modules.exists():
                names = ", ".join(blocking_modules.values_list('name', flat=True))
                return False, (
                    f"No se puede desactivar '{self.name}' porque los siguientes "
                    f"módulos activos dependen de él: {names}"
                )

        return True, None

    def get_disable_warning(self):
        """Retorna advertencia al desactivar (no bloquea, solo informa)"""
        return self.DISABLE_WARNINGS.get(self.code, None)

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
