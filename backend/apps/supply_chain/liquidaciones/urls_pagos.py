"""
URLs para Pagos de Liquidación (H-SC-12) — montadas en root del módulo SC.

Se separa de `urls.py` porque el FE consume `/api/supply-chain/pagos-liquidacion/`
directamente en root, no bajo el prefijo `/liquidaciones/`.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PagoLiquidacionViewSet

router = DefaultRouter()
router.register(
    r'pagos-liquidacion', PagoLiquidacionViewSet, basename='pago-liquidacion'
)

urlpatterns = [
    path('', include(router.urls)),
]
