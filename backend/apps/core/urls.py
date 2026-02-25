"""
URLs para el modulo Core - API REST
Sistema de Gestion StrateKaz

Incluye endpoints para:
- Gestion de usuarios
- Sistema RBAC (Cargos, Roles, Grupos, Permisos)
- Menu dinamico
- Configuración del Sistema (Módulos, Tabs)

NOTA: Los endpoints de Identidad y Planeación se registran condicionalmente
cuando las apps gestion_estrategica.identidad/planeacion están activas.

NOTA: Branding se maneja ahora en /api/tenant/public/branding/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import health_check, current_user, test_celery_task, task_status, revoke_task, SetupPasswordView
from .viewsets import CargoViewSet, UserViewSet, PermisoViewSet
from .viewsets_rbac import (
    PermissionViewSet,
    RoleViewSet,
    CargoRBACViewSet,
    GroupViewSet,
    MenuViewSet,
    RBACStatsViewSet,
    RiesgoOcupacionalViewSet,
    RolAdicionalViewSet,
    UserRolesAdicionalesViewSet,
)
# ViewSets de Configuración (solo modelos de core, sin dependencias externas)
from .viewsets_config import (
    SystemModuleViewSet,
    ModuleTabViewSet,
    TabSectionViewSet,
)
# ViewSet de Sesiones de Usuario (MS-002-A)
from .viewsets_session import UserSessionViewSet
# View de Preferencias de Usuario (MS-003) - Singleton pattern
from .views import UserPreferencesView
# Views de Two Factor Authentication (2FA)
from .views.two_factor_views import (
    TwoFactorStatusView,
    TwoFactorSetupView,
    TwoFactorEnableView,
    TwoFactorDisableView,
    TwoFactorVerifyView,
    TwoFactorRegenerateBackupCodesView,
)
# Views de Sincronización de Secciones (RBAC v4.1)
from .api.sections_api import (
    get_all_sections,
    get_section_codes_typescript,
    get_user_section_access,
    invalidate_user_cache,
    invalidate_cargo_cache,
)
# Select Lists — Dropdowns compartidos entre modulos (Capa 0)
from .views.select_lists import (
    select_colaboradores,
    select_areas,
    select_proveedores,
    select_clientes,
    select_users,
    select_cargos,
    select_roles,
)

app_name = 'core'

# Configurar router para ViewSets
router = DefaultRouter()

# Endpoints existentes
router.register(r'cargos', CargoViewSet, basename='cargo')
router.register(r'users', UserViewSet, basename='user')
router.register(r'permisos', PermisoViewSet, basename='permiso')

# Endpoints RBAC nuevos
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'cargos-rbac', CargoRBACViewSet, basename='cargo-rbac')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'menus', MenuViewSet, basename='menu')
router.register(r'rbac', RBACStatsViewSet, basename='rbac')
router.register(r'riesgos-ocupacionales', RiesgoOcupacionalViewSet, basename='riesgo-ocupacional')

# Endpoints RBAC Híbrido - Roles Adicionales
router.register(r'roles-adicionales', RolAdicionalViewSet, basename='rol-adicional')

# Endpoints Configuración del Sistema (Tab 4) - Solo modelos de core
router.register(r'system-modules', SystemModuleViewSet, basename='system-module')
router.register(r'module-tabs', ModuleTabViewSet, basename='module-tab')
router.register(r'tab-sections', TabSectionViewSet, basename='tab-section')
# NOTA: Branding eliminado de core - ahora está en /api/tenant/public/branding/

# Endpoints Sesiones de Usuario (MS-002-A)
router.register(r'sessions', UserSessionViewSet, basename='session')

urlpatterns = [
    # Endpoints funcionales
    path('health/', health_check, name='health_check'),
    path('users/me/', current_user, name='current_user'),

    # Endpoints Celery Tasks
    path('test-celery/', test_celery_task, name='test_celery_task'),
    path('task-status/<str:task_id>/', task_status, name='task_status'),
    path('revoke-task/<str:task_id>/', revoke_task, name='revoke_task'),

    # Endpoints Two Factor Authentication (2FA)
    path('2fa/status/', TwoFactorStatusView.as_view(), name='2fa-status'),
    path('2fa/setup/', TwoFactorSetupView.as_view(), name='2fa-setup'),
    path('2fa/enable/', TwoFactorEnableView.as_view(), name='2fa-enable'),
    path('2fa/disable/', TwoFactorDisableView.as_view(), name='2fa-disable'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa-verify'),
    path('2fa/regenerate-backup-codes/', TwoFactorRegenerateBackupCodesView.as_view(), name='2fa-regenerate-backup-codes'),

    # Endpoints User Preferences (MS-003) - Singleton pattern
    path('user-preferences/', UserPreferencesView.as_view(), name='user-preferences'),

    # Setup Password (Talent Hub - configurar contraseña inicial)
    path('setup-password/', SetupPasswordView.as_view(), name='setup-password'),

    # Endpoints Sincronización de Secciones (RBAC v4.1)
    path('sections/all/', get_all_sections, name='sections-all'),
    path('sections/typescript/', get_section_codes_typescript, name='sections-typescript'),
    path('sections/user-access/', get_user_section_access, name='sections-user-access'),
    path('sections/invalidate-cache/', invalidate_user_cache, name='sections-invalidate-cache'),
    path('sections/invalidate-cargo-cache/', invalidate_cargo_cache, name='sections-invalidate-cargo-cache'),

    # ═══════════════════════════════════════════════════════════════
    # Select Lists — Dropdowns compartidos entre modulos (Capa 0)
    # GET /api/core/select-lists/{entidad}/
    # ═══════════════════════════════════════════════════════════════
    path('select-lists/colaboradores/', select_colaboradores, name='select-colaboradores'),
    path('select-lists/areas/', select_areas, name='select-areas'),
    path('select-lists/proveedores/', select_proveedores, name='select-proveedores'),
    path('select-lists/clientes/', select_clientes, name='select-clientes'),
    path('select-lists/users/', select_users, name='select-users'),
    path('select-lists/cargos/', select_cargos, name='select-cargos'),
    path('select-lists/roles/', select_roles, name='select-roles'),

    # Incluir rutas del router
    path('', include(router.urls)),
]
