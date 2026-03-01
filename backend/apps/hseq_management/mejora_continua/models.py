"""
Modelos para Mejora Continua - hseq_management
Semana 14: Auditorías internas, hallazgos y evaluación de cumplimiento
"""
from django.db import models
from django.utils import timezone


class ProgramaAuditoria(models.Model):
    """
    Programa anual de auditorías internas.
    Define el cronograma y alcance de auditorías para cada año.
    """
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('APROBADO', 'Aprobado'),
        ('EN_EJECUCION', 'En Ejecución'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]

    empresa_id = models.PositiveBigIntegerField(db_index=True)
    codigo = models.CharField(max_length=50, blank=True)
    nombre = models.CharField(max_length=255)
    año = models.PositiveIntegerField()
    version = models.PositiveIntegerField(default=1)

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR'
    )

    # Alcance y objetivos
    alcance = models.TextField(blank=True)
    objetivos = models.TextField(blank=True)
    criterios_auditoria = models.TextField(
        blank=True,
        help_text="Normas, procedimientos y requisitos contra los cuales se auditará"
    )

    # Normas aplicables
    normas_aplicables = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista de normas: ISO 9001, ISO 14001, ISO 45001, etc."
    )

    # Recursos
    equipo_auditor_interno = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista de auditores internos calificados"
    )
    recursos_necesarios = models.TextField(blank=True)
    presupuesto = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Responsables
    responsable_programa = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='programas_auditoria_responsable'
    )
    aprobado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='programas_auditoria_aprobados'
    )

    # Fechas
    fecha_aprobacion = models.DateField(null=True, blank=True)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)

    # Auditoría de registro
    observaciones = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='programas_auditoria_creados'
    )

    class Meta:
        db_table = 'hseq_programa_auditoria'
        verbose_name = 'Programa de Auditoría'
        verbose_name_plural = 'Programas de Auditoría'
        ordering = ['-año', 'nombre']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['año']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.año})"

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            from utils.consecutivos import auto_generate_codigo
            auto_generate_codigo(self, 'PROGRAMA_AUDITORIA')
        super().save(*args, **kwargs)

    def aprobar(self, usuario):
        """Aprueba el programa de auditoría."""
        self.estado = 'APROBADO'
        self.aprobado_por = usuario
        self.fecha_aprobacion = timezone.now().date()
        self.save()

    def iniciar(self):
        """Inicia la ejecución del programa."""
        if self.estado == 'APROBADO':
            self.estado = 'EN_EJECUCION'
            self.fecha_inicio = timezone.now().date()
            self.save()

    def completar(self):
        """Marca el programa como completado."""
        self.estado = 'COMPLETADO'
        self.fecha_fin = timezone.now().date()
        self.save()

    @property
    def porcentaje_avance(self):
        """Calcula el porcentaje de avance basado en auditorías completadas."""
        total = self.auditorias.count()
        if total == 0:
            return 0
        completadas = self.auditorias.filter(estado='CERRADA').count()
        return round((completadas / total) * 100, 1)


class Auditoria(models.Model):
    """
    Auditoría individual dentro de un programa.
    Puede ser interna o externa, abarcando uno o varios sistemas de gestión.
    """
    TIPO_CHOICES = [
        ('INTERNA', 'Auditoría Interna'),
        ('EXTERNA', 'Auditoría Externa'),
        ('SEGUIMIENTO', 'Auditoría de Seguimiento'),
        ('CERTIFICACION', 'Auditoría de Certificación'),
        ('RENOVACION', 'Auditoría de Renovación'),
        ('CONTROL_INTERNO', 'Control Interno'),
        ('DIAGNOSTICO', 'Diagnóstico'),
        ('PROVEEDOR', 'Auditoría a Proveedor'),
    ]

    NORMA_CHOICES = [
        ('ISO_9001', 'ISO 9001 - Calidad'),
        ('ISO_14001', 'ISO 14001 - Ambiente'),
        ('ISO_45001', 'ISO 45001 - SST'),
        ('ISO_27001', 'ISO 27001 - Seguridad Info'),
        ('DECRETO_1072', 'Decreto 1072 - SG-SST'),
        ('RES_0312', 'Resolución 0312 - Estándares Mínimos'),
        ('RES_40595', 'Resolución 40595 - PESV'),
        ('MULTIPLE', 'Múltiples Normas'),
    ]

    ESTADO_CHOICES = [
        ('PROGRAMADA', 'Programada'),
        ('PLANIFICADA', 'Planificada'),
        ('EN_EJECUCION', 'En Ejecución'),
        ('INFORME_PENDIENTE', 'Informe Pendiente'),
        ('CERRADA', 'Cerrada'),
        ('CANCELADA', 'Cancelada'),
    ]

    empresa_id = models.PositiveBigIntegerField(db_index=True)
    programa = models.ForeignKey(
        ProgramaAuditoria,
        on_delete=models.CASCADE,
        related_name='auditorias'
    )

    codigo = models.CharField(max_length=50, blank=True)
    tipo = models.CharField(max_length=25, choices=TIPO_CHOICES)
    norma_principal = models.CharField(max_length=20, choices=NORMA_CHOICES)
    normas_adicionales = models.JSONField(
        default=list,
        blank=True,
        help_text="Otras normas incluidas en la auditoría"
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PROGRAMADA'
    )

    # Alcance específico
    titulo = models.CharField(max_length=255)
    objetivo = models.TextField()
    alcance = models.TextField()
    criterios = models.TextField(
        blank=True,
        help_text="Criterios específicos de auditoría"
    )
    procesos_auditados = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista de procesos o áreas a auditar"
    )

    # Fechas planificadas
    fecha_planificada_inicio = models.DateField()
    fecha_planificada_fin = models.DateField()

    # Fechas reales
    fecha_real_inicio = models.DateField(null=True, blank=True)
    fecha_real_fin = models.DateField(null=True, blank=True)

    # Equipo auditor
    auditor_lider = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='auditorias_lideradas'
    )
    equipo_auditor = models.ManyToManyField(
        'core.User',
        related_name='auditorias_participadas',
        blank=True
    )

    # Resultados
    resumen_ejecutivo = models.TextField(blank=True)
    fortalezas = models.TextField(blank=True)
    conclusiones = models.TextField(blank=True)
    recomendaciones = models.TextField(blank=True)

    # Métricas
    total_hallazgos = models.PositiveIntegerField(default=0)
    no_conformidades_mayores = models.PositiveIntegerField(default=0)
    no_conformidades_menores = models.PositiveIntegerField(default=0)
    observaciones_count = models.PositiveIntegerField(default=0)
    oportunidades_mejora = models.PositiveIntegerField(default=0)

    # Documentos
    plan_auditoria = models.FileField(
        upload_to='auditorias/planes/',
        blank=True,
        null=True
    )
    lista_verificacion = models.FileField(
        upload_to='auditorias/checklists/',
        blank=True,
        null=True
    )
    informe_auditoria = models.FileField(
        upload_to='auditorias/informes/',
        blank=True,
        null=True
    )

    # Auditoría de registro
    observaciones_internas = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='auditorias_creadas'
    )

    class Meta:
        db_table = 'hseq_auditoria'
        verbose_name = 'Auditoría'
        verbose_name_plural = 'Auditorías'
        ordering = ['-fecha_planificada_inicio']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['programa']),
            models.Index(fields=['tipo']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_planificada_inicio']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.titulo}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            from utils.consecutivos import auto_generate_codigo
            auto_generate_codigo(self, 'AUDITORIA')
        super().save(*args, **kwargs)

    def iniciar(self):
        """Inicia la ejecución de la auditoría."""
        if self.estado in ['PROGRAMADA', 'PLANIFICADA']:
            self.estado = 'EN_EJECUCION'
            self.fecha_real_inicio = timezone.now().date()
            self.save()

    def cerrar(self):
        """Cierra la auditoría."""
        self.estado = 'CERRADA'
        self.fecha_real_fin = timezone.now().date()
        self._actualizar_metricas()
        self.save()

    def _actualizar_metricas(self):
        """Actualiza las métricas basadas en hallazgos."""
        hallazgos = self.hallazgos.all()
        self.total_hallazgos = hallazgos.count()
        self.no_conformidades_mayores = hallazgos.filter(tipo='NO_CONFORMIDAD_MAYOR').count()
        self.no_conformidades_menores = hallazgos.filter(tipo='NO_CONFORMIDAD_MENOR').count()
        self.observaciones_count = hallazgos.filter(tipo='OBSERVACION').count()
        self.oportunidades_mejora = hallazgos.filter(tipo='OPORTUNIDAD_MEJORA').count()


class Hallazgo(models.Model):
    """
    Hallazgo identificado durante una auditoría.
    Puede generar una No Conformidad que requiere acción correctiva.
    """
    TIPO_CHOICES = [
        ('NO_CONFORMIDAD_MAYOR', 'No Conformidad Mayor'),
        ('NO_CONFORMIDAD_MENOR', 'No Conformidad Menor'),
        ('OBSERVACION', 'Observación'),
        ('OPORTUNIDAD_MEJORA', 'Oportunidad de Mejora'),
        ('FORTALEZA', 'Fortaleza'),
    ]

    ESTADO_CHOICES = [
        ('IDENTIFICADO', 'Identificado'),
        ('COMUNICADO', 'Comunicado'),
        ('EN_TRATAMIENTO', 'En Tratamiento'),
        ('VERIFICADO', 'Verificado'),
        ('CERRADO', 'Cerrado'),
    ]

    IMPACTO_CHOICES = [
        ('ALTO', 'Alto'),
        ('MEDIO', 'Medio'),
        ('BAJO', 'Bajo'),
    ]

    empresa_id = models.PositiveBigIntegerField(db_index=True)
    auditoria = models.ForeignKey(
        Auditoria,
        on_delete=models.CASCADE,
        related_name='hallazgos'
    )

    codigo = models.CharField(max_length=50, blank=True)
    tipo = models.CharField(max_length=25, choices=TIPO_CHOICES)
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='IDENTIFICADO'
    )

    # Descripción del hallazgo
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField()
    evidencia = models.TextField(
        help_text="Evidencia objetiva que soporta el hallazgo"
    )
    criterio = models.TextField(
        help_text="Requisito contra el cual se detectó la desviación"
    )

    # Clasificación
    proceso_area = models.CharField(max_length=100, blank=True)
    clausula_norma = models.CharField(
        max_length=50,
        blank=True,
        help_text="Ej: 7.5.1, 8.2.3"
    )
    norma_referencia = models.CharField(max_length=50, blank=True)

    # Impacto y recomendación
    impacto = models.CharField(
        max_length=10,
        choices=IMPACTO_CHOICES,
        blank=True,
        help_text="Nivel de impacto del hallazgo"
    )
    area_impactada = models.CharField(
        max_length=200,
        blank=True,
        help_text="Área específica afectada por el hallazgo"
    )
    recomendacion = models.TextField(
        blank=True,
        help_text="Recomendación de mejora asociada al hallazgo"
    )

    # Responsables
    identificado_por = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='hallazgos_identificados'
    )
    responsable_proceso = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hallazgos_asignados'
    )

    # Fechas
    fecha_deteccion = models.DateField(default=timezone.now)
    fecha_comunicacion = models.DateField(null=True, blank=True)
    fecha_cierre_esperada = models.DateField(null=True, blank=True)
    fecha_cierre_real = models.DateField(null=True, blank=True)

    # Tratamiento
    analisis_causa_raiz = models.TextField(blank=True)
    accion_propuesta = models.TextField(blank=True)

    # Vinculación con No Conformidad del módulo Calidad
    no_conformidad_generada = models.ForeignKey(
        'calidad.NoConformidad',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hallazgos_origen'
    )

    # Verificación de eficacia
    verificacion_eficacia = models.TextField(blank=True)
    es_eficaz = models.BooleanField(null=True, blank=True)
    verificado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hallazgos_verificados'
    )
    fecha_verificacion = models.DateField(null=True, blank=True)

    # Documentos
    archivo_evidencia = models.FileField(
        upload_to='auditorias/hallazgos/evidencias/',
        blank=True,
        null=True
    )

    # Auditoría de registro
    observaciones = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hseq_hallazgo_auditoria'
        verbose_name = 'Hallazgo de Auditoría'
        verbose_name_plural = 'Hallazgos de Auditoría'
        ordering = ['-fecha_deteccion', 'tipo']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['auditoria']),
            models.Index(fields=['tipo']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.titulo}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            from utils.consecutivos import auto_generate_codigo
            auto_generate_codigo(self, 'HALLAZGO')
        super().save(*args, **kwargs)

    def comunicar(self):
        """Marca el hallazgo como comunicado."""
        self.estado = 'COMUNICADO'
        self.fecha_comunicacion = timezone.now().date()
        self.save()

    def iniciar_tratamiento(self):
        """Inicia el tratamiento del hallazgo."""
        self.estado = 'EN_TRATAMIENTO'
        self.save()

    def verificar(self, usuario, es_eficaz, observaciones=''):
        """Verifica la eficacia de las acciones tomadas."""
        self.estado = 'VERIFICADO'
        self.es_eficaz = es_eficaz
        self.verificado_por = usuario
        self.fecha_verificacion = timezone.now().date()
        self.verificacion_eficacia = observaciones
        self.save()

    def cerrar(self):
        """Cierra el hallazgo."""
        if self.estado == 'VERIFICADO' and self.es_eficaz:
            self.estado = 'CERRADO'
            self.fecha_cierre_real = timezone.now().date()
            self.save()
            return True
        return False

    @property
    def requiere_accion_correctiva(self):
        """Indica si el hallazgo requiere acción correctiva."""
        return self.tipo in ['NO_CONFORMIDAD_MAYOR', 'NO_CONFORMIDAD_MENOR']

    @property
    def dias_abierto(self):
        """Calcula los días que lleva abierto el hallazgo."""
        if self.fecha_cierre_real:
            return (self.fecha_cierre_real - self.fecha_deteccion).days
        return (timezone.now().date() - self.fecha_deteccion).days


class EvaluacionCumplimiento(models.Model):
    """
    Evaluación del cumplimiento de requisitos legales y otros requisitos.
    Vinculado con el Motor de Cumplimiento para verificar matriz legal.
    """
    TIPO_CHOICES = [
        ('LEGAL', 'Requisito Legal'),
        ('REGLAMENTARIO', 'Requisito Reglamentario'),
        ('CONTRACTUAL', 'Requisito Contractual'),
        ('NORMATIVO', 'Requisito Normativo'),
        ('CLIENTE', 'Requisito del Cliente'),
        ('VOLUNTARIO', 'Compromiso Voluntario'),
    ]

    RESULTADO_CHOICES = [
        ('CUMPLE', 'Cumple'),
        ('CUMPLE_PARCIAL', 'Cumple Parcialmente'),
        ('NO_CUMPLE', 'No Cumple'),
        ('NO_APLICA', 'No Aplica'),
        ('EN_PROCESO', 'En Proceso de Cumplimiento'),
    ]

    PERIODICIDAD_CHOICES = [
        ('MENSUAL', 'Mensual'),
        ('BIMESTRAL', 'Bimestral'),
        ('TRIMESTRAL', 'Trimestral'),
        ('SEMESTRAL', 'Semestral'),
        ('ANUAL', 'Anual'),
    ]

    empresa_id = models.PositiveBigIntegerField(db_index=True)
    codigo = models.CharField(max_length=50, blank=True)

    # Tipo y alcance
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)

    # Vinculación con requisitos legales
    requisito_legal = models.ForeignKey(
        'requisitos_legales.RequisitoLegal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluaciones_cumplimiento'
    )

    # Resultado de evaluación
    resultado = models.CharField(max_length=20, choices=RESULTADO_CHOICES)
    porcentaje_cumplimiento = models.PositiveIntegerField(
        default=0,
        help_text="Porcentaje de cumplimiento (0-100)"
    )

    # Evidencias
    evidencia_cumplimiento = models.TextField(
        blank=True,
        help_text="Descripción de las evidencias de cumplimiento"
    )
    archivos_evidencia = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista de rutas de archivos de evidencia"
    )

    # Brechas identificadas
    brechas_identificadas = models.TextField(
        blank=True,
        help_text="Descripción de brechas o incumplimientos"
    )
    acciones_requeridas = models.TextField(
        blank=True,
        help_text="Acciones para cerrar las brechas"
    )

    # Responsables
    evaluador = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='evaluaciones_realizadas'
    )
    responsable_cumplimiento = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cumplimientos_asignados'
    )

    # Programación
    periodicidad = models.CharField(
        max_length=15,
        choices=PERIODICIDAD_CHOICES,
        default='SEMESTRAL'
    )
    fecha_evaluacion = models.DateField()
    proxima_evaluacion = models.DateField(null=True, blank=True)

    # Vinculación con hallazgos y acciones
    hallazgo_generado = models.ForeignKey(
        Hallazgo,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluaciones_origen'
    )

    # Auditoría de registro
    observaciones = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='evaluaciones_creadas'
    )

    class Meta:
        db_table = 'hseq_evaluacion_cumplimiento'
        verbose_name = 'Evaluación de Cumplimiento'
        verbose_name_plural = 'Evaluaciones de Cumplimiento'
        ordering = ['-fecha_evaluacion']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['tipo']),
            models.Index(fields=['resultado']),
            models.Index(fields=['fecha_evaluacion']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.get_resultado_display()})"

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            from utils.consecutivos import auto_generate_codigo
            auto_generate_codigo(self, 'EVAL_CUMPLIMIENTO')
        super().save(*args, **kwargs)

    def calcular_proxima_evaluacion(self):
        """Calcula la fecha de la próxima evaluación según periodicidad."""
        from dateutil.relativedelta import relativedelta

        periodos = {
            'MENSUAL': relativedelta(months=1),
            'BIMESTRAL': relativedelta(months=2),
            'TRIMESTRAL': relativedelta(months=3),
            'SEMESTRAL': relativedelta(months=6),
            'ANUAL': relativedelta(years=1),
        }

        delta = periodos.get(self.periodicidad)
        if delta:
            self.proxima_evaluacion = self.fecha_evaluacion + delta
            self.save()

    @property
    def estado_cumplimiento(self):
        """Retorna el estado de cumplimiento basado en el resultado."""
        estados = {
            'CUMPLE': 'success',
            'CUMPLE_PARCIAL': 'warning',
            'NO_CUMPLE': 'danger',
            'NO_APLICA': 'info',
            'EN_PROCESO': 'warning',
        }
        return estados.get(self.resultado, 'secondary')

    @property
    def dias_para_proxima_evaluacion(self):
        """Calcula los días restantes para la próxima evaluación."""
        if self.proxima_evaluacion:
            return (self.proxima_evaluacion - timezone.now().date()).days
        return None
