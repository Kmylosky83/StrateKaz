"""
Modelos para Recepción de Materia Prima — Supply Chain S3

Sesión 3 del Roadmap Supply Chain (scale-based procurement / acopio).
Ver: docs/03-modulos/supply-chain/ROADMAP.md

VoucherRecepcion es el documento primario de ingreso de MP.
RecepcionCalidad es el resultado opcional de QC aplicado al lote recibido.

OC es nullable en VoucherRecepcion sin validación restrictiva — el uso
se gobierna por UI/proceso de negocio, no por modelo.
"""
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from utils.models import TenantModel


class VoucherRecepcion(TenantModel):
    """
    Documento primario de recepción de materia prima.

    Registro generado al momento del pesaje en báscula. Inmutable después
    de aprobado: el `precio_kg_snapshot` congela el precio vigente del
    proveedor al momento de la recepción, garantizando que liquidaciones
    posteriores usen ese valor aunque el precio maestro cambie.

    Relación con OC: `orden_compra` es FK nullable sin validación rígida.
    Hoy MP típicamente no usa OC (acopio directo), pero el modelo soporta
    el caso con OC (ej: contratos de suministro a futuro) sin migración.
    """

    class ModalidadEntrega(models.TextChoices):
        DIRECTO = 'DIRECTO', 'Entrega directa del proveedor'
        TRANSPORTE_INTERNO = 'TRANSPORTE_INTERNO', 'Transporte interno de la empresa'
        RECOLECCION = 'RECOLECCION', 'Recolección en punto por la empresa'

    class EstadoVoucher(models.TextChoices):
        PENDIENTE_QC = 'PENDIENTE_QC', 'Pendiente de control de calidad'
        APROBADO = 'APROBADO', 'Aprobado — listo para liquidar'
        RECHAZADO = 'RECHAZADO', 'Rechazado — no se recibe'
        LIQUIDADO = 'LIQUIDADO', 'Liquidado'

    # ─── Partes ────────────────────────────────────────────────────────
    proveedor = models.ForeignKey(
        'catalogo_productos.Proveedor',
        on_delete=models.PROTECT,
        related_name='vouchers_recepcion',
        verbose_name='Proveedor',
        help_text='Proveedor que recibe la liquidación',
    )
    producto = models.ForeignKey(
        'catalogo_productos.Producto',
        on_delete=models.PROTECT,
        related_name='vouchers_recepcion',
        verbose_name='Producto',
        help_text='Materia prima recibida (catálogo maestro)',
    )

    # ─── Logística entrega ─────────────────────────────────────────────
    modalidad_entrega = models.CharField(
        max_length=20,
        choices=ModalidadEntrega.choices,
        verbose_name='Modalidad de entrega',
    )
    uneg_transportista = models.ForeignKey(
        'configuracion.SedeEmpresa',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='vouchers_transportados',
        verbose_name='UNeg transportista',
        help_text='Unidad de negocio que trajo el producto (si aplica)',
    )
    fecha_viaje = models.DateField(
        verbose_name='Fecha del viaje / entrega',
    )

    # ─── OC (opcional, no restrictivo) ─────────────────────────────────
    orden_compra = models.ForeignKey(
        'compras.OrdenCompra',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='vouchers_recepcion',
        verbose_name='Orden de compra',
        help_text='Opcional: típicamente MP no usa OC. Sin validación a nivel modelo.',
    )

    # ─── Pesaje ────────────────────────────────────────────────────────
    peso_bruto_kg = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Peso bruto (kg)',
        help_text='Peso total incluyendo embalaje / vehículo',
    )
    peso_tara_kg = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=Decimal('0.000'),
        verbose_name='Peso tara (kg)',
        help_text='Peso del embalaje / vehículo vacío',
    )
    peso_neto_kg = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        editable=False,
        verbose_name='Peso neto (kg)',
        help_text='Calculado = bruto − tara',
    )

    # ─── Precio (snapshot inmutable) ───────────────────────────────────
    precio_kg_snapshot = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio por kg (snapshot)',
        help_text=(
            'Copia inmutable de PrecioMateriaPrima.precio_kg al momento de '
            'crear el voucher. Garantiza que liquidaciones no se alteren '
            'si el precio maestro cambia.'
        ),
    )

    # ─── Destino inventario ────────────────────────────────────────────
    almacen_destino = models.ForeignKey(
        'catalogos.Almacen',
        on_delete=models.PROTECT,
        related_name='vouchers_recepcion',
        verbose_name='Almacén destino',
    )

    # ─── Operación ─────────────────────────────────────────────────────
    operador_bascula = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='vouchers_operados',
        verbose_name='Operador de báscula',
    )

    # ─── Estado ────────────────────────────────────────────────────────
    estado = models.CharField(
        max_length=20,
        choices=EstadoVoucher.choices,
        default=EstadoVoucher.PENDIENTE_QC,
        db_index=True,
        verbose_name='Estado',
    )

    observaciones = models.TextField(
        blank=True,
        default='',
        verbose_name='Observaciones',
    )

    class Meta:
        db_table = 'supply_chain_voucher_recepcion'
        verbose_name = 'Voucher de Recepción'
        verbose_name_plural = 'Vouchers de Recepción'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['proveedor', '-created_at']),
            models.Index(fields=['producto', '-created_at']),
            models.Index(fields=['estado', '-created_at']),
            models.Index(fields=['fecha_viaje']),
            models.Index(fields=['almacen_destino']),
        ]

    def __str__(self):
        return f"Voucher #{self.pk} — {self.proveedor} / {self.producto} ({self.peso_neto_kg} kg)"

    # ─── Cálculos ──────────────────────────────────────────────────────
    def calcular_peso_neto(self):
        bruto = Decimal(str(self.peso_bruto_kg or 0))
        tara = Decimal(str(self.peso_tara_kg or 0))
        self.peso_neto_kg = bruto - tara

    def save(self, *args, **kwargs):
        self.calcular_peso_neto()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if self.peso_bruto_kg is not None and self.peso_bruto_kg <= 0:
            raise ValidationError({'peso_bruto_kg': 'El peso bruto debe ser mayor a cero.'})
        if self.peso_tara_kg is not None and self.peso_tara_kg < 0:
            raise ValidationError({'peso_tara_kg': 'El peso tara no puede ser negativo.'})
        if (
            self.peso_bruto_kg is not None
            and self.peso_tara_kg is not None
            and self.peso_tara_kg > self.peso_bruto_kg
        ):
            raise ValidationError({'peso_tara_kg': 'La tara no puede ser mayor que el bruto.'})
        if self.precio_kg_snapshot is not None and self.precio_kg_snapshot < 0:
            raise ValidationError({'precio_kg_snapshot': 'El precio no puede ser negativo.'})
        if (
            self.modalidad_entrega == self.ModalidadEntrega.RECOLECCION
            and not self.uneg_transportista
        ):
            raise ValidationError({
                'uneg_transportista': (
                    'Modalidad RECOLECCION requiere especificar UNeg transportista.'
                )
            })

    @property
    def valor_total_estimado(self):
        """Cálculo preliminar. El valor real se congela en Liquidacion."""
        if self.peso_neto_kg is None or self.precio_kg_snapshot is None:
            return Decimal('0.00')
        return (Decimal(str(self.peso_neto_kg)) * Decimal(str(self.precio_kg_snapshot))).quantize(
            Decimal('0.01')
        )

    # ─── Properties QC (H-SC-03) ───────────────────────────────────────
    @property
    def requiere_qc(self) -> bool:
        """True si el producto de este voucher requiere QC en recepción."""
        return bool(
            self.producto_id and getattr(self.producto, 'requiere_qc_recepcion', False)
        )

    @property
    def tiene_qc(self) -> bool:
        """True si ya existe un RecepcionCalidad asociado al voucher."""
        return hasattr(self, 'calidad') and self.calidad is not None

    # ─── Transiciones de estado ────────────────────────────────────────
    def aprobar(self):
        """
        Transiciona el voucher a APROBADO.

        Idempotente: si ya está APROBADO no hace nada.
        Dispara el signal post_save que crea MovimientoInventario + Inventario
        en almacen_destino (ver apps.supply_chain.recepcion.signals).

        H-SC-03: Bloquea la aprobación si el producto tiene
        `requiere_qc_recepcion=True` y aún no existe RecepcionCalidad.
        El QC debe ser registrado antes mediante el endpoint dedicado
        `POST /api/supply-chain/vouchers/{id}/registrar-qc/`.
        """
        if self.estado == self.EstadoVoucher.APROBADO:
            return
        if self.estado != self.EstadoVoucher.PENDIENTE_QC:
            raise ValidationError(
                f"No se puede aprobar un voucher en estado "
                f"{self.get_estado_display()}."
            )
        # H-SC-03: validación bloqueante de QC obligatorio
        if self.requiere_qc and not self.tiene_qc:
            raise ValidationError(
                "Este producto requiere control de calidad en recepción. "
                "Registre el RecepcionCalidad antes de aprobar el voucher."
            )
        # H-SC-03: si hay QC con resultado RECHAZADO, no se puede aprobar
        if (
            self.tiene_qc
            and self.calidad.resultado == 'RECHAZADO'
        ):
            raise ValidationError(
                "El control de calidad fue RECHAZADO. No se puede aprobar "
                "el voucher — use la transición rechazar() si corresponde."
            )
        self.estado = self.EstadoVoucher.APROBADO
        self.save(update_fields=['estado', 'updated_at'])


class RecepcionCalidad(TenantModel):
    """
    Resultado de control de calidad aplicado a un VoucherRecepcion.

    Opcional: solo se crea si el tenant/producto aplica QC en recepción.
    Los parámetros medidos se comparan contra ProductoEspecCalidad
    (extensión creada en S2), cuyo snapshot se guarda en JSON.
    """

    class ResultadoQC(models.TextChoices):
        APROBADO = 'APROBADO', 'Aprobado sin ajustes'
        CONDICIONAL = 'CONDICIONAL', 'Aprobado con ajuste de precio'
        RECHAZADO = 'RECHAZADO', 'Rechazado — no se recibe'

    voucher = models.OneToOneField(
        VoucherRecepcion,
        on_delete=models.CASCADE,
        related_name='calidad',
        verbose_name='Voucher de recepción',
    )
    parametros_medidos = models.JSONField(
        verbose_name='Parámetros medidos',
        help_text=(
            'Snapshot de ProductoEspecCalidad + valores reales del lote. '
            'Estructura: {"humedad": {"rango": [0, 12], "medido": 10.5}, ...}'
        ),
    )
    resultado = models.CharField(
        max_length=20,
        choices=ResultadoQC.choices,
        verbose_name='Resultado',
    )
    analista = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='analisis_calidad_recepcion',
        verbose_name='Analista',
    )
    fecha_analisis = models.DateTimeField(
        verbose_name='Fecha de análisis',
    )
    observaciones = models.TextField(
        blank=True,
        default='',
        verbose_name='Observaciones',
    )

    class Meta:
        db_table = 'supply_chain_recepcion_calidad'
        verbose_name = 'Calidad de Recepción'
        verbose_name_plural = 'Calidades de Recepción'
        ordering = ['-fecha_analisis']
        indexes = [
            models.Index(fields=['voucher']),
            models.Index(fields=['resultado', '-fecha_analisis']),
            models.Index(fields=['analista']),
        ]

    def __str__(self):
        return f"QC Voucher #{self.voucher_id} — {self.get_resultado_display()}"
