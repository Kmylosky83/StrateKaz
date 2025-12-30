"""
Modelos para Gestión de Almacenamiento e Inventario - Supply Chain
Sistema de Gestión Grasas y Huesos del Norte

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.
Sección 6.4 de DATABASE-ARCHITECTURE.md
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import timedelta
from apps.supply_chain.catalogos.models import UnidadMedida


# ==============================================================================
# MODELOS DE CATÁLOGO DINÁMICO
# ==============================================================================

class TipoMovimientoInventario(models.Model):
    """
    Tipo de movimiento de inventario (dinámico).
    Ejemplos: ENTRADA, SALIDA, AJUSTE, TRASLADO, DEVOLUCION
    """
    AFECTACION_CHOICES = [
        ('POSITIVO', 'Aumenta Stock (+)'),
        ('NEGATIVO', 'Disminuye Stock (-)'),
        ('NEUTRO', 'Sin Afectación (0)'),
    ]

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de movimiento (ej: ENTRADA, SALIDA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del tipo de movimiento'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    afecta_stock = models.CharField(
        max_length=10,
        choices=AFECTACION_CHOICES,
        default='NEUTRO',
        verbose_name='Afectación al stock',
        help_text='Cómo afecta este movimiento al inventario'
    )
    requiere_origen = models.BooleanField(
        default=False,
        verbose_name='Requiere almacén origen',
        help_text='Indica si requiere especificar almacén de origen'
    )
    requiere_destino = models.BooleanField(
        default=True,
        verbose_name='Requiere almacén destino',
        help_text='Indica si requiere especificar almacén de destino'
    )
    requiere_documento = models.BooleanField(
        default=False,
        verbose_name='Requiere documento',
        help_text='Indica si requiere número de documento soporte'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_tipo_movimiento_inventario'
        verbose_name = 'Tipo de Movimiento de Inventario'
        verbose_name_plural = 'Tipos de Movimiento de Inventario'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre

    @property
    def signo_afectacion(self):
        """Retorna el signo de afectación (+, -, 0)"""
        return {
            'POSITIVO': '+',
            'NEGATIVO': '-',
            'NEUTRO': '0'
        }.get(self.afecta_stock, '0')


class EstadoInventario(models.Model):
    """
    Estado del inventario (dinámico).
    Ejemplos: DISPONIBLE, RESERVADO, BLOQUEADO, EN_TRANSITO, DAÑADO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del estado (ej: DISPONIBLE, BLOQUEADO)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    permite_uso = models.BooleanField(
        default=True,
        verbose_name='Permite uso',
        help_text='Indica si el inventario en este estado puede ser usado'
    )
    color_hex = models.CharField(
        max_length=7,
        default='#6B7280',
        verbose_name='Color hexadecimal',
        help_text='Color para visualización en UI (ej: #10B981)'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_estado_inventario'
        verbose_name = 'Estado de Inventario'
        verbose_name_plural = 'Estados de Inventario'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class TipoAlerta(models.Model):
    """
    Tipo de alerta de inventario (dinámico).
    Ejemplos: STOCK_MINIMO, STOCK_MAXIMO, VENCIMIENTO, REORDEN, OBSOLESCENCIA
    """
    PRIORIDAD_CHOICES = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('CRITICA', 'Crítica'),
    ]

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de alerta (ej: STOCK_MINIMO)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    prioridad = models.CharField(
        max_length=10,
        choices=PRIORIDAD_CHOICES,
        default='MEDIA',
        verbose_name='Prioridad'
    )
    color_hex = models.CharField(
        max_length=7,
        default='#F59E0B',
        verbose_name='Color hexadecimal',
        help_text='Color para visualización en UI'
    )
    dias_anticipacion = models.IntegerField(
        default=0,
        verbose_name='Días de anticipación',
        help_text='Días antes del evento para generar la alerta'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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

class Inventario(models.Model):
    """
    Inventario - Stock actual por almacén/producto.
    Registro principal del stock disponible en cada ubicación.
    """
    # Relación con empresa (multi-tenant)
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.PROTECT,
        related_name='inventarios',
        verbose_name='Empresa',
        help_text='Empresa propietaria del inventario'
    )

    # Almacén (referencia al modelo de catálogos)
    almacen = models.ForeignKey(
        'catalogos.Almacen',
        on_delete=models.PROTECT,
        related_name='inventarios',
        verbose_name='Almacén',
        help_text='Almacén donde se encuentra el inventario'
    )

    # Producto - Referencia flexible (puede ser materia prima o producto)
    # Por ahora usamos campos de texto, luego se puede refactorizar a FK
    producto_codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código de producto',
        help_text='Código único del producto/materia prima'
    )
    producto_nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de producto',
        help_text='Nombre descriptivo del producto'
    )
    producto_tipo = models.CharField(
        max_length=30,
        choices=[
            ('MATERIA_PRIMA', 'Materia Prima'),
            ('PRODUCTO_TERMINADO', 'Producto Terminado'),
            ('PRODUCTO_PROCESO', 'Producto en Proceso'),
            ('INSUMO', 'Insumo'),
            ('REPUESTO', 'Repuesto'),
        ],
        default='MATERIA_PRIMA',
        verbose_name='Tipo de producto'
    )

    # Lote y trazabilidad
    lote = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Lote',
        help_text='Número de lote para trazabilidad'
    )
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de vencimiento'
    )
    fecha_ingreso = models.DateTimeField(
        default=timezone.now,
        verbose_name='Fecha de ingreso'
    )

    # Cantidades
    cantidad_disponible = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        verbose_name='Cantidad disponible',
        help_text='Cantidad que puede ser usada inmediatamente'
    )
    cantidad_reservada = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        verbose_name='Cantidad reservada',
        help_text='Cantidad reservada para pedidos u órdenes'
    )
    cantidad_en_transito = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        verbose_name='Cantidad en tránsito',
        help_text='Cantidad en proceso de traslado'
    )

    # Unidad de medida
    unidad_medida = models.ForeignKey(
        UnidadMedida,
        on_delete=models.PROTECT,
        related_name='inventarios',
        verbose_name='Unidad de medida'
    )

    # Costos
    costo_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Costo unitario',
        help_text='Último costo de adquisición'
    )
    costo_promedio = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Costo promedio ponderado',
        help_text='Costo promedio calculado automáticamente'
    )
    valor_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        editable=False,
        verbose_name='Valor total del inventario'
    )

    # Estado
    estado = models.ForeignKey(
        EstadoInventario,
        on_delete=models.PROTECT,
        related_name='inventarios',
        verbose_name='Estado'
    )

    # Ubicación física
    ubicacion_fisica = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Ubicación física',
        help_text='Ej: Estante A-1-3, Pasillo 2 Nivel 3'
    )
    zona = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Zona',
        help_text='Zona o sección del almacén'
    )

    # Metadatos
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_inventario'
        verbose_name = 'Inventario'
        verbose_name_plural = 'Inventarios'
        ordering = ['-updated_at']
        unique_together = [['almacen', 'producto_codigo', 'lote', 'estado']]
        indexes = [
            models.Index(fields=['empresa', 'almacen']),
            models.Index(fields=['producto_codigo']),
            models.Index(fields=['lote']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.producto_nombre} - {self.almacen.nombre} ({self.cantidad_disponible} {self.unidad_medida.simbolo})"

    @property
    def cantidad_total(self):
        """Cantidad total (disponible + reservada + en tránsito)"""
        return self.cantidad_disponible + self.cantidad_reservada + self.cantidad_en_transito

    @property
    def esta_vencido(self):
        """Verifica si el inventario está vencido"""
        if self.fecha_vencimiento:
            return self.fecha_vencimiento < timezone.now().date()
        return False

    @property
    def dias_para_vencer(self):
        """Días restantes para vencimiento"""
        if self.fecha_vencimiento:
            delta = self.fecha_vencimiento - timezone.now().date()
            return delta.days
        return None

    def calcular_valor_total(self):
        """Calcula el valor total del inventario"""
        self.valor_total = self.cantidad_disponible * self.costo_promedio
        return self.valor_total

    def actualizar_costo_promedio(self, cantidad_nueva, costo_nuevo):
        """
        Actualiza el costo promedio ponderado con un nuevo ingreso.
        Fórmula: (Valor_Anterior + Valor_Nuevo) / (Cantidad_Anterior + Cantidad_Nueva)
        """
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


class MovimientoInventario(models.Model):
    """
    Movimiento de Inventario - Registro de todos los movimientos.
    Cada transacción que afecte el inventario genera un registro aquí.
    """
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.PROTECT,
        related_name='movimientos_inventario',
        verbose_name='Empresa'
    )

    almacen_origen = models.ForeignKey(
        'catalogos.Almacen',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='movimientos_salida',
        verbose_name='Almacén origen'
    )
    almacen_destino = models.ForeignKey(
        'catalogos.Almacen',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='movimientos_entrada',
        verbose_name='Almacén destino'
    )

    codigo = models.CharField(
        max_length=30,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código de movimiento',
        help_text='Código autogenerado del movimiento'
    )
    tipo_movimiento = models.ForeignKey(
        TipoMovimientoInventario,
        on_delete=models.PROTECT,
        related_name='movimientos',
        verbose_name='Tipo de movimiento'
    )

    fecha_movimiento = models.DateTimeField(
        default=timezone.now,
        verbose_name='Fecha de movimiento'
    )

    producto_codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código de producto'
    )
    producto_nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de producto'
    )
    lote = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Lote'
    )

    cantidad = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Cantidad'
    )
    unidad_medida = models.ForeignKey(
        UnidadMedida,
        on_delete=models.PROTECT,
        related_name='movimientos',
        verbose_name='Unidad de medida'
    )
    costo_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Costo unitario'
    )
    costo_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        editable=False,
        verbose_name='Costo total'
    )

    documento_referencia = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Documento de referencia',
        help_text='Número de orden de compra, recepción, etc.'
    )

    origen_tipo = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Tipo de origen',
        help_text='Tipo de entidad origen (RECEPCION, PRODUCCION, AJUSTE, etc.)'
    )
    origen_id = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name='ID de origen',
        help_text='ID de la entidad origen'
    )

    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='sc_movimientos_inventario',
        verbose_name='Registrado por'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'supply_chain_movimiento_inventario'
        verbose_name = 'Movimiento de Inventario'
        verbose_name_plural = 'Movimientos de Inventario'
        ordering = ['-fecha_movimiento', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'almacen_destino']),
            models.Index(fields=['producto_codigo']),
            models.Index(fields=['tipo_movimiento', 'fecha_movimiento']),
            models.Index(fields=['codigo']),
            models.Index(fields=['origen_tipo', 'origen_id']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.tipo_movimiento.nombre} - {self.producto_nombre}"

    @staticmethod
    def generar_codigo():
        """Genera código único para el movimiento"""
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        from datetime import datetime

        try:
            return ConsecutivoConfig.obtener_siguiente_consecutivo('MOVIMIENTO_INV')
        except:
            hoy = datetime.now()
            prefijo = f"MOV-{hoy.strftime('%Y%m%d')}-"
            ultimo = MovimientoInventario.objects.filter(
                codigo__startswith=prefijo
            ).order_by('-codigo').first()

            if ultimo and ultimo.codigo:
                try:
                    numero = int(ultimo.codigo.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1

            return f"{prefijo}{numero:05d}"

    def calcular_costo_total(self):
        """Calcula el costo total del movimiento"""
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
                    'almacen_origen': f'El tipo de movimiento {self.tipo_movimiento.nombre} requiere almacén origen'
                })
            if self.tipo_movimiento.requiere_destino and not self.almacen_destino:
                raise ValidationError({
                    'almacen_destino': f'El tipo de movimiento {self.tipo_movimiento.nombre} requiere almacén destino'
                })


class Kardex(models.Model):
    """
    Kardex - Vista consolidada de movimientos por inventario.
    Registro histórico de entradas, salidas y saldos.
    """
    inventario = models.ForeignKey(
        Inventario,
        on_delete=models.CASCADE,
        related_name='kardex_registros',
        verbose_name='Inventario'
    )

    movimiento = models.ForeignKey(
        MovimientoInventario,
        on_delete=models.PROTECT,
        related_name='kardex_registros',
        verbose_name='Movimiento'
    )

    fecha = models.DateTimeField(
        db_index=True,
        verbose_name='Fecha'
    )

    cantidad_entrada = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        verbose_name='Cantidad entrada'
    )
    cantidad_salida = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        verbose_name='Cantidad salida'
    )
    saldo_cantidad = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        verbose_name='Saldo cantidad'
    )

    costo_entrada = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name='Costo entrada'
    )
    costo_salida = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name='Costo salida'
    )
    saldo_costo = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name='Saldo costo'
    )
    costo_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Costo unitario'
    )

    created_at = models.DateTimeField(auto_now_add=True)

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
        return f"Kardex {self.inventario.producto_nombre} - {self.fecha.strftime('%Y-%m-%d %H:%M')}"


class AlertaStock(models.Model):
    """
    Alerta de Stock - Alertas automáticas de inventario.
    Generadas por reglas de negocio (stock mínimo, vencimiento, etc.)
    """
    CRITICIDAD_CHOICES = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('CRITICA', 'Crítica'),
    ]

    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.PROTECT,
        related_name='alertas_stock',
        verbose_name='Empresa'
    )

    almacen = models.ForeignKey(
        'catalogos.Almacen',
        on_delete=models.PROTECT,
        related_name='alertas_stock',
        verbose_name='Almacén'
    )
    inventario = models.ForeignKey(
        Inventario,
        on_delete=models.CASCADE,
        related_name='alertas',
        verbose_name='Inventario'
    )

    tipo_alerta = models.ForeignKey(
        TipoAlerta,
        on_delete=models.PROTECT,
        related_name='alertas',
        verbose_name='Tipo de alerta'
    )

    fecha_generacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de generación'
    )
    fecha_lectura = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de lectura'
    )
    fecha_resolucion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de resolución'
    )

    mensaje = models.TextField(
        verbose_name='Mensaje de alerta'
    )
    criticidad = models.CharField(
        max_length=10,
        choices=CRITICIDAD_CHOICES,
        default='MEDIA',
        verbose_name='Criticidad'
    )

    leida = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name='Leída'
    )
    resuelta = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name='Resuelta'
    )

    resuelta_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sc_alertas_resueltas',
        verbose_name='Resuelta por'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones de resolución'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_alerta_stock'
        verbose_name = 'Alerta de Stock'
        verbose_name_plural = 'Alertas de Stock'
        ordering = ['-fecha_generacion']
        indexes = [
            models.Index(fields=['empresa', 'almacen']),
            models.Index(fields=['inventario']),
            models.Index(fields=['tipo_alerta']),
            models.Index(fields=['leida', 'resuelta']),
            models.Index(fields=['criticidad']),
        ]

    def __str__(self):
        return f"Alerta {self.tipo_alerta.nombre} - {self.inventario.producto_nombre}"

    def marcar_como_leida(self, usuario=None):
        """Marca la alerta como leída"""
        self.leida = True
        self.fecha_lectura = timezone.now()
        self.save(update_fields=['leida', 'fecha_lectura', 'updated_at'])

    def resolver(self, usuario, observaciones=''):
        """Resuelve la alerta"""
        self.resuelta = True
        self.fecha_resolucion = timezone.now()
        self.resuelta_por = usuario
        self.observaciones = observaciones
        self.save(update_fields=['resuelta', 'fecha_resolucion', 'resuelta_por', 'observaciones', 'updated_at'])


class ConfiguracionStock(models.Model):
    """
    Configuración de Stock - Configuración de umbrales por producto/almacén.
    Define los parámetros para alertas automáticas.
    """
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.PROTECT,
        related_name='configuraciones_stock',
        verbose_name='Empresa'
    )

    almacen = models.ForeignKey(
        'catalogos.Almacen',
        on_delete=models.PROTECT,
        related_name='configuraciones_stock',
        verbose_name='Almacén'
    )

    producto_codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código de producto'
    )
    producto_nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de producto'
    )

    stock_minimo = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        verbose_name='Stock mínimo',
        help_text='Cantidad mínima que debe mantenerse en inventario'
    )
    stock_maximo = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        verbose_name='Stock máximo',
        help_text='Cantidad máxima permitida en inventario'
    )
    punto_reorden = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        verbose_name='Punto de reorden',
        help_text='Nivel de stock que dispara una orden de compra'
    )

    dias_alerta_vencimiento = models.IntegerField(
        default=30,
        verbose_name='Días de alerta vencimiento',
        help_text='Días antes del vencimiento para generar alerta'
    )

    lead_time_dias = models.IntegerField(
        default=7,
        verbose_name='Lead time (días)',
        help_text='Tiempo de entrega desde que se solicita hasta que llega'
    )

    cantidad_economica_pedido = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name='Cantidad económica de pedido (EOQ)',
        help_text='Cantidad óptima a pedir según modelo EOQ'
    )

    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_configuracion_stock'
        verbose_name = 'Configuración de Stock'
        verbose_name_plural = 'Configuraciones de Stock'
        unique_together = [['almacen', 'producto_codigo']]
        ordering = ['almacen', 'producto_nombre']
        indexes = [
            models.Index(fields=['empresa', 'almacen']),
            models.Index(fields=['producto_codigo']),
            models.Index(fields=['activo']),
        ]

    def __str__(self):
        return f"{self.producto_nombre} - {self.almacen.nombre}"

    @property
    def requiere_reorden(self):
        """Verifica si el stock actual está en punto de reorden"""
        try:
            inventario_actual = Inventario.objects.filter(
                almacen=self.almacen,
                producto_codigo=self.producto_codigo
            ).aggregate(
                total=models.Sum('cantidad_disponible')
            )['total'] or 0

            return inventario_actual <= self.punto_reorden
        except:
            return False

    def clean(self):
        super().clean()
        if self.stock_minimo > self.punto_reorden:
            raise ValidationError({
                'punto_reorden': 'El punto de reorden debe ser mayor o igual al stock mínimo'
            })
        if self.punto_reorden > self.stock_maximo:
            raise ValidationError({
                'stock_maximo': 'El stock máximo debe ser mayor o igual al punto de reorden'
            })
