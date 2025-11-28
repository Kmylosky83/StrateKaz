"""
ViewSets del módulo Core - API REST
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count

from .models import User, Cargo, Permiso, CargoPermiso
from .serializers import (
    CargoSerializer,
    UserListSerializer,
    UserDetailSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    PermisoSerializer,
    CargoPermisoSerializer,
)
from .permissions import CanManageUsers


class CargoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para Cargos
    
    Endpoints:
    - GET /api/core/cargos/ - Lista de cargos activos
    - GET /api/core/cargos/{id}/ - Detalle de cargo
    """
    queryset = Cargo.objects.all()
    serializer_class = CargoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['level', 'is_active', 'parent_cargo']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['level', 'name', 'created_at']
    ordering = ['level', 'name']

    def get_queryset(self):
        """Filtrar solo cargos activos por defecto"""
        queryset = super().get_queryset()
        
        # Si se especifica include_inactive=true, mostrar todos
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)
        
        return queryset.select_related('parent_cargo')


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para Usuarios
    
    Endpoints:
    - GET /api/core/users/ - Lista de usuarios
    - POST /api/core/users/ - Crear usuario (requiere permisos)
    - GET /api/core/users/{id}/ - Detalle de usuario
    - PUT /api/core/users/{id}/ - Actualizar usuario completo
    - PATCH /api/core/users/{id}/ - Actualizar usuario parcial
    - DELETE /api/core/users/{id}/ - Soft delete de usuario
    - POST /api/core/users/{id}/change_password/ - Cambiar contraseña
    - POST /api/core/users/{id}/restore/ - Restaurar usuario eliminado
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['cargo', 'cargo__code', 'is_active', 'is_staff', 'document_type']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'document_number']
    ordering_fields = ['date_joined', 'username', 'last_name']
    ordering = ['-date_joined']
    
    def get_queryset(self):
        """Excluir usuarios eliminados por defecto"""
        queryset = super().get_queryset()
        
        # Excluir eliminados lógicamente
        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)
        
        return queryset.select_related('cargo', 'created_by')

    def get_serializer_class(self):
        """Retornar serializer según la acción"""
        if self.action == 'list':
            return UserListSerializer
        elif self.action in ['create']:
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        elif self.action == 'change_password':
            return ChangePasswordSerializer
        else:
            return UserDetailSerializer

    def get_permissions(self):
        """Permisos según la acción"""
        if self.action in ['create', 'destroy', 'restore']:
            permission_classes = [IsAuthenticated, CanManageUsers]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]

    def perform_destroy(self, instance):
        """Soft delete en lugar de eliminación física"""
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        """
        Cambiar contraseña de usuario
        
        POST /api/core/users/{id}/change_password/
        {
            "old_password": "contraseña_actual",
            "new_password": "nueva_contraseña",
            "confirm_password": "nueva_contraseña"
        }
        """
        user = self.get_object()
        
        # Solo el propio usuario o admin pueden cambiar contraseña
        if request.user.id != user.id and not request.user.has_cargo_level(2):
            return Response(
                {'error': 'No tiene permiso para cambiar esta contraseña'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'user': user}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Contraseña actualizada exitosamente'},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanManageUsers])
    def restore(self, request, pk=None):
        """
        Restaurar usuario eliminado lógicamente
        
        POST /api/core/users/{id}/restore/
        """
        user = self.get_object()
        
        if not user.is_deleted:
            return Response(
                {'error': 'El usuario no está eliminado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.restore()
        
        serializer = UserDetailSerializer(user)
        return Response(
            {
                'message': 'Usuario restaurado exitosamente',
                'user': serializer.data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def comerciales(self, request):
        """
        Obtener lista de comerciales activos para asignación de ecoaliados

        GET /api/core/users/comerciales/

        Retorna usuarios con cargos: lider_com_econorte, comercial_econorte
        """
        comerciales = User.objects.filter(
            Q(cargo__code='lider_com_econorte') | Q(cargo__code='comercial_econorte'),
            is_active=True,
            deleted_at__isnull=True
        ).select_related('cargo').order_by('first_name', 'last_name')

        # Formato simplificado para dropdown
        data = [{
            'id': user.id,
            'nombre_completo': user.get_full_name() or user.username,
            'cargo': user.cargo.name if user.cargo else 'Sin cargo',
            'username': user.username
        } for user in comerciales]

        return Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Obtener información del usuario actual
        
        GET /api/core/users/me/
        """
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Obtener estadísticas de usuarios
        
        GET /api/core/users/stats/
        """
        total_users = User.objects.filter(deleted_at__isnull=True).count()
        active_users = User.objects.filter(is_active=True, deleted_at__isnull=True).count()
        inactive_users = User.objects.filter(is_active=False, deleted_at__isnull=True).count()
        deleted_users = User.objects.filter(deleted_at__isnull=False).count()
        
        # Usuarios por cargo
        by_cargo = User.objects.filter(
            deleted_at__isnull=True
        ).values(
            'cargo__name', 'cargo__code'
        ).annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'total': total_users,
            'active': active_users,
            'inactive': inactive_users,
            'deleted': deleted_users,
            'by_cargo': list(by_cargo)
        })


class PermisoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para Permisos
    
    Endpoints:
    - GET /api/core/permisos/ - Lista de permisos
    - GET /api/core/permisos/{id}/ - Detalle de permiso
    """
    queryset = Permiso.objects.all()
    serializer_class = PermisoSerializer
    permission_classes = [IsAuthenticated, CanManageUsers]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['module', 'action', 'scope', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['module', 'action', 'created_at']
    ordering = ['module', 'action', 'scope']

    def get_queryset(self):
        """Filtrar solo permisos activos por defecto"""
        queryset = super().get_queryset()
        
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)
        
        return queryset

    @action(detail=False, methods=['get'])
    def by_module(self, request):
        """
        Obtener permisos agrupados por módulo
        
        GET /api/core/permisos/by_module/
        """
        from collections import defaultdict
        
        permisos = self.get_queryset()
        result = defaultdict(list)
        
        for permiso in permisos:
            result[permiso.module].append(PermisoSerializer(permiso).data)
        
        return Response(dict(result))
