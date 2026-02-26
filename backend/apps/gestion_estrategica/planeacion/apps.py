from django.apps import AppConfig


class PlaneacionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.planeacion'
    label = 'planeacion'
    verbose_name = 'Planeación Estratégica'

    def ready(self):
        """Registrar signals para notificaciones automáticas."""
        import apps.gestion_estrategica.planeacion.signals  # noqa: F401
