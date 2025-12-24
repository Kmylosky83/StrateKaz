from django.apps import AppConfig


class GestionComitesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hseq_management.gestion_comites'
    verbose_name = 'Gestión de Comités HSEQ'

    def ready(self):
        """Import signals when app is ready."""
        try:
            import apps.hseq_management.gestion_comites.signals  # noqa
        except ImportError:
            pass
