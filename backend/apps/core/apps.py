from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'

    def ready(self):
        """
        Registra signals cuando la app está lista.

        Signals registrados:
        - rbac_signals: Propagación automática de permisos RBAC
        """
        # Importar signals para registrarlos
        import apps.core.signals.rbac_signals  # noqa: F401
