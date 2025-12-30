"""
URLs para pipeline_ventas - sales_crm
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EtapaVentaViewSet,
    MotivoPerdidaViewSet,
    FuenteOportunidadViewSet,
    OportunidadViewSet,
    SeguimientoOportunidadViewSet,
    CotizacionViewSet,
    HistorialEtapaViewSet,
)

app_name = 'pipeline_ventas'

router = DefaultRouter()

# Catálogos
router.register(r'etapas', EtapaVentaViewSet, basename='etapas')
router.register(r'motivos-perdida', MotivoPerdidaViewSet, basename='motivos-perdida')
router.register(r'fuentes', FuenteOportunidadViewSet, basename='fuentes')

# Entidades principales
router.register(r'oportunidades', OportunidadViewSet, basename='oportunidades')
router.register(r'seguimientos', SeguimientoOportunidadViewSet, basename='seguimientos')
router.register(r'cotizaciones', CotizacionViewSet, basename='cotizaciones')

# Historial
router.register(r'historial-etapas', HistorialEtapaViewSet, basename='historial-etapas')

urlpatterns = [
    path('', include(router.urls)),
]
