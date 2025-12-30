"""
URLs para Activos Fijos - Admin Finance
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaActivoViewSet,
    ActivoFijoViewSet,
    HojaVidaActivoViewSet,
    ProgramaMantenimientoViewSet,
    DepreciacionViewSet,
    BajaViewSet
)

app_name = 'activos_fijos'

router = DefaultRouter()
router.register(r'categorias', CategoriaActivoViewSet, basename='categoria-activo')
router.register(r'activos', ActivoFijoViewSet, basename='activo-fijo')
router.register(r'hojas-vida', HojaVidaActivoViewSet, basename='hoja-vida')
router.register(r'programas-mantenimiento', ProgramaMantenimientoViewSet, basename='programa-mantenimiento')
router.register(r'depreciaciones', DepreciacionViewSet, basename='depreciacion')
router.register(r'bajas', BajaViewSet, basename='baja')

urlpatterns = [
    path('', include(router.urls)),
]
