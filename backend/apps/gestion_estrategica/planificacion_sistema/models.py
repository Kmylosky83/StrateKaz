# -*- coding: utf-8 -*-
"""
Modelos para Planificacion del Sistema - Gestion Estrategica

Migrado desde hseq_management.planificacion_sistema como parte de la
consolidacion del Nivel 1 (Direccion Estrategica).

Este modulo maneja la planificacion integral del sistema:
- Plan de Trabajo Anual
- Objetivos del Sistema (vinculados a BSC)
- Programas de Gestion
- Seguimiento de Cronograma

NOTA: Se mantienen los nombres de tablas originales (hseq_*) para
evitar migraciones de datos en arquitectura multi-instancia.
"""
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

from utils.models import TenantModel


class PlanTrabajoAnual(TenantModel):
    """
    Plan de Trabajo Anual del Sistema de Gestion

    Contiene la planificacion anual con objetivos, programas y actividades
    que la organizacion debe ejecutar para mantener y mejorar el sistema.
    """

    # ============ MULTI-TENANT ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa',
        help_text='ID de la empresa (multi-tenant)'
    )

    # ============ INFORMACION BASICA ============
    codigo = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Codigo del Plan',
        help_text='Codigo unico del plan (ej: PTA-2024)'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre del Plan',
        help_text='Nombre descriptivo del plan'
    )
    periodo = models.IntegerField(
        verbose_name='Periodo (Año)',
        help_text='Año del plan de trabajo'
    )

    # ============ ESTADO Y RESPONSABLE ============
    estado = models.CharField(
        max_length=20,
        choices=[
            ('BORRADOR', 'Borrador'),
            ('EN_REVISION', 'En Revision'),
            ('APROBADO', 'Aprobado'),
            ('EN_EJECUCION', 'En Ejecucion'),
            ('CERRADO', 'Cerrado'),
            ('CANCELADO', 'Cancelado'),
        ],
        default='BORRADOR',
        verbose_name='Estado',
        help_text='Estado actual del plan'
    )
    responsable = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='planes_trabajo_responsable',
        verbose_name='Responsable del Plan',
        help_text='Responsable de coordinar el plan'
    )

    # ============ FECHAS IMPORTANTES ============
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio',
        help_text='Fecha de inicio del plan'
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha de Finalizacion',
        help_text='Fecha de finalizacion del plan'
    )

    # ============ APROBACION ============
    aprobado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='planes_trabajo_aprobados',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobacion'
    )

    # ============ OBSERVACIONES ============
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripcion',
        help_text='Descripcion general del plan'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones adicionales'
    )

    # Auditoría: created_at, updated_at, created_by, updated_by heredados de TenantModel

    class Meta:
        # Mantener nombre de tabla original para multi-instancia
        db_table = 'hseq_plan_trabajo_anual'
        verbose_name = 'Plan de Trabajo Anual'
        verbose_name_plural = 'Planes de Trabajo Anual'
        ordering = ['-periodo', '-created_at']
        indexes = [
            models.Index(fields=['empresa_id', 'periodo']),
            models.Index(fields=['estado']),
            models.Index(fields=['codigo']),
        ]
        unique_together = [['empresa_id', 'periodo']]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def clean(self):
        if self.fecha_fin and self.fecha_inicio and self.fecha_fin < self.fecha_inicio:
            raise ValidationError('La fecha de fin no puede ser anterior a la fecha de inicio')


class ActividadPlan(TenantModel):
    """
    Actividades del Plan de Trabajo Anual

    Cada plan contiene multiples actividades con fechas, responsables,
    recursos asignados y seguimiento de avance.
    """

    # ============ MULTI-TENANT ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # ============ RELACION CON PLAN ============
    plan_trabajo = models.ForeignKey(
        PlanTrabajoAnual,
        on_delete=models.CASCADE,
        related_name='actividades',
        verbose_name='Plan de Trabajo'
    )

    # ============ INFORMACION BASICA ============
    codigo = models.CharField(
        max_length=50,
        verbose_name='Codigo de Actividad',
        help_text='Codigo unico de la actividad'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre de la Actividad'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripcion'
    )

    # ============ CLASIFICACION ============
    tipo_actividad = models.CharField(
        max_length=50,
        choices=[
            ('CAPACITACION', 'Capacitacion'),
            ('INSPECCION', 'Inspeccion'),
            ('AUDITORIA', 'Auditoria'),
            ('MANTENIMIENTO', 'Mantenimiento'),
            ('SIMULACRO', 'Simulacro'),
            ('REVISION', 'Revision'),
            ('EVALUACION', 'Evaluacion'),
            ('ACTUALIZACION', 'Actualizacion'),
            ('MEJORA', 'Mejora'),
            ('OTRA', 'Otra'),
        ],
        verbose_name='Tipo de Actividad'
    )
    area_responsable = models.CharField(
        max_length=100,
        verbose_name='Area Responsable',
        help_text='Area o departamento responsable'
    )

    # ============ FECHAS Y PROGRAMACION ============
    fecha_programada_inicio = models.DateField(
        verbose_name='Fecha Programada de Inicio'
    )
    fecha_programada_fin = models.DateField(
        verbose_name='Fecha Programada de Finalizacion'
    )
    fecha_real_inicio = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Real de Inicio'
    )
    fecha_real_fin = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Real de Finalizacion'
    )

    # ============ RESPONSABLES ============
    responsable = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='actividades_plan_responsable',
        verbose_name='Responsable'
    )
    colaboradores = models.ManyToManyField(
        'core.User',
        blank=True,
        related_name='actividades_plan_colaborador',
        verbose_name='Colaboradores'
    )

    # ============ RECURSOS ============
    recursos_necesarios = models.TextField(
        blank=True,
        verbose_name='Recursos Necesarios',
        help_text='Recursos humanos, materiales, financieros necesarios'
    )
    presupuesto_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Presupuesto Estimado (COP)',
        help_text='Presupuesto estimado para la actividad'
    )
    presupuesto_ejecutado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        default=0,
        verbose_name='Presupuesto Ejecutado (COP)',
        help_text='Presupuesto realmente ejecutado'
    )

    # ============ AVANCE Y ESTADO ============
    estado = models.CharField(
        max_length=20,
        choices=[
            ('PENDIENTE', 'Pendiente'),
            ('EN_PROCESO', 'En Proceso'),
            ('COMPLETADA', 'Completada'),
            ('CANCELADA', 'Cancelada'),
            ('RETRASADA', 'Retrasada'),
        ],
        default='PENDIENTE',
        verbose_name='Estado'
    )
    porcentaje_avance = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name='Porcentaje de Avance (%)',
        help_text='Porcentaje de avance de la actividad (0-100)'
    )

    # ============ EVIDENCIAS Y RESULTADOS ============
    evidencias = models.TextField(
        blank=True,
        verbose_name='Evidencias',
        help_text='Descripcion de evidencias generadas'
    )
    resultados_obtenidos = models.TextField(
        blank=True,
        verbose_name='Resultados Obtenidos',
        help_text='Resultados concretos obtenidos'
    )

    # ============ OBSERVACIONES ============
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Auditoría: created_at, updated_at, created_by, updated_by heredados de TenantModel

    class Meta:
        # Mantener nombre de tabla original para multi-instancia
        db_table = 'hseq_actividad_plan'
        verbose_name = 'Actividad del Plan'
        verbose_name_plural = 'Actividades del Plan'
        ordering = ['fecha_programada_inicio', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'plan_trabajo']),
            models.Index(fields=['estado']),
            models.Index(fields=['tipo_actividad']),
            models.Index(fields=['responsable']),
        ]
        unique_together = [['plan_trabajo', 'codigo']]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def clean(self):
        if self.fecha_programada_fin < self.fecha_programada_inicio:
            raise ValidationError('La fecha programada de fin no puede ser anterior al inicio')

        if self.porcentaje_avance < 0 or self.porcentaje_avance > 100:
            raise ValidationError('El porcentaje de avance debe estar entre 0 y 100')


class ObjetivoSistema(TenantModel):
    """
    Objetivos del Sistema de Gestion

    Objetivos estrategicos del sistema vinculados al Balanced Scorecard (BSC).
    Cada objetivo tiene metas e indicadores para medir su cumplimiento.
    """

    # ============ MULTI-TENANT ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # ============ RELACION CON PLAN ============
    plan_trabajo = models.ForeignKey(
        PlanTrabajoAnual,
        on_delete=models.CASCADE,
        related_name='objetivos',
        verbose_name='Plan de Trabajo'
    )

    # ============ INFORMACION BASICA ============
    codigo = models.CharField(
        max_length=50,
        verbose_name='Codigo del Objetivo',
        help_text='Codigo unico del objetivo'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre del Objetivo'
    )
    descripcion = models.TextField(
        verbose_name='Descripcion del Objetivo'
    )

    # ============ VINCULACION BSC ============
    perspectiva_bsc = models.CharField(
        max_length=50,
        choices=[
            ('FINANCIERA', 'Perspectiva Financiera'),
            ('CLIENTES', 'Perspectiva de Clientes'),
            ('PROCESOS', 'Perspectiva de Procesos Internos'),
            ('APRENDIZAJE', 'Perspectiva de Aprendizaje y Crecimiento'),
        ],
        verbose_name='Perspectiva BSC',
        help_text='Perspectiva del Balanced Scorecard'
    )
    objetivo_bsc_id = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='ID Objetivo BSC',
        help_text='ID del objetivo en el sistema BSC'
    )

    # ============ CLASIFICACION ============
    tipo_objetivo = models.CharField(
        max_length=50,
        choices=[
            ('ESTRATEGICO', 'Estrategico'),
            ('TACTICO', 'Tactico'),
            ('OPERATIVO', 'Operativo'),
        ],
        verbose_name='Tipo de Objetivo'
    )
    area_aplicacion = models.CharField(
        max_length=100,
        choices=[
            ('SST', 'Seguridad y Salud en el Trabajo'),
            ('CALIDAD', 'Calidad'),
            ('AMBIENTAL', 'Ambiental'),
            ('INTEGRAL', 'Integral HSEQ'),
        ],
        verbose_name='Area de Aplicacion'
    )

    # ============ RESPONSABLE ============
    responsable = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='objetivos_sistema_responsable',
        verbose_name='Responsable del Objetivo'
    )

    # ============ METAS E INDICADORES ============
    meta_descripcion = models.TextField(
        verbose_name='Descripcion de la Meta',
        help_text='Descripcion cualitativa de la meta a alcanzar'
    )
    meta_cuantitativa = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Meta Cuantitativa',
        help_text='Valor numerico de la meta (ej: 95 para 95%)'
    )
    unidad_medida = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Unidad de Medida',
        help_text='Unidad de medida (%, numero, dias, etc.)'
    )

    indicador_nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre del Indicador',
        help_text='Nombre del indicador de cumplimiento'
    )
    formula_calculo = models.TextField(
        blank=True,
        verbose_name='Formula de Calculo',
        help_text='Formula para calcular el indicador'
    )

    # ============ AVANCE Y CUMPLIMIENTO ============
    valor_actual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        default=0,
        verbose_name='Valor Actual',
        help_text='Valor actual del indicador'
    )
    porcentaje_cumplimiento = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name='Porcentaje de Cumplimiento (%)',
        help_text='Porcentaje de cumplimiento de la meta'
    )

    # ============ ESTADO ============
    estado = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVO', 'Activo'),
            ('EN_SEGUIMIENTO', 'En Seguimiento'),
            ('CUMPLIDO', 'Cumplido'),
            ('NO_CUMPLIDO', 'No Cumplido'),
            ('CANCELADO', 'Cancelado'),
        ],
        default='ACTIVO',
        verbose_name='Estado'
    )

    # ============ FECHAS ============
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio'
    )
    fecha_meta = models.DateField(
        verbose_name='Fecha Meta',
        help_text='Fecha limite para cumplir el objetivo'
    )

    # ============ OBSERVACIONES ============
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Auditoría: created_at, updated_at, created_by, updated_by heredados de TenantModel

    class Meta:
        # Mantener nombre de tabla original para multi-instancia
        db_table = 'hseq_objetivo_sistema'
        verbose_name = 'Objetivo del Sistema'
        verbose_name_plural = 'Objetivos del Sistema'
        ordering = ['perspectiva_bsc', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'plan_trabajo']),
            models.Index(fields=['perspectiva_bsc']),
            models.Index(fields=['tipo_objetivo']),
            models.Index(fields=['estado']),
        ]
        unique_together = [['plan_trabajo', 'codigo']]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def clean(self):
        if self.porcentaje_cumplimiento < 0 or self.porcentaje_cumplimiento > 100:
            raise ValidationError('El porcentaje de cumplimiento debe estar entre 0 y 100')


class ProgramaGestion(TenantModel):
    """
    Programas de Gestion del Sistema

    Programas especificos como:
    - Programa de Vigilancia Epidemiologica (PVE)
    - Programa de Capacitacion
    - Programa de Inspecciones
    - Programa de Mantenimiento
    - Programa de Gestion Ambiental
    """

    # ============ MULTI-TENANT ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # ============ RELACION CON PLAN ============
    plan_trabajo = models.ForeignKey(
        PlanTrabajoAnual,
        on_delete=models.CASCADE,
        related_name='programas',
        verbose_name='Plan de Trabajo'
    )

    # ============ INFORMACION BASICA ============
    codigo = models.CharField(
        max_length=50,
        verbose_name='Codigo del Programa',
        help_text='Codigo unico del programa'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre del Programa'
    )
    descripcion = models.TextField(
        verbose_name='Descripcion del Programa'
    )

    # ============ TIPO DE PROGRAMA ============
    tipo_programa = models.CharField(
        max_length=50,
        choices=[
            ('PVE', 'Vigilancia Epidemiologica'),
            ('CAPACITACION', 'Capacitacion'),
            ('INSPECCIONES', 'Inspecciones'),
            ('MANTENIMIENTO', 'Mantenimiento'),
            ('AMBIENTAL', 'Gestion Ambiental'),
            ('RESIDUOS', 'Gestion de Residuos'),
            ('EMERGENCIAS', 'Plan de Emergencias'),
            ('MEDICINA', 'Medicina Preventiva'),
            ('HIGIENE', 'Higiene Industrial'),
            ('SEGURIDAD', 'Seguridad Industrial'),
            ('OTRO', 'Otro'),
        ],
        verbose_name='Tipo de Programa'
    )

    # ============ ALCANCE ============
    alcance = models.TextField(
        verbose_name='Alcance del Programa',
        help_text='Alcance y cobertura del programa'
    )
    objetivos = models.TextField(
        verbose_name='Objetivos del Programa',
        help_text='Objetivos especificos del programa'
    )

    # ============ RESPONSABLES ============
    responsable = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='programas_gestion_responsable',
        verbose_name='Responsable del Programa'
    )
    coordinadores = models.ManyToManyField(
        'core.User',
        blank=True,
        related_name='programas_gestion_coordinador',
        verbose_name='Coordinadores'
    )

    # ============ FECHAS ============
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio'
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha de Finalizacion'
    )

    # ============ RECURSOS ============
    recursos_asignados = models.TextField(
        blank=True,
        verbose_name='Recursos Asignados',
        help_text='Recursos humanos, tecnicos y financieros'
    )
    presupuesto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Presupuesto (COP)'
    )

    # ============ ESTADO Y AVANCE ============
    estado = models.CharField(
        max_length=20,
        choices=[
            ('PLANIFICADO', 'Planificado'),
            ('EN_EJECUCION', 'En Ejecucion'),
            ('COMPLETADO', 'Completado'),
            ('SUSPENDIDO', 'Suspendido'),
            ('CANCELADO', 'Cancelado'),
        ],
        default='PLANIFICADO',
        verbose_name='Estado'
    )
    porcentaje_avance = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name='Porcentaje de Avance (%)'
    )

    # ============ INDICADORES ============
    indicadores_medicion = models.TextField(
        blank=True,
        verbose_name='Indicadores de Medicion',
        help_text='Indicadores para medir efectividad del programa'
    )

    # ============ OBSERVACIONES ============
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Auditoría: created_at, updated_at, created_by, updated_by heredados de TenantModel

    class Meta:
        # Mantener nombre de tabla original para multi-instancia
        db_table = 'hseq_programa_gestion'
        verbose_name = 'Programa de Gestion'
        verbose_name_plural = 'Programas de Gestion'
        ordering = ['tipo_programa', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'plan_trabajo']),
            models.Index(fields=['tipo_programa']),
            models.Index(fields=['estado']),
        ]
        unique_together = [['plan_trabajo', 'codigo']]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class ActividadPrograma(TenantModel):
    """
    Actividades de un Programa de Gestion

    Actividades especificas que se ejecutan dentro de cada programa.
    Cada programa tiene multiples actividades con fechas y responsables.
    """

    # ============ MULTI-TENANT ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # ============ RELACION CON PROGRAMA ============
    programa = models.ForeignKey(
        ProgramaGestion,
        on_delete=models.CASCADE,
        related_name='actividades',
        verbose_name='Programa de Gestion'
    )

    # ============ INFORMACION BASICA ============
    codigo = models.CharField(
        max_length=50,
        verbose_name='Codigo de Actividad'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre de la Actividad'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripcion'
    )

    # ============ FECHAS ============
    fecha_programada = models.DateField(
        verbose_name='Fecha Programada'
    )
    fecha_ejecucion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Ejecucion Real'
    )

    # ============ RESPONSABLE ============
    responsable = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='actividades_programa_responsable',
        verbose_name='Responsable'
    )

    # ============ ESTADO ============
    estado = models.CharField(
        max_length=20,
        choices=[
            ('PENDIENTE', 'Pendiente'),
            ('EN_PROCESO', 'En Proceso'),
            ('EJECUTADA', 'Ejecutada'),
            ('CANCELADA', 'Cancelada'),
        ],
        default='PENDIENTE',
        verbose_name='Estado'
    )

    # ============ EJECUCION Y EVIDENCIAS ============
    resultado = models.TextField(
        blank=True,
        verbose_name='Resultado',
        help_text='Resultado obtenido de la actividad'
    )
    evidencias = models.TextField(
        blank=True,
        verbose_name='Evidencias',
        help_text='Evidencias generadas'
    )

    # ============ OBSERVACIONES ============
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Auditoría: created_at, updated_at, created_by, updated_by heredados de TenantModel

    class Meta:
        # Mantener nombre de tabla original para multi-instancia
        db_table = 'hseq_actividad_programa'
        verbose_name = 'Actividad del Programa'
        verbose_name_plural = 'Actividades del Programa'
        ordering = ['fecha_programada', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'programa']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_programada']),
        ]
        unique_together = [['programa', 'codigo']]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class SeguimientoCronograma(TenantModel):
    """
    Seguimiento del Cronograma de Actividades

    Registra el seguimiento periodico del avance de actividades,
    identificando desviaciones, acciones correctivas y estado general.
    """

    # ============ MULTI-TENANT ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # ============ RELACION CON PLAN ============
    plan_trabajo = models.ForeignKey(
        PlanTrabajoAnual,
        on_delete=models.CASCADE,
        related_name='seguimientos',
        verbose_name='Plan de Trabajo'
    )

    # ============ INFORMACION DEL SEGUIMIENTO ============
    periodo = models.CharField(
        max_length=50,
        verbose_name='Periodo de Seguimiento',
        help_text='Periodo del seguimiento (ej: Enero 2024, Q1 2024, Semana 12)'
    )
    fecha_seguimiento = models.DateField(
        verbose_name='Fecha de Seguimiento',
        help_text='Fecha en que se realiza el seguimiento'
    )

    # ============ RESPONSABLE ============
    realizado_por = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='seguimientos_realizados',
        verbose_name='Realizado por'
    )

    # ============ METRICAS GENERALES ============
    actividades_totales = models.IntegerField(
        default=0,
        verbose_name='Total de Actividades'
    )
    actividades_completadas = models.IntegerField(
        default=0,
        verbose_name='Actividades Completadas'
    )
    actividades_en_proceso = models.IntegerField(
        default=0,
        verbose_name='Actividades En Proceso'
    )
    actividades_retrasadas = models.IntegerField(
        default=0,
        verbose_name='Actividades Retrasadas'
    )
    actividades_pendientes = models.IntegerField(
        default=0,
        verbose_name='Actividades Pendientes'
    )

    # ============ PORCENTAJE AVANCE ============
    porcentaje_avance_general = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name='Porcentaje de Avance General (%)'
    )

    # ============ PRESUPUESTO ============
    presupuesto_planificado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Presupuesto Planificado (COP)'
    )
    presupuesto_ejecutado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Presupuesto Ejecutado (COP)'
    )

    # ============ DESVIACIONES ============
    desviaciones_identificadas = models.TextField(
        blank=True,
        verbose_name='Desviaciones Identificadas',
        help_text='Desviaciones respecto a lo planificado'
    )
    causas_desviacion = models.TextField(
        blank=True,
        verbose_name='Causas de Desviacion',
        help_text='Causas raiz de las desviaciones'
    )

    # ============ ACCIONES ============
    acciones_correctivas = models.TextField(
        blank=True,
        verbose_name='Acciones Correctivas',
        help_text='Acciones para corregir desviaciones'
    )
    acciones_preventivas = models.TextField(
        blank=True,
        verbose_name='Acciones Preventivas',
        help_text='Acciones para prevenir futuras desviaciones'
    )

    # ============ EVALUACION ============
    nivel_cumplimiento = models.CharField(
        max_length=20,
        choices=[
            ('EXCELENTE', 'Excelente (>90%)'),
            ('BUENO', 'Bueno (75-90%)'),
            ('ACEPTABLE', 'Aceptable (60-75%)'),
            ('DEFICIENTE', 'Deficiente (<60%)'),
        ],
        blank=True,
        verbose_name='Nivel de Cumplimiento'
    )

    # ============ OBSERVACIONES ============
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones Generales'
    )
    recomendaciones = models.TextField(
        blank=True,
        verbose_name='Recomendaciones',
        help_text='Recomendaciones para mejorar el desempeno'
    )

    # Auditoría: created_at, updated_at, created_by, updated_by heredados de TenantModel

    class Meta:
        # Mantener nombre de tabla original para multi-instancia
        db_table = 'hseq_seguimiento_cronograma'
        verbose_name = 'Seguimiento de Cronograma'
        verbose_name_plural = 'Seguimientos de Cronograma'
        ordering = ['-fecha_seguimiento']
        indexes = [
            models.Index(fields=['empresa_id', 'plan_trabajo']),
            models.Index(fields=['fecha_seguimiento']),
            models.Index(fields=['periodo']),
        ]

    def __str__(self):
        return f"Seguimiento {self.periodo} - {self.plan_trabajo.codigo}"

    def clean(self):
        if self.porcentaje_avance_general < 0 or self.porcentaje_avance_general > 100:
            raise ValidationError('El porcentaje de avance debe estar entre 0 y 100')
