from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FactorRiesgoLAFTViewSet,
    SegmentoClienteViewSet,
    MatrizRiesgoLAFTViewSet,
    SenalAlertaViewSet,
    ReporteOperacionSospechosaViewSet,
    DebidaDiligenciaViewSet
)

app_name = 'sagrilaft_ptee'

router = DefaultRouter()
router.register(r'factores-riesgo', FactorRiesgoLAFTViewSet, basename='factor-riesgo')
router.register(r'segmentos', SegmentoClienteViewSet, basename='segmento')
router.register(r'matrices', MatrizRiesgoLAFTViewSet, basename='matriz')
router.register(r'senales-alerta', SenalAlertaViewSet, basename='senal-alerta')
router.register(r'reportes-ros', ReporteOperacionSospechosaViewSet, basename='reporte-ros')
router.register(r'debidas-diligencias', DebidaDiligenciaViewSet, basename='debida-diligencia')

urlpatterns = [
    path('', include(router.urls)),
]
