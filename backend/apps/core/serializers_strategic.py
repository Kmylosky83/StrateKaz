"""
DEPRECATED: Este archivo ha sido movido a apps.gestion_estrategica.serializers_strategic

Este archivo se mantiene por compatibilidad hacia atrás.
Por favor, actualice sus imports para usar la nueva ubicación:

    # Antes (deprecated):
    from apps.core.serializers_strategic import CorporateIdentityDetailSerializer

    # Ahora (correcto):
    from apps.gestion_estrategica.serializers_strategic import CorporateIdentityDetailSerializer

Este archivo será eliminado en una versión futura.
"""
import warnings

# Emitir warning de deprecación al importar este módulo
warnings.warn(
    "El módulo 'apps.core.serializers_strategic' está deprecated. "
    "Use 'apps.gestion_estrategica.serializers_strategic' en su lugar.",
    DeprecationWarning,
    stacklevel=2
)

# Re-exportar todo desde la nueva ubicación para mantener compatibilidad
from apps.gestion_estrategica.serializers_strategic import (
    # TAB 1: IDENTIDAD CORPORATIVA
    CorporateValueSerializer,
    CorporateValueCreateSerializer,
    CorporateIdentityListSerializer,
    CorporateIdentityDetailSerializer,
    CorporateIdentityCreateSerializer,
    CorporateIdentityUpdateSerializer,
    SignPolicySerializer,

    # TAB 2: PLANEACIÓN ESTRATÉGICA
    StrategicObjectiveListSerializer,
    StrategicObjectiveDetailSerializer,
    StrategicObjectiveCreateSerializer,
    StrategicObjectiveUpdateSerializer,
    StrategicPlanListSerializer,
    StrategicPlanDetailSerializer,
    StrategicPlanCreateSerializer,
    StrategicPlanUpdateSerializer,
    ApprovePlanSerializer,

    # TAB 4: CONFIGURACIÓN - Módulos del Sistema
    SystemModuleListSerializer,
    SystemModuleDetailSerializer,
    SystemModuleCreateSerializer,
    SystemModuleUpdateSerializer,
    ToggleModuleSerializer,

    # TAB 4: CONFIGURACIÓN - Branding
    BrandingConfigSerializer,
    BrandingConfigCreateSerializer,
    BrandingConfigUpdateSerializer,

    # SISTEMA DINÁMICO DE MÓDULOS - Tabs y Secciones
    TabSectionSerializer,
    TabSectionCreateSerializer,
    ToggleSectionSerializer,
    ModuleTabSerializer,
    ModuleTabCreateSerializer,
    ToggleTabSerializer,

    # SISTEMA DINÁMICO DE MÓDULOS - Árbol completo
    SystemModuleTreeSerializer,
    ModulesTreeSerializer,

    # SIDEBAR
    SidebarSectionSerializer,
    SidebarTabSerializer,
    SidebarModuleSerializer,

    # ESTADÍSTICAS
    StrategicStatsSerializer,
)

# Definir __all__ para exports explícitos
__all__ = [
    # TAB 1: IDENTIDAD CORPORATIVA
    'CorporateValueSerializer',
    'CorporateValueCreateSerializer',
    'CorporateIdentityListSerializer',
    'CorporateIdentityDetailSerializer',
    'CorporateIdentityCreateSerializer',
    'CorporateIdentityUpdateSerializer',
    'SignPolicySerializer',

    # TAB 2: PLANEACIÓN ESTRATÉGICA
    'StrategicObjectiveListSerializer',
    'StrategicObjectiveDetailSerializer',
    'StrategicObjectiveCreateSerializer',
    'StrategicObjectiveUpdateSerializer',
    'StrategicPlanListSerializer',
    'StrategicPlanDetailSerializer',
    'StrategicPlanCreateSerializer',
    'StrategicPlanUpdateSerializer',
    'ApprovePlanSerializer',

    # TAB 4: CONFIGURACIÓN - Módulos del Sistema
    'SystemModuleListSerializer',
    'SystemModuleDetailSerializer',
    'SystemModuleCreateSerializer',
    'SystemModuleUpdateSerializer',
    'ToggleModuleSerializer',

    # TAB 4: CONFIGURACIÓN - Branding
    'BrandingConfigSerializer',
    'BrandingConfigCreateSerializer',
    'BrandingConfigUpdateSerializer',

    # SISTEMA DINÁMICO DE MÓDULOS - Tabs y Secciones
    'TabSectionSerializer',
    'TabSectionCreateSerializer',
    'ToggleSectionSerializer',
    'ModuleTabSerializer',
    'ModuleTabCreateSerializer',
    'ToggleTabSerializer',

    # SISTEMA DINÁMICO DE MÓDULOS - Árbol completo
    'SystemModuleTreeSerializer',
    'ModulesTreeSerializer',

    # SIDEBAR
    'SidebarSectionSerializer',
    'SidebarTabSerializer',
    'SidebarModuleSerializer',

    # ESTADÍSTICAS
    'StrategicStatsSerializer',
]
