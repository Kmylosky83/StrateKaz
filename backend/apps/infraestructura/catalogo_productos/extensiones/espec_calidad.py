"""
Extensión ProductoEspecCalidad — especificaciones fisicoquímicas de producto.

Aplica a industrias con control de calidad por rango (rendering, química,
farma, cosméticos). NO es universal: los productos de industrias sin
control de calidad (panadería, textil, servicios) no deben tener esta
extensión.

Consumo defensivo:
    if hasattr(producto, 'espec_calidad'):
        acidez_ok = producto.espec_calidad.acidez_min <= valor <= producto.espec_calidad.acidez_max
"""
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q

from utils.models import TenantModel


class ProductoEspecCalidad(TenantModel):
    """
    Especificación de calidad de un producto (OneToOne opcional).

    Un producto tiene, como máximo, una especificación de calidad.
    Si no la tiene, el producto no está sujeto a control fisicoquímico.
    """

    # String reference evita import circular con models.py que registra
    # esta extensión al final. Patrón Django estándar para cross-module FKs.
    producto = models.OneToOneField(
        'catalogo_productos.Producto',
        on_delete=models.CASCADE,
        related_name='espec_calidad',
        verbose_name='Producto',
    )
    acidez_min = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Acidez mínima (%)',
        help_text='Rango inferior de acidez aceptable',
    )
    acidez_max = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Acidez máxima (%)',
        help_text='Rango superior de acidez aceptable',
    )
    requiere_prueba_acidez = models.BooleanField(
        default=False,
        verbose_name='Requiere prueba de acidez',
        help_text='Si es True, toda recepción debe registrar una prueba de acidez',
    )
    parametros_adicionales = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Parámetros adicionales de calidad',
        help_text='Extensible para otros parámetros por industria (pH, humedad, etc.)',
    )

    class Meta:
        # db_table preservado tras rename app_label catalogo_productos → infra_catalogo_productos (Fase 2.2 CT)
        db_table = 'catalogo_productos_productoespeccalidad'
        verbose_name = 'Especificación de calidad'
        verbose_name_plural = 'Especificaciones de calidad'
        constraints = [
            models.CheckConstraint(
                check=Q(acidez_max__gte=F('acidez_min')),
                name='ck_espec_calidad_rango_acidez_valido',
            ),
        ]

    def __str__(self):
        return f'Calidad: {self.producto.nombre} ({self.acidez_min}-{self.acidez_max}%)'

    def clean(self):
        """Validación a nivel aplicación (defense in depth con CheckConstraint)."""
        super().clean()
        if self.acidez_min is not None and self.acidez_max is not None:
            if self.acidez_max < self.acidez_min:
                raise ValidationError({
                    'acidez_max': 'Acidez máxima debe ser mayor o igual a la mínima',
                })

    @classmethod
    def obtener_por_acidez(cls, valor_acidez):
        """
        Retorna especificaciones cuyo rango incluye el valor de acidez dado.
        Reemplaza a TipoMateriaPrima.obtener_por_acidez() (método legado).
        """
        return cls.objects.filter(
            acidez_min__lte=valor_acidez,
            acidez_max__gte=valor_acidez,
        ).select_related('producto')
