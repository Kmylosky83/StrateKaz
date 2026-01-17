"""
Modelos de Roles y Grupos - Sistema RBAC StrateKaz

Role: Agrupa permisos por función
Group: Organiza usuarios por equipos
"""
from django.db import models
from django.utils import timezone


class Role(models.Model):
    """
    Rol del sistema - Agrupa permisos por función/responsabilidad

    Los roles representan funciones específicas que pueden ser asignadas
    a usuarios independientemente de su cargo. Un usuario puede tener
    múltiples roles.

    Ejemplos: 'aprobador_recolecciones', 'auditor_sst', 'gestor_precios'
    """

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del rol (ej: aprobador_recolecciones)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del rol'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción de las responsabilidades del rol'
    )
    permisos = models.ManyToManyField(
        'core.Permiso',
        through='RolePermiso',
        related_name='roles',
        verbose_name='Permisos'
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name='Es del sistema',
        help_text='Los roles del sistema no pueden ser eliminados desde la UI'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
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
        db_table = 'core_role'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def get_all_permissions(self):
        """Obtiene todos los permisos activos del rol"""
        return self.permisos.filter(is_active=True)


class RolePermiso(models.Model):
    """Relación Many-to-Many entre Role y Permiso"""

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='role_permisos'
    )
    permiso = models.ForeignKey(
        'core.Permiso',
        on_delete=models.CASCADE,
        related_name='role_permisos'
    )
    granted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    granted_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permisos_rol_otorgados'
    )

    class Meta:
        db_table = 'core_role_permiso'
        verbose_name = 'Rol-Permiso'
        verbose_name_plural = 'Roles-Permisos'
        unique_together = [['role', 'permiso']]
        ordering = ['role', 'permiso']

    def __str__(self):
        return f"{self.role.code} -> {self.permiso.code}"


# ==========================================================================
# SISTEMA DE GRUPOS DINÁMICO
# ==========================================================================


class GrupoTipo(models.Model):
    """
    Tipo/Categoría de grupo - 100% dinámico.

    Permite categorizar grupos por su naturaleza/propósito.
    Ejemplos: EQUIPO, COMITE, DEPARTAMENTO, PROYECTO, etc.
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo (ej: EQUIPO, COMITE)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo (ej: Equipo de Trabajo, Comité)'
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
    color = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Color',
        help_text='Color para identificación visual (hex o nombre)'
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
        db_table = 'core_grupo_tipo'
        verbose_name = 'Tipo de Grupo'
        verbose_name_plural = 'Tipos de Grupos'
        ordering = ['orden', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Group(models.Model):
    """
    Grupo del sistema - 100% dinámico.

    Los grupos permiten organizar usuarios por equipos de trabajo
    y asignar roles a nivel de grupo.

    Ejemplos: 'equipo_recolecciones', 'equipo_comercial', 'comite_sst'
    """

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del grupo (ej: equipo_recolecciones)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del grupo'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción del grupo y su propósito'
    )
    # FK dinámica al tipo de grupo
    tipo = models.ForeignKey(
        GrupoTipo,
        on_delete=models.PROTECT,
        related_name='grupos',
        null=True,
        blank=True,
        verbose_name='Tipo de Grupo',
        help_text='Categoría del grupo (Equipo, Comité, etc.)'
    )
    roles = models.ManyToManyField(
        Role,
        through='GroupRole',
        related_name='groups',
        verbose_name='Roles',
        blank=True
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
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
        db_table = 'core_group'
        verbose_name = 'Grupo'
        verbose_name_plural = 'Grupos'
        ordering = ['name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def get_all_permissions(self):
        """Obtiene todos los permisos del grupo a través de sus roles"""
        from apps.core.models import Permiso
        from django.db.models import Q
        return Permiso.objects.filter(
            Q(roles__groups=self) & Q(is_active=True)
        ).distinct()


class GroupRole(models.Model):
    """Relación Many-to-Many entre Group y Role"""

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='group_roles'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='group_roles'
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    assigned_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_grupo_asignados'
    )

    class Meta:
        db_table = 'core_group_role'
        verbose_name = 'Grupo-Rol'
        verbose_name_plural = 'Grupos-Roles'
        unique_together = [['group', 'role']]
        ordering = ['group', 'role']

    def __str__(self):
        return f"{self.group.code} -> {self.role.code}"


class UserRole(models.Model):
    """
    Relación Many-to-Many entre User y Role

    Permite asignar roles directamente a usuarios,
    independientemente de su cargo o grupo.
    """

    user = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='user_roles'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='user_roles'
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    assigned_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_asignados'
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de expiración',
        help_text='Fecha en que el rol expira automáticamente'
    )

    class Meta:
        db_table = 'core_user_role'
        verbose_name = 'Usuario-Rol'
        verbose_name_plural = 'Usuarios-Roles'
        unique_together = [['user', 'role']]
        ordering = ['user', 'role']
        indexes = [
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.user.username} -> {self.role.code}"

    @property
    def is_expired(self):
        """Verifica si el rol ha expirado"""
        if self.expires_at is None:
            return False
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        """Verifica si el rol es válido (activo y no expirado)"""
        return self.role.is_active and not self.is_expired


class UserGroup(models.Model):
    """
    Relación Many-to-Many entre User y Group

    Permite asignar usuarios a grupos de trabajo.
    """

    user = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='user_groups'
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='user_groups'
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    assigned_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='grupos_asignados'
    )
    is_leader = models.BooleanField(
        default=False,
        verbose_name='Es líder',
        help_text='Indica si el usuario es líder del grupo'
    )

    class Meta:
        db_table = 'core_user_group'
        verbose_name = 'Usuario-Grupo'
        verbose_name_plural = 'Usuarios-Grupos'
        unique_together = [['user', 'group']]
        ordering = ['user', 'group']

    def __str__(self):
        leader = " (Líder)" if self.is_leader else ""
        return f"{self.user.username} -> {self.group.code}{leader}"


class CargoRole(models.Model):
    """Relación Many-to-Many entre Cargo y Role (roles por defecto del cargo)"""

    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.CASCADE,
        related_name='cargo_roles'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='cargo_roles'
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )

    class Meta:
        db_table = 'core_cargo_role'
        verbose_name = 'Cargo-Rol por defecto'
        verbose_name_plural = 'Cargos-Roles por defecto'
        unique_together = [['cargo', 'role']]
        ordering = ['cargo', 'role']

    def __str__(self):
        return f"{self.cargo.code} -> {self.role.code}"
