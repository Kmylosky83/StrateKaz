from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FactorRiesgoVialViewSet,
    RiesgoVialViewSet,
    ControlVialViewSet,
    IncidenteVialViewSet,
    InspeccionVehiculoViewSet,
)

app_name = 'riesgos_viales'

router = DefaultRouter()
router.register(r'factores', FactorRiesgoVialViewSet, basename='factor-riesgo-vial')
router.register(r'riesgos', RiesgoVialViewSet, basename='riesgo-vial')
router.register(r'controles', ControlVialViewSet, basename='control-vial')
router.register(r'incidentes', IncidenteVialViewSet, basename='incidente-vial')
router.register(r'inspecciones', InspeccionVehiculoViewSet, basename='inspeccion-vehiculo')

urlpatterns = [
    path('', include(router.urls)),
]
