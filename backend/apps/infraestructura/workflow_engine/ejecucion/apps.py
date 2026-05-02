from django.apps import AppConfig


class EjecucionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.infraestructura.workflow_engine.ejecucion'
    label = 'infra_workflow_ejecucion'
    verbose_name = 'Ejecución de Flujos'

    def ready(self):
        import apps.infraestructura.workflow_engine.ejecucion.signals  # noqa: F401
