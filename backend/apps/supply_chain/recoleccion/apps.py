from django.apps import AppConfig


class RecoleccionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.supply_chain.recoleccion'
    verbose_name = 'Recolección en Ruta (Supply Chain)'
    label = 'sc_recoleccion'
