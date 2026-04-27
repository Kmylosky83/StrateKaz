"""
Modelo de Liquidación — Supply Chain (H-SC-12 refactor header+líneas)

1 Liquidación = 1 VoucherRecepcion (OneToOne) con N líneas de detalle.
Estructura contable tipo factura: header con totales + líneas por producto.
Incluye PagoLiquidacion para cerrar el ciclo de pago.

Estados:
- BORRADOR: editable, se pueden ajustar precios/ajustes
- APROBADA: bloqueada, lista para pago
- PAGADA: tiene PagoLiquidacion asociado
- ANULADA: cancelada
"""
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Sum
from django.utils import timezone

from utils.models import TenantModel


class EstadoLiquidacion(models.TextChoices):
    BORRADOR = 'BORRADOR', 'Borrador'
    APROBADA = 'APROBADA', 'Aprobada — lista para pago'
    PAGADA = 'PAGADA', 'Pagada'
    ANULADA = 'ANULADA', 'Anulada'


class Liquidacion(TenantModel):
    """
    Header de liquidación. 1 Liquidación = 1 VoucherRecepcion (OneToOne).
    Total = suma de montos de las líneas.
    """

    voucher = models.OneToOneField(
        'sc_recepcion.VoucherRecepcion',
        on_delete=models.PROTECT,
        related_name='liquidacion',
        verbose_name='Voucher de recepción',
    )
    codigo = models.CharField(
        max_length=30,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código',
    )
    numero = models.PositiveIntegerField(
        editable=False,
        help_text='Consecutivo interno LIQ-NNNN',
    )

    # ─── Totales calculados ────────────────────────────────────────────
    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Subtotal',
        help_text='Suma de monto_base de las líneas.',
    )
    ajuste_calidad_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Ajuste por calidad total',
        help_text='Suma de ajuste_calidad_monto de las líneas.',
    )
    total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total',
        help_text='Suma de monto_final de las líneas.',
    )

    # ─── Estado ────────────────────────────────────────────────────────
    estado = models.CharField(
        max_length=20,
        choices=EstadoLiquidacion.choices,
        default=EstadoLiquidacion.BORRADOR,
        db_index=True,
        verbose_name='Estado',
    )

    # ─── Auditoría ─────────────────────────────────────────────────────
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de aprobación',
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='liquidaciones_aprobadas',
        verbose_name='Aprobado por',
    )
    observaciones = models.TextField(
        blank=True,
        default='',
        verbose_name='Observaciones',
    )

    class Meta:
        db_table = 'supply_chain_liquidacion'
        verbose_name = 'Liquidación'
        verbose_name_plural = 'Liquidaciones'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['estado', '-created_at']),
        ]

    def __str__(self):
        return f'{self.codigo} — {self.total}'

    # ─── Cálculos ──────────────────────────────────────────────────────
    def recalcular_totales(self):
        """Recalcula subtotal, ajuste_calidad_total y total desde las líneas."""
        agg = self.lineas_liquidacion.aggregate(
            sub=Sum('monto_base'),
            aj=Sum('ajuste_calidad_monto'),
            tot=Sum('monto_final'),
        )
        self.subtotal = agg['sub'] or Decimal('0.00')
        self.ajuste_calidad_total = agg['aj'] or Decimal('0.00')
        self.total = agg['tot'] or Decimal('0.00')
        self.save(
            update_fields=[
                'subtotal',
                'ajuste_calidad_total',
                'total',
                'updated_at',
            ]
        )

    def aprobar(self, user):
        """Cambia estado BORRADOR → APROBADA."""
        if self.estado != EstadoLiquidacion.BORRADOR:
            raise ValidationError(
                f'Solo se pueden aprobar liquidaciones en estado BORRADOR '
                f'(actual: {self.estado}).'
            )
        self.estado = EstadoLiquidacion.APROBADA
        self.fecha_aprobacion = timezone.now()
        self.aprobado_por = user
        self.save(
            update_fields=[
                'estado',
                'fecha_aprobacion',
                'aprobado_por',
                'updated_at',
            ]
        )

    # ─── Factory ───────────────────────────────────────────────────────
    @classmethod
    def desde_voucher(cls, voucher, observaciones=''):
        """
        Factory idempotente: crea una Liquidacion con N líneas de detalle
        a partir de un VoucherRecepcion aprobado. Una línea de liquidación
        por cada VoucherLineaMP.

        Si ya existe liquidación para este voucher, la retorna sin cambios.
        """
        # Idempotencia: si ya existe, retornarla
        existente = cls.objects.filter(voucher=voucher).first()
        if existente is not None:
            return existente

        from apps.supply_chain.gestion_proveedores.models import PrecioMateriaPrima

        with transaction.atomic():
            liq = cls(
                voucher=voucher,
                observaciones=observaciones,
                estado=EstadoLiquidacion.BORRADOR,
            )
            liq.numero = cls.objects.count() + 1
            liq.codigo = f'LIQ-{liq.numero:04d}'
            liq.save()

            # Crear líneas — una por cada VoucherLineaMP
            for voucher_linea in voucher.lineas.all():
                try:
                    precio_mp = PrecioMateriaPrima.objects.get(
                        proveedor=voucher.proveedor,
                        producto=voucher_linea.producto,
                        is_deleted=False,
                    )
                    precio_kg = precio_mp.precio_kg
                except PrecioMateriaPrima.DoesNotExist:
                    precio_kg = Decimal('0.00')

                LiquidacionLinea.objects.create(
                    liquidacion=liq,
                    voucher_linea=voucher_linea,
                    cantidad=voucher_linea.peso_neto_kg,
                    precio_unitario=precio_kg,
                    ajuste_calidad_pct=Decimal('0.00'),
                )

            liq.recalcular_totales()
            return liq


class LiquidacionLinea(TenantModel):
    """Línea de detalle de una Liquidación (una por cada VoucherLineaMP)."""

    liquidacion = models.ForeignKey(
        Liquidacion,
        on_delete=models.CASCADE,
        related_name='lineas_liquidacion',
        verbose_name='Liquidación',
    )
    voucher_linea = models.OneToOneField(
        'sc_recepcion.VoucherLineaMP',
        on_delete=models.PROTECT,
        related_name='liquidacion_linea',
        verbose_name='Línea del voucher',
    )
    cantidad = models.DecimalField(
        max_digits=14,
        decimal_places=3,
        verbose_name='Cantidad',
        help_text='Peso neto de la línea del voucher (kg).',
    )
    precio_unitario = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name='Precio unitario',
        help_text='Precio por kg del producto para este proveedor.',
    )
    monto_base = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False,
        default=Decimal('0.00'),
        verbose_name='Monto base',
        help_text='cantidad × precio_unitario',
    )
    ajuste_calidad_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Ajuste por calidad (%)',
        help_text='% positivo = premio, negativo = descuento.',
    )
    ajuste_calidad_monto = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False,
        default=Decimal('0.00'),
        verbose_name='Ajuste por calidad (monto)',
    )
    monto_final = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False,
        default=Decimal('0.00'),
        verbose_name='Monto final',
        help_text='monto_base + ajuste_calidad_monto',
    )
    observaciones = models.TextField(
        blank=True,
        default='',
        verbose_name='Observaciones',
    )

    class Meta:
        db_table = 'supply_chain_liquidacion_linea'
        verbose_name = 'Línea de liquidación'
        verbose_name_plural = 'Líneas de liquidación'
        ordering = ['id']

    def __str__(self):
        return f'Línea #{self.pk} — {self.monto_final}'

    def calcular_valores(self):
        cantidad = Decimal(str(self.cantidad or 0))
        precio = Decimal(str(self.precio_unitario or 0))
        ajuste_pct = Decimal(str(self.ajuste_calidad_pct or 0))
        self.monto_base = (cantidad * precio).quantize(Decimal('0.01'))
        self.ajuste_calidad_monto = (
            self.monto_base * ajuste_pct / Decimal('100')
        ).quantize(Decimal('0.01'))
        self.monto_final = self.monto_base + self.ajuste_calidad_monto

    def save(self, *args, **kwargs):
        self.calcular_valores()
        super().save(*args, **kwargs)


class PagoLiquidacion(TenantModel):
    """
    Registro de pago de una Liquidación. Mini-tesorería — al crearse,
    cambia automáticamente el estado de la Liquidación a PAGADA.
    """

    class MetodoPago(models.TextChoices):
        EFECTIVO = 'EFECTIVO', 'Efectivo'
        TRANSFERENCIA = 'TRANSFERENCIA', 'Transferencia Bancaria'
        CHEQUE = 'CHEQUE', 'Cheque'
        PSE = 'PSE', 'PSE'
        OTRO = 'OTRO', 'Otro'

    liquidacion = models.OneToOneField(
        Liquidacion,
        on_delete=models.PROTECT,
        related_name='pago',
        verbose_name='Liquidación',
    )
    fecha_pago = models.DateField(
        verbose_name='Fecha de pago',
    )
    metodo = models.CharField(
        max_length=20,
        choices=MetodoPago.choices,
        verbose_name='Método de pago',
    )
    referencia = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Referencia / N° comprobante',
    )
    monto_pagado = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name='Monto pagado',
        help_text='Debe coincidir con el total de la liquidación.',
    )
    observaciones = models.TextField(
        blank=True,
        default='',
        verbose_name='Observaciones',
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pagos_liquidacion_registrados',
        verbose_name='Registrado por',
    )

    class Meta:
        db_table = 'supply_chain_pago_liquidacion'
        verbose_name = 'Pago de liquidación'
        verbose_name_plural = 'Pagos de liquidación'
        ordering = ['-fecha_pago', '-created_at']

    def __str__(self):
        return f'Pago {self.liquidacion.codigo} — {self.monto_pagado}'

    def clean(self):
        super().clean()
        if self.liquidacion_id and self.monto_pagado is not None:
            if self.monto_pagado != self.liquidacion.total:
                raise ValidationError(
                    {
                        'monto_pagado': (
                            f'El monto pagado ({self.monto_pagado}) no coincide '
                            f'con el total de la liquidación '
                            f'({self.liquidacion.total}).'
                        )
                    }
                )
            if self.liquidacion.estado not in (
                EstadoLiquidacion.APROBADA,
                EstadoLiquidacion.PAGADA,
            ):
                raise ValidationError(
                    'Solo se pueden pagar liquidaciones en estado APROBADA.'
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        with transaction.atomic():
            super().save(*args, **kwargs)
            # Al crear, cambiar estado de la liquidación a PAGADA
            if self.liquidacion.estado != EstadoLiquidacion.PAGADA:
                self.liquidacion.estado = EstadoLiquidacion.PAGADA
                self.liquidacion.save(update_fields=['estado', 'updated_at'])


# ==============================================================================
# H-SC-06 — Liquidación periódica por proveedor
# ==============================================================================


class LiquidacionPeriodica(TenantModel):
    """Agrupa liquidaciones individuales por período + proveedor.

    Caso de uso (H-SC-06): proveedores con `frecuencia_pago` SEMANAL,
    QUINCENAL o MENSUAL acumulan N Liquidaciones APROBADAS del período.
    Una task Celery (lunes 06:00) crea/actualiza el agregado en estado
    BORRADOR para revisión humana antes de pagar.

    Estados:
    - BORRADOR: agregado generado, ajustable.
    - CONFIRMADA: aprobado por usuario, listo para pagar.
    - PAGADA: pago registrado.
    """

    class Estado(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        CONFIRMADA = 'CONFIRMADA', 'Confirmada'
        PAGADA = 'PAGADA', 'Pagada'

    proveedor = models.ForeignKey(
        'catalogo_productos.Proveedor',
        on_delete=models.PROTECT,
        related_name='liquidaciones_periodicas',
    )
    periodo_inicio = models.DateField()
    periodo_fin = models.DateField()
    frecuencia = models.CharField(
        max_length=20,
        help_text='Snapshot de Proveedor.frecuencia_pago al generar.',
    )
    subtotal = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal('0.00')
    )
    ajuste_calidad_total = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal('0.00')
    )
    total = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal('0.00')
    )
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.BORRADOR,
        db_index=True,
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='liquidaciones_periodicas_aprobadas',
    )
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    liquidaciones = models.ManyToManyField(
        'Liquidacion',
        related_name='periodicas',
        blank=True,
    )

    class Meta:
        verbose_name = 'Liquidación periódica'
        verbose_name_plural = 'Liquidaciones periódicas'
        ordering = ['-periodo_fin']
        constraints = [
            models.UniqueConstraint(
                fields=['proveedor', 'periodo_inicio', 'periodo_fin'],
                name='uq_liq_periodica_proveedor_periodo',
            ),
        ]

    def __str__(self):
        return (
            f'LIP-{self.id}: {self.proveedor} '
            f'({self.periodo_inicio} → {self.periodo_fin})'
        )

    def recalcular_totales(self):
        """Recalcula subtotal/ajuste/total desde las liquidaciones M2M."""
        agg = self.liquidaciones.aggregate(
            sub=Sum('subtotal'),
            ajuste=Sum('ajuste_calidad_total'),
            total=Sum('total'),
        )
        self.subtotal = agg['sub'] or Decimal('0.00')
        self.ajuste_calidad_total = agg['ajuste'] or Decimal('0.00')
        self.total = agg['total'] or Decimal('0.00')
        self.save(
            update_fields=[
                'subtotal',
                'ajuste_calidad_total',
                'total',
                'updated_at',
            ]
        )
