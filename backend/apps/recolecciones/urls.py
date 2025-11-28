"""
URLs del módulo Recolecciones - Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecoleccionViewSet, ProgramacionesEnRutaViewSet

router = DefaultRouter()
router.register(r'', RecoleccionViewSet, basename='recoleccion')

urlpatterns = [
    # Endpoint especial para programaciones EN_RUTA (para el recolector)
    path('programaciones-en-ruta/', ProgramacionesEnRutaViewSet.as_view({'get': 'list'}), name='programaciones-en-ruta'),
    # Router principal
    path('', include(router.urls)),
]
