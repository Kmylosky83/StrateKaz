from django.apps import AppConfig


class OnboardingInduccionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.mi_equipo.onboarding_induccion'
    verbose_name = 'Onboarding e Inducción'

    def ready(self):
        try:
            import apps.mi_equipo.onboarding_induccion.signals  # noqa
        except ImportError:
            pass
