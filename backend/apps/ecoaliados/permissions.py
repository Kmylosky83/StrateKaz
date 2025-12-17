"""
Permissions personalizados del módulo Ecoaliados
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import permissions
from apps.core.permissions_constants import CargoCodes


class CanManageEcoaliados(permissions.BasePermission):
    """
    Permiso para gestionar ecoaliados

    Roles permitidos:
    - Comercial Econorte: CRUD solo de SUS propios ecoaliados (comercial_asignado=request.user)
    - Líder Comercial Econorte: CRUD de todos los ecoaliados de su unidad de negocio
    - Gerente/SuperAdmin: CRUD de todos los ecoaliados
    """

    message = 'No tiene permisos para gestionar ecoaliados. Se requiere cargo de Comercial Econorte o superior.'

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

        # Códigos de cargo permitidos para CRUD
        cargos_permitidos = [CargoCodes.COMERCIAL_ECONORTE, CargoCodes.LIDER_COMERCIAL_ECONORTE]

        # Para lectura (GET), permitir a comerciales, líderes comerciales y líder logístico
        if request.method in permissions.SAFE_METHODS:
            if request.user.cargo.code in cargos_permitidos + [CargoCodes.LIDER_LOGISTICA_ECONORTE]:
                return True
            # Gerente también puede leer
            if request.user.has_cargo_level(3):
                return True

        # Para creación (POST), permitir a comerciales y líderes comerciales
        if request.method == 'POST':
            if request.user.cargo.code in cargos_permitidos:
                return True
            # Gerente también puede crear
            if request.user.has_cargo_level(3):
                return True

        # Para modificación (PUT, PATCH), permitir a comerciales y líderes comerciales
        if request.method in ['PUT', 'PATCH']:
            if request.user.cargo.code in cargos_permitidos:
                return True
            # Gerente también puede modificar
            if request.user.has_cargo_level(3):
                return True

        # Para eliminación (DELETE), solo líder comercial, gerente o superadmin
        if request.method == 'DELETE':
            if request.user.cargo.code == CargoCodes.LIDER_COMERCIAL_ECONORTE:
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

        # Líder Comercial Econorte puede gestionar todos los ecoaliados
        if request.user.cargo.code == CargoCodes.LIDER_COMERCIAL_ECONORTE:
            return True

        # Líder Logística Econorte solo puede VER ecoaliados (lectura)
        if request.user.cargo.code == CargoCodes.LIDER_LOGISTICA_ECONORTE:
            if request.method in permissions.SAFE_METHODS:
                return True
            return False

        # Comercial Econorte solo puede gestionar SUS ecoaliados
        if request.user.cargo.code == CargoCodes.COMERCIAL_ECONORTE:
            # Para lectura, puede ver todos
            if request.method in permissions.SAFE_METHODS:
                return True

            # Para modificación/eliminación, solo SUS ecoaliados
            if request.method in ['PUT', 'PATCH', 'DELETE']:
                return obj.comercial_asignado == request.user

        return False


class CanChangePrecioEcoaliado(permissions.BasePermission):
    """
    Permiso para cambiar precio de ecoaliados

    CRÍTICO: SOLO Líder Comercial Econorte, Gerente o SuperAdmin pueden cambiar precios
    """

    message = 'Solo el Líder Comercial, Gerente o SuperAdmin pueden cambiar precios de ecoaliados.'

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

        # Líder Comercial Econorte puede cambiar precios
        if request.user.cargo.code == CargoCodes.LIDER_COMERCIAL_ECONORTE:
            return True

        # Gerente (nivel 3+) puede cambiar precios
        if request.user.has_cargo_level(3):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto"""
        # Reutilizar has_permission
        return self.has_permission(request, view)
