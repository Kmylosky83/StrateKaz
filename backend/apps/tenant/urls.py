"""
URLs para Multi-Tenant System
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.tenant.views import (
    TenantViewSet,
    TenantUserViewSet,
    PlanViewSet,
    PublicTenantViewSet,
)
from apps.tenant.auth import (
    TenantTokenObtainView,
    TenantTokenRefreshView,
    TenantSelectView,
)

router = DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'users', TenantUserViewSet, basename='tenant-user')
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'public', PublicTenantViewSet, basename='tenant-public')

urlpatterns = [
    # Auth endpoints para multi-tenant
    path('auth/token/', TenantTokenObtainView.as_view(), name='tenant-token'),
    path('auth/refresh/', TenantTokenRefreshView.as_view(), name='tenant-token-refresh'),
    path('auth/select/', TenantSelectView.as_view(), name='tenant-select'),
    # Router URLs
    path('', include(router.urls)),
]
