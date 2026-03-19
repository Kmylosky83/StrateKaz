"""
URLs para Onboarding e Inducción - Talent Hub
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ModuloInduccionViewSet,
    AsignacionPorCargoViewSet,
    ItemChecklistViewSet,
    ChecklistIngresoViewSet,
    EjecucionIntegralViewSet,
    # EntregaEPPViewSet DEPRECATED — EPP ahora se gestiona vía HSEQ Seguridad Industrial
    EntregaActivoViewSet,
    FirmaDocumentoViewSet,
    OnboardingEstadisticasViewSet,
)

app_name = 'onboarding_induccion'

router = DefaultRouter()
router.register(r'modulos', ModuloInduccionViewSet, basename='modulos')
router.register(r'asignaciones-cargo', AsignacionPorCargoViewSet, basename='asignaciones-cargo')
router.register(r'items-checklist', ItemChecklistViewSet, basename='items-checklist')
router.register(r'checklist-ingreso', ChecklistIngresoViewSet, basename='checklist-ingreso')
router.register(r'ejecuciones', EjecucionIntegralViewSet, basename='ejecuciones')
# entregas-epp DEPRECATED — FE ahora llama a /api/hseq/seguridad/entregas-epp/ directamente
router.register(r'entregas-activos', EntregaActivoViewSet, basename='entregas-activos')
router.register(r'firmas-documentos', FirmaDocumentoViewSet, basename='firmas-documentos')
router.register(r'estadisticas', OnboardingEstadisticasViewSet, basename='estadisticas')

urlpatterns = [
    path('', include(router.urls)),
]
