from django.apps import AppConfig


class SeleccionContratacionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.mi_equipo.seleccion_contratacion'
    verbose_name = 'Selección y Contratación'

    def ready(self):
        try:
            import apps.mi_equipo.seleccion_contratacion.signals  # noqa
        except ImportError:
            pass
