from django.apps import AppConfig


class OrganizacionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.organizacion'
    label = 'organizacion'
    verbose_name = 'Organización'
