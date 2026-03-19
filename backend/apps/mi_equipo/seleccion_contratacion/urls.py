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
    # Contratos (Ley 2466/2025)
    HistorialContratoViewSet,
    FirmarContratoPublicView,
    # Estadísticas
    ProcesoSeleccionEstadisticasViewSet,
    # Pruebas Dinámicas (Form Builder)
    PlantillaPruebaDinamicaViewSet,
    AsignacionPruebaDinamicaViewSet,
    ResponderPruebaDinamicaViewSet,
    # Entrevistas Asincrónicas
    EntrevistaAsincronicaViewSet,
    ResponderEntrevistaAsincronicaViewSet,
    # Portal Público de Vacantes
    VacantePublicaViewSet,
    PostulacionPublicaView,
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

# Contratos (Ley 2466/2025)
router.register(r'historial-contratos', HistorialContratoViewSet, basename='historial-contrato')

# Pruebas Dinámicas (Form Builder)
router.register(r'plantillas-prueba', PlantillaPruebaDinamicaViewSet, basename='plantilla-prueba')
router.register(r'asignaciones-prueba', AsignacionPruebaDinamicaViewSet, basename='asignacion-prueba')
router.register(r'responder-prueba', ResponderPruebaDinamicaViewSet, basename='responder-prueba')

# Entrevistas Asincrónicas (por Email)
router.register(r'entrevistas-async', EntrevistaAsincronicaViewSet, basename='entrevista-async')
router.register(r'responder-entrevista', ResponderEntrevistaAsincronicaViewSet, basename='responder-entrevista')

# Firma Digital de Contratos (AllowAny)
router.register(r'firmar-contrato', FirmarContratoPublicView, basename='firmar-contrato')

# Estadísticas
router.register(r'estadisticas', ProcesoSeleccionEstadisticasViewSet, basename='estadisticas')

# Portal Público de Vacantes (AllowAny)
router.register(r'vacantes-publicas', VacantePublicaViewSet, basename='vacante-publica')

urlpatterns = [
    # Postulación pública (fuera del router por URL custom)
    path(
        'vacantes-publicas/<int:vacante_id>/postular/',
        PostulacionPublicaView.as_view({'post': 'create'}),
        name='postulacion-publica',
    ),
    path('', include(router.urls)),
]
