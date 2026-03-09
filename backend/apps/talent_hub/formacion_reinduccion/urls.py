"""
URLs para Formación y Reinducción - Talent Hub
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PlanFormacionViewSet,
    CapacitacionViewSet,
    ProgramacionCapacitacionViewSet,
    EjecucionCapacitacionViewSet,
    BadgeViewSet,
    GamificacionViewSet,
    EvaluacionEficaciaViewSet,
    CertificadoViewSet,
    FormacionEstadisticasViewSet,
)
from .game_views import GameViewSet

app_name = 'formacion_reinduccion'

router = DefaultRouter()
router.register(r'planes-formacion', PlanFormacionViewSet, basename='planes-formacion')
router.register(r'capacitaciones', CapacitacionViewSet, basename='capacitaciones')
router.register(r'programaciones', ProgramacionCapacitacionViewSet, basename='programaciones')
router.register(r'ejecuciones', EjecucionCapacitacionViewSet, basename='ejecuciones')
router.register(r'badges', BadgeViewSet, basename='badges')
router.register(r'gamificacion', GamificacionViewSet, basename='gamificacion')
router.register(r'evaluaciones-eficacia', EvaluacionEficaciaViewSet, basename='evaluaciones-eficacia')
router.register(r'certificados', CertificadoViewSet, basename='certificados')
router.register(r'estadisticas', FormacionEstadisticasViewSet, basename='estadisticas')
router.register(r'juego-sst', GameViewSet, basename='juego-sst')

urlpatterns = [
    path('', include(router.urls)),
]
