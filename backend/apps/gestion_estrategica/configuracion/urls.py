"""
URLs del módulo Configuración - Dirección Estratégica
Sistema de Gestión StrateKaz

Define rutas para:
- EmpresaConfig: /empresa-config/
- SedeEmpresa: /sedes/
- IntegracionExterna: /integraciones-externas/

NOTA: ConsecutivoConfig y UnidadMedida fueron migrados a organizacion.
Ver: apps.gestion_estrategica.organizacion.urls
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmpresaConfigViewSet,
    SedeEmpresaViewSet,
    IntegracionExternaViewSet,
    IconRegistryViewSet,
    NormaISOViewSet,
)
from .stats_views import config_stats_view

router = DefaultRouter()
router.register(r'empresa-config', EmpresaConfigViewSet, basename='empresa-config')
router.register(r'sedes', SedeEmpresaViewSet, basename='sede')
router.register(r'integraciones-externas', IntegracionExternaViewSet, basename='integracion-externa')
router.register(r'icons', IconRegistryViewSet, basename='icon')
router.register(r'normas-iso', NormaISOViewSet, basename='norma-iso')

urlpatterns = [
    path('', include(router.urls)),
    path('config-stats/', config_stats_view, name='config-stats'),
]
