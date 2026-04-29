"""
Modelo de Liquidación — Supply Chain (H-SC-12 refactor header+líneas + H-SC-02 estados).

1 Liquidación = 1 VoucherRecepcion (OneToOne) con N líneas de detalle.
Estructura contable tipo factura: header con totales + líneas por producto.
Incluye PagoLiquidacion para cerrar el ciclo de pago.

Estados (H-SC-02):
- SUGERIDA   : auto-creada al aprobar voucher (precio snapshot inmutable).
- AJUSTADA   : usuario modificó precio/calidad de alguna línea.
- CONFIRMADA : responsable validó la liquidación, se archiva en GD.
- PAGADA     : tiene PagoLiquidacion asociado.
- ANULADA    : cancelada.
- BORRADOR / APROBADA : DEPRECATED, mantenidos solo para backward-compat
  durante la migración de datos. NO usar en código nuevo.
"""
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import IntegrityError, models, transaction
from django.db.models import Sum
from django.utils import timezone

from utils.models import TenantModel


class EstadoLiquidacion(models.TextChoices):
    SUGERIDA = 'SUGERIDA', 'Sugerida (auto-creada)'
    AJUSTADA = 'AJUSTADA', 'Ajustada (precio modificado)'
    CONFIRMADA = 'CONFIRMADA', 'Confirmada por responsable'
    PAGADA = 'PAGADA', 'Pagada'
    ANULADA = 'ANULADA', 'Anulada'
    # DEPRECATED — solo backward-compat para datos previos a H-SC-02.
    BORRADOR = 'BORRADOR', '[deprecated] Borrador'
    APROBADA = 'APROBADA', '[deprecated] Aprobada'


# Estados que aceptan ajustes de línea o transición a CONFIRMADA.
ESTADOS_EDITABLES = {
    EstadoLiquidacion.SUGERIDA,
    EstadoLiquidacion.AJUSTADA,
    # BORRADOR es legacy pero sigue siendo "editable" hasta migración.
    EstadoLiquidacion.BORRADOR,
}


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
        default=EstadoLiquidacion.SUGERIDA,
        db_index=True,
        verbose_name='Estado',
    )

    # ─── Auditoría ─────────────────────────────────────────────────────
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de aprobación / confirmación',
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='liquidaciones_aprobadas',
        verbose_name='Aprobado / confirmado por',
    )
    observaciones = models.TextField(
        blank=True,
        default='',
        verbose_name='Observaciones',
    )

    # ─── Archivado en Gestión Documental (H-SC-GD-ARCHIVE) ─────────────
    documento_archivado_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Documento archivado en GD',
        help_text=(
            'ID del Documento de Gestión Documental generado al confirmar '
            'la liquidación. Se llena vía servicio (cross-app, sin FK).'
        ),
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

    # ─── Transiciones de estado (H-SC-02) ──────────────────────────────
    def confirmar(self, user):
        """
        Transiciona SUGERIDA / AJUSTADA → CONFIRMADA y archiva PDF en GD.

        Acepta también BORRADOR (legacy) por backward-compat. Cualquier
        otro estado lanza ValidationError.

        El archivado en GD se hace en best-effort: si falla, la transición
        de estado igual prospera y se loguea warning. Esto es deliberado:
        la confirmación contable no debe quedar bloqueada por GD.
        """
        if self.estado not in ESTADOS_EDITABLES:
            raise ValidationError(
                f'Solo se pueden confirmar liquidaciones en estado '
                f'{", ".join(ESTADOS_EDITABLES)} (actual: {self.estado}).'
            )
        self.estado = EstadoLiquidacion.CONFIRMADA
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
        # Archivado GD best-effort (no rompe la transición).
        self._archivar_en_gd(user)

    def aprobar(self, user):
        """Alias backward-compat → confirmar()."""
        return self.confirmar(user)

    # ─── Archivado en Gestión Documental ───────────────────────────────
    def _archivar_en_gd(self, user):
        """
        Registra la liquidación en GD como documento-vivo (sin PDF físico).
        El PDF se regenera on-demand desde ``LiquidacionPDFService`` cuando
        el usuario lo solicita. Best-effort: log warning si falla.
        """
        import logging

        logger = logging.getLogger(__name__)
        try:
            from apps.infraestructura.gestion_documental.models import (
                TipoDocumento,
            )
            from apps.infraestructura.gestion_documental.services import (
                DocumentoService,
            )

            # Resolver TipoDocumento — si no existe, abortar silenciosamente.
            tipo = TipoDocumento.objects.filter(codigo='LIQUIDACION_SC').first()
            if tipo is None:
                logger.warning(
                    'No se archivó liquidacion %s: TipoDocumento '
                    'LIQUIDACION_SC no existe en este tenant.',
                    self.pk,
                )
                return

            # Resolver proceso (Area). Tomar el primero disponible — el
            # call site real puede inyectar uno específico via param.
            proceso = self._resolver_proceso_archivado()
            if proceso is None:
                logger.warning(
                    'No se archivó liquidacion %s: no hay procesos (Area) '
                    'definidos en este tenant.',
                    self.pk,
                )
                return

            doc = DocumentoService.archivar_registro(
                pdf_file=None,  # documento-vivo: PDF on-demand
                tipo_codigo='LIQUIDACION_SC',
                proceso=proceso,
                usuario=user,
                modulo_origen='supply_chain',
                referencia=self,
                titulo=f'Liquidación {self.codigo}',
                resumen=(
                    f'Liquidación {self.codigo} confirmada por '
                    f'{user.get_full_name() if hasattr(user, "get_full_name") else user}.'
                ),
            )
            self.documento_archivado_id = doc.id
            self.save(update_fields=['documento_archivado_id', 'updated_at'])
        except Exception as exc:
            logger.warning(
                'No se pudo archivar liquidacion %s en GD: %s',
                self.pk,
                exc,
                exc_info=True,
            )

    @staticmethod
    def _resolver_proceso_archivado():
        """
        Busca un proceso (Area) razonable para archivar la liquidación.
        Heurística: primer Area con código que contenga 'SC' o 'COMPRA',
        o fallback al primer Area existente.
        """
        try:
            from django.apps import apps as django_apps

            Area = django_apps.get_model('organizacion', 'Area')
            preferida = (
                Area.objects.filter(
                    models.Q(code__icontains='SC')
                    | models.Q(code__icontains='COMPRA')
                )
                .first()
            )
            if preferida is not None:
                return preferida
            return Area.objects.first()
        except Exception:
            return None

    # ─── Detalle por productor (H-SC-RUTA-03) ──────────────────────────
    @property
    def detalle_por_productor(self):
        """
        Para modalidad RECOLECCION agrupa kg por productor desde la M2M
        voucher.vouchers_recoleccion.

        Retorna None si la recepción no tiene vouchers de recolección
        (modalidades DIRECTO / TRANSPORTE_INTERNO).

        Estructura de salida:
            [
                {
                    'proveedor_id': int,
                    'proveedor_nombre': str,
                    'kg': Decimal,
                    'voucher_recoleccion_ids': [int, ...],
                },
                ...
            ]
        """
        from collections import defaultdict

        voucher = self.voucher
        if voucher is None:
            return None
        # Lazy: solo entra si hay vouchers de recolección asociados.
        if not voucher.vouchers_recoleccion.exists():
            return None

        agg = defaultdict(
            lambda: {
                'kg': Decimal('0'),
                'voucher_recoleccion_ids': [],
                'proveedor_nombre': '',
            }
        )
        qs = voucher.vouchers_recoleccion.select_related('proveedor').all()
        for vrc in qs:
            entry = agg[vrc.proveedor_id]
            entry['kg'] += getattr(vrc, 'cantidad', None) or Decimal('0')
            entry['voucher_recoleccion_ids'].append(vrc.id)
            if vrc.proveedor is not None:
                entry['proveedor_nombre'] = (
                    getattr(vrc.proveedor, 'razon_social', '')
                    or getattr(vrc.proveedor, 'nombre_comercial', '')
                    or ''
                )

        return [
            {'proveedor_id': pid, **data} for pid, data in agg.items()
        ]

    # ─── Factory ───────────────────────────────────────────────────────
    @classmethod
    def desde_voucher(cls, voucher, observaciones=''):
        """
        Factory idempotente: crea una Liquidacion con N líneas de detalle
        a partir de un VoucherRecepcion aprobado. Una línea de liquidación
        por cada VoucherLineaMP.

        Se crea en estado SUGERIDA (H-SC-02). Cada línea guarda el
        precio vigente como `precio_kg_sugerido` (snapshot inmutable).

        Si ya existe liquidación para este voucher, la retorna sin cambios.
        """
        existente = cls.objects.filter(voucher=voucher).first()
        if existente is not None:
            return existente

        from apps.supply_chain.gestion_proveedores.models import (
            PrecioMateriaPrima,
        )

        with transaction.atomic():
            liq = cls(
                voucher=voucher,
                observaciones=observaciones,
                estado=EstadoLiquidacion.SUGERIDA,
            )
            liq.numero = cls.objects.count() + 1
            liq.codigo = f'LIQ-{liq.numero:04d}'
            liq.save()

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
                    precio_kg_sugerido=precio_kg,
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
        decimal_places=1,
        verbose_name='Cantidad',
        help_text='Peso neto de la línea del voucher (kg, 1 decimal).',
    )
    precio_unitario = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name='Precio unitario',
        help_text='Precio por kg del producto para este proveedor.',
    )
    precio_kg_sugerido = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio kg sugerido (snapshot)',
        help_text='Snapshot del precio vigente al crear. Inmutable.',
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


# ══════════════════════════════════════════════════════════════════════
# Historial de ajustes (H-SC-02) — append-only.
# ══════════════════════════════════════════════════════════════════════


class HistorialAjusteLiquidacion(TenantModel):
    """
    Registro append-only de cualquier ajuste hecho a una Liquidación o
    una de sus líneas (precio, calidad, cantidad). Garantiza trazabilidad
    auditable: por qué cambió el monto final desde el snapshot SUGERIDA.

    Reglas:
    - Update bloqueado a nivel modelo (raise IntegrityError).
    - Delete bloqueado a nivel modelo (raise IntegrityError).
    - Soft delete del TenantModel sigue funcionando para tooling de admin
      pero `delete()` directo está bloqueado.
    """

    class TipoAjuste(models.TextChoices):
        PRECIO = 'PRECIO', 'Precio'
        CALIDAD = 'CALIDAD', 'Ajuste de calidad'
        CANTIDAD = 'CANTIDAD', 'Cantidad'

    class Origen(models.TextChoices):
        QC = 'QC', 'Control de calidad'
        MANUAL = 'MANUAL', 'Manual'
        CORRECCION = 'CORRECCION', 'Corrección de error'

    liquidacion = models.ForeignKey(
        Liquidacion,
        on_delete=models.PROTECT,
        related_name='historial_ajustes',
        verbose_name='Liquidación',
    )
    linea = models.ForeignKey(
        LiquidacionLinea,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='historial_ajustes',
        verbose_name='Línea',
    )
    tipo_ajuste = models.CharField(
        max_length=20,
        choices=TipoAjuste.choices,
        verbose_name='Tipo de ajuste',
    )
    valor_anterior = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        verbose_name='Valor anterior',
    )
    valor_nuevo = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        verbose_name='Valor nuevo',
    )
    motivo = models.TextField(verbose_name='Motivo')
    origen = models.CharField(
        max_length=20,
        choices=Origen.choices,
        default=Origen.MANUAL,
        verbose_name='Origen',
    )
    modificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ajustes_liquidacion',
        verbose_name='Modificado por',
    )

    class Meta:
        db_table = 'supply_chain_liquidacion_historial_ajuste'
        verbose_name = 'Historial de ajuste de liquidación'
        verbose_name_plural = 'Historial de ajustes de liquidación'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['liquidacion', '-created_at']),
            models.Index(fields=['linea', '-created_at']),
        ]

    def __str__(self):
        return (
            f'{self.get_tipo_ajuste_display()} en liquidación '
            f'{self.liquidacion_id}: {self.valor_anterior} → {self.valor_nuevo}'
        )

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise IntegrityError(
                'HistorialAjusteLiquidacion es append-only: no se puede '
                'actualizar un registro existente.'
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise IntegrityError(
            'HistorialAjusteLiquidacion es append-only: no se puede '
            'eliminar un registro.'
        )


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
            estados_pagables = {
                EstadoLiquidacion.CONFIRMADA,
                EstadoLiquidacion.PAGADA,
                # Backward-compat
                EstadoLiquidacion.APROBADA,
            }
            if self.liquidacion.estado not in estados_pagables:
                raise ValidationError(
                    'Solo se pueden pagar liquidaciones CONFIRMADAS.'
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        with transaction.atomic():
            super().save(*args, **kwargs)
            if self.liquidacion.estado != EstadoLiquidacion.PAGADA:
                self.liquidacion.estado = EstadoLiquidacion.PAGADA
                self.liquidacion.save(update_fields=['estado', 'updated_at'])


# ══════════════════════════════════════════════════════════════════════
# H-SC-06 — Liquidación periódica por proveedor (upstream, preservado).
# ══════════════════════════════════════════════════════════════════════


class LiquidacionPeriodica(TenantModel):
    """Agrupa liquidaciones individuales por período + proveedor.

    Caso de uso (H-SC-06): proveedores con `frecuencia_pago` SEMANAL,
    QUINCENAL o MENSUAL acumulan N Liquidaciones APROBADAS del período.
    Una task Celery (lunes 06:00) crea/actualiza el agregado en estado
    BORRADOR para revisión humana antes de pagar.
    """

    class Estado(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        CONFIRMADA = 'CONFIRMADA', 'Confirmada'
        PAGADA = 'PAGADA', 'Pagada'

    proveedor = models.ForeignKey(
        'infra_catalogo_productos.Proveedor',
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
