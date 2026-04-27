"""
URLs para Liquidaciones — Supply Chain (H-SC-12 header+líneas)
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LiquidacionPeriodicaViewSet, LiquidacionViewSet

app_name = 'liquidaciones'

router = DefaultRouter()
# El wiring en apps/supply_chain/urls.py agrega prefijo 'liquidaciones/' al app
# → LiquidacionViewSet queda en /api/supply-chain/liquidaciones/ (router prefix vacío)
router.register(r'', LiquidacionViewSet, basename='liquidacion')

# H-SC-06: agregado periódico al lado del router de detalle. Se registra en un
# router aparte porque el principal usa prefijo vacío (r''), lo que impide
# anidar otra ruta sin conflicto.
periodicas_router = DefaultRouter()
periodicas_router.register(
    r'',
    LiquidacionPeriodicaViewSet,
    basename='liquidacion-periodica',
)

urlpatterns = [
    # /liquidaciones-periodicas/... (incluido en supply_chain/urls.py)
    path('periodicas/', include(periodicas_router.urls)),
    path('', include(router.urls)),
]
