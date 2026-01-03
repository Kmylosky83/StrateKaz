"""
Modelos para Activos Fijos - Admin Finance
Sistema de Gestión StrateKaz

Gestiona:
- Categorías de activos fijos
- Activos fijos de la empresa
- Hoja de vida (historial) de activos
- Programas de mantenimiento preventivo
- Depreciación mensual de activos
- Proceso de baja de activos

100% DINÁMICO: Integrado con Organización y Control de Activos.

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from decimal import Decimal
from dateutil.relativedelta import relativedelta

from apps.core.base_models.base import BaseCompanyModel


# ==============================================================================
# OPCIONES Y CONSTANTES
# ==============================================================================

METODO_DEPRECIACION_CHOICES = [
    ('lineal', 'Línea Recta'),
    ('acelerado', 'Acelerado'),
    ('unidades', 'Unidades de Producción'),
]

ESTADO_ACTIVO_CHOICES = [
    ('activo', 'Activo'),
    ('en_mantenimiento', 'En Mantenimiento'),
    ('dado_baja', 'Dado de Baja'),
]

TIPO_EVENTO_CHOICES = [
    ('mantenimiento', 'Mantenimiento Preventivo'),
    ('reparacion', 'Reparación Correctiva'),
    ('traslado', 'Traslado'),
    ('calibracion', 'Calibración'),
    ('actualizacion', 'Actualización'),
    ('inspeccion', 'Inspección'),
]

TIPO_MANTENIMIENTO_CHOICES = [
    ('preventivo', 'Preventivo'),
    ('correctivo', 'Correctivo'),
]

ESTADO_MANTENIMIENTO_CHOICES = [
    ('programado', 'Programado'),
    ('en_proceso', 'En Proceso'),
    ('completado', 'Completado'),
    ('cancelado', 'Cancelado'),
]

MOTIVO_BAJA_CHOICES = [
    ('obsoleto', 'Obsolescencia Tecnológica'),
    ('dano_irreparable', 'Daño Irreparable'),
    ('venta', 'Venta'),
    ('donacion', 'Donación'),
    ('robo', 'Robo/Pérdida'),
    ('otro', 'Otro'),
]


# ==============================================================================
# MODELO: CATEGORÍA DE ACTIVO
# ==============================================================================

class CategoriaActivo(BaseCompanyModel):
    """
    Categoría de Activo - Clasificación de activos fijos.

    Define las categorías bajo las cuales se clasifican los activos fijos,
    con parámetros de vida útil y método de depreciación.
    """

    # Información básica
    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la categoría (ej: CAT-001)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre de la categoría (ej: Maquinaria Industrial)'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de la categoría'
    )

    # Parámetros de depreciación
    vida_util_anios = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Vida Útil (años)',
        help_text='Vida útil estimada en años'
    )
    metodo_depreciacion = models.CharField(
        max_length=20,
        choices=METODO_DEPRECIACION_CHOICES,
        default='lineal',
        verbose_name='Método de Depreciación',
        help_text='Método de cálculo de depreciación'
    )

    class Meta:
        db_table = 'admin_finance_categoria_activo'
        verbose_name = 'Categoría de Activo'
        verbose_name_plural = 'Categorías de Activos'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def vida_util_meses(self):
        """Calcula la vida útil en meses."""
        return self.vida_util_anios * 12


# ==============================================================================
# MODELO: ACTIVO FIJO
# ==============================================================================

class ActivoFijo(BaseCompanyModel):
    """
    Activo Fijo - Registro de activos fijos de la empresa.

    Gestiona los activos fijos de la empresa con control de depreciación,
    ubicación, responsable y estado.
    """

    # Información básica
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del activo (auto-generado: AF-YYYY-####)'
    )
    categoria = models.ForeignKey(
        CategoriaActivo,
        on_delete=models.PROTECT,
        related_name='activos',
        verbose_name='Categoría',
        help_text='Categoría del activo'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del activo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Detalles técnicos
    numero_serie = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de Serie',
        help_text='Número de serie del fabricante'
    )
    marca = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Marca'
    )
    modelo = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Modelo'
    )

    # Información financiera
    fecha_adquisicion = models.DateField(
        verbose_name='Fecha de Adquisición',
        help_text='Fecha de compra del activo',
        db_index=True
    )
    valor_adquisicion = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Valor de Adquisición',
        help_text='Costo de adquisición del activo'
    )
    valor_residual = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor Residual',
        help_text='Valor estimado al final de su vida útil'
    )

    # Ubicación y responsable
    ubicacion = models.CharField(
        max_length=255,
        verbose_name='Ubicación',
        help_text='Ubicación física del activo'
    )
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='activos_fijos',
        verbose_name='Área',
        help_text='Área organizacional responsable'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='activos_responsable',
        verbose_name='Responsable',
        help_text='Usuario responsable del activo'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_ACTIVO_CHOICES,
        default='activo',
        verbose_name='Estado',
        db_index=True
    )

    # Información adicional
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_activo_fijo'
        verbose_name = 'Activo Fijo'
        verbose_name_plural = 'Activos Fijos'
        ordering = ['-fecha_adquisicion', 'codigo']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['codigo']),
            models.Index(fields=['categoria', 'estado']),
            models.Index(fields=['area']),
            models.Index(fields=['fecha_adquisicion']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def valor_depreciable(self):
        """Calcula el valor depreciable (adquisición - residual)."""
        return self.valor_adquisicion - self.valor_residual

    @property
    def depreciacion_mensual(self):
        """Calcula la depreciación mensual usando método lineal."""
        if self.categoria.metodo_depreciacion == 'lineal':
            vida_util_meses = self.categoria.vida_util_meses
            if vida_util_meses > 0:
                return self.valor_depreciable / Decimal(vida_util_meses)
        return Decimal('0.00')

    @property
    def depreciacion_acumulada(self):
        """Calcula la depreciación acumulada total."""
        from django.db.models import Sum
        total = Depreciacion.objects.filter(
            activo=self,
            is_active=True
        ).aggregate(total=Sum('depreciacion_periodo'))['total']
        return total or Decimal('0.00')

    @property
    def valor_en_libros(self):
        """Calcula el valor en libros actual (adquisición - depreciación acumulada)."""
        return self.valor_adquisicion - self.depreciacion_acumulada

    @property
    def meses_desde_adquisicion(self):
        """Calcula los meses transcurridos desde la adquisición."""
        hoy = timezone.now().date()
        delta = relativedelta(hoy, self.fecha_adquisicion)
        return delta.years * 12 + delta.months

    @property
    def porcentaje_depreciacion(self):
        """Calcula el porcentaje de depreciación."""
        if self.valor_adquisicion > 0:
            return (self.depreciacion_acumulada / self.valor_adquisicion) * Decimal('100.00')
        return Decimal('0.00')

    def save(self, *args, **kwargs):
        """Override para generación de código automático."""
        if not self.codigo:
            self.codigo = self._generar_codigo()
        super().save(*args, **kwargs)

    def _generar_codigo(self):
        """Genera código único: AF-YYYY-####"""
        year = self.fecha_adquisicion.year if self.fecha_adquisicion else timezone.now().year
        ultimo = ActivoFijo.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'AF-{year}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"AF-{year}-{numero:04d}"

    def clean(self):
        """Validaciones del modelo."""
        # Validar que valor residual no sea mayor que valor de adquisición
        if self.valor_residual > self.valor_adquisicion:
            raise ValidationError({
                'valor_residual': 'El valor residual no puede ser mayor al valor de adquisición.'
            })

        # Validar que no se pueda modificar un activo dado de baja
        if self.pk and self.estado == 'dado_baja':
            # Verificar si ya tenía baja
            activo_anterior = ActivoFijo.objects.filter(pk=self.pk).first()
            if activo_anterior and activo_anterior.estado == 'dado_baja':
                raise ValidationError('No se puede modificar un activo que ya está dado de baja.')


# ==============================================================================
# MODELO: HOJA DE VIDA DE ACTIVO
# ==============================================================================

class HojaVidaActivo(BaseCompanyModel):
    """
    Hoja de Vida de Activo - Historial de eventos del activo.

    Registra todos los eventos relevantes en la vida del activo:
    mantenimientos, reparaciones, traslados, etc.
    """

    # Relaciones
    activo = models.ForeignKey(
        ActivoFijo,
        on_delete=models.CASCADE,
        related_name='hojas_vida',
        verbose_name='Activo',
        help_text='Activo al que corresponde el evento'
    )

    # Información del evento
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del evento (auto-generado: HV-YYYY-####)'
    )
    tipo_evento = models.CharField(
        max_length=30,
        choices=TIPO_EVENTO_CHOICES,
        verbose_name='Tipo de Evento',
        help_text='Tipo de evento registrado',
        db_index=True
    )
    fecha = models.DateField(
        verbose_name='Fecha del Evento',
        help_text='Fecha en que ocurrió el evento',
        db_index=True
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada del evento'
    )

    # Costos
    costo = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Costo',
        help_text='Costo del evento (mantenimiento, reparación, etc.)'
    )

    # Responsable
    realizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='hojas_vida_realizadas',
        verbose_name='Realizado Por',
        help_text='Usuario que realizó o registró el evento'
    )

    # Documento soporte
    documento_soporte = models.FileField(
        upload_to='activos_fijos/hojas_vida/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Documento Soporte',
        help_text='Archivo PDF del documento soporte'
    )

    class Meta:
        db_table = 'admin_finance_hoja_vida_activo'
        verbose_name = 'Hoja de Vida de Activo'
        verbose_name_plural = 'Hojas de Vida de Activos'
        ordering = ['-fecha', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'activo', 'fecha']),
            models.Index(fields=['codigo']),
            models.Index(fields=['activo', 'tipo_evento']),
            models.Index(fields=['fecha']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.activo.codigo} - {self.get_tipo_evento_display()}"

    def save(self, *args, **kwargs):
        """Override para generación de código automático."""
        if not self.codigo:
            self.codigo = self._generar_codigo()

        # Validar que el activo no esté dado de baja
        if self.activo.estado == 'dado_baja':
            raise ValidationError('No se pueden registrar eventos en un activo dado de baja.')

        super().save(*args, **kwargs)

    def _generar_codigo(self):
        """Genera código único: HV-YYYY-####"""
        year = self.fecha.year if self.fecha else timezone.now().year
        ultimo = HojaVidaActivo.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'HV-{year}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"HV-{year}-{numero:04d}"


# ==============================================================================
# MODELO: PROGRAMA DE MANTENIMIENTO
# ==============================================================================

class ProgramaMantenimiento(BaseCompanyModel):
    """
    Programa de Mantenimiento - Calendario de mantenimiento preventivo/correctivo.

    Programa los mantenimientos periódicos para los activos fijos.
    """

    # Relaciones
    activo = models.ForeignKey(
        ActivoFijo,
        on_delete=models.CASCADE,
        related_name='programas_mantenimiento',
        verbose_name='Activo',
        help_text='Activo a mantener'
    )

    # Información del programa
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_MANTENIMIENTO_CHOICES,
        verbose_name='Tipo de Mantenimiento',
        db_index=True
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción del mantenimiento a realizar'
    )

    # Programación
    frecuencia_dias = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Frecuencia (días)',
        help_text='Frecuencia en días entre mantenimientos'
    )
    ultima_fecha = models.DateField(
        null=True,
        blank=True,
        verbose_name='Última Fecha',
        help_text='Fecha del último mantenimiento realizado'
    )
    proxima_fecha = models.DateField(
        verbose_name='Próxima Fecha',
        help_text='Fecha programada para el próximo mantenimiento',
        db_index=True
    )

    # Responsable
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='programas_mantenimiento',
        verbose_name='Responsable',
        help_text='Usuario responsable del mantenimiento'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_MANTENIMIENTO_CHOICES,
        default='programado',
        verbose_name='Estado',
        db_index=True
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_programa_mantenimiento'
        verbose_name = 'Programa de Mantenimiento'
        verbose_name_plural = 'Programas de Mantenimiento'
        ordering = ['proxima_fecha', 'activo']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['activo', 'estado']),
            models.Index(fields=['proxima_fecha']),
        ]

    def __str__(self):
        return f"{self.activo.codigo} - {self.get_tipo_display()} - {self.proxima_fecha}"

    @property
    def esta_vencido(self):
        """Verifica si el mantenimiento está vencido."""
        if self.estado in ['completado', 'cancelado']:
            return False
        return self.proxima_fecha < timezone.now().date()

    @property
    def dias_para_mantenimiento(self):
        """Calcula días hasta el próximo mantenimiento (negativo = vencido)."""
        delta = self.proxima_fecha - timezone.now().date()
        return delta.days

    def completar(self, fecha_realizacion=None):
        """Marca el mantenimiento como completado y programa el siguiente."""
        if not fecha_realizacion:
            fecha_realizacion = timezone.now().date()

        self.estado = 'completado'
        self.ultima_fecha = fecha_realizacion
        self.proxima_fecha = fecha_realizacion + timezone.timedelta(days=self.frecuencia_dias)
        self.save()

    def clean(self):
        """Validaciones del modelo."""
        # Validar que no se programe mantenimiento en activo dado de baja
        if self.activo.estado == 'dado_baja':
            raise ValidationError('No se puede programar mantenimiento en un activo dado de baja.')


# ==============================================================================
# MODELO: DEPRECIACIÓN
# ==============================================================================

class Depreciacion(BaseCompanyModel):
    """
    Depreciación - Cálculo de depreciación mensual de activos.

    Registra la depreciación mensual de cada activo para control contable.
    """

    # Relaciones
    activo = models.ForeignKey(
        ActivoFijo,
        on_delete=models.CASCADE,
        related_name='depreciaciones',
        verbose_name='Activo',
        help_text='Activo a depreciar'
    )

    # Período
    periodo_mes = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MinValueValidator(12)],
        verbose_name='Mes del Período',
        help_text='Mes del período (1-12)',
        db_index=True
    )
    periodo_anio = models.PositiveIntegerField(
        validators=[MinValueValidator(2020)],
        verbose_name='Año del Período',
        help_text='Año del período',
        db_index=True
    )

    # Valores
    valor_inicial = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor Inicial',
        help_text='Valor del activo al inicio del período'
    )
    depreciacion_periodo = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Depreciación del Período',
        help_text='Depreciación calculada para el período'
    )
    depreciacion_acumulada = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Depreciación Acumulada',
        help_text='Depreciación acumulada hasta el período'
    )
    valor_en_libros = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor en Libros',
        help_text='Valor en libros al final del período'
    )

    class Meta:
        db_table = 'admin_finance_depreciacion'
        verbose_name = 'Depreciación'
        verbose_name_plural = 'Depreciaciones'
        ordering = ['-periodo_anio', '-periodo_mes', 'activo']
        indexes = [
            models.Index(fields=['empresa', 'periodo_anio', 'periodo_mes']),
            models.Index(fields=['activo', 'periodo_anio', 'periodo_mes']),
        ]
        unique_together = [['activo', 'periodo_mes', 'periodo_anio']]

    def __str__(self):
        return f"{self.activo.codigo} - {self.periodo_mes:02d}/{self.periodo_anio}"

    def save(self, *args, **kwargs):
        """Override para validaciones."""
        # Validar que no se deprecie un activo dado de baja
        if self.activo.estado == 'dado_baja':
            raise ValidationError('No se puede depreciar un activo dado de baja.')

        super().save(*args, **kwargs)

    @classmethod
    def calcular_depreciacion_mensual(cls, activo, mes, anio):
        """
        Calcula y crea el registro de depreciación mensual para un activo.

        Args:
            activo: Instancia de ActivoFijo
            mes: Mes del período (1-12)
            anio: Año del período

        Returns:
            Instancia de Depreciacion creada o None si no aplica
        """
        # Validar que el activo esté activo
        if activo.estado == 'dado_baja':
            return None

        # Validar que el período sea posterior a la adquisición
        fecha_periodo = timezone.datetime(anio, mes, 1).date()
        if fecha_periodo < activo.fecha_adquisicion:
            return None

        # Verificar si ya existe
        if cls.objects.filter(activo=activo, periodo_mes=mes, periodo_anio=anio).exists():
            return cls.objects.get(activo=activo, periodo_mes=mes, periodo_anio=anio)

        # Calcular depreciación acumulada anterior
        depreciacion_anterior = cls.objects.filter(
            activo=activo,
            is_active=True
        ).order_by('-periodo_anio', '-periodo_mes').first()

        if depreciacion_anterior:
            depreciacion_acum_anterior = depreciacion_anterior.depreciacion_acumulada
        else:
            depreciacion_acum_anterior = Decimal('0.00')

        # Calcular depreciación del período
        depreciacion_periodo = activo.depreciacion_mensual

        # Calcular nueva depreciación acumulada
        nueva_depreciacion_acum = depreciacion_acum_anterior + depreciacion_periodo

        # No puede exceder el valor depreciable
        if nueva_depreciacion_acum > activo.valor_depreciable:
            nueva_depreciacion_acum = activo.valor_depreciable
            depreciacion_periodo = nueva_depreciacion_acum - depreciacion_acum_anterior

        # Calcular valor en libros
        valor_en_libros = activo.valor_adquisicion - nueva_depreciacion_acum

        # Crear registro
        depreciacion = cls.objects.create(
            empresa=activo.empresa,
            activo=activo,
            periodo_mes=mes,
            periodo_anio=anio,
            valor_inicial=activo.valor_adquisicion,
            depreciacion_periodo=depreciacion_periodo,
            depreciacion_acumulada=nueva_depreciacion_acum,
            valor_en_libros=valor_en_libros,
            created_by=activo.created_by
        )

        return depreciacion


# ==============================================================================
# MODELO: BAJA DE ACTIVO
# ==============================================================================

class Baja(BaseCompanyModel):
    """
    Baja de Activo - Registro del proceso de baja de activos.

    Documenta el proceso de baja de activos fijos con motivo, valor residual
    real y aprobación.
    """

    # Relaciones
    activo = models.OneToOneField(
        ActivoFijo,
        on_delete=models.CASCADE,
        related_name='baja',
        verbose_name='Activo',
        help_text='Activo a dar de baja'
    )

    # Información de la baja
    fecha_baja = models.DateField(
        verbose_name='Fecha de Baja',
        help_text='Fecha efectiva de la baja',
        db_index=True
    )
    motivo = models.CharField(
        max_length=30,
        choices=MOTIVO_BAJA_CHOICES,
        verbose_name='Motivo de Baja',
        db_index=True
    )
    valor_residual_real = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor Residual Real',
        help_text='Valor obtenido en venta o valor real de salvamento'
    )

    # Documentación
    acta_baja = models.FileField(
        upload_to='activos_fijos/bajas/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Acta de Baja',
        help_text='Archivo PDF del acta de baja'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Aprobación
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='bajas_aprobadas',
        verbose_name='Aprobado Por',
        help_text='Usuario que aprueba la baja'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    class Meta:
        db_table = 'admin_finance_baja_activo'
        verbose_name = 'Baja de Activo'
        verbose_name_plural = 'Bajas de Activos'
        ordering = ['-fecha_baja']
        indexes = [
            models.Index(fields=['empresa', 'fecha_baja']),
            models.Index(fields=['activo']),
            models.Index(fields=['fecha_baja']),
        ]

    def __str__(self):
        return f"Baja {self.activo.codigo} - {self.get_motivo_display()}"

    @property
    def diferencia_valor_residual(self):
        """Calcula la diferencia entre valor residual estimado y real."""
        return self.valor_residual_real - self.activo.valor_residual

    def save(self, *args, **kwargs):
        """Override para actualizar estado del activo."""
        es_nuevo = not self.pk

        # Validar que el activo no esté ya dado de baja
        if es_nuevo and self.activo.estado == 'dado_baja':
            raise ValidationError('El activo ya está dado de baja.')

        super().save(*args, **kwargs)

        # Actualizar estado del activo
        if es_nuevo:
            self.activo.estado = 'dado_baja'
            self.activo.save(update_fields=['estado', 'updated_at'])

    def aprobar(self, usuario):
        """Aprobar la baja del activo."""
        self.aprobado_por = usuario
        self.fecha_aprobacion = timezone.now()
        self.save(update_fields=['aprobado_por', 'fecha_aprobacion', 'updated_at'])
