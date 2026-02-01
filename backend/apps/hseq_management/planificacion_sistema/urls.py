# -*- coding: utf-8 -*-
"""
URLs para Planificacion del Sistema - HSEQ Management
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PlanTrabajoAnualViewSet,
    ActividadPlanViewSet,
    ObjetivoSistemaViewSet,
    ProgramaGestionViewSet,
    ActividadProgramaViewSet,
    SeguimientoCronogramaViewSet,
)

app_name = 'planificacion_sistema'

router = DefaultRouter()

# Registrar ViewSets
router.register(r'planes-trabajo', PlanTrabajoAnualViewSet, basename='plan-trabajo')
router.register(r'actividades-plan', ActividadPlanViewSet, basename='actividad-plan')
router.register(r'objetivos', ObjetivoSistemaViewSet, basename='objetivo')
router.register(r'programas', ProgramaGestionViewSet, basename='programa')
router.register(r'actividades-programa', ActividadProgramaViewSet, basename='actividad-programa')
router.register(r'seguimientos', SeguimientoCronogramaViewSet, basename='seguimiento')

urlpatterns = [
    path('', include(router.urls)),
]
