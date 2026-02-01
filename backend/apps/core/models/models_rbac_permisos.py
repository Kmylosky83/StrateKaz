"""
Modelos de Permisos - Sistema RBAC StrateKaz

Permisos 100% dinámicos: Módulos, Acciones, Alcances
"""
from django.db import models


# Forward reference to avoid circular imports
def get_user_model():
    from apps.core.models.models_user import User
    return User


class PermisoModulo(models.Model):
    """
    Módulo del sistema para agrupar permisos.

    100% dinámico - Se crean desde la UI/API.
    Ejemplos: CORE, RECOLECCIONES, SST, CALIDAD, etc.
    """
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del módulo (ej: CORE, SST, CALIDAD)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del módulo'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Clase de icono (ej: mdi-cog, fa-users)'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de aparición en listas'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_permiso_modulo'
        verbose_name = 'Módulo de Permisos'
        verbose_name_plural = 'Módulos de Permisos'
        ordering = ['orden', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class PermisoAccion(models.Model):
    """
    Tipo de acción que se puede realizar sobre un recurso.

    100% dinámico - Se crean desde la UI/API.
    Ejemplos: VIEW, CREATE, EDIT, DELETE, APPROVE, EXPORT, etc.
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la acción (ej: VIEW, CREATE, APPROVE)'
    )
    name = models.CharField(
        max_length=50,
        verbose_name='Nombre',
        help_text='Nombre descriptivo (ej: Ver, Crear, Aprobar)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_permiso_accion'
        verbose_name = 'Acción de Permiso'
        verbose_name_plural = 'Acciones de Permisos'
        ordering = ['orden', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class PermisoAlcance(models.Model):
    """
    Alcance/Scope del permiso - define sobre qué registros aplica.

    100% dinámico - Se crean desde la UI/API.
    Ejemplos: OWN (propios), TEAM (equipo), AREA (área), ALL (todos)
    """
    code = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del alcance (ej: OWN, TEAM, ALL)'
    )
    name = models.CharField(
        max_length=50,
        verbose_name='Nombre',
        help_text='Nombre descriptivo (ej: Propios, Equipo, Todos)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Explicación de qué registros incluye este alcance'
    )
    nivel = models.PositiveIntegerField(
        default=0,
        verbose_name='Nivel de acceso',
        help_text='0=más restrictivo, mayor=más permisivo'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_permiso_alcance'
        verbose_name = 'Alcance de Permiso'
        verbose_name_plural = 'Alcances de Permisos'
        ordering = ['nivel', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Permiso(models.Model):
    """
    Permiso del sistema - 100% dinámico.

    Combina: Módulo + Acción + Alcance para definir un permiso específico.
    Ejemplo: RECOLECCIONES.VIEW.ALL = Ver todas las recolecciones

    Los permisos se crean/modifican desde la UI/API, no en código.
    """
    code = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del permiso (ej: recolecciones.view.all)'
    )
    name = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del permiso'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )

    # FKs dinámicas en lugar de CHOICES hardcodeados
    modulo = models.ForeignKey(
        PermisoModulo,
        on_delete=models.PROTECT,
        related_name='permisos',
        null=True,  # Temporal: permitir null para migración
        blank=True,
        verbose_name='Módulo',
        help_text='Módulo al que pertenece este permiso'
    )
    accion = models.ForeignKey(
        PermisoAccion,
        on_delete=models.PROTECT,
        related_name='permisos',
        null=True,  # Temporal: permitir null para migración
        blank=True,
        verbose_name='Acción',
        help_text='Tipo de acción que permite este permiso'
    )
    alcance = models.ForeignKey(
        PermisoAlcance,
        on_delete=models.PROTECT,
        related_name='permisos',
        null=True,  # Temporal: permitir null para migración
        blank=True,
        verbose_name='Alcance',
        help_text='Sobre qué registros aplica este permiso'
    )

    # Campos adicionales
    recurso = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Recurso específico',
        help_text='Recurso específico si aplica (ej: voucher, certificado)'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')

    class Meta:
        db_table = 'core_permiso'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['modulo__orden', 'accion__orden', 'alcance__nivel']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['modulo', 'is_active']),
            models.Index(fields=['modulo', 'accion']),
        ]
        # Un módulo+acción+alcance+recurso es único
        unique_together = [['modulo', 'accion', 'alcance', 'recurso']]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def save(self, *args, **kwargs):
        # Auto-generar código si no se proporciona
        if not self.code:
            recurso_part = f".{self.recurso}" if self.recurso else ""
            self.code = f"{self.modulo.code.lower()}.{self.accion.code.lower()}.{self.alcance.code.lower()}{recurso_part}"
        super().save(*args, **kwargs)

    @classmethod
    def get_permissions_by_module(cls, modulo_code):
        """Obtiene permisos activos de un módulo por su código"""
        return cls.objects.filter(modulo__code=modulo_code, is_active=True)

    @classmethod
    def get_permissions_by_action(cls, accion_code):
        """Obtiene permisos activos de una acción por su código"""
        return cls.objects.filter(accion__code=accion_code, is_active=True)


class CargoPermiso(models.Model):
    """Relación Many-to-Many entre Cargo y Permiso"""

    cargo = models.ForeignKey('core.Cargo', on_delete=models.CASCADE, related_name='cargo_permisos')
    permiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, related_name='cargo_permisos')
    granted_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de asignación')
    granted_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='permisos_otorgados')

    class Meta:
        db_table = 'core_cargo_permiso'
        verbose_name = 'Cargo-Permiso'
        verbose_name_plural = 'Cargos-Permisos'
        unique_together = [['cargo', 'permiso']]
        ordering = ['cargo', 'permiso']

    def __str__(self):
        return f"{self.cargo.code} -> {self.permiso.code}"
