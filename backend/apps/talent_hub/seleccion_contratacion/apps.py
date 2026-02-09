from django.apps import AppConfig


class SeleccionContratacionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.talent_hub.seleccion_contratacion'
    verbose_name = 'SeleccionContratacion'

    def ready(self):
        try:
            import apps.talent_hub.seleccion_contratacion.signals  # noqa
        except ImportError:
            pass
