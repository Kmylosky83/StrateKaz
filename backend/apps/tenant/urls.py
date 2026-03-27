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
    recursos_acceder_view,
)
from .auth_views import (
    TenantLoginView,
    TenantSelectView,
    TenantRefreshView,
    TenantLogoutView,
    TenantMeView,
    TenantTwoFactorVerifyView,
    ForgotPasswordView,
    ResetPasswordView,
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
    path('auth/2fa-verify/', TenantTwoFactorVerifyView.as_view(), name='tenant-2fa-verify'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='tenant-forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='tenant-reset-password'),

    # Redirect público a carpetas Google Drive (sin auth, sin router)
    path('public/recursos/<str:code>/acceder/', recursos_acceder_view, name='recursos-acceder'),

    # ViewSets (CRUD)
    path('', include(router.urls)),
]
