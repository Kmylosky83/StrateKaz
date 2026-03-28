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
from django.apps import apps as django_apps
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
        permission_classes=[IsAuthenticated],
    )
    def me(self, request):
        """
        Endpoint para consultar/editar datos de la empresa del tenant actual.

        GET: Cualquier usuario autenticado puede ver datos de su empresa.
        PATCH: Solo IsAdminTenant puede modificar datos.
        """
        from django.db import connection
        tenant = connection.tenant

        if request.method == 'GET':
            serializer = TenantSerializer(tenant, context={'request': request})
            return Response(serializer.data)

        # PATCH: Solo admin puede editar
        if not IsAdminTenant().has_permission(request, self):
            return Response(
                {'detail': 'Solo los administradores de la empresa pueden modificar estos datos.'},
                status=status.HTTP_403_FORBIDDEN
            )

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

    def perform_create(self, serializer):
        """Crear TenantUser y enviar email de bienvenida."""
        with schema_context('public'):
            instance = serializer.save()

        # Enviar email de bienvenida asincrónicamente
        try:
            from apps.core.tasks import send_welcome_email_task

            # Obtener nombre del primer tenant asignado (si hay)
            tenant_name = 'StrateKaz'
            accesses = instance.tenant_accesses.select_related('tenant').all()
            if accesses.exists():
                tenant_name = accesses.first().tenant.name or tenant_name

            send_welcome_email_task.delay(
                user_email=instance.email,
                user_name=f"{instance.first_name} {instance.last_name}".strip() or instance.email,
                tenant_name=tenant_name,
                cargo_name='Administrador' if instance.is_superadmin else '',
                temp_password_hint='La contraseña que te asignó el administrador',
            )
            logger.info(f"Email de bienvenida encolado para {instance.email}")
        except Exception as e:
            # No bloquear creación si el email falla
            logger.warning(f"No se pudo encolar email de bienvenida para {instance.email}: {e}")

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
        Espera: { "tenant_id": 1, "is_admin": false }

        NOTA: El campo 'role' está DEPRECATED.
        Los permisos granulares se manejan via User.cargo dentro del tenant.
        """
        user = self.get_object()
        tenant_id = request.data.get('tenant_id')
        is_admin = request.data.get('is_admin', False)

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
                    'is_admin': is_admin,
                }
            )

        return Response({
            'status': 'acceso otorgado' if created else 'acceso actualizado',
            'tenant': tenant.name,
            'is_admin': access.is_admin,
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

    @action(detail=True, methods=['post'], url_path='toggle-admin')
    def toggle_admin(self, request, pk=None):
        """Toggle is_admin para un TenantUserAccess."""
        user = self.get_object()
        tenant_id = request.data.get('tenant_id')
        is_admin = request.data.get('is_admin', False)

        if not tenant_id:
            return Response(
                {'error': 'tenant_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            access = TenantUserAccess.objects.get(
                tenant_user=user, tenant_id=tenant_id, is_active=True
            )
        except TenantUserAccess.DoesNotExist:
            return Response(
                {'error': 'No existe acceso activo a este tenant'},
                status=status.HTTP_404_NOT_FOUND
            )

        access.is_admin = is_admin
        with schema_context('public'):
            access.save(update_fields=['is_admin'])

        return Response({
            'id': access.id,
            'tenant_id': tenant_id,
            'is_admin': access.is_admin,
            'message': f'Admin {"asignado" if is_admin else "revocado"} correctamente'
        })

    def perform_destroy(self, instance):
        """
        Soft-delete: desactiva el TenantUser en vez de eliminarlo.
        Preserva trazabilidad, auditoría y datos de tenants asociados.
        Cascadea la desactivación a los Users en los tenants asociados.
        """
        instance.is_active = False
        with schema_context('public'):
            instance.save(update_fields=['is_active'])

        # Cascadear desactivación a Users en tenants
        self._cascade_active_to_tenants(instance, is_active=False)

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        """
        Activa/desactiva un usuario global. Toggle simple.
        Permite reactivar usuarios previamente desactivados.
        Cascadea el cambio de estado a los Users en los tenants asociados.
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

        # Cascadear cambio de estado a Users en tenants
        self._cascade_active_to_tenants(user, is_active=user.is_active)

        action_text = 'activado' if user.is_active else 'desactivado'
        return Response({
            'id': user.id,
            'is_active': user.is_active,
            'message': f'Usuario {action_text} correctamente.',
        })

    @action(detail=True, methods=['post'], url_path='resend-welcome')
    def resend_welcome(self, request, pk=None):
        """
        Reenviar email de bienvenida a un usuario global.
        Útil cuando el email original no llegó o el usuario perdió sus credenciales.
        """
        user = self.get_object()

        try:
            from apps.core.tasks import send_welcome_email_task

            tenant_name = 'StrateKaz'
            accesses = user.tenant_accesses.select_related('tenant').filter(is_active=True)
            if accesses.exists():
                tenant_name = accesses.first().tenant.name or tenant_name

            send_welcome_email_task.delay(
                user_email=user.email,
                user_name=f"{user.first_name} {user.last_name}".strip() or user.email,
                tenant_name=tenant_name,
                cargo_name='Administrador' if user.is_superadmin else '',
                temp_password_hint='La contraseña que te asignó el administrador',
            )
            return Response({'message': f'Email de bienvenida reenviado a {user.email}'})
        except Exception as e:
            logger.error(f"Error reenviando email a {user.email}: {e}")
            return Response(
                {'detail': 'Error al enviar el email. Intente nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _cascade_active_to_tenants(self, tenant_user, is_active):
        """
        Cascadea el cambio de is_active del TenantUser a los Users
        dentro de cada tenant donde tiene acceso.

        - Desactivar: User.is_active=False + TenantUserAccess.is_active=False
        - Activar: User.is_active=True + TenantUserAccess.is_active=True
        """
        User = django_apps.get_model('core', 'User')
        email = tenant_user.email.lower().strip()

        with schema_context('public'):
            accesses = TenantUserAccess.objects.filter(
                tenant_user=tenant_user
            ).select_related('tenant')

            for access in accesses:
                tenant = access.tenant
                if not tenant or not tenant.is_active:
                    continue

                # Actualizar TenantUserAccess
                if not is_active and access.is_active:
                    access.is_active = False
                    access.save(update_fields=['is_active'])
                elif is_active and not access.is_active:
                    access.is_active = True
                    access.save(update_fields=['is_active'])

                # Cascadear al User dentro del tenant schema
                try:
                    with schema_context(tenant.schema_name):
                        user_qs = User.objects.filter(email=email)
                        user = user_qs.first()
                        if user and user.is_active != is_active:
                            user.is_active = is_active
                            update_fields = ['is_active', 'updated_at']
                            user.save(update_fields=update_fields)
                            logger.info(
                                'Cascadeo Admin Global: User "%s" %s en tenant "%s"',
                                email,
                                'activado' if is_active else 'desactivado',
                                tenant.schema_name,
                            )
                except Exception as e:
                    logger.error(
                        'Error cascadeando estado a User "%s" en tenant "%s": %s',
                        email, tenant.schema_name, e,
                    )

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

    @action(detail=False, methods=['get'], url_path='branding-by-id')
    def branding_by_id(self, request):
        """
        Obtener branding del tenant por ID (sin autenticación).

        Query param: ?tenant_id=5

        Usado por las páginas de setup-password y reset-password donde el usuario
        NO tiene token JWT pero sí tiene el tenant_id en la URL.

        IMPORTANTE: Solo expone datos visuales de branding, NO datos sensibles.
        """
        tenant_id = request.query_params.get('tenant_id')

        if not tenant_id:
            return Response(
                {'detail': 'Parámetro tenant_id requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            tenant = Tenant.objects.get(id=tenant_id, is_active=True)
            serializer = TenantBrandingSerializer(tenant, context={'request': request})
            return Response(serializer.data)

        except (Tenant.DoesNotExist, ValueError):
            return Response(
                {'detail': 'Tenant no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

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
            'scope': '/',
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
        response = JsonResponse(manifest_data, content_type='application/manifest+json')
        # Evitar que el SW o el browser cacheen un manifest con branding incorrecto.
        # Cada request debe traer datos frescos del tenant actual.
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        return response

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

    @action(detail=False, methods=['post'], url_path='newsletter')
    def newsletter(self, request):
        """
        Suscribir email al newsletter de StrateKaz (público, sin auth).

        Usado desde el marketing site (stratekaz.com/recursos) para:
        - Capturar leads de descargas premium
        - Suscripciones al newsletter

        Body: { email, nombre?, source?, categorias? }
        Returns: 201 Created | 409 Conflict (ya suscrito) | 400 Bad Request
        """
        from django_tenants.utils import schema_context
        from .models_newsletter import NewsletterSubscriber

        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response(
                {'error': 'El campo email es requerido'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validacion basica de email
        import re
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
            return Response(
                {'error': 'Email no valido'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        nombre = request.data.get('nombre', '').strip()[:150]
        source = request.data.get('source', 'recursos')[:50]
        categorias = request.data.get('categorias', [])

        if not isinstance(categorias, list):
            categorias = []

        with schema_context('public'):
            subscriber, created = NewsletterSubscriber.objects.get_or_create(
                email=email,
                defaults={
                    'nombre': nombre,
                    'source': source,
                    'categorias': categorias,
                },
            )

            if not created:
                # Actualizar categorias si ya existe
                existing_cats = set(subscriber.categorias or [])
                new_cats = existing_cats | set(categorias)
                if new_cats != existing_cats:
                    subscriber.categorias = list(new_cats)
                    subscriber.save(update_fields=['categorias', 'updated_at'])

                return Response(
                    {'message': 'Ya estas suscrito', 'is_new': False},
                    status=status.HTTP_409_CONFLICT,
                )

        return Response(
            {'message': 'Suscripcion exitosa', 'is_new': True},
            status=status.HTTP_201_CREATED,
        )


# =============================================================================
# VIEW: Redirect público a carpetas Google Drive
# =============================================================================

_RESOURCE_DRIVE_URLS = {
    'digital':     'https://drive.google.com/drive/folders/1YaZId9e5wWPX1M_-NKNj3e2QKttfo8em',
    'sst':         'https://drive.google.com/drive/folders/1jhvr9ji_kzZEQA_HcP7AhXNuUzyMt2id',
    'calidad':     'https://drive.google.com/drive/folders/1h_NbirXk8A-5zeWTPPGcbOhvdXczUudH',
    'legal':       'https://drive.google.com/drive/folders/1OUAJNGf85_ua6RcQuTg9kQaGlbnH7FNo',
    'ambiental':   'https://drive.google.com/drive/folders/1IUbyqTZs4no1AI9fBQPegtVssv-twleQ',
    'talento':     'https://drive.google.com/drive/folders/1-6ODOZqRcmSoGNa3o4LqgccDdYZ3xXy-',
    'estrategia':  'https://drive.google.com/drive/folders/13u8sif429zmGYrC9IX7HDrZeQv9lapBT',
    'finanzas':    'https://drive.google.com/drive/folders/1_K0g_c_Uzkpm0E0mStX3ESmC4pfYOycy',
    'operaciones': 'https://drive.google.com/drive/folders/10neGKQJjvhoD9OpcsPUzWEdKU2nXaf21',
}


def recursos_acceder_view(request, code):
    """
    GET /api/tenant/public/recursos/<code>/acceder/

    Retorna JSON con la URL de la carpeta Google Drive.
    El frontend hace window.open() directo a Drive — evita conflictos con Service Worker.
    Acceso público, sin autenticación.
    """
    from django.http import JsonResponse, HttpResponseNotFound

    drive_url = _RESOURCE_DRIVE_URLS.get(code)
    if not drive_url:
        return HttpResponseNotFound('Categoría no encontrada')

    logger.info('resource_access category=%s ip=%s', code, request.META.get('REMOTE_ADDR', ''))
    return JsonResponse({'url': drive_url})
