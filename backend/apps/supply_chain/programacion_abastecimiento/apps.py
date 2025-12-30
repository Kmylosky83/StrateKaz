"""
App Config para Programación de Abastecimiento - Supply Chain
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.apps import AppConfig


class ProgramacionAbastecimientoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.supply_chain.programacion_abastecimiento'
    verbose_name = 'Programación de Abastecimiento'
    label = 'programacion_abastecimiento'
