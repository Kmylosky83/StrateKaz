"""
Modelos para Mantenimiento de Equipos - Production Ops
Sistema de Gestión StrateKaz

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.

Gestiona:
- Mantenimiento de activos de producción (maquinaria, equipos de medición)
- Cumplimiento normativo ISO 9001, ISO 14001, ISO 45001
- Planes preventivos, correctivos y predictivos
- Calibración de equipos de medición
- Registro de paradas y fallas
- Multi-tenant (empresa_id)

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import timedelta

from apps.core.base_models import BaseCompanyModel, OrderedModel


# ==============================================================================
# MODELOS DE CATÁLOGO DINÁMICO
# ==============================================================================

class TipoActivo(OrderedModel):
    """
    Tipo de activo de producción (catálogo dinámico).

    Ejemplos:
    - MAQUINARIA_PROCESAMIENTO
    - EQUIPO_MEDICION
    - HERRAMIENTA_PRECISION
    - SISTEMA_CONTROL
    - INFRAESTRUCTURA
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de activo (ej: MAQUINARIA_PROCESAMIENTO)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre del tipo de activo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del tipo de activo'
    )

    # Depreciación
    vida_util_anios = models.PositiveIntegerField(
        default=10,
        verbose_name='Vida Útil (años)',
        help_text='Vida útil estimada en años'
    )
    depreciacion_anual = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('10.00'),
        verbose_name='Depreciación Anual (%)',
        help_text='Porcentaje de depreciación anual'
    )

    # Calibración
    requiere_calibracion = models.BooleanField(
        default=False,
        verbose_name='Requiere Calibración',
        help_text='Indica si el activo requiere calibración periódica'
    )
    frecuencia_calibracion_meses = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Frecuencia Calibración (meses)',
        help_text='Frecuencia de calibración en meses (si aplica)'
    )

    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Indica si el tipo de activo está activo'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Tipo de Activo'
        verbose_name_plural = 'Tipos de Activos'
        db_table = 'mantenimiento_tipo_activo'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def clean(self):
        """Validaciones del modelo."""
        if self.requiere_calibracion and not self.frecuencia_calibracion_meses:
            raise ValidationError({
                'frecuencia_calibracion_meses':
                    'Debe especificar la frecuencia de calibración si el activo la requiere'
            })


class TipoMantenimiento(OrderedModel):
    """
    Tipo de mantenimiento (catálogo dinámico).

    Ejemplos:
    - PREVENTIVO_MENSUAL
    - PREVENTIVO_TRIMESTRAL
    - CORRECTIVO_MECANICO
    - CORRECTIVO_ELECTRICO
    - PREDICTIVO_VIBRACIONES
    - CALIBRACION
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de mantenimiento'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre del tipo de mantenimiento'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del tipo de mantenimiento'
    )

    # Clasificación
    es_preventivo = models.BooleanField(
        default=False,
        verbose_name='Es Preventivo',
        help_text='Mantenimiento planificado y programado'
    )
    es_correctivo = models.BooleanField(
        default=False,
        verbose_name='Es Correctivo',
        help_text='Mantenimiento por falla o problema'
    )
    es_predictivo = models.BooleanField(
        default=False,
        verbose_name='Es Predictivo',
        help_text='Mantenimiento basado en condición y análisis'
    )

    # Frecuencia (para preventivo)
    frecuencia_dias = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Frecuencia (días)',
        help_text='Frecuencia de ejecución en días (para mantenimiento preventivo)'
    )

    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Tipo de Mantenimiento'
        verbose_name_plural = 'Tipos de Mantenimiento'
        db_table = 'mantenimiento_tipo_mantenimiento'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def clean(self):
        """Validaciones del modelo."""
        if not any([self.es_preventivo, self.es_correctivo, self.es_predictivo]):
            raise ValidationError(
                'Debe marcar al menos una clasificación (preventivo, correctivo o predictivo)'
            )


# ==============================================================================
# MODELOS DE ACTIVOS
# ==============================================================================

class ActivoProduccion(BaseCompanyModel, OrderedModel):
    """
    Activos físicos de producción (maquinaria, equipos).

    Gestiona el inventario completo de activos con:
    - Información técnica
    - Depreciación automática
    - Programación de mantenimiento
    - Historial de intervenciones
    """
    ESTADO_CHOICES = [
        ('OPERATIVO', 'Operativo'),
        ('EN_MANTENIMIENTO', 'En Mantenimiento'),
        ('FUERA_SERVICIO', 'Fuera de Servicio'),
        ('DADO_DE_BAJA', 'Dado de Baja'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del activo (autogenerado)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del activo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del activo'
    )

    # Clasificación
    tipo_activo = models.ForeignKey(
        TipoActivo,
        on_delete=models.PROTECT,
        related_name='activos',
        verbose_name='Tipo de Activo',
        help_text='Clasificación del activo'
    )
    linea_produccion = models.ForeignKey(
        'procesamiento.LineaProduccion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activos_mantenimiento',
        verbose_name='Línea de Producción',
        help_text='Línea de producción a la que pertenece (si aplica)'
    )

    # Información técnica
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
    numero_serie = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de Serie'
    )

    # Información financiera
    fecha_adquisicion = models.DateField(
        verbose_name='Fecha de Adquisición',
        help_text='Fecha en que se adquirió el activo'
    )
    valor_adquisicion = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name='Valor de Adquisición',
        help_text='Valor de compra del activo'
    )
    valor_actual = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False,
        verbose_name='Valor Actual',
        help_text='Valor actual después de depreciación (calculado automáticamente)'
    )

    # Mantenimiento
    fecha_ultima_revision = models.DateField(
        null=True,
        blank=True,
        verbose_name='Última Revisión',
        help_text='Fecha de la última revisión/mantenimiento'
    )
    fecha_proximo_mantenimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próximo Mantenimiento',
        help_text='Fecha programada del próximo mantenimiento'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='OPERATIVO',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado operativo actual del activo'
    )

    # Ubicación y documentación
    ubicacion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Ubicación Física',
        help_text='Ubicación física del activo en la planta'
    )
    manual_url = models.URLField(
        blank=True,
        verbose_name='URL del Manual',
        help_text='Enlace al manual del fabricante o documentación técnica'
    )

    class Meta:
        verbose_name = 'Activo de Producción'
        verbose_name_plural = 'Activos de Producción'
        db_table = 'mantenimiento_activo_produccion'
        ordering = ['orden', 'codigo']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['tipo_activo', 'estado']),
            models.Index(fields=['fecha_proximo_mantenimiento']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def save(self, *args, **kwargs):
        """Auto-generar código y calcular depreciación."""
        if not self.codigo:
            self.codigo = self.generar_codigo()

        # Calcular valor actual por depreciación
        self.valor_actual = self.calcular_valor_actual()

        super().save(*args, **kwargs)

    def generar_codigo(self):
        """Generar código único para el activo."""
        from django.utils import timezone
        fecha = timezone.now()

        # Obtener el último código del año actual
        ultimo = ActivoProduccion.objects.filter(
            codigo__startswith=f'ACT-{fecha.year}'
        ).order_by('-codigo').first()

        if ultimo:
            # Extraer el número del último código
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                nuevo_numero = ultimo_numero + 1
            except (ValueError, IndexError):
                nuevo_numero = 1
        else:
            nuevo_numero = 1

        return f'ACT-{fecha.year}-{nuevo_numero:05d}'

    def calcular_valor_actual(self):
        """
        Calcular el valor actual del activo aplicando depreciación.

        Fórmula: Valor Actual = Valor Adquisición * (1 - (Años Transcurridos * Depreciación Anual / 100))
        """
        if not self.fecha_adquisicion or not self.valor_adquisicion:
            return self.valor_adquisicion

        # Calcular años transcurridos
        hoy = timezone.now().date()
        dias_transcurridos = (hoy - self.fecha_adquisicion).days
        anios_transcurridos = Decimal(dias_transcurridos) / Decimal('365.25')

        # Obtener tasa de depreciación del tipo de activo
        tasa_depreciacion = self.tipo_activo.depreciacion_anual / Decimal('100')

        # Calcular depreciación acumulada
        depreciacion_acumulada = min(
            anios_transcurridos * tasa_depreciacion,
            Decimal('1.0')  # No puede depreciar más del 100%
        )

        # Calcular valor actual
        valor_actual = self.valor_adquisicion * (Decimal('1.0') - depreciacion_acumulada)

        return max(valor_actual, Decimal('0.00'))

    def requiere_mantenimiento_urgente(self):
        """Verificar si requiere mantenimiento urgente (próximos 7 días)."""
        if not self.fecha_proximo_mantenimiento:
            return False

        hoy = timezone.now().date()
        dias_restantes = (self.fecha_proximo_mantenimiento - hoy).days

        return 0 <= dias_restantes <= 7

    def esta_vencido_mantenimiento(self):
        """Verificar si tiene mantenimiento vencido."""
        if not self.fecha_proximo_mantenimiento:
            return False

        return self.fecha_proximo_mantenimiento < timezone.now().date()


class EquipoMedicion(BaseCompanyModel):
    """
    Equipos de medición y control (calibrables).

    Gestiona equipos que requieren calibración periódica para
    garantizar precisión en mediciones según normativa ISO.
    """
    ESTADO_CHOICES = [
        ('OPERATIVO', 'Operativo'),
        ('EN_CALIBRACION', 'En Calibración'),
        ('FUERA_SERVICIO', 'Fuera de Servicio'),
        ('DADO_DE_BAJA', 'Dado de Baja'),
    ]

    # Relación opcional con activo
    activo = models.OneToOneField(
        ActivoProduccion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='equipo_medicion',
        verbose_name='Activo Asociado',
        help_text='Activo de producción asociado (si aplica)'
    )

    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del equipo de medición'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre'
    )

    # Información técnica
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
    numero_serie = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de Serie'
    )

    # Características de medición
    rango_medicion_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Rango Mínimo',
        help_text='Valor mínimo del rango de medición'
    )
    rango_medicion_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Rango Máximo',
        help_text='Valor máximo del rango de medición'
    )
    unidad_medida = models.CharField(
        max_length=50,
        verbose_name='Unidad de Medida',
        help_text='Unidad de medida (ej: °C, bar, kg, mm)'
    )
    resolucion = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Resolución',
        help_text='Mínima variación detectable'
    )
    exactitud = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Exactitud',
        help_text='Precisión del equipo'
    )

    # Calibración
    fecha_calibracion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Última Calibración',
        help_text='Fecha de la última calibración realizada'
    )
    fecha_proxima_calibracion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próxima Calibración',
        help_text='Fecha programada de la próxima calibración'
    )
    certificado_calibracion_url = models.URLField(
        blank=True,
        verbose_name='Certificado de Calibración',
        help_text='URL del certificado de calibración vigente'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='OPERATIVO',
        db_index=True,
        verbose_name='Estado'
    )

    class Meta:
        verbose_name = 'Equipo de Medición'
        verbose_name_plural = 'Equipos de Medición'
        db_table = 'mantenimiento_equipo_medicion'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['fecha_proxima_calibracion']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def save(self, *args, **kwargs):
        """Auto-generar código si no existe."""
        if not self.codigo:
            self.codigo = self.generar_codigo()
        super().save(*args, **kwargs)

    def generar_codigo(self):
        """Generar código único para el equipo."""
        from django.utils import timezone
        fecha = timezone.now()

        ultimo = EquipoMedicion.objects.filter(
            codigo__startswith=f'EQM-{fecha.year}'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                nuevo_numero = ultimo_numero + 1
            except (ValueError, IndexError):
                nuevo_numero = 1
        else:
            nuevo_numero = 1

        return f'EQM-{fecha.year}-{nuevo_numero:05d}'

    def requiere_calibracion_urgente(self):
        """Verificar si requiere calibración urgente (próximos 30 días)."""
        if not self.fecha_proxima_calibracion:
            return False

        hoy = timezone.now().date()
        dias_restantes = (self.fecha_proxima_calibracion - hoy).days

        return 0 <= dias_restantes <= 30

    def esta_vencida_calibracion(self):
        """Verificar si tiene calibración vencida."""
        if not self.fecha_proxima_calibracion:
            return False

        return self.fecha_proxima_calibracion < timezone.now().date()


# ==============================================================================
# MODELOS DE PLANIFICACIÓN
# ==============================================================================

class PlanMantenimiento(BaseCompanyModel):
    """
    Plan de mantenimiento preventivo para activos.

    Define las actividades de mantenimiento planificado que deben
    ejecutarse periódicamente en cada activo.
    """
    # Identificación
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Plan',
        help_text='Nombre descriptivo del plan de mantenimiento'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Relaciones
    activo = models.ForeignKey(
        ActivoProduccion,
        on_delete=models.CASCADE,
        related_name='planes_mantenimiento',
        verbose_name='Activo',
        help_text='Activo al que aplica este plan'
    )
    tipo_mantenimiento = models.ForeignKey(
        TipoMantenimiento,
        on_delete=models.PROTECT,
        related_name='planes',
        verbose_name='Tipo de Mantenimiento'
    )

    # Frecuencia
    frecuencia_dias = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Frecuencia (días)',
        help_text='Frecuencia en días para ejecutar el plan'
    )
    frecuencia_horas_uso = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Frecuencia (horas de uso)',
        help_text='Frecuencia en horas de uso del activo'
    )

    # Detalles del mantenimiento
    tareas_realizar = models.TextField(
        verbose_name='Tareas a Realizar',
        help_text='Lista detallada de tareas de mantenimiento'
    )
    repuestos_necesarios = models.TextField(
        blank=True,
        verbose_name='Repuestos Necesarios',
        help_text='Lista de repuestos típicamente necesarios'
    )

    # Estimaciones
    tiempo_estimado_horas = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        verbose_name='Tiempo Estimado (horas)',
        help_text='Tiempo estimado para completar el mantenimiento'
    )
    costo_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Costo Estimado',
        help_text='Costo estimado del mantenimiento (repuestos + mano de obra)'
    )

    # Control de ejecución
    ultima_ejecucion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Última Ejecución',
        help_text='Fecha de la última ejecución del plan'
    )
    proxima_ejecucion = models.DateField(
        null=True,
        blank=True,
        editable=False,
        verbose_name='Próxima Ejecución',
        help_text='Fecha calculada de la próxima ejecución'
    )

    activo_plan = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Plan Activo',
        help_text='Indica si el plan está activo y debe ejecutarse'
    )

    class Meta:
        verbose_name = 'Plan de Mantenimiento'
        verbose_name_plural = 'Planes de Mantenimiento'
        db_table = 'mantenimiento_plan'
        ordering = ['activo', 'nombre']
        indexes = [
            models.Index(fields=['empresa', 'activo_plan']),
            models.Index(fields=['activo', 'activo_plan']),
            models.Index(fields=['proxima_ejecucion']),
        ]

    def __str__(self):
        return f"{self.nombre} - {self.activo.codigo}"

    def save(self, *args, **kwargs):
        """Calcular próxima ejecución automáticamente."""
        if self.ultima_ejecucion and self.frecuencia_dias:
            self.proxima_ejecucion = self.ultima_ejecucion + timedelta(days=self.frecuencia_dias)

        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones del modelo."""
        if not self.frecuencia_dias and not self.frecuencia_horas_uso:
            raise ValidationError(
                'Debe especificar al menos una frecuencia (días o horas de uso)'
            )

    def requiere_ejecucion_urgente(self):
        """Verificar si requiere ejecución urgente (próximos 7 días)."""
        if not self.proxima_ejecucion or not self.activo_plan:
            return False

        hoy = timezone.now().date()
        dias_restantes = (self.proxima_ejecucion - hoy).days

        return 0 <= dias_restantes <= 7

    def esta_vencido(self):
        """Verificar si está vencido."""
        if not self.proxima_ejecucion or not self.activo_plan:
            return False

        return self.proxima_ejecucion < timezone.now().date()


# ==============================================================================
# MODELOS DE EJECUCIÓN
# ==============================================================================

class OrdenTrabajo(BaseCompanyModel):
    """
    Orden de trabajo de mantenimiento.

    Registra todas las intervenciones de mantenimiento realizadas
    en los activos, tanto preventivas como correctivas.
    """
    PRIORIDAD_CHOICES = [
        (1, 'Crítica'),
        (2, 'Alta'),
        (3, 'Media'),
        (4, 'Baja'),
        (5, 'Muy Baja'),
    ]

    ESTADO_CHOICES = [
        ('ABIERTA', 'Abierta'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código OT',
        help_text='Código único de la orden de trabajo (OT-YYYYMMDD-NNNN)'
    )

    # Relaciones
    activo = models.ForeignKey(
        ActivoProduccion,
        on_delete=models.PROTECT,
        related_name='ordenes_trabajo',
        verbose_name='Activo'
    )
    tipo_mantenimiento = models.ForeignKey(
        TipoMantenimiento,
        on_delete=models.PROTECT,
        related_name='ordenes_trabajo',
        verbose_name='Tipo de Mantenimiento'
    )
    plan_mantenimiento = models.ForeignKey(
        PlanMantenimiento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordenes_trabajo',
        verbose_name='Plan de Mantenimiento',
        help_text='Plan que originó esta orden (si aplica)'
    )

    # Clasificación
    prioridad = models.PositiveSmallIntegerField(
        choices=PRIORIDAD_CHOICES,
        default=3,
        db_index=True,
        verbose_name='Prioridad'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='ABIERTA',
        db_index=True,
        verbose_name='Estado'
    )

    # Fechas
    fecha_solicitud = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Solicitud'
    )
    fecha_programada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Programada',
        help_text='Fecha programada para ejecutar el mantenimiento'
    )
    fecha_inicio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Inicio Real'
    )
    fecha_fin = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Finalización'
    )

    # Descripción del trabajo
    descripcion_problema = models.TextField(
        verbose_name='Descripción del Problema',
        help_text='Descripción detallada del problema o trabajo a realizar'
    )
    descripcion_trabajo_realizado = models.TextField(
        blank=True,
        verbose_name='Trabajo Realizado',
        help_text='Descripción del trabajo efectivamente realizado'
    )

    # Personal
    solicitante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ordenes_solicitadas',
        verbose_name='Solicitante'
    )
    asignado_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordenes_asignadas',
        verbose_name='Asignado a',
        help_text='Técnico responsable de ejecutar el mantenimiento'
    )

    # Costos
    horas_trabajadas = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Horas Trabajadas'
    )
    costo_mano_obra = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Costo Mano de Obra'
    )
    costo_repuestos = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Costo Repuestos'
    )
    costo_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        editable=False,
        verbose_name='Costo Total',
        help_text='Costo total calculado (mano de obra + repuestos)'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        verbose_name = 'Orden de Trabajo'
        verbose_name_plural = 'Órdenes de Trabajo'
        db_table = 'mantenimiento_orden_trabajo'
        ordering = ['-fecha_solicitud']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['activo', 'estado']),
            models.Index(fields=['prioridad', 'estado']),
            models.Index(fields=['fecha_programada']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.activo.codigo}"

    def save(self, *args, **kwargs):
        """Auto-generar código y calcular costo total."""
        if not self.codigo:
            self.codigo = self.generar_codigo()

        # Calcular costo total
        self.costo_total = self.costo_mano_obra + self.costo_repuestos

        super().save(*args, **kwargs)

        # Actualizar estado del activo si es necesario
        if self.estado == 'EN_PROCESO' and self.activo.estado == 'OPERATIVO':
            self.activo.estado = 'EN_MANTENIMIENTO'
            self.activo.save(update_fields=['estado'])
        elif self.estado == 'COMPLETADA' and self.activo.estado == 'EN_MANTENIMIENTO':
            # Verificar si hay otras órdenes en proceso
            otras_en_proceso = OrdenTrabajo.objects.filter(
                activo=self.activo,
                estado='EN_PROCESO'
            ).exclude(pk=self.pk).exists()

            if not otras_en_proceso:
                self.activo.estado = 'OPERATIVO'
                self.activo.fecha_ultima_revision = self.fecha_fin.date() if self.fecha_fin else timezone.now().date()
                self.activo.save(update_fields=['estado', 'fecha_ultima_revision'])

    def generar_codigo(self):
        """Generar código único para la orden de trabajo."""
        from django.utils import timezone
        fecha = timezone.now()
        fecha_str = fecha.strftime('%Y%m%d')

        # Obtener el último código del día
        ultimo = OrdenTrabajo.objects.filter(
            codigo__startswith=f'OT-{fecha_str}'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                nuevo_numero = ultimo_numero + 1
            except (ValueError, IndexError):
                nuevo_numero = 1
        else:
            nuevo_numero = 1

        return f'OT-{fecha_str}-{nuevo_numero:04d}'

    def clean(self):
        """Validaciones del modelo."""
        if self.fecha_inicio and self.fecha_fin:
            if self.fecha_fin < self.fecha_inicio:
                raise ValidationError({
                    'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio'
                })

        if self.estado == 'COMPLETADA':
            if not self.fecha_fin:
                raise ValidationError({
                    'fecha_fin': 'Debe especificar la fecha de finalización para completar la orden'
                })
            if not self.descripcion_trabajo_realizado:
                raise ValidationError({
                    'descripcion_trabajo_realizado':
                        'Debe describir el trabajo realizado para completar la orden'
                })

    def iniciar_trabajo(self):
        """Iniciar la ejecución del trabajo."""
        if self.estado != 'ABIERTA':
            raise ValidationError('Solo se pueden iniciar órdenes en estado ABIERTA')

        self.estado = 'EN_PROCESO'
        self.fecha_inicio = timezone.now()
        self.save()

    def completar_trabajo(self):
        """Completar la orden de trabajo."""
        if self.estado != 'EN_PROCESO':
            raise ValidationError('Solo se pueden completar órdenes en estado EN_PROCESO')

        self.estado = 'COMPLETADA'
        self.fecha_fin = timezone.now()
        self.save()

        # Actualizar el plan de mantenimiento si corresponde
        if self.plan_mantenimiento:
            self.plan_mantenimiento.ultima_ejecucion = self.fecha_fin.date()
            self.plan_mantenimiento.save()


class Calibracion(BaseCompanyModel):
    """
    Registro de calibraciones de equipos de medición.

    Documenta cada calibración realizada en equipos de medición
    para cumplimiento ISO y trazabilidad metrológica.
    """
    RESULTADO_CHOICES = [
        ('APROBADO', 'Aprobado'),
        ('AJUSTADO', 'Ajustado y Aprobado'),
        ('RECHAZADO', 'Rechazado'),
    ]

    # Relación
    equipo = models.ForeignKey(
        EquipoMedicion,
        on_delete=models.PROTECT,
        related_name='calibraciones',
        verbose_name='Equipo de Medición'
    )

    # Fechas
    fecha_calibracion = models.DateField(
        verbose_name='Fecha de Calibración'
    )
    fecha_vencimiento = models.DateField(
        verbose_name='Fecha de Vencimiento',
        help_text='Fecha en que vence la calibración'
    )

    # Datos del certificado
    numero_certificado = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name='Número de Certificado'
    )
    laboratorio_calibrador = models.CharField(
        max_length=200,
        verbose_name='Laboratorio Calibrador',
        help_text='Nombre del laboratorio que realizó la calibración'
    )

    # Resultado
    resultado = models.CharField(
        max_length=20,
        choices=RESULTADO_CHOICES,
        db_index=True,
        verbose_name='Resultado'
    )

    # Datos técnicos
    patron_utilizado = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Patrón Utilizado',
        help_text='Patrón de referencia utilizado en la calibración'
    )
    incertidumbre_medicion = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Incertidumbre de Medición'
    )

    # Valores de calibración (JSON para flexibilidad)
    valores_antes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Valores Antes de Calibración',
        help_text='Valores medidos antes de la calibración (JSON)'
    )
    valores_despues = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Valores Después de Calibración',
        help_text='Valores medidos después de la calibración (JSON)'
    )

    # Documentación
    certificado_url = models.URLField(
        blank=True,
        verbose_name='URL del Certificado',
        help_text='Enlace al certificado de calibración digital'
    )

    # Responsable
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='calibraciones_responsable',
        verbose_name='Responsable',
        help_text='Persona responsable de registrar la calibración'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        verbose_name = 'Calibración'
        verbose_name_plural = 'Calibraciones'
        db_table = 'mantenimiento_calibracion'
        ordering = ['-fecha_calibracion']
        indexes = [
            models.Index(fields=['empresa', 'equipo']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['resultado']),
        ]

    def __str__(self):
        return f"{self.numero_certificado} - {self.equipo.codigo}"

    def save(self, *args, **kwargs):
        """Actualizar datos del equipo al guardar calibración."""
        super().save(*args, **kwargs)

        # Actualizar fechas en el equipo
        self.equipo.fecha_calibracion = self.fecha_calibracion
        self.equipo.fecha_proxima_calibracion = self.fecha_vencimiento
        self.equipo.certificado_calibracion_url = self.certificado_url

        # Actualizar estado del equipo según resultado
        if self.resultado == 'RECHAZADO':
            self.equipo.estado = 'FUERA_SERVICIO'
        elif self.equipo.estado == 'EN_CALIBRACION':
            self.equipo.estado = 'OPERATIVO'

        self.equipo.save(update_fields=[
            'fecha_calibracion', 'fecha_proxima_calibracion',
            'certificado_calibracion_url', 'estado'
        ])

    def clean(self):
        """Validaciones del modelo."""
        if self.fecha_vencimiento <= self.fecha_calibracion:
            raise ValidationError({
                'fecha_vencimiento':
                    'La fecha de vencimiento debe ser posterior a la fecha de calibración'
            })


class Parada(BaseCompanyModel):
    """
    Registro de paradas no programadas.

    Documenta todas las paradas inesperadas de activos para
    análisis de disponibilidad, MTBF y optimización de mantenimiento.
    """
    TIPO_CHOICES = [
        ('FALLA_MECANICA', 'Falla Mecánica'),
        ('FALLA_ELECTRICA', 'Falla Eléctrica'),
        ('FALTA_REPUESTOS', 'Falta de Repuestos'),
        ('FALTA_OPERADOR', 'Falta de Operador'),
        ('OTRO', 'Otro'),
    ]

    # Relación
    activo = models.ForeignKey(
        ActivoProduccion,
        on_delete=models.PROTECT,
        related_name='paradas',
        verbose_name='Activo'
    )

    # Tiempo de parada
    fecha_inicio = models.DateTimeField(
        verbose_name='Inicio de Parada'
    )
    fecha_fin = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fin de Parada'
    )
    duracion_horas = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False,
        verbose_name='Duración (horas)',
        help_text='Duración calculada en horas'
    )

    # Clasificación
    tipo = models.CharField(
        max_length=30,
        choices=TIPO_CHOICES,
        db_index=True,
        verbose_name='Tipo de Parada'
    )

    # Descripción
    causa = models.CharField(
        max_length=200,
        verbose_name='Causa',
        help_text='Causa principal de la parada'
    )
    descripcion_falla = models.TextField(
        verbose_name='Descripción de la Falla',
        help_text='Descripción detallada de la falla o problema'
    )

    # Impacto
    impacto_produccion_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Impacto en Producción (kg)',
        help_text='Cantidad de producción perdida en kg'
    )
    costo_estimado_parada = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Costo Estimado de Parada',
        help_text='Costo estimado por la parada (producción perdida + reparación)'
    )

    # Orden de trabajo generada
    orden_trabajo = models.ForeignKey(
        OrdenTrabajo,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='parada_origen',
        verbose_name='Orden de Trabajo',
        help_text='Orden de trabajo generada para resolver la parada'
    )

    # Acciones correctivas
    acciones_correctivas = models.TextField(
        blank=True,
        verbose_name='Acciones Correctivas',
        help_text='Acciones correctivas implementadas para prevenir recurrencia'
    )

    # Responsable del reporte
    reportado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='paradas_reportadas',
        verbose_name='Reportado por'
    )

    class Meta:
        verbose_name = 'Parada'
        verbose_name_plural = 'Paradas'
        db_table = 'mantenimiento_parada'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['empresa', 'activo']),
            models.Index(fields=['tipo']),
            models.Index(fields=['fecha_inicio']),
        ]

    def __str__(self):
        return f"{self.activo.codigo} - {self.fecha_inicio.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        """Calcular duración automáticamente."""
        if self.fecha_inicio and self.fecha_fin:
            delta = self.fecha_fin - self.fecha_inicio
            self.duracion_horas = Decimal(delta.total_seconds()) / Decimal('3600')

        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones del modelo."""
        if self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            raise ValidationError({
                'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio'
            })

    def esta_activa(self):
        """Verificar si la parada está activa (sin fecha de fin)."""
        return self.fecha_fin is None

    def cerrar_parada(self):
        """Cerrar la parada estableciendo fecha de fin."""
        if not self.esta_activa():
            raise ValidationError('La parada ya está cerrada')

        self.fecha_fin = timezone.now()
        self.save()
