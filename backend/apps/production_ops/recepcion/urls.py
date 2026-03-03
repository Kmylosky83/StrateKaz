"""
URLs para Recepción de Materia Prima - Production Ops
Sistema de Gestión StrateKaz

100% DINÁMICO: Rutas DRF con router para todos los ViewSets.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # Catálogos
    TipoRecepcionViewSet,
    EstadoRecepcionViewSet,
    PuntoRecepcionViewSet,
    # Recepción
    RecepcionViewSet,
    DetalleRecepcionViewSet,
    ControlCalidadRecepcionViewSet,
    # Pruebas de Acidez (migrado desde Supply Chain)
    PruebaAcidezViewSet,
)

app_name = 'recepcion'

router = DefaultRouter()

# Registrar ViewSets de catálogos
router.register(
    r'tipos-recepcion',
    TipoRecepcionViewSet,
    basename='tipo-recepcion'
)
router.register(
    r'estados-recepcion',
    EstadoRecepcionViewSet,
    basename='estado-recepcion'
)
router.register(
    r'puntos-recepcion',
    PuntoRecepcionViewSet,
    basename='punto-recepcion'
)

# Registrar ViewSets principales
router.register(
    r'recepciones',
    RecepcionViewSet,
    basename='recepcion'
)
router.register(
    r'detalles-recepcion',
    DetalleRecepcionViewSet,
    basename='detalle-recepcion'
)
router.register(
    r'controles-calidad',
    ControlCalidadRecepcionViewSet,
    basename='control-calidad'
)

# Pruebas de Acidez (migrado desde Supply Chain)
router.register(
    r'pruebas-acidez',
    PruebaAcidezViewSet,
    basename='prueba-acidez'
)

urlpatterns = [
    path('', include(router.urls)),
]
