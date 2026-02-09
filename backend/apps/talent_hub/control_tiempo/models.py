"""
Modelos de Control de Tiempo - Talent Hub

Gestión de turnos, asistencia, horas extras y consolidados mensuales.

Estructura:
- Turno: Configuración de turnos laborales
- AsignacionTurno: Asignación de turno a colaborador
- RegistroAsistencia: Registro diario de asistencia
- HoraExtra: Registro de horas extras
- ConsolidadoAsistencia: Resumen mensual por colaborador
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, time, timedelta

from apps.core.base_models import BaseCompanyModel


# =============================================================================
# OPCIONES Y CONSTANTES
# =============================================================================

DIAS_SEMANA_CHOICES = [
    ('lunes', 'Lunes'),
    ('martes', 'Martes'),
    ('miercoles', 'Miércoles'),
    ('jueves', 'Jueves'),
    ('viernes', 'Viernes'),
    ('sabado', 'Sábado'),
    ('domingo', 'Domingo'),
]

ESTADO_ASISTENCIA_CHOICES = [
    ('presente', 'Presente'),
    ('ausente', 'Ausente'),
    ('tardanza', 'Tardanza'),
    ('permiso', 'Permiso'),
    ('incapacidad', 'Incapacidad'),
    ('vacaciones', 'Vacaciones'),
    ('licencia', 'Licencia'),
]

TIPO_JORNADA_CHOICES = [
    ('ordinaria', 'Jornada Ordinaria'),
    ('flexible', 'Jornada Flexible'),
    ('por_turnos', 'Jornada por Turnos'),
    ('reducida', 'Jornada Reducida'),
]

TIPO_HORA_EXTRA_CHOICES = [
    ('diurna', 'Diurna - Recargo 25%'),
    ('nocturna', 'Nocturna - Recargo 75%'),
    ('dominical_diurna', 'Dominical Diurna - Recargo 75%'),
    ('dominical_nocturna', 'Dominical Nocturna - Recargo 110%'),
    ('festivo_diurna', 'Festivo Diurna - Recargo 75%'),
    ('festivo_nocturna', 'Festivo Nocturna - Recargo 110%'),
]

ESTADO_HORA_EXTRA_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('aprobada', 'Aprobada'),
    ('rechazada', 'Rechazada'),
]

# Factores de recargo según legislación colombiana
FACTOR_RECARGO_MAP = {
    'diurna': Decimal('1.25'),           # 25% recargo
    'nocturna': Decimal('1.75'),         # 75% recargo
    'dominical_diurna': Decimal('1.75'),  # 75% recargo
    'dominical_nocturna': Decimal('2.10'), # 110% recargo
    'festivo_diurna': Decimal('1.75'),    # 75% recargo
    'festivo_nocturna': Decimal('2.10'),  # 110% recargo
}


# =============================================================================
# TURNO - Configuración de turnos laborales
# =============================================================================

class Turno(BaseCompanyModel):
    """
    Turno - Configuración de turnos laborales.

    Define horarios de trabajo con configuración de jornada, recargos nocturnos
    y días aplicables.

    Hereda de BaseCompanyModel:
    - empresa (FK a EmpresaConfig)
    - created_at, updated_at, created_by, updated_by
    - is_active, deleted_at, soft_delete(), restore()
    """

    codigo = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del turno (Ej: T1, MAÑANA, NOCHE)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del Turno'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Horarios
    hora_inicio = models.TimeField(
        verbose_name='Hora de Inicio',
        help_text='Hora de inicio de la jornada'
    )
    hora_fin = models.TimeField(
        verbose_name='Hora de Fin',
        help_text='Hora de finalización de la jornada'
    )

    # Duración
    duracion_jornada = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Duración de Jornada (horas)',
        help_text='Horas totales de la jornada'
    )

    # Recargo Nocturno
    aplica_recargo_nocturno = models.BooleanField(
        default=False,
        verbose_name='Aplica Recargo Nocturno',
        help_text='Si el turno incluye horas nocturnas (10pm - 6am)'
    )

    # Días aplicables
    dias_semana = models.JSONField(
        default=list,
        verbose_name='Días de la Semana',
        help_text='Lista de días en que aplica el turno. Ej: ["lunes", "martes", ...]'
    )

    # Ley 2101/2021 - Reducción gradual de jornada laboral
    horas_semanales_maximas = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=Decimal('42.00'),
        validators=[MinValueValidator(Decimal('1.00')), MaxValueValidator(Decimal('48.00'))],
        verbose_name='Horas Semanales Máximas',
        help_text='Ley 2101/2021 - Reducción progresiva: 47h(2023), 46h(2024), 44h(2025), 42h(julio 2026)'
    )
    tipo_jornada = models.CharField(
        max_length=20,
        choices=TIPO_JORNADA_CHOICES,
        default='ordinaria',
        verbose_name='Tipo de Jornada',
        help_text='Tipo de jornada según legislación colombiana'
    )

    class Meta:
        db_table = 'talent_hub_turno'
        verbose_name = 'Turno'
        verbose_name_plural = 'Turnos'
        ordering = ['codigo']
        unique_together = [['empresa', 'codigo']]
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.hora_inicio.strftime('%H:%M')} - {self.hora_fin.strftime('%H:%M')})"

    def clean(self):
        """Validaciones del modelo."""
        # Validar que días_semana contenga valores válidos
        if self.dias_semana:
            dias_validos = [d[0] for d in DIAS_SEMANA_CHOICES]
            for dia in self.dias_semana:
                if dia not in dias_validos:
                    raise ValidationError({
                        'dias_semana': f'Día inválido: {dia}. Valores permitidos: {dias_validos}'
                    })

    @property
    def horario_formateado(self):
        """Retorna el horario en formato legible."""
        return f"{self.hora_inicio.strftime('%I:%M %p')} - {self.hora_fin.strftime('%I:%M %p')}"

    @property
    def es_turno_nocturno(self):
        """Verifica si es un turno nocturno."""
        return self.aplica_recargo_nocturno

    def calcular_horas_nocturnas(self):
        """
        Calcula las horas nocturnas del turno (10pm - 6am).
        Según legislación colombiana.
        """
        # Hora nocturna: 10pm (22:00) a 6am (06:00)
        hora_inicio_nocturna = time(22, 0)
        hora_fin_nocturna = time(6, 0)

        # Implementación simplificada - requiere lógica compleja para turnos que cruzan medianoche
        if self.aplica_recargo_nocturno:
            # Estimación básica
            if self.hora_inicio >= hora_inicio_nocturna or self.hora_fin <= hora_fin_nocturna:
                return self.duracion_jornada
        return Decimal('0.00')


# =============================================================================
# ASIGNACIÓN DE TURNO - Asignación a colaborador
# =============================================================================

class AsignacionTurno(BaseCompanyModel):
    """
    Asignación de Turno - Asignación de turno a un colaborador.

    Gestiona qué colaborador trabaja en qué turno, con fechas de vigencia
    y posibilidad de turnos rotativos.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='asignaciones_turno',
        verbose_name='Colaborador'
    )
    turno = models.ForeignKey(
        Turno,
        on_delete=models.PROTECT,
        related_name='asignaciones',
        verbose_name='Turno'
    )

    # Fechas de Vigencia
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio',
        help_text='Fecha desde la cual aplica el turno'
    )
    fecha_fin = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Fin',
        help_text='Fecha hasta la cual aplica (null = indefinido)'
    )

    # Tipo de Asignación
    es_rotativo = models.BooleanField(
        default=False,
        verbose_name='Es Rotativo',
        help_text='Si el turno rota con otros'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_asignacion_turno'
        verbose_name = 'Asignación de Turno'
        verbose_name_plural = 'Asignaciones de Turno'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['colaborador', 'fecha_inicio']),
            models.Index(fields=['turno']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.turno.nombre} (desde {self.fecha_inicio})"

    def clean(self):
        """Validaciones del modelo."""
        # Validar fechas
        if self.fecha_fin and self.fecha_inicio:
            if self.fecha_fin < self.fecha_inicio:
                raise ValidationError({
                    'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'
                })

        # Validar que colaborador y turno pertenezcan a la misma empresa
        if self.colaborador and self.turno:
            if self.colaborador.empresa != self.turno.empresa:
                raise ValidationError(
                    'El colaborador y el turno deben pertenecer a la misma empresa.'
                )

    @property
    def esta_vigente(self):
        """Verifica si la asignación está vigente."""
        hoy = timezone.now().date()
        if self.fecha_inicio > hoy:
            return False
        if self.fecha_fin and self.fecha_fin < hoy:
            return False
        return self.is_active


# =============================================================================
# REGISTRO DE ASISTENCIA - Registro diario
# =============================================================================

class RegistroAsistencia(BaseCompanyModel):
    """
    Registro de Asistencia - Registro diario de asistencia del colaborador.

    Captura entrada, salida, tiempos de almuerzo y estado de asistencia.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='registros_asistencia',
        verbose_name='Colaborador'
    )
    turno = models.ForeignKey(
        Turno,
        on_delete=models.PROTECT,
        related_name='registros_asistencia',
        verbose_name='Turno'
    )

    # Fecha
    fecha = models.DateField(
        db_index=True,
        verbose_name='Fecha',
        help_text='Fecha del registro de asistencia'
    )

    # Horarios
    hora_entrada = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora de Entrada'
    )
    hora_salida = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora de Salida'
    )
    hora_entrada_almuerzo = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora Entrada Almuerzo'
    )
    hora_salida_almuerzo = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora Salida Almuerzo'
    )

    # Estado
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_ASISTENCIA_CHOICES,
        default='presente',
        db_index=True,
        verbose_name='Estado de Asistencia'
    )

    # Tardanza
    minutos_tardanza = models.PositiveIntegerField(
        default=0,
        verbose_name='Minutos de Tardanza',
        help_text='Minutos de retraso (calculado automáticamente)'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Registro
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='asistencias_registradas',
        verbose_name='Registrado Por'
    )

    class Meta:
        db_table = 'talent_hub_registro_asistencia'
        verbose_name = 'Registro de Asistencia'
        verbose_name_plural = 'Registros de Asistencia'
        ordering = ['-fecha', 'colaborador']
        unique_together = [['colaborador', 'fecha']]
        indexes = [
            models.Index(fields=['fecha']),
            models.Index(fields=['colaborador', 'fecha']),
            models.Index(fields=['estado']),
            models.Index(fields=['empresa', 'fecha']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.fecha} ({self.get_estado_display()})"

    def clean(self):
        """Validaciones del modelo."""
        # Si está presente, debe tener hora de entrada
        if self.estado == 'presente' and not self.hora_entrada:
            raise ValidationError({
                'hora_entrada': 'Debe registrar hora de entrada para asistencia presente.'
            })

        # Hora de salida no puede ser anterior a entrada
        if self.hora_entrada and self.hora_salida:
            # Comparación simple - no maneja turnos que cruzan medianoche
            if self.hora_salida < self.hora_entrada:
                # Podría ser turno nocturno que cruza medianoche
                pass

    def save(self, *args, **kwargs):
        """Override de save para calcular tardanza automáticamente."""
        # Calcular tardanza si hay hora de entrada
        if self.hora_entrada and self.turno:
            entrada_programada = self.turno.hora_inicio

            # Convertir a datetime para comparación
            entrada_real = datetime.combine(self.fecha, self.hora_entrada)
            entrada_esperada = datetime.combine(self.fecha, entrada_programada)

            if entrada_real > entrada_esperada:
                diferencia = entrada_real - entrada_esperada
                self.minutos_tardanza = int(diferencia.total_seconds() / 60)

                # Si hay tardanza significativa (>5 min), marcar estado
                if self.minutos_tardanza > 5 and self.estado == 'presente':
                    self.estado = 'tardanza'
            else:
                self.minutos_tardanza = 0

        super().save(*args, **kwargs)

    @property
    def horas_trabajadas(self):
        """Calcula las horas trabajadas del día."""
        if not self.hora_entrada or not self.hora_salida:
            return Decimal('0.00')

        # Calcular diferencia
        entrada = datetime.combine(self.fecha, self.hora_entrada)
        salida = datetime.combine(self.fecha, self.hora_salida)

        # Si salida es menor que entrada, asumimos turno nocturno
        if salida < entrada:
            salida += timedelta(days=1)

        diferencia = salida - entrada

        # Restar tiempo de almuerzo si aplica
        if self.hora_entrada_almuerzo and self.hora_salida_almuerzo:
            almuerzo_inicio = datetime.combine(self.fecha, self.hora_entrada_almuerzo)
            almuerzo_fin = datetime.combine(self.fecha, self.hora_salida_almuerzo)
            tiempo_almuerzo = almuerzo_fin - almuerzo_inicio
            diferencia -= tiempo_almuerzo

        horas = Decimal(str(diferencia.total_seconds() / 3600))
        return round(horas, 2)

    @property
    def llego_tarde(self):
        """Verifica si llegó tarde."""
        return self.minutos_tardanza > 0


# =============================================================================
# CONFIGURACIÓN DE RECARGOS - Ley 2466/2025
# =============================================================================

class ConfiguracionRecargo(BaseCompanyModel):
    """
    Configuración de factores de recargo por tipo de hora extra.

    Ley 2466/2025: Incremento gradual de recargos dominicales y festivos:
    - Fase 1 (Jul 2025): 80% del recargo pleno
    - Fase 2 (Jul 2026): 90% del recargo pleno
    - Fase 3 (Jul 2027): 100% del recargo pleno
    """

    tipo_hora_extra = models.CharField(
        max_length=25,
        choices=TIPO_HORA_EXTRA_CHOICES,
        verbose_name='Tipo de Hora Extra'
    )
    factor_vigente = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        verbose_name='Factor Vigente Actual',
        help_text='Factor de recargo vigente antes de la ley'
    )

    # Fases de implementación Ley 2466/2025
    factor_fase_1 = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        verbose_name='Factor Fase 1 (80%)',
        help_text='Desde julio 2025 - 80% del recargo pleno'
    )
    fecha_inicio_fase_1 = models.DateField(
        default='2025-07-15',
        verbose_name='Inicio Fase 1'
    )
    factor_fase_2 = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        verbose_name='Factor Fase 2 (90%)',
        help_text='Desde julio 2026 - 90% del recargo pleno'
    )
    fecha_inicio_fase_2 = models.DateField(
        default='2026-07-15',
        verbose_name='Inicio Fase 2'
    )
    factor_fase_3 = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        verbose_name='Factor Fase 3 (100%)',
        help_text='Desde julio 2027 - 100% del recargo pleno'
    )
    fecha_inicio_fase_3 = models.DateField(
        default='2027-07-15',
        verbose_name='Inicio Fase 3'
    )

    class Meta:
        db_table = 'talent_hub_configuracion_recargo'
        verbose_name = 'Configuración de Recargo'
        verbose_name_plural = 'Configuraciones de Recargo'
        unique_together = [['empresa', 'tipo_hora_extra']]
        ordering = ['tipo_hora_extra']

    def __str__(self):
        return f"{self.get_tipo_hora_extra_display()} - Factor actual: {self.get_factor_actual()}"

    def get_factor_actual(self):
        """Retorna el factor de recargo vigente según la fecha actual."""
        hoy = timezone.now().date()
        if hoy >= self.fecha_inicio_fase_3:
            return self.factor_fase_3
        elif hoy >= self.fecha_inicio_fase_2:
            return self.factor_fase_2
        elif hoy >= self.fecha_inicio_fase_1:
            return self.factor_fase_1
        return self.factor_vigente


# =============================================================================
# HORA EXTRA - Registro de horas extras
# =============================================================================

class HoraExtra(BaseCompanyModel):
    """
    Hora Extra - Registro de horas extras trabajadas.

    Gestiona solicitud, aprobación y cálculo de recargos según tipo de hora extra
    (diurna, nocturna, dominical, festivo) según legislación colombiana.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='horas_extras',
        verbose_name='Colaborador'
    )

    # Fecha y Horas
    fecha = models.DateField(
        db_index=True,
        verbose_name='Fecha',
        help_text='Fecha en que se trabajaron las horas extras'
    )
    hora_inicio = models.TimeField(
        verbose_name='Hora de Inicio'
    )
    hora_fin = models.TimeField(
        verbose_name='Hora de Fin'
    )

    # Tipo de Hora Extra
    tipo = models.CharField(
        max_length=25,
        choices=TIPO_HORA_EXTRA_CHOICES,
        db_index=True,
        verbose_name='Tipo de Hora Extra'
    )

    # Cálculo
    horas_trabajadas = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Horas Trabajadas',
        help_text='Horas extras trabajadas (calculado automáticamente)'
    )
    factor_recargo = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        verbose_name='Factor de Recargo',
        help_text='Multiplicador según tipo (1.25, 1.75, 2.10)'
    )

    # Justificación
    justificacion = models.TextField(
        verbose_name='Justificación',
        help_text='Motivo o actividad que justifica las horas extras'
    )

    # Aprobación
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_HORA_EXTRA_CHOICES,
        default='pendiente',
        db_index=True,
        verbose_name='Estado'
    )
    aprobado = models.BooleanField(
        default=False,
        verbose_name='Aprobado'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='horas_extras_aprobadas',
        verbose_name='Aprobado Por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    class Meta:
        db_table = 'talent_hub_hora_extra'
        verbose_name = 'Hora Extra'
        verbose_name_plural = 'Horas Extras'
        ordering = ['-fecha', 'colaborador']
        indexes = [
            models.Index(fields=['fecha']),
            models.Index(fields=['colaborador', 'fecha']),
            models.Index(fields=['estado']),
            models.Index(fields=['tipo']),
            models.Index(fields=['empresa', 'fecha']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.fecha} ({self.horas_trabajadas}h {self.get_tipo_display()})"

    def clean(self):
        """Validaciones del modelo."""
        # Calcular horas para validar
        if self.hora_inicio and self.hora_fin:
            inicio = datetime.combine(self.fecha or timezone.now().date(), self.hora_inicio)
            fin = datetime.combine(self.fecha or timezone.now().date(), self.hora_fin)
            if fin < inicio:
                fin += timedelta(days=1)
            horas = Decimal(str((fin - inicio).total_seconds() / 3600))

            # Ley 2466/2025: Máximo 2 horas extra por día
            if horas > Decimal('2.00'):
                raise ValidationError({
                    'hora_fin': 'Ley 2466/2025: Máximo 2 horas extra por día.'
                })

        # Ley 2466/2025: Máximo 12 horas extra por semana
        if self.colaborador and self.fecha:
            from datetime import timedelta as td
            # Calcular inicio de semana (lunes)
            dia_semana = self.fecha.weekday()
            inicio_semana = self.fecha - td(days=dia_semana)
            fin_semana = inicio_semana + td(days=6)

            horas_semana_qs = HoraExtra.objects.filter(
                colaborador=self.colaborador,
                fecha__gte=inicio_semana,
                fecha__lte=fin_semana,
                is_active=True,
                estado__in=['pendiente', 'aprobada']
            )
            if self.pk:
                horas_semana_qs = horas_semana_qs.exclude(pk=self.pk)

            total_semana = sum(
                he.horas_trabajadas for he in horas_semana_qs
            ) or Decimal('0')

            if self.hora_inicio and self.hora_fin:
                inicio = datetime.combine(self.fecha, self.hora_inicio)
                fin = datetime.combine(self.fecha, self.hora_fin)
                if fin < inicio:
                    fin += timedelta(days=1)
                horas_nuevas = Decimal(str((fin - inicio).total_seconds() / 3600))
                total_semana += horas_nuevas

            if total_semana > Decimal('12.00'):
                raise ValidationError(
                    'Ley 2466/2025: Máximo 12 horas extra por semana. '
                    f'Total acumulado esta semana: {total_semana:.1f}h.'
                )

    def save(self, *args, **kwargs):
        """Override de save para calcular horas y factor automáticamente."""
        # Calcular horas trabajadas
        inicio = datetime.combine(self.fecha, self.hora_inicio)
        fin = datetime.combine(self.fecha, self.hora_fin)

        # Si fin < inicio, asumimos que cruza medianoche
        if fin < inicio:
            fin += timedelta(days=1)

        diferencia = fin - inicio
        self.horas_trabajadas = Decimal(str(diferencia.total_seconds() / 3600))
        self.horas_trabajadas = round(self.horas_trabajadas, 2)

        # Asignar factor de recargo: usar ConfiguracionRecargo si existe, sino fallback
        try:
            config = ConfiguracionRecargo.objects.get(
                empresa=self.empresa,
                tipo_hora_extra=self.tipo,
                is_active=True
            )
            self.factor_recargo = config.get_factor_actual()
        except ConfiguracionRecargo.DoesNotExist:
            self.factor_recargo = FACTOR_RECARGO_MAP.get(self.tipo, Decimal('1.25'))

        # Si se aprueba, actualizar campos
        if self.estado == 'aprobada' and not self.aprobado:
            self.aprobado = True
            if not self.fecha_aprobacion:
                self.fecha_aprobacion = timezone.now()

        super().save(*args, **kwargs)

    @property
    def horas_con_recargo(self):
        """Calcula las horas con recargo aplicado."""
        return self.horas_trabajadas * self.factor_recargo

    @property
    def porcentaje_recargo(self):
        """Retorna el porcentaje de recargo."""
        return (self.factor_recargo - 1) * 100

    @property
    def valor_estimado(self):
        """
        Calcula valor estimado de las horas extras.
        Requiere salario del colaborador.
        """
        if not hasattr(self.colaborador, 'salario'):
            return None

        # Salario mensual / 240 horas mensuales = valor hora
        valor_hora = self.colaborador.salario / Decimal('240')
        valor_he = valor_hora * self.horas_con_recargo
        return round(valor_he, 2)


# =============================================================================
# CONSOLIDADO DE ASISTENCIA - Resumen mensual
# =============================================================================

class ConsolidadoAsistencia(BaseCompanyModel):
    """
    Consolidado de Asistencia - Resumen mensual por colaborador.

    Consolida estadísticas de asistencia, tardanzas y horas extras
    para procesamiento de nómina.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='consolidados_asistencia',
        verbose_name='Colaborador'
    )

    # Período
    anio = models.PositiveIntegerField(
        validators=[
            MinValueValidator(2000),
            MaxValueValidator(2100)
        ],
        verbose_name='Año'
    )
    mes = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(12)
        ],
        verbose_name='Mes'
    )

    # Estadísticas de Asistencia
    dias_trabajados = models.PositiveIntegerField(
        default=0,
        verbose_name='Días Trabajados'
    )
    dias_ausente = models.PositiveIntegerField(
        default=0,
        verbose_name='Días Ausente'
    )
    dias_tardanza = models.PositiveIntegerField(
        default=0,
        verbose_name='Días con Tardanza'
    )

    # Horas
    total_horas_trabajadas = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total Horas Trabajadas'
    )
    total_horas_extras = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total Horas Extras'
    )
    total_minutos_tardanza = models.PositiveIntegerField(
        default=0,
        verbose_name='Total Minutos de Tardanza'
    )

    # Porcentaje de Asistencia
    porcentaje_asistencia = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        verbose_name='Porcentaje de Asistencia'
    )

    # Cierre
    cerrado = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name='Cerrado',
        help_text='Si el consolidado está cerrado para modificaciones'
    )
    cerrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='consolidados_cerrados',
        verbose_name='Cerrado Por'
    )
    fecha_cierre = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cierre'
    )

    class Meta:
        db_table = 'talent_hub_consolidado_asistencia'
        verbose_name = 'Consolidado de Asistencia'
        verbose_name_plural = 'Consolidados de Asistencia'
        ordering = ['-anio', '-mes', 'colaborador']
        unique_together = [['colaborador', 'anio', 'mes']]
        indexes = [
            models.Index(fields=['anio', 'mes']),
            models.Index(fields=['colaborador', 'anio', 'mes']),
            models.Index(fields=['cerrado']),
            models.Index(fields=['empresa', 'anio', 'mes']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.mes}/{self.anio}"

    def clean(self):
        """Validaciones del modelo."""
        # Validar rango de mes
        if not (1 <= self.mes <= 12):
            raise ValidationError({
                'mes': 'El mes debe estar entre 1 y 12.'
            })

    @property
    def periodo_formateado(self):
        """Retorna el período en formato legible."""
        meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        return f"{meses[self.mes - 1]} {self.anio}"

    @property
    def total_dias_periodo(self):
        """Calcula el total de días del período."""
        import calendar
        return calendar.monthrange(self.anio, self.mes)[1]

    @property
    def total_horas_tardanza(self):
        """Convierte minutos de tardanza a horas."""
        return round(Decimal(self.total_minutos_tardanza) / Decimal('60'), 2)

    def calcular_estadisticas(self):
        """
        Calcula las estadísticas del consolidado basado en registros.
        Debe llamarse antes de cerrar.
        """
        # Obtener todos los registros del período
        registros = RegistroAsistencia.objects.filter(
            colaborador=self.colaborador,
            fecha__year=self.anio,
            fecha__month=self.mes,
            is_active=True
        )

        # Calcular estadísticas
        self.dias_trabajados = registros.filter(estado='presente').count() + registros.filter(estado='tardanza').count()
        self.dias_ausente = registros.filter(estado='ausente').count()
        self.dias_tardanza = registros.filter(estado='tardanza').count()

        # Total horas trabajadas
        total_horas = Decimal('0.00')
        for registro in registros.filter(estado__in=['presente', 'tardanza']):
            total_horas += registro.horas_trabajadas
        self.total_horas_trabajadas = total_horas

        # Total minutos tardanza
        self.total_minutos_tardanza = sum(
            registro.minutos_tardanza for registro in registros
        )

        # Horas extras aprobadas
        horas_extras = HoraExtra.objects.filter(
            colaborador=self.colaborador,
            fecha__year=self.anio,
            fecha__month=self.mes,
            estado='aprobada',
            is_active=True
        )
        self.total_horas_extras = sum(
            he.horas_trabajadas for he in horas_extras
        ) or Decimal('0.00')

        # Porcentaje de asistencia
        dias_habiles = registros.count()
        if dias_habiles > 0:
            self.porcentaje_asistencia = (Decimal(self.dias_trabajados) / Decimal(dias_habiles)) * Decimal('100')
            self.porcentaje_asistencia = round(self.porcentaje_asistencia, 2)
        else:
            self.porcentaje_asistencia = Decimal('0.00')

        self.save()

    def cerrar_consolidado(self, usuario):
        """
        Cierra el consolidado para evitar modificaciones.
        """
        if not self.cerrado:
            self.cerrado = True
            self.cerrado_por = usuario
            self.fecha_cierre = timezone.now()
            self.save()
            return True
        return False
