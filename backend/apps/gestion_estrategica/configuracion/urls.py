"""
URLs del módulo Configuración - Dirección Estratégica
Sistema de Gestión StrateKaz

Define rutas para:
- EmpresaConfig: /empresa-config/
- SedeEmpresa: /sedes/
- IntegracionExterna: /integraciones-externas/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmpresaConfigViewSet,
    SedeEmpresaViewSet,
    IntegracionExternaViewSet,
)
from .stats_views import config_stats_view

router = DefaultRouter()
router.register(r'empresa-config', EmpresaConfigViewSet, basename='empresa-config')
router.register(r'sedes', SedeEmpresaViewSet, basename='sede')
router.register(r'integraciones-externas', IntegracionExternaViewSet, basename='integracion-externa')

urlpatterns = [
    path('', include(router.urls)),
    path('config-stats/', config_stats_view, name='config-stats'),
]
