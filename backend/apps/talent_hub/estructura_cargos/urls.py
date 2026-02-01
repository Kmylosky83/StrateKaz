"""
URLs para Estructura de Cargos - Talent Hub
Sistema de Gestión StrateKaz
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ProfesiogramaViewSet,
    MatrizCompetenciaViewSet,
    RequisitoEspecialViewSet,
    VacanteViewSet,
)

app_name = 'estructura_cargos'

router = DefaultRouter()
router.register(r'profesiogramas', ProfesiogramaViewSet, basename='profesiograma')
router.register(r'competencias', MatrizCompetenciaViewSet, basename='competencia')
router.register(r'requisitos-especiales', RequisitoEspecialViewSet, basename='requisito-especial')
router.register(r'vacantes', VacanteViewSet, basename='vacante')

urlpatterns = [
    path('', include(router.urls)),
]
