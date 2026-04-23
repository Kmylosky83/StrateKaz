"""
Modelos para Recepción de Materia Prima — Supply Chain S3

Sesión 3 del Roadmap Supply Chain (scale-based procurement / acopio).
Ver: docs/03-modulos/supply-chain/ROADMAP.md

VoucherRecepcion es el documento primario de ingreso de MP (header).
VoucherLineaMP son las líneas de materia prima del voucher (N productos).
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
    Documento primario de recepción de materia prima (header).

    Registro generado al momento del pesaje en báscula. Puede contener
    N líneas de materia prima (VoucherLineaMP). El precio se obtiene de
    PrecioMateriaPrima al momento de crear la Liquidacion (una por línea).

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
            models.Index(fields=['estado', '-created_at']),
            models.Index(fields=['fecha_viaje']),
            models.Index(fields=['almacen_destino']),
        ]

    def __str__(self):
        return f"Voucher #{self.pk} — {self.proveedor} ({self.peso_neto_total} kg)"

    def clean(self):
        super().clean()
        if (
            self.modalidad_entrega == self.ModalidadEntrega.RECOLECCION
            and not self.uneg_transportista
        ):
            raise ValidationError({
                'uneg_transportista': (
                    'Modalidad RECOLECCION requiere especificar UNeg transportista.'
                )
            })

    # ─── Properties QC (H-SC-03) ───────────────────────────────────────
    @property
    def requiere_qc(self) -> bool:
        """True si alguna línea del voucher requiere QC en recepción."""
        return self.lineas.filter(producto__requiere_qc_recepcion=True).exists()

    @property
    def tiene_qc(self) -> bool:
        """True si ya existe un RecepcionCalidad asociado al voucher."""
        return hasattr(self, 'calidad') and self.calidad is not None

    # ─── Agregados de líneas ───────────────────────────────────────────
    @property
    def peso_neto_total(self):
        """Suma de peso_neto_kg de todas las líneas."""
        return sum((l.peso_neto_kg for l in self.lineas.all()), Decimal('0.000'))

    # ─── Transiciones de estado ────────────────────────────────────────
    def aprobar(self):
        """
        Transiciona el voucher a APROBADO.

        Idempotente: si ya está APROBADO no hace nada.
        Dispara el signal post_save que crea MovimientoInventario + Inventario
        por cada línea en almacen_destino (ver apps.supply_chain.recepcion.signals).

        H-SC-03: Bloquea la aprobación si alguna línea tiene un producto con
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
        if not self.lineas.exists():
            raise ValidationError(
                "El voucher debe tener al menos una línea de materia prima."
            )
        # H-SC-03: validación bloqueante de QC obligatorio
        if self.requiere_qc and not self.tiene_qc:
            raise ValidationError(
                "Este voucher tiene productos que requieren control de calidad. "
                "Registre el RecepcionCalidad antes de aprobar el voucher."
            )
        # H-SC-03: si hay QC con resultado RECHAZADO, no se puede aprobar
        if self.tiene_qc and self.calidad.resultado == 'RECHAZADO':
            raise ValidationError(
                "El control de calidad fue RECHAZADO. No se puede aprobar "
                "el voucher — use la transición rechazar() si corresponde."
            )
        self.estado = self.EstadoVoucher.APROBADO
        self.save(update_fields=['estado', 'updated_at'])


class VoucherLineaMP(TenantModel):
    """
    Línea de materia prima en un VoucherRecepcion.
    Un voucher puede tener N líneas (N productos del mismo proveedor).
    """
    voucher = models.ForeignKey(
        VoucherRecepcion,
        on_delete=models.CASCADE,
        related_name='lineas',
        verbose_name='Voucher de recepción',
    )
    producto = models.ForeignKey(
        'catalogo_productos.Producto',
        on_delete=models.PROTECT,
        related_name='lineas_voucher',
        verbose_name='Producto',
    )
    peso_bruto_kg = models.DecimalField(
        max_digits=12, decimal_places=3, verbose_name='Peso bruto (kg)'
    )
    peso_tara_kg = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal('0.000'),
        verbose_name='Peso tara (kg)'
    )
    peso_neto_kg = models.DecimalField(
        max_digits=12, decimal_places=3, editable=False,
        verbose_name='Peso neto (kg)',
    )

    class Meta:
        db_table = 'supply_chain_voucher_linea_mp'
        verbose_name = 'Línea de MP en Voucher'
        verbose_name_plural = 'Líneas de MP en Voucher'
        ordering = ['id']

    def __str__(self):
        return f"Línea #{self.pk} — {self.producto} ({self.peso_neto_kg} kg)"

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
        if (self.peso_bruto_kg is not None and self.peso_tara_kg is not None
                and self.peso_tara_kg > self.peso_bruto_kg):
            raise ValidationError({'peso_tara_kg': 'La tara no puede ser mayor que el bruto.'})


class RecepcionCalidad(TenantModel):
    """
    Resultado de control de calidad aplicado a un VoucherRecepcion.

    Opcional: solo se crea si el tenant/producto aplica QC en recepción.
    Los parámetros medidos se comparan contra ProductoEspecCalidad
    (extensión creada en S2), cuyo snapshot se guarda en JSON.

    DEUDA: OneToOne a nivel voucher (header). Pendiente de refactorizar
    a nivel línea cuando la UI soporte QC por línea de MP.
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
