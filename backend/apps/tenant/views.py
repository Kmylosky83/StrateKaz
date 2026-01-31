"""
Views para Multi-Tenant System

Endpoints para gestión de tenants desde el frontend.

ARQUITECTURA:
- TenantViewSet: CRUD de tenants (solo superadmins)
- TenantUserViewSet: Gestión de usuarios globales
- PlanViewSet: Consulta de planes (solo lectura para usuarios, CRUD para superadmins)
- PublicTenantViewSet: Endpoints públicos (sin auth)

NUEVO en v4.0:
- AdminGlobalViewSet: Panel de administración global para superusuarios
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count, Q

from apps.tenant.models import Tenant, TenantUser, TenantUserAccess, TenantDomain, Plan
from apps.tenant.serializers import (
    TenantSerializer,
    TenantMinimalSerializer,
    TenantUserSerializer,
    TenantUserAccessSerializer,
    TenantDomainSerializer,
    PlanSerializer,
    UserTenantsSerializer,
)


# =============================================================================
# PERMISOS PERSONALIZADOS
# =============================================================================

class IsSuperAdmin(BasePermission):
    """
    Permiso que solo permite acceso a superusuarios de Django.
    Usado para el panel de Admin Global.
    """
    message = 'Solo los superadministradores pueden acceder a esta función.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_superuser
        )


class TenantViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Tenants.

    Solo accesible por superadmins de Django.
    Proporciona CRUD completo + acciones adicionales.
    """
    queryset = Tenant.objects.select_related('plan').annotate(
        user_count=Count('user_accesses', filter=Q(user_accesses__is_active=True))
    ).all()
    serializer_class = TenantSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_trial', 'plan', 'tier']
    search_fields = ['name', 'code', 'subdomain', 'nit']
    ordering_fields = ['name', 'created_at', 'subscription_ends_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filtrar según permisos del usuario"""
        user = self.request.user

        # Solo superusuarios pueden ver todos los tenants
        if user.is_superuser:
            return self.queryset

        return self.queryset.none()

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        POST /api/tenant/tenants/{id}/toggle_active/
        Activa o desactiva un tenant.
        """
        tenant = self.get_object()
        tenant.is_active = not tenant.is_active
        tenant.save(update_fields=['is_active', 'updated_at'])

        return Response({
            'id': tenant.id,
            'is_active': tenant.is_active,
            'message': f"Tenant {'activado' if tenant.is_active else 'desactivado'} correctamente"
        })

    @action(detail=True, methods=['get'])
    def users(self, request, pk=None):
        """
        GET /api/tenant/tenants/{id}/users/
        Lista usuarios con acceso a este tenant.
        """
        tenant = self.get_object()
        accesses = TenantUserAccess.objects.filter(
            tenant=tenant
        ).select_related('tenant_user')

        data = []
        for access in accesses:
            data.append({
                'id': access.tenant_user.id,
                'email': access.tenant_user.email,
                'full_name': access.tenant_user.full_name,
                'role': access.role,
                'is_active': access.is_active,
                'last_login': access.tenant_user.last_login,
            })

        return Response({'users': data, 'count': len(data)})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/tenant/tenants/stats/
        Estadísticas globales de tenants para dashboard admin.
        """
        today = timezone.now().date()

        total = Tenant.objects.count()
        active = Tenant.objects.filter(is_active=True).count()
        trial = Tenant.objects.filter(is_trial=True, is_active=True).count()
        expiring_soon = Tenant.objects.filter(
            subscription_ends_at__lte=today + timezone.timedelta(days=30),
            subscription_ends_at__gte=today,
            is_active=True
        ).count()
        expired = Tenant.objects.filter(
            subscription_ends_at__lt=today,
            is_active=True
        ).count()

        # Tenants por plan
        by_plan = list(Tenant.objects.values('plan__name').annotate(
            count=Count('id')
        ).order_by('-count'))

        return Response({
            'total': total,
            'active': active,
            'inactive': total - active,
            'trial': trial,
            'expiring_soon': expiring_soon,
            'expired': expired,
            'by_plan': by_plan,
        })


class TenantUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios globales.

    - Usuarios normales: solo pueden ver su propio perfil (/me/)
    - Superadmins: CRUD completo de usuarios globales
    """
    queryset = TenantUser.objects.prefetch_related('tenants', 'accesses__tenant').all()
    serializer_class = TenantUserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_superadmin']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['email', 'last_login', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Solo superadmins pueden ver todos los usuarios"""
        if self.request.user.is_superuser:
            return self.queryset
        # Usuarios normales solo pueden verse a sí mismos
        return self.queryset.filter(email=self.request.user.email)

    def get_permissions(self):
        """Acciones CRUD requieren superadmin"""
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'list']:
            if self.action == 'list' and not self.request.user.is_superuser:
                return [IsAuthenticated()]  # Retornará queryset vacío
            return [IsSuperAdmin()] if self.action != 'list' else [IsAuthenticated()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/tenant/users/stats/
        Estadísticas de usuarios globales para admin.
        """
        if not request.user.is_superuser:
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        total = TenantUser.objects.count()
        active = TenantUser.objects.filter(is_active=True).count()
        superadmins = TenantUser.objects.filter(is_superadmin=True).count()

        # Usuarios por cantidad de tenants
        multi_tenant = TenantUser.objects.annotate(
            tenant_count=Count('accesses', filter=Q(accesses__is_active=True))
        ).filter(tenant_count__gt=1).count()

        return Response({
            'total': total,
            'active': active,
            'inactive': total - active,
            'superadmins': superadmins,
            'multi_tenant': multi_tenant,
        })

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def assign_tenant(self, request, pk=None):
        """
        POST /api/tenant/users/{id}/assign_tenant/
        Asigna un usuario a un tenant.

        Body: { "tenant_id": 1, "role": "admin" }
        """
        user = self.get_object()
        tenant_id = request.data.get('tenant_id')
        role = request.data.get('role', 'user')

        if not tenant_id:
            return Response({'detail': 'tenant_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response({'detail': 'Tenant no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        access, created = TenantUserAccess.objects.update_or_create(
            tenant_user=user,
            tenant=tenant,
            defaults={
                'role': role,
                'is_active': True,
                'granted_by': request.user.email,
            }
        )

        return Response({
            'message': f"Usuario {'asignado' if created else 'actualizado'} correctamente",
            'tenant': tenant.name,
            'role': role,
        })

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def remove_tenant(self, request, pk=None):
        """
        POST /api/tenant/users/{id}/remove_tenant/
        Remueve acceso de un usuario a un tenant.

        Body: { "tenant_id": 1 }
        """
        user = self.get_object()
        tenant_id = request.data.get('tenant_id')

        if not tenant_id:
            return Response({'detail': 'tenant_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            access = TenantUserAccess.objects.get(tenant_user=user, tenant_id=tenant_id)
            access.is_active = False
            access.save(update_fields=['is_active', 'updated_at'])
            return Response({'message': 'Acceso removido correctamente'})
        except TenantUserAccess.DoesNotExist:
            return Response({'detail': 'Acceso no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        GET /api/tenant/users/me/
        Retorna el usuario global actual con sus tenants.
        """
        email = request.user.email
        try:
            tenant_user = TenantUser.objects.prefetch_related(
                'accesses__tenant__plan'
            ).get(email=email)

            return Response(UserTenantsSerializer(tenant_user).data)
        except TenantUser.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado en sistema multi-tenant'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def tenants(self, request):
        """
        GET /api/tenant/users/tenants/
        Retorna la lista de tenants a los que el usuario tiene acceso.
        """
        email = request.user.email
        try:
            tenant_user = TenantUser.objects.prefetch_related(
                'accesses__tenant__plan'
            ).get(email=email)

            accesses = tenant_user.accesses.filter(
                is_active=True,
                tenant__is_active=True
            ).select_related('tenant')

            tenants_data = []
            for access in accesses:
                tenant = access.tenant
                tenants_data.append({
                    'tenant': {
                        'id': tenant.id,
                        'code': tenant.code,
                        'name': tenant.name,
                        'subdomain': tenant.subdomain,
                        'logo_url': tenant.logo_url,
                        'primary_color': tenant.primary_color,
                        'is_active': tenant.is_active,
                    },
                    'role': access.role,
                    'is_active': access.is_active,
                })

            return Response({
                'tenants': tenants_data,
                'last_tenant_id': tenant_user.last_tenant_id,
            })

        except TenantUser.DoesNotExist:
            return Response({
                'tenants': [],
                'last_tenant_id': None,
            })

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def select(self, request):
        """
        POST /api/tenant/users/select/
        Selecciona un tenant y retorna la URL de redirección.

        Body: { "tenant_id": 1 }
        """
        tenant_id = request.data.get('tenant_id')
        if not tenant_id:
            return Response(
                {'detail': 'tenant_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = request.user.email

        try:
            tenant_user = TenantUser.objects.get(email=email)
        except TenantUser.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar acceso al tenant
        try:
            access = TenantUserAccess.objects.select_related('tenant').get(
                tenant_user=tenant_user,
                tenant_id=tenant_id,
                is_active=True,
                tenant__is_active=True
            )
        except TenantUserAccess.DoesNotExist:
            return Response(
                {'detail': 'No tienes acceso a esta empresa'},
                status=status.HTTP_403_FORBIDDEN
            )

        tenant = access.tenant

        # Verificar suscripción válida
        if not tenant.is_subscription_valid:
            return Response(
                {'detail': 'La suscripción de esta empresa ha vencido'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Actualizar último tenant
        tenant_user.last_tenant = tenant
        tenant_user.last_login = timezone.now()
        tenant_user.save(update_fields=['last_tenant', 'last_login'])

        # Generar URL de redirección
        # En desarrollo local, redirigir a localhost con header X-Tenant-ID
        from django.conf import settings
        if settings.DEBUG:
            # En desarrollo, usar localhost y pasar tenant_id como parámetro
            frontend_port = '3010'  # Puerto del frontend en desarrollo
            redirect_url = f"http://localhost:{frontend_port}/auth/callback?tenant_id={tenant.id}"
        else:
            # En producción, usar el dominio real del tenant
            redirect_url = f"https://{tenant.full_domain}/auth/callback"

        return Response({
            'redirect_url': redirect_url,
            'tenant': {
                'id': tenant.id,
                'code': tenant.code,
                'name': tenant.name,
                'subdomain': tenant.subdomain,
                'logo_url': tenant.logo_url,
                'primary_color': tenant.primary_color,
            }
        })


class PlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Planes.

    - Usuarios autenticados: solo lectura de planes activos
    - Superadmins: CRUD completo
    """
    queryset = Plan.objects.annotate(
        tenant_count=Count('tenants', filter=Q(tenants__is_active=True))
    ).all()
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['order', 'price_monthly', 'name']
    ordering = ['order', 'price_monthly']

    def get_queryset(self):
        """Solo mostrar planes activos a usuarios normales"""
        if self.request.user.is_superuser:
            return self.queryset
        return self.queryset.filter(is_active=True)

    def get_permissions(self):
        """Superadmins pueden crear/editar/eliminar"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/tenant/plans/stats/
        Estadísticas de planes para admin.
        """
        if not request.user.is_superuser:
            return Response(
                {'detail': 'No autorizado'},
                status=status.HTTP_403_FORBIDDEN
            )

        plans_data = []
        for plan in Plan.objects.all():
            tenant_count = Tenant.objects.filter(plan=plan, is_active=True).count()
            plans_data.append({
                'id': plan.id,
                'name': plan.name,
                'code': plan.code,
                'price_monthly': str(plan.price_monthly),
                'tenant_count': tenant_count,
                'is_active': plan.is_active,
            })

        return Response({'plans': plans_data})


class PublicTenantViewSet(viewsets.ViewSet):
    """
    Endpoints públicos para tenant (sin autenticación).
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def check(self, request):
        """
        GET /api/tenant/public/check/?subdomain=xxx
        Verifica si un subdominio existe y está activo.
        """
        subdomain = request.query_params.get('subdomain')
        if not subdomain:
            return Response(
                {'detail': 'subdomain es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            tenant = Tenant.objects.get(subdomain=subdomain, is_active=True)
            return Response({
                'exists': True,
                'name': tenant.name,
                'logo_url': tenant.logo_url,
                'primary_color': tenant.primary_color,
                'is_subscription_valid': tenant.is_subscription_valid,
            })
        except Tenant.DoesNotExist:
            return Response({
                'exists': False,
            })
