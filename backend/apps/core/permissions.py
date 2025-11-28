"""
Permissions personalizados del módulo Core
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import permissions


class CanManageUsers(permissions.BasePermission):
    """
    Permiso para gestionar usuarios
    
    Solo usuarios con nivel 2+ (Coordinación y Dirección) pueden:
    - Crear usuarios
    - Editar usuarios
    - Eliminar usuarios
    
    SuperAdmin siempre tiene permiso
    """
    
    message = 'No tiene permisos para gestionar usuarios. Se requiere cargo de nivel Coordinación o superior.'
    
    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        # Verificar que el usuario esté autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True
        
        # Verificar que el usuario tenga nivel mínimo 2
        if request.user.has_cargo_level(2):
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto"""
        # Verificar que el usuario esté autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True
        
        # Verificar que el usuario tenga nivel mínimo 2
        if request.user.has_cargo_level(2):
            return True
        
        return False


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permiso para que solo el propietario o admin pueda acceder/modificar
    
    Útil para endpoints donde un usuario solo puede modificar sus propios datos
    """
    
    message = 'Solo puede acceder a sus propios datos o ser administrador.'
    
    def has_object_permission(self, request, view, obj):
        """Verificar que sea el propietario o admin"""
        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True
        
        # Admin (nivel 2+) tiene acceso
        if request.user.has_cargo_level(2):
            return True
        
        # Verificar si es el propietario
        # El objeto debe tener un atributo 'user' o 'created_by'
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False


class IsActiveUser(permissions.BasePermission):
    """
    Permiso para verificar que el usuario esté activo y no eliminado
    """
    
    message = 'Su cuenta está inactiva o ha sido eliminada. Contacte al administrador.'
    
    def has_permission(self, request, view):
        """Verificar que el usuario esté activo"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Verificar que esté activo
        if not request.user.is_active:
            return False
        
        # Verificar que no esté eliminado lógicamente
        if request.user.is_deleted:
            return False
        
        return True


class CanViewUsers(permissions.BasePermission):
    """
    Permiso para ver usuarios
    
    Todos los usuarios autenticados pueden ver la lista de usuarios
    """
    
    def has_permission(self, request, view):
        """Verificar permiso a nivel de vista"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Verificar permiso a nivel de objeto"""
        # Todos pueden ver usuarios
        if request.user and request.user.is_authenticated:
            return True
        
        return False


class HasModulePermission(permissions.BasePermission):
    """
    Permiso basado en el sistema de permisos del modelo
    
    Uso:
        class MyViewSet(viewsets.ModelViewSet):
            permission_code = 'USERS_MANAGE'  # Código del permiso requerido
    """
    
    def has_permission(self, request, view):
        """Verificar si el usuario tiene el permiso del módulo"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # SuperAdmin tiene todos los permisos
        if request.user.is_superuser:
            return True
        
        # Obtener código de permiso de la vista
        permission_code = getattr(view, 'permission_code', None)
        if not permission_code:
            # Si no se especifica permiso, denegar por defecto
            return False
        
        # Verificar si el usuario tiene el permiso
        return request.user.has_permission(permission_code)


class IsSuperAdmin(permissions.BasePermission):
    """
    Permiso solo para SuperAdmin
    
    Para operaciones críticas del sistema
    """
    
    message = 'Solo SuperAdmin puede realizar esta operación.'
    
    def has_permission(self, request, view):
        """Verificar que sea SuperAdmin"""
        return request.user and request.user.is_superuser


class CanManageCargos(permissions.BasePermission):
    """
    Permiso para gestionar cargos
    
    Solo SuperAdmin puede gestionar cargos
    """
    
    message = 'Solo SuperAdmin puede gestionar cargos.'
    
    def has_permission(self, request, view):
        """Verificar permiso"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.is_superuser


class CanManagePermissions(permissions.BasePermission):
    """
    Permiso para gestionar permisos
    
    Solo SuperAdmin puede gestionar permisos
    """
    
    message = 'Solo SuperAdmin puede gestionar permisos.'
    
    def has_permission(self, request, view):
        """Verificar permiso"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.is_superuser
