"""
Modelos para Recolección en Ruta — Supply Chain.

H-SC-RUTA-02 (refactor 2026-04-25): el VoucherRecoleccion es el documento que
registra qué se recogió en cada parada de una ruta de recolección. Diseñado
para ser flexible:
  - Captura en ruta (vía app/tablet en el camión, futuro)
  - Captura post-entrega (sube los kilos del talonario manual cuando el
    camión vuelve a planta)

Sin precios ni firmas — solo cargo+nombre del operador (auto). Los precios
se aplican desde la configuración Proveedor↔MP cuando se procesa la
liquidación correspondiente.

Relación con VoucherRecepcion: N:1 (varias recolecciones del día se
consolidan en una recepción de planta). Se usa para detectar merma del
recorrido (suma cantidades_declaradas vs peso_neto_total recibido en planta).
"""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from utils.models import TenantModel


class VoucherRecoleccion(TenantModel):
    """
    Documento primario de recolección en ruta (header).

    Un voucher = una salida de la ruta = N líneas (una por parada visitada).
    Generalmente una salida diaria por ruta, pero el modelo permite múltiples
    salidas por día si el negocio lo requiere (sin constraint).

    Estados:
      - BORRADOR: en proceso de captura (en ruta o ingresando post-entrega).
      - COMPLETADO: cerrado y firmado por el operador, listo para consolidar.
      - CONSOLIDADO: ya fue cruzado contra un VoucherRecepcion en planta
        (queda como evidencia auditable, no se debe modificar).
    """

    class Estado(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        COMPLETADO = 'COMPLETADO', 'Completado'
        CONSOLIDADO = 'CONSOLIDADO', 'Consolidado en recepción'

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        blank=True,
        verbose_name='Código',
        help_text='Código único del voucher (ej: VRC-001). Se auto-genera si viene vacío.',
    )
    ruta = models.ForeignKey(
        'catalogos.RutaRecoleccion',
        on_delete=models.PROTECT,
        # VoucherRecepcion.ruta_recoleccion usa `vouchers_recepcion`; este FK
        # usa `salidas_recoleccion` para no colisionar en el mismo target.
        related_name='salidas_recoleccion',
        verbose_name='Ruta',
    )
    fecha_recoleccion = models.DateField(
        verbose_name='Fecha de recolección',
        help_text='Día en que se realizó (o se realizará) la recolección.',
    )
    operador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='vouchers_recoleccion_operados',
        verbose_name='Operador',
        help_text='Usuario que registra el voucher (auto desde request.user).',
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
        help_text='Observaciones del operador (clima, novedades, etc.).',
    )

    class Meta:
        db_table = 'supply_chain_voucher_recoleccion'
        verbose_name = 'Voucher de Recolección'
        verbose_name_plural = 'Vouchers de Recolección'
        ordering = ['-fecha_recoleccion', '-created_at']
        indexes = [
            models.Index(fields=['ruta', '-fecha_recoleccion']),
            models.Index(fields=['estado', '-fecha_recoleccion']),
            models.Index(fields=['fecha_recoleccion']),
        ]

    def __str__(self):
        return f"{self.codigo or 'VRC-PEND'} — {self.ruta.codigo} ({self.fecha_recoleccion})"

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self._generate_code()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_code(cls):
        """Genera código secuencial VRC-001, VRC-002... dentro del tenant."""
        last = cls.objects.order_by('-id').values_list('codigo', flat=True).first()
        if last and last.startswith('VRC-'):
            try:
                num = int(last.split('-')[1]) + 1
            except (ValueError, IndexError):
                num = cls.objects.count() + 1
        else:
            num = cls.objects.count() + 1
        return f'VRC-{num:03d}'

    @property
    def total_lineas(self) -> int:
        return self.lineas.count()

    @property
    def total_kilos(self):
        from django.db.models import Sum
        agg = self.lineas.aggregate(total=Sum('cantidad'))
        return agg['total'] or 0


class LineaVoucherRecoleccion(TenantModel):
    """
    Línea de un VoucherRecoleccion = recolección a un proveedor (parada).

    Una línea por (proveedor + producto) recolectado. Si en una visita se
    recogen 2 productos distintos al mismo proveedor, son 2 líneas.

    El proveedor debe ser una RutaParada activa de la ruta del voucher
    (validado en serializer). Si el productor no está registrado, el flujo
    UI ofrece el atajo "+ Crear proveedor" inline.

    Sin precio — el precio se obtiene de la configuración Proveedor↔MP al
    procesar la liquidación correspondiente.
    """

    voucher = models.ForeignKey(
        VoucherRecoleccion,
        on_delete=models.CASCADE,
        related_name='lineas',
        verbose_name='Voucher',
    )
    proveedor = models.ForeignKey(
        'catalogo_productos.Proveedor',
        on_delete=models.PROTECT,
        related_name='lineas_recoleccion',
        verbose_name='Proveedor (productor)',
    )
    producto = models.ForeignKey(
        'catalogo_productos.Producto',
        on_delete=models.PROTECT,
        related_name='lineas_recoleccion',
        verbose_name='Producto (MP)',
    )
    cantidad = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Cantidad (kilos)',
        help_text='Kilos declarados/entregados por el proveedor en esta parada.',
    )
    notas = models.CharField(
        max_length=200,
        blank=True,
        default='',
        verbose_name='Notas de línea',
    )

    class Meta:
        db_table = 'supply_chain_voucher_recoleccion_linea'
        verbose_name = 'Línea de Voucher de Recolección'
        verbose_name_plural = 'Líneas de Voucher de Recolección'
        ordering = ['voucher', 'id']
        indexes = [
            models.Index(fields=['voucher', 'proveedor']),
            models.Index(fields=['producto']),
        ]

    def __str__(self):
        return f"{self.voucher.codigo} — {self.proveedor.nombre_comercial} — {self.cantidad} kg"

    def clean(self):
        super().clean()
        if self.cantidad is not None and self.cantidad <= 0:
            raise ValidationError({'cantidad': 'La cantidad debe ser mayor a cero.'})
