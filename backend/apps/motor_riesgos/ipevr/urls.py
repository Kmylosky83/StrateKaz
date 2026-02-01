"""
URLs para IPEVR - GTC-45
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClasificacionPeligroViewSet,
    PeligroGTC45ViewSet,
    MatrizIPEVRViewSet,
    ControlSSTViewSet
)

router = DefaultRouter()
router.register(r'clasificaciones', ClasificacionPeligroViewSet, basename='clasificacion-peligro')
router.register(r'peligros', PeligroGTC45ViewSet, basename='peligro-gtc45')
router.register(r'matrices', MatrizIPEVRViewSet, basename='matriz-ipevr')
router.register(r'controles', ControlSSTViewSet, basename='control-sst')

urlpatterns = [
    path('', include(router.urls)),
]
