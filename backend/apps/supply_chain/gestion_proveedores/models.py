"""
Modelos para Gestión de Proveedores (Supply Chain).

Post refactor 2026-04-21 (Proveedor → CT):
  Este módulo contiene SOLO lo que se queda en supply_chain:
    - ModalidadLogistica (catálogo dinámico de SC).
    - PrecioMateriaPrima (precio vigente por Proveedor×Producto).
    - HistorialPrecioProveedor (audit log append-only de cambios de precio).

  Proveedor, TipoProveedor → movidos a `catalogo_productos` (CT-layer).
  FormaPago, TipoCuentaBancaria, CondicionComercialProveedor,
  CriterioEvaluacion, EvaluacionProveedor, DetalleEvaluacion → eliminados
  (fuera de scope Supply Chain; se gestionarán en Administración/Compras
  cuando esos módulos entren a LIVE).

Ver: docs/history/2026-04-21-refactor-proveedor-a-ct.md
"""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from utils.models import TenantModel, TimeStampedModel


# ==============================================================================
# CATÁLOGO DINÁMICO: ModalidadLogistica
# ==============================================================================

class ModalidadLogistica(models.Model):
    """
    Modalidad logística (dinámico). Aplica al flujo de precio/entrega.

    Ejemplos: ENTREGA_PLANTA, COMPRA_EN_PUNTO.
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
    )
    descripcion = models.TextField(blank=True, null=True)
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_modalidad_logistica'
        verbose_name = 'Modalidad Logística'
        verbose_name_plural = 'Modalidades Logísticas'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


# ==============================================================================
# PRECIOS DE MATERIA PRIMA (por Proveedor × Producto)
# ==============================================================================

class PrecioMateriaPrima(TenantModel):
    """
    Precio vigente por Proveedor × Producto (catalogo_productos canónico).

    Cada proveedor de materia prima tiene exactamente un registro de precio
    por producto que suministra. Los cambios históricos se registran en
    HistorialPrecioProveedor.

    FK a Proveedor repuntada a `catalogo_productos.Proveedor` (2026-04-21).
    """
    proveedor = models.ForeignKey(
        'catalogo_productos.Proveedor',
        on_delete=models.CASCADE,
        related_name='precios_materia_prima',
        verbose_name='Proveedor',
    )
    producto = models.ForeignKey(
        'catalogo_productos.Producto',
        on_delete=models.PROTECT,
        related_name='precios_proveedor',
        verbose_name='Producto del catálogo',
        help_text='Producto maestro del catalogo_productos (tipo=MATERIA_PRIMA)',
    )
    precio_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio por kg',
    )

    class Meta:
        db_table = 'supply_chain_precio_materia_prima'
        verbose_name = 'Precio de Materia Prima'
        verbose_name_plural = 'Precios de Materias Primas'
        ordering = ['proveedor']
        indexes = [
            models.Index(fields=['proveedor', 'producto']),
            models.Index(fields=['producto']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['proveedor', 'producto'],
                condition=Q(is_deleted=False),
                name='uq_precio_proveedor_producto_active',
            ),
        ]

    def __str__(self):
        return f"{self.proveedor.nombre_comercial} - {self.producto.nombre}: ${self.precio_kg}/kg"

    def clean(self):
        super().clean()
        if self.precio_kg is not None and self.precio_kg < 0:
            raise ValidationError({'precio_kg': 'El precio no puede ser negativo'})


class HistorialPrecioProveedor(TimeStampedModel):
    """
    Historial inmutable de cambios de precio de proveedores (audit log).

    Append-only: una vez creado, el registro no se modifica ni elimina.
    Hereda sólo de TimeStampedModel — en un audit log, "quién" (modificado_por)
    es dato de negocio, no metadato técnico.

    FK a Proveedor repuntada a `catalogo_productos.Proveedor` (2026-04-21).
    """
    proveedor = models.ForeignKey(
        'catalogo_productos.Proveedor',
        on_delete=models.CASCADE,
        related_name='historial_precios',
        verbose_name='Proveedor',
    )
    producto = models.ForeignKey(
        'catalogo_productos.Producto',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='historial_precios_proveedor',
        verbose_name='Producto del catálogo',
    )
    precio_anterior = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
    )
    precio_nuevo = models.DecimalField(
        max_digits=10, decimal_places=2,
    )
    # Campo de negocio del audit log. on_delete=SET_NULL alineado con
    # política TenantModel (Habeas Data Ley 1581). Ver docs/history/2026-04-12.
    modificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sc_historiales_precio_proveedor',
        verbose_name='Modificado por',
    )
    motivo = models.TextField(verbose_name='Motivo del cambio')

    class Meta:
        db_table = 'supply_chain_historial_precio'
        verbose_name = 'Historial de Precio'
        verbose_name_plural = 'Historiales de Precios'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['proveedor', '-created_at']),
            models.Index(fields=['modificado_por']),
            models.Index(fields=['producto']),
        ]

    def __str__(self):
        item = self.producto.nombre if self.producto else 'N/A'
        return f"{self.proveedor.nombre_comercial} - {item}: {self.precio_anterior} -> {self.precio_nuevo}"

    def save(self, *args, **kwargs):
        """Append-only: una vez creado, no se puede modificar."""
        if self.pk is not None:
            raise PermissionError(
                'HistorialPrecioProveedor es append-only: no se permite '
                'modificar registros existentes.'
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Append-only: no se permite eliminar."""
        raise PermissionError(
            'HistorialPrecioProveedor es append-only: no se permite '
            'eliminar registros.'
        )

    @property
    def variacion_precio(self):
        if self.precio_anterior is None or self.precio_anterior == 0:
            return None
        variacion = ((self.precio_nuevo - self.precio_anterior) / self.precio_anterior) * 100
        return round(variacion, 2)

    @property
    def tipo_cambio(self):
        if self.precio_anterior is None:
            return 'INICIAL'
        elif self.precio_nuevo > self.precio_anterior:
            return 'AUMENTO'
        elif self.precio_nuevo < self.precio_anterior:
            return 'REDUCCION'
        return 'SIN_CAMBIO'


# Stub para compatibilidad con migración 0001_initial (modelo movido a production_ops)
def prueba_acidez_upload_path(instance, filename):
    return f'pruebas_acidez/{filename}'
