from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class ActivoInformacion(models.Model):
    TIPO_CHOICES = [
        ("HARDWARE", "Hardware"),
        ("SOFTWARE", "Software"),
        ("INFORMACION", "Información"),
        ("SERVICIOS", "Servicios"),
        ("PERSONAS", "Personas"),
        ("INTANGIBLES", "Intangibles"),
    ]

    CLASIFICACION_CHOICES = [
        ("PUBLICA", "Pública"),
        ("INTERNA", "Interna"),
        ("CONFIDENCIAL", "Confidencial"),
        ("SECRETA", "Secreta"),
    ]

    codigo = models.CharField(max_length=50, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=255, verbose_name="Nombre")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, verbose_name="Tipo")

    propietario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="activos_propietario",
        verbose_name="Propietario"
    )
    custodio = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="activos_custodio",
        null=True,
        blank=True,
        verbose_name="Custodio"
    )

    ubicacion = models.CharField(max_length=255, blank=True, verbose_name="Ubicación")
    clasificacion = models.CharField(
        max_length=20,
        choices=CLASIFICACION_CHOICES,
        default="INTERNA",
        verbose_name="Clasificación"
    )

    valor_confidencialidad = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
        verbose_name="Valor Confidencialidad"
    )
    valor_integridad = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
        verbose_name="Valor Integridad"
    )
    valor_disponibilidad = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
        verbose_name="Valor Disponibilidad"
    )

    criticidad = models.PositiveSmallIntegerField(
        editable=False,
        default=0,
        verbose_name="Criticidad"
    )

    is_active = models.BooleanField(default=True, verbose_name="Activo")
    empresa_id = models.PositiveBigIntegerField(verbose_name="Empresa ID")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Fecha Actualización")

    class Meta:
        db_table = "motor_riesgos_activo_informacion"
        verbose_name = "Activo de Información"
        verbose_name_plural = "Activos de Información"
        ordering = ["codigo"]
        indexes = [
            models.Index(fields=["empresa_id", "is_active"]),
            models.Index(fields=["tipo"]),
            models.Index(fields=["clasificacion"]),
        ]

    def save(self, *args, **kwargs):
        self.criticidad = round(
            (self.valor_confidencialidad + self.valor_integridad + self.valor_disponibilidad) / 3
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Amenaza(models.Model):
    TIPO_CHOICES = [
        ("NATURAL", "Natural"),
        ("HUMANA_INTENCIONAL", "Humana Intencional"),
        ("HUMANA_NO_INTENCIONAL", "Humana No Intencional"),
        ("TECNICA", "Técnica"),
    ]

    codigo = models.CharField(max_length=50, unique=True, verbose_name="Código")
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES, verbose_name="Tipo")
    nombre = models.CharField(max_length=255, verbose_name="Nombre")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    probabilidad_ocurrencia = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
        verbose_name="Probabilidad de Ocurrencia"
    )
    is_active = models.BooleanField(default=True, verbose_name="Activo")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Fecha Actualización")

    class Meta:
        db_table = "motor_riesgos_amenaza"
        verbose_name = "Amenaza"
        verbose_name_plural = "Amenazas"
        ordering = ["codigo"]
        indexes = [
            models.Index(fields=["tipo", "is_active"]),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Vulnerabilidad(models.Model):
    activo = models.ForeignKey(
        ActivoInformacion,
        on_delete=models.CASCADE,
        related_name="vulnerabilidades",
        verbose_name="Activo"
    )
    codigo = models.CharField(max_length=50, verbose_name="Código")
    descripcion = models.TextField(verbose_name="Descripción")
    facilidad_explotacion = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
        verbose_name="Facilidad de Explotación"
    )
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    empresa_id = models.PositiveBigIntegerField(verbose_name="Empresa ID")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Fecha Actualización")

    class Meta:
        db_table = "motor_riesgos_vulnerabilidad"
        verbose_name = "Vulnerabilidad"
        verbose_name_plural = "Vulnerabilidades"
        ordering = ["activo", "codigo"]
        unique_together = [["activo", "codigo"]]
        indexes = [
            models.Index(fields=["empresa_id", "is_active"]),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.activo.codigo}"


class RiesgoSeguridad(models.Model):
    """
    Evaluación de Riesgo de Seguridad de la Información - ISO 27001
    Combina activo + amenaza + vulnerabilidad para calcular riesgo
    """
    PROBABILIDAD_CHOICES = [
        (1, 'Muy Baja'),
        (2, 'Baja'),
        (3, 'Media'),
        (4, 'Alta'),
        (5, 'Muy Alta'),
    ]

    IMPACTO_CHOICES = [
        (1, 'Insignificante'),
        (2, 'Menor'),
        (3, 'Moderado'),
        (4, 'Mayor'),
        (5, 'Catastrófico'),
    ]

    NIVEL_RIESGO_CHOICES = [
        ('BAJO', 'Bajo'),
        ('MEDIO', 'Medio'),
        ('ALTO', 'Alto'),
        ('CRITICO', 'Crítico'),
    ]

    ACEPTABILIDAD_CHOICES = [
        ('ACEPTABLE', 'Aceptable'),
        ('TOLERABLE', 'Tolerable'),
        ('INACEPTABLE', 'Inaceptable'),
    ]

    ESTADO_CHOICES = [
        ('IDENTIFICADO', 'Identificado'),
        ('EN_EVALUACION', 'En Evaluación'),
        ('EN_TRATAMIENTO', 'En Tratamiento'),
        ('CONTROLADO', 'Controlado'),
        ('CERRADO', 'Cerrado'),
    ]

    # Identificación del riesgo
    activo = models.ForeignKey(
        ActivoInformacion,
        on_delete=models.PROTECT,
        related_name='riesgos',
        verbose_name='Activo de Información'
    )
    amenaza = models.ForeignKey(
        Amenaza,
        on_delete=models.PROTECT,
        related_name='riesgos',
        verbose_name='Amenaza'
    )
    vulnerabilidad = models.ForeignKey(
        Vulnerabilidad,
        on_delete=models.PROTECT,
        related_name='riesgos',
        null=True,
        blank=True,
        verbose_name='Vulnerabilidad'
    )
    escenario_riesgo = models.TextField(
        verbose_name='Escenario de Riesgo',
        help_text='Descripción del escenario de riesgo'
    )

    # Evaluación inherente
    probabilidad = models.PositiveSmallIntegerField(
        choices=PROBABILIDAD_CHOICES,
        default=3,
        verbose_name='Probabilidad'
    )
    impacto = models.PositiveSmallIntegerField(
        choices=IMPACTO_CHOICES,
        default=3,
        verbose_name='Impacto'
    )
    nivel_riesgo = models.CharField(
        max_length=10,
        choices=NIVEL_RIESGO_CHOICES,
        editable=False,
        verbose_name='Nivel de Riesgo'
    )

    # Controles existentes
    controles_existentes = models.TextField(
        blank=True,
        verbose_name='Controles Existentes'
    )

    # Evaluación residual
    probabilidad_residual = models.PositiveSmallIntegerField(
        choices=PROBABILIDAD_CHOICES,
        null=True,
        blank=True,
        verbose_name='Probabilidad Residual'
    )
    impacto_residual = models.PositiveSmallIntegerField(
        choices=IMPACTO_CHOICES,
        null=True,
        blank=True,
        verbose_name='Impacto Residual'
    )
    nivel_residual = models.CharField(
        max_length=10,
        choices=NIVEL_RIESGO_CHOICES,
        blank=True,
        verbose_name='Nivel de Riesgo Residual'
    )

    # Tratamiento
    aceptabilidad = models.CharField(
        max_length=15,
        choices=ACEPTABILIDAD_CHOICES,
        default='INACEPTABLE',
        verbose_name='Aceptabilidad'
    )
    responsable_tratamiento = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='riesgos_seguridad_responsable',
        verbose_name='Responsable del Tratamiento'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='IDENTIFICADO',
        verbose_name='Estado'
    )

    # Multi-tenant
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='riesgos_seguridad_creados',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'motor_riesgos_riesgo_seguridad'
        verbose_name = 'Riesgo de Seguridad'
        verbose_name_plural = 'Riesgos de Seguridad'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['nivel_riesgo']),
        ]

    def _calcular_nivel(self, prob, imp):
        """Calcula nivel de riesgo basado en matriz 5x5"""
        valor = prob * imp
        if valor <= 4:
            return 'BAJO'
        elif valor <= 9:
            return 'MEDIO'
        elif valor <= 16:
            return 'ALTO'
        return 'CRITICO'

    def save(self, *args, **kwargs):
        self.nivel_riesgo = self._calcular_nivel(self.probabilidad, self.impacto)
        if self.probabilidad_residual and self.impacto_residual:
            self.nivel_residual = self._calcular_nivel(
                self.probabilidad_residual, self.impacto_residual
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Riesgo: {self.activo.codigo} - {self.amenaza.codigo}"


class ControlSeguridad(models.Model):
    """
    Controles de Seguridad basados en Anexo A de ISO 27001
    """
    TIPO_CONTROL_CHOICES = [
        ('PREVENTIVO', 'Preventivo'),
        ('DETECTIVO', 'Detectivo'),
        ('CORRECTIVO', 'Correctivo'),
    ]

    ESTADO_CHOICES = [
        ('NO_IMPLEMENTADO', 'No Implementado'),
        ('EN_IMPLEMENTACION', 'En Implementación'),
        ('IMPLEMENTADO', 'Implementado'),
        ('OPTIMIZADO', 'Optimizado'),
    ]

    riesgo = models.ForeignKey(
        RiesgoSeguridad,
        on_delete=models.CASCADE,
        related_name='controles',
        verbose_name='Riesgo'
    )
    control_iso = models.CharField(
        max_length=20,
        verbose_name='Control ISO 27001',
        help_text='Ej: A.5.1.1, A.6.1.1'
    )
    descripcion = models.TextField(
        verbose_name='Descripción del Control'
    )
    tipo_control = models.CharField(
        max_length=15,
        choices=TIPO_CONTROL_CHOICES,
        default='PREVENTIVO',
        verbose_name='Tipo de Control'
    )
    estado_implementacion = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='NO_IMPLEMENTADO',
        verbose_name='Estado de Implementación'
    )
    efectividad = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0,
        verbose_name='Efectividad (%)'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='controles_seguridad_responsable',
        verbose_name='Responsable'
    )
    fecha_implementacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Implementación'
    )
    evidencia = models.TextField(
        blank=True,
        verbose_name='Evidencia'
    )

    # Multi-tenant
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'motor_riesgos_control_seguridad'
        verbose_name = 'Control de Seguridad'
        verbose_name_plural = 'Controles de Seguridad'
        ordering = ['control_iso']

    def __str__(self):
        return f"{self.control_iso} - {self.riesgo}"


class IncidenteSeguridad(models.Model):
    """
    Gestión de Incidentes de Seguridad de la Información
    """
    TIPO_INCIDENTE_CHOICES = [
        ('ACCESO_NO_AUTORIZADO', 'Acceso No Autorizado'),
        ('MALWARE', 'Malware/Virus'),
        ('FUGA_INFORMACION', 'Fuga de Información'),
        ('PHISHING', 'Phishing'),
        ('DENEGACION_SERVICIO', 'Denegación de Servicio'),
        ('PERDIDA_DATOS', 'Pérdida de Datos'),
        ('ROBO_EQUIPOS', 'Robo de Equipos'),
        ('INGENIERIA_SOCIAL', 'Ingeniería Social'),
        ('OTRO', 'Otro'),
    ]

    SEVERIDAD_CHOICES = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('CRITICA', 'Crítica'),
    ]

    ESTADO_CHOICES = [
        ('REPORTADO', 'Reportado'),
        ('EN_INVESTIGACION', 'En Investigación'),
        ('CONTENIDO', 'Contenido'),
        ('ERRADICADO', 'Erradicado'),
        ('RECUPERADO', 'Recuperado'),
        ('CERRADO', 'Cerrado'),
    ]

    fecha_deteccion = models.DateTimeField(
        verbose_name='Fecha de Detección'
    )
    descripcion = models.TextField(
        verbose_name='Descripción del Incidente'
    )
    activos_afectados = models.ManyToManyField(
        ActivoInformacion,
        related_name='incidentes',
        blank=True,
        verbose_name='Activos Afectados'
    )
    tipo_incidente = models.CharField(
        max_length=25,
        choices=TIPO_INCIDENTE_CHOICES,
        verbose_name='Tipo de Incidente'
    )
    severidad = models.CharField(
        max_length=10,
        choices=SEVERIDAD_CHOICES,
        default='MEDIA',
        verbose_name='Severidad'
    )
    impacto_real = models.TextField(
        blank=True,
        verbose_name='Impacto Real'
    )

    # Respuesta
    acciones_contencion = models.TextField(
        blank=True,
        verbose_name='Acciones de Contención'
    )
    acciones_erradicacion = models.TextField(
        blank=True,
        verbose_name='Acciones de Erradicación'
    )
    lecciones_aprendidas = models.TextField(
        blank=True,
        verbose_name='Lecciones Aprendidas'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='REPORTADO',
        verbose_name='Estado'
    )
    reportado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='incidentes_reportados',
        verbose_name='Reportado Por'
    )

    # Multi-tenant
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'motor_riesgos_incidente_seguridad'
        verbose_name = 'Incidente de Seguridad'
        verbose_name_plural = 'Incidentes de Seguridad'
        ordering = ['-fecha_deteccion']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['severidad']),
            models.Index(fields=['tipo_incidente']),
        ]

    def __str__(self):
        return f"Incidente {self.fecha_deteccion.strftime('%Y-%m-%d')} - {self.tipo_incidente}"
