"""
URLs para Gestión de Comités HSEQ
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TipoComiteViewSet,
    ComiteViewSet,
    MiembroComiteViewSet,
    ReunionViewSet,
    ActaReunionViewSet,
    CompromisoViewSet,
    SeguimientoCompromisoViewSet,
    VotacionViewSet,
    VotoMiembroViewSet,
)

app_name = 'gestion_comites'

router = DefaultRouter()

# Configuración de comités
router.register(r'tipos-comite', TipoComiteViewSet, basename='tipo-comite')

# Comités activos
router.register(r'comites', ComiteViewSet, basename='comite')
router.register(r'miembros', MiembroComiteViewSet, basename='miembro-comite')

# Reuniones y actas
router.register(r'reuniones', ReunionViewSet, basename='reunion')
router.register(r'actas', ActaReunionViewSet, basename='acta')

# Compromisos y seguimiento
router.register(r'compromisos', CompromisoViewSet, basename='compromiso')
router.register(r'seguimientos', SeguimientoCompromisoViewSet, basename='seguimiento')

# Votaciones
router.register(r'votaciones', VotacionViewSet, basename='votacion')
router.register(r'votos', VotoMiembroViewSet, basename='voto')

urlpatterns = [
    path('', include(router.urls)),
]
