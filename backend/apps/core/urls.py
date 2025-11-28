"""
URLs para el módulo Core - API REST
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import health_check, current_user
from .viewsets import CargoViewSet, UserViewSet, PermisoViewSet

app_name = 'core'

# Configurar router para ViewSets
router = DefaultRouter()
router.register(r'cargos', CargoViewSet, basename='cargo')
router.register(r'users', UserViewSet, basename='user')
router.register(r'permisos', PermisoViewSet, basename='permiso')

urlpatterns = [
    # Endpoints funcionales
    path('health/', health_check, name='health_check'),
    path('users/me/', current_user, name='current_user'),

    # Incluir rutas del router
    path('', include(router.urls)),
]
