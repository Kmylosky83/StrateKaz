"""
Permissions personalizados del módulo Programaciones
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import permissions


class CanManageProgramaciones(permissions.BasePermission):
    """
    Permiso para gestionar programaciones

    Roles y permisos:
    - comercial_econorte: CRUD solo de SUS programaciones (programado_por=request.user)
    - lider_com_econorte: CRUD de todas las programaciones
    - lider_log_econorte: Ver todas, asignar recolectores, modificar fechas
    - recolector_econorte: Ver solo asignadas a él, cambiar a EN_RUTA/COMPLETADA/CANCELADA
    - gerente/superadmin: Full access
    """

    message = 'No tiene permisos para gestionar programaciones.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Códigos de cargo permitidos
        cargos_permitidos = [
            'comercial_econorte',
            'lider_com_econorte',
            'lider_log_econorte',
            'recolector_econorte'
        ]

        # Para lectura (GET), permitir a todos los roles
        if request.method in permissions.SAFE_METHODS:
            if request.user.cargo.code in cargos_permitidos:
                return True
            # Gerente también puede leer
            if request.user.has_cargo_level(3):
                return True

        # Para creación (POST), permitir a comerciales y líderes comerciales
        if request.method == 'POST':
            if request.user.cargo.code in ['comercial_econorte', 'lider_com_econorte']:
                return True
            # Gerente también puede crear
            if request.user.has_cargo_level(3):
                return True

        # Para modificación (PUT, PATCH), permitir a líderes y logística (NO comercial_econorte)
        if request.method in ['PUT', 'PATCH']:
            if request.user.cargo.code in ['lider_com_econorte', 'lider_log_econorte', 'recolector_econorte']:
                return True
            # Gerente también puede modificar
            if request.user.has_cargo_level(3):
                return True

        # Para eliminación (DELETE), comercial_econorte, líder comercial, gerente o superadmin
        # NOTA: lider_log_econorte NO puede eliminar, solo reprogram
        if request.method == 'DELETE':
            if request.user.cargo.code in ['comercial_econorte', 'lider_com_econorte']:
                return True
            if request.user.has_cargo_level(3):
                return True

        return False

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto"""
        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Gerente tiene todos los permisos
        if request.user.has_cargo_level(3):
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        cargo_code = request.user.cargo.code

        # Líder Comercial Econorte puede gestionar todas las programaciones
        if cargo_code == 'lider_com_econorte':
            return True

        # Líder Logística Econorte puede ver y modificar todas las programaciones
        if cargo_code == 'lider_log_econorte':
            return True

        # Comercial Econorte solo puede VER todas y ELIMINAR las suyas
        if cargo_code == 'comercial_econorte':
            # Para lectura, puede ver todas
            if request.method in permissions.SAFE_METHODS:
                return True

            # Para eliminación, solo SUS programaciones
            if request.method == 'DELETE':
                return obj.programado_por == request.user

            # NO puede modificar (PUT/PATCH)
            return False

        # Recolector solo puede ver las asignadas a él
        if cargo_code == 'recolector_econorte':
            # Solo lectura de las asignadas a él
            if request.method in permissions.SAFE_METHODS:
                return obj.recolector_asignado == request.user

            # No puede modificar ni eliminar
            return False

        return False


class CanAsignarRecolector(permissions.BasePermission):
    """
    Permiso para asignar recolectores a programaciones

    CRÍTICO: SOLO Líder Logística, Gerente o SuperAdmin pueden asignar recolectores
    """

    message = 'Solo el Líder de Logística, Gerente o SuperAdmin pueden asignar recolectores.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin (is_superuser) siempre puede
        if request.user.is_superuser:
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Líder Logística Econorte o cargo superadmin pueden asignar recolectores
        if request.user.cargo.code in ['lider_log_econorte', 'superadmin']:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto"""
        # Reutilizar has_permission
        return self.has_permission(request, view)


class CanCambiarEstadoProgramacion(permissions.BasePermission):
    """
    Permiso para cambiar estado de programaciones

    Validaciones específicas por estado se manejan en el modelo
    Este permiso valida acceso general
    """

    message = 'No tiene permisos para cambiar el estado de programaciones.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin siempre puede
        if request.user.is_superuser:
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Roles que pueden cambiar estados
        cargos_permitidos = [
            'lider_com_econorte',
            'lider_log_econorte',
            'recolector_econorte'
        ]

        if request.user.cargo.code in cargos_permitidos:
            return True

        # Gerente también puede
        if request.user.has_cargo_level(3):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto"""
        # Validaciones específicas se manejan en puede_cambiar_estado del modelo
        return self.has_permission(request, view)


class CanReprogramar(permissions.BasePermission):
    """
    Permiso para reprogramar programaciones canceladas

    CRÍTICO: SOLO Líder Logística, Gerente o SuperAdmin pueden reprogramar
    """

    message = 'Solo el Líder de Logística, Gerente o SuperAdmin pueden reprogramar.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin siempre puede
        if request.user.is_superuser:
            return True

        # Verificar que tenga cargo
        if not request.user.cargo:
            return False

        # Líder Logística Econorte puede reprogramar
        if request.user.cargo.code == 'lider_log_econorte':
            return True

        # Gerente (nivel 3+) puede reprogramar
        if request.user.has_cargo_level(3):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto"""
        # Reutilizar has_permission
        return self.has_permission(request, view)
