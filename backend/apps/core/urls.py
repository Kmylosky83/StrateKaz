"""
URLs para el modulo Core - API REST
Sistema de Gestion StrateKaz

Incluye endpoints para:
- Gestion de usuarios
- Sistema RBAC (Cargos, Roles, Grupos, Permisos)
- Menu dinamico
- Configuración del Sistema (Módulos, Tabs, Branding)

NOTA: Los endpoints de Identidad y Planeación se registran condicionalmente
cuando las apps gestion_estrategica.identidad/planeacion están activas.
"""
from django.urls import path, include
from django.apps import apps
from rest_framework.routers import DefaultRouter
from .views import health_check, current_user, test_celery_task, task_status, revoke_task
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
    BrandingConfigViewSet,
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
router.register(r'branding', BrandingConfigViewSet, basename='branding')

# Endpoints Sesiones de Usuario (MS-002-A)
router.register(r'sessions', UserSessionViewSet, basename='session')

# ═══════════════════════════════════════════════════════════════════════════
# REGISTRO CONDICIONAL: Endpoints LEGACY que dependen de apps externas
# ═══════════════════════════════════════════════════════════════════════════
# DEPRECADO: Estos endpoints mantienen compatibilidad con URLs legacy.
# Use las URLs canónicas en las apps correspondientes:
# - /api/identidad/corporate-identity/
# - /api/identidad/corporate-values/
# - /api/planeacion/strategic-plans/
# - /api/planeacion/strategic-objectives/
# - /api/identidad/stats/

# Solo registrar si las apps de identidad y planeacion están instaladas
if apps.is_installed('apps.gestion_estrategica.identidad') and apps.is_installed('apps.gestion_estrategica.planeacion'):
    # DEPRECADO: Importar proxies desde viewsets_strategic_legacy
    # Estos proxies redirigen a los ViewSets reales en sus apps correspondientes
    from .viewsets_strategic_legacy import (
        CorporateIdentityViewSet,
        CorporateValueViewSet,
        StrategicPlanViewSet,
        StrategicObjectiveViewSet,
    )
    # Importar StrategicStatsViewSet desde su nueva ubicación en identidad
    from apps.gestion_estrategica.identidad.views_stats import StrategicStatsViewSet

    # Endpoints LEGACY Dirección Estratégica - Tab 1: Identidad
    # DEPRECADO: Use /api/identidad/corporate-identity/
    router.register(r'corporate-identity', CorporateIdentityViewSet, basename='corporate-identity')
    # DEPRECADO: Use /api/identidad/corporate-values/
    router.register(r'corporate-values', CorporateValueViewSet, basename='corporate-value')

    # Endpoints LEGACY Dirección Estratégica - Tab 2: Planeación
    # DEPRECADO: Use /api/planeacion/strategic-plans/
    router.register(r'strategic-plans', StrategicPlanViewSet, basename='strategic-plan')
    # DEPRECADO: Use /api/planeacion/strategic-objectives/
    router.register(r'strategic-objectives', StrategicObjectiveViewSet, basename='strategic-objective')

    # Endpoints LEGACY Estadísticas Dirección Estratégica
    # DEPRECADO: Use /api/identidad/stats/
    router.register(r'strategic', StrategicStatsViewSet, basename='strategic')

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

    # Incluir rutas del router
    path('', include(router.urls)),
]
