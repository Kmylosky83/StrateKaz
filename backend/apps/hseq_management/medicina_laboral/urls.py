"""
URLs para Medicina Laboral - HSEQ Management
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TipoExamenViewSet,
    ExamenMedicoViewSet,
    RestriccionMedicaViewSet,
    ProgramaVigilanciaViewSet,
    CasoVigilanciaViewSet,
    DiagnosticoOcupacionalViewSet,
    EstadisticaMedicaViewSet
)

app_name = 'medicina_laboral'

router = DefaultRouter()

# Registrar ViewSets
router.register(r'tipos-examen', TipoExamenViewSet, basename='tipo-examen')
router.register(r'examenes', ExamenMedicoViewSet, basename='examen-medico')
router.register(r'restricciones', RestriccionMedicaViewSet, basename='restriccion-medica')
router.register(r'programas-vigilancia', ProgramaVigilanciaViewSet, basename='programa-vigilancia')
router.register(r'casos-vigilancia', CasoVigilanciaViewSet, basename='caso-vigilancia')
router.register(r'diagnosticos', DiagnosticoOcupacionalViewSet, basename='diagnostico-ocupacional')
router.register(r'estadisticas', EstadisticaMedicaViewSet, basename='estadistica-medica')

urlpatterns = [
    path('', include(router.urls)),
]
