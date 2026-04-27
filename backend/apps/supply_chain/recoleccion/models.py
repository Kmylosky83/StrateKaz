"""
Modelos para Recolección en Ruta — Supply Chain.

H-SC-RUTA-02 (refactor 2 — 2026-04-26):
  Cada VoucherRecoleccion = UNA parada visitada (atómico).
  El recolector puede emitir el voucher en cada parada (entregar al productor)
  o registrarlo después (post-entrega) si no usó la app en ruta. Modo dinámico.

  Antes era 1 voucher = N líneas. Se eliminó el modelo LineaVoucherRecoleccion
  porque conceptualmente no encajaba con el flujo del recolector (que opera
  parada por parada, no recorrido completo). Datos legacy fueron borrados.

Sin precio — los precios viven en gestion_proveedores.PrecioMateriaPrima
y se aplican al liquidar al productor por sus vouchers del periodo.

Conexión con planta:
  N VoucherRecoleccion (ruta+fecha) ↔ 1 VoucherRecepcion consolidada en planta.
  Implementado vía M2M VoucherRecepcion.vouchers_recoleccion_origen.
"""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from utils.models import TenantModel


class VoucherRecoleccion(TenantModel):
    """
    Voucher de recolección — UNA parada visitada por la ruta.

    Estados:
      - BORRADOR: capturado, aún editable. La ruta no se considera "cerrada"
        del periodo si quedan vouchers en BORRADOR (bloquea liquidación).
      - COMPLETADO: cerrado/firmado. No editable. Se puede usar para liquidar
        al productor.
    """

    class Estado(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        COMPLETADO = 'COMPLETADO', 'Completado'

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        blank=True,
        verbose_name='Código',
        help_text='Código único (VRC-001). Se auto-genera si viene vacío.',
    )
    ruta = models.ForeignKey(
        'catalogos.RutaRecoleccion',
        on_delete=models.PROTECT,
        related_name='salidas_recoleccion',
        verbose_name='Ruta',
    )
    fecha_recoleccion = models.DateField(
        verbose_name='Fecha de recolección',
        help_text='Día en que se recogió a este productor.',
    )
    proveedor = models.ForeignKey(
        'catalogo_productos.Proveedor',
        on_delete=models.PROTECT,
        related_name='vouchers_recoleccion',
        verbose_name='Proveedor (productor)',
    )
    producto = models.ForeignKey(
        'catalogo_productos.Producto',
        on_delete=models.PROTECT,
        related_name='vouchers_recoleccion',
        verbose_name='Producto (MP)',
    )
    cantidad = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Cantidad (kilos)',
        help_text='Kilos entregados por el productor en esta parada.',
    )
    operador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='vouchers_recoleccion_operados',
        verbose_name='Operador',
        help_text='Usuario que registró este voucher (en ruta o post-entrega).',
    )
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.BORRADOR,
        db_index=True,
        verbose_name='Estado',
    )
    notas = models.TextField(
        blank=True,
        default='',
        verbose_name='Notas',
        help_text='Observaciones de la parada (clima, novedades, etc.).',
    )

    class Meta:
        db_table = 'supply_chain_voucher_recoleccion'
        verbose_name = 'Voucher de Recolección'
        verbose_name_plural = 'Vouchers de Recolección'
        ordering = ['-fecha_recoleccion', '-created_at']
        indexes = [
            models.Index(fields=['ruta', '-fecha_recoleccion']),
            models.Index(fields=['proveedor', '-fecha_recoleccion']),
            models.Index(fields=['estado', '-fecha_recoleccion']),
            models.Index(fields=['fecha_recoleccion']),
        ]

    def __str__(self):
        return f"{self.codigo or 'VRC-PEND'} — {self.proveedor.nombre_comercial} ({self.cantidad} kg)"

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self._generate_code()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_code(cls):
        """Código secuencial VRC-001, VRC-002... dentro del tenant."""
        last = cls.objects.order_by('-id').values_list('codigo', flat=True).first()
        if last and last.startswith('VRC-'):
            try:
                num = int(last.split('-')[1]) + 1
            except (ValueError, IndexError):
                num = cls.objects.count() + 1
        else:
            num = cls.objects.count() + 1
        return f'VRC-{num:03d}'

    def clean(self):
        super().clean()
        if self.cantidad is not None and self.cantidad <= 0:
            raise ValidationError({'cantidad': 'La cantidad debe ser mayor a cero.'})
