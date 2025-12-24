"""
Modelos para Gestión de Calidad
Sistema de No Conformidades, Salidas No Conformes y Control de Cambios
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class NoConformidad(models.Model):
    """
    No Conformidades detectadas en el sistema de gestión
    Origen: auditorías, inspecciones, quejas de clientes, procesos internos
    """
    # Multi-tenant
    empresa_id = models.PositiveBigIntegerField(db_index=True)

    TIPO_CHOICES = [
        ('REAL', 'No Conformidad Real'),
        ('POTENCIAL', 'No Conformidad Potencial'),
        ('OBSERVACION', 'Observación'),
    ]

    ORIGEN_CHOICES = [
        ('AUDITORIA_INTERNA', 'Auditoría Interna'),
        ('AUDITORIA_EXTERNA', 'Auditoría Externa'),
        ('AUDITORIA_CLIENTE', 'Auditoría de Cliente'),
        ('INSPECCION', 'Inspección'),
        ('QUEJA_CLIENTE', 'Queja de Cliente'),
        ('QUEJA_PROVEEDOR', 'Queja de Proveedor'),
        ('PROCESO_INTERNO', 'Proceso Interno'),
        ('PRODUCTO_NO_CONFORME', 'Producto No Conforme'),
        ('REVISION_DIRECCION', 'Revisión por la Dirección'),
        ('MEJORA_CONTINUA', 'Iniciativa de Mejora Continua'),
    ]

    ESTADO_CHOICES = [
        ('ABIERTA', 'Abierta'),
        ('EN_ANALISIS', 'En Análisis de Causa'),
        ('EN_TRATAMIENTO', 'En Tratamiento'),
        ('VERIFICACION', 'En Verificación'),
        ('CERRADA', 'Cerrada'),
        ('CANCELADA', 'Cancelada'),
    ]

    SEVERIDAD_CHOICES = [
        ('CRITICA', 'Crítica'),
        ('MAYOR', 'Mayor'),
        ('MENOR', 'Menor'),
        ('OBSERVACION', 'Observación'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único de la NC (ej: NC-2024-001)"
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='REAL')
    origen = models.CharField(max_length=30, choices=ORIGEN_CHOICES)
    severidad = models.CharField(max_length=15, choices=SEVERIDAD_CHOICES, default='MENOR')

    # Descripción
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(
        help_text="Descripción detallada de la no conformidad"
    )
    fecha_deteccion = models.DateField()
    ubicacion = models.CharField(
        max_length=255,
        blank=True,
        help_text="Área, proceso o ubicación donde se detectó"
    )

    # Relaciones
    proceso_relacionado = models.CharField(
        max_length=255,
        blank=True,
        help_text="Proceso del sistema de gestión afectado"
    )
    requisito_incumplido = models.TextField(
        blank=True,
        help_text="Requisito de la norma o procedimiento incumplido"
    )

    # Análisis de causa
    analisis_causa_raiz = models.TextField(
        blank=True,
        help_text="Análisis de causa raíz (5 Por qués, Ishikawa, etc.)"
    )
    metodo_analisis = models.CharField(
        max_length=50,
        blank=True,
        choices=[
            ('5_PORQUES', '5 Por qués'),
            ('ISHIKAWA', 'Diagrama Ishikawa'),
            ('PARETO', 'Análisis de Pareto'),
            ('OTRO', 'Otro método'),
        ]
    )

    # Responsables
    detectado_por = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='no_conformidades_detectadas',
        help_text="Usuario que detectó la NC"
    )
    responsable_analisis = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nc_analisis_asignadas',
        help_text="Responsable de analizar la causa"
    )
    responsable_cierre = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nc_cierres_asignados',
        help_text="Responsable de verificar y cerrar"
    )

    # Estado y seguimiento
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ABIERTA')
    fecha_analisis = models.DateField(null=True, blank=True)
    fecha_verificacion = models.DateField(null=True, blank=True)
    fecha_cierre = models.DateField(null=True, blank=True)

    # Verificación de eficacia
    verificacion_eficaz = models.BooleanField(
        null=True,
        blank=True,
        help_text="¿Las acciones fueron eficaces?"
    )
    comentarios_verificacion = models.TextField(blank=True)

    # Evidencias
    evidencia_deteccion = models.FileField(
        upload_to='calidad/nc/evidencias/%Y/%m/',
        null=True,
        blank=True
    )
    evidencia_cierre = models.FileField(
        upload_to='calidad/nc/cierres/%Y/%m/',
        null=True,
        blank=True
    )

    # Metadata
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'calidad_no_conformidad'
        verbose_name = 'No Conformidad'
        verbose_name_plural = 'No Conformidades'
        ordering = ['-fecha_deteccion', '-id']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'origen']),
            models.Index(fields=['codigo']),
            models.Index(fields=['fecha_deteccion']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.titulo}"

    def puede_cerrar(self):
        """Verificar si la NC puede cerrarse"""
        # Debe tener al menos una acción correctiva verificada
        return (
            self.estado == 'VERIFICACION' and
            self.acciones_correctivas.filter(
                estado='VERIFICADA',
                eficaz=True
            ).exists()
        )

    def calcular_dias_abierta(self):
        """Calcular días que lleva abierta"""
        from django.utils import timezone
        if self.fecha_cierre:
            return (self.fecha_cierre - self.fecha_deteccion).days
        return (timezone.now().date() - self.fecha_deteccion).days


class AccionCorrectiva(models.Model):
    """
    Acciones Correctivas, Preventivas o de Mejora
    Vinculadas a No Conformidades
    """
    # Multi-tenant
    empresa_id = models.PositiveBigIntegerField(db_index=True)

    TIPO_CHOICES = [
        ('CORRECTIVA', 'Acción Correctiva'),
        ('PREVENTIVA', 'Acción Preventiva'),
        ('MEJORA', 'Acción de Mejora'),
        ('CONTENCION', 'Acción de Contención'),
    ]

    ESTADO_CHOICES = [
        ('PLANIFICADA', 'Planificada'),
        ('EN_EJECUCION', 'En Ejecución'),
        ('EJECUTADA', 'Ejecutada'),
        ('VERIFICADA', 'Verificada'),
        ('CERRADA', 'Cerrada'),
        ('CANCELADA', 'Cancelada'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único de la acción (ej: AC-2024-001)"
    )
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES)

    # Relación con NC
    no_conformidad = models.ForeignKey(
        NoConformidad,
        on_delete=models.CASCADE,
        related_name='acciones_correctivas'
    )

    # Descripción
    descripcion = models.TextField(help_text="Descripción de la acción a tomar")
    objetivo = models.TextField(
        blank=True,
        help_text="Objetivo esperado de la acción"
    )

    # Planificación
    fecha_planificada = models.DateField(help_text="Fecha planificada de implementación")
    fecha_limite = models.DateField(help_text="Fecha límite de implementación")
    recursos_necesarios = models.TextField(
        blank=True,
        help_text="Recursos humanos, técnicos o financieros necesarios"
    )

    # Responsabilidad
    responsable = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='acciones_correctivas_responsable',
        help_text="Responsable de ejecutar la acción"
    )
    verificador = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acciones_verificar',
        help_text="Responsable de verificar la eficacia"
    )

    # Ejecución
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PLANIFICADA')
    fecha_ejecucion = models.DateField(null=True, blank=True)
    evidencia_ejecucion = models.FileField(
        upload_to='calidad/acciones/evidencias/%Y/%m/',
        null=True,
        blank=True
    )
    comentarios_ejecucion = models.TextField(blank=True)

    # Verificación de eficacia
    fecha_verificacion = models.DateField(null=True, blank=True)
    eficaz = models.BooleanField(
        null=True,
        blank=True,
        help_text="¿La acción fue eficaz?"
    )
    metodo_verificacion = models.TextField(
        blank=True,
        help_text="Método utilizado para verificar la eficacia"
    )
    resultados_verificacion = models.TextField(blank=True)
    evidencia_verificacion = models.FileField(
        upload_to='calidad/acciones/verificaciones/%Y/%m/',
        null=True,
        blank=True
    )

    # Costos
    costo_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    costo_real = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))]
    )

    class Meta:
        db_table = 'calidad_accion_correctiva'
        verbose_name = 'Acción Correctiva'
        verbose_name_plural = 'Acciones Correctivas'
        ordering = ['-fecha_planificada', '-id']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['no_conformidad', 'estado']),
            models.Index(fields=['responsable', 'estado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.get_tipo_display()}"

    def esta_vencida(self):
        """Verificar si la acción está vencida"""
        from django.utils import timezone
        return (
            self.estado not in ['VERIFICADA', 'CERRADA', 'CANCELADA'] and
            self.fecha_limite < timezone.now().date()
        )


class SalidaNoConforme(models.Model):
    """
    Productos o Servicios No Conformes
    Control de salidas que no cumplen requisitos
    """
    # Multi-tenant
    empresa_id = models.PositiveBigIntegerField(db_index=True)

    TIPO_CHOICES = [
        ('PRODUCTO', 'Producto'),
        ('SERVICIO', 'Servicio'),
        ('MATERIA_PRIMA', 'Materia Prima'),
        ('PROCESO', 'Proceso'),
    ]

    ESTADO_CHOICES = [
        ('DETECTADA', 'Detectada'),
        ('EN_EVALUACION', 'En Evaluación'),
        ('DISPOSICION_DEFINIDA', 'Disposición Definida'),
        ('EN_TRATAMIENTO', 'En Tratamiento'),
        ('RESUELTA', 'Resuelta'),
        ('CERRADA', 'Cerrada'),
    ]

    DISPOSICION_CHOICES = [
        ('REPROCESO', 'Reproceso'),
        ('REPARACION', 'Reparación'),
        ('ACEPTACION_CONCESION', 'Aceptación con Concesión'),
        ('RECLASIFICACION', 'Reclasificación'),
        ('RECHAZO', 'Rechazo/Devolución'),
        ('DESECHO', 'Desecho/Destrucción'),
        ('CUARENTENA', 'Cuarentena'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único de la salida NC (ej: SNC-2024-001)"
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)

    # Descripción
    descripcion_producto = models.CharField(
        max_length=255,
        help_text="Producto o servicio afectado"
    )
    descripcion_no_conformidad = models.TextField(
        help_text="Descripción de la no conformidad detectada"
    )
    fecha_deteccion = models.DateField()

    # Identificación del producto/lote
    lote_numero = models.CharField(
        max_length=100,
        blank=True,
        help_text="Número de lote o serie"
    )
    cantidad_afectada = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))],
        help_text="Cantidad afectada"
    )
    unidad_medida = models.CharField(
        max_length=20,
        help_text="Kg, unidades, litros, etc."
    )

    # Ubicación y estado
    ubicacion_actual = models.CharField(
        max_length=255,
        help_text="Dónde se encuentra actualmente"
    )
    bloqueada = models.BooleanField(
        default=True,
        help_text="¿Está bloqueada para uso/venta?"
    )

    # Evaluación
    requisito_incumplido = models.TextField(
        help_text="Requisito o especificación incumplida"
    )
    impacto_cliente = models.TextField(
        blank=True,
        help_text="Impacto potencial en el cliente"
    )
    riesgo_uso = models.CharField(
        max_length=10,
        choices=[
            ('ALTO', 'Alto'),
            ('MEDIO', 'Medio'),
            ('BAJO', 'Bajo'),
        ],
        default='MEDIO'
    )

    # Responsables
    detectado_por = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='salidas_nc_detectadas'
    )
    responsable_evaluacion = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='salidas_nc_evaluar'
    )
    responsable_disposicion = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='salidas_nc_disponer'
    )

    # Disposición
    disposicion = models.CharField(
        max_length=30,
        choices=DISPOSICION_CHOICES,
        blank=True
    )
    justificacion_disposicion = models.TextField(
        blank=True,
        help_text="Justificación de la disposición elegida"
    )
    fecha_disposicion = models.DateField(null=True, blank=True)

    # Tratamiento
    acciones_tomadas = models.TextField(
        blank=True,
        help_text="Acciones realizadas para tratar la salida NC"
    )
    fecha_resolucion = models.DateField(null=True, blank=True)

    # Costos
    costo_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Costo estimado del tratamiento"
    )

    # Estado
    estado = models.CharField(max_length=25, choices=ESTADO_CHOICES, default='DETECTADA')

    # NC asociada
    no_conformidad = models.ForeignKey(
        NoConformidad,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='salidas_no_conformes',
        help_text="NC generada por esta salida no conforme"
    )

    # Evidencias
    evidencia_deteccion = models.FileField(
        upload_to='calidad/salidas_nc/evidencias/%Y/%m/',
        null=True,
        blank=True
    )
    evidencia_tratamiento = models.FileField(
        upload_to='calidad/salidas_nc/tratamientos/%Y/%m/',
        null=True,
        blank=True
    )

    # Metadata
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'calidad_salida_no_conforme'
        verbose_name = 'Salida No Conforme'
        verbose_name_plural = 'Salidas No Conformes'
        ordering = ['-fecha_deteccion', '-id']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'bloqueada']),
            models.Index(fields=['lote_numero']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.descripcion_producto}"

    def puede_liberar(self):
        """Verificar si puede liberarse del bloqueo"""
        return self.bloqueada and self.estado == 'RESUELTA'


class SolicitudCambio(models.Model):
    """
    Solicitudes de Cambio en el Sistema de Gestión
    Control de cambios planificados
    """
    # Multi-tenant
    empresa_id = models.PositiveBigIntegerField(db_index=True)

    TIPO_CHOICES = [
        ('PROCESO', 'Proceso'),
        ('PROCEDIMIENTO', 'Procedimiento'),
        ('DOCUMENTO', 'Documento'),
        ('PRODUCTO', 'Producto/Servicio'),
        ('INFRAESTRUCTURA', 'Infraestructura'),
        ('EQUIPAMIENTO', 'Equipamiento'),
        ('SISTEMA', 'Sistema de Gestión'),
        ('ORGANIZACIONAL', 'Cambio Organizacional'),
    ]

    ESTADO_CHOICES = [
        ('SOLICITADA', 'Solicitada'),
        ('EN_REVISION', 'En Revisión'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
        ('EN_IMPLEMENTACION', 'En Implementación'),
        ('IMPLEMENTADA', 'Implementada'),
        ('CANCELADA', 'Cancelada'),
    ]

    PRIORIDAD_CHOICES = [
        ('URGENTE', 'Urgente'),
        ('ALTA', 'Alta'),
        ('MEDIA', 'Media'),
        ('BAJA', 'Baja'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único de la solicitud (ej: SC-2024-001)"
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='MEDIA')

    # Descripción del cambio
    titulo = models.CharField(max_length=255)
    descripcion_actual = models.TextField(
        help_text="Descripción de la situación actual"
    )
    descripcion_cambio = models.TextField(
        help_text="Descripción del cambio propuesto"
    )
    justificacion = models.TextField(
        help_text="Justificación del cambio"
    )

    # Solicitante
    solicitante = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='cambios_solicitados'
    )
    fecha_solicitud = models.DateField(auto_now_add=True)

    # Análisis de impacto
    impacto_calidad = models.TextField(
        blank=True,
        help_text="Impacto en la calidad del producto/servicio"
    )
    impacto_procesos = models.TextField(
        blank=True,
        help_text="Procesos afectados"
    )
    impacto_clientes = models.TextField(
        blank=True,
        help_text="Impacto en clientes"
    )
    impacto_cumplimiento = models.TextField(
        blank=True,
        help_text="Impacto en requisitos legales/normativos"
    )
    impacto_recursos = models.TextField(
        blank=True,
        help_text="Recursos necesarios (humanos, técnicos, financieros)"
    )

    # Evaluación de riesgos
    riesgos_identificados = models.TextField(
        blank=True,
        help_text="Riesgos asociados al cambio"
    )
    medidas_mitigacion = models.TextField(
        blank=True,
        help_text="Medidas para mitigar los riesgos"
    )

    # Revisión y aprobación
    revisado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cambios_revisados'
    )
    fecha_revision = models.DateField(null=True, blank=True)
    comentarios_revision = models.TextField(blank=True)

    aprobado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cambios_aprobados'
    )
    fecha_aprobacion = models.DateField(null=True, blank=True)
    comentarios_aprobacion = models.TextField(blank=True)

    # Implementación
    responsable_implementacion = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cambios_implementar'
    )
    fecha_implementacion_planificada = models.DateField(null=True, blank=True)
    fecha_implementacion_real = models.DateField(null=True, blank=True)

    # Estado
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='SOLICITADA')

    # Costos
    costo_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Documentos
    documento_soporte = models.FileField(
        upload_to='calidad/solicitudes_cambio/%Y/%m/',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'calidad_solicitud_cambio'
        verbose_name = 'Solicitud de Cambio'
        verbose_name_plural = 'Solicitudes de Cambio'
        ordering = ['-fecha_solicitud', '-id']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'prioridad']),
            models.Index(fields=['solicitante', 'estado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.titulo}"


class ControlCambio(models.Model):
    """
    Registro de Cambios Implementados
    Trazabilidad de cambios en el sistema de gestión
    """
    # Multi-tenant
    empresa_id = models.PositiveBigIntegerField(db_index=True)

    # Relación con solicitud
    solicitud_cambio = models.OneToOneField(
        SolicitudCambio,
        on_delete=models.PROTECT,
        related_name='control',
        help_text="Solicitud de cambio asociada"
    )

    # Implementación
    fecha_inicio_implementacion = models.DateField()
    fecha_fin_implementacion = models.DateField()

    # Acciones realizadas
    acciones_realizadas = models.TextField(
        help_text="Descripción de las acciones de implementación"
    )

    # Comunicación
    personal_comunicado = models.TextField(
        help_text="Personal al que se comunicó el cambio"
    )
    fecha_comunicacion = models.DateField()
    metodo_comunicacion = models.CharField(
        max_length=100,
        help_text="Reunión, email, capacitación, etc."
    )

    # Capacitación
    capacitacion_realizada = models.BooleanField(default=False)
    descripcion_capacitacion = models.TextField(blank=True)
    personal_capacitado = models.TextField(blank=True)

    # Documentación actualizada
    documentos_actualizados = models.TextField(
        help_text="Lista de documentos actualizados por el cambio"
    )
    nueva_version = models.CharField(
        max_length=20,
        blank=True,
        help_text="Nueva versión de documentos"
    )

    # Verificación
    verificacion_realizada = models.BooleanField(default=False)
    fecha_verificacion = models.DateField(null=True, blank=True)
    resultados_verificacion = models.TextField(
        blank=True,
        help_text="Resultados de la verificación del cambio"
    )
    eficaz = models.BooleanField(
        null=True,
        blank=True,
        help_text="¿El cambio fue eficaz?"
    )

    # Seguimiento
    seguimiento_planificado = models.BooleanField(
        default=False,
        help_text="¿Requiere seguimiento posterior?"
    )
    proxima_revision = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de próxima revisión del cambio"
    )

    # Costos reales
    costo_real = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Evidencias
    evidencia_implementacion = models.FileField(
        upload_to='calidad/control_cambios/evidencias/%Y/%m/',
        null=True,
        blank=True
    )
    registro_capacitacion = models.FileField(
        upload_to='calidad/control_cambios/capacitaciones/%Y/%m/',
        null=True,
        blank=True
    )

    # Lecciones aprendidas
    lecciones_aprendidas = models.TextField(
        blank=True,
        help_text="Lecciones aprendidas durante la implementación"
    )

    # Metadata
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'calidad_control_cambio'
        verbose_name = 'Control de Cambio'
        verbose_name_plural = 'Controles de Cambios'
        ordering = ['-fecha_fin_implementacion', '-id']
        indexes = [
            models.Index(fields=['empresa_id', 'fecha_fin_implementacion']),
            models.Index(fields=['solicitud_cambio']),
        ]

    def __str__(self):
        return f"Control - {self.solicitud_cambio.codigo}"
