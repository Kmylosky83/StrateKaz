"""
URLs del módulo Configuración - Dirección Estratégica
Sistema de Gestión StrateKaz

Define rutas para:
- SedeEmpresa: /sedes/
- IntegracionExterna: /integraciones-externas/
- NormaISO: /normas-iso/
- IconRegistry: /icons/

NOTA: Datos de empresa se gestionan via /api/tenant/tenants/me/
NOTA: ConsecutivoConfig y UnidadMedida fueron migrados a organizacion.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SedeEmpresaViewSet,
    IntegracionExternaViewSet,
    IconRegistryViewSet,
    NormaISOViewSet,
)
from .stats_views import config_stats_view

router = DefaultRouter()
router.register(r'sedes', SedeEmpresaViewSet, basename='sede')
router.register(r'integraciones-externas', IntegracionExternaViewSet, basename='integracion-externa')
router.register(r'icons', IconRegistryViewSet, basename='icon')
router.register(r'normas-iso', NormaISOViewSet, basename='norma-iso')

urlpatterns = [
    path('', include(router.urls)),
    path('config-stats/', config_stats_view, name='config-stats'),
]
