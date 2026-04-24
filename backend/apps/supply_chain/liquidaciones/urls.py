"""
URLs para Liquidaciones — Supply Chain (H-SC-12 header+líneas)
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LiquidacionViewSet

app_name = 'liquidaciones'

router = DefaultRouter()
# El wiring en apps/supply_chain/urls.py agrega prefijo 'liquidaciones/' al app
# → LiquidacionViewSet queda en /api/supply-chain/liquidaciones/ (router prefix vacío)
router.register(r'', LiquidacionViewSet, basename='liquidacion')

urlpatterns = [
    path('', include(router.urls)),
]
