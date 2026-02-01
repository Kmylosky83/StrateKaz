"""
URLs para Gestión de Calidad
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NoConformidadViewSet,
    AccionCorrectivaViewSet,
    SalidaNoConformeViewSet,
    SolicitudCambioViewSet,
    ControlCambioViewSet,
)

app_name = 'calidad'

router = DefaultRouter()
router.register(r'no-conformidades', NoConformidadViewSet, basename='no-conformidad')
router.register(r'acciones-correctivas', AccionCorrectivaViewSet, basename='accion-correctiva')
router.register(r'salidas-no-conformes', SalidaNoConformeViewSet, basename='salida-no-conforme')
router.register(r'solicitudes-cambio', SolicitudCambioViewSet, basename='solicitud-cambio')
router.register(r'control-cambios', ControlCambioViewSet, basename='control-cambio')

urlpatterns = [
    path('', include(router.urls)),
]
