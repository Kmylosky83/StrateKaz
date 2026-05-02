from django.apps import AppConfig


class DisenadorFlujosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.infraestructura.workflow_engine.disenador_flujos'
    label = 'infra_disenador_flujos'
    verbose_name = 'Diseñador de Flujos de Trabajo'
