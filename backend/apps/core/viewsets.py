"""
ViewSets del módulo Core - API REST
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status, filters
from rest_framework.pagination import PageNumberPagination
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
from .utils.impersonation import block_during_impersonation, is_impersonating
from .throttles import ImpersonationRateThrottle
from .serializers import (
    CargoSerializer,
    CargoDetailSerializer,
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


class CargoCatalogoPagination(PageNumberPagination):
    """Paginacion para catalogo de cargos: 100 por defecto, max 200"""
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 200


class CargoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para Cargos

    Endpoints:
    - GET /api/core/cargos/ - Lista de cargos activos
    - GET /api/core/cargos/{id}/ - Detalle de cargo

    Filtros:
    - is_system=false (excluir cargos del sistema ADMIN/USUARIO)
    - is_active=true/false
    - level, parent_cargo
    """
    queryset = Cargo.objects.all()
    serializer_class = CargoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CargoCatalogoPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['level', 'is_active', 'is_system', 'parent_cargo']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['level', 'name', 'created_at']
    ordering = ['level', 'name']

    def get_serializer_class(self):
        """Retornar CargoDetailSerializer para retrieve (incluye campos SST)."""
        if self.action == 'retrieve':
            return CargoDetailSerializer
        return CargoSerializer

    def get_queryset(self):
        """Filtrar solo cargos activos por defecto"""
        queryset = super().get_queryset()

        # Si se especifica include_inactive=true, mostrar todos
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)

        # Para retrieve, prefetch riesgos
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related('expuesto_riesgos')

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
        'firma_guardada': 'can_view', # Self-service action, user manages own signature
        'impersonate_profile': 'can_view', # Custom superuser check inside action
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['cargo', 'cargo__code', 'is_active', 'is_staff', 'document_type']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'document_number']
    ordering_fields = ['date_joined', 'username', 'last_name']
    ordering = ['-date_joined']
    
    def get_queryset(self):
        """Excluir usuarios eliminados y superusuarios por defecto"""
        queryset = super().get_queryset()

        # Excluir superusuarios SIN cargo (admin plataforma puro),
        # EXCEPTO el usuario logueado (siempre puede verse/editarse a sí mismo).
        # Superusuarios CON cargo son parte de la empresa (modelo B2B2B).
        queryset = queryset.exclude(
            Q(is_superuser=True, cargo__isnull=True)
            & ~Q(pk=self.request.user.pk)
        )

        # Excluir eliminados lógicamente
        include_deleted = self.request.query_params.get('include_deleted', 'false')
        if include_deleted.lower() != 'true':
            queryset = queryset.filter(deleted_at__isnull=True)

        # Filtro por tipo: interno/externo/todos
        tipo = self.request.query_params.get('tipo', 'todos')
        if tipo == 'interno':
            queryset = queryset.filter(Q(cargo__is_externo=False) | Q(cargo__isnull=True))
        elif tipo == 'externo':
            queryset = queryset.filter(cargo__is_externo=True)

        # Filtro por origen
        origen = self.request.query_params.get('origen', '')
        if origen == 'proveedor_portal':
            queryset = queryset.filter(proveedor__isnull=False, cargo__code='PROVEEDOR_PORTAL')
        elif origen == 'proveedor_profesional':
            queryset = queryset.filter(proveedor__isnull=False).exclude(cargo__code='PROVEEDOR_PORTAL')
        elif origen == 'cliente_portal':
            queryset = queryset.filter(cliente__isnull=False)
        elif origen == 'colaborador':
            try:
                from django.apps import apps
                Colaborador = apps.get_model('colaboradores', 'Colaborador')
                colab_user_ids = Colaborador.objects.values_list('usuario_id', flat=True)
                queryset = queryset.filter(id__in=colab_user_ids)
            except LookupError:
                pass
        elif origen == 'manual':
            try:
                from django.apps import apps
                Colaborador = apps.get_model('colaboradores', 'Colaborador')
                colab_user_ids = Colaborador.objects.values_list('usuario_id', flat=True)
                queryset = queryset.filter(
                    proveedor__isnull=True,
                    cliente__isnull=True,
                ).exclude(id__in=colab_user_ids)
            except LookupError:
                queryset = queryset.filter(proveedor__isnull=True, cliente__isnull=True)

        # Annotate _has_colaborador para evitar N+1 en serializer
        try:
            from django.apps import apps
            Colaborador = apps.get_model('colaboradores', 'Colaborador')
            from django.db.models import Exists, OuterRef
            queryset = queryset.annotate(
                _has_colaborador=Exists(
                    Colaborador.objects.filter(usuario=OuterRef('pk'))
                )
            )
        except LookupError:
            pass

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
        return UserDetailSerializer

    def perform_update(self, serializer):
        """
        Actualizar usuario con protección contra auto-degradación y
        bloqueo de campos sensibles durante impersonación.

        Si el usuario está cambiando su propio cargo y es el último ADMIN
        del tenant, se rechaza el cambio para evitar dejar el tenant sin
        administrador.
        """
        # S3: Bloquear modificación de campos sensibles durante impersonación
        if is_impersonating(self.request):
            sensitive_fields = {'is_active', 'is_staff'}
            changed_sensitive = sensitive_fields & set(
                serializer.validated_data.keys()
            )
            if changed_sensitive:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    f"No se puede modificar {', '.join(changed_sensitive)} "
                    f"durante impersonación"
                )

        instance = serializer.instance
        new_cargo_id = serializer.validated_data.get('cargo')

        # Solo validar si se está cambiando el cargo
        if new_cargo_id is not None and instance.cargo_id != getattr(new_cargo_id, 'id', new_cargo_id):
            # Verificar si el usuario actual tiene cargo ADMIN
            current_cargo = instance.cargo
            if current_cargo and current_cargo.code == 'ADMIN':
                # Contar cuántos usuarios activos tienen cargo ADMIN
                admin_count = User.objects.filter(
                    cargo__code='ADMIN',
                    is_active=True,
                    deleted_at__isnull=True
                ).count()

                if admin_count <= 1:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({
                        'cargo': 'No se puede cambiar el cargo del único Administrador del sistema. '
                                'Asigne cargo ADMIN a otro usuario primero.'
                    })

        serializer.save()

    def perform_create(self, serializer):
        """Crear usuario con logging de auditoría"""
        user = serializer.save()
        log_user_created(self.request, user)

    @block_during_impersonation(
        "No se puede eliminar usuarios durante impersonación"
    )
    def destroy(self, request, *args, **kwargs):
        """Soft delete en lugar de eliminación física — bloqueado durante impersonación."""
        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        """Soft delete en lugar de eliminación física"""
        instance.soft_delete()
        log_user_deleted(self.request, instance)

    @action(detail=True, methods=['post'])
    @block_during_impersonation(
        "No se puede cambiar la contraseña durante impersonación"
    )
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

        serializer = UserDetailSerializer(user, context={'request': request})
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

        Retorna usuarios con cargos comerciales asignados
        """
        comerciales = User.objects.filter(
            Q(cargo__code='lider_comercial') | Q(cargo__code='comercial'),
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
        serializer = UserDetailSerializer(request.user, context={'request': request})
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
        # Superadmin puede editar su documento (reemplazar TEMP-xxx)
        if user.is_superuser:
            allowed_fields += ['document_type', 'document_number']
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
                UserDetailSerializer(user, context={'request': request}).data,
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

    @action(detail=False, methods=['get', 'patch'], url_path='firma-guardada')
    def firma_guardada(self, request):
        """
        Obtener o guardar/actualizar firma guardada del usuario autenticado.

        GET /api/core/users/firma-guardada/
        Retorna firma_guardada e iniciales_guardadas (base64 completo).

        PATCH /api/core/users/firma-guardada/
        {
            "firma_guardada": "data:image/png;base64,...",
            "iniciales_guardadas": "data:image/png;base64,..."
        }

        Enviar null para eliminar firma/iniciales.
        """
        user = request.user

        # S3: Bloquear escritura de firma durante impersonación
        if request.method == 'PATCH' and is_impersonating(request):
            return Response(
                {'error': 'No se puede modificar la firma durante impersonación'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.method == 'GET':
            return Response({
                'firma_guardada': user.firma_guardada,
                'iniciales_guardadas': user.iniciales_guardadas,
            })

        # PATCH
        MAX_SIGNATURE_SIZE = 500 * 1024  # 500 KB de base64
        allowed_fields = ['firma_guardada', 'iniciales_guardadas']
        update_fields = []

        for field in allowed_fields:
            if field in request.data:
                value = request.data[field]

                # Permitir null (eliminar firma)
                if value is None:
                    setattr(user, field, value)
                    update_fields.append(field)
                    continue

                # Validar tipo string
                if not isinstance(value, str):
                    return Response(
                        {field: 'Debe ser una cadena base64 o null'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Validar formato dataURL
                if not value.startswith('data:image/'):
                    return Response(
                        {field: 'Formato inválido. Debe ser data:image/png;base64,... o data:image/jpeg;base64,...'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Validar tamaño máximo (protección contra DoS)
                if len(value) > MAX_SIGNATURE_SIZE:
                    return Response(
                        {field: f'La firma no puede exceder 500 KB ({len(value) // 1024} KB recibidos)'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                setattr(user, field, value)
                update_fields.append(field)

        if not update_fields:
            return Response(
                {'error': 'Debe enviar al menos un campo: firma_guardada o iniciales_guardadas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.save(update_fields=update_fields)

        return Response({
            'message': 'Firma guardada actualizada exitosamente',
            'firma_guardada': bool(user.firma_guardada),
            'iniciales_guardadas': bool(user.iniciales_guardadas),
        })

    @action(
        detail=True, methods=['post'], url_path='impersonate-verify',
        throttle_classes=[ImpersonationRateThrottle]
    )
    def impersonate_verify(self, request, pk=None):
        """
        Verificar código 2FA antes de impersonar un usuario.

        POST /api/core/users/{id}/impersonate-verify/
        { "code": "123456" }

        Solo superadmins con 2FA habilitado. Retorna un token temporal
        firmado (5 min TTL) que el frontend envía en X-Impersonation-Token
        al llamar impersonate-profile.
        """
        from apps.core.models import TwoFactorAuth
        from apps.core.utils.audit_logging import (
            log_impersonation_failed, log_2fa_verified, log_2fa_failed,
            log_backup_code_used,
        )
        import jwt
        from django.conf import settings as django_settings
        from django.utils import timezone

        # Solo superadmins
        if not request.user.is_superuser:
            return Response(
                {'error': 'Solo superadmins pueden impersonar usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validar target user
        try:
            target_user = User.objects.get(pk=pk, deleted_at__isnull=True)
        except User.DoesNotExist:
            log_impersonation_failed(request, f'pk={pk}', reason='user_not_found')
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # No auto-impersonación
        if target_user.id == request.user.id:
            log_impersonation_failed(request, target_user.username, reason='self_impersonation')
            return Response(
                {'error': 'No puedes impersonarte a ti mismo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el superadmin tenga 2FA habilitado
        try:
            two_factor = TwoFactorAuth.objects.get(
                user=request.user, is_enabled=True
            )
        except TwoFactorAuth.DoesNotExist:
            return Response(
                {'error': 'Debes tener 2FA habilitado para impersonar usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validar código
        code = request.data.get('code', '').strip()
        if not code:
            return Response(
                {'error': 'El código 2FA es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Intentar TOTP primero, luego backup code
        is_backup = False
        backup_remaining = None
        if two_factor.verify_token(code):
            log_2fa_verified(request)
        elif two_factor.verify_backup_code(code):
            is_backup = True
            backup_remaining = two_factor.get_remaining_backup_codes_count()
            log_backup_code_used(request)
        else:
            log_2fa_failed(request)
            log_impersonation_failed(
                request, target_user.username, reason='2fa_verification_failed'
            )
            return Response(
                {'error': 'Código 2FA inválido'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generar token temporal firmado (5 min TTL)
        now = timezone.now()
        payload = {
            'superadmin_id': request.user.id,
            'target_user_id': target_user.id,
            'purpose': 'impersonation',
            'iat': int(now.timestamp()),
            'exp': int((now + timezone.timedelta(minutes=5)).timestamp()),
        }
        impersonation_token = jwt.encode(
            payload,
            django_settings.SECRET_KEY,
            algorithm='HS256'
        )

        security_logger = __import__('logging').getLogger('security')
        security_logger.info(
            f"Impersonation 2FA verified: superadmin={request.user.username} "
            f"target={target_user.username} backup_code={is_backup}"
        )

        response_data = {
            'impersonation_token': impersonation_token,
            'expires_in': 300,
        }
        if backup_remaining is not None:
            response_data['backup_codes_remaining'] = backup_remaining

        return Response(response_data)

    @action(detail=True, methods=['get'], url_path='impersonate-profile')
    def impersonate_profile(self, request, pk=None):
        """
        Obtener perfil completo de un usuario para impersonación.

        GET /api/core/users/{id}/impersonate-profile/

        Solo superadmins pueden usar este endpoint. Retorna el mismo formato
        que current_user() (core_views.py) para que el frontend pueda
        hacer override del perfil en el authStore.

        Si el superadmin tiene 2FA habilitado, requiere X-Impersonation-Token
        header con token obtenido de impersonate-verify.

        Uso: Admin Global → "Ver como usuario" → seleccionar usuario →
        frontend reemplaza authStore.user con esta respuesta.
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Solo superadmins pueden impersonar usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validar token 2FA si el superadmin tiene 2FA habilitado
        from apps.core.models import TwoFactorAuth
        has_2fa = TwoFactorAuth.objects.filter(
            user=request.user, is_enabled=True
        ).exists()

        if has_2fa:
            import jwt
            from django.conf import settings as django_settings
            token = request.META.get('HTTP_X_IMPERSONATION_TOKEN', '')
            if not token:
                return Response(
                    {'error': 'Se requiere verificación 2FA para impersonar'},
                    status=status.HTTP_403_FORBIDDEN
                )
            try:
                payload = jwt.decode(
                    token, django_settings.SECRET_KEY, algorithms=['HS256']
                )
                if payload.get('purpose') != 'impersonation':
                    raise jwt.InvalidTokenError('Purpose mismatch')
                if payload.get('superadmin_id') != request.user.id:
                    raise jwt.InvalidTokenError('Superadmin mismatch')
                if payload.get('target_user_id') != int(pk):
                    raise jwt.InvalidTokenError('Target user mismatch')
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                return Response(
                    {'error': 'Token de impersonación inválido o expirado'},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Buscar el usuario target (bypasa get_queryset que excluye superusers)
        try:
            target_user = User.objects.select_related(
                'cargo', 'cargo__area', 'proveedor', 'cliente'
            ).get(pk=pk, deleted_at__isnull=True)
        except User.DoesNotExist:
            from apps.core.utils.audit_logging import log_impersonation_failed
            log_impersonation_failed(request, f'pk={pk}', reason='user_not_found')
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # No permitir impersonarse a sí mismo
        if target_user.id == request.user.id:
            from apps.core.utils.audit_logging import log_impersonation_failed
            log_impersonation_failed(request, target_user.username, reason='self_impersonation')
            return Response(
                {'error': 'No puedes impersonarte a ti mismo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # RBAC Unificado v4.0: fuente única de verdad desde CargoSectionAccess
        from apps.core.utils.rbac import compute_user_rbac
        section_ids, permission_codes = compute_user_rbac(target_user)

        # Datos de contexto
        empresa_nombre = None
        if hasattr(request, 'tenant') and request.tenant:
            empresa_nombre = request.tenant.name

        area_nombre = None
        if target_user.cargo and hasattr(target_user.cargo, 'area') and target_user.cargo.area:
            area_nombre = target_user.cargo.area.name

        photo_url = None
        if target_user.photo:
            photo_url = request.build_absolute_uri(target_user.photo.url)

        # Log de seguridad
        from apps.core.utils.audit_logging import log_impersonation
        log_impersonation(request, target_user)

        # Cliente vinculado (portal cliente)
        cliente_nombre = None
        if target_user.cliente_id_ext:
            try:
                from django.apps import apps as django_apps
                Cliente = django_apps.get_model('gestion_clientes', 'Cliente')
                cli = Cliente.objects.filter(pk=target_user.cliente_id_ext).first()
                cliente_nombre = (cli.nombre_comercial or cli.razon_social) if cli else None
            except (LookupError, Exception):
                pass

        # Respuesta en el mismo formato que current_user() de core_views.py
        return Response({
            'id': target_user.id,
            'username': target_user.username,
            'email': target_user.email,
            'first_name': target_user.first_name,
            'last_name': target_user.last_name,
            'full_name': target_user.get_full_name(),
            'cargo': {
                'id': target_user.cargo.id,
                'code': target_user.cargo.code,
                'name': target_user.cargo.name,
                'level': target_user.cargo.level,
            } if target_user.cargo else None,
            'cargo_code': target_user.cargo_code,
            'cargo_level': target_user.cargo_level,
            'cargo_name': target_user.cargo.name if target_user.cargo else None,
            'phone': target_user.phone,
            'document_type': target_user.document_type,
            'document_type_display': target_user.get_document_type_display(),
            'document_number': target_user.document_number,
            'is_active': target_user.is_active,
            'is_staff': target_user.is_staff,
            'is_superuser': target_user.is_superuser,
            'is_deleted': target_user.is_deleted,
            'date_joined': target_user.date_joined,
            'last_login': target_user.last_login,
            'section_ids': section_ids,
            'permission_codes': permission_codes,
            'empresa_nombre': empresa_nombre,
            'area_nombre': area_nombre,
            'photo_url': photo_url,
            'proveedor': target_user.proveedor_id_ext,
            'proveedor_nombre': None,  # Se resuelve cuando supply_chain esté activo
            'cliente': target_user.cliente_id_ext,
            'cliente_nombre': cliente_nombre,
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Obtener estadísticas de usuarios

        GET /api/core/users/stats/
        """
        # Excluir superusuarios SIN cargo (admin plataforma puro).
        base_qs = User.objects.exclude(is_superuser=True, cargo__isnull=True)

        alive_qs = base_qs.filter(deleted_at__isnull=True)
        total_users = alive_qs.count()
        active_users = alive_qs.filter(is_active=True).count()
        inactive_users = alive_qs.filter(is_active=False).count()
        deleted_users = base_qs.filter(deleted_at__isnull=False).count()

        # Internos vs externos
        internos = alive_qs.filter(Q(cargo__is_externo=False) | Q(cargo__isnull=True)).count()
        externos = alive_qs.filter(cargo__is_externo=True).count()

        # Usuarios por cargo
        by_cargo = alive_qs.values(
            'cargo__name', 'cargo__code'
        ).annotate(
            count=Count('id')
        ).order_by('-count')

        # Origen breakdown (proveedor_id_ext / cliente_id_ext son IntegerField, no FK)
        proveedores_portal = alive_qs.filter(
            proveedor_id_ext__isnull=False, cargo__code='PROVEEDOR_PORTAL'
        ).count()
        proveedores_profesional = alive_qs.filter(
            proveedor_id_ext__isnull=False
        ).exclude(cargo__code='PROVEEDOR_PORTAL').count()
        clientes_portal = alive_qs.filter(cliente_id_ext__isnull=False).count()
        try:
            from django.apps import apps as django_apps
            Colaborador = django_apps.get_model('colaboradores', 'Colaborador')
            colaboradores = alive_qs.filter(
                id__in=Colaborador.objects.values_list('usuario_id', flat=True)
            ).count()
        except LookupError:
            colaboradores = 0
        manuales = total_users - proveedores_portal - proveedores_profesional - clientes_portal - colaboradores

        return Response({
            'total': total_users,
            'active': active_users,
            'inactive': inactive_users,
            'deleted': deleted_users,
            'internos': internos,
            'externos': externos,
            'by_cargo': list(by_cargo),
            'by_origen': {
                'colaborador': colaboradores,
                'proveedor_portal': proveedores_portal,
                'proveedor_profesional': proveedores_profesional,
                'cliente_portal': clientes_portal,
                'manual': max(0, manuales),
            },
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
    filterset_fields = ['modulo', 'accion', 'alcance', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['modulo', 'accion', 'created_at']
    ordering = ['modulo', 'accion', 'alcance']

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
            key = permiso.modulo.code if permiso.modulo else 'sin_modulo'
            result[key].append(PermisoSerializer(permiso).data)

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
        serializer = self.get_serializer(preferences)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        POST /api/core/user-preferences/

        Crea o actualiza las preferencias del usuario actual.
        En la práctica siempre actualiza porque las preferencias se crean automáticamente.
        """
        preferences = self.get_object()
        serializer = self.get_serializer(
            preferences,
            data=request.data,
            partial=False
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Logging de auditoría
        from .utils.audit_logging import log_preferences_updated
        log_preferences_updated(request.user, serializer.validated_data)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        """
        PUT /api/core/user-preferences/

        Actualiza completamente las preferencias del usuario actual.
        """
        preferences = self.get_object()
        serializer = self.get_serializer(
            preferences,
            data=request.data,
            partial=False
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
        preferences = self.get_object()
        serializer = self.get_serializer(
            preferences,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Logging de auditoría
        from .utils.audit_logging import log_preferences_updated
        log_preferences_updated(request.user, serializer.validated_data)

        return Response(serializer.data)
