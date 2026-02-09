from django.apps import AppConfig


class ColaboradoresConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.talent_hub.colaboradores'
    verbose_name = 'Colaboradores'

    def ready(self):
        import apps.talent_hub.colaboradores.signals  # noqa: F401
