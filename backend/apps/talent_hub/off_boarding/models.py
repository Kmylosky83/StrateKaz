"""
Modelos de Off-Boarding - Talent Hub

Gestión completa del proceso de retiro de colaboradores según legislación colombiana.
Incluye liquidación final, entrevistas de salida, paz y salvos y exámenes de egreso.

Referencias legales:
- Código Sustantivo del Trabajo: Liquidación final, preaviso
- Ley 50/1990: Cesantías y prestaciones sociales
- Ley 100/1993: Seguridad social
- Resolución 2346/2007: Exámenes médicos ocupacionales
- Decreto 1072/2015: Sistema de Gestión SST

Estructura:
- TipoRetiro: Catálogo de tipos de retiro
- ProcesoRetiro: Proceso principal de retiro de un colaborador
- ChecklistRetiro: Items del checklist de salida
- PazSalvo: Áreas que deben firmar paz y salvo
- ExamenEgreso: Examen médico de egreso (obligatorio)
- EntrevistaRetiro: Entrevista de salida
- LiquidacionFinal: Cálculo de liquidación final

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

from apps.core.base_models import BaseCompanyModel


# =============================================================================
# OPCIONES Y CONSTANTES
# =============================================================================

TIPO_RETIRO_CHOICES = [
    ('voluntario', 'Retiro Voluntario'),
    ('despido_justa_causa', 'Despido con Justa Causa'),
    ('despido_sin_justa_causa', 'Despido sin Justa Causa'),
    ('mutuo_acuerdo', 'Mutuo Acuerdo'),
    ('terminacion_contrato', 'Terminación de Contrato'),
    ('jubilacion', 'Jubilación'),
    ('fallecimiento', 'Fallecimiento'),
    ('abandono_trabajo', 'Abandono del Trabajo'),
]

ESTADO_PROCESO_CHOICES = [
    ('iniciado', 'Iniciado'),
    ('checklist_pendiente', 'Checklist Pendiente'),
    ('paz_salvo_pendiente', 'Paz y Salvo Pendiente'),
    ('examen_pendiente', 'Examen Médico Pendiente'),
    ('entrevista_pendiente', 'Entrevista Pendiente'),
    ('liquidacion_pendiente', 'Liquidación Pendiente'),
    ('completado', 'Completado'),
    ('cancelado', 'Cancelado'),
]

ESTADO_ITEM_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('en_proceso', 'En Proceso'),
    ('completado', 'Completado'),
    ('no_aplica', 'No Aplica'),
]

TIPO_ITEM_CHOICES = [
    ('entrega_activo', 'Entrega de Activo'),
    ('entrega_documento', 'Entrega de Documento'),
    ('devolucion_epp', 'Devolución de EPP'),
    ('cierre_sistema', 'Cierre de Sistema'),
    ('entrega_cargo', 'Entrega de Cargo'),
    ('otro', 'Otro'),
]

ESTADO_PAZ_SALVO_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('aprobado', 'Aprobado'),
    ('rechazado', 'Rechazado'),
]

AREA_PAZ_SALVO_CHOICES = [
    ('talento_humano', 'Talento Humano'),
    ('sistemas', 'Sistemas'),
    ('almacen', 'Almacén'),
    ('administracion', 'Administración'),
    ('produccion', 'Producción'),
    ('hseq', 'HSEQ'),
    ('contabilidad', 'Contabilidad'),
    ('jefe_inmediato', 'Jefe Inmediato'),
]

RESULTADO_EXAMEN_CHOICES = [
    ('apto', 'Apto'),
    ('apto_con_recomendaciones', 'Apto con Recomendaciones'),
    ('no_apto', 'No Apto'),
]

MOTIVO_RETIRO_CHOICES = [
    ('mejor_oportunidad', 'Mejor Oportunidad Laboral'),
    ('cambio_residencia', 'Cambio de Residencia'),
    ('estudios', 'Estudios'),
    ('salud', 'Razones de Salud'),
    ('clima_laboral', 'Clima Laboral'),
    ('remuneracion', 'Remuneración'),
    ('crecimiento_profesional', 'Falta de Crecimiento Profesional'),
    ('equilibrio_vida', 'Equilibrio Vida-Trabajo'),
    ('personal', 'Motivos Personales'),
    ('bajo_desempeno', 'Bajo Desempeño'),
    ('incumplimiento', 'Incumplimiento de Normas'),
    ('reestructuracion', 'Reestructuración Organizacional'),
    ('otro', 'Otro'),
]


# =============================================================================
# TIPO DE RETIRO
# =============================================================================

class TipoRetiro(BaseCompanyModel):
    """
    Tipo de Retiro - Catálogo de tipos de retiro de colaboradores.

    Define los diferentes tipos de retiro según la legislación colombiana,
    incluyendo configuraciones para indemnización y preaviso.

    Referencias:
    - Código Sustantivo del Trabajo Art. 64: Terminación del contrato
    - Código Sustantivo del Trabajo Art. 62: Justa causa de terminación
    """

    # Identificación
    codigo = models.CharField(
        max_length=30,
        verbose_name='Código',
        help_text='Código único del tipo de retiro',
        db_index=True
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del Tipo de Retiro'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada y base legal'
    )

    # Tipo
    tipo = models.CharField(
        max_length=30,
        choices=TIPO_RETIRO_CHOICES,
        verbose_name='Tipo de Retiro',
        db_index=True
    )

    # Configuración de Indemnización
    requiere_indemnizacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Indemnización',
        help_text='Si aplica indemnización por despido sin justa causa'
    )
    formula_indemnizacion = models.TextField(
        blank=True,
        verbose_name='Fórmula de Indemnización',
        help_text='Fórmula legal para cálculo de indemnización'
    )

    # Configuración de Preaviso
    requiere_preaviso = models.BooleanField(
        default=False,
        verbose_name='Requiere Preaviso',
        help_text='Si requiere notificación previa'
    )
    dias_preaviso = models.PositiveIntegerField(
        default=0,
        verbose_name='Días de Preaviso',
        help_text='Días mínimos de preaviso requeridos (default: 0)'
    )

    # Configuración Administrativa
    requiere_autorizacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Autorización Especial',
        help_text='Si requiere aprobación de gerencia o nivel superior'
    )
    requiere_entrevista_salida = models.BooleanField(
        default=True,
        verbose_name='Requiere Entrevista de Salida',
        help_text='Si es obligatorio realizar entrevista de salida'
    )

    # Orden de visualización
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        db_index=True
    )

    class Meta:
        db_table = 'talent_hub_tipo_retiro'
        verbose_name = 'Tipo de Retiro'
        verbose_name_plural = 'Tipos de Retiro'
        unique_together = [['empresa', 'codigo']]
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['tipo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def es_voluntario(self):
        """Verifica si es un retiro voluntario."""
        return self.tipo == 'voluntario'

    @property
    def es_despido(self):
        """Verifica si es un despido."""
        return self.tipo in ['despido_justa_causa', 'despido_sin_justa_causa']


# =============================================================================
# PROCESO DE RETIRO
# =============================================================================

class ProcesoRetiro(BaseCompanyModel):
    """
    Proceso de Retiro - Proceso principal de retiro de un colaborador.

    Gestiona todo el ciclo de retiro desde la notificación hasta la liquidación final.
    Integra checklist, paz y salvos, examen médico, entrevista y liquidación.

    Referencias:
    - Código Sustantivo del Trabajo: Terminación del contrato
    - Resolución 2346/2007: Exámenes médicos de egreso
    """

    # Relaciones
    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='procesos_retiro',
        verbose_name='Colaborador'
    )
    tipo_retiro = models.ForeignKey(
        TipoRetiro,
        on_delete=models.PROTECT,
        related_name='procesos',
        verbose_name='Tipo de Retiro'
    )

    # Fechas Importantes
    fecha_notificacion = models.DateField(
        verbose_name='Fecha de Notificación',
        help_text='Fecha en que se notificó el retiro',
        db_index=True
    )
    fecha_ultimo_dia_trabajo = models.DateField(
        verbose_name='Último Día de Trabajo',
        help_text='Último día efectivo de trabajo',
        db_index=True
    )
    fecha_retiro_efectivo = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Retiro Efectivo',
        help_text='Fecha en que se completó el proceso de retiro'
    )

    # Información del Retiro
    motivo_retiro = models.CharField(
        max_length=30,
        choices=MOTIVO_RETIRO_CHOICES,
        verbose_name='Motivo Principal de Retiro'
    )
    motivo_detallado = models.TextField(
        blank=True,
        verbose_name='Motivo Detallado',
        help_text='Descripción detallada del motivo de retiro'
    )
    justa_causa_detalle = models.TextField(
        blank=True,
        verbose_name='Detalle Justa Causa',
        help_text='Documentación de la justa causa (si aplica)'
    )

    # Estado del Proceso
    estado = models.CharField(
        max_length=25,
        choices=ESTADO_PROCESO_CHOICES,
        default='iniciado',
        verbose_name='Estado del Proceso',
        db_index=True
    )
    progreso_porcentaje = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Progreso (%)',
        help_text='Porcentaje de avance del proceso (0-100)'
    )

    # Autorizaciones
    requiere_autorizacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Autorización',
        help_text='Si requiere aprobación de gerencia'
    )
    autorizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='retiros_autorizados',
        verbose_name='Autorizado Por'
    )
    fecha_autorizacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Autorización'
    )

    # Preaviso
    dias_preaviso_cumplidos = models.PositiveIntegerField(
        default=0,
        verbose_name='Días de Preaviso Cumplidos',
        help_text='Días efectivos de preaviso notificados'
    )
    cumple_preaviso = models.BooleanField(
        default=False,
        verbose_name='Cumple Preaviso',
        help_text='Si cumplió con el preaviso requerido'
    )

    # Control de Completitud
    checklist_completado = models.BooleanField(
        default=False,
        verbose_name='Checklist Completado'
    )
    paz_salvo_completo = models.BooleanField(
        default=False,
        verbose_name='Paz y Salvo Completo'
    )
    examen_egreso_realizado = models.BooleanField(
        default=False,
        verbose_name='Examen de Egreso Realizado'
    )
    entrevista_realizada = models.BooleanField(
        default=False,
        verbose_name='Entrevista de Salida Realizada'
    )
    liquidacion_aprobada = models.BooleanField(
        default=False,
        verbose_name='Liquidación Aprobada'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones Generales'
    )

    # Responsable del Proceso
    responsable_proceso = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='procesos_retiro_responsables',
        verbose_name='Responsable del Proceso',
        help_text='Usuario de Talento Humano responsable del proceso'
    )

    # Cierre del Proceso
    cerrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='procesos_retiro_cerrados',
        verbose_name='Cerrado Por'
    )
    fecha_cierre = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cierre del Proceso'
    )

    class Meta:
        db_table = 'talent_hub_proceso_retiro'
        verbose_name = 'Proceso de Retiro'
        verbose_name_plural = 'Procesos de Retiro'
        ordering = ['-fecha_notificacion']
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_ultimo_dia_trabajo']),
            models.Index(fields=['fecha_notificacion']),
        ]

    def __str__(self):
        return f"Retiro {self.colaborador.get_nombre_corto()} - {self.fecha_ultimo_dia_trabajo}"

    @property
    def nombre_proceso(self):
        """Retorna nombre descriptivo del proceso."""
        return f"Retiro de {self.colaborador.get_nombre_completo()} - {self.tipo_retiro.nombre}"

    @property
    def esta_completado(self):
        """Verifica si el proceso está completado."""
        return self.estado == 'completado'

    @property
    def esta_cancelado(self):
        """Verifica si el proceso fue cancelado."""
        return self.estado == 'cancelado'

    @property
    def dias_preaviso_requeridos(self):
        """Retorna los días de preaviso requeridos según el tipo de retiro."""
        return self.tipo_retiro.dias_preaviso

    @property
    def fecha_esperada_retiro(self):
        """Calcula la fecha esperada de retiro según preaviso."""
        if self.fecha_notificacion and self.dias_preaviso_requeridos:
            return self.fecha_notificacion + timedelta(days=self.dias_preaviso_requeridos)
        return self.fecha_ultimo_dia_trabajo

    def calcular_progreso(self):
        """Calcula el porcentaje de progreso del proceso."""
        total_pasos = 5
        pasos_completados = sum([
            self.checklist_completado,
            self.paz_salvo_completo,
            self.examen_egreso_realizado,
            self.entrevista_realizada,
            self.liquidacion_aprobada,
        ])

        self.progreso_porcentaje = int((pasos_completados / total_pasos) * 100)
        self.save(update_fields=['progreso_porcentaje'])

    def verificar_completitud(self):
        """Verifica si todos los pasos están completados y actualiza estado."""
        if all([
            self.checklist_completado,
            self.paz_salvo_completo,
            self.examen_egreso_realizado,
            self.entrevista_realizada,
            self.liquidacion_aprobada,
        ]):
            self.estado = 'completado'
            if not self.fecha_retiro_efectivo:
                self.fecha_retiro_efectivo = timezone.now().date()
            self.save(update_fields=['estado', 'fecha_retiro_efectivo'])
            return True
        return False

    def clean(self):
        """Validaciones del modelo."""
        # Validar que colaborador pertenezca a la misma empresa
        if self.colaborador and self.empresa:
            if self.colaborador.empresa != self.empresa:
                raise ValidationError({
                    'colaborador': 'El colaborador debe pertenecer a la misma empresa.'
                })

        # Validar que tipo_retiro pertenezca a la misma empresa
        if self.tipo_retiro and self.empresa:
            if self.tipo_retiro.empresa != self.empresa:
                raise ValidationError({
                    'tipo_retiro': 'El tipo de retiro debe pertenecer a la misma empresa.'
                })

        # Validar fechas
        if self.fecha_notificacion and self.fecha_ultimo_dia_trabajo:
            if self.fecha_ultimo_dia_trabajo < self.fecha_notificacion:
                raise ValidationError({
                    'fecha_ultimo_dia_trabajo': 'El último día de trabajo no puede ser anterior a la fecha de notificación.'
                })

        # Validar preaviso
        if self.fecha_notificacion and self.fecha_ultimo_dia_trabajo:
            dias_notificados = (self.fecha_ultimo_dia_trabajo - self.fecha_notificacion).days
            self.dias_preaviso_cumplidos = dias_notificados
            self.cumple_preaviso = dias_notificados >= self.dias_preaviso_requeridos


# =============================================================================
# CHECKLIST DE RETIRO
# =============================================================================

class ChecklistRetiro(BaseCompanyModel):
    """
    Checklist de Retiro - Items del checklist de salida.

    Define los ítems que el colaborador debe completar antes del retiro,
    como entrega de activos, documentos, EPP, accesos a sistemas, etc.
    """

    # Relación
    proceso_retiro = models.ForeignKey(
        ProcesoRetiro,
        on_delete=models.CASCADE,
        related_name='items_checklist',
        verbose_name='Proceso de Retiro'
    )

    # Información del Item
    tipo_item = models.CharField(
        max_length=25,
        choices=TIPO_ITEM_CHOICES,
        verbose_name='Tipo de Item'
    )
    descripcion = models.CharField(
        max_length=255,
        verbose_name='Descripción del Item'
    )
    detalles = models.TextField(
        blank=True,
        verbose_name='Detalles',
        help_text='Información adicional del item a entregar'
    )

    # Estado
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_ITEM_CHOICES,
        default='pendiente',
        verbose_name='Estado',
        db_index=True
    )

    # Responsable de Validación
    responsable_area = models.CharField(
        max_length=25,
        choices=AREA_PAZ_SALVO_CHOICES,
        verbose_name='Área Responsable de Validar'
    )
    validado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='items_checklist_validados',
        verbose_name='Validado Por'
    )
    fecha_validacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Validación'
    )

    # Evidencia
    evidencia = models.FileField(
        upload_to='off_boarding/checklist/',
        null=True,
        blank=True,
        verbose_name='Evidencia',
        help_text='Archivo de evidencia (acta de entrega, foto, etc.)'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Orden
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        db_index=True
    )

    class Meta:
        db_table = 'talent_hub_checklist_retiro'
        verbose_name = 'Item de Checklist de Retiro'
        verbose_name_plural = 'Items de Checklist de Retiro'
        ordering = ['proceso_retiro', 'orden', 'tipo_item']
        indexes = [
            models.Index(fields=['proceso_retiro', 'estado']),
            models.Index(fields=['responsable_area']),
        ]

    def __str__(self):
        return f"{self.get_tipo_item_display()} - {self.descripcion}"

    @property
    def esta_completado(self):
        """Verifica si el item está completado."""
        return self.estado == 'completado'

    def marcar_completado(self, usuario):
        """Marca el item como completado."""
        self.estado = 'completado'
        self.validado_por = usuario
        self.fecha_validacion = timezone.now()
        self.save(update_fields=['estado', 'validado_por', 'fecha_validacion'])


# =============================================================================
# PAZ Y SALVO
# =============================================================================

class PazSalvo(BaseCompanyModel):
    """
    Paz y Salvo - Firma de paz y salvo por área.

    Cada área de la empresa debe firmar el paz y salvo del colaborador,
    confirmando que no tiene pendientes de entrega, deudas o responsabilidades.
    """

    # Relación
    proceso_retiro = models.ForeignKey(
        ProcesoRetiro,
        on_delete=models.CASCADE,
        related_name='paz_salvos',
        verbose_name='Proceso de Retiro'
    )

    # Área
    area = models.CharField(
        max_length=25,
        choices=AREA_PAZ_SALVO_CHOICES,
        verbose_name='Área',
        db_index=True
    )
    descripcion_area = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Descripción del Área'
    )

    # Estado
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_PAZ_SALVO_CHOICES,
        default='pendiente',
        verbose_name='Estado',
        db_index=True
    )

    # Responsable de Aprobación
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='paz_salvos_responsable',
        verbose_name='Responsable del Área',
        help_text='Persona encargada de firmar el paz y salvo'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='paz_salvos_aprobados',
        verbose_name='Aprobado Por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    # Pendientes
    pendientes = models.TextField(
        blank=True,
        verbose_name='Pendientes Identificados',
        help_text='Listado de pendientes antes de aprobación'
    )
    resolucion_pendientes = models.TextField(
        blank=True,
        verbose_name='Resolución de Pendientes',
        help_text='Cómo se resolvieron los pendientes'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Documento
    documento_paz_salvo = models.FileField(
        upload_to='off_boarding/paz_salvos/',
        null=True,
        blank=True,
        verbose_name='Documento Paz y Salvo',
        help_text='Documento firmado del paz y salvo'
    )

    class Meta:
        db_table = 'talent_hub_paz_salvo'
        verbose_name = 'Paz y Salvo'
        verbose_name_plural = 'Paz y Salvos'
        unique_together = [['proceso_retiro', 'area']]
        ordering = ['proceso_retiro', 'area']
        indexes = [
            models.Index(fields=['proceso_retiro', 'estado']),
            models.Index(fields=['area', 'estado']),
        ]

    def __str__(self):
        return f"Paz y Salvo {self.get_area_display()} - {self.proceso_retiro.colaborador.get_nombre_corto()}"

    @property
    def esta_aprobado(self):
        """Verifica si el paz y salvo está aprobado."""
        return self.estado == 'aprobado'

    @property
    def esta_rechazado(self):
        """Verifica si el paz y salvo fue rechazado."""
        return self.estado == 'rechazado'

    def aprobar(self, usuario, observaciones=''):
        """Aprueba el paz y salvo."""
        self.estado = 'aprobado'
        self.aprobado_por = usuario
        self.fecha_aprobacion = timezone.now()
        if observaciones:
            self.observaciones = observaciones
        self.save(update_fields=['estado', 'aprobado_por', 'fecha_aprobacion', 'observaciones'])

    def rechazar(self, usuario, motivo):
        """Rechaza el paz y salvo."""
        self.estado = 'rechazado'
        self.aprobado_por = usuario
        self.fecha_aprobacion = timezone.now()
        self.observaciones = motivo
        self.save(update_fields=['estado', 'aprobado_por', 'fecha_aprobacion', 'observaciones'])


# =============================================================================
# EXAMEN DE EGRESO
# =============================================================================

class ExamenEgreso(BaseCompanyModel):
    """
    Examen de Egreso - Examen médico ocupacional de egreso.

    Obligatorio según Resolución 2346/2007. Evalúa el estado de salud
    del trabajador al momento del retiro para comparar con examen de ingreso.

    Referencias:
    - Resolución 2346/2007: Evaluaciones médicas ocupacionales
    - Resolución 1918/2009: Custodia de historias clínicas
    """

    # Relación
    proceso_retiro = models.OneToOneField(
        ProcesoRetiro,
        on_delete=models.CASCADE,
        related_name='examen_egreso',
        verbose_name='Proceso de Retiro'
    )

    # Información del Examen
    fecha_examen = models.DateField(
        verbose_name='Fecha del Examen',
        db_index=True
    )
    entidad_prestadora = models.CharField(
        max_length=200,
        verbose_name='Entidad Prestadora',
        help_text='IPS o médico ocupacional que realizó el examen'
    )
    medico_evaluador = models.CharField(
        max_length=200,
        verbose_name='Médico Evaluador',
        help_text='Nombre del médico que realizó la evaluación'
    )
    licencia_medico = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Licencia del Médico',
        help_text='Número de licencia profesional del médico'
    )

    # Resultados
    resultado = models.CharField(
        max_length=30,
        choices=RESULTADO_EXAMEN_CHOICES,
        verbose_name='Resultado del Examen'
    )
    concepto_medico = models.TextField(
        verbose_name='Concepto Médico',
        help_text='Concepto emitido por el médico ocupacional'
    )

    # Hallazgos
    hallazgos_clinicos = models.TextField(
        blank=True,
        verbose_name='Hallazgos Clínicos',
        help_text='Hallazgos relevantes del examen clínico'
    )
    diagnostico_egreso = models.TextField(
        blank=True,
        verbose_name='Diagnóstico de Egreso',
        help_text='Diagnósticos identificados al egreso (CIE-10)'
    )

    # Comparación con Examen de Ingreso
    comparacion_examen_ingreso = models.TextField(
        blank=True,
        verbose_name='Comparación con Examen de Ingreso',
        help_text='Diferencias identificadas respecto al examen de ingreso'
    )
    enfermedad_laboral_identificada = models.BooleanField(
        default=False,
        verbose_name='Enfermedad Laboral Identificada',
        help_text='Si se identificó alguna enfermedad de origen laboral'
    )
    enfermedad_laboral_detalle = models.TextField(
        blank=True,
        verbose_name='Detalle Enfermedad Laboral',
        help_text='Descripción de la enfermedad laboral identificada'
    )

    # Recomendaciones
    recomendaciones = models.TextField(
        blank=True,
        verbose_name='Recomendaciones Médicas',
        help_text='Recomendaciones para el trabajador'
    )
    requiere_seguimiento = models.BooleanField(
        default=False,
        verbose_name='Requiere Seguimiento',
        help_text='Si requiere seguimiento médico posterior'
    )

    # Documentos
    certificado_medico = models.FileField(
        upload_to='off_boarding/examenes_egreso/',
        verbose_name='Certificado Médico',
        help_text='Certificado médico de egreso firmado'
    )
    examenes_adjuntos = models.FileField(
        upload_to='off_boarding/examenes_egreso/',
        null=True,
        blank=True,
        verbose_name='Exámenes Adjuntos',
        help_text='Laboratorios, imágenes u otros exámenes realizados'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_examen_egreso'
        verbose_name = 'Examen de Egreso'
        verbose_name_plural = 'Exámenes de Egreso'
        ordering = ['-fecha_examen']
        indexes = [
            models.Index(fields=['fecha_examen']),
            models.Index(fields=['resultado']),
            models.Index(fields=['empresa', 'fecha_examen']),
        ]

    def __str__(self):
        return f"Examen Egreso {self.proceso_retiro.colaborador.get_nombre_corto()} - {self.fecha_examen}"

    @property
    def es_apto(self):
        """Verifica si el resultado fue apto."""
        return self.resultado == 'apto'

    @property
    def tiene_enfermedad_laboral(self):
        """Verifica si se identificó enfermedad laboral."""
        return self.enfermedad_laboral_identificada


# =============================================================================
# ENTREVISTA DE RETIRO
# =============================================================================

class EntrevistaRetiro(BaseCompanyModel):
    """
    Entrevista de Retiro - Entrevista de salida al colaborador.

    Recopila feedback del colaborador sobre su experiencia laboral,
    motivos de retiro y oportunidades de mejora para la organización.
    """

    # Relación
    proceso_retiro = models.OneToOneField(
        ProcesoRetiro,
        on_delete=models.CASCADE,
        related_name='entrevista_retiro',
        verbose_name='Proceso de Retiro'
    )

    # Información de la Entrevista
    fecha_entrevista = models.DateField(
        verbose_name='Fecha de la Entrevista',
        db_index=True
    )
    entrevistador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='entrevistas_retiro_realizadas',
        verbose_name='Entrevistador',
        help_text='Usuario de Talento Humano que realizó la entrevista'
    )
    modalidad = models.CharField(
        max_length=20,
        choices=[
            ('presencial', 'Presencial'),
            ('virtual', 'Virtual'),
            ('telefonica', 'Telefónica'),
        ],
        default='presencial',
        verbose_name='Modalidad de Entrevista'
    )

    # Evaluación de Áreas (Escala 1-5)
    satisfaccion_general = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Satisfacción General',
        help_text='Nivel de satisfacción general (1-5)'
    )
    evaluacion_liderazgo = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Evaluación del Liderazgo',
        help_text='Evaluación del jefe inmediato (1-5)'
    )
    evaluacion_clima_laboral = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Clima Laboral',
        help_text='Evaluación del ambiente de trabajo (1-5)'
    )
    evaluacion_remuneracion = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Remuneración y Beneficios',
        help_text='Evaluación de salario y beneficios (1-5)'
    )
    evaluacion_desarrollo = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Desarrollo Profesional',
        help_text='Oportunidades de crecimiento (1-5)'
    )
    evaluacion_equilibrio_vida = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Equilibrio Vida-Trabajo',
        help_text='Balance vida personal-laboral (1-5)'
    )

    # Preguntas Abiertas
    motivo_principal_retiro = models.CharField(
        max_length=30,
        choices=MOTIVO_RETIRO_CHOICES,
        verbose_name='Motivo Principal de Retiro'
    )
    motivo_detallado = models.TextField(
        verbose_name='Motivo Detallado',
        help_text='Explicación detallada del motivo de retiro'
    )

    aspectos_positivos = models.TextField(
        verbose_name='Aspectos Positivos',
        help_text='¿Qué fue lo mejor de trabajar en la empresa?'
    )
    aspectos_mejorar = models.TextField(
        verbose_name='Aspectos a Mejorar',
        help_text='¿Qué podría mejorar la empresa?'
    )
    sugerencias = models.TextField(
        blank=True,
        verbose_name='Sugerencias',
        help_text='Sugerencias para la mejora organizacional'
    )

    # Recontratación
    volveria_trabajar = models.BooleanField(
        default=False,
        verbose_name='¿Volvería a Trabajar en la Empresa?'
    )
    justificacion_recontratacion = models.TextField(
        blank=True,
        verbose_name='Justificación',
        help_text='Razón de la respuesta anterior'
    )
    recomendaria_empresa = models.BooleanField(
        default=False,
        verbose_name='¿Recomendaría la Empresa?'
    )

    # Análisis del Entrevistador
    analisis_entrevistador = models.TextField(
        blank=True,
        verbose_name='Análisis del Entrevistador',
        help_text='Impresiones y análisis del entrevistador'
    )
    recomendaciones_organizacion = models.TextField(
        blank=True,
        verbose_name='Recomendaciones para la Organización',
        help_text='Acciones sugeridas basadas en la entrevista'
    )

    # Documentos
    acta_entrevista = models.FileField(
        upload_to='off_boarding/entrevistas/',
        null=True,
        blank=True,
        verbose_name='Acta de Entrevista',
        help_text='Documento firmado de la entrevista'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones Adicionales'
    )

    class Meta:
        db_table = 'talent_hub_entrevista_retiro'
        verbose_name = 'Entrevista de Retiro'
        verbose_name_plural = 'Entrevistas de Retiro'
        ordering = ['-fecha_entrevista']
        indexes = [
            models.Index(fields=['fecha_entrevista']),
            models.Index(fields=['motivo_principal_retiro']),
            models.Index(fields=['empresa', 'fecha_entrevista']),
        ]

    def __str__(self):
        return f"Entrevista {self.proceso_retiro.colaborador.get_nombre_corto()} - {self.fecha_entrevista}"

    @property
    def promedio_evaluacion(self):
        """Calcula el promedio de todas las evaluaciones."""
        evaluaciones = [
            self.satisfaccion_general,
            self.evaluacion_liderazgo,
            self.evaluacion_clima_laboral,
            self.evaluacion_remuneracion,
            self.evaluacion_desarrollo,
            self.evaluacion_equilibrio_vida,
        ]
        return round(sum(evaluaciones) / len(evaluaciones), 2)

    @property
    def evaluacion_positiva(self):
        """Verifica si la evaluación general fue positiva (>=3.5)."""
        return self.promedio_evaluacion >= 3.5


# =============================================================================
# LIQUIDACIÓN FINAL
# =============================================================================

class LiquidacionFinal(BaseCompanyModel):
    """
    Liquidación Final - Cálculo de liquidación final de retiro.

    Calcula todas las prestaciones sociales, vacaciones pendientes,
    indemnizaciones (si aplica) y deducciones según legislación colombiana.

    Referencias:
    - Código Sustantivo del Trabajo: Liquidación del contrato
    - Ley 50/1990: Cesantías
    - Ley 100/1993: Seguridad social
    - Decreto 1072/2015: SST
    """

    # Relación
    proceso_retiro = models.OneToOneField(
        ProcesoRetiro,
        on_delete=models.CASCADE,
        related_name='liquidacion_final',
        verbose_name='Proceso de Retiro'
    )

    # Fechas de Cálculo
    fecha_liquidacion = models.DateField(
        verbose_name='Fecha de Liquidación',
        db_index=True
    )
    fecha_ingreso = models.DateField(
        verbose_name='Fecha de Ingreso',
        help_text='Fecha de ingreso del colaborador a la empresa'
    )
    fecha_retiro = models.DateField(
        verbose_name='Fecha de Retiro',
        help_text='Fecha efectiva de retiro'
    )

    # Datos Base de Cálculo
    salario_base = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Salario Base',
        help_text='Último salario base del colaborador'
    )
    salario_promedio = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Salario Promedio',
        help_text='Promedio salarial últimos 6 meses (para prestaciones)'
    )
    dias_trabajados_total = models.PositiveIntegerField(
        verbose_name='Días Trabajados Totales',
        help_text='Días totales trabajados en la empresa'
    )

    # Cesantías
    cesantias_causadas = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Cesantías Causadas'
    )
    cesantias_pagadas = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Cesantías Pagadas Anteriormente'
    )
    cesantias_pendientes = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Cesantías Pendientes'
    )

    # Intereses sobre Cesantías
    intereses_cesantias = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Intereses sobre Cesantías',
        help_text='12% anual sobre cesantías'
    )

    # Prima de Servicios
    prima_causada = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Prima de Servicios Causada'
    )
    prima_pagada = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Prima Pagada Anteriormente'
    )
    prima_pendiente = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Prima Pendiente'
    )

    # Vacaciones
    dias_vacaciones_causados = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Días de Vacaciones Causados',
        help_text='Días de vacaciones acumulados'
    )
    dias_vacaciones_disfrutados = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Días de Vacaciones Disfrutados'
    )
    dias_vacaciones_pendientes = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Días de Vacaciones Pendientes'
    )
    valor_vacaciones = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Valor Vacaciones Pendientes'
    )

    # Indemnización (si aplica)
    aplica_indemnizacion = models.BooleanField(
        default=False,
        verbose_name='Aplica Indemnización',
        help_text='Si el tipo de retiro genera indemnización'
    )
    valor_indemnizacion = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Valor Indemnización',
        help_text='Indemnización por despido sin justa causa'
    )
    formula_indemnizacion = models.TextField(
        blank=True,
        verbose_name='Fórmula Aplicada',
        help_text='Fórmula legal aplicada para calcular indemnización'
    )

    # Otros Devengados
    bonificaciones = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Bonificaciones Pendientes'
    )
    otros_devengados = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Otros Devengados'
    )
    detalle_otros_devengados = models.TextField(
        blank=True,
        verbose_name='Detalle Otros Devengados'
    )

    # Deducciones
    prestamos_pendientes = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Préstamos Pendientes'
    )
    libranzas_pendientes = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Libranzas Pendientes'
    )
    otras_deducciones = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Otras Deducciones'
    )
    detalle_otras_deducciones = models.TextField(
        blank=True,
        verbose_name='Detalle Otras Deducciones'
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

    # Aprobación
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='liquidaciones_retiro_aprobadas',
        verbose_name='Aprobado Por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    # Pago
    fecha_pago = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Pago'
    )
    metodo_pago = models.CharField(
        max_length=20,
        choices=[
            ('transferencia', 'Transferencia Bancaria'),
            ('cheque', 'Cheque'),
            ('efectivo', 'Efectivo'),
        ],
        blank=True,
        verbose_name='Método de Pago'
    )
    referencia_pago = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Referencia de Pago',
        help_text='Número de transacción o cheque'
    )

    # Documentos
    documento_liquidacion = models.FileField(
        upload_to='off_boarding/liquidaciones/',
        null=True,
        blank=True,
        verbose_name='Documento de Liquidación',
        help_text='Liquidación final firmada'
    )
    comprobante_pago = models.FileField(
        upload_to='off_boarding/liquidaciones/',
        null=True,
        blank=True,
        verbose_name='Comprobante de Pago'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_liquidacion_final'
        verbose_name = 'Liquidación Final'
        verbose_name_plural = 'Liquidaciones Finales'
        ordering = ['-fecha_liquidacion']
        indexes = [
            models.Index(fields=['fecha_liquidacion']),
            models.Index(fields=['empresa', 'fecha_liquidacion']),
        ]

    def __str__(self):
        return f"Liquidación Final {self.proceso_retiro.colaborador.get_nombre_corto()} - ${self.neto_pagar}"

    @property
    def esta_aprobada(self):
        """Verifica si la liquidación está aprobada."""
        return self.aprobado_por is not None

    @property
    def esta_pagada(self):
        """Verifica si la liquidación fue pagada."""
        return self.fecha_pago is not None

    @property
    def tiempo_servicio_anios(self):
        """Calcula los años de servicio del colaborador."""
        if self.fecha_ingreso and self.fecha_retiro:
            delta = self.fecha_retiro - self.fecha_ingreso
            return round(delta.days / 365.25, 2)
        return 0

    def calcular_cesantias(self):
        """
        Calcula cesantías según Ley 50/1990.
        Fórmula: (Salario promedio × Días trabajados) / 360
        """
        if self.dias_trabajados_total > 0:
            self.cesantias_causadas = (
                self.salario_promedio * Decimal(self.dias_trabajados_total)
            ) / Decimal('360')
            self.cesantias_pendientes = self.cesantias_causadas - self.cesantias_pagadas
        else:
            self.cesantias_causadas = Decimal('0.00')
            self.cesantias_pendientes = Decimal('0.00')

    def calcular_intereses_cesantias(self):
        """
        Calcula intereses sobre cesantías (12% anual).
        Se calculan sobre cesantías pendientes.
        """
        if self.cesantias_pendientes > 0 and self.dias_trabajados_total > 0:
            porcentaje_anual = Decimal('0.12')
            self.intereses_cesantias = (
                self.cesantias_pendientes * porcentaje_anual *
                Decimal(self.dias_trabajados_total)
            ) / Decimal('360')
        else:
            self.intereses_cesantias = Decimal('0.00')

    def calcular_prima(self):
        """
        Calcula prima de servicios proporcional.
        Fórmula: (Salario promedio × Días del semestre trabajados) / 360
        """
        # Calcular días del semestre actual trabajados
        # Simplificado: usar días totales / 2 (dos primas al año)
        dias_semestre = min(180, self.dias_trabajados_total)

        if dias_semestre > 0:
            self.prima_causada = (
                self.salario_promedio * Decimal(dias_semestre)
            ) / Decimal('360')
            self.prima_pendiente = self.prima_causada - self.prima_pagada
        else:
            self.prima_causada = Decimal('0.00')
            self.prima_pendiente = Decimal('0.00')

    def calcular_vacaciones(self):
        """
        Calcula vacaciones pendientes.
        Según Código Sustantivo: 15 días hábiles por año trabajado.
        """
        # Días causados: (Días trabajados / 360) × 15
        self.dias_vacaciones_causados = (
            Decimal(self.dias_trabajados_total) / Decimal('360')
        ) * Decimal('15')

        self.dias_vacaciones_pendientes = (
            self.dias_vacaciones_causados - self.dias_vacaciones_disfrutados
        )

        # Valor: (Salario base / 30) × Días pendientes
        if self.dias_vacaciones_pendientes > 0:
            self.valor_vacaciones = (
                self.salario_base / Decimal('30')
            ) * self.dias_vacaciones_pendientes
        else:
            self.valor_vacaciones = Decimal('0.00')

    def calcular_indemnizacion(self):
        """
        Calcula indemnización por despido sin justa causa.

        Según Código Sustantivo del Trabajo:
        - Contrato indefinido: 30 días de salario por primer año,
          20 días adicionales por cada año siguiente
        - Contrato fijo: Valor de los salarios faltantes hasta terminar contrato
        """
        if not self.aplica_indemnizacion:
            self.valor_indemnizacion = Decimal('0.00')
            return

        tipo_retiro = self.proceso_retiro.tipo_retiro.tipo

        if tipo_retiro == 'despido_sin_justa_causa':
            # Simplificado para contrato indefinido
            anios_servicio = self.tiempo_servicio_anios

            if anios_servicio < 1:
                # Proporcional al tiempo trabajado
                dias_indemnizacion = Decimal('30') * Decimal(str(anios_servicio))
            else:
                # 30 días primer año + 20 días por cada año adicional
                dias_indemnizacion = Decimal('30') + (
                    Decimal('20') * Decimal(str(int(anios_servicio) - 1))
                )

            self.valor_indemnizacion = (
                self.salario_base / Decimal('30')
            ) * dias_indemnizacion

            self.formula_indemnizacion = (
                f"30 días primer año + 20 días × {int(anios_servicio) - 1} años adicionales = "
                f"{dias_indemnizacion} días × (${self.salario_base}/30)"
            )
        else:
            self.valor_indemnizacion = Decimal('0.00')

    def calcular_totales(self):
        """Calcula los totales de la liquidación."""
        # Total devengados
        self.total_devengados = (
            self.cesantias_pendientes +
            self.intereses_cesantias +
            self.prima_pendiente +
            self.valor_vacaciones +
            self.valor_indemnizacion +
            self.bonificaciones +
            self.otros_devengados
        )

        # Total deducciones
        self.total_deducciones = (
            self.prestamos_pendientes +
            self.libranzas_pendientes +
            self.otras_deducciones
        )

        # Neto a pagar
        self.neto_pagar = self.total_devengados - self.total_deducciones

    def calcular_liquidacion_completa(self):
        """Ejecuta todos los cálculos de liquidación."""
        self.calcular_cesantias()
        self.calcular_intereses_cesantias()
        self.calcular_prima()
        self.calcular_vacaciones()
        self.calcular_indemnizacion()
        self.calcular_totales()

        self.save()

    def aprobar(self, usuario):
        """Aprueba la liquidación final."""
        self.aprobado_por = usuario
        self.fecha_aprobacion = timezone.now()
        self.save(update_fields=['aprobado_por', 'fecha_aprobacion'])

    def clean(self):
        """Validaciones del modelo."""
        # Validar fechas
        if self.fecha_ingreso and self.fecha_retiro:
            if self.fecha_retiro < self.fecha_ingreso:
                raise ValidationError({
                    'fecha_retiro': 'La fecha de retiro no puede ser anterior a la fecha de ingreso.'
                })

        # Validar que neto a pagar no sea negativo
        if self.neto_pagar < 0:
            raise ValidationError({
                'neto_pagar': 'El neto a pagar no puede ser negativo. Revisar deducciones.'
            })


# =============================================================================
# CERTIFICADO DE TRABAJO - Art. 57 y 62 CST
# =============================================================================

TIPO_CERTIFICADO_CHOICES = [
    ('laboral', 'Certificado Laboral'),
    ('ingresos', 'Certificado de Ingresos y Retenciones'),
    ('cargo', 'Certificado de Cargo y Funciones'),
]

ESTADO_CERTIFICADO_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('generado', 'Generado'),
    ('entregado', 'Entregado'),
]


class CertificadoTrabajo(BaseCompanyModel):
    """
    Certificado de Trabajo según Art. 57 numeral 7 y Art. 62 CST.

    El empleador está obligado a expedir certificaciones laborales
    al trabajador que lo solicite, indicando: tiempo de servicio,
    índole de la labor y salario devengado.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='certificados_trabajo',
        verbose_name='Colaborador',
        help_text='Colaborador que solicita el certificado'
    )
    tipo_certificado = models.CharField(
        max_length=20,
        choices=TIPO_CERTIFICADO_CHOICES,
        default='laboral',
        db_index=True,
        verbose_name='Tipo de Certificado',
        help_text='Tipo de certificado a generar'
    )
    fecha_solicitud = models.DateField(
        auto_now_add=True,
        verbose_name='Fecha de Solicitud',
        help_text='Fecha en que se solicita el certificado'
    )
    fecha_expedicion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Expedición',
        help_text='Fecha en que se expide el certificado'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CERTIFICADO_CHOICES,
        default='pendiente',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado del certificado'
    )

    # Información a incluir en el certificado
    incluir_cargo = models.BooleanField(
        default=True,
        verbose_name='Incluir Cargo',
        help_text='Incluir el cargo desempeñado en el certificado'
    )
    incluir_salario = models.BooleanField(
        default=False,
        verbose_name='Incluir Salario',
        help_text='Incluir el salario actual en el certificado'
    )
    incluir_funciones = models.BooleanField(
        default=False,
        verbose_name='Incluir Funciones',
        help_text='Incluir las funciones principales del cargo'
    )
    informacion_adicional = models.TextField(
        blank=True,
        verbose_name='Información Adicional',
        help_text='Información adicional a incluir en el certificado'
    )

    # Documento generado
    documento_generado = models.FileField(
        upload_to='talent_hub/certificados_trabajo/',
        null=True,
        blank=True,
        verbose_name='Documento Generado',
        help_text='Archivo PDF del certificado generado'
    )
    generado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificados_generados',
        verbose_name='Generado Por',
        help_text='Usuario que generó el certificado'
    )
    dirigido_a = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Dirigido A',
        help_text='A quién va dirigido el certificado (opcional)'
    )

    class Meta:
        db_table = 'talent_hub_certificado_trabajo'
        verbose_name = 'Certificado de Trabajo'
        verbose_name_plural = 'Certificados de Trabajo'
        ordering = ['-fecha_solicitud']
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['estado']),
            models.Index(fields=['tipo_certificado']),
        ]

    def __str__(self):
        return f"Certificado {self.get_tipo_certificado_display()} - {self.colaborador}"
