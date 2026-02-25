"""
Modelos para Tesorería - Admin Finance
Sistema de Gestión StrateKaz

Gestiona:
- Bancos y cuentas bancarias de la empresa
- Cuentas por pagar (proveedores, nómina)
- Cuentas por cobrar (clientes, facturas)
- Flujo de caja proyectado y real
- Pagos realizados
- Recaudos recibidos

100% DINÁMICO: Integrado con otros módulos del sistema.

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from decimal import Decimal

from apps.core.base_models.base import BaseCompanyModel


# ==============================================================================
# OPCIONES Y CONSTANTES
# ==============================================================================

TIPO_CUENTA_BANCARIA_CHOICES = [
    ('ahorros', 'Ahorros'),
    ('corriente', 'Corriente'),
    ('fiducia', 'Fiducia'),
    ('credito', 'Crédito'),
]

ESTADO_BANCO_CHOICES = [
    ('activo', 'Activo'),
    ('inactivo', 'Inactivo'),
    ('bloqueado', 'Bloqueado'),
]

ESTADO_CUENTA_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('parcial', 'Pago/Cobro Parcial'),
    ('pagada', 'Pagada/Cobrada'),
    ('vencida', 'Vencida'),
    ('anulada', 'Anulada'),
]

TIPO_FLUJO_CHOICES = [
    ('ingreso', 'Ingreso'),
    ('egreso', 'Egreso'),
]

METODO_PAGO_CHOICES = [
    ('efectivo', 'Efectivo'),
    ('transferencia', 'Transferencia Bancaria'),
    ('cheque', 'Cheque'),
    ('tarjeta_credito', 'Tarjeta de Crédito'),
    ('tarjeta_debito', 'Tarjeta de Débito'),
    ('consignacion', 'Consignación'),
]


# ==============================================================================
# MODELO: BANCO
# ==============================================================================

class Banco(BaseCompanyModel):
    """
    Banco - Cuentas bancarias de la empresa.

    Registra las cuentas bancarias de la empresa para gestión de tesorería.
    """

    # Información bancaria
    entidad_bancaria = models.CharField(
        max_length=100,
        verbose_name='Entidad Bancaria',
        help_text='Nombre del banco (ej: Bancolombia, Davivienda)'
    )
    tipo_cuenta = models.CharField(
        max_length=20,
        choices=TIPO_CUENTA_BANCARIA_CHOICES,
        verbose_name='Tipo de Cuenta',
        help_text='Tipo de cuenta bancaria'
    )
    numero_cuenta = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Número de Cuenta',
        help_text='Número de cuenta bancaria'
    )
    nombre_cuenta = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Cuenta',
        help_text='Nombre descriptivo de la cuenta'
    )

    # Saldos
    saldo_actual = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Saldo Actual',
        help_text='Saldo actual de la cuenta'
    )
    saldo_disponible = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Saldo Disponible',
        help_text='Saldo disponible (actual - comprometido)'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_BANCO_CHOICES,
        default='activo',
        verbose_name='Estado',
        help_text='Estado de la cuenta bancaria',
        db_index=True
    )

    # Información adicional
    sucursal = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Sucursal',
        help_text='Sucursal del banco'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='bancos_responsable',
        verbose_name='Responsable',
        help_text='Usuario responsable de la cuenta'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_banco'
        verbose_name = 'Banco'
        verbose_name_plural = 'Bancos'
        ordering = ['entidad_bancaria', 'numero_cuenta']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['numero_cuenta']),
        ]

    def __str__(self):
        return f"{self.entidad_bancaria} - {self.tipo_cuenta} {self.numero_cuenta}"

    @property
    def saldo_comprometido(self):
        """Calcula el saldo comprometido (pendiente de pago)."""
        return self.saldo_actual - self.saldo_disponible

    def actualizar_saldo(self, monto, tipo='ingreso'):
        """
        Actualiza el saldo de la cuenta.

        Args:
            monto: Monto a sumar (ingreso) o restar (egreso)
            tipo: 'ingreso' o 'egreso'
        """
        if tipo == 'ingreso':
            self.saldo_actual += Decimal(str(monto))
            self.saldo_disponible += Decimal(str(monto))
        else:  # egreso
            self.saldo_actual -= Decimal(str(monto))
            self.saldo_disponible -= Decimal(str(monto))

        self.save(update_fields=['saldo_actual', 'saldo_disponible', 'updated_at'])

    def clean(self):
        """Validaciones del modelo."""
        if self.saldo_disponible > self.saldo_actual:
            raise ValidationError({
                'saldo_disponible': 'El saldo disponible no puede ser mayor al saldo actual.'
            })


# ==============================================================================
# MODELO: CUENTA POR PAGAR
# ==============================================================================

class CuentaPorPagar(BaseCompanyModel):
    """
    Cuenta Por Pagar - Obligaciones pendientes de pago.

    Registra todas las obligaciones de pago de la empresa:
    - Facturas de proveedores
    - Órdenes de compra
    - Nómina
    - Otros pasivos
    """

    # Relaciones desacopladas (Sprint M1 — Modularización)
    # Origen: supply_chain.gestion_proveedores.Proveedor
    proveedor_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Proveedor',
        help_text='ID del proveedor al que se debe pagar (supply_chain.Proveedor)'
    )
    proveedor_nombre = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nombre Proveedor',
        help_text='Cache: razón social del proveedor'
    )
    # Origen: supply_chain.compras.OrdenCompra
    orden_compra_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Orden de Compra',
        help_text='ID de la orden de compra que origina el pago (supply_chain.OrdenCompra)'
    )
    orden_compra_codigo = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Código Orden de Compra',
        help_text='Cache: código de la orden de compra'
    )
    # Origen: talent_hub.nomina.LiquidacionNomina
    liquidacion_nomina_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Liquidación de Nómina',
        help_text='ID de la liquidación de nómina que origina el pago (talent_hub.LiquidacionNomina)'
    )
    liquidacion_nomina_codigo = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Código Liquidación',
        help_text='Cache: código de la liquidación de nómina'
    )

    # Información de la cuenta
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la cuenta (auto-generado: CPP-YYYY-####)'
    )
    concepto = models.CharField(
        max_length=255,
        verbose_name='Concepto',
        help_text='Descripción del concepto a pagar'
    )

    # Montos
    monto_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Monto Total',
        help_text='Monto total de la obligación'
    )
    monto_pagado = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Monto Pagado',
        help_text='Monto ya pagado'
    )

    # Fechas
    fecha_documento = models.DateField(
        verbose_name='Fecha del Documento',
        help_text='Fecha del documento que origina la obligación'
    )
    fecha_vencimiento = models.DateField(
        verbose_name='Fecha de Vencimiento',
        help_text='Fecha límite de pago',
        db_index=True
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CUENTA_CHOICES,
        default='pendiente',
        verbose_name='Estado',
        db_index=True
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_cuenta_por_pagar'
        verbose_name = 'Cuenta Por Pagar'
        verbose_name_plural = 'Cuentas Por Pagar'
        ordering = ['fecha_vencimiento', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['codigo']),
            models.Index(fields=['proveedor_id', 'estado']),
            models.Index(fields=['fecha_vencimiento']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.concepto}"

    @property
    def saldo_pendiente(self):
        """Calcula el saldo pendiente de pago."""
        return self.monto_total - self.monto_pagado

    @property
    def esta_vencida(self):
        """Verifica si la cuenta está vencida."""
        if self.estado in ['pagada', 'anulada']:
            return False
        return self.fecha_vencimiento < timezone.now().date()

    @property
    def dias_para_vencimiento(self):
        """Calcula días hasta/desde vencimiento (negativo = vencida)."""
        delta = self.fecha_vencimiento - timezone.now().date()
        return delta.days

    def save(self, *args, **kwargs):
        """Override para generación de código automático."""
        if not self.codigo:
            self.codigo = self._generar_codigo()

        # Actualizar estado según saldo
        if self.monto_pagado >= self.monto_total:
            self.estado = 'pagada'
        elif self.monto_pagado > 0:
            self.estado = 'parcial'
        elif self.esta_vencida and self.estado == 'pendiente':
            self.estado = 'vencida'

        super().save(*args, **kwargs)

    def _generar_codigo(self):
        """Genera código único: CPP-YYYY-####"""
        year = timezone.now().year
        ultimo = CuentaPorPagar.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'CPP-{year}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"CPP-{year}-{numero:04d}"

    def clean(self):
        """Validaciones del modelo."""
        if self.monto_pagado > self.monto_total:
            raise ValidationError({
                'monto_pagado': 'El monto pagado no puede ser mayor al monto total.'
            })

        if self.fecha_documento and self.fecha_vencimiento:
            if self.fecha_vencimiento < self.fecha_documento:
                raise ValidationError({
                    'fecha_vencimiento': 'La fecha de vencimiento debe ser posterior a la fecha del documento.'
                })


# ==============================================================================
# MODELO: CUENTA POR COBRAR
# ==============================================================================

class CuentaPorCobrar(BaseCompanyModel):
    """
    Cuenta Por Cobrar - Derechos de cobro pendientes.

    Registra todas las cuentas por cobrar de la empresa:
    - Facturas de clientes
    - Otros derechos de cobro
    """

    # Relaciones desacopladas (Sprint M1 — Modularización)
    # Origen: sales_crm.gestion_clientes.Cliente
    cliente_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Cliente',
        help_text='ID del cliente que debe pagar (sales_crm.Cliente)'
    )
    cliente_nombre = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nombre Cliente',
        help_text='Cache: razón social del cliente'
    )
    # Origen: sales_crm.pedidos_facturacion.Factura
    factura_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Factura',
        help_text='ID de la factura que origina el cobro (sales_crm.Factura)'
    )
    factura_codigo = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Código Factura',
        help_text='Cache: código/número de la factura'
    )

    # Información de la cuenta
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la cuenta (auto-generado: CPC-YYYY-####)'
    )
    concepto = models.CharField(
        max_length=255,
        verbose_name='Concepto',
        help_text='Descripción del concepto a cobrar'
    )

    # Montos
    monto_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Monto Total',
        help_text='Monto total del derecho de cobro'
    )
    monto_cobrado = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Monto Cobrado',
        help_text='Monto ya cobrado'
    )

    # Fechas
    fecha_documento = models.DateField(
        verbose_name='Fecha del Documento',
        help_text='Fecha del documento que origina el cobro'
    )
    fecha_vencimiento = models.DateField(
        verbose_name='Fecha de Vencimiento',
        help_text='Fecha límite de cobro',
        db_index=True
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CUENTA_CHOICES,
        default='pendiente',
        verbose_name='Estado',
        db_index=True
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_cuenta_por_cobrar'
        verbose_name = 'Cuenta Por Cobrar'
        verbose_name_plural = 'Cuentas Por Cobrar'
        ordering = ['fecha_vencimiento', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['codigo']),
            models.Index(fields=['cliente_id', 'estado']),
            models.Index(fields=['fecha_vencimiento']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.concepto}"

    @property
    def saldo_pendiente(self):
        """Calcula el saldo pendiente de cobro."""
        return self.monto_total - self.monto_cobrado

    @property
    def esta_vencida(self):
        """Verifica si la cuenta está vencida."""
        if self.estado in ['pagada', 'anulada']:
            return False
        return self.fecha_vencimiento < timezone.now().date()

    @property
    def dias_para_vencimiento(self):
        """Calcula días hasta/desde vencimiento (negativo = vencida)."""
        delta = self.fecha_vencimiento - timezone.now().date()
        return delta.days

    def save(self, *args, **kwargs):
        """Override para generación de código automático."""
        if not self.codigo:
            self.codigo = self._generar_codigo()

        # Actualizar estado según saldo
        if self.monto_cobrado >= self.monto_total:
            self.estado = 'pagada'  # En cuentas por cobrar, pagada = cobrada
        elif self.monto_cobrado > 0:
            self.estado = 'parcial'
        elif self.esta_vencida and self.estado == 'pendiente':
            self.estado = 'vencida'

        super().save(*args, **kwargs)

    def _generar_codigo(self):
        """Genera código único: CPC-YYYY-####"""
        year = timezone.now().year
        ultimo = CuentaPorCobrar.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'CPC-{year}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"CPC-{year}-{numero:04d}"

    def clean(self):
        """Validaciones del modelo."""
        if self.monto_cobrado > self.monto_total:
            raise ValidationError({
                'monto_cobrado': 'El monto cobrado no puede ser mayor al monto total.'
            })

        if self.fecha_documento and self.fecha_vencimiento:
            if self.fecha_vencimiento < self.fecha_documento:
                raise ValidationError({
                    'fecha_vencimiento': 'La fecha de vencimiento debe ser posterior a la fecha del documento.'
                })


# ==============================================================================
# MODELO: FLUJO DE CAJA
# ==============================================================================

class FlujoCaja(BaseCompanyModel):
    """
    Flujo de Caja - Proyección y control de flujo de efectivo.

    Registra ingresos y egresos proyectados vs reales para control de liquidez.
    """

    # Relaciones opcionales
    banco = models.ForeignKey(
        Banco,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='flujos_caja',
        verbose_name='Banco',
        help_text='Cuenta bancaria asociada (si aplica)'
    )
    cuenta_por_pagar = models.ForeignKey(
        CuentaPorPagar,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='flujos_caja',
        verbose_name='Cuenta Por Pagar',
        help_text='Cuenta por pagar asociada (si es egreso)'
    )
    cuenta_por_cobrar = models.ForeignKey(
        CuentaPorCobrar,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='flujos_caja',
        verbose_name='Cuenta Por Cobrar',
        help_text='Cuenta por cobrar asociada (si es ingreso)'
    )

    # Información del flujo
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del flujo (auto-generado: FC-YYYY-####)'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_FLUJO_CHOICES,
        verbose_name='Tipo de Flujo',
        help_text='Ingreso o Egreso',
        db_index=True
    )
    concepto = models.CharField(
        max_length=255,
        verbose_name='Concepto',
        help_text='Descripción del movimiento'
    )

    # Fecha
    fecha = models.DateField(
        verbose_name='Fecha',
        help_text='Fecha del movimiento o proyección',
        db_index=True
    )

    # Montos
    monto_proyectado = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Monto Proyectado',
        help_text='Monto proyectado del flujo'
    )
    monto_real = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Monto Real',
        help_text='Monto real ejecutado'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_flujo_caja'
        verbose_name = 'Flujo de Caja'
        verbose_name_plural = 'Flujos de Caja'
        ordering = ['fecha', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'tipo', 'fecha']),
            models.Index(fields=['codigo']),
            models.Index(fields=['fecha']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.get_tipo_display()} - {self.concepto}"

    @property
    def variacion(self):
        """Calcula la variación entre proyectado y real."""
        return self.monto_real - self.monto_proyectado

    @property
    def porcentaje_cumplimiento(self):
        """Calcula el porcentaje de cumplimiento."""
        if self.monto_proyectado == 0:
            return Decimal('0.00')
        return (self.monto_real / self.monto_proyectado) * Decimal('100.00')

    def save(self, *args, **kwargs):
        """Override para generación de código automático."""
        if not self.codigo:
            self.codigo = self._generar_codigo()
        super().save(*args, **kwargs)

    def _generar_codigo(self):
        """Genera código único: FC-YYYY-####"""
        year = timezone.now().year
        ultimo = FlujoCaja.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'FC-{year}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"FC-{year}-{numero:04d}"


# ==============================================================================
# MODELO: PAGO
# ==============================================================================

class Pago(BaseCompanyModel):
    """
    Pago - Pagos realizados a proveedores/terceros.

    Registra todos los pagos realizados por la empresa.
    """

    # Relaciones
    cuenta_por_pagar = models.ForeignKey(
        CuentaPorPagar,
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Cuenta Por Pagar',
        help_text='Cuenta por pagar que se está pagando'
    )
    banco = models.ForeignKey(
        Banco,
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Banco',
        help_text='Cuenta bancaria desde la que se paga'
    )

    # Información del pago
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del pago (auto-generado: PAG-YYYY-####)'
    )
    fecha_pago = models.DateField(
        default=timezone.now,
        verbose_name='Fecha de Pago',
        help_text='Fecha en que se realiza el pago',
        db_index=True
    )
    monto = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Monto',
        help_text='Monto del pago'
    )

    # Método de pago
    metodo_pago = models.CharField(
        max_length=20,
        choices=METODO_PAGO_CHOICES,
        verbose_name='Método de Pago',
        help_text='Método utilizado para el pago'
    )
    referencia = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Referencia',
        help_text='Número de referencia/transacción/cheque'
    )

    # Comprobante
    comprobante = models.FileField(
        upload_to='tesoreria/pagos/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Comprobante de Pago',
        help_text='Archivo PDF del comprobante'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_pago'
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha_pago', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'fecha_pago']),
            models.Index(fields=['codigo']),
            models.Index(fields=['cuenta_por_pagar']),
            models.Index(fields=['banco']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.cuenta_por_pagar.concepto} - ${self.monto}"

    def save(self, *args, **kwargs):
        """Override para generación de código y actualización de saldos."""
        es_nuevo = not self.pk

        if not self.codigo:
            self.codigo = self._generar_codigo()

        super().save(*args, **kwargs)

        # Solo actualizar saldos si es nuevo pago
        if es_nuevo:
            # Actualizar cuenta por pagar
            self.cuenta_por_pagar.monto_pagado += self.monto
            self.cuenta_por_pagar.save(update_fields=['monto_pagado', 'updated_at'])

            # Actualizar saldo del banco
            self.banco.actualizar_saldo(self.monto, tipo='egreso')

    def _generar_codigo(self):
        """Genera código único: PAG-YYYY-####"""
        year = timezone.now().year
        ultimo = Pago.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'PAG-{year}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"PAG-{year}-{numero:04d}"

    def clean(self):
        """Validaciones del modelo."""
        # Validar que el monto no exceda el saldo pendiente
        if self.cuenta_por_pagar:
            saldo_pendiente = self.cuenta_por_pagar.saldo_pendiente
            if self.monto > saldo_pendiente:
                raise ValidationError({
                    'monto': f'El monto ({self.monto}) excede el saldo pendiente ({saldo_pendiente})'
                })

        # Validar que el banco tenga saldo suficiente
        if self.banco and self.banco.saldo_disponible < self.monto:
            raise ValidationError({
                'monto': f'Saldo insuficiente en la cuenta bancaria. Disponible: ${self.banco.saldo_disponible}'
            })


# ==============================================================================
# MODELO: RECAUDO
# ==============================================================================

class Recaudo(BaseCompanyModel):
    """
    Recaudo - Cobros recibidos de clientes.

    Registra todos los cobros recibidos por la empresa.
    """

    # Relaciones
    cuenta_por_cobrar = models.ForeignKey(
        CuentaPorCobrar,
        on_delete=models.PROTECT,
        related_name='recaudos',
        verbose_name='Cuenta Por Cobrar',
        help_text='Cuenta por cobrar que se está cobrando'
    )
    banco = models.ForeignKey(
        Banco,
        on_delete=models.PROTECT,
        related_name='recaudos',
        verbose_name='Banco',
        help_text='Cuenta bancaria donde se recibe el pago'
    )

    # Información del recaudo
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del recaudo (auto-generado: REC-YYYY-####)'
    )
    fecha_recaudo = models.DateField(
        default=timezone.now,
        verbose_name='Fecha de Recaudo',
        help_text='Fecha en que se recibe el pago',
        db_index=True
    )
    monto = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Monto',
        help_text='Monto del recaudo'
    )

    # Método de pago
    metodo_pago = models.CharField(
        max_length=20,
        choices=METODO_PAGO_CHOICES,
        verbose_name='Método de Pago',
        help_text='Método utilizado para el pago'
    )
    referencia = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Referencia',
        help_text='Número de referencia/transacción'
    )

    # Comprobante
    comprobante = models.FileField(
        upload_to='tesoreria/recaudos/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Comprobante de Recaudo',
        help_text='Archivo PDF del comprobante'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_recaudo'
        verbose_name = 'Recaudo'
        verbose_name_plural = 'Recaudos'
        ordering = ['-fecha_recaudo', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'fecha_recaudo']),
            models.Index(fields=['codigo']),
            models.Index(fields=['cuenta_por_cobrar']),
            models.Index(fields=['banco']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.cuenta_por_cobrar.concepto} - ${self.monto}"

    def save(self, *args, **kwargs):
        """Override para generación de código y actualización de saldos."""
        es_nuevo = not self.pk

        if not self.codigo:
            self.codigo = self._generar_codigo()

        super().save(*args, **kwargs)

        # Solo actualizar saldos si es nuevo recaudo
        if es_nuevo:
            # Actualizar cuenta por cobrar
            self.cuenta_por_cobrar.monto_cobrado += self.monto
            self.cuenta_por_cobrar.save(update_fields=['monto_cobrado', 'updated_at'])

            # Actualizar saldo del banco
            self.banco.actualizar_saldo(self.monto, tipo='ingreso')

    def _generar_codigo(self):
        """Genera código único: REC-YYYY-####"""
        year = timezone.now().year
        ultimo = Recaudo.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'REC-{year}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"REC-{year}-{numero:04d}"

    def clean(self):
        """Validaciones del modelo."""
        # Validar que el monto no exceda el saldo pendiente
        if self.cuenta_por_cobrar:
            saldo_pendiente = self.cuenta_por_cobrar.saldo_pendiente
            if self.monto > saldo_pendiente:
                raise ValidationError({
                    'monto': f'El monto ({self.monto}) excede el saldo pendiente ({saldo_pendiente})'
                })
