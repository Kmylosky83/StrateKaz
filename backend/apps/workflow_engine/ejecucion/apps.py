from django.apps import AppConfig


class EjecucionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.workflow_engine.ejecucion'
    verbose_name = 'Ejecución de Flujos'

    def ready(self):
        import apps.workflow_engine.ejecucion.signals  # noqa: F401
