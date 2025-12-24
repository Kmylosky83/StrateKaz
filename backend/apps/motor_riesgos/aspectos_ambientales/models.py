"""
Modelos para Aspectos Ambientales - ISO 14001
Sistema de Gestión Ambiental
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

User = get_user_model()


class CategoriaAspecto(models.Model):
    """
    Categorías de aspectos ambientales según ISO 14001
    Catálogo global reutilizable
    """
    TIPO_CHOICES = [
        ('EMISION', 'Emisiones a la Atmósfera'),
        ('VERTIMIENTO', 'Vertimientos al Agua'),
        ('RESIDUO', 'Generación de Residuos'),
        ('CONSUMO_RECURSO', 'Consumo de Recursos'),
        ('CONTAMINACION_SUELO', 'Contaminación del Suelo'),
        ('RUIDO_VIBRACION', 'Ruido y Vibraciones'),
        ('BIODIVERSIDAD', 'Afectación a Biodiversidad'),
        ('ENERGIA', 'Uso de Energía'),
        ('OTRO', 'Otro'),
    ]

    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    tipo = models.CharField(
        max_length=30,
        choices=TIPO_CHOICES,
        verbose_name='Tipo de Aspecto'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    impactos_asociados = models.TextField(
        blank=True,
        verbose_name='Impactos Ambientales Asociados',
        help_text='Posibles impactos que puede generar este tipo de aspecto'
    )
    requisitos_legales = models.TextField(
        blank=True,
        verbose_name='Requisitos Legales Aplicables',
        help_text='Normatividad colombiana aplicable (ej: Decreto 1076/2015)'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')

    class Meta:
        db_table = 'aspectos_amb_categoria'
        verbose_name = 'Categoría de Aspecto Ambiental'
        verbose_name_plural = 'Categorías de Aspectos Ambientales'
        ordering = ['tipo', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class AspectoAmbiental(models.Model):
    """
    Aspectos ambientales identificados en procesos/actividades
    Evaluación de significancia según ISO 14001
    """
    CONDICION_CHOICES = [
        ('NORMAL', 'Operación Normal'),
        ('ANORMAL', 'Operación Anormal'),
        ('EMERGENCIA', 'Situación de Emergencia'),
    ]

    TIEMPO_CHOICES = [
        ('PASADO', 'Pasado'),
        ('PRESENTE', 'Presente'),
        ('FUTURO', 'Futuro'),
    ]

    SIGNIFICANCIA_CHOICES = [
        ('NO_SIGNIFICATIVO', 'No Significativo'),
        ('SIGNIFICATIVO', 'Significativo'),
        ('CRITICO', 'Crítico'),
    ]

    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('VIGENTE', 'Vigente'),
        ('EN_REVISION', 'En Revisión'),
        ('OBSOLETO', 'Obsoleto'),
    ]

    # Identificación del aspecto
    codigo = models.CharField(
        max_length=50,
        verbose_name='Código',
        help_text='Código único del aspecto'
    )
    categoria = models.ForeignKey(
        CategoriaAspecto,
        on_delete=models.PROTECT,
        related_name='aspectos',
        verbose_name='Categoría'
    )
    proceso = models.CharField(
        max_length=200,
        verbose_name='Proceso',
        help_text='Proceso donde se identifica el aspecto'
    )
    actividad = models.CharField(
        max_length=300,
        verbose_name='Actividad'
    )
    descripcion_aspecto = models.TextField(
        verbose_name='Descripción del Aspecto Ambiental',
        help_text='Elemento de las actividades que puede interactuar con el ambiente'
    )

    # Condición y temporalidad
    condicion_operacion = models.CharField(
        max_length=20,
        choices=CONDICION_CHOICES,
        default='NORMAL',
        verbose_name='Condición de Operación'
    )
    tiempo_verbo = models.CharField(
        max_length=20,
        choices=TIEMPO_CHOICES,
        default='PRESENTE',
        verbose_name='Temporalidad',
        help_text='¿Cuándo ocurre el aspecto?'
    )

    # Criterios de evaluación de significancia (escala 1-5)
    # Según ISO 14001: frecuencia × severidad × probabilidad
    frecuencia = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Frecuencia',
        help_text='1=Muy Baja, 2=Baja, 3=Media, 4=Alta, 5=Muy Alta'
    )
    severidad = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Severidad del Impacto',
        help_text='1=Muy Baja, 2=Baja, 3=Media, 4=Alta, 5=Muy Alta'
    )
    probabilidad = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Probabilidad de Ocurrencia',
        help_text='1=Muy Baja, 2=Baja, 3=Media, 4=Alta, 5=Muy Alta'
    )

    # Criterios adicionales
    alcance = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
        verbose_name='Alcance/Extensión',
        help_text='Área afectada: 1=Puntual, 5=Regional'
    )
    reversibilidad = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
        verbose_name='Reversibilidad',
        help_text='Capacidad de recuperación: 1=Totalmente reversible, 5=Irreversible'
    )
    cumplimiento_legal = models.BooleanField(
        default=True,
        verbose_name='Cumplimiento Legal',
        help_text='¿Se cumple la normatividad aplicable?'
    )
    quejas_comunidad = models.BooleanField(
        default=False,
        verbose_name='Quejas de la Comunidad',
        help_text='¿Ha generado quejas de partes interesadas?'
    )

    # Cálculos automáticos
    valor_significancia = models.PositiveIntegerField(
        editable=False,
        default=0,
        verbose_name='Valor de Significancia',
        help_text='Frecuencia × Severidad × Probabilidad'
    )
    significancia = models.CharField(
        max_length=20,
        choices=SIGNIFICANCIA_CHOICES,
        editable=False,
        verbose_name='Significancia'
    )

    # Impactos asociados
    descripcion_impacto = models.TextField(
        verbose_name='Descripción del Impacto Ambiental',
        help_text='Cambio en el medio ambiente como resultado del aspecto'
    )
    tipo_impacto = models.CharField(
        max_length=20,
        choices=[('NEGATIVO', 'Negativo'), ('POSITIVO', 'Positivo')],
        default='NEGATIVO',
        verbose_name='Tipo de Impacto'
    )

    # Controles existentes
    controles_actuales = models.TextField(
        blank=True,
        verbose_name='Controles Actuales',
        help_text='Medidas de control implementadas actualmente'
    )
    procedimientos_asociados = models.TextField(
        blank=True,
        verbose_name='Procedimientos Asociados',
        help_text='Procedimientos operacionales que controlan el aspecto'
    )

    # Número de personas/áreas afectadas
    areas_afectadas = models.TextField(
        blank=True,
        verbose_name='Áreas Afectadas',
        help_text='Ubicaciones donde se presenta el aspecto'
    )

    # Requisito legal
    requisito_legal_aplicable = models.TextField(
        blank=True,
        verbose_name='Requisito Legal Aplicable',
        help_text='Normatividad colombiana específica (Decretos, Resoluciones)'
    )

    # Gestión
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR',
        verbose_name='Estado'
    )
    fecha_identificacion = models.DateField(
        verbose_name='Fecha de Identificación'
    )
    proxima_evaluacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próxima Evaluación'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='aspectos_ambientales_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'aspectos_amb_aspecto'
        verbose_name = 'Aspecto Ambiental'
        verbose_name_plural = 'Aspectos Ambientales'
        ordering = ['-valor_significancia', 'proceso']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'significancia']),
            models.Index(fields=['empresa_id', 'proceso']),
            models.Index(fields=['categoria', 'significancia']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.proceso} - {self.actividad[:30]}"

    def save(self, *args, **kwargs):
        """Calcular significancia automáticamente"""
        # Cálculo base: frecuencia × severidad × probabilidad
        self.valor_significancia = (
            self.frecuencia * self.severidad * self.probabilidad
        )

        # Ajustar por criterios adicionales
        # Incrementar si alcance es alto
        if self.alcance >= 4:
            self.valor_significancia += 10

        # Incrementar si irreversible
        if self.reversibilidad >= 4:
            self.valor_significancia += 10

        # Incrementar significativamente si no cumple legal
        if not self.cumplimiento_legal:
            self.valor_significancia += 50

        # Incrementar si hay quejas
        if self.quejas_comunidad:
            self.valor_significancia += 25

        # Determinar categoría de significancia
        self.significancia = self._calcular_categoria_significancia()

        super().save(*args, **kwargs)

    def _calcular_categoria_significancia(self):
        """
        Determina categoría de significancia basada en valor calculado

        Rangos:
        - < 50: No Significativo
        - 50-99: Significativo
        - >= 100: Crítico
        """
        valor = self.valor_significancia

        if valor >= 100:
            return 'CRITICO'
        elif valor >= 50:
            return 'SIGNIFICATIVO'
        else:
            return 'NO_SIGNIFICATIVO'

    def get_nivel_prioridad(self):
        """Obtiene nivel de prioridad para planes de acción"""
        if self.significancia == 'CRITICO':
            return 'INMEDIATO'
        elif self.significancia == 'SIGNIFICATIVO':
            return 'ALTO'
        else:
            return 'BAJO'


class ImpactoAmbiental(models.Model):
    """
    Impactos ambientales específicos derivados de aspectos
    Permite múltiples impactos por aspecto
    """
    MAGNITUD_CHOICES = [
        ('MUY_BAJA', 'Muy Baja'),
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('MUY_ALTA', 'Muy Alta'),
    ]

    COMPONENTE_CHOICES = [
        ('AIRE', 'Aire'),
        ('AGUA', 'Agua'),
        ('SUELO', 'Suelo'),
        ('FLORA', 'Flora'),
        ('FAUNA', 'Fauna'),
        ('PAISAJE', 'Paisaje'),
        ('SOCIAL', 'Social'),
        ('ECONOMICO', 'Económico'),
    ]

    aspecto = models.ForeignKey(
        AspectoAmbiental,
        on_delete=models.CASCADE,
        related_name='impactos',
        verbose_name='Aspecto Ambiental'
    )
    codigo = models.CharField(
        max_length=50,
        verbose_name='Código del Impacto'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre del Impacto'
    )
    descripcion = models.TextField(
        verbose_name='Descripción del Impacto',
        help_text='Cambio ambiental resultante del aspecto'
    )

    # Componente afectado
    componente_ambiental = models.CharField(
        max_length=20,
        choices=COMPONENTE_CHOICES,
        verbose_name='Componente Ambiental Afectado'
    )

    # Caracterización del impacto
    tipo_impacto = models.CharField(
        max_length=20,
        choices=[('NEGATIVO', 'Negativo'), ('POSITIVO', 'Positivo')],
        default='NEGATIVO',
        verbose_name='Tipo de Impacto'
    )
    magnitud = models.CharField(
        max_length=20,
        choices=MAGNITUD_CHOICES,
        verbose_name='Magnitud del Impacto'
    )
    duracion = models.CharField(
        max_length=20,
        choices=[
            ('TEMPORAL', 'Temporal (< 1 año)'),
            ('MEDIO_PLAZO', 'Medio Plazo (1-5 años)'),
            ('PERMANENTE', 'Permanente (> 5 años)'),
        ],
        verbose_name='Duración'
    )
    extension = models.CharField(
        max_length=20,
        choices=[
            ('PUNTUAL', 'Puntual'),
            ('LOCAL', 'Local'),
            ('REGIONAL', 'Regional'),
            ('NACIONAL', 'Nacional'),
        ],
        verbose_name='Extensión'
    )

    # Cuantificación (si aplica)
    valor_cuantitativo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Valor Cuantitativo',
        help_text='Ej: kg CO2, m³ agua, tons residuos'
    )
    unidad_medida = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Unidad de Medida'
    )

    # Medidas de mitigación/prevención
    medidas_control = models.TextField(
        blank=True,
        verbose_name='Medidas de Control',
        help_text='Acciones para prevenir, mitigar o compensar el impacto'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='impactos_ambientales_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'aspectos_amb_impacto'
        verbose_name = 'Impacto Ambiental'
        verbose_name_plural = 'Impactos Ambientales'
        ordering = ['aspecto', 'codigo']
        unique_together = ['aspecto', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'componente_ambiental']),
            models.Index(fields=['tipo_impacto', 'magnitud']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class ProgramaAmbiental(models.Model):
    """
    Programas de gestión ambiental para abordar aspectos significativos
    ISO 14001 Cláusula 6.1.4 - Planificación de acciones
    """
    ESTADO_CHOICES = [
        ('PLANIFICADO', 'Planificado'),
        ('EN_EJECUCION', 'En Ejecución'),
        ('COMPLETADO', 'Completado'),
        ('SUSPENDIDO', 'Suspendido'),
        ('CANCELADO', 'Cancelado'),
    ]

    TIPO_PROGRAMA_CHOICES = [
        ('PREVENCION', 'Prevención'),
        ('MITIGACION', 'Mitigación'),
        ('COMPENSACION', 'Compensación'),
        ('MEJORAMIENTO', 'Mejoramiento Continuo'),
        ('CUMPLIMIENTO', 'Cumplimiento Legal'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        verbose_name='Código del Programa'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre del Programa'
    )
    objetivo = models.TextField(
        verbose_name='Objetivo del Programa',
        help_text='Qué se pretende lograr con este programa'
    )
    tipo_programa = models.CharField(
        max_length=20,
        choices=TIPO_PROGRAMA_CHOICES,
        verbose_name='Tipo de Programa'
    )

    # Aspectos que atiende
    aspectos_relacionados = models.ManyToManyField(
        AspectoAmbiental,
        related_name='programas',
        verbose_name='Aspectos Ambientales Relacionados',
        help_text='Aspectos que este programa busca controlar'
    )

    # Responsabilidades
    responsable = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='programas_ambientales_responsable',
        verbose_name='Responsable del Programa'
    )
    equipo_apoyo = models.ManyToManyField(
        User,
        blank=True,
        related_name='programas_ambientales_equipo',
        verbose_name='Equipo de Apoyo'
    )

    # Planificación
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio Planificada'
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha de Fin Planificada'
    )
    actividades = models.TextField(
        verbose_name='Actividades del Programa',
        help_text='Descripción detallada de actividades a ejecutar'
    )

    # Metas e indicadores
    metas = models.TextField(
        verbose_name='Metas',
        help_text='Metas específicas, medibles y con plazo'
    )
    indicadores_medicion = models.TextField(
        blank=True,
        verbose_name='Indicadores de Medición',
        help_text='Cómo se medirá el progreso y cumplimiento'
    )

    # Recursos
    presupuesto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Presupuesto Asignado'
    )
    recursos_necesarios = models.TextField(
        blank=True,
        verbose_name='Recursos Necesarios',
        help_text='Recursos humanos, técnicos, financieros'
    )

    # Seguimiento
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PLANIFICADO',
        verbose_name='Estado'
    )
    porcentaje_avance = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0,
        verbose_name='Porcentaje de Avance'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Resultados
    fecha_completado = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Completación Real'
    )
    resultados_obtenidos = models.TextField(
        blank=True,
        verbose_name='Resultados Obtenidos',
        help_text='Descripción de logros y resultados al finalizar'
    )
    eficacia = models.CharField(
        max_length=20,
        choices=[
            ('NO_EVALUADO', 'No Evaluado'),
            ('EFICAZ', 'Eficaz'),
            ('PARCIALMENTE_EFICAZ', 'Parcialmente Eficaz'),
            ('NO_EFICAZ', 'No Eficaz'),
        ],
        default='NO_EVALUADO',
        verbose_name='Eficacia del Programa'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='programas_ambientales_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'aspectos_amb_programa'
        verbose_name = 'Programa Ambiental'
        verbose_name_plural = 'Programas Ambientales'
        ordering = ['-fecha_inicio', 'codigo']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['responsable', 'estado']),
            models.Index(fields=['fecha_inicio', 'fecha_fin']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def clean(self):
        """Validaciones personalizadas"""
        if self.fecha_fin and self.fecha_inicio:
            if self.fecha_fin < self.fecha_inicio:
                raise ValidationError(
                    'La fecha de fin no puede ser anterior a la fecha de inicio'
                )

    def get_duracion_dias(self):
        """Calcula duración del programa en días"""
        if self.fecha_inicio and self.fecha_fin:
            return (self.fecha_fin - self.fecha_inicio).days
        return None

    def is_vencido(self):
        """Verifica si el programa está vencido"""
        from django.utils import timezone
        if self.fecha_fin and self.estado not in ['COMPLETADO', 'CANCELADO']:
            return self.fecha_fin < timezone.now().date()
        return False


class MonitoreoAmbiental(models.Model):
    """
    Registros de monitoreo ambiental
    ISO 14001 Cláusula 9.1 - Seguimiento, medición, análisis y evaluación
    """
    TIPO_MONITOREO_CHOICES = [
        ('EMISION_ATMOSFERICA', 'Emisión Atmosférica'),
        ('CALIDAD_AGUA', 'Calidad del Agua'),
        ('VERTIMIENTO', 'Vertimiento'),
        ('RUIDO', 'Ruido Ambiental'),
        ('RESIDUOS', 'Gestión de Residuos'),
        ('CONSUMO_AGUA', 'Consumo de Agua'),
        ('CONSUMO_ENERGIA', 'Consumo de Energía'),
        ('CONSUMO_COMBUSTIBLE', 'Consumo de Combustible'),
        ('BIODIVERSIDAD', 'Biodiversidad'),
        ('SUELO', 'Calidad del Suelo'),
        ('OTRO', 'Otro'),
    ]

    FRECUENCIA_CHOICES = [
        ('DIARIA', 'Diaria'),
        ('SEMANAL', 'Semanal'),
        ('MENSUAL', 'Mensual'),
        ('TRIMESTRAL', 'Trimestral'),
        ('SEMESTRAL', 'Semestral'),
        ('ANUAL', 'Anual'),
        ('EVENTUAL', 'Eventual'),
    ]

    CUMPLIMIENTO_CHOICES = [
        ('CUMPLE', 'Cumple'),
        ('NO_CUMPLE', 'No Cumple'),
        ('NO_APLICA', 'No Aplica'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        verbose_name='Código de Monitoreo'
    )
    tipo_monitoreo = models.CharField(
        max_length=30,
        choices=TIPO_MONITOREO_CHOICES,
        verbose_name='Tipo de Monitoreo'
    )
    aspecto_relacionado = models.ForeignKey(
        AspectoAmbiental,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='monitoreos',
        verbose_name='Aspecto Ambiental Relacionado'
    )
    programa_relacionado = models.ForeignKey(
        ProgramaAmbiental,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='monitoreos',
        verbose_name='Programa Relacionado'
    )

    # Ubicación y fecha
    ubicacion = models.CharField(
        max_length=200,
        verbose_name='Ubicación del Monitoreo'
    )
    fecha_monitoreo = models.DateField(
        verbose_name='Fecha del Monitoreo'
    )
    hora_monitoreo = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora del Monitoreo'
    )
    frecuencia_requerida = models.CharField(
        max_length=20,
        choices=FRECUENCIA_CHOICES,
        verbose_name='Frecuencia Requerida'
    )

    # Mediciones
    parametro_medido = models.CharField(
        max_length=200,
        verbose_name='Parámetro Medido',
        help_text='Ej: pH, DBO, Material Particulado, dB(A), kWh'
    )
    valor_medido = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Valor Medido'
    )
    unidad_medida = models.CharField(
        max_length=50,
        verbose_name='Unidad de Medida'
    )
    valor_referencia = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name='Valor de Referencia/Límite',
        help_text='Límite legal o meta establecida'
    )

    # Cumplimiento
    cumplimiento = models.CharField(
        max_length=20,
        choices=CUMPLIMIENTO_CHOICES,
        verbose_name='Cumplimiento'
    )
    normatividad_aplicable = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Normatividad Aplicable',
        help_text='Resolución, Decreto o norma que establece el límite'
    )

    # Metodología
    metodo_medicion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Método de Medición',
        help_text='Método o norma técnica utilizada'
    )
    equipo_utilizado = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Equipo Utilizado'
    )
    responsable_medicion = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='monitoreos_ambientales_responsable',
        verbose_name='Responsable de la Medición'
    )

    # Laboratorio externo (si aplica)
    laboratorio_externo = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Laboratorio Externo',
        help_text='Si fue realizado por laboratorio acreditado'
    )
    numero_informe = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de Informe de Laboratorio'
    )

    # Observaciones y acciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    acciones_tomadas = models.TextField(
        blank=True,
        verbose_name='Acciones Tomadas',
        help_text='Acciones correctivas si no cumple'
    )

    # Evidencias
    evidencia_fotografica = models.TextField(
        blank=True,
        verbose_name='Evidencia Fotográfica',
        help_text='URLs o referencias a fotografías'
    )
    archivo_adjunto = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Archivo Adjunto',
        help_text='Ruta del informe o certificado'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='monitoreos_ambientales_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'aspectos_amb_monitoreo'
        verbose_name = 'Monitoreo Ambiental'
        verbose_name_plural = 'Monitoreos Ambientales'
        ordering = ['-fecha_monitoreo', 'tipo_monitoreo']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo_monitoreo']),
            models.Index(fields=['empresa_id', 'fecha_monitoreo']),
            models.Index(fields=['aspecto_relacionado', 'fecha_monitoreo']),
            models.Index(fields=['cumplimiento']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.get_tipo_monitoreo_display()} - {self.fecha_monitoreo}"

    def get_porcentaje_cumplimiento(self):
        """
        Calcula porcentaje de cumplimiento respecto al valor de referencia
        Retorna None si no hay valor de referencia
        """
        if self.valor_referencia and self.valor_referencia > 0:
            porcentaje = (self.valor_medido / self.valor_referencia) * 100
            return round(porcentaje, 2)
        return None

    def requiere_accion_correctiva(self):
        """Determina si requiere acción correctiva"""
        return self.cumplimiento == 'NO_CUMPLE'
