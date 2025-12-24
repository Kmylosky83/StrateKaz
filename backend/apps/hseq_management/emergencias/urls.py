"""
URLs para Gestión de Emergencias
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnalisisVulnerabilidadViewSet, AmenazaViewSet, PlanEmergenciaViewSet,
    ProcedimientoEmergenciaViewSet, PlanoEvacuacionViewSet, TipoBrigadaViewSet,
    BrigadaViewSet, BrigadistaActivoViewSet, SimulacroViewSet,
    EvaluacionSimulacroViewSet, RecursoEmergenciaViewSet, InspeccionRecursoViewSet
)

app_name = 'emergencias'

router = DefaultRouter()
router.register(r'analisis-vulnerabilidad', AnalisisVulnerabilidadViewSet, basename='analisis-vulnerabilidad')
router.register(r'amenazas', AmenazaViewSet, basename='amenazas')
router.register(r'planes-emergencia', PlanEmergenciaViewSet, basename='planes-emergencia')
router.register(r'procedimientos', ProcedimientoEmergenciaViewSet, basename='procedimientos')
router.register(r'planos-evacuacion', PlanoEvacuacionViewSet, basename='planos-evacuacion')
router.register(r'tipos-brigadas', TipoBrigadaViewSet, basename='tipos-brigadas')
router.register(r'brigadas', BrigadaViewSet, basename='brigadas')
router.register(r'brigadistas', BrigadistaActivoViewSet, basename='brigadistas')
router.register(r'simulacros', SimulacroViewSet, basename='simulacros')
router.register(r'evaluaciones-simulacros', EvaluacionSimulacroViewSet, basename='evaluaciones-simulacros')
router.register(r'recursos', RecursoEmergenciaViewSet, basename='recursos')
router.register(r'inspecciones-recursos', InspeccionRecursoViewSet, basename='inspecciones-recursos')

urlpatterns = [
    path('', include(router.urls)),
]
