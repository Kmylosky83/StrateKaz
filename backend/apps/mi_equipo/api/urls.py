"""
URLs Mi Equipo (L20) — Portal Jefe (MSS).

Todos los endpoints filtran por el equipo del jefe autenticado.
Montado en: /api/mi-equipo/
"""
from django.urls import path

from .views import (
    MiEquipoView,
    AprobacionesPendientesView,
    AprobarSolicitudView,
    AsistenciaEquipoView,
    EvaluacionesEquipoView,
)

app_name = 'mi_equipo'

urlpatterns = [
    path('', MiEquipoView.as_view(), name='mi-equipo'),
    path('aprobaciones/', AprobacionesPendientesView.as_view(), name='aprobaciones'),
    path('aprobar/<str:tipo>/<int:solicitud_id>/', AprobarSolicitudView.as_view(), name='aprobar'),
    path('asistencia/', AsistenciaEquipoView.as_view(), name='asistencia'),
    path('evaluaciones/', EvaluacionesEquipoView.as_view(), name='evaluaciones'),
]
