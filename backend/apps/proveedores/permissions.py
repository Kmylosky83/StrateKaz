"""
Permissions personalizados del módulo Proveedores
Sistema de Gestión StrateKaz
"""
from rest_framework import permissions


class CanManageProveedores(permissions.BasePermission):
    """
    Permiso para gestionar proveedores

    Roles permitidos:
    - Crear proveedores: Líder Comercial (nivel 2), Admin (nivel 3), Gerente (nivel 3), SuperAdmin
    - Ver todos: Gerente (nivel 3), SuperAdmin, Admin (nivel 3)
    - Ver asignados: Líder Comercial (nivel 2)
    - Modificar: Líder Comercial (nivel 2+), Admin (nivel 3+)

    IMPORTANTE: Modificar PRECIO solo Gerente/SuperAdmin (ver CanModifyPrecioProveedor)
    """

    message = 'No tiene permisos para gestionar proveedores. Se requiere cargo de Líder Comercial o superior.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Para lectura (GET), permitir desde nivel 2+ (Coordinación)
        if request.method in permissions.SAFE_METHODS:
            if request.user.has_cargo_level(2):
                return True

        # Para creación/modificación (POST, PUT, PATCH)
        if request.method in ['POST', 'PUT', 'PATCH']:
            # Verificar que tenga nivel mínimo 2 (Coordinación - Líder Comercial)
            if request.user.has_cargo_level(2):
                return True

        # Para eliminación (DELETE), requiere nivel 3+ (Dirección)
        if request.method == 'DELETE':
            if request.user.has_cargo_level(3):
                return True

        return False

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto"""
        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Para lectura, nivel 2+
        if request.method in permissions.SAFE_METHODS:
            if request.user.has_cargo_level(2):
                return True

        # Para modificación, nivel 2+
        if request.method in ['PUT', 'PATCH']:
            if request.user.has_cargo_level(2):
                return True

        # Para eliminación, nivel 3+
        if request.method == 'DELETE':
            if request.user.has_cargo_level(3):
                return True

        return False


class CanModifyPrecioProveedor(permissions.BasePermission):
    """
    Permiso para modificar precio de proveedores de materia prima

    CRÍTICO: SOLO Gerente o SuperAdmin pueden modificar precios
    Nivel 3+ (Dirección - Gerente)
    """

    message = 'Solo el Gerente o SuperAdmin pueden modificar precios de proveedores.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin siempre puede
        if request.user.is_superuser:
            return True

        # Verificar cargo
        if request.user.cargo and request.user.cargo.code == 'GERENTE':
            return True

        # Verificar nivel 3+ (Dirección)
        if request.user.has_cargo_level(3):
            return True

        return False


class CanManageUnidadesNegocio(permissions.BasePermission):
    """
    Permiso para gestionar unidades de negocio

    Solo Admin (nivel 3) y SuperAdmin pueden gestionar unidades de negocio
    """

    message = 'Solo Administradores y SuperAdmin pueden gestionar unidades de negocio.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Para lectura (GET), permitir desde nivel 2+ (Coordinación)
        if request.method in permissions.SAFE_METHODS:
            if request.user.has_cargo_level(2):
                return True

        # Para creación/modificación/eliminación, requiere nivel 3+ (Dirección)
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            if request.user.has_cargo_level(3):
                return True

        return False


class CanViewProveedores(permissions.BasePermission):
    """
    Permiso para ver proveedores

    Todos los usuarios autenticados con nivel 2+ pueden ver proveedores
    """

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Nivel 2+ (Coordinación) puede ver
        if request.user.has_cargo_level(2):
            return True

        return False


class CanManageCondicionesComerciales(permissions.BasePermission):
    """
    Permiso para gestionar condiciones comerciales de proveedores

    Roles permitidos:
    - Crear/Modificar: Líder Comercial (nivel 2+), Admin (nivel 3+)
    - Eliminar: Admin (nivel 3+)
    """

    message = 'No tiene permisos para gestionar condiciones comerciales.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Para lectura, nivel 2+
        if request.method in permissions.SAFE_METHODS:
            if request.user.has_cargo_level(2):
                return True

        # Para creación/modificación, nivel 2+
        if request.method in ['POST', 'PUT', 'PATCH']:
            if request.user.has_cargo_level(2):
                return True

        # Para eliminación, nivel 3+
        if request.method == 'DELETE':
            if request.user.has_cargo_level(3):
                return True

        return False
