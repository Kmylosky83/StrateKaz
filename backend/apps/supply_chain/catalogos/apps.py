from django.apps import AppConfig


class CatalogosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.supply_chain.catalogos'
    verbose_name = 'Catalogos'

    def ready(self):
        import apps.supply_chain.catalogos.signals  # noqa: F401
