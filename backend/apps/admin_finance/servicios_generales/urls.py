"""
URLs para Servicios Generales - Admin Finance
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MantenimientoLocativoViewSet,
    ServicioPublicoViewSet,
    ContratoServicioViewSet
)

app_name = 'servicios_generales'

router = DefaultRouter()
router.register(r'mantenimientos-locativos', MantenimientoLocativoViewSet, basename='mantenimiento-locativo')
router.register(r'servicios-publicos', ServicioPublicoViewSet, basename='servicio-publico')
router.register(r'contratos', ContratoServicioViewSet, basename='contrato-servicio')

urlpatterns = [
    path('', include(router.urls)),
]
