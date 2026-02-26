"""
Apps de Nómina - Talent Hub

Configuración de la aplicación de nómina.
"""
from django.apps import AppConfig


class NominaConfig(AppConfig):
    """Configuración de la app de nómina."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.talent_hub.nomina'
    verbose_name = 'Gestión de Nómina'
