"""
URLs del módulo Proveedores - API REST
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import (
    UnidadNegocioViewSet,
    ProveedorViewSet,
    HistorialPrecioViewSet,
    CondicionComercialViewSet,
    PruebaAcidezViewSet,
)

router = DefaultRouter()

# Registrar ViewSets
router.register(r'unidades-negocio', UnidadNegocioViewSet, basename='unidadnegocio')
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'historial-precios', HistorialPrecioViewSet, basename='historialprecio')
router.register(r'condiciones-comerciales', CondicionComercialViewSet, basename='condicioncomercial')
router.register(r'pruebas-acidez', PruebaAcidezViewSet, basename='pruebaacidez')

urlpatterns = [
    path('', include(router.urls)),
]
