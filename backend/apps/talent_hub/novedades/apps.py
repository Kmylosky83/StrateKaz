from django.apps import AppConfig


class NovedadesConfig(AppConfig):
    """
    Configuración de la aplicación Novedades

    Gestión de:
    - Incapacidades (origen común, laboral, maternidad, paternidad)
    - Licencias (remuneradas, no remuneradas, legales)
    - Permisos (cortos, compensables)
    - Vacaciones (periodos, solicitudes, cálculo de días hábiles)
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.talent_hub.novedades'
    verbose_name = 'Novedades de Talento Humano'
