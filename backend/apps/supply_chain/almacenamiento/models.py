"""
Modelos para Gestión de Almacenamiento e Inventario — Supply Chain

Hereda TenantModel (TimeStamped + SoftDelete + Audit).
Catálogos dinámicos gestionados desde DB (TipoMovimientoInventario,
EstadoInventario, TipoAlerta).

Producto se referencia como FK a catalogo_productos.Producto (L17).
"""
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.catalogo_productos.models import UnidadMedida
from utils.models import TenantModel


# ==============================================================================
# CATÁLOGOS DINÁMICOS
# ==============================================================================

class TipoMovimientoInventario(TenantModel):
    """
    Tipo de movimiento de inventario (dinámico).
    Ejemplos: ENTRADA, SALIDA, AJUSTE, TRASLADO, DEVOLUCION.
    """

    AFECTACION_CHOICES = [
        ('POSITIVO', 'Aumenta Stock (+)'),
        ('NEGATIVO', 'Disminuye Stock (-)'),
        ('NEUTRO', 'Sin Afectación (0)'),
    ]

    codigo = models.CharField(max_length=50, unique=True, db_index=True, verbose_name='Código')
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, default='', verbose_name='Descripción')
    afecta_stock = models.CharField(
        max_length=10, choices=AFECTACION_CHOICES, default='NEUTRO',
        verbose_name='Afectación al stock',
    )
    requiere_origen = models.BooleanField(default=False, verbose_name='Requiere almacén origen')
    requiere_destino = models.BooleanField(default=True, verbose_name='Requiere almacén destino')
    requiere_documento = models.BooleanField(default=False, verbose_name='Requiere documento')
    orden = models.PositiveIntegerField(default=0, verbose_name='Orden')
    is_active = models.BooleanField(default=True, db_index=True, verbose_name='Activo')

    class Meta:
        db_table = 'supply_chain_tipo_movimiento_inventario'
        verbose_name = 'Tipo de Movimiento de Inventario'
        verbose_name_plural = 'Tipos de Movimiento de Inventario'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre

    @property
    def signo_afectacion(self):
        return {'POSITIVO': '+', 'NEGATIVO': '-', 'NEUTRO': '0'}.get(self.afecta_stock, '0')


class EstadoInventario(TenantModel):
    """Estado del inventario (dinámico). Ej: DISPONIBLE, RESERVADO, BLOQUEADO."""

    codigo = models.CharField(max_length=50, unique=True, db_index=True, verbose_name='Código')
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, default='', verbose_name='Descripción')
    permite_uso = models.BooleanField(default=True, verbose_name='Permite uso')
    color_hex = models.CharField(max_length=7, default='#6B7280', verbose_name='Color hexadecimal')
    orden = models.PositiveIntegerField(default=0, verbose_name='Orden')
    is_active = models.BooleanField(default=True, db_index=True, verbose_name='Activo')

    class Meta:
        db_table = 'supply_chain_estado_inventario'
        verbose_name = 'Estado de Inventario'
        verbose_name_plural = 'Estados de Inventario'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class TipoAlerta(TenantModel):
    """Tipo de alerta de inventario (dinámico). Ej: STOCK_MINIMO, VENCIMIENTO."""

    PRIORIDAD_CHOICES = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('CRITICA', 'Crítica'),
    ]

    codigo = models.CharField(max_length=50, unique=True, db_index=True, verbose_name='Código')
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, default='', verbose_name='Descripción')
    prioridad = models.CharField(
        max_length=10, choices=PRIORIDAD_CHOICES, default='MEDIA', verbose_name='Prioridad',
    )
    color_hex = models.CharField(max_length=7, default='#F59E0B', verbose_name='Color hexadecimal')
    dias_anticipacion = models.IntegerField(default=0, verbose_name='Días de anticipación')
    orden = models.PositiveIntegerField(default=0, verbose_name='Orden')
    is_active = models.BooleanField(default=True, db_index=True, verbose_name='Activo')

    class Meta:
        db_table = 'supply_chain_tipo_alerta'
        verbose_name = 'Tipo de Alerta'
        verbose_name_plural = 'Tipos de Alerta'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_prioridad_display()})"


# ==============================================================================
# MODELOS PRINCIPALES
# ==============================================================================

class Inventario(TenantModel):
    """Stock actual por almacén/producto/lote/estado."""

    almacen = models.ForeignKey(
        'catalogos.Almacen',
        on_delete=models.PROTECT,
        related_name='inventarios',
        verbose_name='Almacén',
    )
    producto = models.ForeignKey(
        'catalogo_productos.Producto',
        on_delete=models.PROTECT,
        related_name='inventarios',
        verbose_name='Producto',
    )

    # Cross-C2 M1: referencia a seguridad_industrial.TipoEPP (patrón IntegerField).
    tipo_epp_id = models.PositiveBigIntegerField(
        null=True, blank=True, db_index=True,
        verbose_name='Tipo EPP',
        help_text='ID del tipo de EPP (seguridad_industrial.TipoEPP)',
    )
    tipo_epp_nombre = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name='Nombre tipo EPP',
        help_text='Cache del nombre del tipo de EPP',
    )

    lote = models.CharField(max_length=50, blank=True, default='', verbose_name='Lote')
    fecha_vencimiento = models.DateField(null=True, blank=True, verbose_name='Fecha de vencimiento')
    fecha_ingreso = models.DateTimeField(default=timezone.now, verbose_name='Fecha de ingreso')

    cantidad_disponible = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal('0.000'),
        verbose_name='Cantidad disponible',
    )
    cantidad_reservada = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal('0.000'),
        verbose_name='Cantidad reservada',
    )
    cantidad_en_transito = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal('0.000'),
        verbose_name='Cantidad en tránsito',
    )

    # Unidad de medida del registro de inventario. Puede diferir de
    # producto.unidad_medida cuando el lote se recibe/mueve en otra unidad
    # con factor de conversión (ver UnidadMedida.factor_conversion_kg).
    unidad_medida = models.ForeignKey(
        UnidadMedida,
        on_delete=models.PROTECT,
        related_name='inventarios',
        verbose_name='Unidad de medida',
    )

    costo_unitario = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        verbose_name='Costo unitario',
    )
    costo_promedio = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        verbose_name='Costo promedio ponderado',
    )
    valor_total = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0.00'), editable=False,
        verbose_name='Valor total del inventario',
    )

    estado = models.ForeignKey(
        EstadoInventario,
        on_delete=models.PROTECT,
        related_name='inventarios',
        verbose_name='Estado',
    )

    ubicacion_fisica = models.CharField(
        max_length=100, blank=True, default='', verbose_name='Ubicación física',
    )
    zona = models.CharField(max_length=50, blank=True, default='', verbose_name='Zona')

    observaciones = models.TextField(blank=True, default='', verbose_name='Observaciones')

    class Meta:
        db_table = 'supply_chain_inventario'
        verbose_name = 'Inventario'
        verbose_name_plural = 'Inventarios'
        ordering = ['-updated_at']
        unique_together = [['almacen', 'producto', 'lote', 'estado']]
        indexes = [
            models.Index(fields=['almacen']),
            models.Index(fields=['producto']),
            models.Index(fields=['lote']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return (
            f"{self.producto.nombre} - {self.almacen.nombre} "
            f"({self.cantidad_disponible} {self.unidad_medida.simbolo})"
        )

    @property
    def cantidad_total(self):
        return self.cantidad_disponible + self.cantidad_reservada + self.cantidad_en_transito

    @property
    def esta_vencido(self):
        if self.fecha_vencimiento:
            return self.fecha_vencimiento < timezone.now().date()
        return False

    @property
    def dias_para_vencer(self):
        if self.fecha_vencimiento:
            delta = self.fecha_vencimiento - timezone.now().date()
            return delta.days
        return None

    def calcular_valor_total(self):
        self.valor_total = self.cantidad_disponible * self.costo_promedio
        return self.valor_total

    def actualizar_costo_promedio(self, cantidad_nueva, costo_nuevo):
        """Promedio ponderado: (valor_anterior + valor_nuevo) / cantidad_total."""
        cantidad_anterior = self.cantidad_disponible
        valor_anterior = cantidad_anterior * self.costo_promedio
        valor_nuevo = Decimal(str(cantidad_nueva)) * Decimal(str(costo_nuevo))
        cantidad_total = cantidad_anterior + Decimal(str(cantidad_nueva))
        if cantidad_total > 0:
            self.costo_promedio = (valor_anterior + valor_nuevo) / cantidad_total
        else:
            self.costo_promedio = Decimal('0')
        return self.costo_promedio

    def save(self, *args, **kwargs):
        self.calcular_valor_total()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if self.cantidad_disponible < 0:
            raise ValidationError({'cantidad_disponible': 'La cantidad disponible no puede ser negativa'})
        if self.cantidad_reservada < 0:
            raise ValidationError({'cantidad_reservada': 'La cantidad reservada no puede ser negativa'})


class MovimientoInventario(TenantModel):
    """
    Registro de movimientos de inventario.

    Origen del movimiento vía GenericFK manual (origen_tipo + origen_id):
    - 'VoucherRecepcion' para entradas desde recepción
    - 'AjusteInventario' para ajustes manuales
    - 'OrdenProduccion' para consumos de producción, etc.
    """

    almacen_origen = models.ForeignKey(
        'catalogos.Almacen',
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='movimientos_salida',
        verbose_name='Almacén origen',
    )
    almacen_destino = models.ForeignKey(
        'catalogos.Almacen',
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='movimientos_entrada',
        verbose_name='Almacén destino',
    )

    codigo = models.CharField(
        max_length=30, unique=True, editable=False, db_index=True,
        verbose_name='Código de movimiento',
    )
    tipo_movimiento = models.ForeignKey(
        TipoMovimientoInventario,
        on_delete=models.PROTECT,
        related_name='movimientos',
        verbose_name='Tipo de movimiento',
    )

    fecha_movimiento = models.DateTimeField(default=timezone.now, verbose_name='Fecha de movimiento')

    producto = models.ForeignKey(
        'catalogo_productos.Producto',
        on_delete=models.PROTECT,
        related_name='movimientos_inventario',
        verbose_name='Producto',
    )
    lote = models.CharField(max_length=50, blank=True, default='', verbose_name='Lote')

    cantidad = models.DecimalField(max_digits=12, decimal_places=3, verbose_name='Cantidad')
    unidad_medida = models.ForeignKey(
        UnidadMedida,
        on_delete=models.PROTECT,
        related_name='movimientos',
        verbose_name='Unidad de medida',
    )
    costo_unitario = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        verbose_name='Costo unitario',
    )
    costo_total = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0.00'), editable=False,
        verbose_name='Costo total',
    )

    documento_referencia = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name='Documento de referencia',
        help_text='Número de orden de compra, recepción, etc.',
    )

    origen_tipo = models.CharField(
        max_length=50, blank=True, default='', db_index=True,
        verbose_name='Tipo de origen',
        help_text='Tipo de entidad origen (VoucherRecepcion, AjusteInventario, etc.)',
    )
    origen_id = models.BigIntegerField(
        null=True, blank=True, db_index=True,
        verbose_name='ID de origen',
        help_text='PK de la entidad origen',
    )

    observaciones = models.TextField(blank=True, default='', verbose_name='Observaciones')

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='sc_movimientos_inventario',
        verbose_name='Registrado por',
    )

    class Meta:
        db_table = 'supply_chain_movimiento_inventario'
        verbose_name = 'Movimiento de Inventario'
        verbose_name_plural = 'Movimientos de Inventario'
        ordering = ['-fecha_movimiento', '-created_at']
        indexes = [
            models.Index(fields=['almacen_destino']),
            models.Index(fields=['producto']),
            models.Index(fields=['tipo_movimiento', 'fecha_movimiento']),
            models.Index(fields=['codigo']),
            models.Index(fields=['origen_tipo', 'origen_id']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.tipo_movimiento.nombre} - {self.producto.nombre}"

    @staticmethod
    def generar_codigo():
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        return ConsecutivoConfig.obtener_siguiente_consecutivo('MOVIMIENTO_INV')

    def calcular_costo_total(self):
        self.costo_total = self.cantidad * self.costo_unitario
        return self.costo_total

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            self.codigo = self.generar_codigo()
        self.calcular_costo_total()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if self.tipo_movimiento:
            if self.tipo_movimiento.requiere_origen and not self.almacen_origen:
                raise ValidationError({
                    'almacen_origen': (
                        f'El tipo de movimiento {self.tipo_movimiento.nombre} '
                        f'requiere almacén origen'
                    )
                })
            if self.tipo_movimiento.requiere_destino and not self.almacen_destino:
                raise ValidationError({
                    'almacen_destino': (
                        f'El tipo de movimiento {self.tipo_movimiento.nombre} '
                        f'requiere almacén destino'
                    )
                })


class Kardex(TenantModel):
    """Registro histórico consolidado de entradas, salidas y saldos."""

    inventario = models.ForeignKey(
        Inventario,
        on_delete=models.CASCADE,
        related_name='kardex_registros',
        verbose_name='Inventario',
    )
    movimiento = models.ForeignKey(
        MovimientoInventario,
        on_delete=models.PROTECT,
        related_name='kardex_registros',
        verbose_name='Movimiento',
    )
    fecha = models.DateTimeField(db_index=True, verbose_name='Fecha')

    cantidad_entrada = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal('0.000'),
        verbose_name='Cantidad entrada',
    )
    cantidad_salida = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal('0.000'),
        verbose_name='Cantidad salida',
    )
    saldo_cantidad = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal('0.000'),
        verbose_name='Saldo cantidad',
    )

    costo_entrada = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0.00'),
        verbose_name='Costo entrada',
    )
    costo_salida = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0.00'),
        verbose_name='Costo salida',
    )
    saldo_costo = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0.00'),
        verbose_name='Saldo costo',
    )
    costo_unitario = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        verbose_name='Costo unitario',
    )

    class Meta:
        db_table = 'supply_chain_kardex'
        verbose_name = 'Kardex'
        verbose_name_plural = 'Kardex'
        ordering = ['inventario', 'fecha']
        indexes = [
            models.Index(fields=['inventario', 'fecha']),
            models.Index(fields=['movimiento']),
            models.Index(fields=['fecha']),
        ]

    def __str__(self):
        return (
            f"Kardex {self.inventario.producto.nombre} - "
            f"{self.fecha.strftime('%Y-%m-%d %H:%M')}"
        )


class AlertaStock(TenantModel):
    """Alertas automáticas de inventario (stock mínimo, vencimiento, etc.)."""

    CRITICIDAD_CHOICES = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('CRITICA', 'Crítica'),
    ]

    almacen = models.ForeignKey(
        'catalogos.Almacen',
        on_delete=models.PROTECT,
        related_name='alertas_stock',
        verbose_name='Almacén',
    )
    inventario = models.ForeignKey(
        Inventario,
        on_delete=models.CASCADE,
        related_name='alertas',
        verbose_name='Inventario',
    )
    tipo_alerta = models.ForeignKey(
        TipoAlerta,
        on_delete=models.PROTECT,
        related_name='alertas',
        verbose_name='Tipo de alerta',
    )

    fecha_generacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de generación')
    fecha_lectura = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de lectura')
    fecha_resolucion = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de resolución')

    mensaje = models.TextField(verbose_name='Mensaje de alerta')
    criticidad = models.CharField(
        max_length=10, choices=CRITICIDAD_CHOICES, default='MEDIA',
        verbose_name='Criticidad',
    )

    leida = models.BooleanField(default=False, db_index=True, verbose_name='Leída')
    resuelta = models.BooleanField(default=False, db_index=True, verbose_name='Resuelta')

    resuelta_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sc_alertas_resueltas',
        verbose_name='Resuelta por',
    )
    observaciones = models.TextField(
        blank=True, default='', verbose_name='Observaciones de resolución',
    )

    class Meta:
        db_table = 'supply_chain_alerta_stock'
        verbose_name = 'Alerta de Stock'
        verbose_name_plural = 'Alertas de Stock'
        ordering = ['-fecha_generacion']
        indexes = [
            models.Index(fields=['almacen']),
            models.Index(fields=['inventario']),
            models.Index(fields=['tipo_alerta']),
            models.Index(fields=['leida', 'resuelta']),
            models.Index(fields=['criticidad']),
        ]

    def __str__(self):
        return f"Alerta {self.tipo_alerta.nombre} - {self.inventario.producto.nombre}"

    def marcar_como_leida(self, usuario=None):
        self.leida = True
        self.fecha_lectura = timezone.now()
        self.save(update_fields=['leida', 'fecha_lectura', 'updated_at'])

    def resolver(self, usuario, observaciones=''):
        self.resuelta = True
        self.fecha_resolucion = timezone.now()
        self.resuelta_por = usuario
        self.observaciones = observaciones
        self.save(update_fields=[
            'resuelta', 'fecha_resolucion', 'resuelta_por', 'observaciones', 'updated_at',
        ])


class ConfiguracionStock(TenantModel):
    """Configuración de umbrales por producto/almacén (stock mín/máx/reorden)."""

    almacen = models.ForeignKey(
        'catalogos.Almacen',
        on_delete=models.PROTECT,
        related_name='configuraciones_stock',
        verbose_name='Almacén',
    )
    producto = models.ForeignKey(
        'catalogo_productos.Producto',
        on_delete=models.PROTECT,
        related_name='configuraciones_stock',
        verbose_name='Producto',
    )

    stock_minimo = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal('0.000'),
        verbose_name='Stock mínimo',
    )
    stock_maximo = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal('0.000'),
        verbose_name='Stock máximo',
    )
    punto_reorden = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal('0.000'),
        verbose_name='Punto de reorden',
    )

    dias_alerta_vencimiento = models.IntegerField(
        default=30, verbose_name='Días de alerta vencimiento',
    )
    lead_time_dias = models.IntegerField(default=7, verbose_name='Lead time (días)')
    cantidad_economica_pedido = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True,
        verbose_name='Cantidad económica de pedido (EOQ)',
    )

    activo = models.BooleanField(default=True, db_index=True, verbose_name='Activo')

    class Meta:
        db_table = 'supply_chain_configuracion_stock'
        verbose_name = 'Configuración de Stock'
        verbose_name_plural = 'Configuraciones de Stock'
        unique_together = [['almacen', 'producto']]
        ordering = ['almacen', 'producto']
        indexes = [
            models.Index(fields=['almacen']),
            models.Index(fields=['producto']),
            models.Index(fields=['activo']),
        ]

    def __str__(self):
        return f"{self.producto.nombre} - {self.almacen.nombre}"

    @property
    def requiere_reorden(self):
        try:
            inventario_actual = Inventario.objects.filter(
                almacen=self.almacen,
                producto=self.producto,
            ).aggregate(total=models.Sum('cantidad_disponible'))['total'] or 0
            return inventario_actual <= self.punto_reorden
        except (TypeError, ValueError, AttributeError):
            return False

    def clean(self):
        super().clean()
        if self.stock_minimo > self.punto_reorden:
            raise ValidationError({
                'punto_reorden': 'El punto de reorden debe ser mayor o igual al stock mínimo',
            })
        if self.punto_reorden > self.stock_maximo:
            raise ValidationError({
                'stock_maximo': 'El stock máximo debe ser mayor o igual al punto de reorden',
            })
