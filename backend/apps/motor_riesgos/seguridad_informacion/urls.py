from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ActivoInformacionViewSet,
    AmenazaViewSet,
    VulnerabilidadViewSet,
    RiesgoSeguridadViewSet,
    ControlSeguridadViewSet,
    IncidenteSeguridadViewSet
)

router = DefaultRouter()
router.register(r'activos-informacion', ActivoInformacionViewSet, basename='activo-informacion')
router.register(r'amenazas', AmenazaViewSet, basename='amenaza')
router.register(r'vulnerabilidades', VulnerabilidadViewSet, basename='vulnerabilidad')
router.register(r'riesgos-seguridad', RiesgoSeguridadViewSet, basename='riesgo-seguridad')
router.register(r'controles-seguridad', ControlSeguridadViewSet, basename='control-seguridad')
router.register(r'incidentes-seguridad', IncidenteSeguridadViewSet, basename='incidente-seguridad')

urlpatterns = [
    path('', include(router.urls)),
]
