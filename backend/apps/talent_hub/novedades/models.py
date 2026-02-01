"""
Modelos de Novedades - Talent Hub
==================================

Gestión de incapacidades, licencias, permisos y vacaciones según legislación colombiana.

Incluye:
- TipoIncapacidad: Catálogo de tipos de incapacidad (EPS/ARL)
- Incapacidad: Registro de incapacidades con cobro a entidades
- TipoLicencia: Catálogo de licencias (remuneradas/no remuneradas)
- Licencia: Solicitudes de licencias
- Permiso: Permisos cortos (por horas)
- PeriodoVacaciones: Control de vacaciones acumuladas
- SolicitudVacaciones: Solicitudes de vacaciones

Legislación:
- Código Sustantivo del Trabajo (Colombia)
- Ley 1822/2017 (Licencia de paternidad)
- Resolución 2388/2016 (Incapacidades)
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import timedelta

from apps.core.base_models import BaseCompanyModel


# =============================================================================
# CATÁLOGOS - Tipos de Incapacidades y Licencias
# =============================================================================

class TipoIncapacidad(BaseCompanyModel):
    """
    Catálogo de tipos de incapacidad según normativa colombiana.

    Ejemplos:
    - Enfermedad General (EPS) - 66.67% después del día 3
    - Accidente de Trabajo (ARL) - 100% desde día 1
    - Enfermedad Laboral (ARL) - 100% desde día 1
    - Licencia de Maternidad (EPS) - 100%
    - Licencia de Paternidad (EPS) - 100%
    """

    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de incapacidad (ej: EG, AT, EL, MAT, PAT)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre del tipo de incapacidad'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del tipo de incapacidad'
    )

    # Clasificación
    origen = models.CharField(
        max_length=20,
        choices=[
            ('comun', 'Enfermedad Común'),
            ('laboral', 'Origen Laboral'),
            ('maternidad', 'Licencia de Maternidad'),
            ('paternidad', 'Licencia de Paternidad'),
        ],
        default='comun',
        db_index=True,
        verbose_name='Origen',
        help_text='Origen de la incapacidad'
    )

    # Configuración
    dias_maximos = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Días Máximos',
        help_text='Días máximos permitidos (null = ilimitado)'
    )
    porcentaje_pago = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('100.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='Porcentaje de Pago',
        help_text='Porcentaje del salario que paga la entidad (66.67% o 100%)'
    )
    requiere_prorroga = models.BooleanField(
        default=False,
        verbose_name='Requiere Prórroga',
        help_text='Indica si este tipo de incapacidad puede tener prórrogas'
    )

    class Meta:
        db_table = 'talent_hub_tipo_incapacidad'
        verbose_name = 'Tipo de Incapacidad'
        verbose_name_plural = 'Tipos de Incapacidad'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['codigo']),
            models.Index(fields=['origen']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class TipoLicencia(BaseCompanyModel):
    """
    Catálogo de tipos de licencia según legislación colombiana.

    Ejemplos:
    - Licencia de Luto (5 días remunerada)
    - Licencia por Calamidad (variable, no remunerada)
    - Licencia de Estudio (no remunerada)
    - Licencia No Remunerada
    """

    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de licencia (ej: LUTO, CALAM, ESTUD)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre del tipo de licencia'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del tipo de licencia'
    )

    # Clasificación
    categoria = models.CharField(
        max_length=20,
        choices=[
            ('remunerada', 'Remunerada'),
            ('no_remunerada', 'No Remunerada'),
            ('legal', 'Legal Remunerada'),
        ],
        default='no_remunerada',
        db_index=True,
        verbose_name='Categoría',
        help_text='Tipo de licencia según remuneración'
    )

    # Configuración
    dias_permitidos = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Días Permitidos',
        help_text='Días máximos permitidos por solicitud (null = ilimitado)'
    )
    requiere_aprobacion = models.BooleanField(
        default=True,
        verbose_name='Requiere Aprobación',
        help_text='Indica si requiere aprobación del jefe inmediato'
    )

    class Meta:
        db_table = 'talent_hub_tipo_licencia'
        verbose_name = 'Tipo de Licencia'
        verbose_name_plural = 'Tipos de Licencia'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['codigo']),
            models.Index(fields=['categoria']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# =============================================================================
# INCAPACIDADES
# =============================================================================

class Incapacidad(BaseCompanyModel):
    """
    Registro de incapacidades médicas.

    Gestiona incapacidades por enfermedad común, accidente de trabajo,
    enfermedad laboral, maternidad y paternidad.
    Incluye control de radicación y cobro a EPS/ARL.
    """

    # Relaciones
    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='incapacidades',
        verbose_name='Colaborador',
        help_text='Colaborador incapacitado'
    )
    tipo_incapacidad = models.ForeignKey(
        TipoIncapacidad,
        on_delete=models.PROTECT,
        related_name='incapacidades',
        verbose_name='Tipo de Incapacidad',
        help_text='Tipo de incapacidad según origen'
    )

    # Fechas
    fecha_inicio = models.DateField(
        db_index=True,
        verbose_name='Fecha de Inicio',
        help_text='Primer día de incapacidad'
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha de Finalización',
        help_text='Último día de incapacidad'
    )

    # Información Médica
    diagnostico = models.TextField(
        verbose_name='Diagnóstico',
        help_text='Diagnóstico médico detallado'
    )
    codigo_cie10 = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Código CIE-10',
        help_text='Código de clasificación internacional de enfermedades'
    )

    # Entidad Responsable
    eps_arl = models.CharField(
        max_length=200,
        verbose_name='EPS/ARL',
        help_text='Entidad que debe pagar la incapacidad'
    )
    numero_incapacidad = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Número de Incapacidad',
        help_text='Número único de la incapacidad (generado o del sistema de salud)'
    )

    # Prórroga
    prorroga_de = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prorrogas',
        verbose_name='Prórroga de',
        help_text='Incapacidad original si esta es una prórroga'
    )

    # Soporte
    archivo_soporte = models.FileField(
        upload_to='talent_hub/incapacidades/',
        verbose_name='Archivo Soporte',
        help_text='Certificado médico escaneado'
    )

    # Estado y Cobro
    estado = models.CharField(
        max_length=20,
        choices=[
            ('pendiente', 'Pendiente'),
            ('aprobada', 'Aprobada'),
            ('en_cobro', 'En Cobro'),
            ('pagada', 'Pagada'),
            ('rechazada', 'Rechazada'),
        ],
        default='pendiente',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado del trámite de la incapacidad'
    )
    fecha_radicacion_cobro = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Radicación',
        help_text='Fecha en que se radicó el cobro a EPS/ARL'
    )
    valor_cobrado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Valor Cobrado',
        help_text='Valor total cobrado a la entidad'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones adicionales'
    )

    class Meta:
        db_table = 'talent_hub_incapacidad'
        verbose_name = 'Incapacidad'
        verbose_name_plural = 'Incapacidades'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['fecha_inicio', 'fecha_fin']),
            models.Index(fields=['estado']),
            models.Index(fields=['numero_incapacidad']),
        ]

    def __str__(self):
        return f"{self.numero_incapacidad} - {self.colaborador.get_nombre_corto()} ({self.fecha_inicio})"

    @property
    def dias_incapacidad(self):
        """Calcula los días totales de incapacidad."""
        if self.fecha_inicio and self.fecha_fin:
            return (self.fecha_fin - self.fecha_inicio).days + 1
        return 0

    @property
    def es_prorroga(self):
        """Verifica si es una prórroga de otra incapacidad."""
        return self.prorroga_de is not None

    @property
    def tiene_prorrogas(self):
        """Verifica si tiene prórrogas asociadas."""
        return self.prorrogas.exists()

    @property
    def dias_totales_con_prorrogas(self):
        """Calcula días totales incluyendo prórrogas."""
        total = self.dias_incapacidad
        for prorroga in self.prorrogas.all():
            total += prorroga.dias_incapacidad
        return total

    def clean(self):
        """Validaciones del modelo."""
        # Validar fechas
        if self.fecha_fin and self.fecha_inicio:
            if self.fecha_fin < self.fecha_inicio:
                raise ValidationError({
                    'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'
                })

        # Validar prórroga
        if self.prorroga_de:
            if not self.tipo_incapacidad.requiere_prorroga:
                raise ValidationError({
                    'prorroga_de': 'Este tipo de incapacidad no permite prórrogas.'
                })
            if self.fecha_inicio <= self.prorroga_de.fecha_fin:
                raise ValidationError({
                    'fecha_inicio': 'La prórroga debe iniciar después de la incapacidad original.'
                })

        # Validar radicación
        if self.estado == 'en_cobro' and not self.fecha_radicacion_cobro:
            raise ValidationError({
                'fecha_radicacion_cobro': 'Debe especificar la fecha de radicación para incapacidades en cobro.'
            })

        # Validar colaborador pertenece a empresa
        if self.colaborador and self.empresa:
            if self.colaborador.empresa != self.empresa:
                raise ValidationError({
                    'colaborador': 'El colaborador no pertenece a la empresa seleccionada.'
                })


# =============================================================================
# LICENCIAS
# =============================================================================

class Licencia(BaseCompanyModel):
    """
    Registro de solicitudes de licencias.

    Gestiona licencias remuneradas y no remuneradas según legislación colombiana:
    - Licencia de Luto (5 días remunerada)
    - Licencia por Calamidad
    - Licencia de Estudio
    - Licencia No Remunerada
    """

    # Relaciones
    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='licencias',
        verbose_name='Colaborador',
        help_text='Colaborador que solicita la licencia'
    )
    tipo_licencia = models.ForeignKey(
        TipoLicencia,
        on_delete=models.PROTECT,
        related_name='licencias',
        verbose_name='Tipo de Licencia',
        help_text='Tipo de licencia solicitada'
    )

    # Fechas
    fecha_inicio = models.DateField(
        db_index=True,
        verbose_name='Fecha de Inicio',
        help_text='Primer día de licencia'
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha de Finalización',
        help_text='Último día de licencia'
    )

    # Información
    motivo = models.TextField(
        verbose_name='Motivo',
        help_text='Motivo detallado de la solicitud'
    )
    archivo_soporte = models.FileField(
        upload_to='talent_hub/licencias/',
        null=True,
        blank=True,
        verbose_name='Archivo Soporte',
        help_text='Documento que soporta la solicitud (certificado de defunción, médico, etc.)'
    )

    # Estado y Aprobación
    estado = models.CharField(
        max_length=20,
        choices=[
            ('solicitada', 'Solicitada'),
            ('aprobada', 'Aprobada'),
            ('rechazada', 'Rechazada'),
            ('cancelada', 'Cancelada'),
        ],
        default='solicitada',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado de la solicitud'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='licencias_aprobadas',
        verbose_name='Aprobado Por',
        help_text='Usuario que aprobó o rechazó la solicitud'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación',
        help_text='Fecha y hora de aprobación/rechazo'
    )
    observaciones_aprobacion = models.TextField(
        blank=True,
        verbose_name='Observaciones de Aprobación',
        help_text='Comentarios del aprobador'
    )

    class Meta:
        db_table = 'talent_hub_licencia'
        verbose_name = 'Licencia'
        verbose_name_plural = 'Licencias'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['fecha_inicio', 'fecha_fin']),
            models.Index(fields=['estado']),
            models.Index(fields=['tipo_licencia']),
        ]

    def __str__(self):
        return f"{self.tipo_licencia.codigo} - {self.colaborador.get_nombre_corto()} ({self.fecha_inicio})"

    @property
    def dias_solicitados(self):
        """Calcula los días totales de licencia."""
        if self.fecha_inicio and self.fecha_fin:
            return (self.fecha_fin - self.fecha_inicio).days + 1
        return 0

    @property
    def esta_aprobada(self):
        """Verifica si la licencia está aprobada."""
        return self.estado == 'aprobada'

    @property
    def esta_vigente(self):
        """Verifica si la licencia está actualmente vigente."""
        from django.utils import timezone
        if self.estado != 'aprobada':
            return False
        hoy = timezone.now().date()
        return self.fecha_inicio <= hoy <= self.fecha_fin

    def clean(self):
        """Validaciones del modelo."""
        # Validar fechas
        if self.fecha_fin and self.fecha_inicio:
            if self.fecha_fin < self.fecha_inicio:
                raise ValidationError({
                    'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'
                })

        # Validar días permitidos
        if self.tipo_licencia and self.tipo_licencia.dias_permitidos:
            if self.dias_solicitados > self.tipo_licencia.dias_permitidos:
                raise ValidationError({
                    'fecha_fin': f'El tipo de licencia permite máximo {self.tipo_licencia.dias_permitidos} días.'
                })

        # Validar colaborador pertenece a empresa
        if self.colaborador and self.empresa:
            if self.colaborador.empresa != self.empresa:
                raise ValidationError({
                    'colaborador': 'El colaborador no pertenece a la empresa seleccionada.'
                })


# =============================================================================
# PERMISOS
# =============================================================================

class Permiso(BaseCompanyModel):
    """
    Registro de permisos cortos (por horas).

    Gestiona permisos dentro de la jornada laboral:
    - Citas médicas
    - Permisos personales
    - Diligencias académicas
    - Calamidades
    """

    # Relaciones
    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='permisos',
        verbose_name='Colaborador',
        help_text='Colaborador que solicita el permiso'
    )

    # Fecha y Horario
    fecha = models.DateField(
        db_index=True,
        verbose_name='Fecha',
        help_text='Fecha del permiso'
    )
    hora_salida = models.TimeField(
        verbose_name='Hora de Salida',
        help_text='Hora en que sale el colaborador'
    )
    hora_regreso = models.TimeField(
        verbose_name='Hora de Regreso',
        help_text='Hora en que regresa el colaborador'
    )

    # Información
    motivo = models.TextField(
        verbose_name='Motivo',
        help_text='Motivo detallado del permiso'
    )
    tipo = models.CharField(
        max_length=20,
        choices=[
            ('personal', 'Personal'),
            ('medico', 'Médico'),
            ('academico', 'Académico'),
            ('calamidad', 'Calamidad Doméstica'),
            ('otro', 'Otro'),
        ],
        default='personal',
        db_index=True,
        verbose_name='Tipo de Permiso'
    )
    compensable = models.BooleanField(
        default=False,
        verbose_name='Compensable',
        help_text='Indica si el permiso debe ser compensado con horas extras'
    )

    # Estado y Aprobación
    estado = models.CharField(
        max_length=20,
        choices=[
            ('solicitado', 'Solicitado'),
            ('aprobado', 'Aprobado'),
            ('rechazado', 'Rechazado'),
        ],
        default='solicitado',
        db_index=True,
        verbose_name='Estado'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='permisos_aprobados',
        verbose_name='Aprobado Por'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_permiso'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['-fecha', '-hora_salida']
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['fecha']),
            models.Index(fields=['estado']),
            models.Index(fields=['tipo']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.fecha} ({self.horas_permiso}h)"

    @property
    def horas_permiso(self):
        """Calcula las horas totales del permiso."""
        if self.hora_salida and self.hora_regreso:
            from datetime import datetime, timedelta
            # Crear datetimes ficticios para calcular diferencia
            dt_salida = datetime.combine(self.fecha, self.hora_salida)
            dt_regreso = datetime.combine(self.fecha, self.hora_regreso)

            # Si hora_regreso es menor, es al día siguiente
            if self.hora_regreso < self.hora_salida:
                dt_regreso += timedelta(days=1)

            delta = dt_regreso - dt_salida
            return round(delta.total_seconds() / 3600, 2)
        return 0

    @property
    def esta_aprobado(self):
        """Verifica si el permiso está aprobado."""
        return self.estado == 'aprobado'

    def clean(self):
        """Validaciones del modelo."""
        # Validar horarios
        if self.hora_salida and self.hora_regreso:
            # Permitir permisos que crucen la medianoche
            if self.hora_salida == self.hora_regreso:
                raise ValidationError({
                    'hora_regreso': 'La hora de regreso debe ser diferente a la hora de salida.'
                })

        # Validar colaborador pertenece a empresa
        if self.colaborador and self.empresa:
            if self.colaborador.empresa != self.empresa:
                raise ValidationError({
                    'colaborador': 'El colaborador no pertenece a la empresa seleccionada.'
                })


# =============================================================================
# VACACIONES
# =============================================================================

class PeriodoVacaciones(BaseCompanyModel):
    """
    Período de vacaciones por colaborador.

    Controla días acumulados, disfrutados y pendientes según legislación colombiana:
    - 15 días hábiles por año trabajado
    - Acumulación proporcional por mes
    - Control de compensación en dinero (solo 50% del total acumulado)
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='periodos_vacaciones',
        verbose_name='Colaborador',
        help_text='Colaborador titular del período'
    )

    # Configuración
    fecha_ingreso = models.DateField(
        verbose_name='Fecha de Ingreso',
        help_text='Fecha de ingreso del colaborador (auto desde colaborador)'
    )
    dias_derecho_anual = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('15.00'),
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Días de Derecho Anual',
        help_text='Días de vacaciones por año (default: 15 días hábiles)'
    )

    # Contador
    dias_acumulados = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Días Acumulados',
        help_text='Total de días acumulados disponibles'
    )
    dias_disfrutados = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Días Disfrutados',
        help_text='Total de días disfrutados'
    )

    # Control
    ultimo_corte = models.DateField(
        verbose_name='Último Corte',
        help_text='Fecha del último corte de cálculo de acumulación'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_periodo_vacaciones'
        verbose_name = 'Período de Vacaciones'
        verbose_name_plural = 'Períodos de Vacaciones'
        ordering = ['-ultimo_corte']
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['ultimo_corte']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'colaborador'],
                name='unique_periodo_vacaciones_por_colaborador'
            )
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.dias_pendientes} días pendientes"

    @property
    def dias_pendientes(self):
        """Calcula los días pendientes de disfrutar."""
        return self.dias_acumulados - self.dias_disfrutados

    @property
    def dias_acumulados_actualizados(self):
        """Calcula los días acumulados hasta hoy."""
        from django.utils import timezone
        hoy = timezone.now().date()

        # Días desde el último corte hasta hoy
        dias_desde_corte = (hoy - self.ultimo_corte).days

        # Acumulación diaria: dias_derecho_anual / 365
        acumulacion_diaria = self.dias_derecho_anual / Decimal('365')
        dias_nuevos = acumulacion_diaria * Decimal(str(dias_desde_corte))

        return self.dias_acumulados + dias_nuevos

    def actualizar_acumulacion(self):
        """Actualiza la acumulación de días hasta hoy."""
        from django.utils import timezone
        hoy = timezone.now().date()

        # Calcular días desde último corte
        dias_desde_corte = (hoy - self.ultimo_corte).days
        if dias_desde_corte <= 0:
            return

        # Acumulación diaria
        acumulacion_diaria = self.dias_derecho_anual / Decimal('365')
        dias_nuevos = acumulacion_diaria * Decimal(str(dias_desde_corte))

        # Actualizar
        self.dias_acumulados += dias_nuevos
        self.ultimo_corte = hoy
        self.save(update_fields=['dias_acumulados', 'ultimo_corte', 'updated_at'])

    def clean(self):
        """Validaciones del modelo."""
        # Validar colaborador pertenece a empresa
        if self.colaborador and self.empresa:
            if self.colaborador.empresa != self.empresa:
                raise ValidationError({
                    'colaborador': 'El colaborador no pertenece a la empresa seleccionada.'
                })

        # Auto-asignar fecha de ingreso desde colaborador
        if self.colaborador and not self.fecha_ingreso:
            self.fecha_ingreso = self.colaborador.fecha_ingreso


class SolicitudVacaciones(BaseCompanyModel):
    """
    Solicitud de vacaciones.

    Gestiona solicitudes de disfrute de vacaciones:
    - Calcula días hábiles (excluyendo festivos)
    - Control de prima de vacaciones
    - Workflow de aprobación
    """

    # Relaciones
    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='solicitudes_vacaciones',
        verbose_name='Colaborador',
        help_text='Colaborador que solicita vacaciones'
    )
    periodo = models.ForeignKey(
        PeriodoVacaciones,
        on_delete=models.PROTECT,
        related_name='solicitudes',
        verbose_name='Período de Vacaciones',
        help_text='Período de vacaciones del cual se descuentan los días'
    )

    # Fechas
    fecha_inicio = models.DateField(
        db_index=True,
        verbose_name='Fecha de Inicio',
        help_text='Primer día de vacaciones'
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha de Finalización',
        help_text='Último día de vacaciones'
    )
    dias_calendario = models.PositiveIntegerField(
        default=0,
        verbose_name='Días Calendario',
        help_text='Días totales incluyendo fines de semana'
    )

    # Prima de Vacaciones
    incluye_prima = models.BooleanField(
        default=False,
        verbose_name='Incluye Prima de Vacaciones',
        help_text='Indica si se paga prima de vacaciones (Ley 1171/2007)'
    )

    # Estado y Aprobación
    estado = models.CharField(
        max_length=20,
        choices=[
            ('solicitada', 'Solicitada'),
            ('aprobada', 'Aprobada'),
            ('rechazada', 'Rechazada'),
            ('disfrutada', 'Disfrutada'),
            ('cancelada', 'Cancelada'),
        ],
        default='solicitada',
        db_index=True,
        verbose_name='Estado'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='vacaciones_aprobadas',
        verbose_name='Aprobado Por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_solicitud_vacaciones'
        verbose_name = 'Solicitud de Vacaciones'
        verbose_name_plural = 'Solicitudes de Vacaciones'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['fecha_inicio', 'fecha_fin']),
            models.Index(fields=['estado']),
            models.Index(fields=['periodo']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.fecha_inicio} ({self.dias_habiles} días)"

    @property
    def dias_habiles(self):
        """
        Calcula días hábiles excluyendo sábados, domingos y festivos.

        TODO: Integrar con calendario de festivos colombianos.
        Por ahora calcula solo días laborables (lunes a viernes).
        """
        if not self.fecha_inicio or not self.fecha_fin:
            return 0

        from datetime import timedelta
        dias = 0
        fecha_actual = self.fecha_inicio

        while fecha_actual <= self.fecha_fin:
            # 0=Lunes, 6=Domingo
            if fecha_actual.weekday() < 5:  # Lunes a Viernes
                # TODO: Verificar si es festivo
                dias += 1
            fecha_actual += timedelta(days=1)

        return dias

    @property
    def esta_aprobada(self):
        """Verifica si la solicitud está aprobada."""
        return self.estado == 'aprobada'

    @property
    def esta_vigente(self):
        """Verifica si las vacaciones están actualmente vigentes."""
        from django.utils import timezone
        if self.estado not in ['aprobada', 'disfrutada']:
            return False
        hoy = timezone.now().date()
        return self.fecha_inicio <= hoy <= self.fecha_fin

    def clean(self):
        """Validaciones del modelo."""
        # Validar fechas
        if self.fecha_fin and self.fecha_inicio:
            if self.fecha_fin < self.fecha_inicio:
                raise ValidationError({
                    'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'
                })

            # Calcular días calendario
            self.dias_calendario = (self.fecha_fin - self.fecha_inicio).days + 1

        # Validar días disponibles
        if self.periodo:
            if self.dias_habiles > self.periodo.dias_pendientes:
                raise ValidationError({
                    'fecha_fin': f'Solo tiene {self.periodo.dias_pendientes} días disponibles.'
                })

        # Validar colaborador pertenece a empresa
        if self.colaborador and self.empresa:
            if self.colaborador.empresa != self.empresa:
                raise ValidationError({
                    'colaborador': 'El colaborador no pertenece a la empresa seleccionada.'
                })

        # Validar período pertenece a colaborador
        if self.periodo and self.colaborador:
            if self.periodo.colaborador != self.colaborador:
                raise ValidationError({
                    'periodo': 'El período no pertenece al colaborador seleccionado.'
                })

    def save(self, *args, **kwargs):
        """Override save para calcular días calendario."""
        if self.fecha_inicio and self.fecha_fin:
            self.dias_calendario = (self.fecha_fin - self.fecha_inicio).days + 1
        super().save(*args, **kwargs)
