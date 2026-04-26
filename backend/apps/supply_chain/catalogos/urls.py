"""
URLs para catalogos - supply_chain
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AlmacenViewSet,
    PrecioRutaSemiAutonomaViewSet,
    RutaParadaViewSet,
    RutaRecoleccionViewSet,
    TipoAlmacenViewSet,
)

app_name = 'catalogos'

router = DefaultRouter()
router.register(r'tipos-almacen', TipoAlmacenViewSet, basename='tipo-almacen')
router.register(r'almacenes', AlmacenViewSet, basename='almacen')
router.register(r'rutas-recoleccion', RutaRecoleccionViewSet, basename='ruta-recoleccion')
router.register(r'rutas-paradas', RutaParadaViewSet, basename='ruta-parada')
router.register(
    r'precios-ruta-semi', PrecioRutaSemiAutonomaViewSet, basename='precio-ruta-semi',
)

urlpatterns = [
    path('', include(router.urls)),
]
