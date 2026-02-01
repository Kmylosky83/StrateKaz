"""
URLs para Accidentalidad (ATEL) - HSEQ Management
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccidenteTrabajoViewSet,
    EnfermedadLaboralViewSet,
    IncidenteTrabajoViewSet,
    InvestigacionATELViewSet,
    CausaRaizViewSet,
    LeccionAprendidaViewSet,
    PlanAccionATELViewSet,
    AccionPlanViewSet
)

app_name = 'accidentalidad'

router = DefaultRouter()
router.register(r'accidentes-trabajo', AccidenteTrabajoViewSet, basename='accidente-trabajo')
router.register(r'enfermedades-laborales', EnfermedadLaboralViewSet, basename='enfermedad-laboral')
router.register(r'incidentes-trabajo', IncidenteTrabajoViewSet, basename='incidente-trabajo')
router.register(r'investigaciones', InvestigacionATELViewSet, basename='investigacion')
router.register(r'causas-raiz', CausaRaizViewSet, basename='causa-raiz')
router.register(r'lecciones-aprendidas', LeccionAprendidaViewSet, basename='leccion-aprendida')
router.register(r'planes-accion', PlanAccionATELViewSet, basename='plan-accion')
router.register(r'acciones-plan', AccionPlanViewSet, basename='accion-plan')

urlpatterns = [
    path('', include(router.urls)),
]
