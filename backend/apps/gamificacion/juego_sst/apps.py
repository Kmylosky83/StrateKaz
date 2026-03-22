"""
App Config: Juego SST — Los Héroes de la Seguridad
Módulo independiente de gamificación SST.
"""
from django.apps import AppConfig


class JuegoSstConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gamificacion.juego_sst'
    verbose_name = 'Juego SST: Los Héroes de la Seguridad'
    label = 'juego_sst'
