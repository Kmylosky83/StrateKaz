"""
URLs para Tesorería - Admin Finance
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BancoViewSet,
    CuentaPorPagarViewSet,
    CuentaPorCobrarViewSet,
    FlujoCajaViewSet,
    PagoViewSet,
    RecaudoViewSet
)

app_name = 'tesoreria'

router = DefaultRouter()
router.register(r'bancos', BancoViewSet, basename='banco')
router.register(r'cuentas-por-pagar', CuentaPorPagarViewSet, basename='cuenta-por-pagar')
router.register(r'cuentas-por-cobrar', CuentaPorCobrarViewSet, basename='cuenta-por-cobrar')
router.register(r'flujo-caja', FlujoCajaViewSet, basename='flujo-caja')
router.register(r'pagos', PagoViewSet, basename='pago')
router.register(r'recaudos', RecaudoViewSet, basename='recaudo')

urlpatterns = [
    path('', include(router.urls)),
]
