"""
viewsets_strategic_legacy.py - Proxies deprecados para backwards compatibility

DEPRECADO: Estos ViewSets son proxies que redirigen a las ubicaciones reales.
Usar directamente los endpoints de cada app:
- /api/identidad/ para identidad corporativa
- /api/planeacion/ para planeación estratégica

Los imports se mantienen para no romper urls.py existente.
"""
from apps.gestion_estrategica.identidad.views import (
    CorporateIdentityViewSet,
    CorporateValueViewSet,
)
from apps.gestion_estrategica.planeacion.views import (
    StrategicPlanViewSet,
    StrategicObjectiveViewSet,
)

__all__ = [
    'CorporateIdentityViewSet',
    'CorporateValueViewSet',
    'StrategicPlanViewSet',
    'StrategicObjectiveViewSet',
]
