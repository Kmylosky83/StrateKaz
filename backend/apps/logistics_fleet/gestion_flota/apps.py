"""
Configuración de la app Gestión de Flota - Logistics Fleet Management
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.apps import AppConfig


class GestionFlotaConfig(AppConfig):
    """
    Configuración de la aplicación Gestión de Flota.

    Módulo para gestión integral de flota vehicular con cumplimiento
    PESV (Resolución 40595/2022) para operaciones de recolección y distribución.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.logistics_fleet.gestion_flota'
    verbose_name = 'Gestión de Flota'
    verbose_name_plural = 'Gestión de Flota'

    def ready(self):
        """
        Importa signals cuando la app está lista.
        """
        # Importar signals si se crean en el futuro
        # import apps.logistics_fleet.gestion_flota.signals
        pass
