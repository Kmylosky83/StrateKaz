"""
URLs para Recepción — Supply Chain S3
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import RecepcionCalidadViewSet, VoucherRecepcionViewSet

app_name = 'sc_recepcion'

router = DefaultRouter()
router.register(r'vouchers', VoucherRecepcionViewSet, basename='voucher-recepcion')
router.register(r'calidad', RecepcionCalidadViewSet, basename='recepcion-calidad')

urlpatterns = [
    path('', include(router.urls)),
]
