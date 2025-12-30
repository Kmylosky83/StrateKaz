"""
URLs para Riesgos de Procesos - ISO 31000
==========================================

Endpoints:
- /api/motor-riesgos/riesgos/categorias/
- /api/motor-riesgos/riesgos/riesgos/
- /api/motor-riesgos/riesgos/tratamientos/
- /api/motor-riesgos/riesgos/controles/
- /api/motor-riesgos/riesgos/oportunidades/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaRiesgoViewSet,
    RiesgoProcesoViewSet,
    TratamientoRiesgoViewSet,
    ControlOperacionalViewSet,
    OportunidadViewSet
)

router = DefaultRouter()
router.register(r'categorias', CategoriaRiesgoViewSet, basename='categoria-riesgo')
router.register(r'riesgos', RiesgoProcesoViewSet, basename='riesgo-proceso')
router.register(r'tratamientos', TratamientoRiesgoViewSet, basename='tratamiento-riesgo')
router.register(r'controles', ControlOperacionalViewSet, basename='control-operacional')
router.register(r'oportunidades', OportunidadViewSet, basename='oportunidad')

urlpatterns = [
    path('', include(router.urls)),
]
