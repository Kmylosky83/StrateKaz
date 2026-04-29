"""
Extensión ProductoEspecCalidadParametro — parámetros de calidad genéricos.

Tabla hija de ProductoEspecCalidad que generaliza el concepto de "parámetro
medible con rango aceptable". Reemplaza progresivamente los campos hardcoded
`acidez_min/max/requiere_prueba_acidez` del modelo padre, que quedan
deprecados por retrocompatibilidad pero no deben usarse para nuevos
parámetros.

Casos de uso:
    - Grasas/aceites: acidez %, humedad %, índice de peróxidos meq/kg
    - Química: pH, conductividad µS/cm, densidad g/cm³
    - Farma/cosmética: pureza %, microbiológicos UFC/g
    - Alimentos: proteína %, ceniza %, grasa saturada %

Parte de H-SC-03 (QC obligatorio por producto en Recepción MP).
"""
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q

from utils.models import TenantModel


class ProductoEspecCalidadParametro(TenantModel):
    """
    Parámetro individual de calidad (nombre + unidad + rango min/max).

    Cada ProductoEspecCalidad puede tener N parámetros. Un valor medido
    en recepción se considera "dentro de rango" si
    `valor_min <= medido <= valor_max`.

    Si `es_critico=True`, un valor fuera de rango rechaza el lote
    (voucher no puede aprobarse aunque el resultado sea CONDICIONAL).
    Si `es_critico=False`, solo genera advertencia y puede justificar
    ajuste de precio.
    """

    espec_calidad = models.ForeignKey(
        'infra_catalogo_productos.ProductoEspecCalidad',
        on_delete=models.CASCADE,
        related_name='parametros',
        verbose_name='Especificación de calidad',
    )
    nombre_parametro = models.CharField(
        max_length=80,
        db_index=True,
        verbose_name='Nombre del parámetro',
        help_text='Ej: acidez, humedad, pH, densidad',
    )
    descripcion = models.TextField(
        blank=True,
        default='',
        verbose_name='Descripción',
    )
    unidad = models.CharField(
        max_length=20,
        verbose_name='Unidad',
        help_text='Unidad de medida del parámetro. Ej: %, ppm, pH, g/cm³',
    )
    valor_min = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        verbose_name='Valor mínimo aceptable',
    )
    valor_max = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        verbose_name='Valor máximo aceptable',
    )
    es_critico = models.BooleanField(
        default=False,
        verbose_name='Es crítico',
        help_text=(
            'Si es True, un valor medido fuera de rango rechaza el lote '
            '(voucher no aprobable). Si es False, solo genera advertencia '
            'y puede justificar ajuste de precio.'
        ),
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden de presentación',
    )

    class Meta:
        # db_table preservado tras rename app_label catalogo_productos → infra_catalogo_productos (Fase 2.2 CT)
        db_table = 'catalogo_productos_productoespeccalidadparametro'
        verbose_name = 'Parámetro de especificación de calidad'
        verbose_name_plural = 'Parámetros de especificación de calidad'
        ordering = ['orden', 'nombre_parametro']
        constraints = [
            models.CheckConstraint(
                check=Q(valor_max__gte=F('valor_min')),
                name='ck_espec_calidad_parametro_rango_valido',
            ),
            models.UniqueConstraint(
                fields=['espec_calidad', 'nombre_parametro'],
                condition=Q(is_deleted=False),
                name='uq_espec_calidad_parametro_por_espec',
            ),
        ]
        indexes = [
            models.Index(fields=['espec_calidad', 'orden']),
        ]

    def __str__(self):
        return (
            f'{self.nombre_parametro} [{self.valor_min}-{self.valor_max}{self.unidad}]'
        )

    def clean(self):
        """Validación aplicación (defense in depth con CheckConstraint DB)."""
        super().clean()
        if self.valor_min is not None and self.valor_max is not None:
            if self.valor_max < self.valor_min:
                raise ValidationError({
                    'valor_max': 'El valor máximo debe ser mayor o igual al mínimo',
                })

    def cumple(self, valor_medido) -> bool:
        """True si el valor medido está dentro del rango aceptable."""
        from decimal import Decimal
        v = Decimal(str(valor_medido))
        return self.valor_min <= v <= self.valor_max
