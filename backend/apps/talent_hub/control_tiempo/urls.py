"""
URLs de Control de Tiempo - Talent Hub
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TurnoViewSet,
    AsignacionTurnoViewSet,
    RegistroAsistenciaViewSet,
    MarcajeTiempoViewSet,
    HoraExtraViewSet,
    ConsolidadoAsistenciaViewSet,
    ConfiguracionRecargoViewSet,
)

app_name = 'control_tiempo'

router = DefaultRouter()
router.register(r'turnos', TurnoViewSet, basename='turno')
router.register(r'asignaciones', AsignacionTurnoViewSet, basename='asignacion-turno')
router.register(r'asistencias', RegistroAsistenciaViewSet, basename='registro-asistencia')
router.register(r'marcajes', MarcajeTiempoViewSet, basename='marcaje-tiempo')
router.register(r'horas-extras', HoraExtraViewSet, basename='hora-extra')
router.register(r'consolidados', ConsolidadoAsistenciaViewSet, basename='consolidado-asistencia')
router.register(r'configuracion-recargos', ConfiguracionRecargoViewSet, basename='configuracion-recargo')

urlpatterns = [
    path('', include(router.urls)),
]
