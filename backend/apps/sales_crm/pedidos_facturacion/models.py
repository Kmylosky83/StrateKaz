"""
Modelos para Pedidos y Facturación - Sales CRM
Sistema de Gestión Grasas y Huesos del Norte

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.

Gestiona:
- Estados de pedido dinámicos
- Métodos de pago configurables
- Condiciones de pago personalizables
- Pedidos con detalle (PED-YYYY-####)
- Facturas con detalle (FAC-YYYY-####)
- Pagos a facturas (PAG-####)
- Multi-tenant (empresa_id en todos los modelos)

Flujo: Cotización → Pedido → Factura → Pago

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Sum
from decimal import Decimal
from datetime import timedelta

from apps.core.base_models.base import BaseCompanyModel, OrderedModel


# ==============================================================================
# MODELOS DE CATÁLOGO DINÁMICO
# ==============================================================================

class EstadoPedido(OrderedModel):
    """
    Estado del pedido (catálogo dinámico).

    Ejemplos:
    - BORRADOR
    - PENDIENTE_APROBACION
    - APROBADO
    - EN_PRODUCCION
    - DESPACHADO
    - ENTREGADO
    - CANCELADO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del estado (ej: APROBADO, EN_PRODUCCION)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del estado'
    )
    color = models.CharField(
        max_length=20,
        default='gray',
        verbose_name='Color',
        help_text='Color para representación visual (success, warning, danger, info, gray)'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción del estado'
    )

    # Reglas de negocio
    es_inicial = models.BooleanField(
        default=False,
        verbose_name='Es Estado Inicial',
        help_text='¿Es el estado inicial al crear un pedido?'
    )
    es_final = models.BooleanField(
        default=False,
        verbose_name='Es Estado Final',
        help_text='¿Es un estado terminal (entregado/cancelado)?'
    )
    permite_modificacion = models.BooleanField(
        default=True,
        verbose_name='Permite Modificación',
        help_text='¿Se puede editar el pedido en este estado?'
    )
    permite_facturar = models.BooleanField(
        default=False,
        verbose_name='Permite Facturar',
        help_text='¿Se puede generar factura desde este estado?'
    )

    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='¿Estado activo?'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales_crm_estado_pedido'
        verbose_name = 'Estado de Pedido'
        verbose_name_plural = 'Estados de Pedido'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['activo', 'orden']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class MetodoPago(OrderedModel):
    """
    Método de pago (catálogo dinámico).

    Ejemplos:
    - EFECTIVO
    - TRANSFERENCIA
    - TARJETA_CREDITO
    - TARJETA_DEBITO
    - CHEQUE
    - CONSIGNACION
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del método (ej: EFECTIVO, TRANSFERENCIA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del método de pago'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción del método de pago'
    )

    # Reglas de negocio
    requiere_referencia = models.BooleanField(
        default=False,
        verbose_name='Requiere Referencia',
        help_text='¿Requiere número de referencia/transacción?'
    )
    requiere_autorizacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Autorización',
        help_text='¿Requiere código de autorización?'
    )

    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='¿Método activo?'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales_crm_metodo_pago'
        verbose_name = 'Método de Pago'
        verbose_name_plural = 'Métodos de Pago'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['activo', 'orden']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class CondicionPago(OrderedModel):
    """
    Condición de pago (catálogo dinámico).

    Ejemplos:
    - CONTADO (0 días)
    - 30_DIAS (30 días)
    - 60_DIAS (60 días)
    - 90_DIAS (90 días)
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la condición (ej: CONTADO, 30_DIAS)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la condición de pago'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción de la condición de pago'
    )

    # Configuración de plazo
    dias_plazo = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Días de Plazo',
        help_text='Días de plazo para el pago (0 = contado)'
    )

    # Descuentos por pronto pago
    aplica_descuento = models.BooleanField(
        default=False,
        verbose_name='Aplica Descuento',
        help_text='¿Aplica descuento por pronto pago?'
    )
    porcentaje_descuento = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='% Descuento',
        help_text='Porcentaje de descuento por pronto pago (0-100%)'
    )

    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='¿Condición activa?'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales_crm_condicion_pago'
        verbose_name = 'Condición de Pago'
        verbose_name_plural = 'Condiciones de Pago'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['activo', 'orden']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ==============================================================================
# MODELOS PRINCIPALES
# ==============================================================================

class Pedido(BaseCompanyModel):
    """
    Pedido de venta.

    Flujo: Cotización → Pedido → Factura
    Código automático: PED-YYYY-####
    """
    # Relaciones
    cliente = models.ForeignKey(
        'gestion_clientes.Cliente',
        on_delete=models.PROTECT,
        related_name='pedidos',
        verbose_name='Cliente',
        help_text='Cliente que realiza el pedido'
    )
    cotizacion = models.ForeignKey(
        'pipeline_ventas.Cotizacion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pedidos',
        verbose_name='Cotización',
        help_text='Cotización que origina el pedido (opcional)'
    )
    vendedor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pedidos_vendedor',
        verbose_name='Vendedor',
        help_text='Vendedor responsable del pedido'
    )
    estado = models.ForeignKey(
        EstadoPedido,
        on_delete=models.PROTECT,
        related_name='pedidos',
        verbose_name='Estado',
        help_text='Estado actual del pedido'
    )
    condicion_pago = models.ForeignKey(
        CondicionPago,
        on_delete=models.PROTECT,
        related_name='pedidos',
        verbose_name='Condición de Pago',
        help_text='Condición de pago del pedido'
    )

    # Información del pedido
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del pedido (ej: PED-2025-0001)'
    )
    fecha_pedido = models.DateField(
        default=timezone.now,
        db_index=True,
        verbose_name='Fecha de Pedido',
        help_text='Fecha en que se realizó el pedido'
    )
    fecha_entrega_estimada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Entrega Estimada',
        help_text='Fecha estimada de entrega'
    )

    # Dirección de entrega
    direccion_entrega = models.TextField(
        verbose_name='Dirección de Entrega',
        help_text='Dirección donde se entregará el pedido'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones adicionales del pedido'
    )

    # Totales (se calculan automáticamente)
    subtotal = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Subtotal',
        help_text='Subtotal del pedido (antes de descuentos e impuestos)'
    )
    descuento_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='% Descuento',
        help_text='Porcentaje de descuento general (0-100%)'
    )
    descuento_valor = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Descuento (Valor)',
        help_text='Valor del descuento aplicado'
    )
    impuestos = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('19.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='% Impuestos',
        help_text='Porcentaje de impuestos (IVA Colombia = 19%)'
    )
    total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Total',
        help_text='Total del pedido (incluye descuentos e impuestos)'
    )

    # Auditoría (heredada de BaseCompanyModel: created_by, updated_by)

    class Meta:
        db_table = 'sales_crm_pedido'
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-fecha_pedido', '-codigo']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['empresa', 'cliente']),
            models.Index(fields=['empresa', 'vendedor']),
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['empresa', 'fecha_pedido']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.cliente}"

    def save(self, *args, **kwargs):
        """
        Genera código automático si no existe.
        Formato: PED-YYYY-####
        """
        if not self.codigo:
            year = timezone.now().year
            last_pedido = Pedido.objects.filter(
                empresa=self.empresa,
                codigo__startswith=f'PED-{year}-'
            ).order_by('-codigo').first()

            if last_pedido:
                last_num = int(last_pedido.codigo.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1

            self.codigo = f'PED-{year}-{new_num:04d}'

        super().save(*args, **kwargs)

    def calcular_totales(self):
        """
        Calcula los totales del pedido basándose en los detalles.
        """
        # Calcular subtotal desde detalles
        detalles = self.detalles.all()
        self.subtotal = sum(detalle.subtotal for detalle in detalles)

        # Calcular descuento
        self.descuento_valor = (self.subtotal * self.descuento_porcentaje / Decimal('100.00')).quantize(Decimal('0.01'))

        # Calcular base imponible
        base_imponible = self.subtotal - self.descuento_valor

        # Calcular impuestos
        valor_impuestos = (base_imponible * self.impuestos / Decimal('100.00')).quantize(Decimal('0.01'))

        # Calcular total
        self.total = base_imponible + valor_impuestos

        self.save(update_fields=['subtotal', 'descuento_valor', 'total', 'updated_at'])

    def aprobar(self, usuario):
        """
        Aprueba el pedido.
        """
        estado_aprobado = EstadoPedido.objects.filter(
            codigo='APROBADO',
            activo=True
        ).first()

        if not estado_aprobado:
            raise ValidationError('No existe estado APROBADO activo en el sistema')

        self.estado = estado_aprobado
        self.updated_by = usuario
        self.save(update_fields=['estado', 'updated_by', 'updated_at'])

    def cancelar(self, usuario, motivo=''):
        """
        Cancela el pedido.
        """
        estado_cancelado = EstadoPedido.objects.filter(
            codigo='CANCELADO',
            activo=True
        ).first()

        if not estado_cancelado:
            raise ValidationError('No existe estado CANCELADO activo en el sistema')

        self.estado = estado_cancelado
        if motivo:
            self.observaciones = f"{self.observaciones}\n\nCANCELADO: {motivo}" if self.observaciones else f"CANCELADO: {motivo}"
        self.updated_by = usuario
        self.save(update_fields=['estado', 'observaciones', 'updated_by', 'updated_at'])

    @property
    def puede_modificar(self):
        """Verifica si el pedido puede ser modificado."""
        return self.estado.permite_modificacion

    @property
    def puede_facturar(self):
        """Verifica si el pedido puede ser facturado."""
        return self.estado.permite_facturar

    @property
    def tiene_factura(self):
        """Verifica si el pedido ya tiene factura asociada."""
        return self.facturas.exists()


class DetallePedido(BaseCompanyModel):
    """
    Detalle/línea de pedido.
    """
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Pedido',
        help_text='Pedido al que pertenece esta línea'
    )
    producto = models.ForeignKey(
        'producto_terminado.ProductoTerminado',
        on_delete=models.PROTECT,
        related_name='detalles_pedido',
        verbose_name='Producto',
        help_text='Producto a vender'
    )

    # Información del producto
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción del producto (se copia del producto)'
    )
    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Cantidad',
        help_text='Cantidad solicitada'
    )
    unidad_medida = models.CharField(
        max_length=50,
        verbose_name='Unidad de Medida',
        help_text='Unidad de medida (kg, unidades, etc.)'
    )
    precio_unitario = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Precio Unitario',
        help_text='Precio unitario del producto'
    )
    descuento_linea = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='% Descuento Línea',
        help_text='Descuento específico de esta línea (0-100%)'
    )
    subtotal = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Subtotal',
        help_text='Subtotal de la línea (cantidad × precio - descuento)'
    )

    # Orden de visualización
    orden = models.PositiveIntegerField(
        default=1,
        verbose_name='Orden',
        help_text='Orden de la línea en el pedido'
    )

    class Meta:
        db_table = 'sales_crm_detalle_pedido'
        verbose_name = 'Detalle de Pedido'
        verbose_name_plural = 'Detalles de Pedido'
        ordering = ['pedido', 'orden']
        indexes = [
            models.Index(fields=['empresa', 'pedido']),
            models.Index(fields=['empresa', 'producto']),
        ]

    def __str__(self):
        return f"{self.pedido.codigo} - {self.producto.nombre}"

    def save(self, *args, **kwargs):
        """
        Copia descripción del producto y calcula subtotal.
        """
        # Copiar descripción del producto si no existe
        if not self.descripcion and self.producto:
            self.descripcion = self.producto.nombre

        # Copiar unidad de medida del producto si no existe
        if not self.unidad_medida and self.producto:
            self.unidad_medida = self.producto.unidad_medida

        # Calcular subtotal
        subtotal_antes_descuento = self.cantidad * self.precio_unitario
        descuento = subtotal_antes_descuento * (self.descuento_linea / Decimal('100.00'))
        self.subtotal = (subtotal_antes_descuento - descuento).quantize(Decimal('0.01'))

        super().save(*args, **kwargs)

        # Recalcular totales del pedido
        self.pedido.calcular_totales()


class Factura(BaseCompanyModel):
    """
    Factura de venta.

    Código automático: FAC-YYYY-####
    Estados: PENDIENTE, PARCIAL, PAGADA, ANULADA
    Preparada para DIAN: campos cufe, xml_url
    """
    # Relaciones
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.PROTECT,
        related_name='facturas',
        verbose_name='Pedido',
        help_text='Pedido que origina la factura'
    )
    cliente = models.ForeignKey(
        'gestion_clientes.Cliente',
        on_delete=models.PROTECT,
        related_name='facturas',
        verbose_name='Cliente',
        help_text='Cliente facturado'
    )

    # Información de la factura
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la factura (ej: FAC-2025-0001)'
    )
    fecha_factura = models.DateField(
        default=timezone.now,
        db_index=True,
        verbose_name='Fecha de Factura',
        help_text='Fecha de emisión de la factura'
    )
    fecha_vencimiento = models.DateField(
        verbose_name='Fecha de Vencimiento',
        help_text='Fecha de vencimiento de la factura'
    )

    # Estado de la factura
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente de Pago'),
        ('PARCIAL', 'Pago Parcial'),
        ('PAGADA', 'Pagada'),
        ('ANULADA', 'Anulada'),
    ]
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PENDIENTE',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado actual de la factura'
    )

    # Totales (copiados del pedido, pero pueden ajustarse)
    subtotal = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Subtotal',
        help_text='Subtotal de la factura'
    )
    descuento_valor = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Descuento',
        help_text='Valor del descuento aplicado'
    )
    impuestos = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('19.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='% Impuestos',
        help_text='Porcentaje de impuestos (IVA)'
    )
    total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Total',
        help_text='Total de la factura'
    )

    # Campos para DIAN (Facturación Electrónica)
    cufe = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='CUFE',
        help_text='Código Único de Facturación Electrónica (DIAN)'
    )
    xml_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL XML',
        help_text='URL del XML de la factura electrónica'
    )
    pdf_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL PDF',
        help_text='URL del PDF de la factura'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones adicionales de la factura'
    )

    class Meta:
        db_table = 'sales_crm_factura'
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'
        ordering = ['-fecha_factura', '-codigo']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['empresa', 'cliente']),
            models.Index(fields=['empresa', 'pedido']),
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['empresa', 'fecha_factura']),
            models.Index(fields=['empresa', 'fecha_vencimiento']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.cliente}"

    def save(self, *args, **kwargs):
        """
        Genera código automático si no existe.
        Formato: FAC-YYYY-####
        """
        if not self.codigo:
            year = timezone.now().year
            last_factura = Factura.objects.filter(
                empresa=self.empresa,
                codigo__startswith=f'FAC-{year}-'
            ).order_by('-codigo').first()

            if last_factura:
                last_num = int(last_factura.codigo.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1

            self.codigo = f'FAC-{year}-{new_num:04d}'

        super().save(*args, **kwargs)

    @classmethod
    def generar_desde_pedido(cls, pedido, usuario):
        """
        Genera una factura desde un pedido aprobado.
        """
        # Validar que el pedido pueda facturarse
        if not pedido.puede_facturar:
            raise ValidationError(f'El pedido {pedido.codigo} no puede ser facturado en su estado actual')

        # Validar que no tenga factura previa
        if pedido.tiene_factura:
            raise ValidationError(f'El pedido {pedido.codigo} ya tiene factura asociada')

        # Calcular fecha de vencimiento según condición de pago
        fecha_vencimiento = pedido.fecha_pedido + timedelta(days=pedido.condicion_pago.dias_plazo)

        # Crear factura
        factura = cls.objects.create(
            empresa=pedido.empresa,
            pedido=pedido,
            cliente=pedido.cliente,
            fecha_factura=timezone.now().date(),
            fecha_vencimiento=fecha_vencimiento,
            subtotal=pedido.subtotal,
            descuento_valor=pedido.descuento_valor,
            impuestos=pedido.impuestos,
            total=pedido.total,
            created_by=usuario,
            updated_by=usuario
        )

        return factura

    def registrar_pago(self, monto, metodo_pago, referencia_pago='', observaciones='', usuario=None):
        """
        Registra un pago para la factura.
        """
        if self.estado == 'ANULADA':
            raise ValidationError('No se puede registrar pago en una factura anulada')

        if self.estado == 'PAGADA':
            raise ValidationError('La factura ya está completamente pagada')

        # Validar que el monto no exceda el saldo pendiente
        saldo_pendiente = self.saldo_pendiente
        if monto > saldo_pendiente:
            raise ValidationError(f'El monto ({monto}) excede el saldo pendiente ({saldo_pendiente})')

        # Crear registro de pago
        pago = PagoFactura.objects.create(
            empresa=self.empresa,
            factura=self,
            fecha_pago=timezone.now().date(),
            monto=monto,
            metodo_pago=metodo_pago,
            referencia_pago=referencia_pago,
            observaciones=observaciones,
            registrado_por=usuario or self.created_by,
            created_by=usuario or self.created_by,
            updated_by=usuario or self.created_by
        )

        # Actualizar estado de la factura (se hace automáticamente en signal)

        return pago

    @property
    def saldo_pendiente(self):
        """Calcula el saldo pendiente de la factura."""
        total_pagado = self.pagos.aggregate(
            total=Sum('monto')
        )['total'] or Decimal('0.00')

        return self.total - total_pagado

    @property
    def esta_vencida(self):
        """Verifica si la factura está vencida."""
        if self.estado in ['PAGADA', 'ANULADA']:
            return False
        return self.fecha_vencimiento < timezone.now().date()

    @property
    def dias_vencimiento(self):
        """Calcula días hasta/desde vencimiento (negativo = vencida)."""
        delta = self.fecha_vencimiento - timezone.now().date()
        return delta.days


class PagoFactura(BaseCompanyModel):
    """
    Registro de pago de factura.

    Código automático: PAG-####
    """
    factura = models.ForeignKey(
        Factura,
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Factura',
        help_text='Factura que se paga'
    )

    # Información del pago
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del pago (ej: PAG-0001)'
    )
    fecha_pago = models.DateField(
        default=timezone.now,
        db_index=True,
        verbose_name='Fecha de Pago',
        help_text='Fecha en que se realizó el pago'
    )
    monto = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Monto',
        help_text='Monto del pago'
    )

    # Método de pago
    metodo_pago = models.ForeignKey(
        MetodoPago,
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Método de Pago',
        help_text='Método utilizado para el pago'
    )
    referencia_pago = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Referencia',
        help_text='Número de referencia/transacción/autorización'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones del pago'
    )

    # Registrado por
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pagos_registrados',
        verbose_name='Registrado Por',
        help_text='Usuario que registró el pago'
    )

    class Meta:
        db_table = 'sales_crm_pago_factura'
        verbose_name = 'Pago de Factura'
        verbose_name_plural = 'Pagos de Facturas'
        ordering = ['-fecha_pago', '-codigo']
        indexes = [
            models.Index(fields=['empresa', 'factura']),
            models.Index(fields=['empresa', 'fecha_pago']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.factura.codigo} - ${self.monto}"

    def save(self, *args, **kwargs):
        """
        Genera código automático si no existe.
        Formato: PAG-####
        """
        if not self.codigo:
            last_pago = PagoFactura.objects.filter(
                empresa=self.empresa
            ).order_by('-codigo').first()

            if last_pago:
                last_num = int(last_pago.codigo.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1

            self.codigo = f'PAG-{new_num:04d}'

        super().save(*args, **kwargs)
