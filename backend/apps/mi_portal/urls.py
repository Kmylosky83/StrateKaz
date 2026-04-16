"""
URLs de Mi Portal — Employee Self-Service (ESS).

Todos los endpoints filtran por request.user,
nunca aceptan IDs del cliente.

Arquitectura: Mi Portal empieza con lo LIVE (mi-perfil).
Cuando se activen módulos L60+ (novedades, nómina, formación, desempeño),
sus endpoints se agregan aquí con guards is_installed().
"""
from django.urls import path

from .views import MiPerfilView

app_name = 'mi_portal'

urlpatterns = [
    path('mi-perfil/', MiPerfilView.as_view(), name='mi-perfil'),
]
