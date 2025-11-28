"""
URLs del módulo Ecoaliados - API REST
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import EcoaliadoViewSet, HistorialPrecioEcoaliadoViewSet

app_name = 'ecoaliados'

# Router para ViewSets
router = DefaultRouter()
router.register(r'ecoaliados', EcoaliadoViewSet, basename='ecoaliado')
router.register(r'historial-precios', HistorialPrecioEcoaliadoViewSet, basename='historial-precio')

urlpatterns = [
    path('', include(router.urls)),
]
