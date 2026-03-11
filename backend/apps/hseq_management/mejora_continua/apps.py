from django.apps import AppConfig


class MejoraContinuaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hseq_management.mejora_continua'
    verbose_name = 'MejoraContinua'

    def ready(self):
        import apps.hseq_management.mejora_continua.signals  # noqa: F401
        from .event_handlers import register_handlers
        register_handlers()
