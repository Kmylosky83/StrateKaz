"""
URLs para Juego SST: Los Héroes de la Seguridad
Módulo independiente — apps.gamificacion.juego_sst
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import GameViewSet

app_name = 'juego_sst'

router = DefaultRouter()
router.register(r'', GameViewSet, basename='juego-sst')

urlpatterns = [
    path('', include(router.urls)),
]
