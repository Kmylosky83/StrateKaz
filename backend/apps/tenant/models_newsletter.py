"""
Modelo de suscriptores al newsletter — Schema public (SHARED).

Almacena leads capturados desde la página de recursos del marketing site.
NO vive en el schema de ningún tenant, es global de la plataforma.
"""

from django.db import models
from utils.models import TimeStampedModel


class NewsletterSubscriber(TimeStampedModel):
    """
    Suscriptor del newsletter StrateKaz.

    Captura leads desde:
    - Página de recursos (descarga con email)
    - Formulario de newsletter

    Vive en schema public (SHARED_APPS).
    """

    email = models.EmailField(
        unique=True,
        verbose_name='Email',
        help_text='Correo electrónico del suscriptor',
    )
    nombre = models.CharField(
        max_length=150,
        blank=True,
        default='',
        verbose_name='Nombre',
    )
    categorias = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Categorias de Interes',
        help_text='Lista de categorías de recursos de interés',
    )
    source = models.CharField(
        max_length=50,
        default='recursos',
        verbose_name='Fuente',
        help_text='Desde donde se suscribió (recursos, newsletter, contacto)',
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo',
        help_text='Si es False, no recibe emails',
    )

    class Meta:
        db_table = 'platform_newsletter_subscriber'
        verbose_name = 'Suscriptor Newsletter'
        verbose_name_plural = 'Suscriptores Newsletter'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.email} ({self.source})'
