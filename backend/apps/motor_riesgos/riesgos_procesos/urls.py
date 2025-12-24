from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaRiesgoViewSet,
    RiesgoProcesosViewSet,
    TratamientoRiesgoViewSet,
    MonitoreoRiesgoViewSet,
    MapaCalorViewSet
)

router = DefaultRouter()
router.register(r'categorias', CategoriaRiesgoViewSet, basename='categoria-riesgo')
router.register(r'riesgos', RiesgoProcesosViewSet, basename='riesgo-proceso')
router.register(r'tratamientos', TratamientoRiesgoViewSet, basename='tratamiento-riesgo')
router.register(r'monitoreos', MonitoreoRiesgoViewSet, basename='monitoreo-riesgo')
router.register(r'mapas-calor', MapaCalorViewSet, basename='mapa-calor')

urlpatterns = [
    path('', include(router.urls)),
]
