"""
ViewSets para el Sistema RBAC Dinamico
Sistema de Gestion Grasas y Huesos del Norte

Este modulo contiene los ViewSets para la gestion de:
- Permisos (solo lectura)
- Roles (CRUD completo)
- Cargos extendidos (CRUD con permisos)
- Grupos (CRUD completo)
- Menu dinamico
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Count, Q
from collections import defaultdict

from .models import (
    Permiso, Role, RolePermiso, Cargo, CargoPermiso,
    Group, GroupRole, UserRole, UserGroup, User, MenuItem, CargoRole,
    RiesgoOcupacional, RolAdicional, RolAdicionalPermiso, UserRolAdicional
)
from .serializers_rbac import (
    PermisoListSerializer, PermisoDetailSerializer, PermissionGroupSerializer,
    RoleListSerializer, RoleDetailSerializer, RoleCreateSerializer, RoleUpdateSerializer,
    AssignPermissionsSerializer, RemovePermissionsSerializer,
    CargoListRBACSerializer, CargoDetailRBACSerializer, CargoCreateSerializer, CargoUpdateSerializer,
    GroupListSerializer, GroupDetailSerializer, GroupCreateSerializer, GroupUpdateSerializer,
    ManageGroupUsersSerializer,
    UserPermissionsSerializer, AssignRoleToUserSerializer, RemoveRoleFromUserSerializer,
    UserRolesListSerializer,
    MenuItemSerializer, MenuItemCreateSerializer,
    RBACStatsSerializer,
    RiesgoOcupacionalSerializer,
    # Serializers para RBAC Híbrido (Roles Adicionales)
    RolAdicionalListSerializer, RolAdicionalDetailSerializer,
    RolAdicionalCreateSerializer, RolAdicionalUpdateSerializer,
    UserRolAdicionalListSerializer, AsignarRolAdicionalSerializer,
    RevocarRolAdicionalSerializer, RolesSugeridosSerializer,
    UserPermisosEfectivosSerializer,
)
from .permissions import IsSuperAdmin, RequireCargoLevel


# =============================================================================
# PERMISSION VIEWSET
# =============================================================================

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para Permisos

    Los permisos son del sistema y no se pueden crear/eliminar desde la API
    Solo usuarios con nivel Coordinacion o superior pueden verlos

    Endpoints:
    - GET /api/core/permissions/ - Listar permisos
    - GET /api/core/permissions/{id}/ - Detalle de permiso
    - GET /api/core/permissions/modules/ - Listar modulos disponibles
    - GET /api/core/permissions/grouped/ - Permisos agrupados por modulo
    """

    queryset = Permiso.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['module', 'action', 'scope', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['module', 'action', 'created_at']
    ordering = ['module', 'action', 'scope']

    def get_serializer_class(self):
        if self.action == 'list':
            return PermisoListSerializer
        return PermisoDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrar solo activos por defecto
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset

    @action(detail=False, methods=['get'])
    def modules(self, request):
        """
        GET /api/core/permissions/modules/

        Retorna lista de modulos disponibles
        """
        modules = [
            {'value': code, 'label': label}
            for code, label in Permiso.MODULE_CHOICES
        ]
        return Response(modules)

    @action(detail=False, methods=['get'])
    def grouped(self, request):
        """
        GET /api/core/permissions/grouped/

        Retorna permisos agrupados por modulo
        """
        permisos = self.get_queryset()
        result = defaultdict(list)
        module_names = dict(Permiso.MODULE_CHOICES)

        for permiso in permisos:
            result[permiso.module].append(PermisoListSerializer(permiso).data)

        # Formatear respuesta
        grouped = [
            {
                'module': module,
                'module_name': module_names.get(module, module),
                'permissions': perms
            }
            for module, perms in result.items()
        ]

        return Response(grouped)


# =============================================================================
# ROLE VIEWSET
# =============================================================================

class RoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para Roles

    Solo usuarios con nivel Coordinacion o superior pueden gestionar roles

    Endpoints:
    - GET /api/core/roles/ - Listar roles
    - POST /api/core/roles/ - Crear rol
    - GET /api/core/roles/{id}/ - Detalle de rol
    - PATCH /api/core/roles/{id}/ - Actualizar rol
    - DELETE /api/core/roles/{id}/ - Soft delete de rol
    - POST /api/core/roles/{id}/assign-permissions/ - Asignar permisos
    - POST /api/core/roles/{id}/remove-permissions/ - Quitar permisos
    """

    queryset = Role.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_system']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return RoleListSerializer
        elif self.action == 'create':
            return RoleCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RoleUpdateSerializer
        elif self.action == 'assign_permissions':
            return AssignPermissionsSerializer
        elif self.action == 'remove_permissions':
            return RemovePermissionsSerializer
        return RoleDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        # Prefetch related para optimizar
        return queryset.prefetch_related('permisos', 'user_roles', 'groups')

    def perform_destroy(self, instance):
        """Soft delete - no permite eliminar roles del sistema"""
        if instance.is_system:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No se puede eliminar un rol del sistema')

        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def assign_permissions(self, request, pk=None):
        """
        POST /api/core/roles/{id}/assign-permissions/

        Body:
        {
            "permission_ids": [1, 2, 3],
            "replace": false  // true = reemplaza, false = agrega
        }
        """
        role = self.get_object()

        if role.is_system:
            return Response(
                {'error': 'No se pueden modificar permisos de roles del sistema'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AssignPermissionsSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        permission_ids = serializer.validated_data['permission_ids']
        replace = serializer.validated_data['replace']

        with transaction.atomic():
            # Si replace=True, eliminar permisos existentes
            if replace:
                RolePermiso.objects.filter(role=role).delete()

            # Agregar nuevos permisos
            permisos = Permiso.objects.filter(id__in=permission_ids, is_active=True)
            for permiso in permisos:
                RolePermiso.objects.get_or_create(
                    role=role,
                    permiso=permiso,
                    defaults={'granted_by': request.user}
                )

        # Retornar rol actualizado
        return Response(
            RoleDetailSerializer(role).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def remove_permissions(self, request, pk=None):
        """
        POST /api/core/roles/{id}/remove-permissions/

        Body:
        {
            "permission_ids": [1, 2, 3]
        }
        """
        role = self.get_object()

        if role.is_system:
            return Response(
                {'error': 'No se pueden modificar permisos de roles del sistema'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = RemovePermissionsSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        permission_ids = serializer.validated_data['permission_ids']

        # Eliminar relaciones
        deleted_count = RolePermiso.objects.filter(
            role=role,
            permiso_id__in=permission_ids
        ).delete()[0]

        return Response({
            'message': f'{deleted_count} permisos removidos exitosamente',
            'role': RoleDetailSerializer(role).data
        }, status=status.HTTP_200_OK)


# =============================================================================
# CARGO RBAC VIEWSET
# =============================================================================

class CargoRBACViewSet(viewsets.ModelViewSet):
    """
    ViewSet extendido para Cargos con gestion de permisos y manual de funciones

    Endpoints:
    - GET /api/core/cargos-rbac/ - Listar cargos
    - POST /api/core/cargos-rbac/ - Crear cargo
    - GET /api/core/cargos-rbac/{id}/ - Detalle completo con manual de funciones
    - PATCH /api/core/cargos-rbac/{id}/ - Actualizar
    - DELETE /api/core/cargos-rbac/{id}/ - Soft delete
    - POST /api/core/cargos-rbac/{id}/assign-permissions/ - Asignar permisos
    - POST /api/core/cargos-rbac/{id}/assign-roles/ - Asignar roles por defecto
    - POST /api/core/cargos-rbac/{id}/assign-riesgos/ - Asignar riesgos SST
    - GET /api/core/cargos-rbac/levels/ - Listar niveles jerarquicos
    - GET /api/core/cargos-rbac/areas/ - Listar areas disponibles
    - GET /api/core/cargos-rbac/choices/ - Todos los choices para formularios
    """

    queryset = Cargo.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['nivel_jerarquico', 'area', 'is_active', 'is_system', 'is_jefatura']
    search_fields = ['code', 'name', 'description', 'objetivo_cargo']
    ordering = ['nivel_jerarquico', 'name']

    def get_serializer_class(self):
        if self.action == 'list':
            return CargoListRBACSerializer
        elif self.action == 'create':
            return CargoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CargoUpdateSerializer
        return CargoDetailRBACSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset.select_related('parent_cargo', 'area', 'rol_sistema').prefetch_related(
            'permisos', 'default_roles', 'expuesto_riesgos'
        )

    def perform_destroy(self, instance):
        """Soft delete - valida que no tenga usuarios"""
        if instance.is_system:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No se puede eliminar un cargo del sistema')

        # Verificar si tiene usuarios asignados
        users_count = instance.usuarios.filter(is_active=True, deleted_at__isnull=True).count()
        if users_count > 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                f'No se puede eliminar el cargo porque tiene {users_count} usuario(s) asignado(s)'
            )

        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def assign_permissions(self, request, pk=None):
        """
        POST /api/core/cargos-rbac/{id}/assign-permissions/

        Body:
        {
            "permission_ids": [1, 2, 3],
            "replace": false
        }
        """
        cargo = self.get_object()
        serializer = AssignPermissionsSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        permission_ids = serializer.validated_data['permission_ids']
        replace = serializer.validated_data['replace']

        with transaction.atomic():
            if replace:
                CargoPermiso.objects.filter(cargo=cargo).delete()

            permisos = Permiso.objects.filter(id__in=permission_ids, is_active=True)
            for permiso in permisos:
                CargoPermiso.objects.get_or_create(
                    cargo=cargo,
                    permiso=permiso,
                    defaults={'granted_by': request.user}
                )

        return Response(
            CargoDetailRBACSerializer(cargo).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def assign_roles(self, request, pk=None):
        """
        POST /api/core/cargos-rbac/{id}/assign-roles/

        Body:
        {
            "role_ids": [1, 2, 3],
            "replace": false
        }
        """
        cargo = self.get_object()

        role_ids = request.data.get('role_ids', [])
        replace = request.data.get('replace', False)

        if not role_ids:
            return Response(
                {'error': 'Debe proporcionar al menos un rol'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            if replace:
                CargoRole.objects.filter(cargo=cargo).delete()

            roles = Role.objects.filter(id__in=role_ids, is_active=True)
            for role in roles:
                CargoRole.objects.get_or_create(cargo=cargo, role=role)

        return Response(
            CargoDetailRBACSerializer(cargo).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def assign_riesgos(self, request, pk=None):
        """
        POST /api/core/cargos-rbac/{id}/assign-riesgos/

        Body:
        {
            "riesgo_ids": [1, 2, 3],
            "replace": false
        }
        """
        cargo = self.get_object()
        riesgo_ids = request.data.get('riesgo_ids', [])
        replace = request.data.get('replace', False)

        if not riesgo_ids:
            return Response(
                {'error': 'Debe proporcionar al menos un riesgo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .models import RiesgoOcupacional as RiesgoModel

        with transaction.atomic():
            if replace:
                cargo.expuesto_riesgos.clear()

            riesgos = RiesgoModel.objects.filter(id__in=riesgo_ids, is_active=True)
            cargo.expuesto_riesgos.add(*riesgos)

        return Response(
            CargoDetailRBACSerializer(cargo).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def levels(self, request):
        """
        GET /api/core/cargos-rbac/levels/

        Retorna lista de niveles jerarquicos disponibles
        """
        levels = [
            {'value': code, 'label': label}
            for code, label in Cargo.NIVEL_JERARQUICO_CHOICES
        ]
        return Response(levels)

    @action(detail=False, methods=['get'])
    def areas(self, request):
        """
        GET /api/core/cargos-rbac/areas/

        Retorna lista de areas activas desde el modelo Area
        """
        from apps.gestion_estrategica.organizacion.models import Area as AreaModel

        areas = AreaModel.objects.filter(is_active=True).values('id', 'code', 'name')
        return Response([
            {'value': area['id'], 'label': f"{area['code']} - {area['name']}"}
            for area in areas
        ])

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """
        GET /api/core/cargos-rbac/choices/

        Retorna todos los choices disponibles para formularios de cargo
        """
        from apps.gestion_estrategica.organizacion.models import Area as AreaModel

        areas = AreaModel.objects.filter(is_active=True).values('id', 'code', 'name')

        return Response({
            'nivel_jerarquico_choices': [
                {'value': code, 'label': label}
                for code, label in Cargo.NIVEL_JERARQUICO_CHOICES
            ],
            'nivel_educativo_choices': [
                {'value': code, 'label': label}
                for code, label in Cargo.NIVEL_EDUCATIVO_CHOICES
            ],
            'experiencia_choices': [
                {'value': code, 'label': label}
                for code, label in Cargo.EXPERIENCIA_CHOICES
            ],
            'areas': [
                {'value': area['id'], 'label': f"{area['code']} - {area['name']}"}
                for area in areas
            ],
        })


# =============================================================================
# GROUP VIEWSET
# =============================================================================

class GroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para Grupos

    Endpoints:
    - GET /api/core/groups/ - Listar grupos
    - POST /api/core/groups/ - Crear grupo
    - GET /api/core/groups/{id}/ - Detalle de grupo
    - PATCH /api/core/groups/{id}/ - Actualizar grupo
    - DELETE /api/core/groups/{id}/ - Soft delete de grupo
    - POST /api/core/groups/{id}/add-users/ - Agregar usuarios
    - POST /api/core/groups/{id}/remove-users/ - Quitar usuarios
    - POST /api/core/groups/{id}/assign-roles/ - Asignar roles al grupo
    """

    queryset = Group.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return GroupListSerializer
        elif self.action == 'create':
            return GroupCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return GroupUpdateSerializer
        elif self.action in ['add_users', 'remove_users']:
            return ManageGroupUsersSerializer
        return GroupDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset.prefetch_related('roles', 'user_groups')

    def perform_destroy(self, instance):
        """Soft delete"""
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def add_users(self, request, pk=None):
        """
        POST /api/core/groups/{id}/add-users/

        Body:
        {
            "user_ids": [1, 2, 3],
            "leader_id": 1  // opcional
        }
        """
        group = self.get_object()
        serializer = ManageGroupUsersSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_ids = serializer.validated_data['user_ids']
        leader_id = serializer.validated_data.get('leader_id')

        # Validar usuarios
        users = User.objects.filter(
            id__in=user_ids,
            is_active=True,
            deleted_at__isnull=True
        )

        if users.count() != len(user_ids):
            return Response(
                {'error': 'Algunos usuarios no existen o estan inactivos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            for user in users:
                is_leader = (user.id == leader_id)
                UserGroup.objects.get_or_create(
                    user=user,
                    group=group,
                    defaults={
                        'assigned_by': request.user,
                        'is_leader': is_leader
                    }
                )

        return Response(
            GroupDetailSerializer(group).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def remove_users(self, request, pk=None):
        """
        POST /api/core/groups/{id}/remove-users/

        Body:
        {
            "user_ids": [1, 2, 3]
        }
        """
        group = self.get_object()
        serializer = ManageGroupUsersSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_ids = serializer.validated_data['user_ids']

        deleted_count = UserGroup.objects.filter(
            group=group,
            user_id__in=user_ids
        ).delete()[0]

        return Response({
            'message': f'{deleted_count} usuarios removidos del grupo',
            'group': GroupDetailSerializer(group).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def assign_roles(self, request, pk=None):
        """
        POST /api/core/groups/{id}/assign-roles/

        Body:
        {
            "role_ids": [1, 2, 3],
            "replace": false
        }
        """
        group = self.get_object()

        role_ids = request.data.get('role_ids', [])
        replace = request.data.get('replace', False)

        if not role_ids:
            return Response(
                {'error': 'Debe proporcionar al menos un rol'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            if replace:
                GroupRole.objects.filter(group=group).delete()

            roles = Role.objects.filter(id__in=role_ids, is_active=True)
            for role in roles:
                GroupRole.objects.get_or_create(
                    group=group,
                    role=role,
                    defaults={'assigned_by': request.user}
                )

        return Response(
            GroupDetailSerializer(group).data,
            status=status.HTTP_200_OK
        )


# =============================================================================
# MENU VIEWSET
# =============================================================================

class MenuViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Menu dinamico

    Endpoints:
    - GET /api/core/menus/ - Listar estructura de menu
    - POST /api/core/menus/ - Crear item de menu
    - GET /api/core/menus/{id}/ - Detalle de item
    - PATCH /api/core/menus/{id}/ - Actualizar item
    - DELETE /api/core/menus/{id}/ - Eliminar item
    - GET /api/core/menus/user-menu/ - Menu del usuario actual
    - PATCH /api/core/menus/reorder/ - Reordenar items
    """

    queryset = MenuItem.objects.filter(parent__isnull=True)
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['orden']

    def get_serializer_class(self):
        if self.action == 'create':
            return MenuItemCreateSerializer
        return MenuItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Solo items activos por defecto
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset.prefetch_related('children')

    @action(detail=False, methods=['get'])
    def user_menu(self, request):
        """
        GET /api/core/menus/user-menu/

        Retorna el menu filtrado por permisos del usuario actual
        """
        user = request.user
        menu_items = MenuItem.get_user_menu(user)

        return Response(MenuItemSerializer(menu_items, many=True).data)

    @action(detail=False, methods=['patch'])
    def reorder(self, request):
        """
        PATCH /api/core/menus/reorder/

        Body:
        {
            "items": [
                {"id": 1, "order": 0},
                {"id": 2, "order": 1},
                ...
            ]
        }
        """
        items = request.data.get('items', [])

        if not items:
            return Response(
                {'error': 'Debe proporcionar items para reordenar'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            for item_data in items:
                MenuItem.objects.filter(id=item_data['id']).update(orden=item_data.get('orden', item_data.get('order')))

        return Response({'message': 'Menu reordenado exitosamente'})


# =============================================================================
# RBAC STATS VIEWSET
# =============================================================================

class RBACStatsViewSet(viewsets.ViewSet):
    """
    ViewSet para estadisticas RBAC

    Endpoints:
    - GET /api/core/rbac/stats/ - Estadisticas generales
    """

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/core/rbac/stats/

        Retorna estadisticas generales del sistema RBAC
        """
        stats = {
            'total_cargos': Cargo.objects.count(),
            'active_cargos': Cargo.objects.filter(is_active=True).count(),
            'system_cargos': Cargo.objects.filter(is_system=True).count(),
            'total_roles': Role.objects.count(),
            'active_roles': Role.objects.filter(is_active=True).count(),
            'system_roles': Role.objects.filter(is_system=True).count(),
            'total_groups': Group.objects.count(),
            'active_groups': Group.objects.filter(is_active=True).count(),
            'total_permissions': Permiso.objects.count(),
            'active_permissions': Permiso.objects.filter(is_active=True).count(),
            'total_users': User.objects.filter(deleted_at__isnull=True).count(),
            'users_with_cargo': User.objects.filter(
                cargo__isnull=False,
                is_active=True,
                deleted_at__isnull=True
            ).count(),
        }

        return Response(stats)


# =============================================================================
# RIESGO OCUPACIONAL VIEWSET
# =============================================================================

class RiesgoOcupacionalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Riesgos Ocupacionales (Catalogo SST)

    Endpoints:
    - GET /api/core/riesgos-ocupacionales/ - Listar riesgos
    - POST /api/core/riesgos-ocupacionales/ - Crear riesgo
    - GET /api/core/riesgos-ocupacionales/{id}/ - Detalle
    - PATCH /api/core/riesgos-ocupacionales/{id}/ - Actualizar
    - DELETE /api/core/riesgos-ocupacionales/{id}/ - Soft delete
    - GET /api/core/riesgos-ocupacionales/clasificaciones/ - Listar clasificaciones GTC 45
    """

    queryset = RiesgoOcupacional.objects.all()
    serializer_class = RiesgoOcupacionalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['clasificacion', 'nivel_riesgo', 'is_active']
    search_fields = ['code', 'name', 'descripcion', 'fuente']
    ordering = ['clasificacion', 'code']
    # Deshabilitamos paginacion para este catalogo (78 riesgos fijos)
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()

        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset

    def perform_destroy(self, instance):
        """Soft delete - no elimina si tiene cargos asociados"""
        cargos_count = instance.cargos_expuestos.filter(is_active=True).count()
        if cargos_count > 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                f'No se puede eliminar el riesgo porque esta asignado a {cargos_count} cargo(s)'
            )

        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'])
    def clasificaciones(self, request):
        """
        GET /api/core/riesgos-ocupacionales/clasificaciones/

        Retorna lista de clasificaciones GTC 45
        """
        clasificaciones = [
            {'value': code, 'label': label}
            for code, label in RiesgoOcupacional.CLASIFICACION_CHOICES
        ]
        return Response(clasificaciones)

    @action(detail=False, methods=['get'])
    def niveles_riesgo(self, request):
        """
        GET /api/core/riesgos-ocupacionales/niveles-riesgo/

        Retorna lista de niveles de riesgo
        """
        niveles = [
            {'value': code, 'label': label}
            for code, label in RiesgoOcupacional.NIVEL_RIESGO_CHOICES
        ]
        return Response(niveles)


# =============================================================================
# ROL ADICIONAL VIEWSET (RBAC Híbrido)
# =============================================================================

class RolAdicionalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Roles Adicionales (Sistema RBAC Híbrido)

    Los roles adicionales son roles transversales que NO son cargos organizacionales.
    Ejemplos: COPASST, Brigadista, Auditor ISO, Aprobador de Compras, etc.

    Endpoints:
    - GET /api/core/roles-adicionales/ - Listar roles adicionales
    - POST /api/core/roles-adicionales/ - Crear rol adicional
    - GET /api/core/roles-adicionales/{id}/ - Detalle de rol adicional
    - PATCH /api/core/roles-adicionales/{id}/ - Actualizar rol adicional
    - DELETE /api/core/roles-adicionales/{id}/ - Eliminar rol adicional
    - GET /api/core/roles-adicionales/sugeridos/ - Plantillas de roles sugeridos
    - GET /api/core/roles-adicionales/tipos/ - Listar tipos de roles
    - GET /api/core/roles-adicionales/{id}/usuarios/ - Usuarios con este rol
    - POST /api/core/roles-adicionales/asignar/ - Asignar rol a usuario
    - POST /api/core/roles-adicionales/revocar/ - Revocar rol de usuario
    """

    queryset = RolAdicional.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'is_system', 'is_active', 'requiere_certificacion']
    search_fields = ['code', 'nombre', 'descripcion', 'justificacion_legal']
    ordering_fields = ['tipo', 'nombre', 'created_at']
    ordering = ['tipo', 'nombre']

    def get_serializer_class(self):
        if self.action == 'list':
            return RolAdicionalListSerializer
        elif self.action == 'retrieve':
            return RolAdicionalDetailSerializer
        elif self.action == 'create':
            return RolAdicionalCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RolAdicionalUpdateSerializer
        return RolAdicionalListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Por defecto solo activos
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        return queryset.select_related('created_by')

    def perform_destroy(self, instance):
        """
        No se pueden eliminar roles del sistema.
        Para roles normales, verificar si hay usuarios asignados.
        """
        if instance.is_system:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('No se pueden eliminar roles del sistema')

        usuarios_count = instance.usuarios_asignados.filter(is_active=True).count()
        if usuarios_count > 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                f'No se puede eliminar el rol porque está asignado a {usuarios_count} usuario(s). '
                'Revoque las asignaciones primero.'
            )

        # Soft delete
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'])
    def tipos(self, request):
        """
        GET /api/core/roles-adicionales/tipos/

        Retorna lista de tipos de roles adicionales
        """
        tipos = [
            {'value': code, 'label': label}
            for code, label in RolAdicional.TIPO_CHOICES
        ]
        return Response(tipos)

    @action(detail=False, methods=['get'])
    def sugeridos(self, request):
        """
        GET /api/core/roles-adicionales/sugeridos/

        Retorna plantillas de roles sugeridos (legales, sistemas de gestión, operativos)
        que pueden ser creados con un clic.
        """
        # Obtener roles que ya existen para marcarlos
        roles_existentes = set(
            RolAdicional.objects.values_list('code', flat=True)
        )

        plantillas = self._get_plantillas_roles()

        # Marcar cuáles ya existen
        for plantilla in plantillas:
            plantilla['ya_existe'] = plantilla['code'] in roles_existentes

        return Response(plantillas)

    def _get_plantillas_roles(self):
        """
        Retorna las plantillas de roles sugeridos según normativa colombiana.

        Basado en:
        - Decreto 1072/2015 (SG-SST)
        - Resolución 0312/2019 (Estándares mínimos SG-SST)
        - Resolución 2013/1986 (COPASST)
        - Resolución 652/2012 y 1356/2012 (COCOLA)
        - Resolución 1016/1989 (Brigadas)
        - Resolución 40595/2022 (PESV)
        - Normas ISO 9001, 14001, 45001
        """
        return [
            # =========================================
            # COPASST - Comité Paritario de SST
            # =========================================
            {
                'code': 'presidente_copasst',
                'nombre': 'Presidente del COPASST',
                'descripcion': 'Preside el Comité Paritario de Seguridad y Salud en el Trabajo. '
                              'Coordina reuniones mensuales, lidera investigación de accidentes '
                              'y firma actas oficiales.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 2013/1986, Decreto 1072/2015 Art. 2.2.4.6.24',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas SG-SST',
                'permisos_sugeridos': ['sst.view_list', 'sst.manage', 'sst.manage_investigations'],
            },
            {
                'code': 'secretario_copasst',
                'nombre': 'Secretario(a) del COPASST',
                'descripcion': 'Elabora las actas de reunión del COPASST, coordina citaciones '
                              'y gestiona documentación del comité.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 2013/1986, Decreto 1072/2015',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas SG-SST',
                'permisos_sugeridos': ['sst.view_list', 'sst.view_own'],
            },
            {
                'code': 'representante_trabajadores_copasst',
                'nombre': 'Representante de los Trabajadores COPASST',
                'descripcion': 'Representa a los trabajadores en el COPASST. Elegido por votación '
                              'de los trabajadores con voz y voto en las reuniones del comité.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 2013/1986, Decreto 1072/2015',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas SG-SST',
                'permisos_sugeridos': ['sst.view_list', 'sst.view_own'],
            },
            {
                'code': 'representante_direccion_copasst',
                'nombre': 'Representante de la Alta Dirección COPASST',
                'descripcion': 'Representa a la Alta Dirección en el COPASST. Designado por el '
                              'empleador con voz y voto en las reuniones del comité.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 2013/1986, Decreto 1072/2015',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas SG-SST',
                'permisos_sugeridos': ['sst.view_list', 'sst.view_own', 'sst.manage'],
            },
            {
                'code': 'vigia_sst',
                'nombre': 'Vigía SST',
                'descripcion': 'Vigía de Seguridad y Salud en el Trabajo para empresas con menos '
                              'de 10 trabajadores. Reemplaza al COPASST en estas empresas.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 0312/2019 Art. 4',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas SG-SST',
                'permisos_sugeridos': ['sst.view_list', 'sst.manage'],
            },
            # =========================================
            # COCOLA - Comité de Convivencia Laboral
            # =========================================
            {
                'code': 'presidente_cocola',
                'nombre': 'Presidente del COCOLA',
                'descripcion': 'Preside el Comité de Convivencia Laboral. Lidera reuniones '
                              'trimestrales y recibe quejas de acoso laboral.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 652/2012, Resolución 1356/2012',
                'requiere_certificacion': False,
                'certificacion_requerida': '',
                'permisos_sugeridos': ['users.view_list', 'sst.view_list'],
            },
            {
                'code': 'secretario_cocola',
                'nombre': 'Secretario(a) del COCOLA',
                'descripcion': 'Elabora las actas del COCOLA, gestiona documentación confidencial '
                              'y coordina citaciones del comité.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 652/2012, Resolución 1356/2012',
                'requiere_certificacion': False,
                'certificacion_requerida': '',
                'permisos_sugeridos': ['users.view_list'],
            },
            {
                'code': 'representante_trabajadores_cocola',
                'nombre': 'Representante de los Trabajadores COCOLA',
                'descripcion': 'Representa a los trabajadores en el COCOLA. Elegido por votación '
                              'de los trabajadores con voz y voto en las reuniones del comité.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 652/2012, Resolución 1356/2012',
                'requiere_certificacion': False,
                'certificacion_requerida': '',
                'permisos_sugeridos': ['users.view_list'],
            },
            {
                'code': 'representante_direccion_cocola',
                'nombre': 'Representante de la Alta Dirección COCOLA',
                'descripcion': 'Representa a la Alta Dirección en el COCOLA. Designado por el '
                              'empleador con voz y voto en las reuniones del comité.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 652/2012, Resolución 1356/2012',
                'requiere_certificacion': False,
                'certificacion_requerida': '',
                'permisos_sugeridos': ['users.view_list', 'sst.view_list'],
            },
            # =========================================
            # BRIGADAS DE EMERGENCIA
            # =========================================
            {
                'code': 'lider_brigada',
                'nombre': 'Líder de Brigada',
                'descripcion': 'Líder general de la brigada de emergencias. Coordina a todos los '
                              'líderes de área (incendios, evacuación, primeros auxilios) durante emergencias.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 1016/1989 Art. 11, Decreto 1072/2015',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso Brigadas de Emergencia (min. 40h) + Liderazgo',
                'permisos_sugeridos': ['sst.view_list', 'sst.manage'],
            },
            {
                'code': 'lider_control_incendios',
                'nombre': 'Líder Control de Incendios',
                'descripcion': 'Lidera el grupo de control de incendios. Coordina uso de extintores, '
                              'gabinetes y equipos contra incendio.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 1016/1989 Art. 11',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso Brigadas de Emergencia - Énfasis Incendios (min. 20h)',
                'permisos_sugeridos': ['sst.view_list'],
            },
            {
                'code': 'lider_evacuacion',
                'nombre': 'Líder Evacuación',
                'descripcion': 'Lidera el grupo de evacuación. Coordina rutas de evacuación, '
                              'puntos de encuentro y conteo de personal.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 1016/1989 Art. 11',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso Brigadas de Emergencia - Énfasis Evacuación (min. 20h)',
                'permisos_sugeridos': ['sst.view_list'],
            },
            {
                'code': 'lider_primeros_auxilios',
                'nombre': 'Líder Primeros Auxilios',
                'descripcion': 'Lidera el grupo de primeros auxilios. Coordina atención inicial '
                              'de lesionados y traslado a centros de atención.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 1016/1989 Art. 11',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso Primeros Auxilios Avanzados (min. 40h)',
                'permisos_sugeridos': ['sst.view_list'],
            },
            {
                'code': 'brigadista',
                'nombre': 'Brigadista',
                'descripcion': 'Integrante de brigada de emergencias. Capacitado en primeros auxilios, '
                              'evacuación y control de incendios básico.',
                'tipo': 'LEGAL_OBLIGATORIO',
                'tipo_display': 'Legal Obligatorio',
                'justificacion_legal': 'Resolución 1016/1989 Art. 11',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso Brigadas de Emergencia (min. 20h)',
                'permisos_sugeridos': ['sst.view_list'],
            },
            # =========================================
            # SISTEMAS DE GESTIÓN
            # =========================================
            {
                'code': 'lider_pesv',
                'nombre': 'Líder PESV',
                'descripcion': 'Líder del Plan Estratégico de Seguridad Vial. Coordina la '
                              'implementación y seguimiento del PESV organizacional.',
                'tipo': 'SISTEMA_GESTION',
                'tipo_display': 'Sistema de Gestión',
                'justificacion_legal': 'Resolución 40595/2022 (Mintransporte)',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas Seguridad Vial',
                'permisos_sugeridos': ['pesv.view_list', 'pesv.manage'],
            },
            {
                'code': 'auditor_interno_sig',
                'nombre': 'Auditor Interno ISO 9001 | 45001 | 14001',
                'descripcion': 'Auditor interno certificado para Sistema Integrado de Gestión: '
                              'Calidad (ISO 9001), SST (ISO 45001) y Ambiental (ISO 14001).',
                'tipo': 'SISTEMA_GESTION',
                'tipo_display': 'Sistema de Gestión',
                'justificacion_legal': 'ISO 9001:2015, ISO 45001:2018, ISO 14001:2015 Cláusula 9.2',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Formación Auditor Interno SIG (ISO 9001, 45001, 14001)',
                'permisos_sugeridos': ['sgc.view_list', 'sgc.manage_audits', 'sst.view_list', 'sst.manage_audits'],
            },
            {
                'code': 'responsable_sgsst',
                'nombre': 'Responsable del SG-SST',
                'descripcion': 'Responsable del diseño, implementación y mantenimiento del Sistema '
                              'de Gestión de Seguridad y Salud en el Trabajo.',
                'tipo': 'SISTEMA_GESTION',
                'tipo_display': 'Sistema de Gestión',
                'justificacion_legal': 'Decreto 1072/2015 Art. 2.2.4.6.8',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Licencia SST vigente',
                'permisos_sugeridos': ['sst.view_list', 'sst.manage', 'sst.approve'],
            },
            {
                'code': 'director_sig',
                'nombre': 'Director del Sistema Integrado de Gestión',
                'descripcion': 'Dirige el Sistema Integrado de Gestión organizacional. '
                              'Responsable de la integración de ISO 9001, 14001, 45001 y otros sistemas.',
                'tipo': 'SISTEMA_GESTION',
                'tipo_display': 'Sistema de Gestión',
                'justificacion_legal': 'ISO 9001:2015, ISO 14001:2015, ISO 45001:2018',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Formación en Sistemas Integrados de Gestión',
                'permisos_sugeridos': ['sgc.view_list', 'sgc.manage', 'sst.view_list', 'sst.manage', 'sga.view_list', 'sga.manage'],
            },
        ]

    @action(detail=True, methods=['get'])
    def usuarios(self, request, pk=None):
        """
        GET /api/core/roles-adicionales/{id}/usuarios/

        Retorna lista de usuarios asignados a este rol adicional
        """
        rol = self.get_object()
        asignaciones = rol.usuarios_asignados.filter(
            is_active=True
        ).select_related('user', 'assigned_by')

        serializer = UserRolAdicionalListSerializer(asignaciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def asignar(self, request):
        """
        POST /api/core/roles-adicionales/asignar/

        Asigna un rol adicional a un usuario

        Body:
        {
            "user_id": 1,
            "rol_adicional_id": 1,
            "expires_at": "2025-12-31T23:59:59Z",  # opcional
            "justificacion": "Asignado como miembro del COPASST 2025",
            "fecha_certificacion": "2024-06-15",  # requerido si rol requiere cert
            "certificacion_expira": "2026-06-15"  # opcional
        }
        """
        serializer = AsignarRolAdicionalSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        asignacion = serializer.save()

        return Response(
            UserRolAdicionalListSerializer(asignacion).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'])
    def revocar(self, request):
        """
        POST /api/core/roles-adicionales/revocar/

        Revoca un rol adicional de un usuario

        Body:
        {
            "user_id": 1,
            "rol_adicional_id": 1
        }
        """
        serializer = RevocarRolAdicionalSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        asignacion = serializer.validated_data['asignacion']
        asignacion.is_active = False
        asignacion.save()

        return Response({'message': 'Rol revocado exitosamente'})

    @action(detail=False, methods=['post'])
    def crear_desde_plantilla(self, request):
        """
        POST /api/core/roles-adicionales/crear-desde-plantilla/

        Crea un rol adicional a partir de una plantilla sugerida

        Body:
        {
            "code": "lider_copasst"  # código de la plantilla
        }
        """
        code = request.data.get('code')
        if not code:
            return Response(
                {'error': 'Se requiere el código de la plantilla'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que no exista
        if RolAdicional.objects.filter(code=code).exists():
            return Response(
                {'error': f'Ya existe un rol con el código {code}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar plantilla
        plantillas = {p['code']: p for p in self._get_plantillas_roles()}
        if code not in plantillas:
            return Response(
                {'error': f'No se encontró plantilla con código {code}'},
                status=status.HTTP_404_NOT_FOUND
            )

        plantilla = plantillas[code]

        # Crear rol
        with transaction.atomic():
            rol = RolAdicional.objects.create(
                code=plantilla['code'],
                nombre=plantilla['nombre'],
                descripcion=plantilla['descripcion'],
                tipo=plantilla['tipo'],
                justificacion_legal=plantilla.get('justificacion_legal', ''),
                requiere_certificacion=plantilla['requiere_certificacion'],
                certificacion_requerida=plantilla.get('certificacion_requerida', ''),
                is_system=True,  # Plantillas son del sistema
                created_by=request.user,
            )

            # Asignar permisos sugeridos si existen
            permisos_codes = plantilla.get('permisos_sugeridos', [])
            if permisos_codes:
                permisos = Permiso.objects.filter(code__in=permisos_codes, is_active=True)
                for permiso in permisos:
                    RolAdicionalPermiso.objects.create(
                        rol_adicional=rol,
                        permiso=permiso,
                        granted_by=request.user
                    )

        return Response(
            RolAdicionalDetailSerializer(rol).data,
            status=status.HTTP_201_CREATED
        )


# =============================================================================
# USER ROLES ADICIONALES VIEWSET
# =============================================================================

class UserRolesAdicionalesViewSet(viewsets.ViewSet):
    """
    ViewSet para gestionar roles adicionales de un usuario específico

    Endpoints:
    - GET /api/users/{user_id}/roles-adicionales/ - Listar roles del usuario
    - GET /api/users/{user_id}/permisos-efectivos/ - Permisos efectivos del usuario
    - GET /api/users/{user_id}/certificaciones-por-vencer/ - Certificaciones próximas a vencer
    """

    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='roles-adicionales')
    def roles_adicionales(self, request, pk=None):
        """
        GET /api/users/{user_id}/roles-adicionales/

        Retorna todos los roles adicionales del usuario
        """
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        asignaciones = user.usuarios_roles_adicionales.filter(
            is_active=True
        ).select_related('rol_adicional', 'assigned_by')

        serializer = UserRolAdicionalListSerializer(asignaciones, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='permisos-efectivos')
    def permisos_efectivos(self, request, pk=None):
        """
        GET /api/users/{user_id}/permisos-efectivos/

        Retorna todos los permisos efectivos del usuario desglosados por fuente
        """
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Permisos del cargo
        permisos_cargo = []
        if user.cargo:
            permisos_cargo = user.cargo.permisos.filter(is_active=True)

        # Permisos de roles adicionales (agrupados por rol)
        permisos_roles_adicionales = []
        for asignacion in user.get_roles_adicionales_activos():
            permisos_roles_adicionales.append({
                'rol_code': asignacion.rol_adicional.code,
                'rol_nombre': asignacion.rol_adicional.nombre,
                'permisos': PermisoListSerializer(
                    asignacion.rol_adicional.permisos.filter(is_active=True),
                    many=True
                ).data
            })

        # Permisos efectivos totales
        permisos_efectivos = user.get_all_permissions()

        data = {
            'user_id': user.id,
            'user_nombre': user.get_full_name(),
            'cargo': user.cargo.nombre if user.cargo else None,
            'permisos_cargo': PermisoListSerializer(permisos_cargo, many=True).data,
            'permisos_roles_adicionales': permisos_roles_adicionales,
            'permisos_efectivos': PermisoListSerializer(permisos_efectivos, many=True).data,
            'total_permisos': permisos_efectivos.count(),
        }

        return Response(data)

    @action(detail=True, methods=['get'], url_path='certificaciones-por-vencer')
    def certificaciones_por_vencer(self, request, pk=None):
        """
        GET /api/users/{user_id}/certificaciones-por-vencer/

        Retorna las certificaciones próximas a vencer (30 días por defecto)

        Query params:
        - dias: número de días para considerar (default: 30)
        """
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        dias = int(request.query_params.get('dias', 30))
        certificaciones = user.get_certificaciones_por_vencer(dias=dias)

        serializer = UserRolAdicionalListSerializer(certificaciones, many=True)
        return Response({
            'user_id': user.id,
            'user_nombre': user.get_full_name(),
            'dias_limite': dias,
            'certificaciones_por_vencer': serializer.data,
            'total': certificaciones.count(),
        })
