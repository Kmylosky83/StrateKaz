"""
Modelos del módulo Planeación Estratégica - Dirección Estratégica

Secciones: plan_estrategico, objetivos, mapa_estrategico, kpis, gestion_cambio

Modelos:
- StrategicPlan: Plan estratégico con período y aprobación
- StrategicObjective: Objetivos con perspectiva BSC y vinculación ISO
- MapaEstrategico: Mapa estratégico con 4 perspectivas BSC
- CausaEfecto: Relaciones causa-efecto entre objetivos
- KPIObjetivo: Indicadores clave de desempeño
- MedicionKPI: Historial de mediciones
- GestionCambio: Gestión de cambios organizacionales
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

from apps.core.base_models import TimestampedModel, AuditModel, SoftDeleteModel, OrderedModel


class StrategicPlan(AuditModel, SoftDeleteModel):
    """
    Plan Estratégico

    Contiene el mapa estratégico y la planificación por períodos.
    Solo puede haber un plan activo a la vez.

    Campos heredados de AuditModel: created_at, updated_at, created_by, updated_by
    Campos heredados de SoftDeleteModel: is_active, deleted_at
    """

    PERIOD_CHOICES = [
        ('ANUAL', 'Anual'),
        ('BIANUAL', 'Bianual'),
        ('TRIANUAL', 'Trianual'),
        ('QUINQUENAL', 'Quinquenal'),
    ]

    STATUS_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('EN_REVISION', 'En Revisión'),
        ('APROBADO', 'Aprobado'),
        ('VIGENTE', 'Vigente'),
        ('CERRADO', 'Cerrado'),
    ]

    name = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre del plan estratégico (ej: Plan Estratégico 2024-2026)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción y alcance del plan'
    )
    period_type = models.CharField(
        max_length=20,
        choices=PERIOD_CHOICES,
        default='ANUAL',
        verbose_name='Tipo de período',
        db_index=True
    )
    start_date = models.DateField(
        verbose_name='Fecha de inicio',
        help_text='Fecha de inicio del plan',
        db_index=True
    )
    end_date = models.DateField(
        verbose_name='Fecha de fin',
        help_text='Fecha de finalización del plan'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='BORRADOR',
        verbose_name='Estado',
        db_index=True
    )
    strategic_map_image = models.ImageField(
        upload_to='strategic_plans/maps/',
        blank=True,
        null=True,
        verbose_name='Imagen del Mapa Estratégico'
    )
    strategic_map_description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción del Mapa Estratégico'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='strategic_plans_approved',
        verbose_name='Aprobado por'
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de aprobación'
    )

    class Meta:
        db_table = 'planeacion_strategic_plan'
        verbose_name = 'Plan Estratégico'
        verbose_name_plural = 'Planes Estratégicos'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['status', 'is_active'], name='plan_status_active_idx'),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        """Validación de fechas"""
        from django.core.exceptions import ValidationError
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValidationError({
                    'end_date': 'La fecha de fin debe ser posterior a la fecha de inicio'
                })

    def save(self, *args, **kwargs):
        if self.is_active:
            StrategicPlan.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    @property
    def progress(self):
        """Calcula el progreso general del plan basado en sus objetivos"""
        objectives = self.objectives.filter(is_active=True)
        if not objectives.exists():
            return 0
        total = objectives.count()
        completed = objectives.filter(progress=100).count()
        return round((completed / total) * 100, 1)

    @property
    def days_remaining(self):
        """Días restantes hasta el fin del plan"""
        if self.end_date:
            delta = self.end_date - timezone.now().date()
            return max(0, delta.days)
        return None

    @classmethod
    def get_active(cls):
        """Obtiene el plan estratégico activo"""
        return cls.objects.filter(is_active=True).first()

    def approve(self, user):
        """Aprueba el plan estratégico"""
        self.approved_by = user
        self.approved_at = timezone.now()
        self.status = 'APROBADO'
        self.save(update_fields=['approved_by', 'approved_at', 'status', 'updated_at'])


class StrategicObjective(AuditModel, SoftDeleteModel):
    """
    Objetivos Estratégicos

    Objetivos etiquetados con perspectiva BSC y vinculación a normas ISO.

    Campos heredados de AuditModel: created_at, updated_at, created_by, updated_by
    Campos heredados de SoftDeleteModel: is_active, deleted_at
    """

    BSC_PERSPECTIVE_CHOICES = [
        ('FINANCIERA', 'Financiera'),
        ('CLIENTES', 'Clientes'),
        ('PROCESOS', 'Procesos Internos'),
        ('APRENDIZAJE', 'Aprendizaje y Crecimiento'),
    ]

    # STATUS_CHOICES - Estados de workflow (fijos)
    STATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROGRESO', 'En Progreso'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
        ('RETRASADO', 'Retrasado'),
    ]

    plan = models.ForeignKey(
        StrategicPlan,
        on_delete=models.CASCADE,
        related_name='objectives',
        verbose_name='Plan Estratégico'
    )
    code = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del objetivo (ej: OE-001)'
    )
    name = models.CharField(
        max_length=300,
        verbose_name='Nombre',
        help_text='Nombre del objetivo estratégico'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del objetivo'
    )
    bsc_perspective = models.CharField(
        max_length=20,
        choices=BSC_PERSPECTIVE_CHOICES,
        db_index=True,
        verbose_name='Perspectiva BSC',
        help_text='Perspectiva del Balanced Scorecard'
    )
    normas_iso = models.ManyToManyField(
        'configuracion.NormaISO',
        blank=True,
        related_name='objetivos_estrategicos',
        verbose_name='Normas ISO',
        help_text='Normas ISO vinculadas al objetivo'
    )
    # DEPRECATED: Campo legacy para migración
    iso_standards_legacy = models.JSONField(
        default=list,
        blank=True,
        verbose_name='[DEPRECATED] Normas ISO (JSON)'
    )
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='strategic_objectives_responsible',
        verbose_name='Responsable'
    )
    responsible_cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='strategic_objectives_cargo',
        verbose_name='Cargo Responsable'
    )
    target_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Meta',
        help_text='Valor meta del indicador'
    )
    current_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Valor Actual',
        help_text='Valor actual del indicador'
    )
    unit = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Unidad',
        help_text='Unidad de medida (%, $, unidades, etc.)'
    )
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Progreso %',
        help_text='Porcentaje de avance (0-100)'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDIENTE',
        db_index=True,
        verbose_name='Estado'
    )
    start_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de inicio'
    )
    due_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha límite'
    )
    completed_at = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de completado'
    )
    orden = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name='Orden'
    )

    class Meta:
        db_table = 'planeacion_strategic_objective'
        verbose_name = 'Objetivo Estratégico'
        verbose_name_plural = 'Objetivos Estratégicos'
        ordering = ['bsc_perspective', 'orden', 'code']
        unique_together = [['plan', 'code']]
        indexes = [
            models.Index(fields=['plan', 'bsc_perspective'], name='obj_plan_perspective_idx'),
            models.Index(fields=['status', 'is_active'], name='obj_status_active_idx'),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def update_progress(self):
        """Actualiza el progreso basado en valor actual vs meta"""
        if self.target_value and self.current_value:
            progress = (float(self.current_value) / float(self.target_value)) * 100
            self.progress = min(100, max(0, round(progress)))
            if self.progress >= 100:
                self.status = 'COMPLETADO'
                self.completed_at = timezone.now().date()
            elif self.progress > 0:
                self.status = 'EN_PROGRESO'
            self.save(update_fields=['progress', 'status', 'completed_at', 'updated_at'])

    def check_delayed(self):
        """Verifica si el objetivo está retrasado"""
        if self.due_date and self.status not in ['COMPLETADO', 'CANCELADO']:
            if timezone.now().date() > self.due_date:
                self.status = 'RETRASADO'
                self.save(update_fields=['status', 'updated_at'])
                return True
        return False

    @property
    def is_on_track(self):
        """Indica si el objetivo va en buen camino"""
        return self.status in ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO']


# =============================================================================
# NUEVOS MODELOS - Semana 4
# =============================================================================

class MapaEstrategico(AuditModel, SoftDeleteModel):
    """
    Mapa Estratégico con visualización de las 4 perspectivas BSC.

    Permite crear un canvas visual con los objetivos organizados
    por perspectiva y las relaciones causa-efecto entre ellos.
    """

    plan = models.ForeignKey(
        StrategicPlan,
        on_delete=models.CASCADE,
        related_name='mapas',
        verbose_name='Plan Estratégico'
    )
    name = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre del mapa estratégico'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    canvas_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Datos del Canvas',
        help_text='Configuración visual del mapa (posiciones de nodos, etc.)'
    )
    image = models.ImageField(
        upload_to='strategic_maps/',
        blank=True,
        null=True,
        verbose_name='Imagen del Mapa'
    )
    version = models.CharField(
        max_length=20,
        default='1.0',
        verbose_name='Versión'
    )

    class Meta:
        db_table = 'planeacion_mapa_estrategico'
        verbose_name = 'Mapa Estratégico'
        verbose_name_plural = 'Mapas Estratégicos'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.plan.name}"


class CausaEfecto(TimestampedModel):
    """
    Relaciones causa-efecto entre objetivos del mapa estratégico.

    Representa las conexiones lógicas entre objetivos que muestran
    cómo el logro de un objetivo contribuye a otro.
    """

    mapa = models.ForeignKey(
        MapaEstrategico,
        on_delete=models.CASCADE,
        related_name='relaciones',
        verbose_name='Mapa Estratégico'
    )
    source_objective = models.ForeignKey(
        StrategicObjective,
        on_delete=models.CASCADE,
        related_name='causes',
        verbose_name='Objetivo Origen',
        help_text='Objetivo que causa el efecto'
    )
    target_objective = models.ForeignKey(
        StrategicObjective,
        on_delete=models.CASCADE,
        related_name='effects',
        verbose_name='Objetivo Destino',
        help_text='Objetivo que recibe el efecto'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Explicación de la relación causa-efecto'
    )
    weight = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Peso',
        help_text='Importancia de la relación (1-5)'
    )

    class Meta:
        db_table = 'planeacion_causa_efecto'
        verbose_name = 'Relación Causa-Efecto'
        verbose_name_plural = 'Relaciones Causa-Efecto'
        unique_together = [['mapa', 'source_objective', 'target_objective']]

    def __str__(self):
        return f"{self.source_objective.code} → {self.target_objective.code}"


class KPIObjetivo(AuditModel, SoftDeleteModel):
    """
    Indicadores Clave de Desempeño (KPI) vinculados a objetivos estratégicos.

    Cada KPI tiene umbrales de alerta y permite registrar mediciones
    periódicas para tracking del desempeño.
    """

    FREQUENCY_CHOICES = [
        ('DIARIO', 'Diario'),
        ('SEMANAL', 'Semanal'),
        ('QUINCENAL', 'Quincenal'),
        ('MENSUAL', 'Mensual'),
        ('BIMESTRAL', 'Bimestral'),
        ('TRIMESTRAL', 'Trimestral'),
        ('SEMESTRAL', 'Semestral'),
        ('ANUAL', 'Anual'),
    ]

    TREND_CHOICES = [
        ('MAYOR_MEJOR', 'Mayor es Mejor'),
        ('MENOR_MEJOR', 'Menor es Mejor'),
        ('EN_RANGO', 'En Rango'),
    ]

    objective = models.ForeignKey(
        StrategicObjective,
        on_delete=models.CASCADE,
        related_name='kpis',
        verbose_name='Objetivo Estratégico'
    )
    name = models.CharField(
        max_length=200,
        verbose_name='Nombre del KPI',
        help_text='Nombre del indicador'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del KPI'
    )
    formula = models.TextField(
        verbose_name='Fórmula',
        help_text='Fórmula de cálculo del indicador'
    )
    unit = models.CharField(
        max_length=50,
        verbose_name='Unidad',
        help_text='Unidad de medida (%, $, unidades, etc.)'
    )
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='MENSUAL',
        verbose_name='Frecuencia de Medición',
        db_index=True
    )
    trend_type = models.CharField(
        max_length=20,
        choices=TREND_CHOICES,
        default='MAYOR_MEJOR',
        verbose_name='Tipo de Tendencia'
    )
    target_value = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor Meta',
        help_text='Meta a alcanzar'
    )
    warning_threshold = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Umbral de Alerta',
        help_text='Valor que activa alerta amarilla'
    )
    critical_threshold = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Umbral Crítico',
        help_text='Valor que activa alerta roja'
    )
    min_value = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Valor Mínimo',
        help_text='Para tipo EN_RANGO'
    )
    max_value = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Valor Máximo',
        help_text='Para tipo EN_RANGO'
    )
    data_source = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Fuente de Datos',
        help_text='De dónde proviene la información'
    )
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='kpis_responsible',
        verbose_name='Responsable'
    )
    responsible_cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='kpis_cargo',
        verbose_name='Cargo Responsable'
    )
    last_value = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Último Valor'
    )
    last_measurement_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Última Medición'
    )

    class Meta:
        db_table = 'planeacion_kpi_objetivo'
        verbose_name = 'KPI de Objetivo'
        verbose_name_plural = 'KPIs de Objetivos'
        ordering = ['objective', 'name']
        indexes = [
            models.Index(fields=['objective', 'frequency'], name='kpi_obj_freq_idx'),
        ]

    def __str__(self):
        return f"{self.objective.code} - {self.name}"

    @property
    def status_semaforo(self):
        """Retorna el estado del semáforo (verde/amarillo/rojo)"""
        if self.last_value is None:
            return 'SIN_DATOS'

        value = float(self.last_value)
        target = float(self.target_value)
        warning = float(self.warning_threshold)
        critical = float(self.critical_threshold)

        if self.trend_type == 'MAYOR_MEJOR':
            if value >= target:
                return 'VERDE'
            elif value >= warning:
                return 'AMARILLO'
            else:
                return 'ROJO'
        elif self.trend_type == 'MENOR_MEJOR':
            if value <= target:
                return 'VERDE'
            elif value <= warning:
                return 'AMARILLO'
            else:
                return 'ROJO'
        else:  # EN_RANGO
            if self.min_value and self.max_value:
                if float(self.min_value) <= value <= float(self.max_value):
                    return 'VERDE'
            return 'ROJO'

    def add_measurement(self, value, measured_by, period=None, notes=None, evidence=None):
        """Agrega una nueva medición al KPI"""
        measurement = MedicionKPI.objects.create(
            kpi=self,
            period=period or timezone.now().date(),
            value=value,
            notes=notes,
            evidence_file=evidence,
            measured_by=measured_by
        )
        self.last_value = value
        self.last_measurement_date = measurement.period
        self.save(update_fields=['last_value', 'last_measurement_date', 'updated_at'])
        return measurement


class MedicionKPI(TimestampedModel):
    """
    Registro histórico de mediciones de KPI.

    Almacena todas las mediciones realizadas para cada KPI,
    permitiendo análisis de tendencias y trazabilidad.
    """

    kpi = models.ForeignKey(
        KPIObjetivo,
        on_delete=models.CASCADE,
        related_name='measurements',
        verbose_name='KPI'
    )
    period = models.DateField(
        verbose_name='Período',
        help_text='Fecha del período de medición',
        db_index=True
    )
    value = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor'
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas',
        help_text='Observaciones sobre la medición'
    )
    evidence_file = models.FileField(
        upload_to='kpi_evidence/',
        blank=True,
        null=True,
        verbose_name='Archivo de Evidencia'
    )
    measured_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='kpi_measurements',
        verbose_name='Medido por'
    )

    class Meta:
        db_table = 'planeacion_medicion_kpi'
        verbose_name = 'Medición de KPI'
        verbose_name_plural = 'Mediciones de KPI'
        ordering = ['-period']
        unique_together = [['kpi', 'period']]

    def __str__(self):
        return f"{self.kpi.name} - {self.period}: {self.value}"


class GestionCambio(AuditModel, SoftDeleteModel):
    """
    Gestión de Cambios Organizacionales.

    Registra y da seguimiento a los cambios estratégicos,
    estructurales, de procesos o tecnológicos de la organización.
    """

    # PRIORITY_CHOICES - Estándar técnico (fijo)
    PRIORITY_CHOICES = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('CRITICA', 'Crítica'),
    ]

    # STATUS_CHOICES - Estados de workflow (fijo)
    STATUS_CHOICES = [
        ('IDENTIFICADO', 'Identificado'),
        ('ANALISIS', 'En Análisis'),
        ('PLANIFICADO', 'Planificado'),
        ('EN_EJECUCION', 'En Ejecución'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]

    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Código',
        help_text='Código único del cambio (ej: GC-001)'
    )
    title = models.CharField(
        max_length=200,
        verbose_name='Título',
        help_text='Título descriptivo del cambio'
    )
    description = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada del cambio'
    )
    tipo_cambio = models.ForeignKey(
        'configuracion.TipoCambio',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='gestiones_cambio',
        verbose_name='Tipo de Cambio',
        db_index=True
    )
    # DEPRECATED: Campo legacy para migración
    change_type_legacy = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='[DEPRECATED] Tipo de Cambio (código)'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='MEDIA',
        verbose_name='Prioridad',
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='IDENTIFICADO',
        verbose_name='Estado',
        db_index=True
    )
    impact_analysis = models.TextField(
        blank=True,
        null=True,
        verbose_name='Análisis de Impacto',
        help_text='Evaluación del impacto del cambio'
    )
    risk_assessment = models.TextField(
        blank=True,
        null=True,
        verbose_name='Evaluación de Riesgos',
        help_text='Riesgos identificados y mitigación'
    )
    action_plan = models.TextField(
        blank=True,
        null=True,
        verbose_name='Plan de Acción',
        help_text='Acciones a ejecutar para implementar el cambio'
    )
    resources_required = models.TextField(
        blank=True,
        null=True,
        verbose_name='Recursos Requeridos'
    )
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cambios_responsible',
        verbose_name='Responsable'
    )
    responsible_cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cambios_cargo',
        verbose_name='Cargo Responsable'
    )
    start_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Inicio'
    )
    due_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha Límite'
    )
    completed_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Completado'
    )
    related_objectives = models.ManyToManyField(
        StrategicObjective,
        blank=True,
        related_name='related_changes',
        verbose_name='Objetivos Relacionados'
    )
    lessons_learned = models.TextField(
        blank=True,
        null=True,
        verbose_name='Lecciones Aprendidas'
    )

    class Meta:
        db_table = 'planeacion_gestion_cambio'
        verbose_name = 'Gestión de Cambio'
        verbose_name_plural = 'Gestión de Cambios'
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['status', 'priority'], name='cambio_status_priority_idx'),
            models.Index(fields=['is_active'], name='cambio_active_idx'),
        ]

    def __str__(self):
        tipo_str = self.tipo_cambio.name if self.tipo_cambio else 'Sin Tipo'
        return f"{self.code} - {self.title} ({tipo_str})"

    def transition_status(self, new_status, user=None):
        """Cambia el estado con validaciones"""
        valid_transitions = {
            'IDENTIFICADO': ['ANALISIS', 'CANCELADO'],
            'ANALISIS': ['PLANIFICADO', 'CANCELADO'],
            'PLANIFICADO': ['EN_EJECUCION', 'CANCELADO'],
            'EN_EJECUCION': ['COMPLETADO', 'CANCELADO'],
            'COMPLETADO': [],
            'CANCELADO': [],
        }

        if new_status not in valid_transitions.get(self.status, []):
            raise ValueError(
                f"Transición no válida de '{self.status}' a '{new_status}'"
            )

        self.status = new_status
        if new_status == 'COMPLETADO':
            self.completed_date = timezone.now().date()
        if user:
            self.updated_by = user
        self.save()
