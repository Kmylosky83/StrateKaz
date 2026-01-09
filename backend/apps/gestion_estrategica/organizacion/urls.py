"""
URLs para el módulo de Organización
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AreaViewSet,
    OrganigramaView,
)

router = DefaultRouter()
router.register(r'areas', AreaViewSet, basename='area')

urlpatterns = [
    path('', include(router.urls)),
    # Endpoint especial para el organigrama visual
    path('organigrama/', OrganigramaView.as_view(), name='organigrama'),
]
