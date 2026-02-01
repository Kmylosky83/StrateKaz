"""
URLs para Gestión de Almacenamiento e Inventario - Supply Chain
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TipoMovimientoInventarioViewSet,
    EstadoInventarioViewSet,
    TipoAlertaViewSet,
    UnidadMedidaViewSet,
    InventarioViewSet,
    MovimientoInventarioViewSet,
    KardexViewSet,
    AlertaStockViewSet,
    ConfiguracionStockViewSet,
    DashboardInventarioViewSet,
)

app_name = 'almacenamiento'

router = DefaultRouter()

# Catálogos dinámicos
router.register(r'tipos-movimiento', TipoMovimientoInventarioViewSet, basename='tipo-movimiento')
router.register(r'estados-inventario', EstadoInventarioViewSet, basename='estado-inventario')
router.register(r'tipos-alerta', TipoAlertaViewSet, basename='tipo-alerta')
router.register(r'unidades-medida', UnidadMedidaViewSet, basename='unidad-medida')

# Modelos principales
router.register(r'inventarios', InventarioViewSet, basename='inventario')
router.register(r'movimientos-inventario', MovimientoInventarioViewSet, basename='movimiento-inventario')
router.register(r'kardex', KardexViewSet, basename='kardex')
router.register(r'alertas-stock', AlertaStockViewSet, basename='alerta-stock')
router.register(r'configuracion-stock', ConfiguracionStockViewSet, basename='configuracion-stock')

# Dashboard
router.register(r'dashboard-inventario', DashboardInventarioViewSet, basename='dashboard-inventario')

urlpatterns = [
    path('', include(router.urls)),
]
