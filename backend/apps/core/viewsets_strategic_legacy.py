"""
ViewSets Legacy para Dirección Estratégica
Sistema de Gestión StrateKaz

DEPRECADO: Este módulo contiene proxies para mantener compatibilidad con URLs legacy.
Los ViewSets reales ahora están en sus respectivas apps:
- apps.gestion_estrategica.identidad.views
- apps.gestion_estrategica.planeacion.views

Estos proxies se mantendrán temporalmente para no romper URLs existentes en:
- /api/core/corporate-identity/
- /api/core/corporate-values/
- /api/core/strategic-plans/
- /api/core/strategic-objectives/

TODO: Eventualmente migrar todos los endpoints a sus URLs canónicas:
- /api/identidad/corporate-identity/
- /api/identidad/corporate-values/
- /api/planeacion/strategic-plans/
- /api/planeacion/strategic-objectives/
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

# Importar ViewSets reales desde sus apps correspondientes
try:
    from apps.gestion_estrategica.identidad.views import (
        CorporateIdentityViewSet as _CorporateIdentityViewSet,
        CorporateValueViewSet as _CorporateValueViewSet,
    )
    IDENTIDAD_AVAILABLE = True
except ImportError:
    IDENTIDAD_AVAILABLE = False

try:
    from apps.gestion_estrategica.planeacion.views import (
        StrategicPlanViewSet as _StrategicPlanViewSet,
        StrategicObjectiveViewSet as _StrategicObjectiveViewSet,
    )
    PLANEACION_AVAILABLE = True
except ImportError:
    PLANEACION_AVAILABLE = False


# =============================================================================
# PROXIES PARA IDENTIDAD CORPORATIVA
# =============================================================================

if IDENTIDAD_AVAILABLE:
    class CorporateIdentityViewSet(_CorporateIdentityViewSet):
        """
        DEPRECADO: Proxy para CorporateIdentityViewSet

        Mantiene compatibilidad con URL legacy: /api/core/corporate-identity/
        Redirige todas las peticiones al ViewSet real en apps.gestion_estrategica.identidad

        Use la URL canónica: /api/identidad/corporate-identity/
        """
        pass

    class CorporateValueViewSet(_CorporateValueViewSet):
        """
        DEPRECADO: Proxy para CorporateValueViewSet

        Mantiene compatibilidad con URL legacy: /api/core/corporate-values/
        Redirige todas las peticiones al ViewSet real en apps.gestion_estrategica.identidad

        Use la URL canónica: /api/identidad/corporate-values/
        """
        pass
else:
    # Si la app de identidad no está disponible, crear stubs vacíos
    class CorporateIdentityViewSet(viewsets.ViewSet):
        """Stub: App identidad no disponible"""
        def list(self, request):
            return Response({
                'error': 'Módulo de Identidad Corporativa no disponible'
            }, status=503)

    class CorporateValueViewSet(viewsets.ViewSet):
        """Stub: App identidad no disponible"""
        def list(self, request):
            return Response({
                'error': 'Módulo de Identidad Corporativa no disponible'
            }, status=503)


# =============================================================================
# PROXIES PARA PLANEACIÓN ESTRATÉGICA
# =============================================================================

if PLANEACION_AVAILABLE:
    class StrategicPlanViewSet(_StrategicPlanViewSet):
        """
        DEPRECADO: Proxy para StrategicPlanViewSet

        Mantiene compatibilidad con URL legacy: /api/core/strategic-plans/
        Redirige todas las peticiones al ViewSet real en apps.gestion_estrategica.planeacion

        Use la URL canónica: /api/planeacion/strategic-plans/
        """
        pass

    class StrategicObjectiveViewSet(_StrategicObjectiveViewSet):
        """
        DEPRECADO: Proxy para StrategicObjectiveViewSet

        Mantiene compatibilidad con URL legacy: /api/core/strategic-objectives/
        Redirige todas las peticiones al ViewSet real en apps.gestion_estrategica.planeacion

        Use la URL canónica: /api/planeacion/strategic-objectives/
        """
        pass
else:
    # Si la app de planeacion no está disponible, crear stubs vacíos
    class StrategicPlanViewSet(viewsets.ViewSet):
        """Stub: App planeacion no disponible"""
        def list(self, request):
            return Response({
                'error': 'Módulo de Planeación Estratégica no disponible'
            }, status=503)

    class StrategicObjectiveViewSet(viewsets.ViewSet):
        """Stub: App planeacion no disponible"""
        def list(self, request):
            return Response({
                'error': 'Módulo de Planeación Estratégica no disponible'
            }, status=503)
