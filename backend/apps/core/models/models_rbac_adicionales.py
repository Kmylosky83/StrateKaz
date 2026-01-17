"""
Modelos de Roles Adicionales y Acceso a Secciones - Sistema RBAC Híbrido StrateKaz

RolAdicional: Roles especiales (COPASST, Brigadista, etc.)
UserRolAdicional: Asignación de roles adicionales a usuarios
CargoSectionAccess: Control de acceso a secciones por cargo
"""
from django.db import models
from django.utils import timezone


class RolAdicional(models.Model):
    """
    Rol Adicional - Sistema RBAC Híbrido para asignaciones especiales.

    Permite asignar roles específicos a usuarios independientemente de su cargo,
    cubriendo:
    - Roles legales obligatorios (COPASST, Vigía SST, Brigadista, COCOLA)
    - Roles de sistemas de gestión (Auditor Interno, Responsable Ambiental)
    - Roles operativos especiales (Aprobador de Compras, Supervisor Turno)
    - Roles custom definidos por la empresa

    Jerarquía de permisos del usuario:
    1. Superusuario → todos los permisos
    2. Cargo → permisos base del cargo
    3. Roles adicionales → permisos especializados extra (ESTE MODELO)
    4. Grupos → permisos colaborativos

    Estos roles NO reemplazan al cargo, sino que SUMAN permisos adicionales.
    """

    TIPO_CHOICES = [
        ('LEGAL_OBLIGATORIO', 'Legal Obligatorio'),
        ('SISTEMA_GESTION', 'Sistema de Gestión'),
        ('OPERATIVO', 'Operativo Especial'),
        ('CUSTOM', 'Personalizado'),
    ]

    # ==========================================================================
    # IDENTIFICACIÓN
    # ==========================================================================
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del rol adicional (ej: copasst, brigadista)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del rol (ej: Miembro COPASST)'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de las responsabilidades del rol'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default='CUSTOM',
        db_index=True,
        verbose_name='Tipo de Rol'
    )

    # ==========================================================================
    # PERMISOS
    # ==========================================================================
    permisos = models.ManyToManyField(
        'core.Permiso',
        through='RolAdicionalPermiso',
        related_name='roles_adicionales',
        verbose_name='Permisos',
        blank=True,
        help_text='Permisos que otorga este rol adicional'
    )

    # ==========================================================================
    # INFORMACIÓN LEGAL (para roles legales obligatorios)
    # ==========================================================================
    justificacion_legal = models.TextField(
        blank=True,
        null=True,
        verbose_name='Justificación Legal',
        help_text='Normativa que exige este rol (ej: Resolución 0312/2019)'
    )
    requiere_certificacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Certificación',
        help_text='Si el rol requiere certificación o capacitación específica'
    )
    certificacion_requerida = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Certificación Requerida',
        help_text='Nombre de la certificación/curso requerido (ej: Curso 50h SST)'
    )

    # ==========================================================================
    # CONTROL
    # ==========================================================================
    is_system = models.BooleanField(
        default=False,
        verbose_name='Es del sistema',
        help_text='Los roles del sistema no pueden eliminarse desde la UI'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si el rol está activo en el sistema'
    )

    # ==========================================================================
    # AUDITORÍA
    # ==========================================================================
    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_adicionales_creados',
        verbose_name='Creado por'
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
        db_table = 'core_rol_adicional'
        verbose_name = 'Rol Adicional'
        verbose_name_plural = 'Roles Adicionales'
        ordering = ['tipo', 'nombre']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['tipo', 'is_active']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.code})"

    def get_permisos_codigos(self):
        """
        Retorna lista de códigos de permisos activos de este rol.

        Returns:
            list: Lista de códigos de permisos (ej: ['lotes.approve', 'lotes.view'])
        """
        return list(
            self.permisos.filter(is_active=True).values_list('code', flat=True)
        )

    def usuarios_count(self):
        """
        Cuenta cuántos usuarios tienen asignado este rol adicional.

        Returns:
            int: Número de usuarios con este rol
        """
        return self.usuarios_asignados.filter(
            is_active=True,
            user__is_active=True,
            user__deleted_at__isnull=True
        ).count()

    usuarios_count.short_description = 'Usuarios Asignados'

    def puede_eliminar(self):
        """
        Verifica si el rol adicional puede ser eliminado.

        Returns:
            tuple: (bool, str) - (puede_eliminar, razón si no puede)
        """
        if self.is_system:
            return False, "Este es un rol del sistema y no puede eliminarse"

        usuarios_asignados = self.usuarios_count()
        if usuarios_asignados > 0:
            return False, f"Hay {usuarios_asignados} usuario(s) con este rol asignado"

        return True, None

    def get_tipo_display_color(self):
        """
        Retorna color asociado al tipo de rol (para UI).

        Returns:
            str: Color CSS (ej: 'red', 'blue', 'green')
        """
        colores = {
            'LEGAL_OBLIGATORIO': 'red',
            'SISTEMA_GESTION': 'blue',
            'OPERATIVO': 'green',
            'CUSTOM': 'purple',
        }
        return colores.get(self.tipo, 'gray')


class RolAdicionalPermiso(models.Model):
    """
    Relación Many-to-Many entre RolAdicional y Permiso.

    Tabla intermedia para control de auditoría de asignación de permisos.
    """

    rol_adicional = models.ForeignKey(
        RolAdicional,
        on_delete=models.CASCADE,
        related_name='rol_adicional_permisos',
        verbose_name='Rol Adicional'
    )
    permiso = models.ForeignKey(
        'core.Permiso',
        on_delete=models.CASCADE,
        related_name='rol_adicional_permisos',
        verbose_name='Permiso'
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
        related_name='permisos_rol_adicional_otorgados',
        verbose_name='Asignado por'
    )

    class Meta:
        db_table = 'core_rol_adicional_permiso'
        verbose_name = 'Permiso de Rol Adicional'
        verbose_name_plural = 'Permisos de Roles Adicionales'
        unique_together = [['rol_adicional', 'permiso']]
        ordering = ['rol_adicional', 'permiso']

    def __str__(self):
        return f"{self.rol_adicional.code} → {self.permiso.code}"


class UserRolAdicional(models.Model):
    """
    Relación Many-to-Many entre User y RolAdicional.

    Permite asignar roles adicionales a usuarios con control de:
    - Vigencia temporal (fecha de expiración)
    - Auditoría de asignación
    - Justificación de la asignación
    - Certificación adjunta (para roles que la requieren)
    """

    user = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='usuarios_roles_adicionales',
        verbose_name='Usuario'
    )
    rol_adicional = models.ForeignKey(
        RolAdicional,
        on_delete=models.CASCADE,
        related_name='usuarios_asignados',
        verbose_name='Rol Adicional'
    )

    # ==========================================================================
    # VIGENCIA
    # ==========================================================================
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de expiración',
        help_text='Fecha en que el rol expira automáticamente (opcional)'
    )

    # ==========================================================================
    # AUDITORÍA Y JUSTIFICACIÓN
    # ==========================================================================
    assigned_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_adicionales_asignados_por_mi',
        verbose_name='Asignado por'
    )
    justificacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Justificación',
        help_text='Razón o justificación de la asignación del rol'
    )

    # ==========================================================================
    # CERTIFICACIÓN (para roles que la requieren)
    # ==========================================================================
    certificacion_adjunta = models.FileField(
        upload_to='roles_adicionales/certificaciones/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Certificación Adjunta',
        help_text='Certificado o documento que acredita la capacitación'
    )
    fecha_certificacion = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Certificación',
        help_text='Fecha de emisión del certificado'
    )
    certificacion_expira = models.DateField(
        blank=True,
        null=True,
        verbose_name='Certificación Expira',
        help_text='Fecha de vencimiento del certificado'
    )

    # ==========================================================================
    # ESTADO
    # ==========================================================================
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si la asignación está activa'
    )

    class Meta:
        db_table = 'core_user_rol_adicional'
        verbose_name = 'Usuario-Rol Adicional'
        verbose_name_plural = 'Usuarios-Roles Adicionales'
        unique_together = [['user', 'rol_adicional']]
        ordering = ['user', 'rol_adicional']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['certificacion_expira']),
        ]

    def __str__(self):
        return f"{self.user.username} → {self.rol_adicional.nombre}"

    @property
    def is_expired(self):
        """Verifica si el rol ha expirado por fecha."""
        if self.expires_at is None:
            return False
        return timezone.now() > self.expires_at

    @property
    def certificacion_is_expired(self):
        """Verifica si la certificación ha expirado."""
        if self.certificacion_expira is None:
            return False
        return timezone.now().date() > self.certificacion_expira

    @property
    def is_valid(self):
        """
        Verifica si la asignación del rol es válida.

        Considera:
        - Rol activo
        - Asignación activa
        - No expirado por fecha
        - Certificación vigente (si aplica)

        Returns:
            bool: True si es válido
        """
        if not self.is_active:
            return False

        if not self.rol_adicional.is_active:
            return False

        if self.is_expired:
            return False

        # Si el rol requiere certificación, verificar vigencia
        if self.rol_adicional.requiere_certificacion:
            if not self.certificacion_adjunta:
                return False
            if self.certificacion_is_expired:
                return False

        return True

    @property
    def estado_certificacion(self):
        """
        Retorna el estado de la certificación.

        Returns:
            str: 'VIGENTE', 'VENCIDA', 'PROXIMA_VENCER', 'NO_REQUERIDA', 'NO_CARGADA'
        """
        if not self.rol_adicional.requiere_certificacion:
            return 'NO_REQUERIDA'

        if not self.certificacion_adjunta:
            return 'NO_CARGADA'

        if self.certificacion_is_expired:
            return 'VENCIDA'

        if self.certificacion_expira:
            from datetime import timedelta
            dias_para_vencer = (self.certificacion_expira - timezone.now().date()).days
            if dias_para_vencer <= 30:
                return 'PROXIMA_VENCER'

        return 'VIGENTE'


class CargoSectionAccess(models.Model):
    """
    Define qué secciones del sistema puede acceder cada cargo y qué acciones puede realizar.

    Sistema RBAC Unificado v4.0:
    - Controla visibilidad de secciones en sidebar/navegación
    - Controla acciones CRUD disponibles en cada sección
    - Un solo lugar de configuración para el administrador

    Ejemplo de uso:
        cargo=Analista, section=Datos Empresa, can_view=True, can_edit=True
        → El Analista puede ver la sección Y editar los datos
    """

    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.CASCADE,
        related_name='section_accesses',
        verbose_name='Cargo'
    )
    section = models.ForeignKey(
        'core.TabSection',
        on_delete=models.CASCADE,
        related_name='cargo_accesses',
        verbose_name='Sección'
    )

    # Acciones CRUD integradas - si tiene acceso a la sección, qué puede hacer
    can_view = models.BooleanField(
        default=True,
        verbose_name='Puede ver',
        help_text='Permite ver/acceder a esta sección'
    )
    can_create = models.BooleanField(
        default=False,
        verbose_name='Puede crear',
        help_text='Permite crear nuevos registros en esta sección'
    )
    can_edit = models.BooleanField(
        default=False,
        verbose_name='Puede editar',
        help_text='Permite modificar registros existentes'
    )
    can_delete = models.BooleanField(
        default=False,
        verbose_name='Puede eliminar',
        help_text='Permite eliminar registros'
    )
    custom_actions = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Acciones personalizadas',
        help_text='Estado de acciones extra (ej: {"enviar": true})'
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
        related_name='section_accesses_granted',
        verbose_name='Otorgado por'
    )

    class Meta:
        db_table = 'core_cargo_section_access'
        verbose_name = 'Acceso a Sección por Cargo'
        verbose_name_plural = 'Accesos a Secciones por Cargo'
        unique_together = [['cargo', 'section']]
        ordering = ['cargo', 'section__tab__module__orden', 'section__tab__orden', 'section__orden']
        indexes = [
            models.Index(fields=['cargo']),
            models.Index(fields=['section']),
        ]

    def __str__(self):
        actions = []
        if self.can_view:
            actions.append('V')
        if self.can_create:
            actions.append('C')
        if self.can_edit:
            actions.append('E')
        if self.can_delete:
            actions.append('D')
        return f"{self.cargo.name} -> {self.section.name} [{'/'.join(actions)}]"

    @property
    def actions_list(self):
        """Retorna lista de acciones permitidas"""
        actions = []
        if self.can_view:
            actions.append('view')
        if self.can_create:
            actions.append('create')
        if self.can_edit:
            actions.append('edit')
        if self.can_delete:
            actions.append('delete')
        return actions
