"""
URLs para el modulo Core - API REST
Sistema de Gestion Grasas y Huesos del Norte

Incluye endpoints para:
- Gestion de usuarios
- Sistema RBAC (Cargos, Roles, Grupos, Permisos)
- Menu dinamico
- Dirección Estratégica (Identidad, Planeación, Configuración)
"""
from django.urls import path, include
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
from .viewsets_strategic import (
    CorporateIdentityViewSet,
    CorporateValueViewSet,
    StrategicPlanViewSet,
    StrategicObjectiveViewSet,
    SystemModuleViewSet,
    ModuleTabViewSet,
    TabSectionViewSet,
    BrandingConfigViewSet,
    StrategicStatsViewSet,
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

# Endpoints Dirección Estratégica - Tab 1: Identidad
router.register(r'corporate-identity', CorporateIdentityViewSet, basename='corporate-identity')
router.register(r'corporate-values', CorporateValueViewSet, basename='corporate-value')

# Endpoints Dirección Estratégica - Tab 2: Planeación
router.register(r'strategic-plans', StrategicPlanViewSet, basename='strategic-plan')
router.register(r'strategic-objectives', StrategicObjectiveViewSet, basename='strategic-objective')

# Endpoints Dirección Estratégica - Tab 4: Configuración
router.register(r'system-modules', SystemModuleViewSet, basename='system-module')
router.register(r'module-tabs', ModuleTabViewSet, basename='module-tab')
router.register(r'tab-sections', TabSectionViewSet, basename='tab-section')
router.register(r'branding', BrandingConfigViewSet, basename='branding')
# NOTA: Consecutivos fue migrado a /api/organizacion/consecutivos/

# Endpoints Estadísticas Dirección Estratégica
router.register(r'strategic', StrategicStatsViewSet, basename='strategic')

urlpatterns = [
    # Endpoints funcionales
    path('health/', health_check, name='health_check'),
    path('users/me/', current_user, name='current_user'),

    # Endpoints Celery Tasks
    path('test-celery/', test_celery_task, name='test_celery_task'),
    path('task-status/<str:task_id>/', task_status, name='task_status'),
    path('revoke-task/<str:task_id>/', revoke_task, name='revoke_task'),

    # Incluir rutas del router
    path('', include(router.urls)),
]
