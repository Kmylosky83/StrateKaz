"""
URLs para Pedidos y Facturación - Sales CRM
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    EstadoPedidoViewSet,
    MetodoPagoViewSet,
    CondicionPagoViewSet,
    PedidoViewSet,
    DetallePedidoViewSet,
    FacturaViewSet,
    PagoFacturaViewSet
)

app_name = 'pedidos_facturacion'

router = DefaultRouter()

# Catálogos
router.register(r'estados-pedido', EstadoPedidoViewSet, basename='estado-pedido')
router.register(r'metodos-pago', MetodoPagoViewSet, basename='metodo-pago')
router.register(r'condiciones-pago', CondicionPagoViewSet, basename='condicion-pago')

# Modelos principales
router.register(r'pedidos', PedidoViewSet, basename='pedido')
router.register(r'detalles-pedido', DetallePedidoViewSet, basename='detalle-pedido')
router.register(r'facturas', FacturaViewSet, basename='factura')
router.register(r'pagos', PagoFacturaViewSet, basename='pago')

urlpatterns = [
    path('', include(router.urls)),
]
