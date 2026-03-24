"""
URLs del Portal Empleado (ESS - Employee Self-Service).

Todos los endpoints filtran por request.user,
nunca aceptan IDs del cliente.

Las rutas de módulos no instalados (nómina, formación, desempeño)
se omiten silenciosamente para evitar RuntimeError.
"""
from django.apps import apps
from django.urls import path

from .employee_self_service import (
    MiPerfilView,
    MisVacacionesView,
    SolicitarPermisoView,
)

app_name = 'ess'

urlpatterns = [
    path('mi-perfil/', MiPerfilView.as_view(), name='mi-perfil'),
    path('mis-vacaciones/', MisVacacionesView.as_view(), name='mis-vacaciones'),
    path('solicitar-permiso/', SolicitarPermisoView.as_view(), name='solicitar-permiso'),
]


def _is_installed(sub_app):
    """Verifica si una sub-app de talent_hub está en INSTALLED_APPS."""
    return apps.is_installed(f'apps.talent_hub.{sub_app}')


# Endpoints que dependen de módulos aún no habilitados
if _is_installed('nomina'):
    from .employee_self_service import MisRecibosView
    urlpatterns.append(path('mis-recibos/', MisRecibosView.as_view(), name='mis-recibos'))

if _is_installed('formacion_reinduccion'):
    from .employee_self_service import MisCapacitacionesView
    urlpatterns.append(path('mis-capacitaciones/', MisCapacitacionesView.as_view(), name='mis-capacitaciones'))

if _is_installed('desempeno'):
    from .employee_self_service import MiEvaluacionView
    urlpatterns.append(path('mi-evaluacion/', MiEvaluacionView.as_view(), name='mi-evaluacion'))
