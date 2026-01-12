"""
Modelos para Gestión de Compras - Supply Chain
Sistema de Gestión StrateKaz

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.

Gestiona:
- Requisiciones de compra internas
- Cotizaciones de proveedores
- Evaluación de cotizaciones
- Órdenes de compra
- Contratos con proveedores
- Recepción de materiales/productos
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal


# ==============================================================================
# MODELOS DE CATÁLOGO DINÁMICO
# ==============================================================================

class EstadoRequisicion(models.Model):
    """
    Estado de requisición de compra (dinámico).
    Ejemplos: BORRADOR, ENVIADA, APROBADA, RECHAZADA, COMPLETADA
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del estado (ej: BORRADOR, ENVIADA, APROBADA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del estado'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    permite_edicion = models.BooleanField(
        default=True,
        verbose_name='Permite edición',
        help_text='Indica si la requisición puede editarse en este estado'
    )
    es_estado_inicial = models.BooleanField(
        default=False,
        verbose_name='Es estado inicial',
        help_text='Estado por defecto para nuevas requisiciones'
    )
    es_estado_final = models.BooleanField(
        default=False,
        verbose_name='Es estado final',
        help_text='Indica que la requisición ha terminado su ciclo'
    )
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)',
        help_text='Color para identificación visual (ej: #28A745)'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_estado_requisicion'
        verbose_name = 'Estado de Requisición'
        verbose_name_plural = 'Estados de Requisición'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class EstadoCotizacion(models.Model):
    """
    Estado de cotización (dinámico).
    Ejemplos: SOLICITADA, RECIBIDA, EVALUADA, SELECCIONADA, DESCARTADA
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
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
    permite_evaluacion = models.BooleanField(
        default=False,
        verbose_name='Permite evaluación',
        help_text='Indica si se puede evaluar la cotización en este estado'
    )
    es_estado_inicial = models.BooleanField(default=False)
    es_estado_final = models.BooleanField(default=False)
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_estado_cotizacion'
        verbose_name = 'Estado de Cotización'
        verbose_name_plural = 'Estados de Cotización'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class EstadoOrdenCompra(models.Model):
    """
    Estado de orden de compra (dinámico).
    Ejemplos: BORRADOR, ENVIADA, APROBADA, RECIBIDA_PARCIAL, RECIBIDA_TOTAL, CANCELADA
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
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
    permite_edicion = models.BooleanField(
        default=True,
        verbose_name='Permite edición'
    )
    permite_recepcion = models.BooleanField(
        default=False,
        verbose_name='Permite recepción',
        help_text='Indica si se puede registrar recepción de materiales'
    )
    es_estado_inicial = models.BooleanField(default=False)
    es_estado_final = models.BooleanField(default=False)
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_estado_orden_compra'
        verbose_name = 'Estado de Orden de Compra'
        verbose_name_plural = 'Estados de Orden de Compra'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class TipoContrato(models.Model):
    """
    Tipo de contrato con proveedores (dinámico).
    Ejemplos: SUMINISTRO, SERVICIO, MIXTO, MARCO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo (ej: SUMINISTRO, SERVICIO)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de contrato'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    requiere_entregables = models.BooleanField(
        default=False,
        verbose_name='Requiere entregables',
        help_text='Indica si este tipo de contrato requiere definir entregables'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_tipo_contrato'
        verbose_name = 'Tipo de Contrato'
        verbose_name_plural = 'Tipos de Contrato'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class PrioridadRequisicion(models.Model):
    """
    Prioridad de requisición (dinámico).
    Ejemplos: BAJA, MEDIA, ALTA, URGENTE
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
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
    nivel = models.PositiveIntegerField(
        verbose_name='Nivel de prioridad',
        help_text='1=Más baja, valores mayores=Mayor prioridad'
    )
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_prioridad_requisicion'
        verbose_name = 'Prioridad de Requisición'
        verbose_name_plural = 'Prioridades de Requisición'
        ordering = ['-nivel', 'nombre']

    def __str__(self):
        return self.nombre


class Moneda(models.Model):
    """
    Moneda para transacciones (dinámico).
    Ejemplos: COP, USD, EUR
    """
    codigo = models.CharField(
        max_length=10,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código ISO de la moneda (ej: COP, USD, EUR)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre de la moneda (ej: Peso Colombiano)'
    )
    simbolo = models.CharField(
        max_length=5,
        verbose_name='Símbolo',
        help_text='Símbolo de la moneda (ej: $, US$, €)'
    )
    es_moneda_base = models.BooleanField(
        default=False,
        verbose_name='Es moneda base',
        help_text='Moneda principal del sistema'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_moneda'
        verbose_name = 'Moneda'
        verbose_name_plural = 'Monedas'
        ordering = ['orden', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class EstadoContrato(models.Model):
    """
    Estado de contrato (dinámico).
    Ejemplos: VIGENTE, VENCIDO, TERMINADO, SUSPENDIDO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
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
    permite_ordenes = models.BooleanField(
        default=False,
        verbose_name='Permite órdenes',
        help_text='Indica si se pueden generar órdenes con este estado'
    )
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_estado_contrato'
        verbose_name = 'Estado de Contrato'
        verbose_name_plural = 'Estados de Contrato'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class EstadoMaterial(models.Model):
    """
    Estado del material recibido (dinámico).
    Ejemplos: CONFORME, NO_CONFORME, PARCIAL, PENDIENTE_REVISION
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
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
    requiere_accion = models.BooleanField(
        default=False,
        verbose_name='Requiere acción',
        help_text='Indica si este estado requiere acciones correctivas'
    )
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_estado_material'
        verbose_name = 'Estado de Material'
        verbose_name_plural = 'Estados de Material'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


# ==============================================================================
# MODELOS PRINCIPALES
# ==============================================================================

class Requisicion(models.Model):
    """
    Requisición de compra interna.

    Solicitud generada por áreas que requieren productos o servicios.
    Inicia el proceso de compra.
    """
    # Identificación y relaciones con configuración
    codigo = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código',
        help_text='Código autogenerado de la requisición'
    )
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.PROTECT,
        related_name='requisiciones_compra',
        verbose_name='Empresa'
    )
    sede = models.ForeignKey(
        'configuracion.SedeEmpresa',
        on_delete=models.PROTECT,
        related_name='requisiciones_compra',
        verbose_name='Sede'
    )

    # Solicitante
    solicitante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='requisiciones_solicitadas',
        verbose_name='Solicitante',
        help_text='Usuario que solicita la compra'
    )
    area_solicitante = models.CharField(
        max_length=200,
        verbose_name='Área solicitante',
        help_text='Departamento o área que realiza la solicitud'
    )

    # Fechas
    fecha_solicitud = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de solicitud'
    )
    fecha_requerida = models.DateField(
        verbose_name='Fecha requerida',
        help_text='Fecha en la que se necesitan los productos/servicios'
    )

    # Descripción
    justificacion = models.TextField(
        verbose_name='Justificación',
        help_text='Razón de la solicitud de compra'
    )

    # Estado (dinámico)
    estado = models.ForeignKey(
        EstadoRequisicion,
        on_delete=models.PROTECT,
        related_name='requisiciones',
        verbose_name='Estado'
    )

    # Prioridad (dinámico)
    prioridad = models.ForeignKey(
        PrioridadRequisicion,
        on_delete=models.PROTECT,
        related_name='requisiciones',
        verbose_name='Prioridad'
    )

    # Aprobación
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requisiciones_aprobadas',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de aprobación'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )

    # Auditoría
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requisiciones_creadas'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_chain_requisicion'
        verbose_name = 'Requisición de Compra'
        verbose_name_plural = 'Requisiciones de Compra'
        ordering = ['-fecha_solicitud', '-created_at']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['solicitante']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_solicitud']),
            models.Index(fields=['fecha_requerida']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.area_solicitante}"

    @staticmethod
    def generar_codigo():
        """Genera código único de requisición desde gestión documental."""
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        return ConsecutivoConfig.obtener_siguiente_consecutivo('REQUISICION_COMPRA')

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    @property
    def esta_aprobada(self):
        return self.aprobado_por is not None and self.fecha_aprobacion is not None

    @property
    def puede_editar(self):
        return self.estado.permite_edicion if self.estado else True

    @property
    def tiene_cotizaciones(self):
        return self.cotizaciones.exists()

    @property
    def tiene_orden_compra(self):
        return hasattr(self, 'orden_compra') and self.orden_compra is not None

    def aprobar(self, usuario):
        self.aprobado_por = usuario
        self.fecha_aprobacion = timezone.now()
        try:
            estado_aprobada = EstadoRequisicion.objects.get(codigo='APROBADA', is_active=True)
            self.estado = estado_aprobada
        except EstadoRequisicion.DoesNotExist:
            pass
        self.save()

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            self.codigo = self.generar_codigo()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if self.fecha_requerida:
            from datetime import date
            if self.fecha_requerida < date.today():
                raise ValidationError({
                    'fecha_requerida': 'La fecha requerida debe ser igual o posterior a hoy'
                })


class DetalleRequisicion(models.Model):
    """
    Detalle/línea de una requisición de compra.
    """
    requisicion = models.ForeignKey(
        Requisicion,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Requisición'
    )
    producto_servicio = models.CharField(
        max_length=255,
        verbose_name='Producto/Servicio'
    )
    descripcion = models.TextField(
        verbose_name='Descripción detallada'
    )
    cantidad = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Cantidad'
    )
    unidad_medida = models.CharField(
        max_length=50,
        verbose_name='Unidad de medida'
    )
    especificaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Especificaciones técnicas'
    )
    precio_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio estimado'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_detalle_requisicion'
        verbose_name = 'Detalle de Requisición'
        verbose_name_plural = 'Detalles de Requisición'
        ordering = ['id']

    def __str__(self):
        return f"{self.requisicion.codigo} - {self.producto_servicio}"

    @property
    def valor_estimado_total(self):
        if self.precio_estimado and self.cantidad:
            return Decimal(str(self.precio_estimado)) * Decimal(str(self.cantidad))
        return None

    def clean(self):
        super().clean()
        if self.cantidad is not None and self.cantidad <= 0:
            raise ValidationError({'cantidad': 'La cantidad debe ser mayor a cero'})
        if self.precio_estimado is not None and self.precio_estimado < 0:
            raise ValidationError({'precio_estimado': 'El precio estimado no puede ser negativo'})


class Cotizacion(models.Model):
    """
    Cotización recibida de un proveedor.
    """
    requisicion = models.ForeignKey(
        Requisicion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cotizaciones',
        verbose_name='Requisición'
    )
    proveedor = models.ForeignKey(
        'gestion_proveedores.Proveedor',
        on_delete=models.PROTECT,
        related_name='cotizaciones_compras',
        verbose_name='Proveedor'
    )
    numero_cotizacion = models.CharField(
        max_length=100,
        verbose_name='Número de cotización'
    )
    fecha_cotizacion = models.DateField(
        verbose_name='Fecha de cotizacion'
    )
    fecha_vencimiento = models.DateField(
        verbose_name='Fecha de vencimiento'
    )
    moneda = models.ForeignKey(
        Moneda,
        on_delete=models.PROTECT,
        related_name='cotizaciones',
        verbose_name='Moneda'
    )
    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name='Subtotal'
    )
    impuestos = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Impuestos'
    )
    total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name='Total'
    )
    tiempo_entrega_dias = models.PositiveIntegerField(
        verbose_name='Tiempo de entrega (días)'
    )
    condiciones_pago = models.TextField(
        verbose_name='Condiciones de pago'
    )
    archivo_cotizacion = models.FileField(
        upload_to='cotizaciones/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Archivo de cotización'
    )
    estado = models.ForeignKey(
        EstadoCotizacion,
        on_delete=models.PROTECT,
        related_name='cotizaciones',
        verbose_name='Estado'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cotizaciones_creadas'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_chain_cotizacion'
        verbose_name = 'Cotización'
        verbose_name_plural = 'Cotizaciones'
        ordering = ['-fecha_cotizacion', '-created_at']
        indexes = [
            models.Index(fields=['numero_cotizacion']),
            models.Index(fields=['proveedor']),
            models.Index(fields=['requisicion']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_cotizacion']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.numero_cotizacion} - {self.proveedor.nombre_comercial}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    @property
    def esta_vigente(self):
        from datetime import date
        return self.fecha_vencimiento >= date.today()

    @property
    def tiene_evaluacion(self):
        return hasattr(self, 'evaluacion') and self.evaluacion is not None

    @property
    def puede_evaluar(self):
        return self.estado.permite_evaluacion if self.estado else False

    def calcular_total(self):
        self.total = Decimal(str(self.subtotal)) + Decimal(str(self.impuestos))

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def save(self, *args, **kwargs):
        self.calcular_total()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if self.fecha_cotizacion and self.fecha_vencimiento:
            if self.fecha_vencimiento < self.fecha_cotizacion:
                raise ValidationError({
                    'fecha_vencimiento': 'La fecha de vencimiento debe ser posterior a la fecha de cotización'
                })


class EvaluacionCotizacion(models.Model):
    """
    Evaluación de una cotización.
    """
    cotizacion = models.OneToOneField(
        Cotizacion,
        on_delete=models.CASCADE,
        related_name='evaluacion',
        verbose_name='Cotización'
    )
    evaluado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='evaluaciones_cotizaciones',
        verbose_name='Evaluado por'
    )
    fecha_evaluacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de evaluación'
    )
    criterios_evaluacion = models.JSONField(
        verbose_name='Criterios de evaluación'
    )
    puntaje_total = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Puntaje total'
    )
    recomendacion = models.TextField(
        verbose_name='Recomendación'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones adicionales'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_evaluacion_cotizacion'
        verbose_name = 'Evaluación de Cotización'
        verbose_name_plural = 'Evaluaciones de Cotizaciones'
        ordering = ['-fecha_evaluacion']

    def __str__(self):
        return f"Evaluación {self.cotizacion.numero_cotizacion} - {self.puntaje_total}pts"

    def calcular_puntaje(self):
        if self.criterios_evaluacion:
            valores = [v for v in self.criterios_evaluacion.values() if isinstance(v, (int, float))]
            if valores:
                self.puntaje_total = Decimal(str(sum(valores) / len(valores)))
            else:
                self.puntaje_total = Decimal('0.00')

    def save(self, *args, **kwargs):
        self.calcular_puntaje()
        super().save(*args, **kwargs)


class OrdenCompra(models.Model):
    """
    Orden de compra emitida a proveedor.
    """
    numero_orden = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Número de orden'
    )
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.PROTECT,
        related_name='ordenes_compra',
        verbose_name='Empresa'
    )
    sede = models.ForeignKey(
        'configuracion.SedeEmpresa',
        on_delete=models.PROTECT,
        related_name='ordenes_compra',
        verbose_name='Sede'
    )
    requisicion = models.OneToOneField(
        Requisicion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orden_compra',
        verbose_name='Requisición'
    )
    cotizacion = models.ForeignKey(
        Cotizacion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordenes_compra',
        verbose_name='Cotización'
    )
    proveedor = models.ForeignKey(
        'gestion_proveedores.Proveedor',
        on_delete=models.PROTECT,
        related_name='ordenes_compra',
        verbose_name='Proveedor'
    )
    fecha_orden = models.DateField(
        auto_now_add=True,
        verbose_name='Fecha de orden'
    )
    fecha_entrega_esperada = models.DateField(
        verbose_name='Fecha de entrega esperada'
    )
    estado = models.ForeignKey(
        EstadoOrdenCompra,
        on_delete=models.PROTECT,
        related_name='ordenes_compra',
        verbose_name='Estado'
    )
    moneda = models.ForeignKey(
        Moneda,
        on_delete=models.PROTECT,
        related_name='ordenes_compra',
        verbose_name='Moneda'
    )
    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name='Subtotal'
    )
    impuestos = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Impuestos'
    )
    descuento = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Descuento'
    )
    total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name='Total'
    )
    condiciones_pago = models.TextField(
        verbose_name='Condiciones de pago'
    )
    lugar_entrega = models.TextField(
        verbose_name='Lugar de entrega'
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ordenes_compra_creadas',
        verbose_name='Creado por'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordenes_compra_aprobadas',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de aprobación'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_chain_orden_compra'
        verbose_name = 'Orden de Compra'
        verbose_name_plural = 'Órdenes de Compra'
        ordering = ['-fecha_orden', '-created_at']
        indexes = [
            models.Index(fields=['numero_orden']),
            models.Index(fields=['proveedor']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_orden']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.numero_orden} - {self.proveedor.nombre_comercial}"

    @staticmethod
    def generar_numero_orden():
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        try:
            return ConsecutivoConfig.obtener_siguiente_consecutivo('ORDEN_COMPRA')
        except ConsecutivoConfig.DoesNotExist:
            from datetime import date
            hoy = date.today()
            prefijo = f"OC-{hoy.strftime('%Y%m%d')}-"
            ultimo = OrdenCompra.objects.filter(
                numero_orden__startswith=prefijo
            ).order_by('-numero_orden').first()
            if ultimo:
                try:
                    numero = int(ultimo.numero_orden.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1
            return f"{prefijo}{numero:04d}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    @property
    def esta_aprobada(self):
        return self.aprobado_por is not None and self.fecha_aprobacion is not None

    @property
    def puede_editar(self):
        return self.estado.permite_edicion if self.estado else True

    @property
    def puede_recibir(self):
        return self.estado.permite_recepcion if self.estado else False

    @property
    def tiene_recepciones(self):
        return self.recepciones.exists()

    @property
    def porcentaje_recibido(self):
        detalles = self.detalles.all()
        if not detalles:
            return Decimal('0.00')
        total_solicitado = sum(d.cantidad_solicitada for d in detalles)
        total_recibido = sum(d.cantidad_recibida for d in detalles)
        if total_solicitado == 0:
            return Decimal('0.00')
        porcentaje = (Decimal(str(total_recibido)) / Decimal(str(total_solicitado))) * Decimal('100')
        return round(porcentaje, 2)

    def calcular_total(self):
        subtotal = Decimal(str(self.subtotal))
        impuestos = Decimal(str(self.impuestos))
        descuento = Decimal(str(self.descuento))
        self.total = subtotal + impuestos - descuento

    def aprobar(self, usuario):
        self.aprobado_por = usuario
        self.fecha_aprobacion = timezone.now()
        try:
            estado_aprobada = EstadoOrdenCompra.objects.get(codigo='APROBADA', is_active=True)
            self.estado = estado_aprobada
        except EstadoOrdenCompra.DoesNotExist:
            pass
        self.save()

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def save(self, *args, **kwargs):
        if not self.pk and not self.numero_orden:
            self.numero_orden = self.generar_numero_orden()
        self.calcular_total()
        super().save(*args, **kwargs)


class DetalleOrdenCompra(models.Model):
    """
    Detalle/línea de una orden de compra.
    """
    orden_compra = models.ForeignKey(
        OrdenCompra,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Orden de compra'
    )
    producto_servicio = models.CharField(
        max_length=255,
        verbose_name='Producto/Servicio'
    )
    descripcion = models.TextField(
        verbose_name='Descripción'
    )
    cantidad_solicitada = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Cantidad solicitada'
    )
    cantidad_recibida = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=Decimal('0.000'),
        verbose_name='Cantidad recibida'
    )
    unidad_medida = models.CharField(
        max_length=50,
        verbose_name='Unidad de medida'
    )
    precio_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Precio unitario'
    )
    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False,
        verbose_name='Subtotal'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_detalle_orden_compra'
        verbose_name = 'Detalle de Orden de Compra'
        verbose_name_plural = 'Detalles de Orden de Compra'
        ordering = ['id']

    def __str__(self):
        return f"{self.orden_compra.numero_orden} - {self.producto_servicio}"

    @property
    def cantidad_pendiente(self):
        return Decimal(str(self.cantidad_solicitada)) - Decimal(str(self.cantidad_recibida))

    @property
    def porcentaje_recibido(self):
        if self.cantidad_solicitada == 0:
            return Decimal('0.00')
        porcentaje = (Decimal(str(self.cantidad_recibida)) / Decimal(str(self.cantidad_solicitada))) * Decimal('100')
        return round(porcentaje, 2)

    @property
    def esta_completo(self):
        return self.cantidad_recibida >= self.cantidad_solicitada

    def calcular_subtotal(self):
        if self.precio_unitario and self.cantidad_solicitada:
            self.subtotal = Decimal(str(self.precio_unitario)) * Decimal(str(self.cantidad_solicitada))

    def save(self, *args, **kwargs):
        self.calcular_subtotal()
        super().save(*args, **kwargs)


class Contrato(models.Model):
    """
    Contrato con proveedor.
    """
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.PROTECT,
        related_name='contratos_proveedores',
        verbose_name='Empresa'
    )
    proveedor = models.ForeignKey(
        'gestion_proveedores.Proveedor',
        on_delete=models.PROTECT,
        related_name='contratos',
        verbose_name='Proveedor'
    )
    tipo_contrato = models.ForeignKey(
        TipoContrato,
        on_delete=models.PROTECT,
        related_name='contratos',
        verbose_name='Tipo de contrato'
    )
    numero_contrato = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Número de contrato'
    )
    objeto = models.TextField(
        verbose_name='Objeto del contrato'
    )
    fecha_inicio = models.DateField(
        verbose_name='Fecha de inicio'
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha de finalización'
    )
    valor_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name='Valor total del contrato'
    )
    moneda = models.ForeignKey(
        Moneda,
        on_delete=models.PROTECT,
        related_name='contratos',
        verbose_name='Moneda'
    )
    condiciones = models.TextField(
        verbose_name='Condiciones contractuales'
    )
    archivo_contrato = models.FileField(
        upload_to='contratos/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Archivo del contrato'
    )
    estado = models.ForeignKey(
        EstadoContrato,
        on_delete=models.PROTECT,
        related_name='contratos',
        verbose_name='Estado'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='contratos_responsable',
        verbose_name='Responsable'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contratos_creados'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_chain_contrato'
        verbose_name = 'Contrato de Proveedor'
        verbose_name_plural = 'Contratos de Proveedores'
        ordering = ['-fecha_inicio', '-created_at']
        indexes = [
            models.Index(fields=['numero_contrato']),
            models.Index(fields=['proveedor']),
            models.Index(fields=['estado']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.numero_contrato} - {self.proveedor.nombre_comercial}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    @property
    def esta_vigente(self):
        from datetime import date
        hoy = date.today()
        return self.fecha_inicio <= hoy <= self.fecha_fin

    @property
    def dias_restantes(self):
        from datetime import date
        if not self.esta_vigente:
            return 0
        delta = self.fecha_fin - date.today()
        return delta.days

    @property
    def puede_generar_ordenes(self):
        return self.estado.permite_ordenes if self.estado else False

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])


class RecepcionCompra(models.Model):
    """
    Registro de recepción de materiales/productos.
    """
    orden_compra = models.ForeignKey(
        OrdenCompra,
        on_delete=models.PROTECT,
        related_name='recepciones',
        verbose_name='Orden de compra'
    )
    numero_remision = models.CharField(
        max_length=100,
        verbose_name='Número de remisión'
    )
    fecha_recepcion = models.DateTimeField(
        verbose_name='Fecha de recepción'
    )
    recibido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='recepciones_realizadas',
        verbose_name='Recibido por'
    )
    cantidad_recibida = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Cantidad recibida'
    )
    estado_material = models.ForeignKey(
        EstadoMaterial,
        on_delete=models.PROTECT,
        related_name='recepciones',
        verbose_name='Estado del material'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )
    genera_movimiento_inventario = models.BooleanField(
        default=True,
        verbose_name='Genera movimiento de inventario'
    )
    numero_movimiento_inventario = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número de movimiento'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_chain_recepcion_compra'
        verbose_name = 'Recepción de Compra'
        verbose_name_plural = 'Recepciones de Compra'
        ordering = ['-fecha_recepcion', '-created_at']
        indexes = [
            models.Index(fields=['orden_compra']),
            models.Index(fields=['numero_remision']),
            models.Index(fields=['fecha_recepcion']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"Recepción {self.numero_remision} - OC {self.orden_compra.numero_orden}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    @property
    def material_conforme(self):
        return self.estado_material.codigo == 'CONFORME' if self.estado_material else False

    @property
    def requiere_accion(self):
        return self.estado_material.requiere_accion if self.estado_material else False

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def clean(self):
        super().clean()
        if self.cantidad_recibida is not None and self.cantidad_recibida <= 0:
            raise ValidationError({'cantidad_recibida': 'La cantidad recibida debe ser mayor a cero'})
        if self.orden_compra and not self.orden_compra.puede_recibir:
            raise ValidationError({
                'orden_compra': f'La orden {self.orden_compra.numero_orden} no está en un estado que permita recepción'
            })
