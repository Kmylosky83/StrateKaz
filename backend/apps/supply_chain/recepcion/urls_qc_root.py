"""
URLs del sistema QC configurable (H-SC-11) montadas en root del módulo SC.

El FE consume estos endpoints como:
  /api/supply-chain/parametros-calidad/
  /api/supply-chain/rangos-calidad/
  /api/supply-chain/mediciones-calidad/
  /api/supply-chain/voucher-lines/<id>/measurements/bulk/

Se separan de `urls.py` (que se monta bajo /recepcion/) porque el QC es
un sistema transversal consumido desde varios puntos del flujo y el FE lo
llama en root.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MedicionCalidadViewSet,
    ParametroCalidadViewSet,
    RangoCalidadViewSet,
    VoucherLineMeasurementsBulkView,
)

router = DefaultRouter()
router.register(
    r'parametros-calidad', ParametroCalidadViewSet,
    basename='parametro-calidad-root',
)
router.register(
    r'rangos-calidad', RangoCalidadViewSet,
    basename='rango-calidad-root',
)
router.register(
    r'mediciones-calidad', MedicionCalidadViewSet,
    basename='medicion-calidad-root',
)

urlpatterns = [
    path('', include(router.urls)),
    path(
        'voucher-lines/<int:pk>/measurements/bulk/',
        VoucherLineMeasurementsBulkView.as_view(),
        name='voucher-line-measurements-bulk-root',
    ),
]
