"""
Modelos para riesgos_viales - PESV (Plan Estratégico de Seguridad Vial)
Basado en Resolución 40595/2022 - Ministerio de Transporte de Colombia
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class TipoRiesgoVial(models.Model):
    """
    Catálogo de tipos de riesgos viales según PESV

    Categorías principales:
    - Factor Humano: Comportamientos del conductor
    - Factor Vehículo: Estado mecánico y condiciones del vehículo
    - Factor Vía: Condiciones de infraestructura vial
    - Factor Ambiental: Condiciones climáticas y del entorno
    """
    CATEGORIA_CHOICES = [
        ('HUMANO', 'Factor Humano'),
        ('VEHICULO', 'Factor Vehículo'),
        ('VIA', 'Factor Vía/Infraestructura'),
        ('AMBIENTAL', 'Factor Ambiental'),
    ]

    codigo = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Código'
    )
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_CHOICES,
        verbose_name='Categoría'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Riesgo'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada del tipo de riesgo vial'
    )
    consecuencias_posibles = models.TextField(
        blank=True,
        verbose_name='Consecuencias Posibles',
        help_text='Posibles consecuencias de este tipo de riesgo'
    )
    marco_legal = models.TextField(
        blank=True,
        verbose_name='Marco Legal',
        help_text='Normatividad aplicable (Res. 40595/2022, Código de Tránsito, etc.)'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'riesgos_viales_tipo_riesgo'
        verbose_name = 'Tipo de Riesgo Vial'
        verbose_name_plural = 'Tipos de Riesgos Viales'
        ordering = ['categoria', 'codigo']

    def __str__(self):
        return f"{self.get_categoria_display()} - {self.nombre}"


class RiesgoVial(models.Model):
    """
    Riesgos viales identificados y evaluados

    Evaluación basada en:
    - Frecuencia de exposición al riesgo
    - Probabilidad de ocurrencia
    - Severidad de las consecuencias
    """
    NIVEL_RIESGO_CHOICES = [
        ('BAJO', 'Bajo'),
        ('MEDIO', 'Medio'),
        ('ALTO', 'Alto'),
        ('CRITICO', 'Crítico'),
    ]

    ESTADO_CHOICES = [
        ('IDENTIFICADO', 'Identificado'),
        ('EN_EVALUACION', 'En Evaluación'),
        ('EN_TRATAMIENTO', 'En Tratamiento'),
        ('CONTROLADO', 'Controlado'),
        ('CERRADO', 'Cerrado'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        verbose_name='Código'
    )
    tipo_riesgo = models.ForeignKey(
        TipoRiesgoVial,
        on_delete=models.PROTECT,
        related_name='riesgos',
        verbose_name='Tipo de Riesgo'
    )
    descripcion = models.TextField(
        verbose_name='Descripción del Riesgo',
        help_text='Descripción específica de cómo se manifiesta el riesgo en la operación'
    )

    # Contexto operacional
    proceso_afectado = models.CharField(
        max_length=200,
        verbose_name='Proceso Afectado',
        help_text='Proceso de negocio afectado (ej: Distribución, Recolección, etc.)'
    )
    rutas_afectadas = models.TextField(
        blank=True,
        verbose_name='Rutas Afectadas',
        help_text='Rutas específicas donde se presenta el riesgo'
    )
    tipo_vehiculo = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Tipo de Vehículo',
        help_text='Tipo de vehículo afectado por el riesgo'
    )

    # Evaluación del riesgo (método matriz)
    # Frecuencia: 1-5 (Muy rara vez a Muy frecuente)
    frecuencia = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Frecuencia de Exposición',
        help_text='1=Muy rara vez, 2=Poco frecuente, 3=Ocasional, 4=Frecuente, 5=Muy frecuente'
    )
    # Probabilidad: 1-5 (Muy improbable a Muy probable)
    probabilidad = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Probabilidad de Ocurrencia',
        help_text='1=Muy improbable, 2=Improbable, 3=Moderada, 4=Probable, 5=Muy probable'
    )
    # Severidad: 1-5 (Insignificante a Catastrófico)
    severidad = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Severidad de Consecuencias',
        help_text='1=Insignificante, 2=Menor, 3=Moderado, 4=Mayor, 5=Catastrófico'
    )

    # Valoración calculada (Frecuencia x Probabilidad x Severidad)
    valoracion_riesgo = models.IntegerField(
        editable=False,
        verbose_name='Valoración del Riesgo',
        help_text='Producto de Frecuencia x Probabilidad x Severidad'
    )
    nivel_riesgo = models.CharField(
        max_length=10,
        choices=NIVEL_RIESGO_CHOICES,
        editable=False,
        verbose_name='Nivel de Riesgo'
    )

    # Controles existentes
    controles_actuales = models.TextField(
        blank=True,
        verbose_name='Controles Actuales',
        help_text='Controles o medidas actualmente implementadas'
    )
    efectividad_controles = models.CharField(
        max_length=20,
        choices=[
            ('ALTA', 'Alta'),
            ('MEDIA', 'Media'),
            ('BAJA', 'Baja'),
            ('NO_EVALUADA', 'No Evaluada'),
        ],
        default='NO_EVALUADA',
        verbose_name='Efectividad de Controles'
    )

    # Valoración residual (después de controles)
    frecuencia_residual = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Frecuencia Residual'
    )
    probabilidad_residual = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Probabilidad Residual'
    )
    severidad_residual = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Severidad Residual'
    )
    valoracion_residual = models.IntegerField(
        null=True,
        blank=True,
        editable=False,
        verbose_name='Valoración Residual'
    )
    nivel_residual = models.CharField(
        max_length=10,
        choices=NIVEL_RIESGO_CHOICES,
        blank=True,
        editable=False,
        verbose_name='Nivel de Riesgo Residual'
    )

    # Responsable
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='riesgos_viales_responsable',
        verbose_name='Responsable de Gestión'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='IDENTIFICADO',
        verbose_name='Estado'
    )
    fecha_identificacion = models.DateField(
        verbose_name='Fecha de Identificación'
    )
    fecha_evaluacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Evaluación'
    )
    fecha_revision = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próxima Revisión'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Multi-tenancy
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
        related_name='riesgos_viales_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'riesgos_viales_riesgo'
        verbose_name = 'Riesgo Vial'
        verbose_name_plural = 'Riesgos Viales'
        ordering = ['-valoracion_riesgo', 'codigo']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'nivel_riesgo']),
            models.Index(fields=['empresa_id', 'tipo_riesgo']),
            models.Index(fields=['empresa_id', 'fecha_revision']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.descripcion[:50]}"

    def save(self, *args, **kwargs):
        # Calcular valoración de riesgo inherente
        self.valoracion_riesgo = self.frecuencia * self.probabilidad * self.severidad
        self.nivel_riesgo = self._calcular_nivel_riesgo(self.valoracion_riesgo)

        # Calcular valoración residual si hay datos
        if all([
            self.frecuencia_residual is not None,
            self.probabilidad_residual is not None,
            self.severidad_residual is not None
        ]):
            self.valoracion_residual = (
                self.frecuencia_residual *
                self.probabilidad_residual *
                self.severidad_residual
            )
            self.nivel_residual = self._calcular_nivel_riesgo(self.valoracion_residual)

        super().save(*args, **kwargs)

    def _calcular_nivel_riesgo(self, valoracion):
        """
        Calcula el nivel de riesgo basado en la valoración

        Escala PESV:
        - 1-25: Bajo
        - 26-60: Medio
        - 61-100: Alto
        - 101-125: Crítico
        """
        if valoracion <= 25:
            return 'BAJO'
        elif valoracion <= 60:
            return 'MEDIO'
        elif valoracion <= 100:
            return 'ALTO'
        else:
            return 'CRITICO'

    @property
    def requiere_accion_inmediata(self):
        """Indica si el riesgo requiere acción inmediata"""
        return self.nivel_riesgo in ['ALTO', 'CRITICO']

    @property
    def porcentaje_reduccion(self):
        """Calcula el porcentaje de reducción del riesgo con controles"""
        if self.valoracion_residual and self.valoracion_riesgo > 0:
            reduccion = ((self.valoracion_riesgo - self.valoracion_residual) /
                        self.valoracion_riesgo) * 100
            return round(reduccion, 2)
        return None


class ControlVial(models.Model):
    """
    Controles de seguridad vial implementados

    Clasificados según momento de aplicación:
    - Antes del viaje (planificación, inspección)
    - Durante el viaje (monitoreo, comunicación)
    - Después del viaje (análisis, mejora)
    """
    TIPO_CONTROL_CHOICES = [
        ('PREVENTIVO', 'Preventivo'),
        ('CORRECTIVO', 'Correctivo'),
        ('DETECTIVO', 'Detectivo'),
    ]

    MOMENTO_APLICACION_CHOICES = [
        ('ANTES_VIAJE', 'Antes del Viaje'),
        ('DURANTE_VIAJE', 'Durante el Viaje'),
        ('DESPUES_VIAJE', 'Después del Viaje'),
        ('PERMANENTE', 'Permanente'),
    ]

    ESTADO_CHOICES = [
        ('PROPUESTO', 'Propuesto'),
        ('APROBADO', 'Aprobado'),
        ('EN_IMPLEMENTACION', 'En Implementación'),
        ('IMPLEMENTADO', 'Implementado'),
        ('SUSPENDIDO', 'Suspendido'),
    ]

    # Relación con riesgo
    riesgo_vial = models.ForeignKey(
        RiesgoVial,
        on_delete=models.CASCADE,
        related_name='controles',
        verbose_name='Riesgo Vial'
    )

    # Identificación del control
    codigo = models.CharField(
        max_length=50,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Control'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada del control a implementar'
    )

    # Clasificación
    tipo_control = models.CharField(
        max_length=15,
        choices=TIPO_CONTROL_CHOICES,
        verbose_name='Tipo de Control'
    )
    momento_aplicacion = models.CharField(
        max_length=20,
        choices=MOMENTO_APLICACION_CHOICES,
        verbose_name='Momento de Aplicación'
    )

    # Jerarquía de controles (según PESV)
    jerarquia = models.CharField(
        max_length=30,
        choices=[
            ('ELIMINACION', 'Eliminación'),
            ('SUSTITUCION', 'Sustitución'),
            ('CONTROLES_INGENIERIA', 'Controles de Ingeniería'),
            ('CONTROLES_ADMIN', 'Controles Administrativos'),
            ('SEÑALIZACION', 'Señalización/Advertencia'),
            ('EPP', 'Equipos de Protección Personal'),
        ],
        verbose_name='Jerarquía de Control'
    )

    # Responsabilidad
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='controles_viales_responsable',
        verbose_name='Responsable de Implementación'
    )
    area_responsable = models.CharField(
        max_length=100,
        verbose_name='Área Responsable'
    )

    # Implementación
    fecha_propuesta = models.DateField(
        verbose_name='Fecha de Propuesta'
    )
    fecha_implementacion_programada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Programada'
    )
    fecha_implementacion_real = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Real de Implementación'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PROPUESTO',
        verbose_name='Estado'
    )

    # Recursos
    costo_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Costo Estimado'
    )
    costo_real = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Costo Real'
    )
    recursos_necesarios = models.TextField(
        blank=True,
        verbose_name='Recursos Necesarios'
    )

    # Efectividad
    indicador_efectividad = models.TextField(
        blank=True,
        verbose_name='Indicador de Efectividad',
        help_text='Cómo se medirá la efectividad del control'
    )
    efectividad_verificada = models.BooleanField(
        default=False,
        verbose_name='Efectividad Verificada'
    )
    fecha_verificacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Verificación'
    )
    resultado_verificacion = models.TextField(
        blank=True,
        verbose_name='Resultado de Verificación'
    )

    # Documentación
    documentos_soporte = models.TextField(
        blank=True,
        verbose_name='Documentos de Soporte',
        help_text='Referencias a procedimientos, instructivos, etc.'
    )
    evidencias = models.TextField(
        blank=True,
        verbose_name='Evidencias',
        help_text='Evidencias de implementación (fotos, registros, etc.)'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Multi-tenancy
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
        related_name='controles_viales_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'riesgos_viales_control'
        verbose_name = 'Control Vial'
        verbose_name_plural = 'Controles Viales'
        ordering = ['riesgo_vial', 'fecha_propuesta']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'responsable']),
            models.Index(fields=['fecha_implementacion_programada']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def esta_atrasado(self):
        """Verifica si el control está atrasado en su implementación"""
        if self.estado in ['PROPUESTO', 'EN_IMPLEMENTACION'] and self.fecha_implementacion_programada:
            from django.utils import timezone
            return self.fecha_implementacion_programada < timezone.now().date()
        return False


class IncidenteVial(models.Model):
    """
    Registro de incidentes y accidentes viales

    Para análisis de causalidad y mejora continua del PESV
    """
    TIPO_INCIDENTE_CHOICES = [
        ('ACCIDENTE_TRANSITO', 'Accidente de Tránsito'),
        ('INCIDENTE_MENOR', 'Incidente Menor'),
        ('CASI_ACCIDENTE', 'Casi Accidente'),
        ('INFRACCION', 'Infracción de Tránsito'),
    ]

    GRAVEDAD_CHOICES = [
        ('SOLO_DAÑOS', 'Solo Daños Materiales'),
        ('LESION_LEVE', 'Lesiones Leves'),
        ('LESION_GRAVE', 'Lesiones Graves'),
        ('FATAL', 'Fatal'),
    ]

    ESTADO_INVESTIGACION_CHOICES = [
        ('REPORTADO', 'Reportado'),
        ('EN_INVESTIGACION', 'En Investigación'),
        ('ANALISIS_CAUSAL', 'Análisis de Causas'),
        ('PLAN_ACCION', 'Plan de Acción'),
        ('CERRADO', 'Cerrado'),
    ]

    # Identificación
    numero_incidente = models.CharField(
        max_length=50,
        verbose_name='Número de Incidente'
    )
    tipo_incidente = models.CharField(
        max_length=25,
        choices=TIPO_INCIDENTE_CHOICES,
        verbose_name='Tipo de Incidente'
    )
    gravedad = models.CharField(
        max_length=20,
        choices=GRAVEDAD_CHOICES,
        verbose_name='Gravedad'
    )

    # Fecha y lugar
    fecha_incidente = models.DateTimeField(
        verbose_name='Fecha y Hora del Incidente'
    )
    ubicacion = models.CharField(
        max_length=300,
        verbose_name='Ubicación',
        help_text='Dirección o punto de referencia donde ocurrió'
    )
    municipio = models.CharField(
        max_length=100,
        verbose_name='Municipio'
    )
    departamento = models.CharField(
        max_length=100,
        verbose_name='Departamento'
    )
    coordenadas = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Coordenadas GPS',
        help_text='Latitud, Longitud'
    )

    # Involucrados
    conductor_nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Conductor'
    )
    conductor_identificacion = models.CharField(
        max_length=50,
        verbose_name='Identificación del Conductor'
    )
    conductor_licencia = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Número de Licencia'
    )
    vehiculo_placa = models.CharField(
        max_length=10,
        verbose_name='Placa del Vehículo'
    )
    vehiculo_tipo = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Tipo de Vehículo'
    )

    # Descripción
    descripcion_hechos = models.TextField(
        verbose_name='Descripción de los Hechos'
    )
    condiciones_climaticas = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Condiciones Climáticas'
    )
    condiciones_via = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Condiciones de la Vía'
    )
    condiciones_vehiculo = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Condiciones del Vehículo'
    )

    # Consecuencias
    numero_lesionados = models.IntegerField(
        default=0,
        verbose_name='Número de Lesionados'
    )
    numero_fallecidos = models.IntegerField(
        default=0,
        verbose_name='Número de Fallecidos'
    )
    descripcion_lesiones = models.TextField(
        blank=True,
        verbose_name='Descripción de Lesiones'
    )

    # Daños materiales
    daños_vehiculo_propio = models.TextField(
        blank=True,
        verbose_name='Daños al Vehículo Propio'
    )
    daños_terceros = models.TextField(
        blank=True,
        verbose_name='Daños a Terceros'
    )
    costo_estimado_daños = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Costo Estimado de Daños'
    )

    # Autoridades
    autoridades_notificadas = models.BooleanField(
        default=False,
        verbose_name='Autoridades Notificadas'
    )
    numero_informe_policial = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Número de Informe Policial'
    )
    comparendo_numero = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Número de Comparendo'
    )

    # Investigación
    estado_investigacion = models.CharField(
        max_length=25,
        choices=ESTADO_INVESTIGACION_CHOICES,
        default='REPORTADO',
        verbose_name='Estado de Investigación'
    )
    investigador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incidentes_viales_investigados',
        verbose_name='Investigador'
    )
    fecha_inicio_investigacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Inicio Investigación'
    )
    fecha_cierre_investigacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Cierre Investigación'
    )

    # Análisis de causas
    causas_inmediatas = models.TextField(
        blank=True,
        verbose_name='Causas Inmediatas',
        help_text='Actos y condiciones inseguras'
    )
    causas_basicas = models.TextField(
        blank=True,
        verbose_name='Causas Básicas',
        help_text='Factores personales y del trabajo'
    )
    causas_raiz = models.TextField(
        blank=True,
        verbose_name='Causas Raíz',
        help_text='Fallas en el sistema de gestión'
    )

    # Relación con riesgos identificados
    riesgos_relacionados = models.ManyToManyField(
        RiesgoVial,
        blank=True,
        related_name='incidentes',
        verbose_name='Riesgos Relacionados'
    )

    # Lecciones aprendidas
    lecciones_aprendidas = models.TextField(
        blank=True,
        verbose_name='Lecciones Aprendidas'
    )
    acciones_correctivas = models.TextField(
        blank=True,
        verbose_name='Acciones Correctivas Implementadas'
    )

    # Evidencias
    evidencias_fotograficas = models.TextField(
        blank=True,
        verbose_name='Evidencias Fotográficas',
        help_text='Referencias a archivos de fotos'
    )
    documentos_adjuntos = models.TextField(
        blank=True,
        verbose_name='Documentos Adjuntos',
        help_text='Referencias a documentos relacionados'
    )

    # Multi-tenancy
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
        related_name='incidentes_viales_created',
        verbose_name='Reportado por'
    )

    class Meta:
        db_table = 'riesgos_viales_incidente'
        verbose_name = 'Incidente Vial'
        verbose_name_plural = 'Incidentes Viales'
        ordering = ['-fecha_incidente']
        unique_together = ['empresa_id', 'numero_incidente']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo_incidente']),
            models.Index(fields=['empresa_id', 'gravedad']),
            models.Index(fields=['empresa_id', 'estado_investigacion']),
            models.Index(fields=['fecha_incidente']),
            models.Index(fields=['vehiculo_placa']),
        ]

    def __str__(self):
        return f"{self.numero_incidente} - {self.get_tipo_incidente_display()} - {self.fecha_incidente.strftime('%Y-%m-%d')}"

    @property
    def es_accidente_grave(self):
        """Determina si es un accidente que requiere reporte a autoridades"""
        return (
            self.gravedad in ['LESION_GRAVE', 'FATAL'] or
            self.numero_lesionados > 0 or
            self.numero_fallecidos > 0
        )

    @property
    def dias_investigacion_abierta(self):
        """Calcula días desde inicio de investigación"""
        if self.fecha_inicio_investigacion and not self.fecha_cierre_investigacion:
            from django.utils import timezone
            return (timezone.now().date() - self.fecha_inicio_investigacion).days
        return None


class InspeccionVehiculo(models.Model):
    """
    Registros de inspecciones pre-operacionales de vehículos

    Parte fundamental del PESV para prevención de riesgos viales
    Inspecciones diarias antes de iniciar operación
    """
    RESULTADO_CHOICES = [
        ('APROBADO', 'Aprobado - Apto para Operar'),
        ('APROBADO_OBSERVACIONES', 'Aprobado con Observaciones'),
        ('RECHAZADO', 'Rechazado - No Apto'),
    ]

    # Identificación
    numero_inspeccion = models.CharField(
        max_length=50,
        verbose_name='Número de Inspección'
    )
    fecha_inspeccion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha y Hora de Inspección'
    )

    # Vehículo e inspector
    vehiculo_placa = models.CharField(
        max_length=10,
        verbose_name='Placa del Vehículo'
    )
    vehiculo_tipo = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Tipo de Vehículo'
    )
    conductor_nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Conductor'
    )
    conductor_identificacion = models.CharField(
        max_length=50,
        verbose_name='Identificación del Conductor'
    )
    odometro = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Lectura de Odómetro (km)'
    )

    # Checklist de inspección (según normativa)
    # Estado general
    estado_carroceria = models.BooleanField(
        default=True,
        verbose_name='Estado de Carrocería'
    )
    limpieza_vehiculo = models.BooleanField(
        default=True,
        verbose_name='Limpieza del Vehículo'
    )

    # Sistema de iluminación
    luces_delanteras = models.BooleanField(
        default=True,
        verbose_name='Luces Delanteras'
    )
    luces_traseras = models.BooleanField(
        default=True,
        verbose_name='Luces Traseras'
    )
    luces_direccionales = models.BooleanField(
        default=True,
        verbose_name='Luces Direccionales'
    )
    luces_freno = models.BooleanField(
        default=True,
        verbose_name='Luces de Freno'
    )
    luces_emergencia = models.BooleanField(
        default=True,
        verbose_name='Luces de Emergencia'
    )

    # Espejos
    espejo_retrovisor_int = models.BooleanField(
        default=True,
        verbose_name='Espejo Retrovisor Interior'
    )
    espejo_lateral_izq = models.BooleanField(
        default=True,
        verbose_name='Espejo Lateral Izquierdo'
    )
    espejo_lateral_der = models.BooleanField(
        default=True,
        verbose_name='Espejo Lateral Derecho'
    )

    # Llantas
    estado_llantas = models.BooleanField(
        default=True,
        verbose_name='Estado de Llantas (profundidad, presión)'
    )
    llanta_repuesto = models.BooleanField(
        default=True,
        verbose_name='Llanta de Repuesto'
    )

    # Frenos
    freno_servicio = models.BooleanField(
        default=True,
        verbose_name='Freno de Servicio'
    )
    freno_emergencia = models.BooleanField(
        default=True,
        verbose_name='Freno de Emergencia'
    )

    # Dirección y suspensión
    sistema_direccion = models.BooleanField(
        default=True,
        verbose_name='Sistema de Dirección'
    )
    sistema_suspension = models.BooleanField(
        default=True,
        verbose_name='Sistema de Suspensión'
    )

    # Niveles de fluidos
    nivel_aceite_motor = models.BooleanField(
        default=True,
        verbose_name='Nivel de Aceite de Motor'
    )
    nivel_refrigerante = models.BooleanField(
        default=True,
        verbose_name='Nivel de Refrigerante'
    )
    nivel_liquido_frenos = models.BooleanField(
        default=True,
        verbose_name='Nivel de Líquido de Frenos'
    )
    nivel_liquido_direccion = models.BooleanField(
        default=True,
        verbose_name='Nivel de Líquido de Dirección'
    )

    # Limpiabrisas y parabrisas
    limpiabrisas = models.BooleanField(
        default=True,
        verbose_name='Limpiabrisas'
    )
    parabrisas = models.BooleanField(
        default=True,
        verbose_name='Parabrisas (sin fisuras)'
    )

    # Cinturones de seguridad
    cinturones_seguridad = models.BooleanField(
        default=True,
        verbose_name='Cinturones de Seguridad'
    )

    # Bocina y alarma de reversa
    bocina = models.BooleanField(
        default=True,
        verbose_name='Bocina'
    )
    alarma_reversa = models.BooleanField(
        default=True,
        verbose_name='Alarma de Reversa'
    )

    # Kit de seguridad
    extintor = models.BooleanField(
        default=True,
        verbose_name='Extintor (carga vigente)'
    )
    botiquin = models.BooleanField(
        default=True,
        verbose_name='Botiquín de Primeros Auxilios'
    )
    kit_carretera = models.BooleanField(
        default=True,
        verbose_name='Kit de Carretera (señales, cruceta, tacos)'
    )
    chaleco_reflectivo = models.BooleanField(
        default=True,
        verbose_name='Chaleco Reflectivo'
    )

    # Documentación del vehículo
    soat_vigente = models.BooleanField(
        default=True,
        verbose_name='SOAT Vigente'
    )
    revision_tecnomecanica = models.BooleanField(
        default=True,
        verbose_name='Revisión Tecnomecánica Vigente'
    )
    tarjeta_propiedad = models.BooleanField(
        default=True,
        verbose_name='Tarjeta de Propiedad'
    )

    # Observaciones y resultado
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Detalles de hallazgos, fallas o condiciones especiales'
    )
    items_rechazados = models.TextField(
        blank=True,
        verbose_name='Ítems Rechazados',
        help_text='Lista de ítems que no cumplen'
    )
    resultado = models.CharField(
        max_length=30,
        choices=RESULTADO_CHOICES,
        verbose_name='Resultado de Inspección'
    )

    # Seguimiento
    requiere_mantenimiento = models.BooleanField(
        default=False,
        verbose_name='Requiere Mantenimiento'
    )
    fecha_mantenimiento_programado = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Mantenimiento Programado'
    )
    mantenimiento_completado = models.BooleanField(
        default=False,
        verbose_name='Mantenimiento Completado'
    )

    # Firma digital / confirmación
    inspeccion_confirmada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inspecciones_confirmadas',
        verbose_name='Confirmado por (Supervisor)'
    )
    fecha_confirmacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Confirmación'
    )

    # Multi-tenancy
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
        related_name='inspecciones_vehiculo_created',
        verbose_name='Inspector'
    )

    class Meta:
        db_table = 'riesgos_viales_inspeccion_vehiculo'
        verbose_name = 'Inspección de Vehículo'
        verbose_name_plural = 'Inspecciones de Vehículos'
        ordering = ['-fecha_inspeccion']
        unique_together = ['empresa_id', 'numero_inspeccion']
        indexes = [
            models.Index(fields=['empresa_id', 'vehiculo_placa']),
            models.Index(fields=['empresa_id', 'resultado']),
            models.Index(fields=['fecha_inspeccion']),
            models.Index(fields=['requiere_mantenimiento']),
        ]

    def __str__(self):
        return f"{self.numero_inspeccion} - {self.vehiculo_placa} - {self.fecha_inspeccion.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        # Auto-calcular resultado basado en checklist
        if not self.pk:  # Solo en creación
            items_fallidos = self._contar_items_fallidos()

            if items_fallidos == 0:
                self.resultado = 'APROBADO'
            elif items_fallidos <= 3 and not self._tiene_fallas_criticas():
                self.resultado = 'APROBADO_OBSERVACIONES'
                self.requiere_mantenimiento = True
            else:
                self.resultado = 'RECHAZADO'
                self.requiere_mantenimiento = True

        super().save(*args, **kwargs)

    def _contar_items_fallidos(self):
        """Cuenta items que no pasaron inspección"""
        items = [
            self.estado_carroceria, self.luces_delanteras, self.luces_traseras,
            self.luces_direccionales, self.luces_freno, self.luces_emergencia,
            self.espejo_retrovisor_int, self.espejo_lateral_izq, self.espejo_lateral_der,
            self.estado_llantas, self.llanta_repuesto, self.freno_servicio,
            self.freno_emergencia, self.sistema_direccion, self.sistema_suspension,
            self.nivel_aceite_motor, self.nivel_refrigerante, self.nivel_liquido_frenos,
            self.limpiabrisas, self.parabrisas, self.cinturones_seguridad,
            self.bocina, self.extintor, self.botiquin, self.kit_carretera,
            self.soat_vigente, self.revision_tecnomecanica
        ]
        return sum(1 for item in items if not item)

    def _tiene_fallas_criticas(self):
        """Verifica si hay fallas críticas que impiden operación"""
        fallas_criticas = [
            not self.freno_servicio,
            not self.sistema_direccion,
            not self.soat_vigente,
            not self.revision_tecnomecanica,
            not self.cinturones_seguridad,
            not self.luces_freno,
        ]
        return any(fallas_criticas)

    @property
    def porcentaje_conformidad(self):
        """Calcula porcentaje de ítems conformes"""
        total_items = 27  # Total de items checklist
        items_fallidos = self._contar_items_fallidos()
        return round(((total_items - items_fallidos) / total_items) * 100, 2)
