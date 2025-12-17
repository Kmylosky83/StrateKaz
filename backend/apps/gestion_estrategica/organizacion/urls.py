"""
URLs para el módulo de Organización
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AreaViewSet,
    CategoriaDocumentoViewSet,
    TipoDocumentoViewSet,
    ConsecutivoConfigViewSet,
    OrganigramaView,
)

router = DefaultRouter()
router.register(r'areas', AreaViewSet, basename='area')
router.register(r'categorias-documento', CategoriaDocumentoViewSet, basename='categoria-documento')
router.register(r'tipos-documento', TipoDocumentoViewSet, basename='tipo-documento')
router.register(r'consecutivos', ConsecutivoConfigViewSet, basename='consecutivo')

urlpatterns = [
    path('', include(router.urls)),
    # Endpoint especial para el organigrama visual
    path('organigrama/', OrganigramaView.as_view(), name='organigrama'),
]
