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
from django.db import models, transaction
from django.db.models import Q

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
    # H-SC-RUTA-02 (2026-04-26): proveedor es OPCIONAL cuando la modalidad
    # es RECOLECCION (la mercancía viene de la RUTA, no de un proveedor
    # único). En modalidades DIRECTO o TRANSPORTE_INTERNO sigue siendo
    # obligatorio. Validación condicional en clean().
    proveedor = models.ForeignKey(
        'catalogo_productos.Proveedor',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='vouchers_recepcion',
        verbose_name='Proveedor',
        help_text=(
            'Proveedor que entrega. OPCIONAL en modalidad RECOLECCION '
            '(la fuente es la ruta + sus vouchers de recolección).'
        ),
    )

    # ─── Logística entrega ─────────────────────────────────────────────
    modalidad_entrega = models.CharField(
        max_length=20,
        choices=ModalidadEntrega.choices,
        verbose_name='Modalidad de entrega',
    )
    ruta_recoleccion = models.ForeignKey(
        'catalogos.RutaRecoleccion',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='vouchers_recepcion',
        verbose_name='Ruta de recolección',
        help_text=(
            'Ruta de recolección usada para traer la materia prima. '
            'Obligatorio cuando modalidad_entrega=RECOLECCION.'
        ),
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

    # ─── Conexión con VoucherRecoleccion (H-SC-RUTA-02 — D-1 / refactor 2) ──
    # Cuando este voucher de recepción viene de una salida de ruta, se
    # vinculan los N VoucherRecoleccion (uno por cada parada visitada).
    # El inventario YA ENTRÓ con esta recepción — los vouchers de recolección
    # son evidencia/detalle para liquidar cada productor por separado.
    #
    # Cambió de FK simple a M2M en refactor 2 (1 voucher = 1 parada). La
    # asociación es N:1 en el otro sentido: 1 recepción consolidada ↔ N
    # vouchers de recolección.
    #
    # D-2 (Commit 17): la liquidación NO debe correr si CUALQUIER voucher
    # asociado está en BORRADOR.
    vouchers_recoleccion = models.ManyToManyField(
        'sc_recoleccion.VoucherRecoleccion',
        blank=True,
        related_name='recepciones_consolidadas',
        verbose_name='Vouchers de recolección asociados',
        help_text=(
            'N vouchers de recolección (uno por parada visitada) que se '
            'consolidaron en esta recepción.'
        ),
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
        origen = (
            self.proveedor and self.proveedor.nombre_comercial
        ) or (self.ruta_recoleccion and f"Ruta {self.ruta_recoleccion.codigo}") or '—'
        return f"Voucher #{self.pk} — {origen} ({self.peso_neto_total} kg)"

    def clean(self):
        super().clean()
        if self.modalidad_entrega == self.ModalidadEntrega.RECOLECCION:
            # En modalidad RECOLECCION, ruta es obligatoria; proveedor es opcional
            # (la fuente es la ruta + sus N vouchers de recolección).
            if not self.ruta_recoleccion:
                raise ValidationError({
                    'ruta_recoleccion': (
                        'Modalidad RECOLECCION requiere especificar una ruta.'
                    )
                })
        else:
            # En modalidades DIRECTO o TRANSPORTE_INTERNO, proveedor es obligatorio.
            if not self.proveedor_id:
                raise ValidationError({
                    'proveedor': (
                        f'Modalidad {self.get_modalidad_entrega_display()} '
                        'requiere especificar un proveedor.'
                    )
                })

    # ─── Properties QC (H-SC-03) ───────────────────────────────────────
    @property
    def requiere_qc(self) -> bool:
        """True si alguna línea del voucher requiere QC en recepción."""
        return self.lineas.filter(producto__requiere_qc_recepcion=True).exists()

    @property
    def tiene_qc_legacy(self) -> bool:
        """True si existe un RecepcionCalidad (OneToOne) asociado al voucher."""
        return hasattr(self, 'calidad') and self.calidad is not None

    @property
    def tiene_qc(self) -> bool:
        """
        True si el QC está completo para las líneas que lo requieren.

        Acepta tanto el legacy RecepcionCalidad (OneToOne) como las nuevas
        MedicionCalidad por línea (H-SC-11). Si ninguna línea requiere QC,
        retorna True (nada que validar).
        """
        if self.tiene_qc_legacy:
            return True
        lineas_req = self.lineas.filter(producto__requiere_qc_recepcion=True)
        if not lineas_req.exists():
            return True
        lineas_con_medicion = lineas_req.filter(measurements__isnull=False).distinct()
        return lineas_con_medicion.count() == lineas_req.count()

    # ─── Agregados de líneas ───────────────────────────────────────────
    @property
    def peso_neto_total(self):
        """Suma de peso_neto_kg de todas las líneas."""
        return sum((l.peso_neto_kg for l in self.lineas.all()), Decimal('0.000'))

    # ─── Cálculo de merma (H-SC-04) ────────────────────────────────────
    @property
    def peso_total_recolectado(self):
        """Suma kg de vouchers de recolección asociados (modalidad RECOLECCION)."""
        if not self.vouchers_recoleccion.exists():
            return None
        return sum(
            (v.cantidad or Decimal('0')) for v in self.vouchers_recoleccion.all()
        )

    @property
    def peso_total_recibido(self):
        """Suma peso_neto de las líneas del voucher."""
        return sum(
            (l.peso_neto_kg or Decimal('0')) for l in self.lineas.all()
        )

    @property
    def merma_kg(self):
        """Diferencia entre kg recolectados y kg recibidos. None si no aplica."""
        pt = self.peso_total_recolectado
        if pt is None or pt == 0:
            return None
        return pt - self.peso_total_recibido

    @property
    def merma_porcentaje(self):
        """% de merma sobre el total recolectado."""
        pt = self.peso_total_recolectado
        if pt is None or pt == 0:
            return None
        merma = self.merma_kg
        return (merma / pt * Decimal('100')).quantize(Decimal('0.01'))

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
        # H-SC-03: si hay QC legacy con resultado RECHAZADO, no se puede aprobar
        # (solo aplica al flujo RecepcionCalidad OneToOne; las mediciones por
        # línea H-SC-11 no tienen estado de rechazo explícito)
        if self.tiene_qc_legacy and self.calidad.resultado == 'RECHAZADO':
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


# ══════════════════════════════════════════════════════════════════════
# QC CONFIGURABLE POR TENANT (H-SC-11 Fase 1)
# ══════════════════════════════════════════════════════════════════════
#
# Modelos de QC configurable por línea de voucher:
#   - ParametroCalidad: parámetro medible (Acidez, Humedad, pH, etc.)
#   - RangoCalidad: clasificación configurable del valor medido
#     (Tipo A, Tipo B, Tipo C según rangos numéricos).
#   - MedicionCalidad: medición concreta en una VoucherLineaMP.
#
# Reemplaza conceptualmente a RecepcionCalidad (OneToOne a voucher),
# que queda DEPRECATED pero intacto hasta que H-SC-12 migre el dominio.
# ══════════════════════════════════════════════════════════════════════


class ParametroCalidad(TenantModel):
    """
    Parámetro de calidad configurable por tenant
    (Acidez, Humedad, pH, Temperatura, etc.).

    Cada tenant define los parámetros que mide en sus recepciones, así
    como sus rangos asociados (ver RangoCalidad).
    """

    code = models.CharField(
        max_length=50, db_index=True, verbose_name='Código'
    )
    name = models.CharField(max_length=100, verbose_name='Nombre')
    description = models.TextField(
        blank=True, default='', verbose_name='Descripción'
    )
    unit = models.CharField(
        max_length=20,
        verbose_name='Unidad',
        help_text='Ej: %, °C, pH, ppm, g/L',
    )
    decimals = models.PositiveSmallIntegerField(
        default=2, verbose_name='Decimales'
    )
    is_active = models.BooleanField(default=True, db_index=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'supply_chain_parametro_calidad'
        verbose_name = 'Parámetro de Calidad'
        verbose_name_plural = 'Parámetros de Calidad'
        ordering = ['order', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['code'],
                condition=Q(is_deleted=False),
                name='uq_parametro_calidad_code_active',
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.unit})"


class RangoCalidad(TenantModel):
    """
    Rango que clasifica mediciones de un ParametroCalidad en una
    categoría (ej. Tipo A, Tipo B, Tipo C).

    El sistema auto-clasifica la MP recibida según el valor medido caiga
    dentro de un rango [min_value, max_value]. max_value=NULL significa
    "sin límite superior".
    """

    parameter = models.ForeignKey(
        ParametroCalidad,
        on_delete=models.CASCADE,
        related_name='ranges',
        verbose_name='Parámetro',
    )
    code = models.CharField(
        max_length=30,
        db_index=True,
        verbose_name='Código',
        help_text='Ej: TIPO_A, TIPO_B, TIPO_C',
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Ej: Tipo A, Tipo B, Tipo B-II',
    )
    min_value = models.DecimalField(
        max_digits=10, decimal_places=4, verbose_name='Valor mínimo'
    )
    max_value = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Valor máximo',
        help_text='Null = sin límite superior',
    )
    color_hex = models.CharField(
        max_length=7, default='#6B7280', verbose_name='Color'
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'supply_chain_rango_calidad'
        verbose_name = 'Rango de Calidad'
        verbose_name_plural = 'Rangos de Calidad'
        ordering = ['parameter', 'order']

    def __str__(self):
        top = self.max_value if self.max_value is not None else '∞'
        return f"{self.parameter.code}:{self.code} [{self.min_value}, {top}]"


class MedicionCalidad(TenantModel):
    """
    Medición de un parámetro en una línea de voucher (por producto MP).

    Se clasifica automáticamente en un RangoCalidad al guardar, buscando
    el primer rango activo del parámetro donde cae el valor medido.
    """

    voucher_line = models.ForeignKey(
        'sc_recepcion.VoucherLineaMP',
        on_delete=models.CASCADE,
        related_name='measurements',
        verbose_name='Línea del voucher',
    )
    parameter = models.ForeignKey(
        ParametroCalidad,
        on_delete=models.PROTECT,
        related_name='measurements',
        verbose_name='Parámetro',
    )
    measured_value = models.DecimalField(
        max_digits=12, decimal_places=4, verbose_name='Valor medido'
    )
    classified_range = models.ForeignKey(
        RangoCalidad,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='measurements',
        verbose_name='Rango clasificado',
        help_text='Auto-calculado al guardar',
    )
    measured_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Fecha medición'
    )
    measured_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='measurements',
        verbose_name='Medido por',
    )
    observations = models.TextField(
        blank=True, default='', verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'supply_chain_medicion_calidad'
        verbose_name = 'Medición de Calidad'
        verbose_name_plural = 'Mediciones de Calidad'
        ordering = ['-measured_at']
        constraints = [
            models.UniqueConstraint(
                fields=['voucher_line', 'parameter'],
                condition=Q(is_deleted=False),
                name='uq_medicion_linea_parametro_active',
            ),
        ]

    def __str__(self):
        return (
            f"{self.parameter.code}={self.measured_value} "
            f"(línea #{self.voucher_line_id})"
        )

    @transaction.atomic
    def save(self, *args, **kwargs):
        # Auto-clasificar: buscar el rango activo del parámetro donde
        # cae el valor medido. Los rangos se evalúan en orden ascendente
        # y se toma el primero que contenga el valor.
        if self.parameter_id and self.measured_value is not None:
            ranges = self.parameter.ranges.filter(
                is_active=True, is_deleted=False
            ).order_by('order')
            matched = None
            for r in ranges:
                in_range = self.measured_value >= r.min_value and (
                    r.max_value is None
                    or self.measured_value <= r.max_value
                )
                if in_range:
                    matched = r
                    break
            self.classified_range = matched
        super().save(*args, **kwargs)
