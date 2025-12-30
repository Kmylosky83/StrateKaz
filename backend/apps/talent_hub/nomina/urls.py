"""
URLs de Nómina - Talent Hub

Configuración de rutas para la API de nómina.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ConfiguracionNominaViewSet,
    ConceptoNominaViewSet,
    PeriodoNominaViewSet,
    LiquidacionNominaViewSet,
    DetalleLiquidacionViewSet,
    PrestacionViewSet,
    PagoNominaViewSet
)

app_name = 'nomina'

router = DefaultRouter()
router.register(r'configuraciones', ConfiguracionNominaViewSet, basename='configuracion')
router.register(r'conceptos', ConceptoNominaViewSet, basename='concepto')
router.register(r'periodos', PeriodoNominaViewSet, basename='periodo')
router.register(r'liquidaciones', LiquidacionNominaViewSet, basename='liquidacion')
router.register(r'detalles', DetalleLiquidacionViewSet, basename='detalle')
router.register(r'prestaciones', PrestacionViewSet, basename='prestacion')
router.register(r'pagos', PagoNominaViewSet, basename='pago')

urlpatterns = [
    path('', include(router.urls)),
]
