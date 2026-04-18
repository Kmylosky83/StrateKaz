from django.apps import AppConfig


class RecepcionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.supply_chain.recepcion'
    verbose_name = 'Recepción de Materia Prima (Supply Chain)'
    label = 'sc_recepcion'  # evita colisión con production_ops.recepcion (label auto: 'recepcion')

    def ready(self):
        from . import signals  # noqa: F401
