"""
URLs para IPEVR - GTC-45
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClasificacionPeligroViewSet,
    PeligroViewSet,
    MatrizIPEVRViewSet,
    ControlPropuestoViewSet
)

router = DefaultRouter()
router.register(r'clasificaciones', ClasificacionPeligroViewSet, basename='clasificacion-peligro')
router.register(r'peligros', PeligroViewSet, basename='peligro')
router.register(r'matrices', MatrizIPEVRViewSet, basename='matriz-ipevr')
router.register(r'controles', ControlPropuestoViewSet, basename='control-propuesto')

urlpatterns = [
    path('', include(router.urls)),
]
