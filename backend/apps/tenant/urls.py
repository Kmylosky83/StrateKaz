"""
URLs para Multi-Tenant System (django-tenants)

Incluye:
- CRUD de Tenants, Domains, Users, Plans (solo superadmins)
- Endpoints públicos para verificación de dominios
- Autenticación multi-tenant (login, refresh, logout, me)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TenantViewSet,
    TenantUserViewSet,
    DomainViewSet,
    PlanViewSet,
    PublicTenantViewSet,
)
from .auth_views import (
    TenantLoginView,
    TenantSelectView,
    TenantRefreshView,
    TenantLogoutView,
    TenantMeView,
)

router = DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'domains', DomainViewSet, basename='domain')
router.register(r'users', TenantUserViewSet, basename='tenant-user')
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'public', PublicTenantViewSet, basename='tenant-public')

urlpatterns = [
    # Autenticación Multi-Tenant
    path('auth/login/', TenantLoginView.as_view(), name='tenant-login'),
    path('auth/refresh/', TenantRefreshView.as_view(), name='tenant-refresh'),
    path('auth/logout/', TenantLogoutView.as_view(), name='tenant-logout'),
    path('auth/me/', TenantMeView.as_view(), name='tenant-me'),
    path('auth/select-tenant/', TenantSelectView.as_view(), name='tenant-select'),

    # ViewSets (CRUD)
    path('', include(router.urls)),
]
