"""
URLs para mejora_continua - hseq_management
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ProgramaAuditoriaViewSet,
    AuditoriaViewSet,
    HallazgoViewSet,
    EvaluacionCumplimientoViewSet,
)

app_name = 'mejora_continua'

router = DefaultRouter()
router.register(r'programas-auditoria', ProgramaAuditoriaViewSet, basename='programa-auditoria')
router.register(r'auditorias', AuditoriaViewSet, basename='auditoria')
router.register(r'hallazgos', HallazgoViewSet, basename='hallazgo')
router.register(r'evaluaciones-cumplimiento', EvaluacionCumplimientoViewSet, basename='evaluacion-cumplimiento')

urlpatterns = [
    path('', include(router.urls)),
]
