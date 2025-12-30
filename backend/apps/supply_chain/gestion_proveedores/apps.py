from django.apps import AppConfig


class GestionProveedoresConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.supply_chain.gestion_proveedores'
    verbose_name = 'Gestión de Proveedores'
    label = 'gestion_proveedores'

    def ready(self):
        """Inicializar señales y configuraciones."""
        pass
