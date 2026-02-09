from django.apps import AppConfig


class FormacionReinduccionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.talent_hub.formacion_reinduccion'
    verbose_name = 'FormacionReinduccion'

    def ready(self):
        try:
            import apps.talent_hub.formacion_reinduccion.signals  # noqa
        except ImportError:
            pass
