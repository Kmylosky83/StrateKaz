"""
Modelos para Producto Terminado - Production Ops
Sistema de Gestión Grasas y Huesos del Norte

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.

Gestiona:
- Catálogo de productos terminados (harina de hueso, sebo refinado, grasa)
- Inventario de PT por lotes con trazabilidad completa
- Liberación de calidad antes de despacho
- Certificados de calidad para clientes
- Multi-tenant (empresa_id en todos los modelos)

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import timedelta

from apps.core.base_models import BaseCompanyModel, OrderedModel


# ==============================================================================
# MODELOS DE CATÁLOGO DINÁMICO
# ==============================================================================

class TipoProducto(OrderedModel):
    """
    Tipo de producto terminado (catálogo dinámico).

    Ejemplos:
    - HARINA_HUESO
    - SEBO_REFINADO
    - GRASA_AMARILLA
    - ACEITE_RECICLADO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de producto (ej: HARINA_HUESO)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de producto'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del tipo de producto'
    )

    # Unidad de medida
    unidad_medida = models.CharField(
        max_length=20,
        default='KG',
        verbose_name='Unidad de Medida',
        help_text='Unidad de medida (KG, TON, LB, etc.)'
    )

    # Requisitos de calidad
    requiere_certificado = models.BooleanField(
        default=True,
        verbose_name='Requiere Certificado',
        help_text='¿Requiere certificado de calidad para despacho?'
    )
    requiere_ficha_tecnica = models.BooleanField(
        default=True,
        verbose_name='Requiere Ficha Técnica',
        help_text='¿Requiere ficha técnica actualizada?'
    )

    # Parámetros de almacenamiento
    vida_util_dias = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Vida Útil (días)',
        help_text='Vida útil del producto en días'
    )
    temperatura_almacenamiento_min = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Temperatura Mínima (°C)',
        help_text='Temperatura mínima de almacenamiento'
    )
    temperatura_almacenamiento_max = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Temperatura Máxima (°C)',
        help_text='Temperatura máxima de almacenamiento'
    )

    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='¿Tipo de producto activo?'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'producto_terminado_tipo_producto'
        verbose_name = 'Tipo de Producto'
        verbose_name_plural = 'Tipos de Producto'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['activo', 'orden']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class EstadoLote(OrderedModel):
    """
    Estado del lote de producto terminado (catálogo dinámico).

    Ejemplos:
    - EN_PRODUCCION
    - CUARENTENA
    - LIBERADO
    - APROBADO
    - RECHAZADO
    - DESPACHADO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del estado (ej: LIBERADO)'
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
    permite_despacho = models.BooleanField(
        default=False,
        verbose_name='Permite Despacho',
        help_text='¿El lote en este estado puede ser despachado?'
    )
    requiere_liberacion = models.BooleanField(
        default=True,
        verbose_name='Requiere Liberación',
        help_text='¿Requiere liberación de calidad para cambiar de este estado?'
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
        db_table = 'producto_terminado_estado_lote'
        verbose_name = 'Estado de Lote'
        verbose_name_plural = 'Estados de Lote'
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

class ProductoTerminado(BaseCompanyModel):
    """
    Catálogo de productos terminados.

    Representa un producto que puede ser vendido/despachado.
    Ejemplos: Harina de Hueso 45% proteína, Sebo Refinado Grado A, etc.
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del producto (ej: HH-45, SR-GA)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre del producto terminado'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del producto'
    )

    # Relación con tipo de producto
    tipo_producto = models.ForeignKey(
        TipoProducto,
        on_delete=models.PROTECT,
        related_name='productos',
        verbose_name='Tipo de Producto',
        help_text='Tipo al que pertenece este producto'
    )

    # Especificaciones técnicas
    especificaciones_tecnicas = models.TextField(
        blank=True,
        verbose_name='Especificaciones Técnicas',
        help_text='Especificaciones técnicas del producto (proteína, grasa, humedad, etc.)'
    )

    # Precio base
    precio_base = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio Base',
        help_text='Precio base unitario del producto'
    )
    moneda = models.CharField(
        max_length=3,
        default='COP',
        verbose_name='Moneda',
        help_text='Moneda del precio (COP, USD, EUR)'
    )

    # Archivos adjuntos
    ficha_tecnica_url = models.URLField(
        max_length=500,
        blank=True,
        verbose_name='URL Ficha Técnica',
        help_text='URL de la ficha técnica del producto'
    )
    imagen_url = models.URLField(
        max_length=500,
        blank=True,
        verbose_name='URL Imagen',
        help_text='URL de la imagen del producto'
    )

    class Meta:
        db_table = 'producto_terminado_producto'
        verbose_name = 'Producto Terminado'
        verbose_name_plural = 'Productos Terminados'
        ordering = ['codigo', 'nombre']
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['tipo_producto', 'is_active']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def get_stock_total(self):
        """Retorna el stock total disponible de este producto."""
        return self.stocks.filter(
            is_active=True
        ).aggregate(
            total=models.Sum('cantidad_disponible')
        )['total'] or Decimal('0.00')

    def get_stock_por_estado(self):
        """Retorna el stock agrupado por estado."""
        return self.stocks.filter(
            is_active=True
        ).values('estado_lote__nombre').annotate(
            cantidad=models.Sum('cantidad_disponible')
        ).order_by('estado_lote__orden')


class StockProducto(BaseCompanyModel):
    """
    Inventario de producto terminado por lote.

    Cada registro representa un lote específico de producto terminado
    con trazabilidad completa desde su producción.
    """
    # Relaciones principales
    producto = models.ForeignKey(
        ProductoTerminado,
        on_delete=models.PROTECT,
        related_name='stocks',
        verbose_name='Producto',
        help_text='Producto al que corresponde este stock'
    )
    estado_lote = models.ForeignKey(
        EstadoLote,
        on_delete=models.PROTECT,
        related_name='stocks',
        verbose_name='Estado del Lote',
        help_text='Estado actual del lote'
    )

    # Trazabilidad - Relación con producción
    lote_produccion = models.ForeignKey(
        'procesamiento.LoteProduccion',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='productos_terminados',
        verbose_name='Lote de Producción',
        help_text='Lote de producción del que se originó este PT (si aplica)'
    )

    # Identificación del lote PT
    codigo_lote_pt = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name='Código Lote PT',
        help_text='Código único del lote de producto terminado (auto: PT-XXXX-YYYYMMDD-NNNN)'
    )

    # Cantidades
    cantidad_inicial = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Cantidad Inicial',
        help_text='Cantidad inicial del lote'
    )
    cantidad_disponible = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Cantidad Disponible',
        help_text='Cantidad disponible para despacho'
    )
    cantidad_reservada = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=Decimal('0.000'),
        verbose_name='Cantidad Reservada',
        help_text='Cantidad reservada para pedidos'
    )

    # Fechas importantes
    fecha_produccion = models.DateField(
        verbose_name='Fecha de Producción',
        help_text='Fecha en que se produjo el lote'
    )
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Vencimiento',
        help_text='Fecha de vencimiento del lote (si aplica)'
    )

    # Ubicación física
    ubicacion_almacen = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Ubicación en Almacén',
        help_text='Ubicación física del lote (estante, posición, etc.)'
    )

    # Costos
    costo_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Costo Unitario',
        help_text='Costo unitario de producción'
    )
    valor_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False,
        verbose_name='Valor Total',
        help_text='Valor total del lote (calculado automáticamente)'
    )

    class Meta:
        db_table = 'producto_terminado_stock'
        verbose_name = 'Stock de Producto'
        verbose_name_plural = 'Stocks de Producto'
        ordering = ['-fecha_produccion', 'producto__codigo']
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['producto', 'estado_lote']),
            models.Index(fields=['codigo_lote_pt']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['fecha_produccion']),
        ]

    def __str__(self):
        return f"{self.codigo_lote_pt} - {self.producto.nombre} ({self.cantidad_disponible} {self.producto.tipo_producto.unidad_medida})"

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que cantidad_disponible no sea negativa
        if self.cantidad_disponible and self.cantidad_disponible < 0:
            raise ValidationError({
                'cantidad_disponible': 'La cantidad disponible no puede ser negativa.'
            })

        # Validar que cantidad_reservada no sea negativa
        if self.cantidad_reservada and self.cantidad_reservada < 0:
            raise ValidationError({
                'cantidad_reservada': 'La cantidad reservada no puede ser negativa.'
            })

        # Validar que fecha_vencimiento sea posterior a fecha_produccion
        if self.fecha_vencimiento and self.fecha_produccion:
            if self.fecha_vencimiento <= self.fecha_produccion:
                raise ValidationError({
                    'fecha_vencimiento': 'La fecha de vencimiento debe ser posterior a la fecha de producción.'
                })

    def save(self, *args, **kwargs):
        """Override para cálculos automáticos."""
        # Generar código de lote PT si no existe
        if not self.codigo_lote_pt:
            self.codigo_lote_pt = self._generar_codigo_lote()

        # Calcular valor total
        if self.costo_unitario and self.cantidad_disponible:
            self.valor_total = self.costo_unitario * self.cantidad_disponible

        # Calcular fecha de vencimiento si no está definida
        if not self.fecha_vencimiento and self.producto.tipo_producto.vida_util_dias:
            self.fecha_vencimiento = self.fecha_produccion + timedelta(
                days=self.producto.tipo_producto.vida_util_dias
            )

        super().save(*args, **kwargs)

    def _generar_codigo_lote(self):
        """Genera código único para lote PT: PT-XXXX-YYYYMMDD-NNNN."""
        fecha_str = self.fecha_produccion.strftime('%Y%m%d')
        producto_codigo = self.producto.codigo[:4].upper()

        # Obtener último número del día
        ultimo = StockProducto.objects.filter(
            codigo_lote_pt__contains=f"PT-{producto_codigo}-{fecha_str}"
        ).order_by('-codigo_lote_pt').first()

        if ultimo:
            partes = ultimo.codigo_lote_pt.split('-')
            if len(partes) >= 4:
                try:
                    numero = int(partes[3]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1
        else:
            numero = 1

        return f"PT-{producto_codigo}-{fecha_str}-{numero:04d}"

    def reservar_cantidad(self, cantidad):
        """Reserva una cantidad del lote."""
        if cantidad <= 0:
            raise ValidationError("La cantidad a reservar debe ser positiva.")

        if cantidad > self.cantidad_disponible:
            raise ValidationError(
                f"No hay suficiente cantidad disponible. Disponible: {self.cantidad_disponible}"
            )

        self.cantidad_disponible -= cantidad
        self.cantidad_reservada += cantidad
        self.save(update_fields=['cantidad_disponible', 'cantidad_reservada', 'updated_at'])

    def liberar_reserva(self, cantidad):
        """Libera una cantidad reservada."""
        if cantidad <= 0:
            raise ValidationError("La cantidad a liberar debe ser positiva.")

        if cantidad > self.cantidad_reservada:
            raise ValidationError(
                f"No hay suficiente cantidad reservada. Reservada: {self.cantidad_reservada}"
            )

        self.cantidad_reservada -= cantidad
        self.cantidad_disponible += cantidad
        self.save(update_fields=['cantidad_disponible', 'cantidad_reservada', 'updated_at'])

    def consumir_cantidad(self, cantidad):
        """Consume/despacha una cantidad del lote."""
        if cantidad <= 0:
            raise ValidationError("La cantidad a consumir debe ser positiva.")

        total_disponible = self.cantidad_disponible + self.cantidad_reservada

        if cantidad > total_disponible:
            raise ValidationError(
                f"No hay suficiente cantidad. Disponible: {total_disponible}"
            )

        # Primero consumir de reservada
        if self.cantidad_reservada > 0:
            if cantidad <= self.cantidad_reservada:
                self.cantidad_reservada -= cantidad
            else:
                resto = cantidad - self.cantidad_reservada
                self.cantidad_reservada = Decimal('0.000')
                self.cantidad_disponible -= resto
        else:
            self.cantidad_disponible -= cantidad

        # Recalcular valor total
        if self.costo_unitario:
            self.valor_total = self.costo_unitario * self.cantidad_disponible

        self.save(update_fields=['cantidad_disponible', 'cantidad_reservada', 'valor_total', 'updated_at'])

    @property
    def esta_vencido(self):
        """Verifica si el lote está vencido."""
        if not self.fecha_vencimiento:
            return False
        return timezone.now().date() > self.fecha_vencimiento

    @property
    def dias_para_vencer(self):
        """Retorna días restantes para vencimiento."""
        if not self.fecha_vencimiento:
            return None
        delta = self.fecha_vencimiento - timezone.now().date()
        return delta.days

    @property
    def porcentaje_consumido(self):
        """Retorna porcentaje consumido del lote."""
        if not self.cantidad_inicial or self.cantidad_inicial == 0:
            return Decimal('0.00')

        consumido = self.cantidad_inicial - (self.cantidad_disponible + self.cantidad_reservada)
        return (consumido / self.cantidad_inicial) * Decimal('100.00')


class Liberacion(BaseCompanyModel):
    """
    Liberación de calidad para producto terminado.

    Registro de aprobación/rechazo de lotes de PT por parte del
    departamento de calidad antes de permitir su despacho.
    """
    # Relación con stock
    stock_producto = models.ForeignKey(
        StockProducto,
        on_delete=models.PROTECT,
        related_name='liberaciones',
        verbose_name='Stock de Producto',
        help_text='Lote de producto a liberar'
    )

    # Fechas
    fecha_solicitud = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Solicitud',
        help_text='Fecha y hora en que se solicitó la liberación'
    )
    fecha_liberacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Liberación',
        help_text='Fecha y hora en que se aprobó/rechazó la liberación'
    )

    # Resultado
    RESULTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADO', 'Aprobado'),
        ('APROBADO_CON_OBSERVACIONES', 'Aprobado con Observaciones'),
        ('RECHAZADO', 'Rechazado'),
    ]
    resultado = models.CharField(
        max_length=30,
        choices=RESULTADO_CHOICES,
        default='PENDIENTE',
        db_index=True,
        verbose_name='Resultado',
        help_text='Resultado de la liberación'
    )

    # Personal involucrado
    solicitado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='liberaciones_solicitadas',
        verbose_name='Solicitado por',
        help_text='Usuario que solicitó la liberación'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='liberaciones_aprobadas',
        verbose_name='Aprobado por',
        help_text='Usuario que aprobó/rechazó la liberación'
    )

    # Parámetros evaluados (dinámico)
    parametros_evaluados = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Parámetros Evaluados',
        help_text='Lista de parámetros evaluados con sus valores y cumplimiento [{parametro, valor, cumple, observacion}]'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones sobre la liberación'
    )

    # Certificado
    certificado_url = models.URLField(
        max_length=500,
        blank=True,
        verbose_name='URL Certificado',
        help_text='URL del certificado de liberación generado'
    )

    class Meta:
        db_table = 'producto_terminado_liberacion'
        verbose_name = 'Liberación de Calidad'
        verbose_name_plural = 'Liberaciones de Calidad'
        ordering = ['-fecha_solicitud']
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['stock_producto', 'resultado']),
            models.Index(fields=['resultado', 'fecha_solicitud']),
        ]

    def __str__(self):
        return f"Liberación {self.id} - {self.stock_producto.codigo_lote_pt} - {self.resultado}"

    @property
    def permite_despacho(self):
        """Determina si el resultado permite despacho."""
        return self.resultado in ['APROBADO', 'APROBADO_CON_OBSERVACIONES']

    @property
    def esta_pendiente(self):
        """Verifica si la liberación está pendiente."""
        return self.resultado == 'PENDIENTE'

    def aprobar(self, usuario, observaciones='', parametros_evaluados=None):
        """Aprueba la liberación."""
        if self.resultado != 'PENDIENTE':
            raise ValidationError("Solo se pueden aprobar liberaciones pendientes.")

        self.resultado = 'APROBADO'
        self.fecha_liberacion = timezone.now()
        self.aprobado_por = usuario
        self.observaciones = observaciones

        if parametros_evaluados:
            self.parametros_evaluados = parametros_evaluados

        # Actualizar estado del stock a LIBERADO si existe
        try:
            estado_liberado = EstadoLote.objects.get(codigo='LIBERADO', activo=True)
            self.stock_producto.estado_lote = estado_liberado
            self.stock_producto.save(update_fields=['estado_lote', 'updated_at'])
        except EstadoLote.DoesNotExist:
            pass

        self.save()

    def rechazar(self, usuario, observaciones, parametros_evaluados=None):
        """Rechaza la liberación."""
        if self.resultado != 'PENDIENTE':
            raise ValidationError("Solo se pueden rechazar liberaciones pendientes.")

        if not observaciones:
            raise ValidationError("Debe proporcionar observaciones para rechazar.")

        self.resultado = 'RECHAZADO'
        self.fecha_liberacion = timezone.now()
        self.aprobado_por = usuario
        self.observaciones = observaciones

        if parametros_evaluados:
            self.parametros_evaluados = parametros_evaluados

        # Actualizar estado del stock a RECHAZADO si existe
        try:
            estado_rechazado = EstadoLote.objects.get(codigo='RECHAZADO', activo=True)
            self.stock_producto.estado_lote = estado_rechazado
            self.stock_producto.save(update_fields=['estado_lote', 'updated_at'])
        except EstadoLote.DoesNotExist:
            pass

        self.save()

    def aprobar_con_observaciones(self, usuario, observaciones, parametros_evaluados=None):
        """Aprueba la liberación con observaciones."""
        if self.resultado != 'PENDIENTE':
            raise ValidationError("Solo se pueden aprobar liberaciones pendientes.")

        if not observaciones:
            raise ValidationError("Debe proporcionar observaciones.")

        self.resultado = 'APROBADO_CON_OBSERVACIONES'
        self.fecha_liberacion = timezone.now()
        self.aprobado_por = usuario
        self.observaciones = observaciones

        if parametros_evaluados:
            self.parametros_evaluados = parametros_evaluados

        # Actualizar estado del stock a LIBERADO si existe
        try:
            estado_liberado = EstadoLote.objects.get(codigo='LIBERADO', activo=True)
            self.stock_producto.estado_lote = estado_liberado
            self.stock_producto.save(update_fields=['estado_lote', 'updated_at'])
        except EstadoLote.DoesNotExist:
            pass

        self.save()


class CertificadoCalidad(BaseCompanyModel):
    """
    Certificado de calidad para producto terminado.

    Documento que acompaña al despacho de producto certificando
    que cumple con las especificaciones técnicas requeridas.
    """
    # Número de certificado (auto-generado)
    numero_certificado = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name='Número de Certificado',
        help_text='Número único del certificado (auto: CERT-YYYYMMDD-NNNN)'
    )

    # Relación con liberación
    liberacion = models.ForeignKey(
        Liberacion,
        on_delete=models.PROTECT,
        related_name='certificados',
        verbose_name='Liberación',
        help_text='Liberación de calidad que respalda este certificado'
    )

    # Información del cliente
    cliente_nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Cliente',
        help_text='Nombre del cliente para quien se emite el certificado'
    )

    # Fechas
    fecha_emision = models.DateField(
        auto_now_add=True,
        verbose_name='Fecha de Emisión',
        help_text='Fecha de emisión del certificado'
    )
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Vencimiento',
        help_text='Fecha de vencimiento del certificado'
    )

    # Parámetros certificados
    parametros_certificados = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Parámetros Certificados',
        help_text='Parámetros de calidad certificados {parametro: valor}'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones adicionales del certificado'
    )

    # Personal
    emitido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='certificados_emitidos',
        verbose_name='Emitido por',
        help_text='Usuario que emitió el certificado'
    )

    # PDF generado
    pdf_url = models.URLField(
        max_length=500,
        blank=True,
        verbose_name='URL PDF',
        help_text='URL del PDF del certificado generado'
    )

    class Meta:
        db_table = 'producto_terminado_certificado'
        verbose_name = 'Certificado de Calidad'
        verbose_name_plural = 'Certificados de Calidad'
        ordering = ['-fecha_emision']
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['numero_certificado']),
            models.Index(fields=['fecha_emision']),
            models.Index(fields=['cliente_nombre']),
        ]

    def __str__(self):
        return f"{self.numero_certificado} - {self.cliente_nombre}"

    def save(self, *args, **kwargs):
        """Override para generar número de certificado."""
        if not self.numero_certificado:
            self.numero_certificado = self._generar_numero_certificado()
        super().save(*args, **kwargs)

    def _generar_numero_certificado(self):
        """Genera número único de certificado: CERT-YYYYMMDD-NNNN."""
        from datetime import datetime

        fecha_str = datetime.now().strftime('%Y%m%d')

        # Obtener último número del día
        ultimo = CertificadoCalidad.objects.filter(
            numero_certificado__contains=f"CERT-{fecha_str}"
        ).order_by('-numero_certificado').first()

        if ultimo:
            partes = ultimo.numero_certificado.split('-')
            if len(partes) >= 3:
                try:
                    numero = int(partes[2]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1
        else:
            numero = 1

        return f"CERT-{fecha_str}-{numero:04d}"

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que la liberación esté aprobada
        if self.liberacion and not self.liberacion.permite_despacho:
            raise ValidationError({
                'liberacion': 'Solo se pueden emitir certificados para liberaciones aprobadas.'
            })
