"""
URLs del módulo Firma Digital - Workflow Engine
Sistema de Gestión StrateKaz

Endpoints:
- /flujos/ - Configuración de flujos de firma
- /nodos/ - Nodos de flujo
- /firmas/ - Firmas digitales
- /historial-firmas/ - Historial de firmas
- /delegaciones/ - Delegaciones de firma
- /config-revision/ - Configuración de revisión periódica
- /alertas/ - Alertas de revisión
- /versiones/ - Historial de versiones
- /workflow/ - Acciones de workflow (iniciar, firmar, rechazar, renovar)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConfiguracionFlujoFirmaViewSet,
    FlowNodeViewSet,
    FirmaDigitalViewSet,
    HistorialFirmaViewSet,
    DelegacionFirmaViewSet,
    ConfiguracionRevisionViewSet,
    AlertaRevisionViewSet,
    HistorialVersionViewSet,
    WorkflowPoliticasViewSet,
)

router = DefaultRouter()

# Configuración de flujos
router.register(r'flujos', ConfiguracionFlujoFirmaViewSet, basename='flujo-firma')
router.register(r'nodos', FlowNodeViewSet, basename='nodo-flujo')

# Firmas digitales
router.register(r'firmas', FirmaDigitalViewSet, basename='firma-digital')
router.register(r'historial-firmas', HistorialFirmaViewSet, basename='historial-firma')

# Delegaciones
router.register(r'delegaciones', DelegacionFirmaViewSet, basename='delegacion-firma')

# Revisión periódica
router.register(r'config-revision', ConfiguracionRevisionViewSet, basename='config-revision')
router.register(r'alertas', AlertaRevisionViewSet, basename='alerta-revision')

# Versionamiento
router.register(r'versiones', HistorialVersionViewSet, basename='historial-version')

# Workflow actions
router.register(r'workflow', WorkflowPoliticasViewSet, basename='workflow-politicas')

urlpatterns = [
    path('', include(router.urls)),
]
