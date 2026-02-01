"""
MS-003: Modelo de Preferencias de Usuario - StrateKaz

UserPreferences: Almacena preferencias de configuración personal para cada usuario.

Características:
- Idioma de interfaz (español, inglés)
- Zona horaria personalizada
- Formato de fecha preferido
- Relación 1:1 con User
"""
from django.db import models
from django.conf import settings


class UserPreferences(models.Model):
    """
    Modelo para almacenar preferencias personales de usuario.

    Cada usuario tiene un registro de preferencias que controla:
    - Idioma de la interfaz
    - Zona horaria para mostrar fechas/horas
    - Formato de visualización de fechas
    """

    # Choices para idioma
    LANGUAGE_SPANISH = 'es'
    LANGUAGE_ENGLISH = 'en'
    LANGUAGE_CHOICES = [
        (LANGUAGE_SPANISH, 'Español'),
        (LANGUAGE_ENGLISH, 'English'),
    ]

    # Choices para formato de fecha
    FORMAT_DD_MM_YYYY = 'DD/MM/YYYY'
    FORMAT_MM_DD_YYYY = 'MM/DD/YYYY'
    FORMAT_YYYY_MM_DD = 'YYYY-MM-DD'
    DATE_FORMAT_CHOICES = [
        (FORMAT_DD_MM_YYYY, 'DD/MM/YYYY'),
        (FORMAT_MM_DD_YYYY, 'MM/DD/YYYY'),
        (FORMAT_YYYY_MM_DD, 'YYYY-MM-DD'),
    ]

    # Relación 1:1 con usuario
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='preferences',
        verbose_name='Usuario',
        primary_key=True
    )

    # Preferencias
    language = models.CharField(
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default=LANGUAGE_SPANISH,
        verbose_name='Idioma',
        help_text='Idioma de la interfaz de usuario'
    )

    timezone = models.CharField(
        max_length=50,
        default='America/Bogota',
        verbose_name='Zona Horaria',
        help_text='Zona horaria para mostrar fechas y horas'
    )

    date_format = models.CharField(
        max_length=15,
        choices=DATE_FORMAT_CHOICES,
        default=FORMAT_DD_MM_YYYY,
        verbose_name='Formato de Fecha',
        help_text='Formato para visualizar fechas'
    )

    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )

    class Meta:
        db_table = 'core_user_preferences'
        verbose_name = 'Preferencia de Usuario'
        verbose_name_plural = 'Preferencias de Usuario'
        ordering = ['user']

    def __str__(self):
        return f"Preferencias de {self.user.username}"

    @classmethod
    def get_or_create_for_user(cls, user):
        """
        Obtiene o crea las preferencias para un usuario.

        Args:
            user: Usuario para el cual obtener/crear preferencias

        Returns:
            tuple: (UserPreferences, created)
        """
        return cls.objects.get_or_create(
            user=user,
            defaults={
                'language': cls.LANGUAGE_SPANISH,
                'timezone': 'America/Bogota',
                'date_format': cls.FORMAT_DD_MM_YYYY,
            }
        )

    @property
    def language_display(self) -> str:
        """Retorna el nombre legible del idioma."""
        return dict(self.LANGUAGE_CHOICES).get(self.language, self.language)

    @property
    def date_format_display(self) -> str:
        """Retorna el nombre legible del formato de fecha."""
        return dict(self.DATE_FORMAT_CHOICES).get(self.date_format, self.date_format)
