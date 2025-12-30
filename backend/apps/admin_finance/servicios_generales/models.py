"""
Modelos para Servicios Generales - Admin Finance
Sistema de Gestión Grasas y Huesos del Norte

Gestiona:
- Mantenimiento locativo (preventivo/correctivo/mejora)
- Servicios públicos (agua, luz, gas, telefonía, internet)
- Contratos de servicios tercerizados (vigilancia, aseo, cafetería)

100% DINÁMICO: Integrado con proveedores y finanzas.

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

TIPO_MANTENIMIENTO_CHOICES = [
    ('preventivo', 'Preventivo'),
    ('correctivo', 'Correctivo'),
    ('mejora', 'Mejora'),
]

ESTADO_MANTENIMIENTO_CHOICES = [
    ('solicitado', 'Solicitado'),
    ('programado', 'Programado'),
    ('en_ejecucion', 'En Ejecución'),
    ('completado', 'Completado'),
    ('cancelado', 'Cancelado'),
]

TIPO_SERVICIO_PUBLICO_CHOICES = [
    ('agua', 'Agua'),
    ('energia', 'Energía'),
    ('gas', 'Gas'),
    ('telefonia', 'Telefonía'),
    ('internet', 'Internet'),
    ('aseo', 'Aseo'),
]

ESTADO_PAGO_SERVICIO_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('pagado', 'Pagado'),
    ('vencido', 'Vencido'),
]

TIPO_CONTRATO_SERVICIO_CHOICES = [
    ('vigilancia', 'Vigilancia'),
    ('aseo', 'Aseo'),
    ('cafeteria', 'Cafetería'),
    ('mantenimiento', 'Mantenimiento'),
    ('jardineria', 'Jardinería'),
    ('fumigacion', 'Fumigación'),
    ('limpieza_tanques', 'Limpieza de Tanques'),
    ('otros', 'Otros'),
]

FRECUENCIA_PAGO_CHOICES = [
    ('mensual', 'Mensual'),
    ('bimestral', 'Bimestral'),
    ('trimestral', 'Trimestral'),
    ('semestral', 'Semestral'),
    ('anual', 'Anual'),
]

ESTADO_CONTRATO_CHOICES = [
    ('vigente', 'Vigente'),
    ('vencido', 'Vencido'),
    ('terminado', 'Terminado'),
]


# ==============================================================================
# MODELO: MANTENIMIENTO LOCATIVO
# ==============================================================================

class MantenimientoLocativo(BaseCompanyModel):
    """
    Mantenimiento Locativo - Mantenimiento de instalaciones.

    Registra el mantenimiento preventivo, correctivo y mejoras de las
    instalaciones físicas de la empresa.
    """

    # Código
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del mantenimiento (auto-generado: MLO-YYYY-####)'
    )

    # Tipo y descripción
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_MANTENIMIENTO_CHOICES,
        verbose_name='Tipo de Mantenimiento',
        help_text='Tipo de mantenimiento',
        db_index=True
    )
    ubicacion = models.CharField(
        max_length=255,
        verbose_name='Ubicación',
        help_text='Ubicación o área donde se realiza el mantenimiento'
    )
    descripcion_trabajo = models.TextField(
        verbose_name='Descripción del Trabajo',
        help_text='Descripción detallada del trabajo a realizar'
    )

    # Fechas
    fecha_solicitud = models.DateField(
        default=timezone.now,
        verbose_name='Fecha de Solicitud',
        help_text='Fecha en que se solicita el mantenimiento',
        db_index=True
    )
    fecha_programada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Programada',
        help_text='Fecha programada para realizar el mantenimiento'
    )
    fecha_ejecucion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Ejecución',
        help_text='Fecha en que se ejecutó el mantenimiento'
    )

    # Responsable y proveedor
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='mantenimientos_responsable',
        verbose_name='Responsable',
        help_text='Usuario responsable del seguimiento'
    )
    proveedor = models.ForeignKey(
        'gestion_proveedores.Proveedor',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='mantenimientos_locativos',
        verbose_name='Proveedor',
        help_text='Proveedor que realiza el trabajo (si aplica)'
    )

    # Costos
    costo_estimado = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Costo Estimado',
        help_text='Costo estimado del mantenimiento'
    )
    costo_real = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Costo Real',
        help_text='Costo real del mantenimiento ejecutado'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_MANTENIMIENTO_CHOICES,
        default='solicitado',
        verbose_name='Estado',
        db_index=True
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones o notas adicionales'
    )

    class Meta:
        db_table = 'admin_finance_mantenimiento_locativo'
        verbose_name = 'Mantenimiento Locativo'
        verbose_name_plural = 'Mantenimientos Locativos'
        ordering = ['-fecha_solicitud', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['codigo']),
            models.Index(fields=['tipo', 'estado']),
            models.Index(fields=['fecha_solicitud']),
            models.Index(fields=['fecha_programada']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.get_tipo_display()} - {self.ubicacion}"

    @property
    def variacion_costo(self):
        """Calcula la variación entre costo estimado y real."""
        return self.costo_real - self.costo_estimado

    @property
    def porcentaje_variacion(self):
        """Calcula el porcentaje de variación de costo."""
        if self.costo_estimado == 0:
            return Decimal('0.00')
        return (self.variacion_costo / self.costo_estimado) * Decimal('100.00')

    @property
    def dias_hasta_programacion(self):
        """Calcula días hasta la fecha programada."""
        if not self.fecha_programada:
            return None
        delta = self.fecha_programada - timezone.now().date()
        return delta.days

    def save(self, *args, **kwargs):
        """Override para generación de código automático."""
        if not self.codigo:
            self.codigo = self._generar_codigo()
        super().save(*args, **kwargs)

    def _generar_codigo(self):
        """Genera código único: MLO-YYYY-####"""
        year = timezone.now().year
        ultimo = MantenimientoLocativo.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'MLO-{year}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"MLO-{year}-{numero:04d}"

    def clean(self):
        """Validaciones del modelo."""
        # Validar fechas
        if self.fecha_programada and self.fecha_solicitud:
            if self.fecha_programada < self.fecha_solicitud:
                raise ValidationError({
                    'fecha_programada': 'La fecha programada debe ser posterior a la fecha de solicitud.'
                })

        if self.fecha_ejecucion and self.fecha_solicitud:
            if self.fecha_ejecucion < self.fecha_solicitud:
                raise ValidationError({
                    'fecha_ejecucion': 'La fecha de ejecución debe ser posterior a la fecha de solicitud.'
                })


# ==============================================================================
# MODELO: SERVICIO PÚBLICO
# ==============================================================================

class ServicioPublico(BaseCompanyModel):
    """
    Servicio Público - Servicios públicos (agua, luz, gas, etc.).

    Registra los consumos y pagos de servicios públicos de la empresa.
    """

    # Código
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del servicio (auto-generado: SP-YYYY-MM-####)'
    )

    # Tipo de servicio
    tipo_servicio = models.CharField(
        max_length=20,
        choices=TIPO_SERVICIO_PUBLICO_CHOICES,
        verbose_name='Tipo de Servicio',
        help_text='Tipo de servicio público',
        db_index=True
    )

    # Proveedor
    proveedor_nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Proveedor',
        help_text='Nombre de la empresa proveedora del servicio (ej: EPM, UNE)'
    )
    numero_cuenta = models.CharField(
        max_length=100,
        verbose_name='Número de Cuenta',
        help_text='Número de cuenta o contrato del servicio'
    )
    ubicacion = models.CharField(
        max_length=255,
        verbose_name='Ubicación / Sede',
        help_text='Ubicación o sede donde se presta el servicio'
    )

    # Período
    periodo_mes = models.IntegerField(
        validators=[MinValueValidator(1), MinValueValidator(12)],
        verbose_name='Mes del Período',
        help_text='Mes del período facturado (1-12)',
        db_index=True
    )
    periodo_anio = models.IntegerField(
        validators=[MinValueValidator(2020)],
        verbose_name='Año del Período',
        help_text='Año del período facturado',
        db_index=True
    )

    # Fechas y valor
    fecha_vencimiento = models.DateField(
        verbose_name='Fecha de Vencimiento',
        help_text='Fecha límite de pago',
        db_index=True
    )
    valor = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Valor',
        help_text='Valor total a pagar'
    )

    # Estado de pago
    estado_pago = models.CharField(
        max_length=20,
        choices=ESTADO_PAGO_SERVICIO_CHOICES,
        default='pendiente',
        verbose_name='Estado de Pago',
        db_index=True
    )

    # Consumo
    consumo = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Consumo',
        help_text='Cantidad consumida en el período'
    )
    unidad_medida = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Unidad de Medida',
        help_text='Unidad de medida del consumo (kWh, m³, etc.)'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_servicio_publico'
        verbose_name = 'Servicio Público'
        verbose_name_plural = 'Servicios Públicos'
        ordering = ['-periodo_anio', '-periodo_mes', 'tipo_servicio']
        indexes = [
            models.Index(fields=['empresa', 'estado_pago']),
            models.Index(fields=['codigo']),
            models.Index(fields=['tipo_servicio', 'periodo_anio', 'periodo_mes']),
            models.Index(fields=['fecha_vencimiento']),
        ]
        unique_together = [['empresa', 'tipo_servicio', 'numero_cuenta', 'periodo_mes', 'periodo_anio']]

    def __str__(self):
        return f"{self.codigo} - {self.get_tipo_servicio_display()} - {self.periodo_mes}/{self.periodo_anio}"

    @property
    def dias_para_vencimiento(self):
        """Calcula días hasta/desde vencimiento (negativo = vencido)."""
        delta = self.fecha_vencimiento - timezone.now().date()
        return delta.days

    @property
    def esta_vencido(self):
        """Verifica si el servicio está vencido."""
        if self.estado_pago == 'pagado':
            return False
        return self.fecha_vencimiento < timezone.now().date()

    @property
    def proximo_a_vencer(self):
        """Verifica si está próximo a vencer (7 días)."""
        if self.estado_pago == 'pagado':
            return False
        return 0 <= self.dias_para_vencimiento <= 7

    def save(self, *args, **kwargs):
        """Override para generación de código y actualización de estado."""
        if not self.codigo:
            self.codigo = self._generar_codigo()

        # Actualizar estado automáticamente
        if self.esta_vencido and self.estado_pago == 'pendiente':
            self.estado_pago = 'vencido'

        super().save(*args, **kwargs)

    def _generar_codigo(self):
        """Genera código único: SP-YYYY-MM-####"""
        year = self.periodo_anio or timezone.now().year
        month = self.periodo_mes or timezone.now().month

        ultimo = ServicioPublico.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'SP-{year}-{month:02d}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"SP-{year}-{month:02d}-{numero:04d}"

    def clean(self):
        """Validaciones del modelo."""
        # Validar mes
        if not 1 <= self.periodo_mes <= 12:
            raise ValidationError({
                'periodo_mes': 'El mes debe estar entre 1 y 12.'
            })


# ==============================================================================
# MODELO: CONTRATO DE SERVICIO
# ==============================================================================

class ContratoServicio(BaseCompanyModel):
    """
    Contrato de Servicio - Contratos de servicios tercerizados.

    Gestiona contratos con proveedores de servicios como vigilancia,
    aseo, cafetería, mantenimiento, etc.
    """

    # Código
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del contrato (auto-generado: CS-YYYY-####)'
    )

    # Proveedor
    proveedor = models.ForeignKey(
        'gestion_proveedores.Proveedor',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='contratos_servicio',
        verbose_name='Proveedor',
        help_text='Proveedor del servicio'
    )

    # Tipo de servicio
    tipo_servicio = models.CharField(
        max_length=30,
        choices=TIPO_CONTRATO_SERVICIO_CHOICES,
        verbose_name='Tipo de Servicio',
        help_text='Tipo de servicio contratado',
        db_index=True
    )
    objeto = models.TextField(
        verbose_name='Objeto del Contrato',
        help_text='Descripción del objeto contractual'
    )

    # Vigencia
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio',
        help_text='Fecha de inicio de vigencia del contrato',
        db_index=True
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha de Fin',
        help_text='Fecha de finalización del contrato',
        db_index=True
    )

    # Valores
    valor_mensual = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor Mensual',
        help_text='Valor mensual del contrato'
    )
    valor_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor Total',
        help_text='Valor total del contrato'
    )

    # Frecuencia de pago
    frecuencia_pago = models.CharField(
        max_length=20,
        choices=FRECUENCIA_PAGO_CHOICES,
        default='mensual',
        verbose_name='Frecuencia de Pago',
        help_text='Frecuencia de pago del contrato'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CONTRATO_CHOICES,
        default='vigente',
        verbose_name='Estado',
        db_index=True
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_contrato_servicio'
        verbose_name = 'Contrato de Servicio'
        verbose_name_plural = 'Contratos de Servicio'
        ordering = ['-fecha_inicio', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['codigo']),
            models.Index(fields=['tipo_servicio', 'estado']),
            models.Index(fields=['proveedor', 'estado']),
            models.Index(fields=['fecha_inicio', 'fecha_fin']),
        ]

    def __str__(self):
        proveedor_nombre = self.proveedor.razon_social if self.proveedor else 'Sin proveedor'
        return f"{self.codigo} - {self.get_tipo_servicio_display()} - {proveedor_nombre}"

    @property
    def dias_para_vencimiento(self):
        """Calcula días hasta el fin del contrato."""
        delta = self.fecha_fin - timezone.now().date()
        return delta.days

    @property
    def contrato_vigente(self):
        """Verifica si el contrato está vigente."""
        hoy = timezone.now().date()
        return self.fecha_inicio <= hoy <= self.fecha_fin

    @property
    def contrato_vencido(self):
        """Verifica si el contrato está vencido."""
        return timezone.now().date() > self.fecha_fin

    @property
    def proximo_a_vencer(self):
        """Verifica si está próximo a vencer (30 días)."""
        if self.contrato_vencido:
            return False
        return 0 <= self.dias_para_vencimiento <= 30

    @property
    def duracion_dias(self):
        """Calcula la duración total del contrato en días."""
        delta = self.fecha_fin - self.fecha_inicio
        return delta.days

    def save(self, *args, **kwargs):
        """Override para generación de código y actualización de estado."""
        if not self.codigo:
            self.codigo = self._generar_codigo()

        # Actualizar estado automáticamente
        if self.contrato_vencido and self.estado == 'vigente':
            self.estado = 'vencido'
        elif self.contrato_vigente and self.estado == 'vencido':
            self.estado = 'vigente'

        super().save(*args, **kwargs)

    def _generar_codigo(self):
        """Genera código único: CS-YYYY-####"""
        year = self.fecha_inicio.year if self.fecha_inicio else timezone.now().year

        ultimo = ContratoServicio.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'CS-{year}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"CS-{year}-{numero:04d}"

    def clean(self):
        """Validaciones del modelo."""
        # Validar fechas
        if self.fecha_inicio and self.fecha_fin:
            if self.fecha_fin <= self.fecha_inicio:
                raise ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio.'
                })
