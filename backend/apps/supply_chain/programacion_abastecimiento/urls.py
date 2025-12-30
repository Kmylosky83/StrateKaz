"""
URLs para Programación de Abastecimiento - Supply Chain
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # Catálogos dinámicos
    TipoOperacionViewSet,
    EstadoProgramacionViewSet,
    UnidadMedidaViewSet,
    EstadoEjecucionViewSet,
    EstadoLiquidacionViewSet,
    # Modelos principales
    ProgramacionViewSet,
    AsignacionRecursoViewSet,
    EjecucionViewSet,
    LiquidacionViewSet,
)

app_name = 'programacion_abastecimiento'

router = DefaultRouter()

# Registrar catálogos dinámicos
router.register(r'tipos-operacion', TipoOperacionViewSet, basename='tipo-operacion')
router.register(r'estados-programacion', EstadoProgramacionViewSet, basename='estado-programacion')
router.register(r'unidades-medida', UnidadMedidaViewSet, basename='unidad-medida')
router.register(r'estados-ejecucion', EstadoEjecucionViewSet, basename='estado-ejecucion')
router.register(r'estados-liquidacion', EstadoLiquidacionViewSet, basename='estado-liquidacion')

# Registrar modelos principales
router.register(r'programaciones', ProgramacionViewSet, basename='programacion')
router.register(r'asignaciones-recurso', AsignacionRecursoViewSet, basename='asignacion-recurso')
router.register(r'ejecuciones', EjecucionViewSet, basename='ejecucion')
router.register(r'liquidaciones', LiquidacionViewSet, basename='liquidacion')

urlpatterns = [
    path('', include(router.urls)),
]
