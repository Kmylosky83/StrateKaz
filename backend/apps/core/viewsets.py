"""
ViewSets del módulo Core - API REST
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count

from .models import User, Cargo, Permiso, CargoPermiso
from .utils.audit_logging import (
    log_user_created, log_user_deleted, log_user_restored, log_password_changed,
    log_user_photo_updated
)
from .serializers import (
    CargoSerializer,
    UserListSerializer,
    UserDetailSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    UserPhotoUploadSerializer,
    PermisoSerializer,
    CargoPermisoSerializer,
)
from .permissions import CanManageUsers, GranularActionPermission


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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'colaboradores'

    granular_action_map = {
        'change_password': 'can_edit',
        'restore': 'can_delete', # Restore is logical reverse of delete
        'comerciales': 'can_view',
        'stats': 'can_view',
        'me': 'can_view', # Usually allowany or authenticated, but for now map to view
        'update_profile': 'can_view', # Self-service action, user updates own profile
        'upload_photo': 'can_view', # Self-service action, user uploads own photo
    }
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

        if self.action in ['me']:
             return [IsAuthenticated()]
        return [permission() for permission in self.permission_classes]

    def perform_create(self, serializer):
        """Crear usuario con logging de auditoría"""
        user = serializer.save()
        log_user_created(self.request, user)

    def perform_destroy(self, instance):
        """Soft delete en lugar de eliminación física"""
        instance.soft_delete()
        log_user_deleted(self.request, instance)

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
            log_password_changed(self.request, user, self_change=(request.user.id == user.id))
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
        log_user_restored(self.request, user)

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

    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """
        Actualizar perfil del usuario autenticado

        PUT/PATCH /api/core/users/update_profile/
        {
            "first_name": "Juan",
            "last_name": "Pérez",
            "email": "juan.perez@empresa.com",
            "phone": "+57 300 123 4567"
        }

        Campos editables: first_name, last_name, email, phone
        Solo el usuario puede editar su propio perfil.
        """
        user = request.user

        # Solo permitir actualizar campos específicos de perfil
        allowed_fields = ['first_name', 'last_name', 'email', 'phone']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        # Usar serializer de actualización
        serializer = UserUpdateSerializer(user, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()

            # Log de auditoría
            from apps.core.utils.audit_logging import log_user_updated
            log_user_updated(request, user, self_update=True)

            # Retornar perfil actualizado completo
            return Response(
                UserDetailSerializer(user).data,
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def upload_photo(self, request):
        """
        Subir foto de perfil del usuario autenticado

        POST /api/core/users/upload_photo/
        Content-Type: multipart/form-data

        Body:
        - photo: archivo de imagen (JPG, PNG, WebP - Máx. 2MB)

        Returns:
        - photo_url: URL de la foto subida
        """
        user = request.user

        serializer = UserPhotoUploadSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user)
            log_user_photo_updated(request, user)

            # Generar URL completa de la foto
            photo_url = request.build_absolute_uri(user.photo.url) if user.photo else None

            return Response(
                {
                    'message': 'Foto de perfil actualizada exitosamente',
                    'photo_url': photo_url
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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


# =============================================================================
# USER PREFERENCES VIEWSET (MS-003)
# =============================================================================

class UserPreferencesViewSet(viewsets.GenericViewSet):
    """
    ViewSet para preferencias de usuario.

    Solo maneja las preferencias del usuario autenticado actual.

    Endpoints:
    - GET /api/core/user-preferences/ - Obtener preferencias del usuario actual
    - PUT /api/core/user-preferences/ - Actualizar preferencias (actualización completa)
    - PATCH /api/core/user-preferences/ - Actualizar preferencias (actualización parcial)
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Retorna el serializer apropiado."""
        from .serializers import UserPreferencesSerializer
        return UserPreferencesSerializer

    def get_object(self):
        """
        Obtiene o crea las preferencias del usuario actual.
        Siempre retorna las preferencias, creándolas si no existen.
        """
        from apps.core.models import UserPreferences
        preferences, created = UserPreferences.get_or_create_for_user(self.request.user)

        if created:
            import logging
            logger = logging.getLogger('audit')
            logger.info(
                f"MS-003: Preferencias creadas automáticamente para usuario {self.request.user.username}"
            )

        return preferences

    def list(self, request):
        """
        GET /api/core/user-preferences/

        Obtiene las preferencias del usuario actual.
        Si no existen, las crea con valores por defecto.
        """
        preferences = self.get_object()
        serializer = self.get_serializer_class()(preferences)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """
        PUT /api/core/user-preferences/

        Actualiza todas las preferencias del usuario actual.
        """
        partial = kwargs.pop('partial', False)
        preferences = self.get_object()
        serializer = self.get_serializer_class()(
            preferences,
            data=request.data,
            partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Logging de auditoría
        from .utils.audit_logging import log_preferences_updated
        log_preferences_updated(request.user, serializer.validated_data)

        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH /api/core/user-preferences/

        Actualiza parcialmente las preferencias del usuario actual.
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
