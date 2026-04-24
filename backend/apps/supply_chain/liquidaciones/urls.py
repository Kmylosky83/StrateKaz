"""
URLs para Liquidaciones — Supply Chain (H-SC-12 header+líneas)
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LiquidacionViewSet, PagoLiquidacionViewSet

app_name = 'liquidaciones'

router = DefaultRouter()
router.register(r'liquidaciones', LiquidacionViewSet, basename='liquidacion')
router.register(
    r'pagos-liquidacion', PagoLiquidacionViewSet, basename='pago-liquidacion'
)

urlpatterns = [
    path('', include(router.urls)),
]
