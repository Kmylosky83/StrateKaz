"""
URLs para Desempeño - Talent Hub
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CicloEvaluacionViewSet,
    CompetenciaEvaluacionViewSet,
    CriterioEvaluacionViewSet,
    EvaluacionDesempenoViewSet,
    DetalleEvaluacionViewSet,
    PlanMejoraViewSet,
    ActividadPlanMejoraViewSet,
    TipoReconocimientoViewSet,
    ReconocimientoViewSet,
    MuroReconocimientosViewSet,
    DesempenoEstadisticasViewSet,
)

app_name = 'desempeno'

router = DefaultRouter()
router.register(r'ciclos', CicloEvaluacionViewSet, basename='ciclos')
router.register(r'competencias', CompetenciaEvaluacionViewSet, basename='competencias')
router.register(r'criterios', CriterioEvaluacionViewSet, basename='criterios')
router.register(r'evaluaciones', EvaluacionDesempenoViewSet, basename='evaluaciones')
router.register(r'detalles-evaluacion', DetalleEvaluacionViewSet, basename='detalles-evaluacion')
router.register(r'planes-mejora', PlanMejoraViewSet, basename='planes-mejora')
router.register(r'actividades-plan', ActividadPlanMejoraViewSet, basename='actividades-plan')
router.register(r'tipos-reconocimiento', TipoReconocimientoViewSet, basename='tipos-reconocimiento')
router.register(r'reconocimientos', ReconocimientoViewSet, basename='reconocimientos')
router.register(r'muro', MuroReconocimientosViewSet, basename='muro')
router.register(r'estadisticas', DesempenoEstadisticasViewSet, basename='estadisticas')

urlpatterns = [
    path('', include(router.urls)),
]
