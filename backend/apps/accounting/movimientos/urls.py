"""
URLs para movimientos - accounting
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComprobanteContableViewSet, DetalleComprobanteViewSet, SecuenciaDocumentoViewSet, AsientoPlantillaViewSet

app_name = 'movimientos'

router = DefaultRouter()
router.register(r'comprobantes', ComprobanteContableViewSet, basename='comprobante')
router.register(r'detalles', DetalleComprobanteViewSet, basename='detalle-comprobante')
router.register(r'secuencias', SecuenciaDocumentoViewSet, basename='secuencia-documento')
router.register(r'plantillas', AsientoPlantillaViewSet, basename='plantilla-asiento')

urlpatterns = [
    path('', include(router.urls)),
]
