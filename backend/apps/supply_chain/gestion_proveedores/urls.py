"""
URLs para Gestión de Proveedores (Supply Chain).

Post refactor 2026-04-21 (Proveedor → CT):
  Solo rutas de SC: modalidades logísticas, precios MP, historial precios.
  Proveedores y tipos-proveedor viven ahora en /api/catalogo-productos/.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .viewsets import (
    ModalidadLogisticaViewSet,
    PrecioMateriaPrimaViewSet,
    HistorialPrecioViewSet,
)

app_name = 'gestion_proveedores'

router = DefaultRouter()
router.register('modalidades-logistica', ModalidadLogisticaViewSet, basename='modalidad-logistica')
router.register('precios-mp', PrecioMateriaPrimaViewSet, basename='precio-mp')
router.register('historial-precios', HistorialPrecioViewSet, basename='historial-precio')

urlpatterns = [
    path('', include(router.urls)),
]
