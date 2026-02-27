"""
Modelos de Nómina - Talent Hub

Gestión completa de liquidación de nómina según legislación colombiana:
- Decreto 1072/2015 (Sistema de Gestión SST)
- Código Sustantivo del Trabajo
- Ley 50/1990 (Prestaciones sociales)
- Ley 100/1993 (Seguridad social)
- Ley 789/2002 (Jornada laboral)

Estructura:
- ConfiguracionNomina: Configuración anual por empresa
- ConceptoNomina: Catálogo de conceptos (devengados/deducciones)
- PeriodoNomina: Periodos de liquidación (quincenal/mensual)
- LiquidacionNomina: Liquidación individual por colaborador
- DetalleLiquidacion: Conceptos aplicados en liquidación
- Prestacion: Provisiones de prestaciones sociales
- PagoNomina: Registro de pagos realizados
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal

from apps.core.base_models import BaseCompanyModel


# =============================================================================
# OPCIONES Y CONSTANTES
# =============================================================================

TIPO_CONCEPTO_CHOICES = [
    ('devengado', 'Devengado'),
    ('deduccion', 'Deducción'),
]

CATEGORIA_CONCEPTO_CHOICES = [
    # Devengados
    ('salario', 'Salario Básico'),
    ('auxilio', 'Auxilio'),
    ('bonificacion', 'Bonificación'),
    ('comision', 'Comisión'),
    ('hora_extra', 'Hora Extra'),
    ('recargo_nocturno', 'Recargo Nocturno'),
    ('incapacidad', 'Incapacidad'),
    ('licencia', 'Licencia'),
    ('vacaciones', 'Vacaciones'),
    ('prima', 'Prima de Servicios'),
    ('cesantias', 'Cesantías'),
    ('intereses_cesantias', 'Intereses Cesantías'),

    # Deducciones
    ('salud', 'Salud'),
    ('pension', 'Pensión'),
    ('fondo_solidaridad', 'Fondo Solidaridad Pensional'),
    ('retencion_fuente', 'Retención en la Fuente'),
    ('libranza', 'Libranza'),
    ('embargo', 'Embargo'),
    ('fondo_empleados', 'Fondo de Empleados'),
    ('otro', 'Otro'),
]

TIPO_PERIODO_CHOICES = [
    ('primera_quincena', 'Primera Quincena'),
    ('segunda_quincena', 'Segunda Quincena'),
    ('mensual', 'Mensual'),
]

ESTADO_PERIODO_CHOICES = [
    ('abierto', 'Abierto'),
    ('preliquidado', 'Preliquidado'),
    ('liquidado', 'Liquidado'),
    ('pagado', 'Pagado'),
    ('cerrado', 'Cerrado'),
]

ESTADO_LIQUIDACION_CHOICES = [
    ('borrador', 'Borrador'),
    ('preliquidado', 'Preliquidado'),
    ('aprobado', 'Aprobado'),
    ('pagado', 'Pagado'),
    ('anulado', 'Anulado'),
]

TIPO_PRESTACION_CHOICES = [
    ('cesantias', 'Cesantías'),
    ('intereses_cesantias', 'Intereses Cesantías'),
    ('prima_servicios', 'Prima de Servicios'),
    ('vacaciones', 'Vacaciones'),
]

ESTADO_PRESTACION_CHOICES = [
    ('en_provision', 'En Provisión'),
    ('liquidada', 'Liquidada'),
    ('pagada', 'Pagada'),
]

METODO_PAGO_CHOICES = [
    ('transferencia', 'Transferencia Bancaria'),
    ('cheque', 'Cheque'),
    ('efectivo', 'Efectivo'),
]


# =============================================================================
# CONFIGURACIÓN DE NÓMINA
# =============================================================================

class ConfiguracionNomina(BaseCompanyModel):
    """
    Configuración de Nómina - Parámetros anuales por empresa.

    Contiene todos los parámetros legales y porcentajes según legislación colombiana.
    Debe existir una configuración por año fiscal.

    Referencias:
    - Decreto 1174/2020: Salario mínimo 2021
    - Ley 100/1993: Seguridad social
    - Ley 1607/2012: Parafiscales
    """

    # Año de configuración
    anio = models.PositiveIntegerField(
        verbose_name='Año',
        help_text='Año fiscal de aplicación'
    )

    # Salario mínimo legal vigente (SMLV)
    salario_minimo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Salario Mínimo Legal Vigente',
        help_text='Salario mínimo legal del año en COP'
    )
    auxilio_transporte = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Auxilio de Transporte',
        help_text='Auxilio de transporte legal del año en COP'
    )

    # Seguridad Social - Empleado (Ley 100/1993)
    porcentaje_salud_empleado = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('4.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='% Salud Empleado',
        help_text='Porcentaje de salud a cargo del empleado (default: 4%)'
    )
    porcentaje_pension_empleado = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('4.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='% Pensión Empleado',
        help_text='Porcentaje de pensión a cargo del empleado (default: 4%)'
    )

    # Seguridad Social - Empleador (Ley 100/1993)
    porcentaje_salud_empresa = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('8.50'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='% Salud Empresa',
        help_text='Porcentaje de salud a cargo del empleador (default: 8.5%)'
    )
    porcentaje_pension_empresa = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('12.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='% Pensión Empresa',
        help_text='Porcentaje de pensión a cargo del empleador (default: 12%)'
    )

    # ARL - Variable según riesgo (Decreto 1772/1994)
    porcentaje_arl = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.522'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='% ARL',
        help_text='Porcentaje ARL según clase de riesgo (0.522% a 6.96%)'
    )

    # Parafiscales - Empresas con más de 10 trabajadores o ingresos >150SMLV (Ley 1607/2012)
    porcentaje_caja_compensacion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('4.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='% Caja Compensación',
        help_text='Porcentaje caja compensación familiar (default: 4%)'
    )
    porcentaje_icbf = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('3.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='% ICBF',
        help_text='Porcentaje ICBF (default: 3%)'
    )
    porcentaje_sena = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('2.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='% SENA',
        help_text='Porcentaje SENA (default: 2%)'
    )

    # Prestaciones Sociales (Ley 50/1990)
    dias_base_cesantias = models.PositiveIntegerField(
        default=360,
        verbose_name='Días Base Cesantías',
        help_text='Días del año para cálculo de cesantías (default: 360)'
    )
    porcentaje_intereses_cesantias = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('12.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='% Intereses Cesantías',
        help_text='Porcentaje anual de intereses sobre cesantías (default: 12%)'
    )

    # Configuración de Prima de Servicios
    dias_base_prima = models.PositiveIntegerField(
        default=360,
        verbose_name='Días Base Prima',
        help_text='Días del año para cálculo de prima de servicios (default: 360)'
    )

    # Configuración de Vacaciones
    dias_vacaciones_por_anio = models.PositiveIntegerField(
        default=15,
        verbose_name='Días de Vacaciones por Año',
        help_text='Días hábiles de vacaciones por año trabajado (default: 15)'
    )

    # Fondo de Solidaridad Pensional (Ley 797/2003)
    salario_base_solidaridad = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('4.00'),
        verbose_name='Salarios Base Fondo Solidaridad',
        help_text='Salarios mínimos para aplicar fondo de solidaridad (default: 4 SMLV)'
    )
    porcentaje_solidaridad_empleado = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('1.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='% Solidaridad Empleado',
        help_text='Porcentaje fondo solidaridad (1% si >4SMLV, 2% si >20SMLV)'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_configuracion_nomina'
        verbose_name = 'Configuración de Nómina'
        verbose_name_plural = 'Configuraciones de Nómina'
        unique_together = [['empresa', 'anio']]
        ordering = ['-anio']
        indexes = [
            models.Index(fields=['empresa', 'anio']),
        ]

    def __str__(self):
        return f"Configuración Nómina {self.anio} - {self.empresa}"

    @property
    def total_seguridad_social_empleado(self):
        """Retorna el total de seguridad social a cargo del empleado."""
        return self.porcentaje_salud_empleado + self.porcentaje_pension_empleado

    @property
    def total_seguridad_social_empresa(self):
        """Retorna el total de seguridad social a cargo del empleador."""
        return (
            self.porcentaje_salud_empresa +
            self.porcentaje_pension_empresa +
            self.porcentaje_arl
        )

    @property
    def total_parafiscales(self):
        """Retorna el total de parafiscales."""
        return (
            self.porcentaje_caja_compensacion +
            self.porcentaje_icbf +
            self.porcentaje_sena
        )

    def clean(self):
        """Validaciones del modelo."""
        # Validar año
        if self.anio < 2000 or self.anio > 2100:
            raise ValidationError({
                'anio': 'Año inválido. Debe estar entre 2000 y 2100.'
            })


# =============================================================================
# CONCEPTO DE NÓMINA
# =============================================================================

class ConceptoNomina(BaseCompanyModel):
    """
    Concepto de Nómina - Catálogo de conceptos de devengados y deducciones.

    Define todos los conceptos que pueden aplicarse en una liquidación de nómina.
    Cada concepto tiene propiedades que determinan cómo afecta las bases de cálculo.
    """

    # Identificación
    codigo = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Código',
        help_text='Código único del concepto (ej: SAL_BASICO, HE_DIURNA)',
        db_index=True
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del Concepto'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Tipo y Categoría
    tipo = models.CharField(
        max_length=10,
        choices=TIPO_CONCEPTO_CHOICES,
        verbose_name='Tipo de Concepto',
        help_text='Devengado o Deducción',
        db_index=True
    )
    categoria = models.CharField(
        max_length=25,
        choices=CATEGORIA_CONCEPTO_CHOICES,
        verbose_name='Categoría',
        help_text='Categoría específica del concepto',
        db_index=True
    )

    # Propiedades del Concepto
    es_fijo = models.BooleanField(
        default=False,
        verbose_name='Es Fijo',
        help_text='Si se aplica automáticamente todos los periodos'
    )
    es_base_seguridad_social = models.BooleanField(
        default=False,
        verbose_name='Es Base Seguridad Social',
        help_text='Si se incluye en la base para salud y pensión'
    )
    es_base_parafiscales = models.BooleanField(
        default=False,
        verbose_name='Es Base Parafiscales',
        help_text='Si se incluye en la base para ICBF, SENA y Caja'
    )
    es_base_prestaciones = models.BooleanField(
        default=False,
        verbose_name='Es Base Prestaciones',
        help_text='Si se incluye en la base para cesantías, prima y vacaciones'
    )

    # Fórmula (opcional)
    formula = models.TextField(
        blank=True,
        null=True,
        verbose_name='Fórmula de Cálculo',
        help_text='Fórmula matemática para cálculo automático (opcional)'
    )

    # Orden de visualización
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización en liquidación',
        db_index=True
    )

    class Meta:
        db_table = 'talent_hub_concepto_nomina'
        verbose_name = 'Concepto de Nómina'
        verbose_name_plural = 'Conceptos de Nómina'
        unique_together = [['empresa', 'codigo']]
        ordering = ['tipo', 'orden', 'nombre']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['tipo', 'categoria']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            from utils.consecutivos import auto_generate_codigo
            auto_generate_codigo(self, 'CONCEPTO_NOMINA')
        super().save(*args, **kwargs)

    @property
    def es_devengado(self):
        """Verifica si es un concepto de devengado."""
        return self.tipo == 'devengado'

    @property
    def es_deduccion(self):
        """Verifica si es un concepto de deducción."""
        return self.tipo == 'deduccion'


# =============================================================================
# PERIODO DE NÓMINA
# =============================================================================

class PeriodoNomina(BaseCompanyModel):
    """
    Periodo de Nómina - Periodo de liquidación de nómina.

    Puede ser quincenal o mensual según configuración de la empresa.
    Controla el estado del proceso de liquidación.
    """

    # Identificación del Periodo
    anio = models.PositiveIntegerField(
        verbose_name='Año',
        db_index=True
    )
    mes = models.PositiveIntegerField(
        verbose_name='Mes',
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        db_index=True
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_PERIODO_CHOICES,
        verbose_name='Tipo de Periodo',
        help_text='Primera quincena, segunda quincena o mensual'
    )

    # Fechas del Periodo
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio',
        help_text='Primer día del periodo'
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha de Fin',
        help_text='Último día del periodo'
    )
    fecha_pago = models.DateField(
        verbose_name='Fecha de Pago Programada',
        help_text='Fecha estimada de pago'
    )

    # Estado del Periodo
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_PERIODO_CHOICES,
        default='abierto',
        verbose_name='Estado',
        db_index=True
    )

    # Totales del Periodo
    total_devengados = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total Devengados'
    )
    total_deducciones = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total Deducciones'
    )
    total_neto = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total Neto a Pagar'
    )
    numero_colaboradores = models.PositiveIntegerField(
        default=0,
        verbose_name='Número de Colaboradores',
        help_text='Cantidad de colaboradores en este periodo'
    )

    # Cierre del Periodo
    cerrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='periodos_nomina_cerrados',
        verbose_name='Cerrado Por'
    )
    fecha_cierre = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cierre'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_periodo_nomina'
        verbose_name = 'Periodo de Nómina'
        verbose_name_plural = 'Periodos de Nómina'
        unique_together = [['empresa', 'anio', 'mes', 'tipo']]
        ordering = ['-anio', '-mes', 'tipo']
        indexes = [
            models.Index(fields=['empresa', 'anio', 'mes']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_pago']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} {self.mes}/{self.anio} - {self.empresa}"

    @property
    def nombre_periodo(self):
        """Retorna nombre descriptivo del periodo."""
        meses = {
            1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
            5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
            9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
        }
        return f"{self.get_tipo_display()} - {meses[self.mes]} {self.anio}"

    @property
    def esta_abierto(self):
        """Verifica si el periodo está abierto para liquidaciones."""
        return self.estado == 'abierto'

    @property
    def esta_cerrado(self):
        """Verifica si el periodo está cerrado."""
        return self.estado == 'cerrado'

    def calcular_totales(self):
        """Calcula los totales del periodo desde las liquidaciones."""
        liquidaciones = self.liquidaciones.filter(is_active=True)

        self.total_devengados = sum(
            l.total_devengados for l in liquidaciones
        )
        self.total_deducciones = sum(
            l.total_deducciones for l in liquidaciones
        )
        self.total_neto = sum(
            l.neto_pagar for l in liquidaciones
        )
        self.numero_colaboradores = liquidaciones.count()

        self.save(update_fields=[
            'total_devengados', 'total_deducciones',
            'total_neto', 'numero_colaboradores'
        ])

    def clean(self):
        """Validaciones del modelo."""
        # Validar fechas
        if self.fecha_inicio and self.fecha_fin:
            if self.fecha_fin < self.fecha_inicio:
                raise ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio.'
                })

        # Validar que no se modifique periodo cerrado
        if self.pk and self.estado == 'cerrado':
            periodo_db = PeriodoNomina.objects.get(pk=self.pk)
            if periodo_db.estado == 'cerrado':
                raise ValidationError(
                    'No se puede modificar un periodo cerrado.'
                )


# =============================================================================
# LIQUIDACIÓN DE NÓMINA
# =============================================================================

class LiquidacionNomina(BaseCompanyModel):
    """
    Liquidación de Nómina - Liquidación individual por colaborador.

    Representa la liquidación de nómina de un colaborador en un periodo específico.
    Contiene los totales y el estado de aprobación y pago.
    """

    # Relaciones
    periodo = models.ForeignKey(
        PeriodoNomina,
        on_delete=models.PROTECT,
        related_name='liquidaciones',
        verbose_name='Periodo de Nómina'
    )
    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='liquidaciones_nomina',
        verbose_name='Colaborador'
    )

    # Datos Base de Liquidación
    salario_base = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Salario Base',
        help_text='Salario base del colaborador en el periodo'
    )
    dias_trabajados = models.PositiveIntegerField(
        verbose_name='Días Trabajados',
        help_text='Días efectivamente trabajados en el periodo'
    )

    # Totales
    total_devengados = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total Devengados'
    )
    total_deducciones = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total Deducciones'
    )
    neto_pagar = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Neto a Pagar',
        help_text='Total devengados - Total deducciones'
    )

    # Estado
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_LIQUIDACION_CHOICES,
        default='borrador',
        verbose_name='Estado',
        db_index=True
    )

    # Aprobación
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='liquidaciones_nomina_aprobadas',
        verbose_name='Aprobado Por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_liquidacion_nomina'
        verbose_name = 'Liquidación de Nómina'
        verbose_name_plural = 'Liquidaciones de Nómina'
        unique_together = [['periodo', 'colaborador']]
        ordering = ['-periodo__anio', '-periodo__mes', 'colaborador__primer_apellido']
        indexes = [
            models.Index(fields=['periodo', 'colaborador']),
            models.Index(fields=['estado']),
            models.Index(fields=['empresa', 'periodo']),
        ]

    def __str__(self):
        return f"Liquidación {self.colaborador.get_nombre_corto()} - {self.periodo.nombre_periodo}"

    @property
    def esta_aprobada(self):
        """Verifica si la liquidación está aprobada."""
        return self.estado == 'aprobado'

    @property
    def esta_pagada(self):
        """Verifica si la liquidación está pagada."""
        return self.estado == 'pagado'

    def calcular_totales(self):
        """Calcula los totales desde los detalles."""
        detalles = self.detalles.filter(is_active=True)

        self.total_devengados = sum(
            d.valor_total for d in detalles if d.es_devengado
        )
        self.total_deducciones = sum(
            d.valor_total for d in detalles if not d.es_devengado
        )
        self.neto_pagar = self.total_devengados - self.total_deducciones

        self.save(update_fields=[
            'total_devengados', 'total_deducciones', 'neto_pagar'
        ])

    def clean(self):
        """Validaciones del modelo."""
        # Validar que colaborador pertenezca a la misma empresa
        if self.colaborador and self.empresa:
            if self.colaborador.empresa != self.empresa:
                raise ValidationError({
                    'colaborador': 'El colaborador debe pertenecer a la misma empresa.'
                })

        # Validar que periodo pertenezca a la misma empresa
        if self.periodo and self.empresa:
            if self.periodo.empresa != self.empresa:
                raise ValidationError({
                    'periodo': 'El periodo debe pertenecer a la misma empresa.'
                })


# =============================================================================
# DETALLE DE LIQUIDACIÓN
# =============================================================================

class DetalleLiquidacion(BaseCompanyModel):
    """
    Detalle de Liquidación - Conceptos aplicados en una liquidación.

    Cada línea representa un concepto de nómina (devengado o deducción)
    aplicado a la liquidación del colaborador.
    """

    # Relaciones
    liquidacion = models.ForeignKey(
        LiquidacionNomina,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Liquidación'
    )
    concepto = models.ForeignKey(
        ConceptoNomina,
        on_delete=models.PROTECT,
        related_name='detalles_liquidacion',
        verbose_name='Concepto'
    )

    # Valores
    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('1.00'),
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Cantidad',
        help_text='Cantidad del concepto (horas, días, unidades)'
    )
    valor_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor Unitario',
        help_text='Valor por unidad'
    )
    valor_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor Total',
        help_text='Cantidad x Valor Unitario'
    )

    # Tipo
    es_devengado = models.BooleanField(
        verbose_name='Es Devengado',
        help_text='True si es devengado, False si es deducción'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_detalle_liquidacion'
        verbose_name = 'Detalle de Liquidación'
        verbose_name_plural = 'Detalles de Liquidación'
        ordering = ['liquidacion', '-es_devengado', 'concepto__orden']
        indexes = [
            models.Index(fields=['liquidacion', 'concepto']),
        ]

    def __str__(self):
        return f"{self.concepto.nombre} - ${self.valor_total}"

    def save(self, *args, **kwargs):
        """Override save para calcular valor_total automáticamente."""
        self.valor_total = self.cantidad * self.valor_unitario
        self.es_devengado = (self.concepto.tipo == 'devengado')
        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones del modelo."""
        # Validar que concepto pertenezca a la misma empresa
        if self.concepto and self.empresa:
            if self.concepto.empresa != self.empresa:
                raise ValidationError({
                    'concepto': 'El concepto debe pertenecer a la misma empresa.'
                })


# =============================================================================
# PRESTACIÓN SOCIAL
# =============================================================================

class Prestacion(BaseCompanyModel):
    """
    Prestación Social - Provisión de prestaciones sociales.

    Acumula las provisiones de cesantías, intereses, prima y vacaciones
    por colaborador anualmente.

    Referencias:
    - Ley 50/1990: Régimen de cesantías
    - Código Sustantivo del Trabajo: Prima y vacaciones
    """

    # Relaciones
    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='prestaciones',
        verbose_name='Colaborador'
    )

    # Periodo
    anio = models.PositiveIntegerField(
        verbose_name='Año',
        db_index=True
    )

    # Tipo de Prestación
    tipo = models.CharField(
        max_length=25,
        choices=TIPO_PRESTACION_CHOICES,
        verbose_name='Tipo de Prestación',
        db_index=True
    )

    # Valores
    valor_base = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Valor Base',
        help_text='Base salarial para cálculo'
    )
    dias_causados = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Días Causados',
        help_text='Días trabajados en el periodo'
    )
    valor_provisionado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Valor Provisionado',
        help_text='Valor acumulado de provisión'
    )
    valor_pagado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Valor Pagado',
        help_text='Valor ya pagado al colaborador'
    )

    # Estado
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_PRESTACION_CHOICES,
        default='en_provision',
        verbose_name='Estado',
        db_index=True
    )

    # Fechas
    fecha_inicio = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Inicio',
        help_text='Fecha de inicio del cálculo'
    )
    fecha_fin = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Fin',
        help_text='Fecha de fin del cálculo'
    )
    fecha_pago = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Pago'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_prestacion'
        verbose_name = 'Prestación Social'
        verbose_name_plural = 'Prestaciones Sociales'
        unique_together = [['colaborador', 'anio', 'tipo']]
        ordering = ['-anio', 'colaborador', 'tipo']
        indexes = [
            models.Index(fields=['colaborador', 'anio']),
            models.Index(fields=['tipo', 'estado']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} {self.anio} - {self.colaborador.get_nombre_corto()}"

    @property
    def saldo_pendiente(self):
        """Calcula el saldo pendiente de pago."""
        return self.valor_provisionado - self.valor_pagado

    @property
    def esta_pagada(self):
        """Verifica si la prestación está totalmente pagada."""
        return self.estado == 'pagada'


# =============================================================================
# PAGO DE NÓMINA
# =============================================================================

class PagoNomina(BaseCompanyModel):
    """
    Pago de Nómina - Registro de pago realizado.

    Documenta el pago efectivo realizado al colaborador,
    incluyendo método de pago y soportes.
    """

    # Relación
    liquidacion = models.ForeignKey(
        LiquidacionNomina,
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Liquidación'
    )

    # Datos del Pago
    fecha_pago = models.DateField(
        verbose_name='Fecha de Pago',
        db_index=True
    )
    metodo_pago = models.CharField(
        max_length=20,
        choices=METODO_PAGO_CHOICES,
        verbose_name='Método de Pago'
    )

    # Información Bancaria
    banco = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Banco',
        help_text='Banco receptor (si aplica)'
    )
    numero_cuenta = models.CharField(
        max_length=30,
        blank=True,
        verbose_name='Número de Cuenta',
        help_text='Cuenta de destino (si aplica)'
    )
    referencia_pago = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Referencia de Pago',
        help_text='Número de transacción, cheque, etc.'
    )

    # Valor
    valor_pagado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Valor Pagado'
    )

    # Comprobante
    comprobante = models.FileField(
        upload_to='nomina/comprobantes/',
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
        db_table = 'talent_hub_pago_nomina'
        verbose_name = 'Pago de Nómina'
        verbose_name_plural = 'Pagos de Nómina'
        ordering = ['-fecha_pago']
        indexes = [
            models.Index(fields=['liquidacion', 'fecha_pago']),
            models.Index(fields=['fecha_pago']),
        ]

    def __str__(self):
        return f"Pago {self.fecha_pago} - {self.liquidacion.colaborador.get_nombre_corto()} - ${self.valor_pagado}"

    def clean(self):
        """Validaciones del modelo."""
        # Validar que el valor pagado no exceda el neto a pagar
        if self.liquidacion and self.valor_pagado:
            if self.valor_pagado > self.liquidacion.neto_pagar:
                raise ValidationError({
                    'valor_pagado': 'El valor pagado no puede exceder el neto a pagar de la liquidación.'
                })
