"""
Permissions personalizados para Gestión de Proveedores - Supply Chain
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import permissions


class CanManageCatalogos(permissions.BasePermission):
    """
    Permiso para gestionar catálogos dinámicos.

    Roles permitidos:
    - Ver catálogos: Cualquier usuario autenticado
    - Crear/Modificar/Eliminar: Admin (nivel 3+), SuperAdmin
    """

    message = 'No tiene permisos para gestionar catálogos. Se requiere cargo de Administrador o superior.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista."""
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Para lectura (GET), permitir a cualquier usuario autenticado
        if request.method in permissions.SAFE_METHODS:
            return True

        # Para creación/modificación/eliminación, requiere nivel 3+ (Dirección)
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            if hasattr(request.user, 'has_cargo_level'):
                return request.user.has_cargo_level(3)
            return False

        return False


class CanManageProveedores(permissions.BasePermission):
    """
    Permiso para gestionar proveedores.

    Roles permitidos:
    - Crear proveedores: Líder Comercial (nivel 2), Admin (nivel 3), Gerente (nivel 3), SuperAdmin
    - Ver todos: Gerente (nivel 3), SuperAdmin, Admin (nivel 3)
    - Ver asignados: Líder Comercial (nivel 2)
    - Modificar: Líder Comercial (nivel 2+), Admin (nivel 3+)

    IMPORTANTE: Modificar PRECIO solo Gerente/SuperAdmin (ver CanModifyPrecioProveedor)
    """

    message = 'No tiene permisos para gestionar proveedores. Se requiere cargo de Líder Comercial o superior.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista."""
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Verificar método has_cargo_level
        if not hasattr(request.user, 'has_cargo_level'):
            return False

        # Para lectura (GET), permitir desde nivel 2+ (Coordinación)
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_cargo_level(2)

        # Para creación/modificación (POST, PUT, PATCH)
        if request.method in ['POST', 'PUT', 'PATCH']:
            return request.user.has_cargo_level(2)

        # Para eliminación (DELETE), requiere nivel 3+ (Dirección)
        if request.method == 'DELETE':
            return request.user.has_cargo_level(3)

        return False

    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto."""
        if request.user.is_superuser:
            return True

        if not hasattr(request.user, 'has_cargo_level'):
            return False

        # Para lectura, nivel 2+
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_cargo_level(2)

        # Para modificación, nivel 2+
        if request.method in ['PUT', 'PATCH']:
            return request.user.has_cargo_level(2)

        # Para eliminación, nivel 3+
        if request.method == 'DELETE':
            return request.user.has_cargo_level(3)

        return False


class CanModifyPrecioProveedor(permissions.BasePermission):
    """
    Permiso para modificar precio de proveedores de materia prima.

    CRÍTICO: SOLO Gerente o SuperAdmin pueden modificar precios
    Nivel 3+ (Dirección - Gerente)
    """

    message = 'Solo el Gerente o SuperAdmin pueden modificar precios de proveedores.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista."""
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin siempre puede
        if request.user.is_superuser:
            return True

        # Verificar cargo específico GERENTE
        if hasattr(request.user, 'cargo') and request.user.cargo:
            if request.user.cargo.code == 'GERENTE':
                return True

        # Verificar nivel 3+ (Dirección)
        if hasattr(request.user, 'has_cargo_level'):
            return request.user.has_cargo_level(3)

        return False


class CanManageUnidadesNegocio(permissions.BasePermission):
    """
    Permiso para gestionar unidades de negocio.

    Solo Admin (nivel 3) y SuperAdmin pueden gestionar unidades de negocio.
    """

    message = 'Solo Administradores y SuperAdmin pueden gestionar unidades de negocio.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista."""
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        if not hasattr(request.user, 'has_cargo_level'):
            return False

        # Para lectura (GET), permitir desde nivel 2+ (Coordinación)
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_cargo_level(2)

        # Para creación/modificación/eliminación, requiere nivel 3+ (Dirección)
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return request.user.has_cargo_level(3)

        return False


class CanViewProveedores(permissions.BasePermission):
    """
    Permiso para ver proveedores.

    Todos los usuarios autenticados con nivel 2+ pueden ver proveedores.
    """

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista."""
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        # Nivel 2+ (Coordinación) puede ver
        if hasattr(request.user, 'has_cargo_level'):
            return request.user.has_cargo_level(2)

        return False


class CanManageCondicionesComerciales(permissions.BasePermission):
    """
    Permiso para gestionar condiciones comerciales de proveedores.

    Roles permitidos:
    - Crear/Modificar: Líder Comercial (nivel 2+), Admin (nivel 3+)
    - Eliminar: Admin (nivel 3+)
    """

    message = 'No tiene permisos para gestionar condiciones comerciales.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista."""
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        if not hasattr(request.user, 'has_cargo_level'):
            return False

        # Para lectura, nivel 2+
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_cargo_level(2)

        # Para creación/modificación, nivel 2+
        if request.method in ['POST', 'PUT', 'PATCH']:
            return request.user.has_cargo_level(2)

        # Para eliminación, nivel 3+
        if request.method == 'DELETE':
            return request.user.has_cargo_level(3)

        return False


class CanManageEvaluaciones(permissions.BasePermission):
    """
    Permiso para gestionar evaluaciones de proveedores.

    Roles permitidos:
    - Ver evaluaciones: Nivel 2+ (Coordinación)
    - Crear/Modificar: Nivel 2+ (Coordinación)
    - Aprobar: Nivel 3+ (Dirección)
    - Eliminar: Nivel 3+ (Dirección)
    """

    message = 'No tiene permisos para gestionar evaluaciones de proveedores.'

    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista."""
        if not request.user or not request.user.is_authenticated:
            return False

        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True

        if not hasattr(request.user, 'has_cargo_level'):
            return False

        # Para lectura, nivel 2+
        if request.method in permissions.SAFE_METHODS:
            return request.user.has_cargo_level(2)

        # Para creación/modificación, nivel 2+
        if request.method in ['POST', 'PUT', 'PATCH']:
            return request.user.has_cargo_level(2)

        # Para eliminación, nivel 3+
        if request.method == 'DELETE':
            return request.user.has_cargo_level(3)

        return False
