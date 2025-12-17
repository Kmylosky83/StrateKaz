"""
Modificaciones a Modelos Existentes para Sistema RBAC Híbrido
==============================================================

Este archivo contiene las modificaciones que deben aplicarse a:
- Modelo Cargo
- Modelo User

IMPORTANTE: Estas modificaciones deben integrarse en models.py
NO es un archivo independiente, es DOCUMENTACIÓN del diseño.
"""

# ==============================================================================
# MODIFICACIÓN 1: CARGO - Agregar relación con RolAdicional
# ==============================================================================

"""
En el modelo Cargo (apps/core/models.py), agregar al final del modelo:

    # ==========================================================================
    # TAB 5: PERMISOS Y ROLES (EXTENDIDO)
    # ==========================================================================

    # Ya existe: rol_sistema (FK a Role)
    # Ya existe: permisos (M2M a través de CargoPermiso)

    # AGREGAR NUEVO CAMPO:
    roles_adicionales_compatibles = models.ManyToManyField(
        'RolAdicional',
        blank=True,
        related_name='cargos_permitidos',
        verbose_name='Roles Adicionales Compatibles',
        help_text='Roles adicionales que pueden ser asignados a este cargo'
    )

    # AGREGAR NUEVOS CAMPOS DE AUDITORÍA DE PERMISOS:
    permisos_actualizados_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cargos_permisos_actualizados',
        verbose_name='Permisos actualizados por',
        help_text='Último usuario que modificó los permisos del cargo'
    )
    permisos_actualizados_en = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Permisos actualizados en',
        help_text='Fecha de última actualización de permisos'
    )
"""

# Métodos a agregar en el modelo Cargo:

def get_permisos_codigos(self):
    """
    Obtiene lista de códigos de permisos del cargo

    Returns:
        list: Lista de códigos de permisos activos
    """
    return list(
        self.permisos.filter(is_active=True).values_list('code', flat=True)
    )


def tiene_permiso(self, permiso_code):
    """
    Verifica si el cargo tiene un permiso específico

    Args:
        permiso_code (str): Código del permiso a verificar

    Returns:
        bool: True si tiene el permiso
    """
    return self.permisos.filter(
        code=permiso_code,
        is_active=True
    ).exists()


def asignar_permisos(self, codigos_permisos, usuario_modificador=None):
    """
    Asigna permisos al cargo (reemplaza existentes)

    Args:
        codigos_permisos (list): Lista de códigos de permisos
        usuario_modificador (User): Usuario que realiza la modificación

    Returns:
        int: Cantidad de permisos asignados
    """
    from apps.core.models import Permiso
    from django.utils import timezone

    # Obtener permisos válidos
    permisos = Permiso.objects.filter(
        code__in=codigos_permisos,
        is_active=True
    )

    # Limpiar permisos existentes y asignar nuevos
    self.permisos.clear()

    for permiso in permisos:
        CargoPermiso.objects.create(
            cargo=self,
            permiso=permiso,
            granted_by=usuario_modificador
        )

    # Actualizar auditoría
    self.permisos_actualizados_por = usuario_modificador
    self.permisos_actualizados_en = timezone.now()
    self.save(update_fields=['permisos_actualizados_por', 'permisos_actualizados_en'])

    return permisos.count()


def agregar_permisos(self, codigos_permisos, usuario_modificador=None):
    """
    Agrega permisos adicionales al cargo (sin eliminar existentes)

    Args:
        codigos_permisos (list): Lista de códigos de permisos
        usuario_modificador (User): Usuario que realiza la modificación

    Returns:
        int: Cantidad de permisos agregados
    """
    from apps.core.models import Permiso
    from django.utils import timezone

    # Obtener permisos válidos que no existan ya
    permisos_existentes = set(self.get_permisos_codigos())
    nuevos_codigos = [c for c in codigos_permisos if c not in permisos_existentes]

    permisos = Permiso.objects.filter(
        code__in=nuevos_codigos,
        is_active=True
    )

    count = 0
    for permiso in permisos:
        CargoPermiso.objects.get_or_create(
            cargo=self,
            permiso=permiso,
            defaults={'granted_by': usuario_modificador}
        )
        count += 1

    if count > 0:
        self.permisos_actualizados_por = usuario_modificador
        self.permisos_actualizados_en = timezone.now()
        self.save(update_fields=['permisos_actualizados_por', 'permisos_actualizados_en'])

    return count


def get_roles_adicionales_disponibles(self):
    """
    Obtiene roles adicionales que pueden asignarse a este cargo

    Returns:
        QuerySet: Roles adicionales compatibles y activos
    """
    return self.roles_adicionales_compatibles.filter(is_active=True)


# ==============================================================================
# MODIFICACIÓN 2: USER - Integración con RolAdicional
# ==============================================================================

"""
En el modelo User (apps/core/models.py), agregar al final del modelo:

    # ==========================================================================
    # ROLES ADICIONALES (NUEVO)
    # ==========================================================================

    # Este campo se agrega mediante add_to_class más abajo
    # roles_adicionales: relación M2M con RolAdicional
"""

# Al final de models.py, después de la definición de User, agregar:

"""
# Agregar relación de User con RolAdicional
User.add_to_class(
    'roles_adicionales',
    models.ManyToManyField(
        'RolAdicional',
        through='UsuarioRolAdicional',
        related_name='usuarios_asignados',
        verbose_name='Roles Adicionales',
        blank=True
    )
)
"""

# Métodos a agregar/modificar en el modelo User:

def get_permisos_efectivos(self):
    """
    Obtiene TODOS los permisos efectivos del usuario

    Jerarquía completa:
    1. Superusuario → todos los permisos
    2. Cargo → permisos del cargo
    3. Roles directos → permisos de roles asignados
    4. Roles adicionales → permisos de roles especializados
    5. Grupos → permisos de roles de grupos

    Returns:
        QuerySet: Todos los permisos activos del usuario
    """
    from django.db.models import Q
    from apps.core.models import Permiso

    if self.is_superuser:
        return Permiso.objects.filter(is_active=True)

    if not self.is_active or self.is_deleted:
        return Permiso.objects.none()

    permission_codes = set()

    # 1. Permisos del cargo
    if self.cargo:
        cargo_perms = self.cargo.permisos.filter(is_active=True).values_list('code', flat=True)
        permission_codes.update(cargo_perms)

    # 2. Permisos de roles directos (ya existe en el modelo actual)
    user_roles = self.user_roles.filter(
        role__is_active=True
    ).filter(
        Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
    )

    for user_role in user_roles:
        role_perms = user_role.role.permisos.filter(is_active=True).values_list('code', flat=True)
        permission_codes.update(role_perms)

    # 3. Permisos de ROLES ADICIONALES (NUEVO)
    from django.utils import timezone

    roles_adicionales = self.usuario_roles_adicionales.filter(
        rol_adicional__is_active=True,
        is_active=True,
        estado__in=['APROBADO', 'VIGENTE']
    ).filter(
        Q(fecha_expiracion__isnull=True) | Q(fecha_expiracion__gt=timezone.now().date())
    )

    for asignacion in roles_adicionales:
        rol_perms = asignacion.rol_adicional.permisos.filter(
            is_active=True
        ).values_list('code', flat=True)
        permission_codes.update(rol_perms)

    # 4. Permisos de grupos (ya existe en el modelo actual)
    user_groups = self.user_groups.filter(group__is_active=True)

    for user_group in user_groups:
        group_roles = user_group.group.roles.filter(is_active=True)
        for role in group_roles:
            role_perms = role.permisos.filter(is_active=True).values_list('code', flat=True)
            permission_codes.update(role_perms)

    return Permiso.objects.filter(code__in=permission_codes, is_active=True)


def tiene_permiso(self, permission_code):
    """
    SOBRESCRIBE el método existente has_permission para incluir roles adicionales

    Verificación completa en el orden:
    1. Superusuario → True
    2. Usuario inactivo/eliminado → False
    3. Cargo → verificar permisos del cargo
    4. Roles directos → verificar permisos de roles
    5. Roles adicionales → verificar permisos de roles especializados
    6. Grupos → verificar permisos de grupos

    Args:
        permission_code (str): Código del permiso a verificar

    Returns:
        bool: True si tiene el permiso
    """
    from django.db.models import Q
    from django.utils import timezone

    # Si es superusuario, tiene todos los permisos
    if self.is_superuser:
        return True

    # Si no está activo o está eliminado, no tiene permisos
    if not self.is_active or self.is_deleted:
        return False

    # 1. Verificar permisos a través del cargo
    if self.cargo:
        if self.cargo.permisos.filter(
            code=permission_code,
            is_active=True
        ).exists():
            return True

    # 2. Verificar permisos a través de roles directos
    user_roles = self.user_roles.filter(
        role__is_active=True
    ).filter(
        Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
    )

    for user_role in user_roles:
        if user_role.role.permisos.filter(
            code=permission_code,
            is_active=True
        ).exists():
            return True

    # 3. NUEVO: Verificar permisos a través de ROLES ADICIONALES
    roles_adicionales = self.usuario_roles_adicionales.filter(
        rol_adicional__is_active=True,
        is_active=True,
        estado__in=['APROBADO', 'VIGENTE']
    ).filter(
        Q(fecha_expiracion__isnull=True) | Q(fecha_expiracion__gt=timezone.now().date())
    )

    for asignacion in roles_adicionales:
        if asignacion.rol_adicional.permisos.filter(
            code=permission_code,
            is_active=True
        ).exists():
            return True

    # 4. Verificar permisos a través de grupos
    user_groups = self.user_groups.filter(group__is_active=True)

    for user_group in user_groups:
        group_roles = user_group.group.roles.filter(is_active=True)
        for role in group_roles:
            if role.permisos.filter(
                code=permission_code,
                is_active=True
            ).exists():
                return True

    return False


def get_roles_adicionales_vigentes(self):
    """
    Obtiene roles adicionales vigentes del usuario

    Returns:
        QuerySet: Asignaciones de roles adicionales vigentes
    """
    from django.db.models import Q
    from django.utils import timezone

    return self.usuario_roles_adicionales.filter(
        rol_adicional__is_active=True,
        is_active=True,
        estado__in=['APROBADO', 'VIGENTE']
    ).filter(
        Q(fecha_expiracion__isnull=True) | Q(fecha_expiracion__gt=timezone.now().date())
    ).select_related('rol_adicional')


def get_roles_adicionales_por_expirar(self, dias=30):
    """
    Obtiene roles adicionales que están por expirar

    Args:
        dias (int): Días de anticipación para la alerta (default: 30)

    Returns:
        QuerySet: Asignaciones que expiran pronto
    """
    from django.utils import timezone
    from datetime import timedelta

    fecha_limite = timezone.now().date() + timedelta(days=dias)

    return self.usuario_roles_adicionales.filter(
        rol_adicional__is_active=True,
        is_active=True,
        estado__in=['APROBADO', 'VIGENTE'],
        fecha_expiracion__isnull=False,
        fecha_expiracion__lte=fecha_limite,
        fecha_expiracion__gt=timezone.now().date()
    ).select_related('rol_adicional')


def get_certificados_por_vencer(self, dias=60):
    """
    Obtiene certificados de roles adicionales que están por vencer

    Args:
        dias (int): Días de anticipación para la alerta (default: 60)

    Returns:
        QuerySet: Asignaciones con certificados próximos a vencer
    """
    from django.utils import timezone
    from datetime import timedelta

    fecha_limite = timezone.now().date() + timedelta(days=dias)

    return self.usuario_roles_adicionales.filter(
        rol_adicional__is_active=True,
        rol_adicional__requiere_certificacion=True,
        is_active=True,
        estado__in=['APROBADO', 'VIGENTE'],
        certificado_vigencia__isnull=False,
        certificado_vigencia__lte=fecha_limite,
        certificado_vigencia__gt=timezone.now().date()
    ).select_related('rol_adicional')


def get_roles_display(self):
    """
    Obtiene diccionario con todos los roles del usuario para visualización

    Returns:
        dict: Diccionario con roles organizados por tipo
    """
    from django.db.models import Q
    from django.utils import timezone

    return {
        'cargo': {
            'code': self.cargo.code if self.cargo else None,
            'nombre': self.cargo.name if self.cargo else None,
            'nivel': self.cargo.nivel_jerarquico if self.cargo else None,
        },
        'roles_directos': [
            {
                'code': ur.role.code,
                'nombre': ur.role.name,
                'expira': ur.expires_at.date() if ur.expires_at else None,
            }
            for ur in self.user_roles.filter(
                role__is_active=True
            ).filter(
                Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
            ).select_related('role')
        ],
        'roles_adicionales': [
            {
                'code': ra.rol_adicional.code,
                'nombre': ra.rol_adicional.nombre,
                'tipo': ra.rol_adicional.get_tipo_display(),
                'requiere_certificacion': ra.rol_adicional.requiere_certificacion,
                'estado': ra.get_estado_display(),
                'expira': ra.fecha_expiracion,
                'certificado_vigencia': ra.certificado_vigencia,
                'certificado_valido': ra.certificado_vigente,
            }
            for ra in self.get_roles_adicionales_vigentes()
        ],
        'grupos': [
            {
                'code': ug.group.code,
                'nombre': ug.group.name,
                'es_lider': ug.is_leader,
            }
            for ug in self.user_groups.filter(
                group__is_active=True
            ).select_related('group')
        ]
    }


def asignar_rol_adicional(
    self,
    rol_adicional,
    asignado_por=None,
    fecha_expiracion=None,
    certificado_numero=None,
    certificado_vigencia=None,
    certificado_documento=None,
    notas=None
):
    """
    Asigna un rol adicional al usuario

    Args:
        rol_adicional: Instancia de RolAdicional
        asignado_por: Usuario que asigna
        fecha_expiracion: Fecha de expiración (opcional)
        certificado_numero: Número de certificado (requerido si rol lo requiere)
        certificado_vigencia: Vigencia del certificado (requerido si rol lo requiere)
        certificado_documento: Archivo del certificado (opcional)
        notas: Observaciones (opcional)

    Returns:
        UsuarioRolAdicional: Instancia creada

    Raises:
        ValidationError: Si faltan datos obligatorios o hay incompatibilidad
    """
    from apps.core.models_rbac_adicional import UsuarioRolAdicional
    from django.core.exceptions import ValidationError

    # Validar que no exista ya
    if self.usuario_roles_adicionales.filter(
        rol_adicional=rol_adicional,
        is_active=True
    ).exists():
        raise ValidationError(
            f"El usuario ya tiene asignado el rol {rol_adicional.nombre}"
        )

    # Crear asignación
    asignacion = UsuarioRolAdicional.objects.create(
        usuario=self,
        rol_adicional=rol_adicional,
        asignado_por=asignado_por,
        fecha_expiracion=fecha_expiracion,
        certificado_numero=certificado_numero,
        certificado_vigencia=certificado_vigencia,
        certificado_documento=certificado_documento,
        notas=notas
    )

    return asignacion


# ==============================================================================
# ALIAS DE COMPATIBILIDAD
# ==============================================================================

# Mantener compatibilidad con código existente que usa has_permission
# El nuevo método tiene_permiso es más explícito pero agregamos alias
User.has_permission = tiene_permiso
