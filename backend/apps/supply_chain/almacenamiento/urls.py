"""
URLs para Gestión de Almacenamiento e Inventario - Supply Chain

Convención: como ya estamos dentro del namespace /almacenamiento/, los
recursos se nombran en forma corta (movimientos/, alertas/, configuraciones/)
para alinear con el FE en almacenamientoApi.ts (H-SC-E2E-06).
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
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimiento')
router.register(r'kardex', KardexViewSet, basename='kardex')
router.register(r'alertas', AlertaStockViewSet, basename='alerta')
router.register(r'configuraciones', ConfiguracionStockViewSet, basename='configuracion')

urlpatterns = [
    path('', include(router.urls)),
    # Dashboard: action `estadisticas` como endpoint simple bajo /estadisticas/
    # (antes vivía en /dashboard-inventario/estadisticas/ — el FE lo llama en raíz).
    path(
        'estadisticas/',
        DashboardInventarioViewSet.as_view({'get': 'estadisticas'}),
        name='estadisticas',
    ),
]
