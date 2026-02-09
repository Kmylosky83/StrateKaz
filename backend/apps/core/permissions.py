"""
Permissions personalizados del módulo Core
Sistema de Gestión StrateKaz
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
    Permiso solo para SuperAdmin.

    Verifica por:
    1. TenantUser.is_superadmin (usuarios globales)
    2. User.cargo.code == 'ADMIN' (usuarios locales creados via HybridJWT)
    3. User.is_superuser (fallback legacy)
    """

    message = 'Solo SuperAdmin puede realizar esta operación.'

    def has_permission(self, request, view):
        """Verificar que sea SuperAdmin"""
        if not request.user or not request.user.is_authenticated:
            return False

        # TenantUser global (usado con TenantJWTAuthentication)
        if hasattr(request.user, 'is_superadmin'):
            return request.user.is_superadmin

        # User local con cargo ADMIN (creado via HybridJWTAuthentication)
        if hasattr(request.user, 'cargo') and request.user.cargo:
            if request.user.cargo.code == 'ADMIN':
                return True

        # Fallback legacy
        return request.user.is_superuser


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


# =============================================================================
# SISTEMA RBAC DINÁMICO - Permisos Reutilizables
# =============================================================================

class RequirePermission(permissions.BasePermission):
    """
    Permiso genérico basado en código de permiso

    Uso en ViewSet:
        permission_classes = [RequirePermission]
        required_permission = 'recolecciones.create'

        # O con mapeo por acción
        permission_map = {
            'list': 'recolecciones.view_list',
            'create': 'recolecciones.create',
            'update': 'recolecciones.edit',
            'destroy': 'recolecciones.delete',
        }

    Uso en APIView:
        permission_classes = [RequirePermission]
        required_permission = 'recolecciones.view_list'
    """

    message = 'No tiene permisos para realizar esta acción.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # Obtener permiso según la acción (ViewSet) o permiso único (APIView)
        permission_code = self._get_permission_code(request, view)

        if not permission_code:
            # Si no hay permiso definido, denegar por seguridad
            return False

        return request.user.has_permission(permission_code)

    def _get_permission_code(self, request, view):
        """Obtiene el código de permiso según la vista y acción"""
        # Intentar obtener del mapeo por acción
        permission_map = getattr(view, 'permission_map', {})
        action = getattr(view, 'action', None)

        if action and action in permission_map:
            return permission_map[action]

        # Fallback a permiso único
        return getattr(view, 'required_permission', None)


class RequireAnyPermission(permissions.BasePermission):
    """
    Requiere al menos uno de los permisos especificados

    Uso:
        permission_classes = [RequireAnyPermission]
        required_permissions = ['recolecciones.view_list', 'recolecciones.view_own']
    """

    message = 'No tiene ninguno de los permisos requeridos.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        required_permissions = getattr(view, 'required_permissions', [])

        if not required_permissions:
            return False

        return request.user.has_any_permission(required_permissions)


class RequireAllPermissions(permissions.BasePermission):
    """
    Requiere todos los permisos especificados

    Uso:
        permission_classes = [RequireAllPermissions]
        required_permissions = ['recolecciones.view_list', 'recolecciones.approve']
    """

    message = 'No tiene todos los permisos requeridos.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        required_permissions = getattr(view, 'required_permissions', [])

        if not required_permissions:
            return False

        return request.user.has_all_permissions(required_permissions)


class RequireRole(permissions.BasePermission):
    """
    Requiere un rol específico

    Uso:
        permission_classes = [RequireRole]
        required_role = 'aprobador_recolecciones'

        # O con mapeo por acción
        role_map = {
            'approve': 'aprobador_recolecciones',
            'reject': 'aprobador_recolecciones',
        }
    """

    message = 'No tiene el rol requerido para esta acción.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # Obtener rol según la acción o rol único
        role_map = getattr(view, 'role_map', {})
        action = getattr(view, 'action', None)

        role_code = None
        if action and action in role_map:
            role_code = role_map[action]
        else:
            role_code = getattr(view, 'required_role', None)

        if not role_code:
            return False

        return request.user.has_role(role_code)


class RequireCargo(permissions.BasePermission):
    """
    Requiere un cargo específico o lista de cargos

    Uso:
        permission_classes = [RequireCargo]
        required_cargo = 'lider_com_econorte'

        # O múltiples cargos
        required_cargos = ['lider_com_econorte', 'gerente_general']
    """

    message = 'No tiene el cargo requerido para esta acción.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # Verificar cargo único
        required_cargo = getattr(view, 'required_cargo', None)
        if required_cargo:
            return request.user.has_cargo(required_cargo)

        # Verificar múltiples cargos (cualquiera)
        required_cargos = getattr(view, 'required_cargos', [])
        if required_cargos:
            return any(request.user.has_cargo(cargo) for cargo in required_cargos)

        return False


class RequireGroup(permissions.BasePermission):
    """
    Requiere pertenencia a un grupo específico

    Uso:
        permission_classes = [RequireGroup]
        required_group = 'equipo_recolecciones'
    """

    message = 'No pertenece al grupo requerido.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        required_group = getattr(view, 'required_group', None)

        if not required_group:
            return False

        return request.user.is_in_group(required_group)


class RequireCargoLevel(permissions.BasePermission):
    """
    Requiere un nivel jerárquico mínimo

    Uso:
        permission_classes = [RequireCargoLevel]
        required_level = 2  # 0=Operativo, 1=Supervisión, 2=Coordinación, 3=Dirección
    """

    message = 'No tiene el nivel jerárquico requerido.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        required_level = getattr(view, 'required_level', None)

        if required_level is None:
            return False

        return request.user.has_cargo_level(required_level)


# =============================================================================
# PERMISOS RBAC BASADOS EN CARGO - Acceso UI y CRUD
# =============================================================================

class RequireSectionAccess(permissions.BasePermission):
    """
    Valida que el usuario tenga acceso a la sección correspondiente
    basado en CargoSectionAccess.

    Uso en ViewSet:
        permission_classes = [IsAuthenticated, RequireSectionAccess]
        section_code = 'identidad_corporativa'  # Código de la sección

        # O usar section_id directamente
        section_id = 5
    """

    message = 'No tiene acceso a esta sección del sistema.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Super usuario tiene acceso total
        if request.user.is_superuser:
            return True

        # Obtener código o ID de sección del view
        section_code = getattr(view, 'section_code', None)
        section_id = getattr(view, 'section_id', None)

        if not section_code and not section_id:
            # Sin configuración de sección, permitir (backwards compatibility)
            return True

        cargo = getattr(request.user, 'cargo', None)
        if not cargo:
            return False

        from .models import CargoSectionAccess, TabSection

        if section_id:
            return CargoSectionAccess.objects.filter(
                cargo=cargo,
                section_id=section_id
            ).exists()

        if section_code:
            return CargoSectionAccess.objects.filter(
                cargo=cargo,
                section__code=section_code
            ).exists()

        return False


class RequireCRUDPermission(permissions.BasePermission):
    """
    Valida permisos CRUD dinámicos por acción basado en CargoPermiso.

    Uso en ViewSet:
        permission_classes = [IsAuthenticated, RequireCRUDPermission]
        permission_module = 'gestion_estrategica'
        permission_resource = 'politica'

        # Opcionalmente, mapear acciones personalizadas:
        permission_action_map = {
            'approve': 'update',
            'publish': 'update',
            'archive': 'delete',
        }
    """

    message = 'No tiene permiso para realizar esta acción.'

    # Mapeo estándar de acciones DRF a permisos CRUD
    DEFAULT_ACTION_MAP = {
        'list': 'view',
        'retrieve': 'view',
        'create': 'create',
        'update': 'update',
        'partial_update': 'update',
        'destroy': 'delete',
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # Obtener configuración del view
        module = getattr(view, 'permission_module', None)
        resource = getattr(view, 'permission_resource', None)

        if not module or not resource:
            # Sin configuración, permitir (backwards compatibility)
            return True

        # Determinar acción
        action = getattr(view, 'action', None)
        if not action:
            # Para APIViews sin action, usar el método HTTP
            method_map = {
                'GET': 'view',
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'update',
                'DELETE': 'delete',
            }
            action = method_map.get(request.method, 'view')
        else:
            # Para ViewSets, mapear la acción
            custom_map = getattr(view, 'permission_action_map', {})
            action_map = {**self.DEFAULT_ACTION_MAP, **custom_map}
            action = action_map.get(action, action)

        # Construir código de permiso
        permission_code = f"{module}.{resource}.{action}"

        # Verificar permiso usando el método del usuario
        return request.user.has_permission(permission_code)


class RequireSectionAndCRUD(permissions.BasePermission):
    """
    Combina validación de acceso a sección Y permiso CRUD.
    El usuario debe tener ambos para acceder.

    Uso en ViewSet:
        permission_classes = [IsAuthenticated, RequireSectionAndCRUD]
        section_code = 'politicas'
        permission_module = 'gestion_estrategica'
        permission_resource = 'politica'
    """

    message = 'No tiene acceso o permiso para esta operación.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # Verificar acceso a sección
        section_check = RequireSectionAccess()
        if not section_check.has_permission(request, view):
            self.message = section_check.message
            return False

        # Verificar permiso CRUD
        crud_check = RequireCRUDPermission()
        if not crud_check.has_permission(request, view):
            self.message = crud_check.message
            return False

        return True



class GranularActionPermission(permissions.BasePermission):
    """
    Permiso granular basado en CargoSectionAccess (RBAC v4.1).

    Verifica las banderas booleanas can_view, can_create, can_edit, can_delete
    combinando permisos de múltiples fuentes:
    1. Cargo base (CargoSectionAccess)
    2. Roles Adicionales (futura implementación)
    3. Grupos (futura implementación)

    Lógica OR: Si CUALQUIER fuente tiene el permiso, se permite.

    Uso en ViewSet:
        permission_classes = [GranularActionPermission]
        section_code = 'identidad_corporativa'

        # Opcional: mapeo de acciones personalizadas
        granular_action_map = {
            'enviar': 'enviar',
            'aprobar': 'aprobar',
        }

    Mejoras v4.1:
    - Usa CombinedPermissionService para combinar permisos
    - Soporte para cache de permisos
    - Mejor logging de denegaciones
    """

    message = 'No tiene permiso granular para realizar esta acción.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusuario siempre tiene acceso
        if request.user.is_superuser:
            return True

        # Determinar acción requerida
        required_flag = self._get_required_flag(request, view)
        if not required_flag:
            return False

        # Identificar sección
        section_code = getattr(view, 'section_code', None)
        section_id = getattr(view, 'section_id', None)

        if not section_code and not section_id:
            # Si la vista no define sección, este permiso no aplica
            return False

        # Usar el servicio de permisos combinados (v4.1)
        try:
            from apps.core.services.permission_service import CombinedPermissionService

            has_access = CombinedPermissionService.check_section_permission(
                user=request.user,
                section_code=section_code,
                section_id=section_id,
                required_permission=required_flag
            )

            if not has_access:
                self.message = (
                    f'No tiene permiso "{required_flag}" en la sección '
                    f'"{section_code or section_id}".'
                )

            return has_access

        except ImportError:
            # Fallback al método legacy si el servicio no está disponible
            return self._legacy_check(request, view, section_code, section_id, required_flag)

    def _get_required_flag(self, request, view) -> str | None:
        """Determina el flag de permiso requerido basándose en la acción o método HTTP."""
        required_flag = None

        # 1. Buscar mapeo específico por acción en la vista
        granular_action_map = getattr(view, 'granular_action_map', {})
        if hasattr(view, 'action') and view.action in granular_action_map:
            required_flag = granular_action_map[view.action]

        # 2. Fallback al mapeo por método HTTP
        if not required_flag:
            method_action_map = {
                'GET': 'can_view',
                'OPTIONS': 'can_view',
                'HEAD': 'can_view',
                'POST': 'can_create',
                'PUT': 'can_edit',
                'PATCH': 'can_edit',
                'DELETE': 'can_delete'
            }
            required_flag = method_action_map.get(request.method)

        return required_flag

    def _legacy_check(self, request, view, section_code, section_id, required_flag) -> bool:
        """
        Método legacy de verificación de permisos (pre v4.1).

        Se mantiene como fallback por compatibilidad.
        """
        cargo = getattr(request.user, 'cargo', None)
        if not cargo:
            return False

        from .models import CargoSectionAccess

        # Consultar acceso
        access_query = CargoSectionAccess.objects.filter(cargo=cargo)

        if section_id:
            access_query = access_query.filter(section_id=section_id)
        elif section_code:
            access_query = access_query.filter(section__code=section_code)

        access = access_query.first()

        if not access:
            return False

        # Verificar la bandera especifica
        if required_flag in ['can_view', 'can_create', 'can_edit', 'can_delete']:
            return getattr(access, required_flag, False)

        # Acción personalizada en JSONField
        custom_actions = getattr(access, 'custom_actions', {}) or {}
        return bool(custom_actions.get(required_flag, False))


# =============================================================================
# DECORADORES PARA VISTAS BASADAS EN FUNCIONES
# =============================================================================

def require_permission(permission_code):
    """
    Decorador para requerir un permiso específico

    Uso:
        @api_view(['POST'])
        @require_permission('recolecciones.create')
        def create_recoleccion(request):
            ...
    """
    def decorator(func):
        def wrapped_view(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {'detail': 'Autenticación requerida.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not request.user.is_superuser and not request.user.has_permission(permission_code):
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {'detail': f'No tiene permiso: {permission_code}'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return func(request, *args, **kwargs)
        return wrapped_view
    return decorator


def require_any_permission(*permission_codes):
    """
    Decorador para requerir al menos uno de los permisos

    Uso:
        @api_view(['GET'])
        @require_any_permission('recolecciones.view_list', 'recolecciones.view_own')
        def list_recolecciones(request):
            ...
    """
    def decorator(func):
        def wrapped_view(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {'detail': 'Autenticación requerida.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not request.user.is_superuser and not request.user.has_any_permission(permission_codes):
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {'detail': 'No tiene ninguno de los permisos requeridos.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return func(request, *args, **kwargs)
        return wrapped_view
    return decorator


def require_role(role_code):
    """
    Decorador para requerir un rol específico

    Uso:
        @api_view(['POST'])
        @require_role('aprobador_recolecciones')
        def approve_recoleccion(request, pk):
            ...
    """
    def decorator(func):
        def wrapped_view(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {'detail': 'Autenticación requerida.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not request.user.is_superuser and not request.user.has_role(role_code):
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {'detail': f'No tiene el rol: {role_code}'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return func(request, *args, **kwargs)
        return wrapped_view
    return decorator


def require_cargo(cargo_code):
    """
    Decorador para requerir un cargo específico

    Uso:
        @api_view(['GET'])
        @require_cargo('gerente_general')
        def get_dashboard(request):
            ...
    """
    def decorator(func):
        def wrapped_view(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {'detail': 'Autenticación requerida.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not request.user.is_superuser and not request.user.has_cargo(cargo_code):
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {'detail': f'No tiene el cargo: {cargo_code}'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return func(request, *args, **kwargs)
        return wrapped_view
    return decorator


def require_level(min_level):
    """
    Decorador para requerir un nivel jerárquico mínimo

    Uso:
        @api_view(['DELETE'])
        @require_level(2)  # Coordinación o superior
        def delete_record(request, pk):
            ...
    """
    def decorator(func):
        def wrapped_view(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {'detail': 'Autenticación requerida.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not request.user.is_superuser and not request.user.has_cargo_level(min_level):
                from rest_framework.response import Response
                from rest_framework import status
                level_names = {0: 'Operativo', 1: 'Supervisión', 2: 'Coordinación', 3: 'Dirección'}
                return Response(
                    {'detail': f'Se requiere nivel: {level_names.get(min_level, min_level)}'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return func(request, *args, **kwargs)
        return wrapped_view
    return decorator
