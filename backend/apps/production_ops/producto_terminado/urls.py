"""
URLs para Producto Terminado - Production Ops
Sistema de Gestión Grasas y Huesos del Norte

Configuración de rutas para API REST de producto terminado.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoProductoViewSet,
    EstadoLoteViewSet,
    ProductoTerminadoViewSet,
    StockProductoViewSet,
    LiberacionViewSet,
    CertificadoCalidadViewSet,
)

app_name = 'producto_terminado'

# Router para ViewSets
router = DefaultRouter()
router.register(r'tipos-producto', TipoProductoViewSet, basename='tipo-producto')
router.register(r'estados-lote', EstadoLoteViewSet, basename='estado-lote')
router.register(r'productos', ProductoTerminadoViewSet, basename='producto')
router.register(r'stocks', StockProductoViewSet, basename='stock')
router.register(r'liberaciones', LiberacionViewSet, basename='liberacion')
router.register(r'certificados', CertificadoCalidadViewSet, basename='certificado')

urlpatterns = [
    path('', include(router.urls)),
]
