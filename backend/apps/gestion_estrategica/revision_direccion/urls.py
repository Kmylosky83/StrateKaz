"""
URLs para Revisión por la Dirección
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProgramaRevisionViewSet, ParticipanteRevisionViewSet,
    TemaRevisionViewSet, ActaRevisionViewSet,
    AnalisisTemaActaViewSet, CompromisoRevisionViewSet,
    SeguimientoCompromisoViewSet
)

router = DefaultRouter()

# Programación
router.register(r'programas', ProgramaRevisionViewSet)
router.register(r'participantes', ParticipanteRevisionViewSet)
router.register(r'temas', TemaRevisionViewSet)

# Actas de Revisión
router.register(r'actas', ActaRevisionViewSet)
router.register(r'analisis-temas', AnalisisTemaActaViewSet)

# Seguimiento Compromisos
router.register(r'compromisos', CompromisoRevisionViewSet)
router.register(r'seguimientos', SeguimientoCompromisoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
