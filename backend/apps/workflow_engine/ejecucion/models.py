"""
Modelos para ejecucion - workflow_engine

Sistema de ejecución de workflows (BPM) que gestiona:
- Instancias de flujos de trabajo
- Tareas activas y asignaciones
- Historial de transiciones
- Archivos adjuntos
- Notificaciones de flujo

Integrado con:
- disenador_flujos: PlantillaFlujo, NodoFlujo, ConexionFlujo
- core: User para asignaciones y auditoría
- monitoreo: AlertaFlujo, MetricaFlujo para análisis
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone

User = get_user_model()


class InstanciaFlujo(models.Model):
    """
    Instancia de ejecución de un flujo de trabajo (workflow instance)

    Representa una ejecución específica de una PlantillaFlujo.
    Ejemplo: "Solicitud de Compra #SC-2025-0042"

    Estados del ciclo de vida:
    - INICIADO: Flujo creado, esperando primera acción
    - EN_PROCESO: Flujo activo con tareas en curso
    - PAUSADO: Flujo temporalmente detenido (por usuario o sistema)
    - COMPLETADO: Flujo terminado exitosamente
    - CANCELADO: Flujo cancelado por usuario o error crítico

    Campos clave:
    - plantilla: Referencia a la definición del flujo
    - nodo_actual: Estado actual en el que se encuentra
    - entidad_relacionada: Objeto de negocio asociado (genérico)
    - data_contexto: JSON con datos del proceso
    - prioridad: Para ordenamiento de tareas
    """

    ESTADO_CHOICES = [
        ('INICIADO', 'Iniciado'),
        ('EN_PROCESO', 'En Proceso'),
        ('PAUSADO', 'Pausado'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]

    PRIORIDAD_CHOICES = [
        ('BAJA', 'Baja'),
        ('NORMAL', 'Normal'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ]

    # ============ IDENTIFICACIÓN ============
    codigo_instancia = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código de instancia',
        help_text='Código único de la instancia (ej: WF-SC-2025-0042)'
    )

    titulo = models.CharField(
        max_length=255,
        verbose_name='Título',
        help_text='Título descriptivo de la instancia (ej: Solicitud de Compra - Materiales Limpieza)'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de la instancia'
    )

    # ============ RELACIÓN CON PLANTILLA ============
    plantilla = models.ForeignKey(
        'disenador_flujos.PlantillaFlujo',
        on_delete=models.PROTECT,
        related_name='instancias',
        db_index=True,
        verbose_name='Plantilla de flujo',
        help_text='Plantilla base de este flujo'
    )

    nodo_actual = models.ForeignKey(
        'disenador_flujos.NodoFlujo',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='instancias_en_nodo',
        verbose_name='Nodo actual',
        help_text='Nodo/estado actual en el que se encuentra la instancia'
    )

    # ============ ESTADO Y PRIORIDAD ============
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CHOICES,
        default='INICIADO',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado actual de la instancia'
    )

    prioridad = models.CharField(
        max_length=10,
        choices=PRIORIDAD_CHOICES,
        default='NORMAL',
        db_index=True,
        verbose_name='Prioridad',
        help_text='Prioridad de la instancia'
    )

    # ============ ENTIDAD RELACIONADA (Polimórfica) ============
    entidad_tipo = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        verbose_name='Tipo de entidad',
        help_text='Tipo de objeto relacionado (ej: recoleccion, recepcion, no_conformidad)'
    )

    entidad_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID de entidad',
        help_text='ID del objeto relacionado'
    )

    # ============ DATOS DE CONTEXTO ============
    data_contexto = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Datos de contexto',
        help_text='Datos variables del flujo (formularios, aprobaciones, etc.)'
    )

    variables_flujo = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Variables de flujo',
        help_text='Variables personalizadas del flujo (contadores, banderas, etc.)'
    )

    # ============ FECHAS Y TIEMPOS ============
    fecha_inicio = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha de inicio',
        help_text='Fecha en que se inició la instancia'
    )

    fecha_fin = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de finalización',
        help_text='Fecha en que se completó o canceló la instancia'
    )

    fecha_limite = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='Fecha límite',
        help_text='Fecha límite para completar el flujo (SLA)'
    )

    tiempo_total_horas = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Tiempo total (horas)',
        help_text='Tiempo total desde inicio hasta fin (calculado automáticamente)'
    )

    # ============ PARTICIPANTES ============
    iniciado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='instancias_iniciadas',
        verbose_name='Iniciado por',
        help_text='Usuario que inició la instancia'
    )

    responsable_actual = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='instancias_responsable',
        db_index=True,
        verbose_name='Responsable actual',
        help_text='Usuario responsable actual de la tarea activa'
    )

    finalizado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='instancias_finalizadas',
        verbose_name='Finalizado por',
        help_text='Usuario que completó o canceló la instancia'
    )

    # ============ MOTIVOS Y OBSERVACIONES ============
    motivo_cancelacion = models.TextField(
        blank=True,
        verbose_name='Motivo de cancelación',
        help_text='Razón por la cual se canceló la instancia'
    )

    motivo_pausa = models.TextField(
        blank=True,
        verbose_name='Motivo de pausa',
        help_text='Razón por la cual se pausó la instancia'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones generales',
        help_text='Notas adicionales sobre la instancia'
    )

    # ============ MULTI-TENANCY Y AUDITORÍA ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenancy)'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'workflow_exec_instancia_flujo'
        verbose_name = 'Instancia de flujo'
        verbose_name_plural = 'Instancias de flujo'
        ordering = ['-fecha_inicio', '-prioridad']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'plantilla']),
            models.Index(fields=['entidad_tipo', 'entidad_id']),
            models.Index(fields=['responsable_actual', 'estado']),
            models.Index(fields=['fecha_limite']),
        ]

    def __str__(self):
        return f"{self.codigo_instancia} - {self.titulo}"

    def clean(self):
        """Validaciones del modelo"""
        super().clean()

        # Validar que nodo_actual pertenece a la plantilla
        if self.nodo_actual and self.plantilla:
            if self.nodo_actual.plantilla_id != self.plantilla_id:
                raise ValidationError({
                    'nodo_actual': 'El nodo actual debe pertenecer a la plantilla del flujo'
                })

        # Si está completado o cancelado, debe tener fecha_fin
        if self.estado in ['COMPLETADO', 'CANCELADO'] and not self.fecha_fin:
            self.fecha_fin = timezone.now()

        # Si está cancelado, debe tener motivo
        if self.estado == 'CANCELADO' and not self.motivo_cancelacion:
            raise ValidationError({
                'motivo_cancelacion': 'Debe indicar el motivo de cancelación'
            })

    def save(self, *args, **kwargs):
        # Auto-calcular tiempo total si está finalizado
        if self.fecha_fin and self.fecha_inicio:
            delta = self.fecha_fin - self.fecha_inicio
            self.tiempo_total_horas = round(delta.total_seconds() / 3600, 2)

        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def esta_vencida(self):
        """Verifica si la instancia está vencida según fecha_limite"""
        if not self.fecha_limite:
            return False

        if self.estado in ['COMPLETADO', 'CANCELADO']:
            return False

        return timezone.now() > self.fecha_limite

    @property
    def progreso_porcentaje(self):
        """Calcula el progreso aproximado basado en tareas completadas"""
        tareas_totales = self.tareas.count()
        if tareas_totales == 0:
            return 0

        tareas_completadas = self.tareas.filter(estado='COMPLETADA').count()
        return round((tareas_completadas / tareas_totales) * 100, 2)


class TareaActiva(models.Model):
    """
    Tarea activa en una instancia de flujo (active task)

    Representa una acción pendiente en un nodo del flujo.
    Ejemplo: "Aprobar Solicitud de Compra", "Revisar Documento", "Firmar Contrato"

    Estados:
    - PENDIENTE: Tarea creada, esperando asignación o inicio
    - EN_PROGRESO: Usuario trabajando en la tarea
    - COMPLETADA: Tarea finalizada exitosamente
    - RECHAZADA: Tarea rechazada (flujo retrocede)
    - ESCALADA: Tarea escalada por vencimiento o excepción

    Campos clave:
    - instancia: Instancia de flujo padre
    - nodo: Nodo del flujo que genera esta tarea
    - asignado_a: Usuario responsable
    - formulario_data: Datos capturados en formularios
    - fecha_vencimiento: Para SLA y alertas
    """

    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROGRESO', 'En Progreso'),
        ('COMPLETADA', 'Completada'),
        ('RECHAZADA', 'Rechazada'),
        ('ESCALADA', 'Escalada'),
    ]

    TIPO_TAREA_CHOICES = [
        ('APROBACION', 'Aprobación'),
        ('REVISION', 'Revisión'),
        ('FORMULARIO', 'Formulario'),
        ('NOTIFICACION', 'Notificación'),
        ('FIRMA', 'Firma'),
        ('SISTEMA', 'Sistema'),
    ]

    # ============ RELACIÓN CON INSTANCIA ============
    instancia = models.ForeignKey(
        InstanciaFlujo,
        on_delete=models.CASCADE,
        related_name='tareas',
        db_index=True,
        verbose_name='Instancia de flujo',
        help_text='Instancia de flujo a la que pertenece esta tarea'
    )

    nodo = models.ForeignKey(
        'disenador_flujos.NodoFlujo',
        on_delete=models.PROTECT,
        related_name='tareas_generadas',
        verbose_name='Nodo del flujo',
        help_text='Nodo que generó esta tarea'
    )

    # ============ IDENTIFICACIÓN ============
    codigo_tarea = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código de tarea',
        help_text='Código único de la tarea (ej: TK-2025-0042-001)'
    )

    nombre_tarea = models.CharField(
        max_length=255,
        verbose_name='Nombre de la tarea',
        help_text='Nombre descriptivo de la tarea (ej: Aprobar Solicitud)'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de la tarea'
    )

    tipo_tarea = models.CharField(
        max_length=15,
        choices=TIPO_TAREA_CHOICES,
        default='FORMULARIO',
        verbose_name='Tipo de tarea',
        help_text='Tipo de acción requerida'
    )

    # ============ ESTADO ============
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CHOICES,
        default='PENDIENTE',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado actual de la tarea'
    )

    # ============ ASIGNACIÓN ============
    asignado_a = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tareas_asignadas',
        db_index=True,
        verbose_name='Asignado a',
        help_text='Usuario responsable de ejecutar la tarea'
    )

    rol_asignado = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        verbose_name='Rol asignado',
        help_text='Rol al que está asignada la tarea (alternativa a usuario específico)'
    )

    asignado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tareas_asignadas_por',
        verbose_name='Asignado por',
        help_text='Usuario que asignó la tarea'
    )

    # ============ FECHAS Y TIEMPOS ============
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha de creación'
    )

    fecha_inicio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de inicio',
        help_text='Fecha en que el usuario comenzó la tarea'
    )

    fecha_completada = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de completación',
        help_text='Fecha en que se completó la tarea'
    )

    fecha_vencimiento = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='Fecha de vencimiento',
        help_text='Fecha límite para completar la tarea (SLA)'
    )

    tiempo_ejecucion_horas = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Tiempo de ejecución (horas)',
        help_text='Tiempo desde inicio hasta completación (calculado automáticamente)'
    )

    # ============ DATOS DE FORMULARIO ============
    formulario_schema = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Esquema de formulario',
        help_text='Definición del formulario a mostrar (JSON Schema)'
    )

    formulario_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Datos del formulario',
        help_text='Datos capturados en el formulario'
    )

    decision = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Decisión',
        help_text='Decisión tomada (ej: APROBAR, RECHAZAR, DEVOLVER)'
    )

    # ============ ESCALAMIENTO ============
    escalada_a = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tareas_escaladas',
        verbose_name='Escalada a',
        help_text='Usuario al que se escaló la tarea'
    )

    motivo_escalamiento = models.TextField(
        blank=True,
        verbose_name='Motivo de escalamiento',
        help_text='Razón del escalamiento'
    )

    # ============ RECHAZO ============
    motivo_rechazo = models.TextField(
        blank=True,
        verbose_name='Motivo de rechazo',
        help_text='Razón del rechazo de la tarea'
    )

    # ============ OBSERVACIONES ============
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Comentarios del ejecutor de la tarea'
    )

    # ============ MULTI-TENANCY Y AUDITORÍA ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenancy)'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tareas_creadas',
        verbose_name='Creado por',
        help_text='Usuario que creó la tarea (usualmente el sistema)'
    )

    class Meta:
        db_table = 'workflow_exec_tarea_activa'
        verbose_name = 'Tarea activa'
        verbose_name_plural = 'Tareas activas'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['asignado_a', 'estado']),
            models.Index(fields=['instancia', 'estado']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['rol_asignado', 'estado']),
        ]

    def __str__(self):
        return f"{self.codigo_tarea} - {self.nombre_tarea}"

    def clean(self):
        """Validaciones del modelo"""
        super().clean()

        # Validar que nodo pertenece a la plantilla de la instancia
        if self.nodo and self.instancia:
            if self.nodo.plantilla_id != self.instancia.plantilla_id:
                raise ValidationError({
                    'nodo': 'El nodo debe pertenecer a la plantilla de la instancia'
                })

        # Si está completada, debe tener fecha_completada
        if self.estado == 'COMPLETADA' and not self.fecha_completada:
            self.fecha_completada = timezone.now()

        # Si está rechazada, debe tener motivo
        if self.estado == 'RECHAZADA' and not self.motivo_rechazo:
            raise ValidationError({
                'motivo_rechazo': 'Debe indicar el motivo de rechazo'
            })

        # Si está escalada, debe tener escalada_a
        if self.estado == 'ESCALADA' and not self.escalada_a:
            raise ValidationError({
                'escalada_a': 'Debe indicar a quién se escaló la tarea'
            })

    def save(self, *args, **kwargs):
        # Auto-calcular tiempo de ejecución si está completada
        if self.fecha_completada and self.fecha_inicio:
            delta = self.fecha_completada - self.fecha_inicio
            self.tiempo_ejecucion_horas = round(delta.total_seconds() / 3600, 2)

        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def esta_vencida(self):
        """Verifica si la tarea está vencida según fecha_vencimiento"""
        if not self.fecha_vencimiento:
            return False

        if self.estado in ['COMPLETADA', 'RECHAZADA']:
            return False

        return timezone.now() > self.fecha_vencimiento

    @property
    def horas_restantes(self):
        """Calcula las horas restantes hasta el vencimiento"""
        if not self.fecha_vencimiento:
            return None

        if self.estado in ['COMPLETADA', 'RECHAZADA']:
            return None

        delta = self.fecha_vencimiento - timezone.now()
        return round(delta.total_seconds() / 3600, 2)


class HistorialTarea(models.Model):
    """
    Historial de transiciones y cambios en tareas (task history)

    Registra cada cambio de estado, asignación o modificación de una tarea.
    Permite auditoría completa y análisis de tiempos.

    Campos clave:
    - tarea: Tarea de la cual se registra el cambio
    - accion: Tipo de cambio realizado
    - estado_anterior / estado_nuevo: Para cambios de estado
    - usuario: Quien realizó el cambio
    - datos_cambio: JSON con detalles del cambio
    """

    ACCION_CHOICES = [
        ('CREACION', 'Creación'),
        ('ASIGNACION', 'Asignación'),
        ('REASIGNACION', 'Reasignación'),
        ('INICIO', 'Inicio'),
        ('COMPLETACION', 'Completación'),
        ('RECHAZO', 'Rechazo'),
        ('ESCALAMIENTO', 'Escalamiento'),
        ('COMENTARIO', 'Comentario'),
        ('MODIFICACION', 'Modificación'),
        ('CANCELACION', 'Cancelación'),
    ]

    # ============ RELACIÓN CON TAREA ============
    tarea = models.ForeignKey(
        TareaActiva,
        on_delete=models.CASCADE,
        related_name='historial',
        db_index=True,
        verbose_name='Tarea',
        help_text='Tarea a la que pertenece este registro de historial'
    )

    instancia = models.ForeignKey(
        InstanciaFlujo,
        on_delete=models.CASCADE,
        related_name='historial_tareas',
        db_index=True,
        verbose_name='Instancia',
        help_text='Instancia de flujo (denormalizado para consultas rápidas)'
    )

    # ============ ACCIÓN REALIZADA ============
    accion = models.CharField(
        max_length=20,
        choices=ACCION_CHOICES,
        db_index=True,
        verbose_name='Acción',
        help_text='Tipo de acción realizada'
    )

    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada de la acción'
    )

    # ============ ESTADOS (para transiciones) ============
    estado_anterior = models.CharField(
        max_length=15,
        blank=True,
        verbose_name='Estado anterior',
        help_text='Estado antes del cambio'
    )

    estado_nuevo = models.CharField(
        max_length=15,
        blank=True,
        verbose_name='Estado nuevo',
        help_text='Estado después del cambio'
    )

    # ============ ASIGNACIONES (para cambios de asignado_a) ============
    asignado_anterior = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='historial_tareas_anterior',
        verbose_name='Asignado anterior',
        help_text='Usuario asignado antes del cambio'
    )

    asignado_nuevo = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='historial_tareas_nuevo',
        verbose_name='Asignado nuevo',
        help_text='Usuario asignado después del cambio'
    )

    # ============ DATOS DEL CAMBIO ============
    datos_cambio = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Datos del cambio',
        help_text='Datos adicionales del cambio (formularios, campos modificados, etc.)'
    )

    # ============ USUARIO Y FECHA ============
    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='historial_tareas_realizadas',
        verbose_name='Usuario',
        help_text='Usuario que realizó la acción'
    )

    fecha_accion = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha de acción',
        help_text='Fecha y hora de la acción'
    )

    # ============ OBSERVACIONES ============
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Comentarios adicionales sobre la acción'
    )

    # ============ MULTI-TENANCY ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenancy)'
    )

    class Meta:
        db_table = 'workflow_exec_historial_tarea'
        verbose_name = 'Historial de tarea'
        verbose_name_plural = 'Historial de tareas'
        ordering = ['-fecha_accion']
        indexes = [
            models.Index(fields=['empresa_id', 'tarea']),
            models.Index(fields=['instancia', 'fecha_accion']),
            models.Index(fields=['accion', 'fecha_accion']),
            models.Index(fields=['usuario', 'fecha_accion']),
        ]

    def __str__(self):
        return f"{self.tarea.codigo_tarea} - {self.get_accion_display()} - {self.fecha_accion}"


class ArchivoAdjunto(models.Model):
    """
    Archivos adjuntos a tareas o instancias de flujo (file attachments)

    Permite adjuntar documentos, imágenes u otros archivos a:
    - Instancias de flujo (documentos generales)
    - Tareas específicas (evidencias, formularios)

    Ejemplos:
    - Cotizaciones adjuntas a "Solicitud de Compra"
    - Evidencia fotográfica en "Inspección de Calidad"
    - Documentos firmados en "Aprobación de Contrato"

    Campos clave:
    - instancia / tarea: Relación polimórfica
    - archivo: FileField para el archivo
    - tipo_archivo: Categorización del archivo
    - subido_por: Usuario que subió el archivo
    """

    TIPO_ARCHIVO_CHOICES = [
        ('FORMULARIO', 'Formulario'),
        ('EVIDENCIA', 'Evidencia'),
        ('DOCUMENTO', 'Documento'),
        ('IMAGEN', 'Imagen'),
        ('FIRMA', 'Firma'),
        ('OTRO', 'Otro'),
    ]

    # ============ RELACIÓN (puede ser con instancia o tarea) ============
    instancia = models.ForeignKey(
        InstanciaFlujo,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='archivos',
        db_index=True,
        verbose_name='Instancia de flujo',
        help_text='Instancia a la que pertenece el archivo (si aplica)'
    )

    tarea = models.ForeignKey(
        TareaActiva,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='archivos',
        db_index=True,
        verbose_name='Tarea',
        help_text='Tarea a la que pertenece el archivo (si aplica)'
    )

    # ============ INFORMACIÓN DEL ARCHIVO ============
    archivo = models.FileField(
        upload_to='workflow/archivos/%Y/%m/%d/',
        verbose_name='Archivo',
        help_text='Archivo adjunto'
    )

    nombre_original = models.CharField(
        max_length=255,
        verbose_name='Nombre original',
        help_text='Nombre original del archivo'
    )

    tipo_archivo = models.CharField(
        max_length=15,
        choices=TIPO_ARCHIVO_CHOICES,
        default='DOCUMENTO',
        verbose_name='Tipo de archivo',
        help_text='Categoría del archivo'
    )

    mime_type = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Tipo MIME',
        help_text='Tipo MIME del archivo (ej: application/pdf)'
    )

    tamano_bytes = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        verbose_name='Tamaño (bytes)',
        help_text='Tamaño del archivo en bytes'
    )

    # ============ DESCRIPCIÓN ============
    titulo = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Título',
        help_text='Título descriptivo del archivo'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción del archivo'
    )

    # ============ METADATOS ============
    metadatos = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadatos',
        help_text='Metadatos adicionales del archivo'
    )

    # ============ AUDITORÍA ============
    subido_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='archivos_subidos',
        verbose_name='Subido por',
        help_text='Usuario que subió el archivo'
    )

    fecha_subida = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha de subida',
        help_text='Fecha y hora de subida del archivo'
    )

    # ============ MULTI-TENANCY ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenancy)'
    )

    class Meta:
        db_table = 'workflow_exec_archivo_adjunto'
        verbose_name = 'Archivo adjunto'
        verbose_name_plural = 'Archivos adjuntos'
        ordering = ['-fecha_subida']
        indexes = [
            models.Index(fields=['empresa_id', 'instancia']),
            models.Index(fields=['empresa_id', 'tarea']),
            models.Index(fields=['tipo_archivo']),
            models.Index(fields=['subido_por', 'fecha_subida']),
        ]

    def __str__(self):
        return f"{self.nombre_original} - {self.get_tipo_archivo_display()}"

    def clean(self):
        """Validaciones del modelo"""
        super().clean()

        # Debe estar asociado a instancia O tarea (no a ambos ni a ninguno)
        if not self.instancia and not self.tarea:
            raise ValidationError('El archivo debe estar asociado a una instancia o tarea')

        if self.instancia and self.tarea:
            raise ValidationError('El archivo no puede estar asociado a instancia y tarea simultáneamente')

    @property
    def tamano_legible(self):
        """Convierte el tamaño en bytes a formato legible (KB, MB, GB)"""
        if not self.tamano_bytes:
            return "Desconocido"

        for unidad in ['B', 'KB', 'MB', 'GB', 'TB']:
            if self.tamano_bytes < 1024.0:
                return f"{self.tamano_bytes:.2f} {unidad}"
            self.tamano_bytes /= 1024.0

        return f"{self.tamano_bytes:.2f} PB"


class NotificacionFlujo(models.Model):
    """
    Notificaciones generadas por el workflow (workflow notifications)

    Sistema de notificaciones para informar a usuarios sobre:
    - Tareas asignadas
    - Tareas vencidas
    - Aprobaciones requeridas
    - Cambios de estado
    - Escalamientos

    Soporta múltiples canales:
    - Notificación en aplicación (bandeja de entrada)
    - Email
    - SMS (futuro)
    - Push (futuro)

    Campos clave:
    - destinatario: Usuario que recibirá la notificación
    - tipo_notificacion: Categoría de la notificación
    - instancia / tarea: Contexto de la notificación
    - canales: Lista de canales por los que se envió
    - leida: Estado de lectura
    """

    TIPO_NOTIFICACION_CHOICES = [
        ('TAREA_ASIGNADA', 'Tarea asignada'),
        ('TAREA_VENCIDA', 'Tarea vencida'),
        ('TAREA_COMPLETADA', 'Tarea completada'),
        ('TAREA_RECHAZADA', 'Tarea rechazada'),
        ('TAREA_ESCALADA', 'Tarea escalada'),
        ('FLUJO_INICIADO', 'Flujo iniciado'),
        ('FLUJO_COMPLETADO', 'Flujo completado'),
        ('FLUJO_CANCELADO', 'Flujo cancelado'),
        ('APROBACION_REQUERIDA', 'Aprobación requerida'),
        ('COMENTARIO_NUEVO', 'Nuevo comentario'),
        ('ALERTA', 'Alerta'),
    ]

    PRIORIDAD_CHOICES = [
        ('BAJA', 'Baja'),
        ('NORMAL', 'Normal'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ]

    # ============ DESTINATARIO ============
    destinatario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notificaciones_flujo',
        db_index=True,
        verbose_name='Destinatario',
        help_text='Usuario que recibirá la notificación'
    )

    # ============ CONTEXTO ============
    instancia = models.ForeignKey(
        InstanciaFlujo,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notificaciones',
        db_index=True,
        verbose_name='Instancia',
        help_text='Instancia de flujo relacionada (si aplica)'
    )

    tarea = models.ForeignKey(
        TareaActiva,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notificaciones',
        db_index=True,
        verbose_name='Tarea',
        help_text='Tarea relacionada (si aplica)'
    )

    # ============ TIPO Y CONTENIDO ============
    tipo_notificacion = models.CharField(
        max_length=25,
        choices=TIPO_NOTIFICACION_CHOICES,
        db_index=True,
        verbose_name='Tipo de notificación',
        help_text='Categoría de la notificación'
    )

    titulo = models.CharField(
        max_length=255,
        verbose_name='Título',
        help_text='Título de la notificación'
    )

    mensaje = models.TextField(
        verbose_name='Mensaje',
        help_text='Contenido del mensaje de la notificación'
    )

    prioridad = models.CharField(
        max_length=10,
        choices=PRIORIDAD_CHOICES,
        default='NORMAL',
        verbose_name='Prioridad',
        help_text='Prioridad de la notificación'
    )

    # ============ DATOS ADICIONALES ============
    datos_contexto = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Datos de contexto',
        help_text='Datos adicionales para renderizar la notificación'
    )

    url_accion = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='URL de acción',
        help_text='URL a la que redirigir al hacer clic (ej: /tareas/123)'
    )

    # ============ ESTADO ============
    leida = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name='Leída',
        help_text='Indica si la notificación ha sido leída'
    )

    fecha_lectura = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de lectura',
        help_text='Fecha y hora en que se leyó la notificación'
    )

    # ============ CANALES DE ENVÍO ============
    enviada_app = models.BooleanField(
        default=True,
        verbose_name='Enviada en app',
        help_text='Notificación visible en la aplicación'
    )

    enviada_email = models.BooleanField(
        default=False,
        verbose_name='Enviada por email',
        help_text='Notificación enviada por correo electrónico'
    )

    email_enviado_exitoso = models.BooleanField(
        default=False,
        verbose_name='Email enviado exitoso',
        help_text='Indica si el email se envió correctamente'
    )

    fecha_envio_email = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de envío email',
        help_text='Fecha y hora de envío del email'
    )

    # ============ AUDITORÍA ============
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha de creación',
        help_text='Fecha y hora de creación de la notificación'
    )

    generada_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notificaciones_generadas',
        verbose_name='Generada por',
        help_text='Usuario o sistema que generó la notificación'
    )

    # ============ MULTI-TENANCY ============
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenancy)'
    )

    class Meta:
        db_table = 'workflow_exec_notificacion_flujo'
        verbose_name = 'Notificación de flujo'
        verbose_name_plural = 'Notificaciones de flujo'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['empresa_id', 'destinatario', 'leida']),
            models.Index(fields=['destinatario', 'fecha_creacion']),
            models.Index(fields=['tipo_notificacion']),
            models.Index(fields=['instancia']),
            models.Index(fields=['tarea']),
        ]

    def __str__(self):
        return f"{self.destinatario.email} - {self.titulo}"

    def marcar_como_leida(self):
        """Marca la notificación como leída"""
        if not self.leida:
            self.leida = True
            self.fecha_lectura = timezone.now()
            self.save(update_fields=['leida', 'fecha_lectura'])

    @property
    def tiempo_desde_creacion(self):
        """Calcula el tiempo transcurrido desde la creación"""
        delta = timezone.now() - self.fecha_creacion

        if delta.total_seconds() < 60:
            return "Hace menos de 1 minuto"
        elif delta.total_seconds() < 3600:
            minutos = int(delta.total_seconds() / 60)
            return f"Hace {minutos} minuto{'s' if minutos > 1 else ''}"
        elif delta.total_seconds() < 86400:
            horas = int(delta.total_seconds() / 3600)
            return f"Hace {horas} hora{'s' if horas > 1 else ''}"
        else:
            dias = int(delta.total_seconds() / 86400)
            return f"Hace {dias} día{'s' if dias > 1 else ''}"
