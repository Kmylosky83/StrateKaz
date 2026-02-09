"""
URLs del Portal Empleado (ESS - Employee Self-Service).

Todos los endpoints filtran por request.user,
nunca aceptan IDs del cliente.
"""
from django.urls import path

from .employee_self_service import (
    MiPerfilView,
    MisVacacionesView,
    SolicitarPermisoView,
    MisRecibosView,
    MisCapacitacionesView,
    MiEvaluacionView,
)

app_name = 'ess'

urlpatterns = [
    path('mi-perfil/', MiPerfilView.as_view(), name='mi-perfil'),
    path('mis-vacaciones/', MisVacacionesView.as_view(), name='mis-vacaciones'),
    path('solicitar-permiso/', SolicitarPermisoView.as_view(), name='solicitar-permiso'),
    path('mis-recibos/', MisRecibosView.as_view(), name='mis-recibos'),
    path('mis-capacitaciones/', MisCapacitacionesView.as_view(), name='mis-capacitaciones'),
    path('mi-evaluacion/', MiEvaluacionView.as_view(), name='mi-evaluacion'),
]
