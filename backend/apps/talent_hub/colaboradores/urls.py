"""
URLs para Colaboradores - Talent Hub
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ColaboradorViewSet,
    HojaVidaViewSet,
    InfoPersonalViewSet,
    HistorialLaboralViewSet,
)

app_name = 'colaboradores'

router = DefaultRouter()
router.register(r'colaboradores', ColaboradorViewSet, basename='colaborador')
router.register(r'hojas-vida', HojaVidaViewSet, basename='hoja-vida')
router.register(r'info-personal', InfoPersonalViewSet, basename='info-personal')
router.register(r'historial-laboral', HistorialLaboralViewSet, basename='historial-laboral')

urlpatterns = [
    path('', include(router.urls)),
]
