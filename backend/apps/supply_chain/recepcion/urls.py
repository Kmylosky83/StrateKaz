"""
URLs para Recepción — Supply Chain S3
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MedicionCalidadViewSet,
    ParametroCalidadViewSet,
    RangoCalidadViewSet,
    RecepcionCalidadViewSet,
    VoucherLineMeasurementsBulkView,
    VoucherRecepcionViewSet,
)

app_name = 'sc_recepcion'

router = DefaultRouter()
router.register(r'vouchers', VoucherRecepcionViewSet, basename='voucher-recepcion')
router.register(r'calidad', RecepcionCalidadViewSet, basename='recepcion-calidad')

# H-SC-11 Fase 1: QC configurable por tenant
router.register(
    r'parametros-calidad', ParametroCalidadViewSet,
    basename='parametro-calidad',
)
router.register(
    r'rangos-calidad', RangoCalidadViewSet,
    basename='rango-calidad',
)
router.register(
    r'mediciones-calidad', MedicionCalidadViewSet,
    basename='medicion-calidad',
)

urlpatterns = [
    path('', include(router.urls)),
    # Bulk create de mediciones para una línea
    path(
        'voucher-lines/<int:pk>/measurements/bulk/',
        VoucherLineMeasurementsBulkView.as_view(),
        name='voucher-line-measurements-bulk',
    ),
]
