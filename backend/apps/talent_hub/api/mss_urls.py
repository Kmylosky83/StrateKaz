"""
URLs del Portal Jefe (MSS - Manager Self-Service).

Todos los endpoints filtran por el equipo del jefe autenticado.
"""
from django.urls import path

from .manager_self_service import (
    MiEquipoView,
    AprobacionesPendientesView,
    AprobarSolicitudView,
    AsistenciaEquipoView,
    EvaluacionesEquipoView,
)

app_name = 'mss'

urlpatterns = [
    path('', MiEquipoView.as_view(), name='mi-equipo'),
    path('aprobaciones/', AprobacionesPendientesView.as_view(), name='aprobaciones'),
    path('aprobar/<str:tipo>/<int:solicitud_id>/', AprobarSolicitudView.as_view(), name='aprobar'),
    path('asistencia/', AsistenciaEquipoView.as_view(), name='asistencia'),
    path('evaluaciones/', EvaluacionesEquipoView.as_view(), name='evaluaciones'),
]
