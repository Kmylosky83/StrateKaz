"""
Views para Multi-Tenant System (django-tenants)

Endpoints para gestion de tenants desde el frontend.

ARQUITECTURA:
- PublicSchemaWriteMixin: Fuerza todas las escrituras en schema 'public'
- TenantViewSet: CRUD de tenants (solo superadmins)
- TenantUserViewSet: Gestion de usuarios globales
- PlanViewSet: Consulta de planes
- DomainViewSet: Gestion de dominios

IMPORTANTE: Todos los modelos del schema public (Tenant, Domain, TenantUser,
TenantUserAccess, Plan) DEBEN escribirse dentro de schema_context('public').
django-tenants bloquea .save() fuera del schema propio del objeto.
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from django_filters.rest_framework import DjangoFilterBackend
from django_tenants.utils import schema_context
from django.db import models
from django.db.models import Count
from django.utils import timezone

logger = logging.getLogger('apps')

from .models import Tenant, Domain, TenantUser, TenantUserAccess, Plan
from .serializers import (
    TenantSerializer,
    TenantMinimalSerializer,
    TenantCreateSerializer,
    TenantUpdateSerializer,
    TenantSelfEditSerializer,
    TenantBrandingSerializer,
    TenantUserSerializer,
    TenantUserCreateSerializer,
    TenantUserUpdateSerializer,
    TenantUserAccessSerializer,
    DomainSerializer,
    PlanSerializer,
    UserTenantsSerializer,
)
from .authentication import TenantJWTAuthentication, HybridJWTAuthentication


# =============================================================================
# MIXIN: Forzar escrituras en schema public
# =============================================================================

class PublicSchemaWriteMixin:
    """
    Mixin para ViewSets que operan sobre modelos del schema public
    (Tenant, Domain, TenantUser, TenantUserAccess, Plan).

    django-tenants bloquea .save() / .delete() sobre objetos del schema public
    cuando el request viene desde un schema de tenant (ej: tenant_stratekaz).
    Este mixin envuelve todas las operaciones de escritura en schema_context('public').
    """

    def perform_create(self, serializer):
        with schema_context('public'):
            serializer.save()

    def perform_update(self, serializer):
        with schema_context('public'):
            serializer.save()

    def perform_destroy(self, instance):
        with schema_context('public'):
            instance.delete()


# =============================================================================
# PERMISOS PERSONALIZADOS
# =============================================================================

class IsSuperAdmin(BasePermission):
    """
    Permiso que permite acceso a superadministradores.

    Funciona tanto con:
    - TenantUser (is_superadmin) - para Admin Global
    - User (is_superuser) - para contexto de tenant
    """
    message = 'Solo los superadministradores pueden acceder a esta función.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Verificar si es TenantUser (tiene is_superadmin)
        if hasattr(request.user, 'is_superadmin'):
            return request.user.is_superadmin

        # Verificar si es User (tiene is_superuser)
        if hasattr(request.user, 'is_superuser'):
            return request.user.is_superuser

        return False


class IsTenantSuperAdmin(BasePermission):
    """
    Permiso para superadministradores de tenant (TenantUser.is_superadmin).
    """
    message = 'Solo los superadministradores de tenant pueden acceder.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Verificar TenantUser.is_superadmin
        if hasattr(request.user, 'is_superadmin'):
            return request.user.is_superadmin

        # Fallback a User.is_superuser
        if hasattr(request.user, 'is_superuser'):
            return request.user.is_superuser

        return False


class IsAdminTenant(BasePermission):
    """
    Permiso para administradores del tenant actual.

    Verifica (en orden):
    1. TenantUser.is_superadmin (Admin Global)
    2. core.User.is_superuser (superusuario del tenant)
    3. core.User.cargo.code == 'ADMIN' (cargo admin asignado)
    """
    message = 'Solo los administradores de la empresa pueden realizar esta acción.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Si es TenantUser global con is_superadmin, siempre tiene acceso
        if hasattr(request.user, 'is_superadmin') and request.user.is_superadmin:
            return True

        # Si es core.User con is_superuser, tiene acceso
        if hasattr(request.user, 'is_superuser') and request.user.is_superuser:
            return True

        # User local: verificar cargo ADMIN
        if hasattr(request.user, 'cargo') and request.user.cargo:
            if request.user.cargo.code == 'ADMIN':
                return True

        return False


# =============================================================================
# VIEWSETS
# =============================================================================

class PlanViewSet(PublicSchemaWriteMixin, viewsets.ModelViewSet):
    """
    ViewSet para Planes de suscripcion.

    - GET (list/retrieve): Accesible para todos (solo planes activos)
    - POST/PUT/PATCH/DELETE: Solo superadmins (todos los planes)
    Hereda PublicSchemaWriteMixin para escrituras en schema public.
    """
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    authentication_classes = [TenantJWTAuthentication]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['code', 'is_default', 'is_active']

    def get_permissions(self):
        """
        Permisos diferenciados:
        - Lectura: Público
        - Escritura: Solo superadmins
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsSuperAdmin()]

    def get_queryset(self):
        """
        Superadmins ven todos los planes, otros solo los activos.
        """
        if self.request.user.is_authenticated:
            is_super = getattr(self.request.user, 'is_superadmin', False) or \
                       getattr(self.request.user, 'is_superuser', False)
            if is_super:
                return Plan.objects.all()
        return Plan.objects.filter(is_active=True)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Estadísticas de planes."""
        from django.db.models import Count
        stats = {
            'total': Plan.objects.count(),
            'active': Plan.objects.filter(is_active=True).count(),
            'by_plan': list(
                Tenant.objects.exclude(schema_name='public')
                .values('plan__name')
                .annotate(count=Count('id'))
            ),
        }
        return Response(stats)


class TenantViewSet(PublicSchemaWriteMixin, viewsets.ModelViewSet):
    """
    ViewSet para Tenants.
    Solo accesible por superadmins.

    Usa TenantJWTAuthentication para permitir que TenantUser
    (usuarios globales) puedan gestionar tenants.

    Hereda PublicSchemaWriteMixin para que create/update/delete
    se ejecuten dentro de schema_context('public').
    """
    queryset = Tenant.objects.all()
    authentication_classes = [TenantJWTAuthentication]
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'is_trial', 'tier', 'plan']
    search_fields = ['name', 'code', 'nit']

    def get_serializer_class(self):
        if self.action == 'create':
            return TenantCreateSerializer
        if self.action == 'list':
            return TenantMinimalSerializer
        if self.action in ['update', 'partial_update']:
            return TenantUpdateSerializer
        return TenantSerializer

    def get_queryset(self):
        """
        Retorna todos los tenants EXCEPTO el schema 'public'.
        El tenant publico es interno del sistema y no debe mostrarse en Admin Global.
        """
        return Tenant.objects.exclude(
            schema_name='public'
        ).prefetch_related('domains').select_related('plan')

    def list(self, request, *args, **kwargs):
        """Override list para capturar errores con detalle."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(
                f'TenantViewSet.list ERROR: {type(e).__name__}: {e}',
                exc_info=True
            )
            return Response(
                {'detail': f'Error al listar tenants: {type(e).__name__}: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Override create para capturar errores con detalle."""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(
                f'TenantViewSet.create ERROR: {type(e).__name__}: {e}',
                exc_info=True
            )
            return Response(
                {'detail': f'Error al crear tenant: {type(e).__name__}: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        """Activa/desactiva un tenant. Toggle simple."""
        tenant = self.get_object()
        tenant.is_active = not tenant.is_active
        with schema_context('public'):
            tenant.save(update_fields=['is_active'])
        return Response({
            'id': tenant.id,
            'is_active': tenant.is_active,
            'message': f'Empresa {"activada" if tenant.is_active else "desactivada"} correctamente'
        })

    def perform_destroy(self, instance):
        """
        Soft delete: desactiva el tenant en lugar de eliminarlo.
        El schema PostgreSQL se preserva para posible recuperacion.
        Para eliminacion permanente (schema + datos), usar el action 'hard-delete'.
        """
        instance.is_active = False
        with schema_context('public'):
            instance.save(update_fields=['is_active'])

    @action(detail=True, methods=['post'], url_path='hard-delete')
    def hard_delete(self, request, pk=None):
        """
        Eliminacion permanente: borra el registro Y el schema PostgreSQL.
        IRREVERSIBLE - requiere confirmacion explicita.

        Limpia en orden:
        1. TenantUser.last_tenant FK references (SET NULL)
        2. TenantUserAccess (accesos de usuarios)
        3. Domain (dominios asociados)
        4. Schema PostgreSQL (DROP CASCADE)
        5. Tenant record (DELETE real via raw SQL)
        """
        from django.db import connection
        from apps.tenant.models import Domain, TenantUser, TenantUserAccess

        tenant = self.get_object()
        schema_name = tenant.schema_name

        if schema_name == 'public':
            return Response(
                {'detail': 'No se puede eliminar el schema publico'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar confirmacion explicita
        confirm = request.data.get('confirm_name')
        if confirm != tenant.name:
            return Response(
                {'detail': f'Para confirmar, envia confirm_name: "{tenant.name}"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tenant_name = tenant.name
        tenant_id = tenant.id

        try:
            with schema_context('public'):
                # 1. Limpiar FK last_tenant en TenantUser
                TenantUser.objects.filter(last_tenant=tenant).update(last_tenant=None)

                # 2. Eliminar accesos de usuarios a este tenant
                TenantUserAccess.objects.filter(tenant=tenant).delete()

                # 3. Eliminar dominios asociados
                Domain.objects.filter(tenant=tenant).delete()

                # 4. Eliminar schema PostgreSQL
                from psycopg2 import sql
                with connection.cursor() as cursor:
                    cursor.execute(
                        sql.SQL('DROP SCHEMA IF EXISTS {} CASCADE').format(
                            sql.Identifier(schema_name)
                        )
                    )

                # 5. Eliminar registro del tenant (DELETE real, no soft-delete)
                with connection.cursor() as cursor:
                    cursor.execute(
                        "DELETE FROM tenant_tenant WHERE id = %s",
                        [tenant_id]
                    )

            logger.info(
                f'Hard delete completado: "{tenant_name}" '
                f'(schema={schema_name}, id={tenant_id})'
            )

            return Response({
                'detail': f'Empresa "{tenant_name}" y schema "{schema_name}" eliminados permanentemente'
            })

        except Exception as e:
            logger.error(
                f'Hard delete fallido para tenant {tenant_id}: {e}',
                exc_info=True
            )
            return Response(
                {'detail': f'Error eliminando tenant: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], url_path='creation-status')
    def creation_status(self, request, pk=None):
        """
        Obtener el estado de creación del schema de un tenant.

        Retorna información sobre el progreso de la tarea Celery.
        El frontend puede hacer polling a este endpoint cada 2-5 segundos.

        Returns:
            - status: 'pending' | 'creating' | 'ready' | 'failed'
            - progress: 0-100
            - message: Descripción del estado actual
            - phase: Fase actual de la creación
        """
        from apps.tenant.tasks import get_task_status

        tenant = self.get_object()

        # Si el schema ya está listo, retornar inmediatamente
        if tenant.schema_status == 'ready':
            return Response({
                'status': 'ready',
                'progress': 100,
                'message': f'Tenant {tenant.name} está listo',
                'phase': 'done',
                'tenant_id': tenant.id,
                'schema_name': tenant.schema_name,
            })

        # Si falló, retornar el error
        if tenant.schema_status == 'failed':
            return Response({
                'status': 'failed',
                'progress': 0,
                'message': tenant.schema_error or 'Error al crear el schema',
                'phase': 'error',
                'tenant_id': tenant.id,
                'error': tenant.schema_error,
            })

        # Si está pendiente o creando, consultar el estado de la tarea
        if tenant.schema_task_id:
            task_status = get_task_status(tenant.schema_task_id)
            if task_status:
                # Actualizar estado del tenant si la tarea termino
                if task_status.get('status') == 'completed':
                    tenant.schema_status = 'ready'
                    with schema_context('public'):
                        tenant.save(update_fields=['schema_status'])
                elif task_status.get('status') == 'failed':
                    tenant.schema_status = 'failed'
                    tenant.schema_error = task_status.get('error', 'Error desconocido')
                    with schema_context('public'):
                        tenant.save(update_fields=['schema_status', 'schema_error'])

                return Response(task_status)

        # Estado por defecto
        return Response({
            'status': tenant.schema_status,
            'progress': 0 if tenant.schema_status == 'pending' else 5,
            'message': 'Esperando en cola...' if tenant.schema_status == 'pending' else 'Creando schema...',
            'phase': 'queued' if tenant.schema_status == 'pending' else 'creating_schema',
            'tenant_id': tenant.id,
        })

    @action(detail=True, methods=['post'], url_path='retry-creation')
    def retry_creation(self, request, pk=None):
        """
        Reintentar la creación del schema de un tenant que falló.

        Solo se puede llamar si el schema_status es 'failed'.
        """
        from apps.tenant.tasks import create_tenant_schema_task

        tenant = self.get_object()

        if tenant.schema_status == 'ready':
            return Response(
                {'detail': 'El schema ya está creado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if tenant.schema_status == 'creating':
            return Response(
                {'detail': 'El schema está siendo creado actualmente'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lanzar nueva tarea
        task = create_tenant_schema_task.delay(tenant_id=tenant.id)

        # Actualizar tenant
        tenant.schema_task_id = task.id
        tenant.schema_status = 'creating'
        tenant.schema_error = ''
        with schema_context('public'):
            tenant.save(update_fields=['schema_task_id', 'schema_status', 'schema_error'])

        return Response({
            'status': 'retry_started',
            'task_id': task.id,
            'message': 'Reintentando creación del schema...',
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Estadísticas globales de tenants."""
        from datetime import timedelta

        # Calcular fecha límite para "por vencer" (próximos 30 días)
        now = timezone.now()
        expiring_limit = now + timedelta(days=30)

        # Tenants por vencer: activos con suscripción que termina en los próximos 30 días
        # o en trial que termina en los próximos 30 días (excluyendo schema public)
        expiring_soon_count = Tenant.objects.exclude(
            schema_name='public'
        ).filter(
            is_active=True
        ).filter(
            # Suscripción por vencer
            models.Q(
                is_trial=False,
                subscription_ends_at__isnull=False,
                subscription_ends_at__lte=expiring_limit,
                subscription_ends_at__gt=now
            ) |
            # Trial por vencer
            models.Q(
                is_trial=True,
                trial_ends_at__isnull=False,
                trial_ends_at__lte=expiring_limit,
                trial_ends_at__gt=now
            )
        ).count()

        # Excluir schema 'public' de todas las consultas
        base_qs = Tenant.objects.exclude(schema_name='public')

        stats = {
            'total': base_qs.count(),
            'active': base_qs.filter(is_active=True).count(),
            'trial': base_qs.filter(is_trial=True).count(),
            'expiring_soon': expiring_soon_count,
            'by_tier': dict(
                base_qs.values_list('tier').annotate(count=Count('id'))
            ),
            'by_plan': dict(
                base_qs.values_list('plan__name').annotate(count=Count('id'))
            ),
        }
        return Response(stats)

    @action(
        detail=False, methods=['get', 'patch'], url_path='me',
        authentication_classes=[HybridJWTAuthentication],
        permission_classes=[IsAdminTenant],
    )
    def me(self, request):
        """
        Endpoint para que el Admin Tenant consulte/edite datos de su empresa.

        GET: Retorna datos completos del tenant actual.
        PATCH: Actualiza datos fiscales, branding, contacto, regional.
               No permite modificar plan, tier, max_users ni estado.
        """
        from django.db import connection
        tenant = connection.tenant

        if request.method == 'GET':
            serializer = TenantSerializer(tenant, context={'request': request})
            return Response(serializer.data)

        # PATCH
        serializer = TenantSelfEditSerializer(
            tenant, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        with schema_context('public'):
            serializer.save()

        # Retornar datos completos actualizados
        return Response(TenantSerializer(tenant, context={'request': request}).data)


class DomainViewSet(PublicSchemaWriteMixin, viewsets.ModelViewSet):
    """
    ViewSet para Dominios de tenants.
    Hereda PublicSchemaWriteMixin para escrituras en schema public.
    """
    queryset = Domain.objects.all()
    serializer_class = DomainSerializer
    permission_classes = [IsSuperAdmin]
    filterset_fields = ['tenant', 'is_primary', 'is_active']

    def get_queryset(self):
        return Domain.objects.select_related('tenant')


class TenantUserViewSet(PublicSchemaWriteMixin, viewsets.ModelViewSet):
    """
    ViewSet para usuarios globales del sistema multi-tenant.

    Usa TenantJWTAuthentication para permitir que TenantUser
    (usuarios globales) puedan gestionar otros usuarios globales.
    Hereda PublicSchemaWriteMixin para escrituras en schema public.
    """
    queryset = TenantUser.objects.all()
    authentication_classes = [TenantJWTAuthentication]
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'is_superadmin']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['email', 'first_name', 'last_name', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return TenantUserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return TenantUserUpdateSerializer
        return TenantUserSerializer

    def get_queryset(self):
        return TenantUser.objects.prefetch_related(
            'tenant_accesses__tenant'
        ).annotate(
            _tenant_count=Count('tenants', distinct=True)
        )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Obtener información del usuario actual y sus tenants.
        Este endpoint es accesible para cualquier usuario autenticado.
        """
        try:
            tenant_user = TenantUser.objects.get(email=request.user.email)
            serializer = UserTenantsSerializer(tenant_user)
            return Response(serializer.data)
        except TenantUser.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado en el sistema de tenants'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], url_path='grant-access')
    def grant_access(self, request, pk=None):
        """
        Otorgar acceso a un tenant.
        Espera: { "tenant_id": 1 }

        NOTA: El campo 'role' está DEPRECATED.
        Los permisos granulares se manejan via User.cargo dentro del tenant.
        """
        user = self.get_object()
        tenant_id = request.data.get('tenant_id')

        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response(
                {'detail': 'Tenant no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        with schema_context('public'):
            access, created = TenantUserAccess.objects.update_or_create(
                tenant_user=user,
                tenant=tenant,
                defaults={
                    'is_active': True,
                }
            )

        return Response({
            'status': 'acceso otorgado' if created else 'acceso actualizado',
            'tenant': tenant.name,
        })

    @action(detail=True, methods=['post'], url_path='revoke-access')
    def revoke_access(self, request, pk=None):
        """
        Revocar acceso a un tenant.
        Espera: { "tenant_id": 1 }
        """
        user = self.get_object()
        tenant_id = request.data.get('tenant_id')

        try:
            access = TenantUserAccess.objects.get(
                tenant_user=user,
                tenant_id=tenant_id
            )
            access.is_active = False
            with schema_context('public'):
                access.save(update_fields=['is_active'])
            return Response({'status': 'acceso revocado'})
        except TenantUserAccess.DoesNotExist:
            return Response(
                {'detail': 'Acceso no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

    def perform_destroy(self, instance):
        """
        Soft-delete: desactiva el TenantUser en vez de eliminarlo.
        Preserva trazabilidad, auditoría y datos de tenants asociados.
        """
        instance.is_active = False
        with schema_context('public'):
            instance.save(update_fields=['is_active'])

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        """
        Activa/desactiva un usuario global. Toggle simple.
        Permite reactivar usuarios previamente desactivados.
        """
        user = self.get_object()

        # Proteger contra desactivar al último superadmin
        if user.is_superadmin and user.is_active:
            remaining = TenantUser.objects.filter(
                is_superadmin=True, is_active=True
            ).exclude(id=user.id).count()
            if remaining == 0:
                return Response(
                    {'detail': 'No se puede desactivar al último Super Admin del sistema.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user.is_active = not user.is_active
        with schema_context('public'):
            user.save(update_fields=['is_active'])

        action_text = 'activado' if user.is_active else 'desactivado'
        return Response({
            'id': user.id,
            'is_active': user.is_active,
            'message': f'Usuario {action_text} correctamente.',
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Estadísticas globales de usuarios."""
        stats = {
            'total': TenantUser.objects.count(),
            'active': TenantUser.objects.filter(is_active=True).count(),
            'superadmins': TenantUser.objects.filter(is_superadmin=True).count(),
            'multi_tenant': TenantUser.objects.annotate(
                tenant_count=Count('tenants')
            ).filter(tenant_count__gt=1).count(),
        }
        return Response(stats)


class PublicTenantViewSet(viewsets.ViewSet):
    """
    Endpoints públicos para tenants (sin autenticación).
    Usado para verificación de dominios, login y branding.

    IMPORTANTE: Estos endpoints son públicos y no requieren autenticación.
    El frontend los usa para cargar el branding ANTES de que el usuario haga login.

    authentication_classes = [] evita que HybridJWTAuthentication (el default global)
    intente resolver User en el schema público donde core_user no existe.
    """
    authentication_classes = []  # Sin auth - evita query a core_user en schema público
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], url_path='by-domain')
    def by_domain(self, request):
        """
        Obtener información básica del tenant por dominio.
        Query param: ?domain=empresa.stratekaz.com

        Usado para:
        - Verificar que el dominio pertenece a un tenant activo
        - Mostrar el nombre de la empresa en el login
        """
        domain_name = request.query_params.get('domain')

        if not domain_name:
            return Response(
                {'detail': 'Parámetro domain requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            domain = Domain.objects.select_related('tenant').get(
                domain=domain_name,
                is_active=True,
                tenant__is_active=True
            )
            tenant = domain.tenant

            return Response({
                'id': tenant.id,
                'code': tenant.code,
                'name': tenant.name,
                'logo_url': tenant.logo_effective,
                'primary_color': tenant.primary_color,
            })
        except Domain.DoesNotExist:
            return Response(
                {'detail': 'Tenant no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def branding(self, request):
        """
        Obtener configuración completa de branding del tenant por dominio.
        Query param: ?domain=empresa.stratekaz.com

        Este endpoint permite al frontend cargar todo el branding (logo, colores,
        PWA config, etc.) ANTES del login, para personalizar la página de login
        y el tema de la aplicación.

        IMPORTANTE: Este endpoint es PÚBLICO. No expone datos sensibles,
        solo información visual de branding.
        """
        domain_name = request.query_params.get('domain')

        if not domain_name:
            return Response(
                {'detail': 'Parámetro domain requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            domain = Domain.objects.select_related('tenant').get(
                domain=domain_name,
                is_active=True,
                tenant__is_active=True
            )
            tenant = domain.tenant

            serializer = TenantBrandingSerializer(tenant, context={'request': request})
            return Response(serializer.data)

        except Domain.DoesNotExist:
            # Retornar branding por defecto si no se encuentra el tenant
            # Esto permite que la app funcione incluso en dominios no configurados
            return Response({
                'company_name': 'StrateKaz',
                'company_short_name': 'StrateKaz',
                'company_slogan': 'Consultoría 4.0',
                'primary_color': '#ec268f',
                'secondary_color': '#000000',
                'accent_color': '#f4ec25',
                'sidebar_color': '#1E293B',
                'background_color': '#F5F5F5',
                'showcase_background': '#1F2937',
                'pwa_name': 'StrateKaz',
                'pwa_short_name': 'StrateKaz',
                'pwa_theme_color': '#ec268f',
                'pwa_background_color': '#FFFFFF',
            })

    @action(detail=False, methods=['get'])
    def manifest(self, request):
        """
        Generar manifest.json dinámico para PWA basado en el branding del tenant.

        Obtiene el tenant del dominio actual (connection.tenant) y genera
        un manifest.json con la configuración PWA del tenant.

        Este endpoint es usado por el navegador para la PWA.
        """
        from django.db import connection

        # Obtener tenant actual del schema
        tenant = getattr(connection, 'tenant', None)

        # Valores por defecto
        manifest_data = {
            'name': 'StrateKaz SGI',
            'short_name': 'StrateKaz',
            'description': 'Sistema de Gestión Integral',
            'start_url': '/',
            'display': 'standalone',
            'background_color': '#FFFFFF',
            'theme_color': '#ec268f',
            'orientation': 'portrait-primary',
            'icons': [],
        }

        if tenant and hasattr(tenant, 'pwa_name'):
            # Usar configuración del tenant
            manifest_data.update({
                'name': tenant.pwa_name or tenant.name or 'StrateKaz SGI',
                'short_name': tenant.pwa_short_name or tenant.nombre_comercial or tenant.name[:12] if tenant.name else 'StrateKaz',
                'description': tenant.pwa_description or f'Sistema de Gestión Integral - {tenant.name}',
                'theme_color': tenant.pwa_theme_color or tenant.primary_color or '#ec268f',
                'background_color': tenant.pwa_background_color or '#FFFFFF',
            })

            # Agregar iconos si existen
            icons = []
            if tenant.pwa_icon_192:
                icons.append({
                    'src': request.build_absolute_uri(tenant.pwa_icon_192.url),
                    'sizes': '192x192',
                    'type': 'image/png',
                    'purpose': 'any'
                })
            if tenant.pwa_icon_512:
                icons.append({
                    'src': request.build_absolute_uri(tenant.pwa_icon_512.url),
                    'sizes': '512x512',
                    'type': 'image/png',
                    'purpose': 'any'
                })
            if tenant.pwa_icon_maskable:
                icons.append({
                    'src': request.build_absolute_uri(tenant.pwa_icon_maskable.url),
                    'sizes': '512x512',
                    'type': 'image/png',
                    'purpose': 'maskable'
                })

            # Si no hay iconos configurados, usar defaults
            if not icons:
                icons = [
                    {'src': '/pwa-192x192.png', 'sizes': '192x192', 'type': 'image/png'},
                    {'src': '/pwa-512x512.png', 'sizes': '512x512', 'type': 'image/png'},
                ]

            manifest_data['icons'] = icons
        else:
            # Iconos por defecto
            manifest_data['icons'] = [
                {'src': '/pwa-192x192.png', 'sizes': '192x192', 'type': 'image/png'},
                {'src': '/pwa-512x512.png', 'sizes': '512x512', 'type': 'image/png'},
            ]

        from django.http import JsonResponse
        return JsonResponse(manifest_data, content_type='application/manifest+json')

    @action(detail=False, methods=['get'], url_path='check-domain')
    def check_domain(self, request):
        """
        Verificar si un dominio está disponible.
        Query param: ?domain=nuevo-cliente
        """
        domain_name = request.query_params.get('domain')

        if not domain_name:
            return Response(
                {'detail': 'Parámetro domain requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        exists = Domain.objects.filter(domain__iexact=domain_name).exists()

        return Response({
            'domain': domain_name,
            'available': not exists,
        })

