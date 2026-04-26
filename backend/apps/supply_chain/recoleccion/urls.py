"""URLs para Recolección en Ruta — H-SC-RUTA-02."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import VoucherRecoleccionViewSet, LineaVoucherRecoleccionViewSet

app_name = 'sc_recoleccion'

router = DefaultRouter()
router.register(
    r'vouchers', VoucherRecoleccionViewSet, basename='voucher-recoleccion'
)
router.register(
    r'lineas', LineaVoucherRecoleccionViewSet, basename='linea-voucher-recoleccion'
)

urlpatterns = [
    path('', include(router.urls)),
]
