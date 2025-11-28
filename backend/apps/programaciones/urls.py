"""
URLs del módulo Programaciones - API REST
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import ProgramacionViewSet

app_name = 'programaciones'

# Router para ViewSets
router = DefaultRouter()
router.register(r'programaciones', ProgramacionViewSet, basename='programacion')

urlpatterns = [
    path('', include(router.urls)),
]
