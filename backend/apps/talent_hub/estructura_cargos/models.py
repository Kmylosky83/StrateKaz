"""
Modelos para Estructura de Cargos - Talent Hub
================================================================

Este módulo gestiona la estructura completa de cargos y vacantes:
- Profesiogramas: Perfiles de cargo con requisitos detallados
- Matriz de Competencias: Competencias técnicas y blandas por cargo
- Requisitos Especiales: Certificaciones, exámenes médicos, etc.
- Vacantes: Posiciones abiertas vinculadas a cargos

Integración:
- Vincula con apps.core.models.Cargo (estructura organizacional)
- Vincula con apps.gestion_estrategica.organizacion.Area
- Base para módulo de Selección y Contratación

Autor: Sistema ERP StrateKaz
Fecha: 2025-12-28
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.core.base_models import BaseCompanyModel


class Profesiograma(BaseCompanyModel):
    """
    Profesiograma - Perfil completo de cargo con todos los requisitos

    Define el perfil ideal del cargo con:
    - Requisitos de formación académica
    - Experiencia laboral requerida
    - Competencias técnicas y comportamentales
    - Requisitos de salud ocupacional
    - Exámenes médicos ocupacionales

    Vinculado a:
    - Cargo (FK): Cargo del organigrama
    - Area (FK): Área organizacional
    - MatrizCompetencia: Competencias detalladas
    - RequisitoEspecial: Requisitos adicionales

    Usado en:
    - Reclutamiento y selección de personal
    - Evaluación de desempeño
    - Planes de capacitación
    - Auditorías de SST (Res. 0312/2019)
    """

    # ==========================================================================
    # CHOICES
    # ==========================================================================
    NIVEL_EDUCATIVO_CHOICES = [
        ('PRIMARIA', 'Primaria'),
        ('BACHILLER', 'Bachiller'),
        ('TECNICO', 'Técnico'),
        ('TECNOLOGO', 'Tecnólogo'),
        ('PROFESIONAL', 'Profesional'),
        ('ESPECIALIZACION', 'Especialización'),
        ('MAESTRIA', 'Maestría'),
        ('DOCTORADO', 'Doctorado'),
    ]

    EXPERIENCIA_CHOICES = [
        ('SIN_EXPERIENCIA', 'Sin experiencia'),
        ('6_MESES', '6 meses'),
        ('1_ANO', '1 año'),
        ('2_ANOS', '2 años'),
        ('3_ANOS', '3 años'),
        ('4_ANOS', '4 años'),
        ('5_ANOS', '5 años'),
        ('7_ANOS', '7 años'),
        ('10_ANOS', '10+ años'),
    ]

    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('EN_REVISION', 'En Revisión'),
        ('APROBADO', 'Aprobado'),
        ('VIGENTE', 'Vigente'),
        ('OBSOLETO', 'Obsoleto'),
    ]

    # ==========================================================================
    # RELACIONES
    # ==========================================================================
    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        related_name='profesiogramas',
        verbose_name='Cargo',
        help_text='Cargo del organigrama al que aplica este profesiograma',
        db_index=True
    )
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='profesiogramas',
        verbose_name='Área',
        help_text='Área organizacional (hereda del cargo si no se especifica)',
        db_index=True
    )

    # ==========================================================================
    # IDENTIFICACIÓN
    # ==========================================================================
    codigo = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Código',
        help_text='Código único del profesiograma (ej: PROF-2025-001)',
        db_index=True
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del profesiograma'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción general del perfil del cargo'
    )
    version = models.CharField(
        max_length=20,
        default='1.0',
        verbose_name='Versión',
        help_text='Versión del profesiograma (ej: 1.0, 2.1)'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR',
        verbose_name='Estado',
        help_text='Estado actual del profesiograma',
        db_index=True
    )

    # ==========================================================================
    # REQUISITOS ACADÉMICOS
    # ==========================================================================
    nivel_educativo_minimo = models.CharField(
        max_length=20,
        choices=NIVEL_EDUCATIVO_CHOICES,
        verbose_name='Nivel Educativo Mínimo',
        help_text='Nivel de formación académica mínimo requerido'
    )
    titulo_requerido = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Título Requerido',
        help_text='Título profesional o técnico específico (ej: Ingeniero Industrial)'
    )
    areas_conocimiento = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Áreas de Conocimiento',
        help_text='Lista de áreas de conocimiento requeridas (JSON array)'
    )
    formacion_complementaria = models.TextField(
        blank=True,
        verbose_name='Formación Complementaria',
        help_text='Cursos, diplomados o formación adicional deseable'
    )

    # ==========================================================================
    # EXPERIENCIA LABORAL
    # ==========================================================================
    experiencia_minima = models.CharField(
        max_length=20,
        choices=EXPERIENCIA_CHOICES,
        default='SIN_EXPERIENCIA',
        verbose_name='Experiencia Mínima',
        help_text='Tiempo mínimo de experiencia laboral general'
    )
    experiencia_especifica = models.TextField(
        blank=True,
        verbose_name='Experiencia Específica',
        help_text='Descripción detallada de experiencia específica requerida en el sector/área'
    )
    experiencia_cargos_similares = models.BooleanField(
        default=False,
        verbose_name='Requiere Experiencia en Cargos Similares',
        help_text='Si se requiere experiencia previa en cargos del mismo nivel'
    )

    # ==========================================================================
    # COMPETENCIAS (Referencia a MatrizCompetencia)
    # ==========================================================================
    # Las competencias se gestionan en el modelo MatrizCompetencia
    # Aquí solo campos resumen para búsquedas rápidas
    competencias_tecnicas_resumen = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Competencias Técnicas (Resumen)',
        help_text='Lista resumida de competencias técnicas principales'
    )
    competencias_blandas_resumen = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Competencias Blandas (Resumen)',
        help_text='Lista resumida de competencias comportamentales principales'
    )

    # ==========================================================================
    # REQUISITOS DE SALUD OCUPACIONAL (SST)
    # ==========================================================================
    examenes_medicos_ingreso = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Exámenes Médicos de Ingreso',
        help_text='Lista de exámenes médicos ocupacionales requeridos al ingreso (Res. 2346/2007)'
    )
    examenes_medicos_periodicos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Exámenes Médicos Periódicos',
        help_text='Lista de exámenes médicos ocupacionales periódicos'
    )
    periodicidad_examenes = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Periodicidad de Exámenes',
        help_text='Frecuencia de exámenes periódicos (ej: Anual, Cada 2 años)'
    )
    restricciones_medicas = models.TextField(
        blank=True,
        verbose_name='Restricciones Médicas',
        help_text='Restricciones o contraindicaciones médicas para el cargo'
    )

    # ==========================================================================
    # RIESGOS LABORALES
    # ==========================================================================
    factores_riesgo = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Factores de Riesgo',
        help_text='Factores de riesgo ocupacional asociados al cargo (GTC-45)'
    )
    epp_requeridos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='EPP Requeridos',
        help_text='Elementos de Protección Personal obligatorios para el cargo'
    )

    # ==========================================================================
    # CERTIFICACIONES Y LICENCIAS
    # ==========================================================================
    requiere_licencia_conduccion = models.BooleanField(
        default=False,
        verbose_name='Requiere Licencia de Conducción',
        help_text='Si el cargo requiere licencia para operar vehículos'
    )
    categoria_licencia = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Categoría de Licencia',
        help_text='Categoría requerida (ej: A1, A2, B1, B2, C1, C2, C3)'
    )
    otras_certificaciones = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Otras Certificaciones',
        help_text='Certificaciones profesionales o técnicas requeridas'
    )

    # ==========================================================================
    # CONDICIONES DEL CARGO
    # ==========================================================================
    jornada_laboral = models.CharField(
        max_length=100,
        default='Lunes a Viernes 8:00 AM - 5:00 PM',
        verbose_name='Jornada Laboral',
        help_text='Horario y días de trabajo del cargo'
    )
    disponibilidad_viajar = models.BooleanField(
        default=False,
        verbose_name='Disponibilidad para Viajar',
        help_text='Si el cargo requiere disponibilidad para viajes'
    )
    disponibilidad_turnos = models.BooleanField(
        default=False,
        verbose_name='Disponibilidad para Turnos Rotativos',
        help_text='Si el cargo requiere trabajar en turnos rotativos'
    )
    condiciones_especiales = models.TextField(
        blank=True,
        verbose_name='Condiciones Especiales',
        help_text='Condiciones especiales de trabajo (altura, espacios confinados, etc.)'
    )

    # ==========================================================================
    # APROBACIÓN Y VIGENCIA
    # ==========================================================================
    fecha_aprobacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación',
        help_text='Fecha en que fue aprobado el profesiograma'
    )
    aprobado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='profesiogramas_aprobados',
        verbose_name='Aprobado por',
        help_text='Usuario que aprobó el profesiograma'
    )
    fecha_vigencia_inicio = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Inicio de Vigencia',
        help_text='Fecha desde la cual entra en vigencia'
    )
    fecha_vigencia_fin = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Fin de Vigencia',
        help_text='Fecha hasta la cual está vigente (null = indefinido)'
    )

    # ==========================================================================
    # OBSERVACIONES
    # ==========================================================================
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones generales o comentarios adicionales'
    )

    class Meta:
        db_table = 'talent_hub_profesiograma'
        verbose_name = 'Profesiograma'
        verbose_name_plural = 'Profesiogramas'
        ordering = ['-created_at', 'codigo']
        indexes = [
            models.Index(fields=['cargo', 'is_active']),
            models.Index(fields=['area', 'is_active']),
            models.Index(fields=['estado']),
            models.Index(fields=['codigo']),
            models.Index(fields=['fecha_vigencia_inicio', 'fecha_vigencia_fin']),
        ]
        unique_together = [['empresa', 'codigo']]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def esta_vigente(self):
        """Verifica si el profesiograma está vigente en la fecha actual"""
        if self.estado != 'VIGENTE':
            return False

        hoy = timezone.now().date()

        if self.fecha_vigencia_inicio and hoy < self.fecha_vigencia_inicio:
            return False

        if self.fecha_vigencia_fin and hoy > self.fecha_vigencia_fin:
            return False

        return True

    @property
    def total_competencias(self):
        """Cuenta el total de competencias asociadas"""
        return self.competencias.filter(is_active=True).count()

    @property
    def total_requisitos_especiales(self):
        """Cuenta el total de requisitos especiales asociados"""
        return self.requisitos_especiales.filter(is_active=True).count()

    def clean(self):
        """Validaciones del modelo"""
        from django.core.exceptions import ValidationError

        # Heredar área del cargo si no se especifica
        if not self.area and self.cargo and self.cargo.area:
            self.area = self.cargo.area

        # Validar fechas de vigencia
        if self.fecha_vigencia_inicio and self.fecha_vigencia_fin:
            if self.fecha_vigencia_fin < self.fecha_vigencia_inicio:
                raise ValidationError({
                    'fecha_vigencia_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'
                })

        # Si está aprobado, debe tener fecha de aprobación
        if self.estado == 'APROBADO' and not self.fecha_aprobacion:
            raise ValidationError({
                'fecha_aprobacion': 'Debe especificar la fecha de aprobación.'
            })

    def save(self, *args, **kwargs):
        """Override save para ejecutar clean automáticamente"""
        self.clean()
        super().save(*args, **kwargs)


class MatrizCompetencia(BaseCompanyModel):
    """
    Matriz de Competencias - Competencias técnicas y blandas requeridas por cargo

    Define las competencias específicas con:
    - Tipo: Técnica o Comportamental
    - Nivel requerido: Básico, Intermedio, Avanzado, Experto
    - Criticidad: Requerida, Deseable, Opcional
    - Criterios de evaluación

    Vinculado a:
    - Profesiograma (FK): Profesiograma al que pertenece

    Usado en:
    - Evaluación de candidatos en selección
    - Evaluación de desempeño
    - Detección de necesidades de capacitación
    - Planes de desarrollo individual
    """

    # ==========================================================================
    # CHOICES
    # ==========================================================================
    TIPO_COMPETENCIA_CHOICES = [
        ('TECNICA', 'Competencia Técnica'),
        ('COMPORTAMENTAL', 'Competencia Comportamental'),
        ('IDIOMA', 'Idioma'),
        ('SOFTWARE', 'Manejo de Software'),
        ('CERTIFICACION', 'Certificación'),
    ]

    NIVEL_REQUERIDO_CHOICES = [
        ('BASICO', 'Básico'),
        ('INTERMEDIO', 'Intermedio'),
        ('AVANZADO', 'Avanzado'),
        ('EXPERTO', 'Experto'),
    ]

    CRITICIDAD_CHOICES = [
        ('REQUERIDA', 'Requerida (Excluyente)'),
        ('DESEABLE', 'Deseable'),
        ('OPCIONAL', 'Opcional (Plus)'),
    ]

    # ==========================================================================
    # RELACIONES
    # ==========================================================================
    profesiograma = models.ForeignKey(
        Profesiograma,
        on_delete=models.CASCADE,
        related_name='competencias',
        verbose_name='Profesiograma',
        help_text='Profesiograma al que pertenece esta competencia',
        db_index=True
    )

    # ==========================================================================
    # COMPETENCIA
    # ==========================================================================
    tipo_competencia = models.CharField(
        max_length=20,
        choices=TIPO_COMPETENCIA_CHOICES,
        verbose_name='Tipo de Competencia',
        help_text='Clasificación de la competencia',
        db_index=True
    )
    nombre_competencia = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Competencia',
        help_text='Nombre descriptivo de la competencia (ej: Liderazgo, Excel Avanzado, Inglés)'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de la competencia'
    )

    # ==========================================================================
    # NIVEL Y CRITICIDAD
    # ==========================================================================
    nivel_requerido = models.CharField(
        max_length=20,
        choices=NIVEL_REQUERIDO_CHOICES,
        verbose_name='Nivel Requerido',
        help_text='Nivel de dominio requerido para la competencia'
    )
    criticidad = models.CharField(
        max_length=20,
        choices=CRITICIDAD_CHOICES,
        default='DESEABLE',
        verbose_name='Criticidad',
        help_text='Importancia de la competencia para el cargo'
    )
    peso_evaluacion = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name='Peso en Evaluación',
        help_text='Peso de la competencia en evaluación (1-10)'
    )

    # ==========================================================================
    # CRITERIOS DE EVALUACIÓN
    # ==========================================================================
    indicadores_nivel_basico = models.TextField(
        blank=True,
        verbose_name='Indicadores Nivel Básico',
        help_text='Descriptores conductuales para nivel básico'
    )
    indicadores_nivel_intermedio = models.TextField(
        blank=True,
        verbose_name='Indicadores Nivel Intermedio',
        help_text='Descriptores conductuales para nivel intermedio'
    )
    indicadores_nivel_avanzado = models.TextField(
        blank=True,
        verbose_name='Indicadores Nivel Avanzado',
        help_text='Descriptores conductuales para nivel avanzado'
    )
    indicadores_nivel_experto = models.TextField(
        blank=True,
        verbose_name='Indicadores Nivel Experto',
        help_text='Descriptores conductuales para nivel experto'
    )

    # ==========================================================================
    # DESARROLLO
    # ==========================================================================
    forma_desarrollo = models.TextField(
        blank=True,
        verbose_name='Forma de Desarrollo',
        help_text='Cómo se puede desarrollar esta competencia (cursos, práctica, etc.)'
    )
    recursos_recomendados = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Recursos Recomendados',
        help_text='Lista de cursos, libros o recursos para desarrollar la competencia'
    )

    # ==========================================================================
    # OBSERVACIONES
    # ==========================================================================
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones adicionales sobre la competencia'
    )

    class Meta:
        db_table = 'talent_hub_matriz_competencia'
        verbose_name = 'Matriz de Competencia'
        verbose_name_plural = 'Matrices de Competencias'
        ordering = ['profesiograma', '-criticidad', 'tipo_competencia', 'nombre_competencia']
        indexes = [
            models.Index(fields=['profesiograma', 'is_active']),
            models.Index(fields=['tipo_competencia']),
            models.Index(fields=['criticidad']),
            models.Index(fields=['nivel_requerido']),
        ]
        unique_together = [['profesiograma', 'nombre_competencia']]

    def __str__(self):
        return f"{self.nombre_competencia} ({self.get_tipo_competencia_display()}) - {self.get_nivel_requerido_display()}"

    @property
    def es_excluyente(self):
        """Verifica si la competencia es excluyente (requerida)"""
        return self.criticidad == 'REQUERIDA'


class RequisitoEspecial(BaseCompanyModel):
    """
    Requisito Especial - Requisitos adicionales específicos del cargo

    Gestiona requisitos particulares como:
    - Certificaciones profesionales
    - Licencias especiales
    - Exámenes médicos específicos
    - Aptitudes físicas
    - Disponibilidades especiales

    Vinculado a:
    - Profesiograma (FK): Profesiograma al que pertenece

    Usado en:
    - Validación de cumplimiento en selección
    - Auditorías de requisitos legales
    - Control de vencimientos de certificaciones
    """

    # ==========================================================================
    # CHOICES
    # ==========================================================================
    TIPO_REQUISITO_CHOICES = [
        ('CERTIFICACION', 'Certificación Profesional'),
        ('LICENCIA', 'Licencia/Permiso'),
        ('EXAMEN_MEDICO', 'Examen Médico Específico'),
        ('APTITUD_FISICA', 'Aptitud Física'),
        ('DISPONIBILIDAD', 'Disponibilidad Especial'),
        ('SEGURIDAD', 'Requisito de Seguridad'),
        ('TECNOLOGIA', 'Requisito Tecnológico'),
        ('OTRO', 'Otro'),
    ]

    CRITICIDAD_CHOICES = [
        ('OBLIGATORIO', 'Obligatorio (Legal)'),
        ('REQUERIDO', 'Requerido'),
        ('DESEABLE', 'Deseable'),
        ('OPCIONAL', 'Opcional'),
    ]

    # ==========================================================================
    # RELACIONES
    # ==========================================================================
    profesiograma = models.ForeignKey(
        Profesiograma,
        on_delete=models.CASCADE,
        related_name='requisitos_especiales',
        verbose_name='Profesiograma',
        help_text='Profesiograma al que pertenece este requisito',
        db_index=True
    )

    # ==========================================================================
    # REQUISITO
    # ==========================================================================
    tipo_requisito = models.CharField(
        max_length=20,
        choices=TIPO_REQUISITO_CHOICES,
        verbose_name='Tipo de Requisito',
        help_text='Clasificación del requisito especial',
        db_index=True
    )
    nombre_requisito = models.CharField(
        max_length=200,
        verbose_name='Nombre del Requisito',
        help_text='Nombre descriptivo del requisito (ej: Licencia SST, Curso de Alturas)'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada del requisito y su importancia'
    )

    # ==========================================================================
    # CRITICIDAD Y VALIDEZ
    # ==========================================================================
    criticidad = models.CharField(
        max_length=20,
        choices=CRITICIDAD_CHOICES,
        default='REQUERIDO',
        verbose_name='Criticidad',
        help_text='Nivel de importancia del requisito'
    )
    es_renovable = models.BooleanField(
        default=False,
        verbose_name='Es Renovable',
        help_text='Si el requisito tiene vigencia y debe renovarse periódicamente'
    )
    vigencia_meses = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        verbose_name='Vigencia (meses)',
        help_text='Tiempo de vigencia en meses si es renovable'
    )

    # ==========================================================================
    # ENTIDAD EMISORA
    # ==========================================================================
    entidad_emisora = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Entidad Emisora',
        help_text='Entidad que emite o certifica el requisito'
    )

    # ==========================================================================
    # VALIDACIÓN Y VERIFICACIÓN
    # ==========================================================================
    requiere_documento_soporte = models.BooleanField(
        default=True,
        verbose_name='Requiere Documento Soporte',
        help_text='Si se debe adjuntar documento que soporte el cumplimiento'
    )
    tipo_documento_soporte = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Tipo de Documento Soporte',
        help_text='Tipo de documento requerido (ej: Certificado, Diploma, Licencia)'
    )

    # ==========================================================================
    # BASE LEGAL
    # ==========================================================================
    base_legal = models.TextField(
        blank=True,
        verbose_name='Base Legal',
        help_text='Norma o decreto que establece el requisito (ej: Decreto 1072/2015)'
    )

    # ==========================================================================
    # OBSERVACIONES
    # ==========================================================================
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones adicionales sobre el requisito'
    )

    class Meta:
        db_table = 'talent_hub_requisito_especial'
        verbose_name = 'Requisito Especial'
        verbose_name_plural = 'Requisitos Especiales'
        ordering = ['profesiograma', '-criticidad', 'tipo_requisito', 'nombre_requisito']
        indexes = [
            models.Index(fields=['profesiograma', 'is_active']),
            models.Index(fields=['tipo_requisito']),
            models.Index(fields=['criticidad']),
        ]
        unique_together = [['profesiograma', 'nombre_requisito']]

    def __str__(self):
        return f"{self.nombre_requisito} ({self.get_tipo_requisito_display()})"

    @property
    def es_obligatorio_legal(self):
        """Verifica si el requisito es obligatorio por normativa legal"""
        return self.criticidad == 'OBLIGATORIO'


class Vacante(BaseCompanyModel):
    """
    Vacante - Posiciones abiertas vinculadas a cargos del organigrama

    Gestiona el proceso de reclutamiento con:
    - Posiciones disponibles por cargo
    - Motivo de la vacante
    - Presupuesto y condiciones salariales
    - Estado del proceso de reclutamiento
    - Fechas límite

    Vinculado a:
    - Cargo (FK): Cargo del organigrama
    - Profesiograma (FK): Perfil del cargo
    - Area (FK): Área organizacional

    Usado en:
    - Módulo de Selección y Contratación
    - Planificación de headcount
    - Presupuesto de nómina
    - Reportes de vacantes abiertas
    """

    # ==========================================================================
    # CHOICES
    # ==========================================================================
    MOTIVO_VACANTE_CHOICES = [
        ('NUEVA_POSICION', 'Nueva Posición (Crecimiento)'),
        ('REEMPLAZO_RENUNCIA', 'Reemplazo por Renuncia'),
        ('REEMPLAZO_RETIRO', 'Reemplazo por Retiro'),
        ('REEMPLAZO_DESPIDO', 'Reemplazo por Despido'),
        ('REEMPLAZO_TEMPORAL', 'Reemplazo Temporal (Licencia/Incapacidad)'),
        ('PROYECTO_TEMPORAL', 'Proyecto Temporal'),
        ('ROTACION_INTERNA', 'Rotación Interna'),
        ('OTRO', 'Otro'),
    ]

    ESTADO_VACANTE_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('PENDIENTE_APROBACION', 'Pendiente de Aprobación'),
        ('APROBADA', 'Aprobada'),
        ('PUBLICADA', 'Publicada'),
        ('EN_PROCESO', 'En Proceso de Selección'),
        ('FINALISTAS', 'Con Finalistas'),
        ('CERRADA_CONTRATADA', 'Cerrada - Contratada'),
        ('CERRADA_CANCELADA', 'Cerrada - Cancelada'),
        ('EN_ESPERA', 'En Espera'),
    ]

    TIPO_CONTRATO_CHOICES = [
        ('INDEFINIDO', 'Término Indefinido'),
        ('FIJO', 'Término Fijo'),
        ('OBRA_LABOR', 'Obra o Labor'),
        ('APRENDIZAJE', 'Aprendizaje'),
        ('PRESTACION_SERVICIOS', 'Prestación de Servicios'),
        ('TEMPORAL', 'Temporal'),
    ]

    PRIORIDAD_CHOICES = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('URGENTE', 'Urgente'),
    ]

    # ==========================================================================
    # RELACIONES
    # ==========================================================================
    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        related_name='vacantes',
        verbose_name='Cargo',
        help_text='Cargo del organigrama para el cual se abre la vacante',
        db_index=True
    )
    profesiograma = models.ForeignKey(
        Profesiograma,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vacantes',
        verbose_name='Profesiograma',
        help_text='Profesiograma de referencia para el perfil requerido',
        db_index=True
    )
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vacantes',
        verbose_name='Área',
        help_text='Área organizacional (hereda del cargo si no se especifica)',
        db_index=True
    )

    # ==========================================================================
    # IDENTIFICACIÓN
    # ==========================================================================
    codigo = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Código',
        help_text='Código único de la vacante (ej: VAC-2025-001)',
        db_index=True
    )
    titulo_vacante = models.CharField(
        max_length=200,
        verbose_name='Título de la Vacante',
        help_text='Título descriptivo de la vacante para publicación'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de la vacante y el rol'
    )

    # ==========================================================================
    # MOTIVO Y CANTIDAD
    # ==========================================================================
    motivo_vacante = models.CharField(
        max_length=30,
        choices=MOTIVO_VACANTE_CHOICES,
        verbose_name='Motivo de la Vacante',
        help_text='Razón por la cual se abre la vacante',
        db_index=True
    )
    cantidad_posiciones = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad de Posiciones',
        help_text='Número de personas a contratar para esta vacante'
    )
    posiciones_cubiertas = models.PositiveIntegerField(
        default=0,
        verbose_name='Posiciones Cubiertas',
        help_text='Número de posiciones ya cubiertas'
    )

    # ==========================================================================
    # ESTADO Y PRIORIDAD
    # ==========================================================================
    estado = models.CharField(
        max_length=30,
        choices=ESTADO_VACANTE_CHOICES,
        default='BORRADOR',
        verbose_name='Estado',
        help_text='Estado actual del proceso de reclutamiento',
        db_index=True
    )
    prioridad = models.CharField(
        max_length=20,
        choices=PRIORIDAD_CHOICES,
        default='MEDIA',
        verbose_name='Prioridad',
        help_text='Prioridad para cubrir la vacante',
        db_index=True
    )

    # ==========================================================================
    # CONDICIONES LABORALES
    # ==========================================================================
    tipo_contrato = models.CharField(
        max_length=30,
        choices=TIPO_CONTRATO_CHOICES,
        default='INDEFINIDO',
        verbose_name='Tipo de Contrato',
        help_text='Tipo de contrato laboral ofrecido'
    )
    salario_minimo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Salario Mínimo',
        help_text='Salario mínimo ofrecido para la posición'
    )
    salario_maximo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Salario Máximo',
        help_text='Salario máximo ofrecido para la posición'
    )
    salario_a_convenir = models.BooleanField(
        default=False,
        verbose_name='Salario a Convenir',
        help_text='Si el salario es negociable según experiencia'
    )
    beneficios_adicionales = models.TextField(
        blank=True,
        verbose_name='Beneficios Adicionales',
        help_text='Beneficios extralegales ofrecidos (bonos, seguros, etc.)'
    )

    # ==========================================================================
    # FECHAS
    # ==========================================================================
    fecha_apertura = models.DateField(
        default=timezone.now,
        verbose_name='Fecha de Apertura',
        help_text='Fecha en que se abrió la vacante'
    )
    fecha_cierre_estimada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cierre Estimada',
        help_text='Fecha estimada para cubrir la vacante'
    )
    fecha_cierre_real = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cierre Real',
        help_text='Fecha real en que se cerró la vacante'
    )
    fecha_incorporacion_deseada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Incorporación Deseada',
        help_text='Fecha deseada para que el candidato seleccionado inicie labores'
    )

    # ==========================================================================
    # APROBACIÓN
    # ==========================================================================
    aprobado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vacantes_aprobadas',
        verbose_name='Aprobado por',
        help_text='Usuario que aprobó la apertura de la vacante'
    )
    fecha_aprobacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación',
        help_text='Fecha en que fue aprobada la vacante'
    )

    # ==========================================================================
    # PUBLICACIÓN
    # ==========================================================================
    publicar_externamente = models.BooleanField(
        default=True,
        verbose_name='Publicar Externamente',
        help_text='Si la vacante se publica en portales de empleo externos'
    )
    canales_publicacion = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Canales de Publicación',
        help_text='Lista de canales donde se publicará (CompuTrabajo, LinkedIn, etc.)'
    )

    # ==========================================================================
    # RESPONSABLE
    # ==========================================================================
    responsable_reclutamiento = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vacantes_responsable',
        verbose_name='Responsable de Reclutamiento',
        help_text='Usuario de RRHH responsable del proceso de selección'
    )

    # ==========================================================================
    # OBSERVACIONES
    # ==========================================================================
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones generales sobre la vacante'
    )
    motivo_cierre = models.TextField(
        blank=True,
        verbose_name='Motivo de Cierre',
        help_text='Razón por la cual se cerró la vacante (si fue cancelada)'
    )

    class Meta:
        db_table = 'talent_hub_vacante'
        verbose_name = 'Vacante'
        verbose_name_plural = 'Vacantes'
        ordering = ['-fecha_apertura', '-prioridad', 'codigo']
        indexes = [
            models.Index(fields=['cargo', 'is_active']),
            models.Index(fields=['area', 'is_active']),
            models.Index(fields=['estado']),
            models.Index(fields=['prioridad']),
            models.Index(fields=['codigo']),
            models.Index(fields=['fecha_apertura']),
            models.Index(fields=['fecha_cierre_estimada']),
        ]
        unique_together = [['empresa', 'codigo']]

    def __str__(self):
        return f"{self.codigo} - {self.titulo_vacante} ({self.get_estado_display()})"

    @property
    def esta_abierta(self):
        """Verifica si la vacante está en estados activos de reclutamiento"""
        return self.estado in ['APROBADA', 'PUBLICADA', 'EN_PROCESO', 'FINALISTAS']

    @property
    def posiciones_pendientes(self):
        """Calcula el número de posiciones aún por cubrir"""
        return self.cantidad_posiciones - self.posiciones_cubiertas

    @property
    def dias_abierta(self):
        """Calcula los días que lleva abierta la vacante"""
        if self.fecha_cierre_real:
            return (self.fecha_cierre_real - self.fecha_apertura).days
        return (timezone.now().date() - self.fecha_apertura).days

    @property
    def esta_vencida(self):
        """Verifica si la vacante pasó la fecha estimada de cierre"""
        if not self.fecha_cierre_estimada:
            return False
        return timezone.now().date() > self.fecha_cierre_estimada and self.esta_abierta

    def clean(self):
        """Validaciones del modelo"""
        from django.core.exceptions import ValidationError

        # Heredar área del cargo si no se especifica
        if not self.area and self.cargo and self.cargo.area:
            self.area = self.cargo.area

        # Validar que posiciones cubiertas no excedan total
        if self.posiciones_cubiertas > self.cantidad_posiciones:
            raise ValidationError({
                'posiciones_cubiertas': 'No puede exceder el total de posiciones.'
            })

        # Validar rango salarial
        if self.salario_minimo and self.salario_maximo:
            if self.salario_maximo < self.salario_minimo:
                raise ValidationError({
                    'salario_maximo': 'El salario máximo no puede ser menor al mínimo.'
                })

        # Validar fechas
        if self.fecha_cierre_estimada and self.fecha_cierre_estimada < self.fecha_apertura:
            raise ValidationError({
                'fecha_cierre_estimada': 'La fecha de cierre no puede ser anterior a la apertura.'
            })

        if self.fecha_cierre_real and self.fecha_cierre_real < self.fecha_apertura:
            raise ValidationError({
                'fecha_cierre_real': 'La fecha de cierre real no puede ser anterior a la apertura.'
            })

    def save(self, *args, **kwargs):
        """Override save para ejecutar clean automáticamente"""
        self.clean()
        super().save(*args, **kwargs)
