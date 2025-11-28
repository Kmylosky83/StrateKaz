"""
Modelos del módulo Core - Sistema de Gestión Grasas y Huesos del Norte
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class Cargo(models.Model):
    """
    Modelo de Cargo - Define roles y jerarquía organizacional

    Niveles jerárquicos:
    0 - Operativo (Recolector, Conductor)
    1 - Supervisión (Supervisor)
    2 - Coordinación (Coordinador)
    3 - Dirección (Administrador, Gerente)
    """

    LEVEL_CHOICES = [
        (0, 'Operativo'),
        (1, 'Supervisión'),
        (2, 'Coordinación'),
        (3, 'Dirección'),
    ]

    code = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del cargo (ej: RECOLECTOR, SUPERVISOR)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del cargo'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del cargo y responsabilidades'
    )
    level = models.IntegerField(
        choices=LEVEL_CHOICES,
        default=0,
        verbose_name='Nivel jerárquico',
        help_text='Nivel en la jerarquía organizacional (0=Operativo, 3=Dirección)'
    )
    parent_cargo = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subordinados',
        verbose_name='Cargo superior',
        help_text='Cargo al que reporta este cargo'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si el cargo está activo en el sistema'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'core_cargo'
        verbose_name = 'Cargo'
        verbose_name_plural = 'Cargos'
        ordering = ['level', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active', 'level']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def clean(self):
        """Validaciones personalizadas"""
        # Validar que el cargo padre tenga nivel superior
        if self.parent_cargo and self.parent_cargo.level <= self.level:
            raise ValidationError(
                'El cargo superior debe tener un nivel jerárquico mayor'
            )

    def get_subordinados_recursivos(self):
        """Obtiene todos los subordinados de forma recursiva"""
        subordinados = list(self.subordinados.all())
        for subordinado in list(subordinados):
            subordinados.extend(subordinado.get_subordinados_recursivos())
        return subordinados


class User(AbstractUser):
    """
    Modelo de Usuario personalizado
    Extiende AbstractUser de Django con campos adicionales
    """

    DOCUMENT_TYPE_CHOICES = [
        ('CC', 'Cédula de Ciudadanía'),
        ('CE', 'Cédula de Extranjería'),
        ('NIT', 'NIT'),
    ]

    # Campos adicionales
    cargo = models.ForeignKey(
        Cargo,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='usuarios',
        verbose_name='Cargo',
        help_text='Cargo del usuario en la organización'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Teléfono',
        help_text='Número de teléfono de contacto'
    )
    document_type = models.CharField(
        max_length=3,
        choices=DOCUMENT_TYPE_CHOICES,
        default='CC',
        verbose_name='Tipo de documento'
    )
    document_number = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Número de documento',
        help_text='Número de identificación único'
    )
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios_creados',
        verbose_name='Creado por',
        help_text='Usuario que creó este registro'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de eliminación',
        help_text='Fecha de eliminación lógica (soft delete)'
    )

    class Meta:
        db_table = 'core_user'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['document_number']),
            models.Index(fields=['cargo', 'is_active']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        if self.get_full_name():
            return f"{self.get_full_name()} ({self.username})"
        return self.username

    @property
    def cargo_code(self):
        """Retorna el código del cargo del usuario"""
        return self.cargo.code if self.cargo else None

    @property
    def cargo_level(self):
        """Retorna el nivel jerárquico del usuario"""
        return self.cargo.level if self.cargo else None

    @property
    def is_deleted(self):
        """Verifica si el usuario está eliminado lógicamente"""
        return self.deleted_at is not None

    def has_permission(self, permission_code):
        """
        Verifica si el usuario tiene un permiso específico

        Args:
            permission_code (str): Código del permiso a verificar

        Returns:
            bool: True si tiene el permiso, False en caso contrario
        """
        # Si es superusuario, tiene todos los permisos
        if self.is_superuser:
            return True

        # Si no está activo o está eliminado, no tiene permisos
        if not self.is_active or self.is_deleted:
            return False

        # Verificar permisos a través del cargo
        if self.cargo:
            return self.cargo.permisos.filter(
                code=permission_code,
                is_active=True
            ).exists()

        return False

    def has_cargo_level(self, min_level):
        """
        Verifica si el usuario tiene un nivel jerárquico mínimo

        Args:
            min_level (int): Nivel mínimo requerido (0-3)

        Returns:
            bool: True si cumple el nivel, False en caso contrario
        """
        if self.is_superuser:
            return True

        return self.cargo and self.cargo.level >= min_level

    def soft_delete(self):
        """
        Eliminación lógica del usuario
        Marca el usuario como eliminado sin borrarlo de la BD
        """
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def restore(self):
        """Restaura un usuario eliminado lógicamente"""
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active'
, 'updated_at'])

    def clean(self):
        """Validaciones personalizadas"""
        if ' ' in self.username:
            raise ValidationError(
                {'username': 'El nombre de usuario no puede contener espacios'}
            )
        if self.email and '@' not in self.email:
            raise ValidationError(
                {'email': 'Proporcione un email válido'}
            )


class Permiso(models.Model):
    """Modelo de Permisos del sistema"""

    MODULE_CHOICES = [
        ('CORE', 'Core - Usuarios y Configuración'),
        ('RECOLECCIONES', 'Recolecciones'),
        ('LOTES', 'Lotes'),
        ('LIQUIDACIONES', 'Liquidaciones'),
        ('PROVEEDORES', 'Proveedores'),
        ('ECOALIADOS', 'Ecoaliados'),
        ('PROGRAMACIONES', 'Programaciones'),
        ('UNIDADES', 'Unidades de Recolección'),
        ('CERTIFICADOS', 'Certificados'),
        ('REPORTES', 'Reportes'),
        ('DIRECCION_ESTRATEGICA', 'Dirección Estratégica'),
        ('TALENTO_HUMANO', 'Talento Humano'),
        ('GESTION_INTEGRAL', 'Gestión Integral'),
    ]

    ACTION_CHOICES = [
        ('VIEW', 'Ver'),
        ('CREATE', 'Crear'),
        ('EDIT', 'Editar'),
        ('DELETE', 'Eliminar'),
        ('APPROVE', 'Aprobar'),
        ('EXPORT', 'Exportar'),
        ('MANAGE', 'Administrar'),
    ]

    SCOPE_CHOICES = [
        ('OWN', 'Propios'),
        ('TEAM', 'Equipo'),
        ('ALL', 'Todos'),
    ]

    code = models.CharField(max_length=50, unique=True, db_index=True, verbose_name='Código')
    name = models.CharField(max_length=100, verbose_name='Nombre')
    description = models.TextField(blank=True, null=True, verbose_name='Descripción')
    module = models.CharField(max_length=30, choices=MODULE_CHOICES, db_index=True, verbose_name='Módulo')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, verbose_name='Acción')
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES, default='OWN', verbose_name='Alcance')
    is_active = models.BooleanField(default=True, db_index=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')

    class Meta:
        db_table = 'core_permiso'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['module', 'action', 'scope']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['module', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    @classmethod
    def get_permissions_by_module(cls, module):
        return cls.objects.filter(module=module, is_active=True)


class CargoPermiso(models.Model):
    """Relación Many-to-Many entre Cargo y Permiso"""

    cargo = models.ForeignKey(Cargo, on_delete=models.CASCADE, related_name='cargo_permisos')
    permiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, related_name='cargo_permisos')
    granted_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de asignación')
    granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='permisos_otorgados')

    class Meta:
        db_table = 'core_cargo_permiso'
        verbose_name = 'Cargo-Permiso'
        verbose_name_plural = 'Cargos-Permisos'
        unique_together = [['cargo', 'permiso']]
        ordering = ['cargo', 'permiso']

    def __str__(self):
        return f"{self.cargo.code} -> {self.permiso.code}"


Cargo.add_to_class(
    'permisos',
    models.ManyToManyField(
        Permiso,
        through=CargoPermiso,
        related_name='cargos',
        verbose_name='Permisos'
    )
)
