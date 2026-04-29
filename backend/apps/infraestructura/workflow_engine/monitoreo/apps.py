from django.apps import AppConfig


class MonitoreoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.infraestructura.workflow_engine.monitoreo'
    label = 'infra_workflow_monitoreo'
    verbose_name = 'Monitoreo de Flujos'
