from django.apps import AppConfig


class PlanificacionSistemaConfig(AppConfig):
    """
    Configuración del módulo de Planificación del Sistema.

    Migrado desde hseq_management.planificacion_sistema a gestion_estrategica
    como parte de la consolidación del Nivel 1 (Dirección Estratégica).

    Este módulo gestiona:
    - Planes de Trabajo Anual
    - Actividades del Plan
    - Objetivos del Sistema (BSC)
    - Programas de Gestión
    - Actividades de Programas
    - Seguimiento de Cronograma
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.planificacion_sistema'
    verbose_name = 'Planificación del Sistema'
    label = 'planificacion_sistema'
