"""
URLs para el módulo de Organización
Sistema de Gestión StrateKaz

Incluye:
- Áreas y Organigrama
- Consecutivos (MC-002)
- Unidades de Medida (MC-001)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AreaViewSet,
    CaracterizacionProcesoViewSet,
    OrganigramaView,
    OrganigramaNodePositionView,
)
from .viewsets_consecutivos import ConsecutivoConfigViewSet
from .viewsets_unidades import UnidadMedidaViewSet

router = DefaultRouter()
router.register(r'areas', AreaViewSet, basename='area')
router.register(r'caracterizaciones', CaracterizacionProcesoViewSet, basename='caracterizacion')
router.register(r'consecutivos', ConsecutivoConfigViewSet, basename='consecutivo')
router.register(r'unidades-medida', UnidadMedidaViewSet, basename='unidad-medida')

urlpatterns = [
    path('', include(router.urls)),
    # Endpoint especial para el organigrama visual
    path('organigrama/', OrganigramaView.as_view(), name='organigrama'),
    path('organigrama/positions/', OrganigramaNodePositionView.as_view(), name='organigrama-positions'),
]
