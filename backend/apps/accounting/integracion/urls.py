"""
URLs para integracion - accounting
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParametrosIntegracionViewSet, LogIntegracionViewSet, ColaContabilizacionViewSet

app_name = 'integracion'

router = DefaultRouter()
router.register(r'parametros', ParametrosIntegracionViewSet, basename='parametros-integracion')
router.register(r'logs', LogIntegracionViewSet, basename='log-integracion')
router.register(r'cola', ColaContabilizacionViewSet, basename='cola-contabilizacion')

urlpatterns = [
    path('', include(router.urls)),
]
