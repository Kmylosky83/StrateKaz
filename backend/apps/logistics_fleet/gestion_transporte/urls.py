"""
URLs para Gestión de Transporte
Sistema de programación, despachos y manifiestos
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TipoRutaViewSet, EstadoDespachoViewSet, RutaViewSet,
    ConductorViewSet, ProgramacionRutaViewSet, DespachoViewSet,
    DetalleDespachoViewSet, ManifiestoViewSet
)

app_name = 'gestion_transporte'

router = DefaultRouter()
router.register(r'tipos-ruta', TipoRutaViewSet, basename='tipo-ruta')
router.register(r'estados-despacho', EstadoDespachoViewSet, basename='estado-despacho')
router.register(r'rutas', RutaViewSet, basename='ruta')
router.register(r'conductores', ConductorViewSet, basename='conductor')
router.register(r'programaciones', ProgramacionRutaViewSet, basename='programacion')
router.register(r'despachos', DespachoViewSet, basename='despacho')
router.register(r'detalles-despacho', DetalleDespachoViewSet, basename='detalle-despacho')
router.register(r'manifiestos', ManifiestoViewSet, basename='manifiesto')

urlpatterns = [
    path('', include(router.urls)),
]
