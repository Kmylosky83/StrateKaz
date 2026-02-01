"""
URLs para Presupuesto - Admin Finance
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CentroCostoViewSet, RubroViewSet, PresupuestoPorAreaViewSet,
    AprobacionViewSet, EjecucionViewSet
)

app_name = 'presupuesto'

router = DefaultRouter()
router.register('centros-costo', CentroCostoViewSet, basename='centro-costo')
router.register('rubros', RubroViewSet, basename='rubro')
router.register('presupuestos', PresupuestoPorAreaViewSet, basename='presupuesto')
router.register('aprobaciones', AprobacionViewSet, basename='aprobacion')
router.register('ejecuciones', EjecucionViewSet, basename='ejecucion')

urlpatterns = [
    path('', include(router.urls)),
]
