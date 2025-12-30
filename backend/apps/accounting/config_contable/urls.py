"""
URLs para config_contable - accounting
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlanCuentasViewSet, CuentaContableViewSet, TipoDocumentoContableViewSet,
    TerceroViewSet, CentroCostoContableViewSet, ConfiguracionModuloViewSet
)

app_name = 'config_contable'

router = DefaultRouter()
router.register(r'planes', PlanCuentasViewSet, basename='plan-cuentas')
router.register(r'cuentas', CuentaContableViewSet, basename='cuenta-contable')
router.register(r'tipos-documento', TipoDocumentoContableViewSet, basename='tipo-documento')
router.register(r'terceros', TerceroViewSet, basename='tercero')
router.register(r'centros-costo', CentroCostoContableViewSet, basename='centro-costo')
router.register(r'configuracion', ConfiguracionModuloViewSet, basename='configuracion-modulo')

urlpatterns = [
    path('', include(router.urls)),
]
