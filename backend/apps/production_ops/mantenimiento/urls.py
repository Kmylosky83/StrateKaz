"""
URLs para Mantenimiento de Equipos - Production Ops
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # Catálogos dinámicos
    TipoActivoViewSet,
    TipoMantenimientoViewSet,
    # Activos
    ActivoProduccionViewSet,
    EquipoMedicionViewSet,
    # Planificación
    PlanMantenimientoViewSet,
    # Ejecución
    OrdenTrabajoViewSet,
    CalibracionViewSet,
    ParadaViewSet,
)

app_name = 'mantenimiento'

router = DefaultRouter()

# ==============================================================================
# RUTAS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

# Tipos de Activo
router.register(
    r'tipos-activo',
    TipoActivoViewSet,
    basename='tipo-activo'
)

# Tipos de Mantenimiento
router.register(
    r'tipos-mantenimiento',
    TipoMantenimientoViewSet,
    basename='tipo-mantenimiento'
)

# ==============================================================================
# RUTAS DE ACTIVOS
# ==============================================================================

# Activos de Producción
router.register(
    r'activos',
    ActivoProduccionViewSet,
    basename='activo'
)

# Equipos de Medición
router.register(
    r'equipos-medicion',
    EquipoMedicionViewSet,
    basename='equipo-medicion'
)

# ==============================================================================
# RUTAS DE PLANIFICACIÓN
# ==============================================================================

# Planes de Mantenimiento
router.register(
    r'planes-mantenimiento',
    PlanMantenimientoViewSet,
    basename='plan-mantenimiento'
)

# ==============================================================================
# RUTAS DE EJECUCIÓN
# ==============================================================================

# Órdenes de Trabajo
router.register(
    r'ordenes-trabajo',
    OrdenTrabajoViewSet,
    basename='orden-trabajo'
)

# Calibraciones
router.register(
    r'calibraciones',
    CalibracionViewSet,
    basename='calibracion'
)

# Paradas No Programadas
router.register(
    r'paradas',
    ParadaViewSet,
    basename='parada'
)

urlpatterns = [
    path('', include(router.urls)),
]
