from django.apps import AppConfig


class ConfiguracionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.configuracion'
    label = 'configuracion'
    verbose_name = 'Configuración del Sistema'

    def ready(self):
        import apps.gestion_estrategica.configuracion.signals  # noqa: F401
