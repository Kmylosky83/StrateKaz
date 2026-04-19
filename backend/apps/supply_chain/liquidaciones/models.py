"""
Modelo de Liquidación — Supply Chain S3

Sesión 3 del Roadmap Supply Chain. Ver:
docs/03-modulos/supply-chain/ROADMAP.md

Liquidacion es OneToOne a VoucherRecepcion: registra el cálculo
económico final de la recepción (peso × precio × ajustes de calidad).
"""
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models

from utils.models import TenantModel


class Liquidacion(TenantModel):
    """
    Liquidación económica de un VoucherRecepcion.

    OneToOne con Voucher: una recepción aprobada genera exactamente una
    liquidación. El cálculo congela el peso neto y el precio snapshot del
    voucher, más ajustes opcionales por resultado de calidad (CONDICIONAL
    puede aplicar descuento porcentual).

    Estados:
    - PENDIENTE: generada, aún no aprobada por contabilidad
    - APROBADA: lista para pago (entra a cuentas por pagar en L70)
    - PAGADA: ejecutada por tesorería (fuera de alcance esta iteración)
    """

    class EstadoLiquidacion(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente de aprobación'
        APROBADA = 'APROBADA', 'Aprobada — lista para pago'
        PAGADA = 'PAGADA', 'Pagada'
        ANULADA = 'ANULADA', 'Anulada'

    voucher = models.OneToOneField(
        'sc_recepcion.VoucherRecepcion',
        on_delete=models.PROTECT,
        related_name='liquidacion',
        verbose_name='Voucher de recepción',
    )

    # ─── Valores congelados al momento de liquidar ────────────────────
    precio_kg_aplicado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio por kg aplicado',
        help_text='Copia de VoucherRecepcion.precio_kg_snapshot',
    )
    peso_neto_kg = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Peso neto (kg)',
        help_text='Copia de VoucherRecepcion.peso_neto_kg',
    )
    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False,
        verbose_name='Subtotal',
        help_text='Calculado = peso_neto_kg × precio_kg_aplicado',
    )

    # ─── Ajustes (opcional, por QC) ────────────────────────────────────
    ajuste_calidad_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Ajuste por calidad (%)',
        help_text=(
            'Descuento porcentual si QC dio CONDICIONAL. '
            'Ej: 5.00 = 5% de descuento sobre subtotal.'
        ),
    )
    ajuste_calidad_monto = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        editable=False,
        verbose_name='Ajuste por calidad (monto)',
        help_text='Calculado = subtotal × ajuste_calidad_pct / 100',
    )

    total_liquidado = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False,
        verbose_name='Total liquidado',
        help_text='Calculado = subtotal − ajuste_calidad_monto',
    )

    # ─── Estado ────────────────────────────────────────────────────────
    estado = models.CharField(
        max_length=20,
        choices=EstadoLiquidacion.choices,
        default=EstadoLiquidacion.PENDIENTE,
        db_index=True,
        verbose_name='Estado',
    )

    observaciones = models.TextField(
        blank=True,
        default='',
        verbose_name='Observaciones',
    )

    class Meta:
        db_table = 'supply_chain_liquidacion_recepcion'
        verbose_name = 'Liquidación'
        verbose_name_plural = 'Liquidaciones'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['estado', '-created_at']),
            models.Index(fields=['voucher']),
        ]

    def __str__(self):
        return f"Liquidación #{self.pk} — Voucher #{self.voucher_id} ({self.total_liquidado})"

    # ─── Cálculos ──────────────────────────────────────────────────────
    def calcular_valores(self):
        precio = Decimal(str(self.precio_kg_aplicado or 0))
        peso = Decimal(str(self.peso_neto_kg or 0))
        ajuste_pct = Decimal(str(self.ajuste_calidad_pct or 0))

        self.subtotal = (peso * precio).quantize(Decimal('0.01'))
        self.ajuste_calidad_monto = (self.subtotal * ajuste_pct / Decimal('100')).quantize(
            Decimal('0.01')
        )
        self.total_liquidado = self.subtotal - self.ajuste_calidad_monto

    def save(self, *args, **kwargs):
        self.calcular_valores()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if self.precio_kg_aplicado is not None and self.precio_kg_aplicado < 0:
            raise ValidationError({'precio_kg_aplicado': 'El precio no puede ser negativo.'})
        if self.peso_neto_kg is not None and self.peso_neto_kg <= 0:
            raise ValidationError({'peso_neto_kg': 'El peso neto debe ser mayor a cero.'})
        if self.ajuste_calidad_pct is not None and not (
            Decimal('0') <= self.ajuste_calidad_pct <= Decimal('100')
        ):
            raise ValidationError({
                'ajuste_calidad_pct': 'El ajuste porcentual debe estar entre 0 y 100.'
            })

    # ─── Factory ───────────────────────────────────────────────────────
    @classmethod
    def desde_voucher(cls, voucher, ajuste_calidad_pct=Decimal('0.00'), observaciones=''):
        """
        Factory para crear una liquidación a partir de un voucher aprobado.

        Congela precio y peso del voucher. Aplica ajuste de calidad si
        el QC del voucher resultó CONDICIONAL (el caller decide el %).
        """
        liq = cls(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=voucher.peso_neto_kg,
            ajuste_calidad_pct=ajuste_calidad_pct,
            observaciones=observaciones,
        )
        liq.full_clean()
        liq.save()
        return liq
