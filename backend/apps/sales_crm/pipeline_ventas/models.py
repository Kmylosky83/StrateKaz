"""
Modelos para Pipeline de Ventas - Sales CRM
Sistema dinámico de gestión de oportunidades, cotizaciones y seguimiento de ventas
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.core.base_models.base import BaseCompanyModel, OrderedModel
from decimal import Decimal
from datetime import timedelta


class EtapaVenta(OrderedModel):
    """
    Catálogo dinámico de etapas del pipeline de ventas
    Define el flujo de estados por los que pasa una oportunidad
    """

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la etapa (ej: PROSPECTO, CALIFICADO, PROPUESTA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la etapa'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de la etapa'
    )
    color = models.CharField(
        max_length=7,
        default='#6c757d',
        verbose_name='Color',
        help_text='Color hexadecimal para visualización en el pipeline (ej: #28a745)'
    )
    probabilidad_cierre = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        default=Decimal('0.00'),
        verbose_name='Probabilidad de Cierre (%)',
        help_text='Probabilidad estadística de cierre en esta etapa (0-100%)'
    )

    # Comportamiento de la etapa
    es_inicial = models.BooleanField(
        default=False,
        verbose_name='Es Etapa Inicial',
        help_text='Indica si es la etapa inicial al crear una oportunidad'
    )
    es_ganada = models.BooleanField(
        default=False,
        verbose_name='Es Ganada',
        help_text='Indica si representa una venta cerrada exitosamente'
    )
    es_perdida = models.BooleanField(
        default=False,
        verbose_name='Es Perdida',
        help_text='Indica si representa una oportunidad perdida'
    )
    es_final = models.BooleanField(
        default=False,
        verbose_name='Es Etapa Final',
        help_text='Indica si es una etapa terminal (ganada o perdida)'
    )
    permite_edicion = models.BooleanField(
        default=True,
        verbose_name='Permite Edición',
        help_text='Indica si permite editar la oportunidad en esta etapa'
    )

    # Activación
    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Define si la etapa está disponible para uso'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')

    class Meta:
        verbose_name = 'Etapa de Venta'
        verbose_name_plural = 'Etapas de Venta'
        ordering = ['orden', 'nombre']
        db_table = 'pipeline_etapa_venta'
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['orden', 'activo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class MotivoPerdida(OrderedModel):
    """
    Catálogo de motivos por los que se pierden oportunidades
    Permite análisis de causas de pérdida para mejora continua
    """

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del motivo (ej: PRECIO, COMPETENCIA, TIMING)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del motivo de pérdida'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del motivo'
    )

    # Activación
    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Define si el motivo está disponible'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')

    class Meta:
        verbose_name = 'Motivo de Pérdida'
        verbose_name_plural = 'Motivos de Pérdida'
        ordering = ['orden', 'nombre']
        db_table = 'pipeline_motivo_perdida'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class FuenteOportunidad(OrderedModel):
    """
    Catálogo de fuentes/canales de origen de oportunidades
    Permite análisis de efectividad de canales de captación
    """

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la fuente (ej: REFERIDO, WEB, LLAMADA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre de la fuente de oportunidad'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción de la fuente'
    )

    # Activación
    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Define si la fuente está disponible'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')

    class Meta:
        verbose_name = 'Fuente de Oportunidad'
        verbose_name_plural = 'Fuentes de Oportunidades'
        ordering = ['orden', 'nombre']
        db_table = 'pipeline_fuente_oportunidad'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Oportunidad(BaseCompanyModel):
    """
    Oportunidad de venta en el pipeline
    Representa un potencial negocio desde prospecto hasta cierre
    """

    # Identificación
    codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la oportunidad (ej: OPO-2025-0001)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la oportunidad'
    )

    # Relaciones principales
    cliente = models.ForeignKey(
        'gestion_clientes.Cliente',
        on_delete=models.PROTECT,
        related_name='oportunidades',
        verbose_name='Cliente',
        help_text='Cliente asociado a la oportunidad'
    )
    vendedor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='oportunidades_asignadas',
        verbose_name='Vendedor Asignado',
        help_text='Usuario responsable de la oportunidad'
    )

    # Pipeline
    etapa_actual = models.ForeignKey(
        EtapaVenta,
        on_delete=models.PROTECT,
        related_name='oportunidades',
        verbose_name='Etapa Actual',
        help_text='Etapa actual en el pipeline'
    )
    fuente = models.ForeignKey(
        FuenteOportunidad,
        on_delete=models.PROTECT,
        related_name='oportunidades',
        verbose_name='Fuente',
        help_text='Canal u origen de la oportunidad'
    )

    # Valor
    valor_estimado = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor Estimado',
        help_text='Valor estimado de la oportunidad'
    )
    moneda = models.CharField(
        max_length=3,
        default='COP',
        verbose_name='Moneda',
        help_text='Código de moneda (COP, USD, EUR)'
    )

    # Fechas
    fecha_creacion = models.DateField(
        default=timezone.now,
        verbose_name='Fecha de Creación',
        help_text='Fecha de creación de la oportunidad'
    )
    fecha_cierre_estimada = models.DateField(
        verbose_name='Fecha de Cierre Estimada',
        help_text='Fecha estimada de cierre'
    )
    fecha_cierre_real = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cierre Real',
        help_text='Fecha real de cierre (ganada o perdida)'
    )

    # Probabilidad
    probabilidad_cierre = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        default=Decimal('0.00'),
        verbose_name='Probabilidad de Cierre (%)',
        help_text='Probabilidad estimada de cierre (calculada automáticamente desde etapa)'
    )

    # Cierre
    motivo_perdida = models.ForeignKey(
        MotivoPerdida,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='oportunidades_perdidas',
        verbose_name='Motivo de Pérdida',
        help_text='Motivo por el cual se perdió la oportunidad (si aplica)'
    )

    # Descripción
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de la oportunidad'
    )
    notas = models.TextField(
        blank=True,
        verbose_name='Notas',
        help_text='Notas adicionales sobre la oportunidad'
    )

    class Meta:
        verbose_name = 'Oportunidad'
        verbose_name_plural = 'Oportunidades'
        ordering = ['-fecha_creacion', 'codigo']
        db_table = 'pipeline_oportunidad'
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['empresa', 'etapa_actual']),
            models.Index(fields=['vendedor', 'etapa_actual']),
            models.Index(fields=['fecha_cierre_estimada']),
        ]
        unique_together = [['empresa', 'codigo']]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def save(self, *args, **kwargs):
        """Override para generar código automático."""
        if not self.codigo:
            year = timezone.now().year
            # Obtener último número del año
            last_oportunidad = Oportunidad.objects.filter(
                empresa=self.empresa,
                codigo__startswith=f'OPO-{year}'
            ).order_by('codigo').last()

            if last_oportunidad:
                last_number = int(last_oportunidad.codigo.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1

            self.codigo = f"OPO-{year}-{new_number:04d}"

        # Sincronizar probabilidad desde etapa
        if self.etapa_actual:
            self.probabilidad_cierre = self.etapa_actual.probabilidad_cierre

        super().save(*args, **kwargs)

    def cambiar_etapa(self, nueva_etapa, observaciones='', usuario=None):
        """
        Cambia la etapa de la oportunidad y registra el historial.

        Args:
            nueva_etapa: Instancia de EtapaVenta
            observaciones: Comentarios sobre el cambio
            usuario: Usuario que realiza el cambio
        """
        etapa_anterior = self.etapa_actual
        self.etapa_actual = nueva_etapa
        self.probabilidad_cierre = nueva_etapa.probabilidad_cierre
        self.save()

        # Registrar historial
        HistorialEtapa.objects.create(
            empresa=self.empresa,
            oportunidad=self,
            etapa_anterior=etapa_anterior,
            etapa_nueva=nueva_etapa,
            cambiado_por=usuario,
            observaciones=observaciones
        )

        return True

    def calcular_probabilidad(self):
        """
        Calcula y actualiza la probabilidad de cierre basada en la etapa.
        """
        if self.etapa_actual:
            self.probabilidad_cierre = self.etapa_actual.probabilidad_cierre
            self.save(update_fields=['probabilidad_cierre'])
        return self.probabilidad_cierre

    def cerrar_ganada(self, usuario=None):
        """
        Marca la oportunidad como ganada.
        """
        etapa_ganada = EtapaVenta.objects.filter(es_ganada=True, activo=True).first()
        if not etapa_ganada:
            raise ValueError("No existe una etapa configurada como 'Ganada'")

        self.cambiar_etapa(etapa_ganada, observaciones='Oportunidad cerrada como ganada', usuario=usuario)
        self.fecha_cierre_real = timezone.now().date()
        self.save(update_fields=['fecha_cierre_real'])
        return True

    def cerrar_perdida(self, motivo_perdida, observaciones='', usuario=None):
        """
        Marca la oportunidad como perdida.

        Args:
            motivo_perdida: Instancia de MotivoPerdida
            observaciones: Comentarios sobre la pérdida
            usuario: Usuario que cierra
        """
        etapa_perdida = EtapaVenta.objects.filter(es_perdida=True, activo=True).first()
        if not etapa_perdida:
            raise ValueError("No existe una etapa configurada como 'Perdida'")

        self.motivo_perdida = motivo_perdida
        self.fecha_cierre_real = timezone.now().date()
        self.save(update_fields=['motivo_perdida', 'fecha_cierre_real'])
        self.cambiar_etapa(etapa_perdida, observaciones=observaciones, usuario=usuario)
        return True

    @property
    def esta_activa(self):
        """Verifica si la oportunidad está activa (no en etapa final)."""
        return self.etapa_actual and not self.etapa_actual.es_final

    @property
    def dias_en_pipeline(self):
        """Calcula días desde creación hasta cierre o hasta hoy."""
        fecha_fin = self.fecha_cierre_real or timezone.now().date()
        return (fecha_fin - self.fecha_creacion).days


class SeguimientoOportunidad(BaseCompanyModel):
    """
    Registro de actividades y seguimiento de oportunidades
    Mantiene histórico de interacciones con el cliente
    """

    TIPO_ACTIVIDAD_CHOICES = [
        ('LLAMADA', 'Llamada Telefónica'),
        ('EMAIL', 'Correo Electrónico'),
        ('REUNION', 'Reunión'),
        ('DEMO', 'Demostración'),
        ('PROPUESTA', 'Envío de Propuesta'),
        ('VISITA', 'Visita Cliente'),
        ('OTRO', 'Otro'),
    ]

    oportunidad = models.ForeignKey(
        Oportunidad,
        on_delete=models.CASCADE,
        related_name='seguimientos',
        verbose_name='Oportunidad',
        help_text='Oportunidad a la que pertenece el seguimiento'
    )
    fecha = models.DateTimeField(
        default=timezone.now,
        verbose_name='Fecha',
        help_text='Fecha y hora del seguimiento'
    )
    tipo_actividad = models.CharField(
        max_length=20,
        choices=TIPO_ACTIVIDAD_CHOICES,
        default='LLAMADA',
        verbose_name='Tipo de Actividad',
        help_text='Tipo de actividad realizada'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada de la actividad'
    )
    resultado = models.TextField(
        blank=True,
        verbose_name='Resultado',
        help_text='Resultado o conclusión de la actividad'
    )
    proxima_accion = models.TextField(
        blank=True,
        verbose_name='Próxima Acción',
        help_text='Próxima acción a realizar'
    )
    fecha_proxima = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Próxima Acción',
        help_text='Fecha programada para próxima acción'
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='seguimientos_registrados',
        verbose_name='Registrado por',
        help_text='Usuario que registró el seguimiento'
    )

    class Meta:
        verbose_name = 'Seguimiento de Oportunidad'
        verbose_name_plural = 'Seguimientos de Oportunidades'
        ordering = ['-fecha']
        db_table = 'pipeline_seguimiento_oportunidad'
        indexes = [
            models.Index(fields=['oportunidad', 'fecha']),
            models.Index(fields=['fecha_proxima']),
        ]

    def __str__(self):
        return f"{self.oportunidad.codigo} - {self.get_tipo_actividad_display()} - {self.fecha.strftime('%Y-%m-%d')}"


class Cotizacion(BaseCompanyModel):
    """
    Cotización/Propuesta comercial
    Detalla productos, precios y condiciones de venta
    """

    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('ENVIADA', 'Enviada'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
        ('VENCIDA', 'Vencida'),
        ('CONVERTIDA', 'Convertida a Pedido'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la cotización (ej: COT-2025-0001)'
    )

    # Relaciones
    oportunidad = models.ForeignKey(
        Oportunidad,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cotizaciones',
        verbose_name='Oportunidad',
        help_text='Oportunidad asociada (opcional)'
    )
    cliente = models.ForeignKey(
        'gestion_clientes.Cliente',
        on_delete=models.PROTECT,
        related_name='cotizaciones',
        verbose_name='Cliente',
        help_text='Cliente al que se dirige la cotización'
    )
    vendedor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cotizaciones_elaboradas',
        verbose_name='Vendedor',
        help_text='Vendedor que elabora la cotización'
    )

    # Fechas
    fecha_cotizacion = models.DateField(
        default=timezone.now,
        verbose_name='Fecha Cotización',
        help_text='Fecha de elaboración de la cotización'
    )
    fecha_vencimiento = models.DateField(
        verbose_name='Fecha Vencimiento',
        help_text='Fecha hasta la cual es válida la cotización'
    )
    dias_validez = models.PositiveIntegerField(
        default=15,
        verbose_name='Días de Validez',
        help_text='Días de validez de la cotización (usado para calcular vencimiento)'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado actual de la cotización'
    )

    # Valores
    subtotal = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Subtotal',
        help_text='Suma de valores de líneas de detalle'
    )
    descuento_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Descuento (%)',
        help_text='Porcentaje de descuento general'
    )
    descuento_valor = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Descuento (Valor)',
        help_text='Valor del descuento calculado'
    )
    impuestos = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Impuestos',
        help_text='Valor total de impuestos (IVA, etc.)'
    )
    total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total',
        help_text='Valor total de la cotización'
    )

    # Información adicional
    terminos_condiciones = models.TextField(
        blank=True,
        verbose_name='Términos y Condiciones',
        help_text='Términos y condiciones de la cotización'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones adicionales'
    )

    class Meta:
        verbose_name = 'Cotización'
        verbose_name_plural = 'Cotizaciones'
        ordering = ['-fecha_cotizacion', 'codigo']
        db_table = 'pipeline_cotizacion'
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['cliente', 'estado']),
            models.Index(fields=['fecha_vencimiento']),
        ]
        unique_together = [['empresa', 'codigo']]

    def __str__(self):
        return f"{self.codigo} - {self.cliente}"

    def save(self, *args, **kwargs):
        """Override para generar código y calcular fecha vencimiento."""
        if not self.codigo:
            year = timezone.now().year
            last_cotizacion = Cotizacion.objects.filter(
                empresa=self.empresa,
                codigo__startswith=f'COT-{year}'
            ).order_by('codigo').last()

            if last_cotizacion:
                last_number = int(last_cotizacion.codigo.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1

            self.codigo = f"COT-{year}-{new_number:04d}"

        # Calcular fecha vencimiento si no está definida
        if not self.fecha_vencimiento and self.dias_validez:
            self.fecha_vencimiento = self.fecha_cotizacion + timedelta(days=self.dias_validez)

        super().save(*args, **kwargs)

    def calcular_totales(self):
        """
        Recalcula todos los totales de la cotización.
        """
        detalles = self.detalles.all()
        self.subtotal = sum(detalle.subtotal for detalle in detalles)

        # Calcular descuento
        if self.descuento_porcentaje > 0:
            self.descuento_valor = (self.subtotal * self.descuento_porcentaje) / Decimal('100')
        else:
            self.descuento_valor = Decimal('0.00')

        # Calcular impuestos (ejemplo: 19% IVA sobre subtotal - descuento)
        base_impuesto = self.subtotal - self.descuento_valor
        self.impuestos = (base_impuesto * Decimal('0.19'))  # 19% IVA

        # Total
        self.total = self.subtotal - self.descuento_valor + self.impuestos

        self.save(update_fields=['subtotal', 'descuento_valor', 'impuestos', 'total'])
        return self.total

    def aprobar(self):
        """Marca la cotización como aprobada."""
        if self.estado == 'ENVIADA':
            self.estado = 'APROBADA'
            self.save(update_fields=['estado'])
            return True
        return False

    def rechazar(self):
        """Marca la cotización como rechazada."""
        if self.estado == 'ENVIADA':
            self.estado = 'RECHAZADA'
            self.save(update_fields=['estado'])
            return True
        return False

    def convertir_a_pedido(self):
        """
        Marca la cotización como convertida.
        Nota: La creación real del pedido debe hacerse en otro módulo.
        """
        if self.estado == 'APROBADA':
            self.estado = 'CONVERTIDA'
            self.save(update_fields=['estado'])
            return True
        return False

    def clonar(self):
        """
        Crea una copia de la cotización con nuevo código.
        """
        detalles_originales = list(self.detalles.all())

        # Clonar cotización
        self.pk = None
        self.id = None
        self.codigo = None  # Se generará automáticamente
        self.estado = 'BORRADOR'
        self.fecha_cotizacion = timezone.now().date()
        self.fecha_vencimiento = self.fecha_cotizacion + timedelta(days=self.dias_validez)
        self.save()

        # Clonar detalles
        for detalle in detalles_originales:
            detalle.pk = None
            detalle.id = None
            detalle.cotizacion = self
            detalle.save()

        return self

    @property
    def esta_vencida(self):
        """Verifica si la cotización está vencida."""
        return timezone.now().date() > self.fecha_vencimiento and self.estado not in ['APROBADA', 'CONVERTIDA']


class DetalleCotizacion(BaseCompanyModel):
    """
    Línea de detalle de una cotización
    Relaciona productos con cantidades y precios
    """

    cotizacion = models.ForeignKey(
        Cotizacion,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Cotización',
        help_text='Cotización a la que pertenece este detalle'
    )
    producto = models.ForeignKey(
        'producto_terminado.ProductoTerminado',
        on_delete=models.PROTECT,
        related_name='cotizaciones_detalle',
        verbose_name='Producto',
        help_text='Producto cotizado'
    )

    # Descripción
    descripcion_producto = models.CharField(
        max_length=300,
        verbose_name='Descripción',
        help_text='Descripción del producto (copiada del maestro)'
    )

    # Cantidad
    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Cantidad',
        help_text='Cantidad del producto'
    )
    unidad_medida = models.CharField(
        max_length=20,
        default='UND',
        verbose_name='Unidad de Medida',
        help_text='Unidad de medida del producto'
    )

    # Precios
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
        verbose_name='Descuento Línea (%)',
        help_text='Descuento específico de esta línea'
    )
    subtotal = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Subtotal',
        help_text='Subtotal de la línea (cantidad * precio - descuento)'
    )

    # Orden
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización en la cotización'
    )

    # Notas
    notas = models.TextField(
        blank=True,
        verbose_name='Notas',
        help_text='Notas adicionales sobre esta línea'
    )

    class Meta:
        verbose_name = 'Detalle de Cotización'
        verbose_name_plural = 'Detalles de Cotización'
        ordering = ['cotizacion', 'orden']
        db_table = 'pipeline_detalle_cotizacion'
        indexes = [
            models.Index(fields=['cotizacion', 'orden']),
        ]

    def __str__(self):
        return f"{self.cotizacion.codigo} - Línea {self.orden}"

    def save(self, *args, **kwargs):
        """Override para calcular subtotal."""
        # Calcular subtotal
        subtotal_bruto = self.cantidad * self.precio_unitario
        descuento = (subtotal_bruto * self.descuento_linea) / Decimal('100')
        self.subtotal = subtotal_bruto - descuento

        super().save(*args, **kwargs)

        # Recalcular totales de la cotización
        self.cotizacion.calcular_totales()


class HistorialEtapa(BaseCompanyModel):
    """
    Registro histórico de cambios de etapa en oportunidades
    Permite tracking de movimientos en el pipeline
    """

    oportunidad = models.ForeignKey(
        Oportunidad,
        on_delete=models.CASCADE,
        related_name='historial_etapas',
        verbose_name='Oportunidad',
        help_text='Oportunidad asociada'
    )
    etapa_anterior = models.ForeignKey(
        EtapaVenta,
        on_delete=models.PROTECT,
        related_name='historial_como_anterior',
        verbose_name='Etapa Anterior',
        help_text='Etapa desde la cual se movió'
    )
    etapa_nueva = models.ForeignKey(
        EtapaVenta,
        on_delete=models.PROTECT,
        related_name='historial_como_nueva',
        verbose_name='Etapa Nueva',
        help_text='Etapa a la cual se movió'
    )
    fecha_cambio = models.DateTimeField(
        default=timezone.now,
        verbose_name='Fecha de Cambio',
        help_text='Fecha y hora del cambio'
    )
    cambiado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cambios_etapa_realizados',
        verbose_name='Cambiado por',
        help_text='Usuario que realizó el cambio'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones sobre el cambio'
    )

    class Meta:
        verbose_name = 'Historial de Etapa'
        verbose_name_plural = 'Historiales de Etapas'
        ordering = ['-fecha_cambio']
        db_table = 'pipeline_historial_etapa'
        indexes = [
            models.Index(fields=['oportunidad', 'fecha_cambio']),
        ]

    def __str__(self):
        return f"{self.oportunidad.codigo} - {self.etapa_anterior.codigo} -> {self.etapa_nueva.codigo}"
