from django.apps import AppConfig


class ColaboradoresConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.mi_equipo.colaboradores'
    verbose_name = 'Colaboradores'

    def ready(self):
        import apps.mi_equipo.colaboradores.signals  # noqa: F401
