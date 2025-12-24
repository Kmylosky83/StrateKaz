"""
Modelos para Gestión de Emergencias
Manejo de análisis de vulnerabilidad, planes de emergencia, brigadas, simulacros y recursos
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class AnalisisVulnerabilidad(models.Model):
    """
    Análisis de Vulnerabilidad por Amenazas
    Evalúa vulnerabilidades ante amenazas naturales, tecnológicas y sociales
    """
    TIPO_AMENAZA_CHOICES = [
        ('NATURAL', 'Natural'),
        ('TECNOLOGICA', 'Tecnológica'),
        ('SOCIAL', 'Social'),
    ]

    NIVEL_VULNERABILIDAD_CHOICES = [
        ('BAJO', 'Bajo'),
        ('MEDIO', 'Medio'),
        ('ALTO', 'Alto'),
        ('CRITICO', 'Crítico'),
    ]

    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Información básica
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único del análisis (ej: AV-2024-001)"
    )
    nombre = models.CharField(max_length=255)
    tipo_amenaza = models.CharField(
        max_length=20,
        choices=TIPO_AMENAZA_CHOICES
    )
    fecha_analisis = models.DateField()

    # Análisis
    descripcion = models.TextField()
    metodologia_utilizada = models.TextField(
        help_text="Metodología utilizada para el análisis"
    )

    # Evaluación
    nivel_vulnerabilidad = models.CharField(
        max_length=20,
        choices=NIVEL_VULNERABILIDAD_CHOICES
    )
    puntuacion_vulnerabilidad = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Puntuación de 0 a 100"
    )

    # Resultados
    hallazgos = models.TextField(
        blank=True,
        help_text="Principales hallazgos del análisis"
    )
    recomendaciones = models.TextField(
        blank=True,
        help_text="Recomendaciones de mitigación"
    )

    # Responsables
    responsable_analisis = models.CharField(
        max_length=255,
        help_text="Persona o equipo responsable del análisis"
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('BORRADOR', 'Borrador'),
            ('EN_REVISION', 'En Revisión'),
            ('APROBADO', 'Aprobado'),
            ('ACTUALIZADO', 'Actualizado'),
        ],
        default='BORRADOR'
    )
    fecha_aprobacion = models.DateField(null=True, blank=True)
    aprobado_por = models.CharField(max_length=255, blank=True)

    # Próxima revisión
    proxima_revision = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha programada para próxima revisión"
    )

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    creado_por = models.CharField(max_length=255, blank=True)
    actualizado_por = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'emergencias_analisis_vulnerabilidad'
        verbose_name = 'Análisis de Vulnerabilidad'
        verbose_name_plural = 'Análisis de Vulnerabilidad'
        ordering = ['-fecha_analisis', '-codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['tipo_amenaza', 'nivel_vulnerabilidad']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Amenaza(models.Model):
    """
    Amenazas Identificadas
    Registro de amenazas específicas identificadas en el análisis
    """
    CATEGORIA_CHOICES = [
        # Naturales
        ('SISMO', 'Sismo'),
        ('INUNDACION', 'Inundación'),
        ('DESLIZAMIENTO', 'Deslizamiento'),
        ('VENDAVAL', 'Vendaval'),
        ('TORMENTA_ELECTRICA', 'Tormenta Eléctrica'),
        # Tecnológicas
        ('INCENDIO', 'Incendio'),
        ('EXPLOSION', 'Explosión'),
        ('FUGA_QUIMICA', 'Fuga Química'),
        ('FALLA_ESTRUCTURAL', 'Falla Estructural'),
        ('FALLA_ELECTRICA', 'Falla Eléctrica'),
        # Sociales
        ('TERRORISMO', 'Terrorismo'),
        ('VANDALISMO', 'Vandalismo'),
        ('DISTURBIOS', 'Disturbios'),
        ('ROBO', 'Robo'),
        ('SECUESTRO', 'Secuestro'),
        ('OTRA', 'Otra'),
    ]

    PROBABILIDAD_CHOICES = [
        ('MUY_BAJA', 'Muy Baja'),
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('MUY_ALTA', 'Muy Alta'),
    ]

    SEVERIDAD_CHOICES = [
        ('INSIGNIFICANTE', 'Insignificante'),
        ('MENOR', 'Menor'),
        ('MODERADA', 'Moderada'),
        ('MAYOR', 'Mayor'),
        ('CATASTROFICA', 'Catastrófica'),
    ]

    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Relación con análisis
    analisis_vulnerabilidad = models.ForeignKey(
        AnalisisVulnerabilidad,
        on_delete=models.CASCADE,
        related_name='amenazas'
    )

    # Información de la amenaza
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único de la amenaza (ej: AMZ-INC-001)"
    )
    categoria = models.CharField(max_length=30, choices=CATEGORIA_CHOICES)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()

    # Evaluación de riesgo
    probabilidad = models.CharField(
        max_length=20,
        choices=PROBABILIDAD_CHOICES,
        help_text="Probabilidad de ocurrencia"
    )
    valor_probabilidad = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Valor numérico: 1=Muy Baja, 5=Muy Alta"
    )

    severidad = models.CharField(
        max_length=20,
        choices=SEVERIDAD_CHOICES,
        help_text="Severidad del impacto"
    )
    valor_severidad = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Valor numérico: 1=Insignificante, 5=Catastrófica"
    )

    nivel_riesgo = models.IntegerField(
        editable=False,
        help_text="Nivel de riesgo calculado (probabilidad × severidad)"
    )

    # Análisis de vulnerabilidad específica
    personas_afectadas_potenciales = models.IntegerField(
        default=0,
        help_text="Número estimado de personas que podrían verse afectadas"
    )
    areas_criticas_afectadas = models.TextField(
        blank=True,
        help_text="Áreas críticas que podrían verse afectadas"
    )

    # Medidas de prevención/mitigación
    medidas_prevencion = models.TextField(
        blank=True,
        help_text="Medidas actuales de prevención"
    )
    medidas_propuestas = models.TextField(
        blank=True,
        help_text="Medidas adicionales propuestas"
    )

    # Estado
    requiere_plan_accion = models.BooleanField(
        default=False,
        help_text="Requiere plan de acción específico"
    )

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'emergencias_amenazas'
        verbose_name = 'Amenaza'
        verbose_name_plural = 'Amenazas'
        ordering = ['-nivel_riesgo', 'nombre']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['categoria', 'nivel_riesgo']),
        ]

    def save(self, *args, **kwargs):
        # Calcular nivel de riesgo automáticamente
        self.nivel_riesgo = self.valor_probabilidad * self.valor_severidad
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def nivel_riesgo_texto(self):
        """Clasificación textual del nivel de riesgo"""
        if self.nivel_riesgo <= 4:
            return "Bajo"
        elif self.nivel_riesgo <= 10:
            return "Medio"
        elif self.nivel_riesgo <= 15:
            return "Alto"
        else:
            return "Crítico"


class PlanEmergencia(models.Model):
    """
    Plan de Emergencias
    Plan general de respuesta ante emergencias
    """
    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Información básica
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único del plan (ej: PE-2024)"
    )
    nombre = models.CharField(max_length=255)
    version = models.CharField(
        max_length=20,
        help_text="Versión del plan (ej: 1.0, 2.1)"
    )

    # Fechas
    fecha_elaboracion = models.DateField()
    fecha_vigencia = models.DateField(
        help_text="Fecha desde la cual está vigente"
    )
    fecha_revision = models.DateField(
        help_text="Fecha programada de revisión"
    )

    # Alcance
    alcance = models.TextField(
        help_text="Alcance del plan de emergencias"
    )
    objetivos = models.TextField(
        help_text="Objetivos del plan"
    )

    # Estructura organizacional
    director_emergencias = models.CharField(
        max_length=255,
        help_text="Director de emergencias"
    )
    coordinador_emergencias = models.CharField(
        max_length=255,
        help_text="Coordinador de emergencias"
    )
    estructura_organizacional = models.TextField(
        blank=True,
        help_text="Descripción de la estructura organizacional para emergencias"
    )

    # Información general
    descripcion_instalaciones = models.TextField(
        blank=True,
        help_text="Descripción de las instalaciones cubiertas"
    )
    numero_personas = models.IntegerField(
        default=0,
        help_text="Número aproximado de personas en las instalaciones"
    )
    horarios_operacion = models.TextField(
        blank=True,
        help_text="Horarios de operación"
    )

    # Contactos de emergencia
    contactos_emergencia = models.JSONField(
        default=dict,
        blank=True,
        help_text="Listado de contactos de emergencia (bomberos, policía, etc.)"
    )

    # Documentos
    documento_plan = models.FileField(
        upload_to='emergencias/planes/',
        null=True,
        blank=True,
        help_text="Documento del plan de emergencias"
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('BORRADOR', 'Borrador'),
            ('EN_REVISION', 'En Revisión'),
            ('APROBADO', 'Aprobado'),
            ('VIGENTE', 'Vigente'),
            ('DESACTUALIZADO', 'Desactualizado'),
        ],
        default='BORRADOR'
    )
    fecha_aprobacion = models.DateField(null=True, blank=True)
    aprobado_por = models.CharField(max_length=255, blank=True)

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    creado_por = models.CharField(max_length=255, blank=True)
    actualizado_por = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'emergencias_planes'
        verbose_name = 'Plan de Emergencia'
        verbose_name_plural = 'Planes de Emergencia'
        ordering = ['-fecha_elaboracion', '-version']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} (v{self.version})"


class ProcedimientoEmergencia(models.Model):
    """
    Procedimientos Operativos Normalizados (PON) para Emergencias
    Procedimientos específicos por tipo de emergencia
    """
    TIPO_EMERGENCIA_CHOICES = [
        ('INCENDIO', 'Incendio'),
        ('SISMO', 'Sismo'),
        ('EXPLOSION', 'Explosión'),
        ('FUGA_QUIMICA', 'Fuga Química'),
        ('INUNDACION', 'Inundación'),
        ('AMENAZA_BOMBA', 'Amenaza de Bomba'),
        ('ACCIDENTE_GRAVE', 'Accidente Grave'),
        ('EMERGENCIA_MEDICA', 'Emergencia Médica'),
        ('DISTURBIOS', 'Disturbios'),
        ('EVACUACION_GENERAL', 'Evacuación General'),
        ('OTRA', 'Otra'),
    ]

    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Relación con plan
    plan_emergencia = models.ForeignKey(
        PlanEmergencia,
        on_delete=models.CASCADE,
        related_name='procedimientos'
    )

    # Información básica
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único del PON (ej: PON-INC-001)"
    )
    tipo_emergencia = models.CharField(
        max_length=30,
        choices=TIPO_EMERGENCIA_CHOICES
    )
    nombre = models.CharField(max_length=255)
    version = models.CharField(max_length=20, default='1.0')

    # Contenido del procedimiento
    objetivo = models.TextField(
        help_text="Objetivo del procedimiento"
    )
    alcance = models.TextField(
        help_text="Alcance del procedimiento"
    )
    responsables = models.TextField(
        help_text="Responsables de ejecutar el procedimiento"
    )

    # Pasos del procedimiento
    pasos_deteccion = models.TextField(
        blank=True,
        help_text="Pasos para detección de la emergencia"
    )
    pasos_alarma = models.TextField(
        blank=True,
        help_text="Pasos para activación de alarma"
    )
    pasos_comunicacion = models.TextField(
        blank=True,
        help_text="Pasos para comunicación"
    )
    pasos_respuesta = models.TextField(
        help_text="Pasos para respuesta a la emergencia"
    )
    pasos_evacuacion = models.TextField(
        blank=True,
        help_text="Pasos para evacuación si aplica"
    )
    pasos_seguimiento = models.TextField(
        blank=True,
        help_text="Pasos de seguimiento post-emergencia"
    )

    # Recursos necesarios
    recursos_necesarios = models.TextField(
        blank=True,
        help_text="Recursos necesarios para ejecutar el procedimiento"
    )

    # Documentos de apoyo
    diagrama_flujo = models.FileField(
        upload_to='emergencias/procedimientos/diagramas/',
        null=True,
        blank=True,
        help_text="Diagrama de flujo del procedimiento"
    )
    documento_pon = models.FileField(
        upload_to='emergencias/procedimientos/documentos/',
        null=True,
        blank=True,
        help_text="Documento completo del PON"
    )

    # Fechas
    fecha_elaboracion = models.DateField()
    fecha_revision = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha programada de revisión"
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('BORRADOR', 'Borrador'),
            ('APROBADO', 'Aprobado'),
            ('VIGENTE', 'Vigente'),
            ('OBSOLETO', 'Obsoleto'),
        ],
        default='BORRADOR'
    )

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'emergencias_procedimientos'
        verbose_name = 'Procedimiento de Emergencia'
        verbose_name_plural = 'Procedimientos de Emergencia'
        ordering = ['tipo_emergencia', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['tipo_emergencia']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class PlanoEvacuacion(models.Model):
    """
    Planos de Evacuación
    Planos con rutas de evacuación y puntos de encuentro
    """
    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Relación con plan
    plan_emergencia = models.ForeignKey(
        PlanEmergencia,
        on_delete=models.CASCADE,
        related_name='planos_evacuacion'
    )

    # Información básica
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único del plano (ej: PLANO-001)"
    )
    nombre = models.CharField(max_length=255)
    version = models.CharField(max_length=20, default='1.0')

    # Ubicación
    edificio = models.CharField(
        max_length=255,
        help_text="Edificio o instalación"
    )
    piso = models.CharField(
        max_length=50,
        help_text="Piso o nivel"
    )
    area = models.CharField(
        max_length=255,
        blank=True,
        help_text="Área específica cubierta"
    )

    # Detalles del plano
    descripcion = models.TextField(blank=True)
    capacidad_personas = models.IntegerField(
        default=0,
        help_text="Capacidad de personas en el área"
    )

    # Rutas de evacuación
    numero_rutas = models.IntegerField(
        default=1,
        help_text="Número de rutas de evacuación"
    )
    rutas_detalle = models.JSONField(
        default=list,
        blank=True,
        help_text="Detalle de cada ruta de evacuación"
    )

    # Puntos de encuentro
    puntos_encuentro = models.JSONField(
        default=list,
        blank=True,
        help_text="Puntos de encuentro designados"
    )
    punto_encuentro_principal = models.CharField(
        max_length=255,
        blank=True,
        help_text="Punto de encuentro principal"
    )
    punto_encuentro_alterno = models.CharField(
        max_length=255,
        blank=True,
        help_text="Punto de encuentro alterno"
    )

    # Recursos en el área
    salidas_emergencia = models.IntegerField(
        default=0,
        help_text="Número de salidas de emergencia"
    )
    extintores = models.IntegerField(
        default=0,
        help_text="Número de extintores"
    )
    alarmas = models.IntegerField(
        default=0,
        help_text="Número de alarmas"
    )
    botiquines = models.IntegerField(
        default=0,
        help_text="Número de botiquines"
    )

    # Archivo del plano
    archivo_plano = models.FileField(
        upload_to='emergencias/planos/',
        help_text="Archivo del plano de evacuación (PDF, imagen)"
    )
    plano_thumbnail = models.ImageField(
        upload_to='emergencias/planos/thumbnails/',
        null=True,
        blank=True,
        help_text="Miniatura del plano"
    )

    # Fechas
    fecha_elaboracion = models.DateField()
    fecha_actualizacion = models.DateField(
        auto_now=True,
        help_text="Última actualización del plano"
    )
    fecha_revision_programada = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha programada para revisión"
    )

    # Estado
    publicado = models.BooleanField(
        default=False,
        help_text="Plano publicado y disponible en las instalaciones"
    )
    ubicaciones_publicacion = models.TextField(
        blank=True,
        help_text="Ubicaciones donde está publicado el plano"
    )

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    creado_por = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'emergencias_planos_evacuacion'
        verbose_name = 'Plano de Evacuación'
        verbose_name_plural = 'Planos de Evacuación'
        ordering = ['edificio', 'piso', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['edificio', 'piso']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.edificio} {self.piso}"


class TipoBrigada(models.Model):
    """
    Tipos de Brigadas de Emergencia
    Catálogo de tipos de brigadas (primeros auxilios, evacuación, incendios, etc.)
    """
    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Información básica
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único del tipo (ej: TB-PA, TB-EV)"
    )
    nombre = models.CharField(
        max_length=255,
        help_text="Nombre del tipo de brigada (ej: Primeros Auxilios)"
    )
    descripcion = models.TextField(
        help_text="Descripción de las responsabilidades"
    )

    # Requisitos
    capacitacion_requerida = models.TextField(
        help_text="Capacitación requerida para brigadistas"
    )
    horas_capacitacion_minimas = models.IntegerField(
        default=0,
        help_text="Horas mínimas de capacitación requeridas"
    )
    certificacion_requerida = models.BooleanField(
        default=False,
        help_text="Requiere certificación formal"
    )

    # Recursos asociados
    equipamiento_requerido = models.TextField(
        blank=True,
        help_text="Equipamiento requerido para esta brigada"
    )

    # Prioridad y color
    nivel_prioridad = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Nivel de prioridad (1=más alta, 5=más baja)"
    )
    color_identificacion = models.CharField(
        max_length=7,
        blank=True,
        help_text="Color hexadecimal para identificación (ej: #FF0000)"
    )

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'emergencias_tipos_brigadas'
        verbose_name = 'Tipo de Brigada'
        verbose_name_plural = 'Tipos de Brigadas'
        ordering = ['nivel_prioridad', 'nombre']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Brigada(models.Model):
    """
    Brigadas de Emergencia Activas
    Brigadas conformadas y activas en la organización
    """
    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Tipo de brigada
    tipo_brigada = models.ForeignKey(
        TipoBrigada,
        on_delete=models.PROTECT,
        related_name='brigadas'
    )

    # Información básica
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único de la brigada (ej: BRG-PA-001)"
    )
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)

    # Ubicación
    sede = models.CharField(
        max_length=255,
        blank=True,
        help_text="Sede o ubicación de la brigada"
    )
    area_cobertura = models.TextField(
        blank=True,
        help_text="Área de cobertura de la brigada"
    )

    # Líder de brigada
    lider_brigada = models.CharField(
        max_length=255,
        help_text="Líder de la brigada"
    )
    lider_contacto = models.CharField(
        max_length=100,
        blank=True,
        help_text="Teléfono/contacto del líder"
    )

    # Capacidad
    numero_minimo_brigadistas = models.IntegerField(
        default=3,
        help_text="Número mínimo de brigadistas requerido"
    )
    numero_brigadistas_actuales = models.IntegerField(
        default=0,
        editable=False,
        help_text="Número actual de brigadistas activos"
    )

    # Equipamiento
    equipamiento_asignado = models.TextField(
        blank=True,
        help_text="Equipamiento asignado a la brigada"
    )
    ubicacion_equipamiento = models.CharField(
        max_length=255,
        blank=True,
        help_text="Ubicación del equipamiento"
    )

    # Fechas
    fecha_conformacion = models.DateField(
        help_text="Fecha de conformación de la brigada"
    )
    fecha_ultima_capacitacion = models.DateField(
        null=True,
        blank=True,
        help_text="Última capacitación grupal"
    )
    fecha_proxima_capacitacion = models.DateField(
        null=True,
        blank=True,
        help_text="Próxima capacitación programada"
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVA', 'Activa'),
            ('EN_FORMACION', 'En Formación'),
            ('INACTIVA', 'Inactiva'),
            ('DISUELTA', 'Disuelta'),
        ],
        default='EN_FORMACION'
    )

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    creado_por = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'emergencias_brigadas'
        verbose_name = 'Brigada'
        verbose_name_plural = 'Brigadas'
        ordering = ['tipo_brigada', 'nombre']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class BrigadistaActivo(models.Model):
    """
    Brigadistas Activos
    Miembros de brigadas con su capacitación y estado
    """
    GRUPO_SANGUINEO_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]

    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Brigada
    brigada = models.ForeignKey(
        Brigada,
        on_delete=models.CASCADE,
        related_name='brigadistas'
    )

    # Información personal
    codigo_empleado = models.CharField(
        max_length=50,
        help_text="Código del empleado"
    )
    nombre_completo = models.CharField(max_length=255)
    documento_identidad = models.CharField(max_length=50)
    cargo = models.CharField(max_length=255)
    area = models.CharField(max_length=255)

    # Contacto
    telefono = models.CharField(max_length=50)
    email = models.EmailField()
    contacto_emergencia = models.CharField(
        max_length=255,
        blank=True,
        help_text="Nombre y teléfono de contacto de emergencia"
    )

    # Información médica
    grupo_sanguineo = models.CharField(
        max_length=3,
        choices=GRUPO_SANGUINEO_CHOICES,
        blank=True
    )
    alergias = models.TextField(
        blank=True,
        help_text="Alergias conocidas"
    )
    condiciones_medicas = models.TextField(
        blank=True,
        help_text="Condiciones médicas relevantes"
    )

    # Rol en la brigada
    rol = models.CharField(
        max_length=50,
        choices=[
            ('LIDER', 'Líder'),
            ('SUBLIDER', 'Sublíder'),
            ('BRIGADISTA', 'Brigadista'),
        ],
        default='BRIGADISTA'
    )

    # Capacitación
    fecha_ingreso_brigada = models.DateField()
    fecha_capacitacion_inicial = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de capacitación inicial"
    )
    horas_capacitacion = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0,
        help_text="Total de horas de capacitación acumuladas"
    )
    certificado = models.FileField(
        upload_to='emergencias/brigadistas/certificados/',
        null=True,
        blank=True,
        help_text="Certificado de capacitación"
    )
    fecha_vencimiento_certificado = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de vencimiento del certificado"
    )

    # Participación en simulacros
    numero_simulacros_participados = models.IntegerField(
        default=0,
        help_text="Número de simulacros en los que ha participado"
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVO', 'Activo'),
            ('INACTIVO', 'Inactivo'),
            ('SUSPENDIDO', 'Suspendido'),
            ('RETIRADO', 'Retirado'),
        ],
        default='ACTIVO'
    )
    fecha_inactivacion = models.DateField(null=True, blank=True)
    motivo_inactivacion = models.TextField(blank=True)

    # Dotación
    dotacion_entregada = models.TextField(
        blank=True,
        help_text="Dotación entregada al brigadista"
    )
    fecha_entrega_dotacion = models.DateField(null=True, blank=True)

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'emergencias_brigadistas'
        verbose_name = 'Brigadista'
        verbose_name_plural = 'Brigadistas'
        ordering = ['brigada', 'nombre_completo']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['estado']),
            models.Index(fields=['documento_identidad']),
        ]
        unique_together = [['brigada', 'codigo_empleado']]

    def __str__(self):
        return f"{self.nombre_completo} - {self.brigada.nombre}"

    @property
    def certificado_vigente(self):
        """Verifica si el certificado está vigente"""
        if not self.fecha_vencimiento_certificado:
            return None
        from django.utils import timezone
        return self.fecha_vencimiento_certificado >= timezone.now().date()


class Simulacro(models.Model):
    """
    Simulacros de Emergencia
    Registro de simulacros programados y realizados
    """
    TIPO_SIMULACRO_CHOICES = [
        ('EVACUACION', 'Evacuación'),
        ('INCENDIO', 'Incendio'),
        ('SISMO', 'Sismo'),
        ('PRIMEROS_AUXILIOS', 'Primeros Auxilios'),
        ('FUGA_QUIMICA', 'Fuga Química'),
        ('AMENAZA_BOMBA', 'Amenaza de Bomba'),
        ('INTEGRAL', 'Integral'),
        ('OTRO', 'Otro'),
    ]

    ALCANCE_CHOICES = [
        ('PARCIAL', 'Parcial'),
        ('TOTAL', 'Total'),
        ('POR_AREAS', 'Por Áreas'),
    ]

    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Relación con plan
    plan_emergencia = models.ForeignKey(
        PlanEmergencia,
        on_delete=models.CASCADE,
        related_name='simulacros'
    )

    # Información básica
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único del simulacro (ej: SIM-2024-001)"
    )
    nombre = models.CharField(max_length=255)
    tipo_simulacro = models.CharField(
        max_length=30,
        choices=TIPO_SIMULACRO_CHOICES
    )
    alcance = models.CharField(
        max_length=20,
        choices=ALCANCE_CHOICES
    )

    # Planificación
    fecha_programada = models.DateTimeField(
        help_text="Fecha y hora programada"
    )
    fecha_realizada = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha y hora real de realización"
    )
    duracion_programada = models.IntegerField(
        help_text="Duración programada en minutos"
    )
    duracion_real = models.IntegerField(
        null=True,
        blank=True,
        help_text="Duración real en minutos"
    )

    # Objetivos
    objetivo_general = models.TextField()
    objetivos_especificos = models.TextField(
        blank=True,
        help_text="Objetivos específicos del simulacro"
    )

    # Escenario
    descripcion_escenario = models.TextField(
        help_text="Descripción del escenario de emergencia simulado"
    )
    ubicacion = models.CharField(
        max_length=255,
        help_text="Ubicación donde se realizará"
    )
    areas_involucradas = models.TextField(
        help_text="Áreas o departamentos involucrados"
    )

    # Participantes
    numero_participantes_esperados = models.IntegerField(
        default=0,
        help_text="Número esperado de participantes"
    )
    numero_participantes_reales = models.IntegerField(
        default=0,
        help_text="Número real de participantes"
    )
    brigadas_participantes = models.ManyToManyField(
        Brigada,
        blank=True,
        related_name='simulacros_participados'
    )

    # Responsables
    coordinador = models.CharField(
        max_length=255,
        help_text="Coordinador del simulacro"
    )
    observadores = models.TextField(
        blank=True,
        help_text="Observadores designados"
    )

    # Recursos
    recursos_utilizados = models.TextField(
        blank=True,
        help_text="Recursos utilizados en el simulacro"
    )

    # Resultados (si ya se realizó)
    fue_exitoso = models.BooleanField(
        default=False,
        help_text="Simulacro completado exitosamente"
    )
    observaciones = models.TextField(
        blank=True,
        help_text="Observaciones durante el simulacro"
    )
    fortalezas = models.TextField(
        blank=True,
        help_text="Fortalezas identificadas"
    )
    oportunidades_mejora = models.TextField(
        blank=True,
        help_text="Oportunidades de mejora identificadas"
    )

    # Documentación
    plan_simulacro = models.FileField(
        upload_to='emergencias/simulacros/planes/',
        null=True,
        blank=True,
        help_text="Plan detallado del simulacro"
    )
    informe_simulacro = models.FileField(
        upload_to='emergencias/simulacros/informes/',
        null=True,
        blank=True,
        help_text="Informe de resultados del simulacro"
    )
    evidencias_fotograficas = models.FileField(
        upload_to='emergencias/simulacros/fotos/',
        null=True,
        blank=True,
        help_text="Evidencias fotográficas"
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('PROGRAMADO', 'Programado'),
            ('CONFIRMADO', 'Confirmado'),
            ('REALIZADO', 'Realizado'),
            ('EVALUADO', 'Evaluado'),
            ('CANCELADO', 'Cancelado'),
            ('POSPUESTO', 'Pospuesto'),
        ],
        default='PROGRAMADO'
    )

    # Notificaciones
    notificar_participantes = models.BooleanField(
        default=False,
        help_text="Notificar a participantes con anticipación"
    )
    tipo_simulacro_anunciado = models.BooleanField(
        default=True,
        help_text="Simulacro anunciado o sorpresa"
    )

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    creado_por = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'emergencias_simulacros'
        verbose_name = 'Simulacro'
        verbose_name_plural = 'Simulacros'
        ordering = ['-fecha_programada']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['estado', 'fecha_programada']),
            models.Index(fields=['tipo_simulacro']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class EvaluacionSimulacro(models.Model):
    """
    Evaluación de Desempeño en Simulacros
    Evaluación detallada del desempeño en simulacros
    """
    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Relación con simulacro
    simulacro = models.ForeignKey(
        Simulacro,
        on_delete=models.CASCADE,
        related_name='evaluaciones'
    )

    # Información básica
    fecha_evaluacion = models.DateField()
    evaluador = models.CharField(
        max_length=255,
        help_text="Persona que realiza la evaluación"
    )
    cargo_evaluador = models.CharField(max_length=255, blank=True)

    # Criterios de evaluación (escala 1-5)
    tiempo_respuesta_calificacion = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Calificación del tiempo de respuesta (1-5)"
    )
    tiempo_respuesta_observaciones = models.TextField(blank=True)

    activacion_alarma_calificacion = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Calificación de activación de alarma (1-5)"
    )
    activacion_alarma_observaciones = models.TextField(blank=True)

    comunicacion_calificacion = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Calificación de comunicación (1-5)"
    )
    comunicacion_observaciones = models.TextField(blank=True)

    evacuacion_calificacion = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Calificación de evacuación (1-5)"
    )
    evacuacion_observaciones = models.TextField(blank=True)

    brigadas_calificacion = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Calificación de desempeño de brigadas (1-5)"
    )
    brigadas_observaciones = models.TextField(blank=True)

    punto_encuentro_calificacion = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Calificación de punto de encuentro (1-5)"
    )
    punto_encuentro_observaciones = models.TextField(blank=True)

    conteo_personas_calificacion = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Calificación de conteo de personas (1-5)"
    )
    conteo_personas_observaciones = models.TextField(blank=True)

    # Tiempos medidos
    tiempo_deteccion = models.IntegerField(
        null=True,
        blank=True,
        help_text="Tiempo de detección en segundos"
    )
    tiempo_alarma = models.IntegerField(
        null=True,
        blank=True,
        help_text="Tiempo de activación de alarma en segundos"
    )
    tiempo_evacuacion_total = models.IntegerField(
        null=True,
        blank=True,
        help_text="Tiempo total de evacuación en segundos"
    )

    # Resultados cuantitativos
    personas_evacuadas = models.IntegerField(
        default=0,
        help_text="Número de personas evacuadas"
    )
    personas_no_evacuadas = models.IntegerField(
        default=0,
        help_text="Número de personas que no evacuaron"
    )
    personas_heridas_simuladas = models.IntegerField(
        default=0,
        help_text="Número de personas con heridas simuladas atendidas"
    )

    # Calificación general
    calificacion_general = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        editable=False,
        help_text="Promedio de todas las calificaciones (1-5)"
    )
    calificacion_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        editable=False,
        help_text="Calificación en porcentaje (0-100)"
    )

    # Análisis general
    fortalezas_identificadas = models.TextField(
        help_text="Fortalezas identificadas durante el simulacro"
    )
    debilidades_identificadas = models.TextField(
        help_text="Debilidades identificadas durante el simulacro"
    )
    recomendaciones = models.TextField(
        help_text="Recomendaciones para mejora"
    )

    # Acciones correctivas
    requiere_acciones_correctivas = models.BooleanField(default=False)
    acciones_correctivas = models.TextField(
        blank=True,
        help_text="Acciones correctivas propuestas"
    )

    # Conclusión
    conclusion_general = models.TextField()
    aprobado = models.BooleanField(
        default=False,
        help_text="Simulacro aprobado según criterios establecidos"
    )

    # Archivo de evaluación
    documento_evaluacion = models.FileField(
        upload_to='emergencias/evaluaciones/',
        null=True,
        blank=True,
        help_text="Documento completo de evaluación"
    )

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'emergencias_evaluaciones_simulacro'
        verbose_name = 'Evaluación de Simulacro'
        verbose_name_plural = 'Evaluaciones de Simulacros'
        ordering = ['-fecha_evaluacion']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
        ]

    def save(self, *args, **kwargs):
        # Calcular calificación general
        calificaciones = [
            self.tiempo_respuesta_calificacion,
            self.activacion_alarma_calificacion,
            self.comunicacion_calificacion,
            self.evacuacion_calificacion,
            self.brigadas_calificacion,
            self.punto_encuentro_calificacion,
            self.conteo_personas_calificacion,
        ]
        promedio = sum(calificaciones) / len(calificaciones)
        self.calificacion_general = Decimal(str(round(promedio, 1)))
        self.calificacion_porcentaje = Decimal(str(round((promedio / 5) * 100, 2)))

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Evaluación {self.simulacro.codigo} - {self.fecha_evaluacion}"


class RecursoEmergencia(models.Model):
    """
    Recursos para Emergencias
    Registro de recursos como extintores, camillas, botiquines, etc.
    """
    TIPO_RECURSO_CHOICES = [
        ('EXTINTOR', 'Extintor'),
        ('BOTIQUIN', 'Botiquín'),
        ('CAMILLA', 'Camilla'),
        ('ALARMA', 'Alarma'),
        ('SEÑALIZACION', 'Señalización'),
        ('EQUIPO_COMUNICACION', 'Equipo de Comunicación'),
        ('LINTERNA', 'Linterna'),
        ('MEGAFONO', 'Megáfono'),
        ('EQUIPO_RESCATE', 'Equipo de Rescate'),
        ('DESFIBRILADOR', 'Desfibrilador'),
        ('OTRO', 'Otro'),
    ]

    ESTADO_RECURSO_CHOICES = [
        ('OPERATIVO', 'Operativo'),
        ('EN_MANTENIMIENTO', 'En Mantenimiento'),
        ('FUERA_SERVICIO', 'Fuera de Servicio'),
        ('DADO_BAJA', 'Dado de Baja'),
    ]

    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Información básica
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único del recurso (ej: EXT-001)"
    )
    tipo_recurso = models.CharField(
        max_length=30,
        choices=TIPO_RECURSO_CHOICES
    )
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)

    # Especificaciones técnicas
    marca = models.CharField(max_length=100, blank=True)
    modelo = models.CharField(max_length=100, blank=True)
    numero_serie = models.CharField(max_length=100, blank=True)
    capacidad = models.CharField(
        max_length=100,
        blank=True,
        help_text="Capacidad o especificación (ej: 10 libras, 50 personas)"
    )

    # Ubicación
    edificio = models.CharField(max_length=255, blank=True)
    piso = models.CharField(max_length=50, blank=True)
    area = models.CharField(max_length=255)
    ubicacion_especifica = models.CharField(
        max_length=255,
        blank=True,
        help_text="Ubicación específica dentro del área"
    )

    # Para extintores
    tipo_agente = models.CharField(
        max_length=50,
        blank=True,
        help_text="Tipo de agente extintor (ABC, CO2, etc.)"
    )
    peso_agente = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Peso del agente en libras o kg"
    )

    # Fechas importantes
    fecha_adquisicion = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de adquisición"
    )
    fecha_fabricacion = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de fabricación"
    )
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de vencimiento"
    )

    # Mantenimiento
    frecuencia_inspeccion = models.CharField(
        max_length=50,
        default='MENSUAL',
        choices=[
            ('SEMANAL', 'Semanal'),
            ('QUINCENAL', 'Quincenal'),
            ('MENSUAL', 'Mensual'),
            ('TRIMESTRAL', 'Trimestral'),
            ('SEMESTRAL', 'Semestral'),
            ('ANUAL', 'Anual'),
        ],
        help_text="Frecuencia de inspección requerida"
    )
    fecha_ultima_inspeccion = models.DateField(
        null=True,
        blank=True,
        help_text="Última inspección realizada"
    )
    fecha_proxima_inspeccion = models.DateField(
        null=True,
        blank=True,
        help_text="Próxima inspección programada"
    )
    fecha_ultima_recarga = models.DateField(
        null=True,
        blank=True,
        help_text="Última recarga (para extintores)"
    )
    fecha_proxima_recarga = models.DateField(
        null=True,
        blank=True,
        help_text="Próxima recarga programada"
    )

    # Responsable
    responsable = models.CharField(
        max_length=255,
        blank=True,
        help_text="Responsable del recurso"
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_RECURSO_CHOICES,
        default='OPERATIVO'
    )
    observaciones = models.TextField(blank=True)

    # Señalización
    tiene_señalizacion = models.BooleanField(
        default=True,
        help_text="Cuenta con señalización adecuada"
    )

    # Costo
    costo_adquisicion = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Costo de adquisición"
    )

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    creado_por = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'emergencias_recursos'
        verbose_name = 'Recurso de Emergencia'
        verbose_name_plural = 'Recursos de Emergencia'
        ordering = ['tipo_recurso', 'area', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['tipo_recurso', 'estado']),
            models.Index(fields=['fecha_proxima_inspeccion']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def requiere_inspeccion(self):
        """Verifica si requiere inspección"""
        if not self.fecha_proxima_inspeccion:
            return False
        from django.utils import timezone
        return self.fecha_proxima_inspeccion <= timezone.now().date()


class InspeccionRecurso(models.Model):
    """
    Inspecciones de Recursos de Emergencia
    Registro de inspecciones periódicas de recursos
    """
    RESULTADO_CHOICES = [
        ('CONFORME', 'Conforme'),
        ('NO_CONFORME_MENOR', 'No Conforme Menor'),
        ('NO_CONFORME_MAYOR', 'No Conforme Mayor'),
    ]

    # Multi-tenant
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )

    # Recurso inspeccionado
    recurso = models.ForeignKey(
        RecursoEmergencia,
        on_delete=models.CASCADE,
        related_name='inspecciones'
    )

    # Información de la inspección
    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único de la inspección (ej: INSP-EXT-001-2024-01)"
    )
    fecha_inspeccion = models.DateField()
    hora_inspeccion = models.TimeField(null=True, blank=True)

    # Inspector
    inspector = models.CharField(
        max_length=255,
        help_text="Persona que realizó la inspección"
    )
    cargo_inspector = models.CharField(max_length=255, blank=True)

    # Criterios de inspección (adaptables según tipo de recurso)
    estado_fisico_conforme = models.BooleanField(
        default=True,
        help_text="Estado físico general conforme"
    )
    estado_fisico_observaciones = models.TextField(blank=True)

    ubicacion_correcta = models.BooleanField(
        default=True,
        help_text="Ubicación correcta y accesible"
    )
    ubicacion_observaciones = models.TextField(blank=True)

    señalizacion_adecuada = models.BooleanField(
        default=True,
        help_text="Señalización adecuada y visible"
    )
    señalizacion_observaciones = models.TextField(blank=True)

    # Para extintores
    presion_adecuada = models.BooleanField(
        null=True,
        blank=True,
        help_text="Presión en rango adecuado (extintores)"
    )
    sello_seguridad_intacto = models.BooleanField(
        null=True,
        blank=True,
        help_text="Sello de seguridad intacto (extintores)"
    )
    manguera_boquilla_estado = models.BooleanField(
        null=True,
        blank=True,
        help_text="Manguera y boquilla en buen estado (extintores)"
    )

    # Para botiquines
    contenido_completo = models.BooleanField(
        null=True,
        blank=True,
        help_text="Contenido completo según lista (botiquines)"
    )
    medicamentos_vigentes = models.BooleanField(
        null=True,
        blank=True,
        help_text="Medicamentos vigentes (botiquines)"
    )

    # Resultado general
    resultado = models.CharField(
        max_length=30,
        choices=RESULTADO_CHOICES
    )
    observaciones_generales = models.TextField(blank=True)

    # Acciones requeridas
    requiere_mantenimiento = models.BooleanField(default=False)
    requiere_recarga = models.BooleanField(default=False)
    requiere_reemplazo = models.BooleanField(default=False)
    acciones_requeridas = models.TextField(
        blank=True,
        help_text="Descripción de acciones requeridas"
    )

    # Seguimiento
    acciones_realizadas = models.TextField(
        blank=True,
        help_text="Acciones realizadas posterior a la inspección"
    )
    fecha_cierre = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de cierre de hallazgos"
    )

    # Evidencias
    foto_inspeccion = models.ImageField(
        upload_to='emergencias/inspecciones/',
        null=True,
        blank=True,
        help_text="Fotografía de la inspección"
    )

    # Próxima inspección
    proxima_inspeccion_programada = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha programada para próxima inspección"
    )

    # Auditoría
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'emergencias_inspecciones_recursos'
        verbose_name = 'Inspección de Recurso'
        verbose_name_plural = 'Inspecciones de Recursos'
        ordering = ['-fecha_inspeccion']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['resultado']),
            models.Index(fields=['fecha_inspeccion']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.recurso.codigo}"
