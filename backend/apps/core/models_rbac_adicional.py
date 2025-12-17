"""
Sistema RBAC Híbrido - Modelo RolAdicional
===========================================

ARQUITECTURA DEL SISTEMA:

1. MODELO ACTUAL (Base Organizacional):
   - Cargo: Posición estructural en el organigrama
   - Role: Rol funcional asignable a usuarios/grupos
   - Group: Equipos de trabajo

2. NUEVO MODELO (Extensión Regulatoria):
   - RolAdicional: Roles con requisitos legales/certificación
     * Legal obligatorio (ej: COPASST, Brigada Emergencias)
     * Sistema de gestión (ej: Auditor Interno ISO, Responsable PESV)
     * Operativo especializado (ej: Operador Montacargas, Soldador)
     * Custom (roles definidos por la organización)

FLUJO DE PERMISOS:
Usuario → Cargo (permisos base)
        → Role (permisos funcionales)
        → RolAdicional (permisos especializados/certificados)
        → Group (permisos de equipo)

EJEMPLO DE USO:
- Juan tiene Cargo="Operario Planta" (permisos base: operar equipos)
- Juan tiene Role="Auditor Calidad" (permisos funcionales: auditar procesos)
- Juan tiene RolAdicional="Brigadista" (permisos legales: respuesta emergencias)
- Juan pertenece a Group="Brigada Emergencias" (permisos de equipo)
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


class RolAdicional(models.Model):
    """
    Rol Adicional con Requisitos Legales/Certificación

    Este modelo extiende el sistema RBAC para manejar roles que:
    - Requieren cumplimiento de normativa legal colombiana
    - Necesitan certificaciones o licencias específicas
    - Tienen responsabilidades especializadas
    - Son temporales o requieren renovación

    Casos de uso:
    - Legal obligatorio: COPASST, Brigada Emergencias (Res 0312/2019)
    - Sistema gestión: Auditor Interno ISO 45001, Coordinador PESV
    - Operativo: Operador Montacargas, Trabajo en Alturas, Espacios Confinados
    - Custom: Roles definidos por la organización
    """

    TIPO_CHOICES = [
        ('LEGAL_OBLIGATORIO', 'Legal Obligatorio'),  # COPASST, Brigada
        ('SISTEMA_GESTION', 'Sistema de Gestión'),    # ISO, PESV, SST
        ('OPERATIVO', 'Operativo Especializado'),     # Montacargas, Alturas
        ('CUSTOM', 'Personalizado'),                  # Definido por empresa
    ]

    # ==========================================================================
    # IDENTIFICACIÓN
    # ==========================================================================
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del rol adicional (ej: rol_copasst, rol_brigadista)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre del rol adicional (ej: Miembro COPASST, Brigadista)'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del rol y sus responsabilidades'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        db_index=True,
        verbose_name='Tipo de Rol',
        help_text='Clasificación del rol según su naturaleza'
    )

    # ==========================================================================
    # PERMISOS DEL SISTEMA
    # ==========================================================================
    permisos = models.ManyToManyField(
        'Permiso',
        through='RolAdicionalPermiso',
        related_name='roles_adicionales',
        verbose_name='Permisos',
        blank=True,
        help_text='Permisos específicos asociados a este rol adicional'
    )

    # ==========================================================================
    # METADATA LEGAL Y NORMATIVA
    # ==========================================================================
    justificacion_legal = models.TextField(
        blank=True,
        null=True,
        verbose_name='Justificación Legal',
        help_text=(
            'Normativa que requiere este rol (ej: Resolución 0312/2019, '
            'Decreto 1072/2015, ISO 45001:2018)'
        )
    )
    requiere_certificacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Certificación',
        help_text='Si el rol requiere certificación o licencia vigente'
    )
    certificacion_requerida = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Certificación Requerida',
        help_text=(
            'Nombre de la certificación/licencia requerida '
            '(ej: Curso Trabajo en Alturas, Licencia Operador Montacargas)'
        )
    )
    vigencia_certificacion_dias = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='Vigencia Certificación (días)',
        help_text='Días de vigencia de la certificación (ej: 365, 730)'
    )

    # ==========================================================================
    # REQUISITOS Y RESTRICCIONES
    # ==========================================================================
    requisitos_minimos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Requisitos Mínimos',
        help_text=(
            'Requisitos para desempeñar el rol (JSON array). '
            'Ejemplo: ["Curso básico SST 50h", "Examen médico vigente"]'
        )
    )
    cargos_compatibles = models.ManyToManyField(
        'Cargo',
        blank=True,
        related_name='roles_adicionales_compatibles',
        verbose_name='Cargos Compatibles',
        help_text='Cargos que pueden tener este rol adicional'
    )
    requiere_aprobacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Aprobación',
        help_text='Si la asignación del rol requiere aprobación de un superior'
    )

    # ==========================================================================
    # CAMPOS DE CONTROL
    # ==========================================================================
    is_system = models.BooleanField(
        default=False,
        verbose_name='Es del sistema',
        help_text='Los roles del sistema no pueden eliminarse'
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
        'User',
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
        Obtiene lista de códigos de permisos del rol

        Returns:
            list: Lista de códigos de permisos activos
        """
        return list(
            self.permisos.filter(is_active=True).values_list('code', flat=True)
        )

    def usuarios_count(self):
        """
        Cuenta usuarios que tienen este rol adicional asignado

        Returns:
            int: Cantidad de usuarios con el rol
        """
        return self.usuario_roles_adicionales.filter(
            usuario__is_active=True,
            usuario__deleted_at__isnull=True,
            is_active=True
        ).count()

    def usuarios_vigentes_count(self):
        """
        Cuenta usuarios con asignación vigente (no expirada)

        Returns:
            int: Cantidad de usuarios con asignación vigente
        """
        from django.db.models import Q

        return self.usuario_roles_adicionales.filter(
            usuario__is_active=True,
            usuario__deleted_at__isnull=True,
            is_active=True
        ).filter(
            Q(fecha_expiracion__isnull=True) | Q(fecha_expiracion__gt=timezone.now())
        ).count()

    def puede_eliminar(self):
        """
        Verifica si el rol puede ser eliminado

        Returns:
            tuple: (puede_eliminar: bool, razon: str)
        """
        if self.is_system:
            return False, "Este es un rol del sistema y no puede eliminarse"

        # Verificar si hay usuarios asignados
        usuarios_activos = self.usuarios_vigentes_count()
        if usuarios_activos > 0:
            return False, f"Hay {usuarios_activos} usuarios con este rol asignado"

        return True, None

    def validar_certificacion_usuario(self, usuario):
        """
        Valida si un usuario cumple con los requisitos de certificación

        Args:
            usuario: Usuario a validar

        Returns:
            tuple: (valido: bool, mensaje: str)
        """
        if not self.requiere_certificacion:
            return True, "No requiere certificación"

        # Buscar asignación del rol al usuario
        asignacion = self.usuario_roles_adicionales.filter(
            usuario=usuario,
            is_active=True
        ).first()

        if not asignacion:
            return False, "Usuario no tiene este rol asignado"

        if not asignacion.certificado_numero:
            return False, "Falta número de certificado"

        if asignacion.certificado_vigencia and asignacion.certificado_vigencia < timezone.now().date():
            return False, f"Certificación expirada desde {asignacion.certificado_vigencia}"

        return True, "Certificación válida"


class RolAdicionalPermiso(models.Model):
    """
    Relación Many-to-Many entre RolAdicional y Permiso
    """

    rol_adicional = models.ForeignKey(
        RolAdicional,
        on_delete=models.CASCADE,
        related_name='rol_adicional_permisos'
    )
    permiso = models.ForeignKey(
        'Permiso',
        on_delete=models.CASCADE,
        related_name='rol_adicional_permisos'
    )
    granted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    granted_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permisos_rol_adicional_otorgados'
    )

    class Meta:
        db_table = 'core_rol_adicional_permiso'
        verbose_name = 'RolAdicional-Permiso'
        verbose_name_plural = 'RolesAdicionales-Permisos'
        unique_together = [['rol_adicional', 'permiso']]
        ordering = ['rol_adicional', 'permiso']

    def __str__(self):
        return f"{self.rol_adicional.code} -> {self.permiso.code}"


class UsuarioRolAdicional(models.Model):
    """
    Asignación de Roles Adicionales a Usuarios

    Maneja la asignación de roles especializados con:
    - Vigencia temporal
    - Certificaciones asociadas
    - Aprobaciones requeridas
    - Documentación soporte
    """

    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente Aprobación'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
        ('VIGENTE', 'Vigente'),
        ('EXPIRADO', 'Expirado'),
        ('SUSPENDIDO', 'Suspendido'),
    ]

    # ==========================================================================
    # RELACIONES
    # ==========================================================================
    usuario = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='usuario_roles_adicionales'
    )
    rol_adicional = models.ForeignKey(
        RolAdicional,
        on_delete=models.CASCADE,
        related_name='usuario_roles_adicionales'
    )

    # ==========================================================================
    # VIGENCIA Y ESTADO
    # ==========================================================================
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CHOICES,
        default='VIGENTE',
        db_index=True,
        verbose_name='Estado'
    )
    fecha_asignacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Asignación'
    )
    fecha_inicio = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Inicio',
        help_text='Fecha desde la cual el rol es efectivo'
    )
    fecha_expiracion = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Expiración',
        help_text='Fecha en que el rol expira (si aplica)'
    )

    # ==========================================================================
    # CERTIFICACIÓN
    # ==========================================================================
    certificado_numero = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Número de Certificado',
        help_text='Número del certificado o licencia'
    )
    certificado_entidad = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Entidad Certificadora',
        help_text='Nombre de la entidad que emitió el certificado'
    )
    certificado_vigencia = models.DateField(
        blank=True,
        null=True,
        verbose_name='Vigencia del Certificado',
        help_text='Fecha de vencimiento del certificado'
    )
    certificado_documento = models.FileField(
        upload_to='roles_adicionales/certificados/',
        blank=True,
        null=True,
        verbose_name='Documento del Certificado',
        help_text='Archivo PDF del certificado o licencia'
    )

    # ==========================================================================
    # APROBACIÓN
    # ==========================================================================
    requiere_aprobacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Aprobación'
    )
    aprobado_por = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_adicionales_aprobados',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Fecha de Aprobación'
    )
    motivo_rechazo = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de Rechazo'
    )

    # ==========================================================================
    # CONTROL
    # ==========================================================================
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    asignado_por = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_adicionales_asignados',
        verbose_name='Asignado por'
    )
    notas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas',
        help_text='Observaciones o notas adicionales'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'core_usuario_rol_adicional'
        verbose_name = 'Usuario-Rol Adicional'
        verbose_name_plural = 'Usuarios-Roles Adicionales'
        unique_together = [['usuario', 'rol_adicional']]
        ordering = ['usuario', 'rol_adicional']
        indexes = [
            models.Index(fields=['estado', 'is_active']),
            models.Index(fields=['fecha_expiracion']),
            models.Index(fields=['certificado_vigencia']),
        ]

    def __str__(self):
        return f"{self.usuario.username} -> {self.rol_adicional.code}"

    @property
    def is_vigente(self):
        """Verifica si la asignación está vigente"""
        if not self.is_active:
            return False

        if self.estado not in ['APROBADO', 'VIGENTE']:
            return False

        if self.fecha_expiracion and self.fecha_expiracion < timezone.now().date():
            return False

        return True

    @property
    def certificado_vigente(self):
        """Verifica si el certificado está vigente"""
        if not self.certificado_vigencia:
            return None

        return self.certificado_vigencia >= timezone.now().date()

    @property
    def dias_hasta_expiracion(self):
        """Calcula días hasta expiración del rol"""
        if not self.fecha_expiracion:
            return None

        delta = self.fecha_expiracion - timezone.now().date()
        return delta.days

    @property
    def dias_hasta_expiracion_certificado(self):
        """Calcula días hasta expiración del certificado"""
        if not self.certificado_vigencia:
            return None

        delta = self.certificado_vigencia - timezone.now().date()
        return delta.days

    def clean(self):
        """Validaciones personalizadas"""
        # Si el rol requiere certificación, validar campos
        if self.rol_adicional.requiere_certificacion:
            if not self.certificado_numero:
                raise ValidationError({
                    'certificado_numero': 'Este rol requiere número de certificado'
                })
            if not self.certificado_vigencia:
                raise ValidationError({
                    'certificado_vigencia': 'Este rol requiere fecha de vigencia del certificado'
                })

        # Si requiere aprobación, validar estado
        if self.rol_adicional.requiere_aprobacion and not self.pk:
            self.estado = 'PENDIENTE'
            self.requiere_aprobacion = True

        # Validar compatibilidad con cargo
        if self.usuario.cargo and self.rol_adicional.cargos_compatibles.exists():
            if not self.rol_adicional.cargos_compatibles.filter(id=self.usuario.cargo.id).exists():
                raise ValidationError(
                    f"El cargo {self.usuario.cargo.name} no es compatible con este rol adicional"
                )

    def aprobar(self, aprobador):
        """
        Aprueba la asignación del rol

        Args:
            aprobador: Usuario que aprueba
        """
        self.estado = 'VIGENTE'
        self.aprobado_por = aprobador
        self.fecha_aprobacion = timezone.now()
        self.save()

    def rechazar(self, rechazador, motivo):
        """
        Rechaza la asignación del rol

        Args:
            rechazador: Usuario que rechaza
            motivo: Motivo del rechazo
        """
        self.estado = 'RECHAZADO'
        self.aprobado_por = rechazador
        self.fecha_aprobacion = timezone.now()
        self.motivo_rechazo = motivo
        self.is_active = False
        self.save()

    def suspender(self, motivo=None):
        """Suspende la asignación del rol"""
        self.estado = 'SUSPENDIDO'
        if motivo:
            self.notas = f"{self.notas}\n[SUSPENDIDO] {motivo}" if self.notas else f"[SUSPENDIDO] {motivo}"
        self.save()

    def renovar_certificado(self, nuevo_numero, nueva_vigencia, documento=None):
        """
        Renueva el certificado asociado

        Args:
            nuevo_numero: Nuevo número de certificado
            nueva_vigencia: Nueva fecha de vigencia
            documento: Archivo del nuevo certificado (opcional)
        """
        self.certificado_numero = nuevo_numero
        self.certificado_vigencia = nueva_vigencia
        if documento:
            self.certificado_documento = documento
        self.estado = 'VIGENTE'
        self.save()
