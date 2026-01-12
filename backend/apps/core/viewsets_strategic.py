"""
DEPRECATED: Este modulo ha sido movido a apps.gestion_estrategica.viewsets_strategic

Este archivo se mantiene temporalmente para compatibilidad.
Sera eliminado en una version futura.

Usar: from apps.gestion_estrategica.viewsets_strategic import ...

ViewSets disponibles:
- CorporateIdentityViewSet: Identidad Corporativa
- CorporateValueViewSet: Valores Corporativos
- StrategicPlanViewSet: Planes Estrategicos
- StrategicObjectiveViewSet: Objetivos Estrategicos
- SystemModuleViewSet: Modulos del Sistema
- ModuleTabViewSet: Tabs de Modulos
- TabSectionViewSet: Secciones de Tabs
- BrandingConfigViewSet: Configuracion de Branding
- StrategicStatsViewSet: Estadisticas de Gestion Estrategica
"""
import warnings

warnings.warn(
    "viewsets_strategic en apps.core esta deprecated. "
    "Usar apps.gestion_estrategica.viewsets_strategic en su lugar.",
    DeprecationWarning,
    stacklevel=2
)

# Re-exportar desde nueva ubicacion para compatibilidad
from apps.gestion_estrategica.viewsets_strategic import (
    # Tab 1: Identidad Corporativa
    CorporateIdentityViewSet,
    CorporateValueViewSet,
    # Tab 2: Planeacion Estrategica
    StrategicPlanViewSet,
    StrategicObjectiveViewSet,
    # Tab 4: Configuracion
    SystemModuleViewSet,
    ModuleTabViewSet,
    TabSectionViewSet,
    BrandingConfigViewSet,
    # Estadisticas
    StrategicStatsViewSet,
)

# Mantener __all__ para claridad de las exportaciones
__all__ = [
    'CorporateIdentityViewSet',
    'CorporateValueViewSet',
    'StrategicPlanViewSet',
    'StrategicObjectiveViewSet',
    'SystemModuleViewSet',
    'ModuleTabViewSet',
    'TabSectionViewSet',
    'BrandingConfigViewSet',
    'StrategicStatsViewSet',
]
