"""
URLs para Selección y Contratación - Talent Hub
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # Catálogos
    TipoContratoViewSet,
    TipoEntidadViewSet,
    EntidadSeguridadSocialViewSet,
    TipoPruebaViewSet,
    # Principales
    VacanteActivaViewSet,
    CandidatoViewSet,
    EntrevistaViewSet,
    PruebaViewSet,
    AfiliacionSSViewSet,
    # Estadísticas
    ProcesoSeleccionEstadisticasViewSet,
)

app_name = 'seleccion_contratacion'

router = DefaultRouter()

# Catálogos
router.register(r'tipos-contrato', TipoContratoViewSet, basename='tipo-contrato')
router.register(r'tipos-entidad', TipoEntidadViewSet, basename='tipo-entidad')
router.register(r'entidades-ss', EntidadSeguridadSocialViewSet, basename='entidad-ss')
router.register(r'tipos-prueba', TipoPruebaViewSet, basename='tipo-prueba')

# Principales
router.register(r'vacantes-activas', VacanteActivaViewSet, basename='vacante-activa')
router.register(r'candidatos', CandidatoViewSet, basename='candidato')
router.register(r'entrevistas', EntrevistaViewSet, basename='entrevista')
router.register(r'pruebas', PruebaViewSet, basename='prueba')
router.register(r'afiliaciones', AfiliacionSSViewSet, basename='afiliacion')

# Estadísticas
router.register(r'estadisticas', ProcesoSeleccionEstadisticasViewSet, basename='estadisticas')

urlpatterns = [
    path('', include(router.urls)),
]
