"""
Modelos para Selección y Contratación - Talent Hub
Sistema de Gestión StrateKaz

Gestiona el proceso completo de reclutamiento, selección y contratación de personal:
- Vacantes activas
- Candidatos y postulaciones
- Entrevistas y evaluaciones
- Pruebas técnicas/psicotécnicas
- Tipos de contrato
- Afiliaciones a seguridad social

100% DINÁMICO: Todos los catálogos configurables desde la base de datos.
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal

from apps.core.base_models import BaseCompanyModel, OrderedModel


# ==============================================================================
# CATÁLOGOS DINÁMICOS
# ==============================================================================

class TipoContrato(OrderedModel):
    """
    Catálogo de tipos de contrato laboral (dinámico).

    Tipos comunes en Colombia:
    - Término indefinido
    - Término fijo
    - Obra o labor
    - Prestación de servicios
    - Aprendizaje (SENA)
    - Temporal
    """
    codigo = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de contrato (ej: INDEFINIDO, FIJO, OBRA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del tipo de contrato'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción y características del tipo de contrato'
    )
    requiere_duracion = models.BooleanField(
        default=False,
        verbose_name='Requiere duración',
        help_text='Indica si requiere especificar duración (término fijo, obra/labor)'
    )
    requiere_objeto = models.BooleanField(
        default=False,
        verbose_name='Requiere objeto contractual',
        help_text='Indica si requiere especificar objeto del contrato (obra/labor, servicios)'
    )
    color_badge = models.CharField(
        max_length=20,
        default='blue',
        verbose_name='Color del badge',
        help_text='Color para mostrar en el frontend (blue, green, yellow, red, gray)'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'talent_hub_tipo_contrato'
        verbose_name = 'Tipo de Contrato'
        verbose_name_plural = 'Tipos de Contrato'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.nombre


class TipoEntidad(OrderedModel):
    """
    Catálogo de tipos de entidades de seguridad social (dinámico).

    Tipos:
    - EPS (Entidad Promotora de Salud)
    - ARL (Administradora de Riesgos Laborales)
    - AFP (Administradora de Fondos de Pensiones)
    - CCF (Caja de Compensación Familiar)
    """
    codigo = models.CharField(
        max_length=10,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único (EPS, ARL, AFP, CCF)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del tipo de entidad'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    es_obligatorio = models.BooleanField(
        default=True,
        verbose_name='Es obligatorio',
        help_text='Indica si la afiliación a este tipo de entidad es obligatoria'
    )
    color_badge = models.CharField(
        max_length=20,
        default='blue',
        verbose_name='Color del badge'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'talent_hub_tipo_entidad'
        verbose_name = 'Tipo de Entidad'
        verbose_name_plural = 'Tipos de Entidad'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.nombre


class EntidadSeguridadSocial(OrderedModel):
    """
    Catálogo de entidades de seguridad social (dinámico).

    Ejemplos:
    - EPS: Sura, Salud Total, Nueva EPS, etc.
    - ARL: Sura ARL, Positiva, Bolívar, etc.
    - AFP: Porvenir, Protección, Colfondos, etc.
    - CCF: Comfenalco, Compensar, etc.
    """
    tipo_entidad = models.ForeignKey(
        TipoEntidad,
        on_delete=models.PROTECT,
        related_name='entidades',
        verbose_name='Tipo de entidad'
    )
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la entidad'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre comercial',
        help_text='Nombre comercial de la entidad'
    )
    razon_social = models.CharField(
        max_length=200,
        verbose_name='Razón social'
    )
    nit = models.CharField(
        max_length=20,
        verbose_name='NIT',
        help_text='NIT de la entidad'
    )
    telefono = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Teléfono'
    )
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name='Email'
    )
    sitio_web = models.URLField(
        blank=True,
        null=True,
        verbose_name='Sitio web'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'talent_hub_entidad_seguridad_social'
        verbose_name = 'Entidad de Seguridad Social'
        verbose_name_plural = 'Entidades de Seguridad Social'
        ordering = ['tipo_entidad__orden', 'orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['nit']),
            models.Index(fields=['tipo_entidad', 'is_active']),
        ]

    def __str__(self):
        return f"{self.tipo_entidad.codigo} - {self.nombre}"


class TipoPrueba(OrderedModel):
    """
    Catálogo de tipos de pruebas para candidatos (dinámico).

    Ejemplos:
    - Prueba técnica
    - Prueba psicotécnica
    - Examen médico
    - Polígrafo
    - Visita domiciliaria
    - Verificación de referencias
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de prueba'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del tipo de prueba'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    permite_calificacion = models.BooleanField(
        default=True,
        verbose_name='Permite calificación numérica',
        help_text='Indica si la prueba tiene una calificación numérica (ej: 0-100)'
    )
    requiere_archivo = models.BooleanField(
        default=False,
        verbose_name='Requiere adjuntar archivo',
        help_text='Indica si se requiere adjuntar archivo de resultado'
    )
    duracion_estimada_minutos = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Duración estimada (minutos)',
        help_text='Duración estimada de la prueba en minutos'
    )
    color_badge = models.CharField(
        max_length=20,
        default='purple',
        verbose_name='Color del badge'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'talent_hub_tipo_prueba'
        verbose_name = 'Tipo de Prueba'
        verbose_name_plural = 'Tipos de Prueba'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.nombre


# ==============================================================================
# MODELOS PRINCIPALES
# ==============================================================================

class VacanteActiva(BaseCompanyModel):
    """
    Vacante publicada y activa para reclutamiento.

    Representa una posición abierta que requiere ser llenada.
    Puede ser generada automáticamente desde el organigrama o creada manualmente.
    """

    ESTADO_CHOICES = [
        ('abierta', 'Abierta'),
        ('en_proceso', 'En Proceso'),
        ('cerrada', 'Cerrada'),
        ('cancelada', 'Cancelada'),
    ]

    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]

    MODALIDAD_CHOICES = [
        ('presencial', 'Presencial'),
        ('hibrido', 'Híbrido'),
        ('remoto', 'Remoto'),
    ]

    # Relación con estructura organizacional
    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='vacantes_activas',
        verbose_name='Cargo',
        help_text='Cargo del organigrama asociado a la vacante'
    )
    codigo_vacante = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código de vacante',
        help_text='Código único de la vacante (ej: VAC-2025-001)'
    )
    titulo = models.CharField(
        max_length=200,
        verbose_name='Título de la vacante',
        help_text='Título descriptivo de la posición'
    )
    cargo_requerido = models.CharField(
        max_length=200,
        blank=True,
        default='',
        verbose_name='Cargo requerido',
        help_text='Nombre del cargo (auto-poblado desde FK cargo)'
    )
    area = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Área',
        help_text='Área organizacional (auto-poblada desde cargo.area)'
    )

    # Detalles de la vacante
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción completa de la posición y responsabilidades'
    )
    requisitos_minimos = models.TextField(
        verbose_name='Requisitos mínimos',
        help_text='Requisitos mínimos indispensables (educación, experiencia, certificaciones)'
    )
    requisitos_deseables = models.TextField(
        blank=True,
        null=True,
        verbose_name='Requisitos deseables',
        help_text='Requisitos deseables pero no excluyentes'
    )
    funciones_principales = models.TextField(
        verbose_name='Funciones principales',
        help_text='Principales funciones y responsabilidades del cargo'
    )
    competencias_requeridas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Competencias requeridas',
        help_text='Competencias técnicas y blandas requeridas'
    )

    # Condiciones laborales
    tipo_contrato = models.ForeignKey(
        TipoContrato,
        on_delete=models.PROTECT,
        related_name='vacantes',
        verbose_name='Tipo de contrato'
    )
    salario_minimo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Salario mínimo',
        help_text='Salario mínimo ofrecido (COP)'
    )
    salario_maximo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Salario máximo',
        help_text='Salario máximo ofrecido (COP)'
    )
    salario_oculto = models.BooleanField(
        default=False,
        verbose_name='Salario oculto en publicación',
        help_text='No mostrar el salario en la publicación externa'
    )
    beneficios = models.TextField(
        blank=True,
        null=True,
        verbose_name='Beneficios adicionales',
        help_text='Beneficios adicionales al salario'
    )
    horario = models.CharField(
        max_length=200,
        verbose_name='Horario',
        help_text='Horario de trabajo (ej: Lun-Vie 8:00-17:00)'
    )
    modalidad = models.CharField(
        max_length=20,
        choices=MODALIDAD_CHOICES,
        default='presencial',
        verbose_name='Modalidad de trabajo'
    )
    ubicacion = models.CharField(
        max_length=200,
        verbose_name='Ubicación',
        help_text='Ubicación física del trabajo (ciudad, dirección)'
    )

    # Gestión de la vacante
    numero_posiciones = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Número de posiciones',
        help_text='Cantidad de personas a contratar para esta vacante'
    )
    posiciones_cubiertas = models.PositiveIntegerField(
        default=0,
        verbose_name='Posiciones cubiertas',
        help_text='Número de posiciones ya cubiertas por contratación'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='abierta',
        db_index=True,
        verbose_name='Estado'
    )
    prioridad = models.CharField(
        max_length=20,
        choices=PRIORIDAD_CHOICES,
        default='media',
        verbose_name='Prioridad'
    )
    fecha_apertura = models.DateField(
        default=timezone.now,
        verbose_name='Fecha de apertura'
    )
    fecha_cierre_esperada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de cierre esperada',
        help_text='Fecha estimada para cerrar el proceso'
    )
    fecha_cierre_real = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de cierre real',
        help_text='Fecha en la que efectivamente se cerró la vacante'
    )

    # Publicación
    publicada_externamente = models.BooleanField(
        default=False,
        verbose_name='Publicada externamente',
        help_text='Indica si la vacante está publicada en portales externos'
    )
    url_publicacion = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL de publicación',
        help_text='URL de la publicación externa si aplica'
    )

    # Responsables
    responsable_proceso = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='vacantes_activas_responsable',
        verbose_name='Responsable del proceso',
        help_text='Usuario responsable de gestionar el proceso de selección'
    )
    reclutador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vacantes_reclutamiento',
        verbose_name='Reclutador asignado',
        help_text='Usuario asignado para el reclutamiento'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Observaciones internas del proceso'
    )
    motivo_cierre = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de cierre',
        help_text='Motivo del cierre o cancelación de la vacante'
    )

    class Meta:
        db_table = 'talent_hub_vacante_activa'
        verbose_name = 'Vacante Activa'
        verbose_name_plural = 'Vacantes Activas'
        ordering = ['-fecha_apertura', '-prioridad']
        indexes = [
            models.Index(fields=['codigo_vacante']),
            models.Index(fields=['estado', 'is_active']),
            models.Index(fields=['fecha_apertura']),
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['responsable_proceso']),
        ]

    def __str__(self):
        return f"{self.codigo_vacante} - {self.titulo}"

    @property
    def posiciones_pendientes(self):
        """Posiciones que faltan por cubrir"""
        return max(0, self.numero_posiciones - self.posiciones_cubiertas)

    def clean(self):
        """Validaciones del modelo"""
        super().clean()

        # Auto-poblar cargo_requerido y area desde FK cargo
        if self.cargo:
            if not self.cargo_requerido:
                self.cargo_requerido = self.cargo.name
            if not self.area and self.cargo.area:
                self.area = self.cargo.area.name

        # Validar posiciones cubiertas
        if self.posiciones_cubiertas > self.numero_posiciones:
            raise ValidationError({
                'posiciones_cubiertas': 'No puede exceder el número de posiciones.'
            })

        # Validar rango salarial
        if self.salario_minimo and self.salario_maximo:
            if self.salario_minimo > self.salario_maximo:
                raise ValidationError({
                    'salario_maximo': 'El salario máximo no puede ser menor al salario mínimo.'
                })

        # Validar fecha de cierre esperada
        if self.fecha_cierre_esperada and self.fecha_apertura:
            if self.fecha_cierre_esperada < self.fecha_apertura:
                raise ValidationError({
                    'fecha_cierre_esperada': 'La fecha de cierre esperada no puede ser anterior a la fecha de apertura.'
                })

        # Validar que la fecha de cierre real solo se establezca si el estado es cerrada o cancelada
        if self.fecha_cierre_real and self.estado not in ['cerrada', 'cancelada']:
            raise ValidationError({
                'fecha_cierre_real': 'Solo se puede establecer fecha de cierre real cuando el estado es "cerrada" o "cancelada".'
            })

    @property
    def dias_abierta(self):
        """Calcula los días que lleva abierta la vacante"""
        if self.fecha_cierre_real:
            return (self.fecha_cierre_real - self.fecha_apertura).days
        return (timezone.now().date() - self.fecha_apertura).days

    @property
    def total_candidatos(self):
        """Total de candidatos postulados"""
        return self.candidatos.filter(is_active=True).count()

    @property
    def candidatos_activos(self):
        """Candidatos que aún están en proceso"""
        return self.candidatos.filter(
            is_active=True,
            estado__in=['postulado', 'preseleccionado', 'en_evaluacion']
        ).count()

    @property
    def candidatos_aprobados(self):
        """Candidatos aprobados para contratación"""
        return self.candidatos.filter(
            is_active=True,
            estado='aprobado'
        ).count()

    @property
    def candidatos_contratados(self):
        """Candidatos ya contratados"""
        return self.candidatos.filter(
            is_active=True,
            estado='contratado'
        ).count()

    def puede_cerrar(self):
        """Verifica si la vacante puede cerrarse"""
        return (
            self.estado in ['abierta', 'en_proceso'] and
            self.candidatos_contratados >= self.numero_posiciones
        )


class Candidato(BaseCompanyModel):
    """
    Candidato postulado a una vacante.

    Gestiona toda la información del candidato durante el proceso de selección.
    """

    ESTADO_CHOICES = [
        ('postulado', 'Postulado'),
        ('preseleccionado', 'Preseleccionado'),
        ('en_evaluacion', 'En Evaluación'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('contratado', 'Contratado'),
    ]

    ORIGEN_CHOICES = [
        ('portal_empleo', 'Portal de empleo'),
        ('referido', 'Referido'),
        ('redes_sociales', 'Redes sociales'),
        ('base_datos', 'Base de datos'),
        ('agencia', 'Agencia de empleo'),
        ('universidad', 'Universidad'),
        ('otro', 'Otro'),
    ]

    # Relación con la vacante
    vacante = models.ForeignKey(
        VacanteActiva,
        on_delete=models.CASCADE,
        related_name='candidatos',
        verbose_name='Vacante'
    )

    # Información personal
    nombres = models.CharField(
        max_length=100,
        verbose_name='Nombres'
    )
    apellidos = models.CharField(
        max_length=100,
        verbose_name='Apellidos'
    )
    tipo_documento = models.CharField(
        max_length=10,
        choices=[
            ('CC', 'Cédula de Ciudadanía'),
            ('CE', 'Cédula de Extranjería'),
            ('PA', 'Pasaporte'),
            ('TI', 'Tarjeta de Identidad'),
        ],
        default='CC',
        verbose_name='Tipo de documento'
    )
    numero_documento = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Número de documento'
    )
    fecha_nacimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de nacimiento'
    )
    genero = models.CharField(
        max_length=1,
        choices=[
            ('M', 'Masculino'),
            ('F', 'Femenino'),
            ('O', 'Otro'),
        ],
        null=True,
        blank=True,
        verbose_name='Género'
    )

    # Contacto
    email = models.EmailField(
        verbose_name='Email'
    )
    telefono = models.CharField(
        max_length=20,
        verbose_name='Teléfono'
    )
    telefono_alternativo = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Teléfono alternativo'
    )
    ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad de residencia'
    )
    direccion = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Dirección'
    )

    # Perfil profesional
    nivel_educativo = models.CharField(
        max_length=50,
        choices=[
            ('bachiller', 'Bachiller'),
            ('tecnico', 'Técnico'),
            ('tecnologo', 'Tecnólogo'),
            ('profesional', 'Profesional'),
            ('especializacion', 'Especialización'),
            ('maestria', 'Maestría'),
            ('doctorado', 'Doctorado'),
        ],
        verbose_name='Nivel educativo'
    )
    titulo_obtenido = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Título obtenido',
        help_text='Título profesional o técnico obtenido'
    )
    anos_experiencia = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        default=0,
        verbose_name='Años de experiencia',
        help_text='Años de experiencia laboral total'
    )
    anos_experiencia_cargo = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        default=0,
        verbose_name='Años de experiencia en el cargo',
        help_text='Años de experiencia específica en cargos similares'
    )

    # Gestión del proceso
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='postulado',
        db_index=True,
        verbose_name='Estado en el proceso'
    )
    origen_postulacion = models.CharField(
        max_length=30,
        choices=ORIGEN_CHOICES,
        default='portal_empleo',
        verbose_name='Origen de postulación'
    )
    fecha_postulacion = models.DateTimeField(
        default=timezone.now,
        verbose_name='Fecha de postulación'
    )
    fecha_ultima_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización de estado'
    )

    # Documentos
    hoja_vida = models.FileField(
        upload_to='talent_hub/candidatos/hojas_vida/%Y/%m/',
        validators=[FileExtensionValidator(['pdf', 'doc', 'docx'])],
        verbose_name='Hoja de vida (CV)',
        help_text='Archivo PDF o Word con la hoja de vida'
    )
    carta_presentacion = models.FileField(
        upload_to='talent_hub/candidatos/cartas/%Y/%m/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['pdf', 'doc', 'docx'])],
        verbose_name='Carta de presentación',
        help_text='Carta de presentación (opcional)'
    )

    # Pretensión salarial
    pretension_salarial = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Pretensión salarial',
        help_text='Pretensión salarial del candidato (COP)'
    )

    # Disponibilidad
    fecha_disponibilidad = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de disponibilidad',
        help_text='Fecha desde la cual puede iniciar labores'
    )
    requiere_reubicacion = models.BooleanField(
        default=False,
        verbose_name='Requiere reubicación',
        help_text='Indica si el candidato requiere reubicarse para el cargo'
    )
    disponibilidad_viajes = models.BooleanField(
        default=False,
        verbose_name='Disponibilidad para viajar'
    )

    # Referencias
    referido_por = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Referido por',
        help_text='Nombre de la persona que refirió al candidato'
    )

    # Evaluación y observaciones
    calificacion_general = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Calificación general',
        help_text='Calificación general del proceso (0-100)'
    )
    fortalezas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Fortalezas identificadas',
        help_text='Fortalezas principales del candidato'
    )
    debilidades = models.TextField(
        blank=True,
        null=True,
        verbose_name='Debilidades identificadas',
        help_text='Aspectos a mejorar o debilidades'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones generales',
        help_text='Observaciones del proceso de selección'
    )
    motivo_rechazo = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de rechazo',
        help_text='Razón por la cual se rechazó al candidato'
    )

    # Contratación
    fecha_contratacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de contratación',
        help_text='Fecha en la que fue contratado el candidato'
    )
    salario_ofrecido = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Salario ofrecido',
        help_text='Salario ofrecido al momento de contratación (COP)'
    )

    class Meta:
        db_table = 'talent_hub_candidato'
        verbose_name = 'Candidato'
        verbose_name_plural = 'Candidatos'
        ordering = ['-fecha_postulacion']
        indexes = [
            models.Index(fields=['vacante', 'estado']),
            models.Index(fields=['numero_documento']),
            models.Index(fields=['email']),
            models.Index(fields=['estado', 'is_active']),
            models.Index(fields=['fecha_postulacion']),
            models.Index(fields=['empresa', 'vacante']),
        ]
        unique_together = [['vacante', 'numero_documento']]

    def __str__(self):
        return f"{self.nombres} {self.apellidos} - {self.vacante.codigo_vacante}"

    def clean(self):
        """Validaciones del modelo"""
        super().clean()

        # Validar que la empresa del candidato coincida con la empresa de la vacante
        if self.vacante and self.empresa_id != self.vacante.empresa_id:
            raise ValidationError({
                'vacante': 'El candidato debe pertenecer a la misma empresa que la vacante.'
            })

        # Validar que si está contratado, tenga fecha de contratación
        if self.estado == 'contratado' and not self.fecha_contratacion:
            raise ValidationError({
                'fecha_contratacion': 'Se requiere fecha de contratación para candidatos contratados.'
            })

        # Validar que si está rechazado, tenga motivo
        if self.estado == 'rechazado' and not self.motivo_rechazo:
            raise ValidationError({
                'motivo_rechazo': 'Se requiere especificar el motivo de rechazo.'
            })

    @property
    def nombre_completo(self):
        """Retorna el nombre completo del candidato"""
        return f"{self.nombres} {self.apellidos}"

    @property
    def edad(self):
        """Calcula la edad del candidato"""
        if self.fecha_nacimiento:
            today = timezone.now().date()
            return today.year - self.fecha_nacimiento.year - (
                (today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
            )
        return None

    @property
    def dias_en_proceso(self):
        """Días que lleva el candidato en el proceso"""
        return (timezone.now().date() - self.fecha_postulacion.date()).days

    @property
    def total_entrevistas(self):
        """Total de entrevistas realizadas"""
        return self.entrevistas.filter(is_active=True).count()

    @property
    def total_pruebas(self):
        """Total de pruebas realizadas"""
        return self.pruebas.filter(is_active=True).count()

    def puede_contratar(self):
        """Verifica si el candidato puede ser contratado"""
        return (
            self.estado == 'aprobado' and
            self.is_active and
            self.vacante.estado in ['abierta', 'en_proceso']
        )


class Entrevista(BaseCompanyModel):
    """
    Entrevista realizada a un candidato.

    Registra entrevistas de selección con evaluación y retroalimentación.
    """

    TIPO_CHOICES = [
        ('telefonica', 'Telefónica'),
        ('presencial', 'Presencial'),
        ('virtual', 'Virtual'),
        ('grupal', 'Grupal'),
        ('panel', 'Panel'),
    ]

    ESTADO_CHOICES = [
        ('programada', 'Programada'),
        ('realizada', 'Realizada'),
        ('cancelada', 'Cancelada'),
        ('reprogramada', 'Reprogramada'),
    ]

    # Relación con el candidato
    candidato = models.ForeignKey(
        Candidato,
        on_delete=models.CASCADE,
        related_name='entrevistas',
        verbose_name='Candidato'
    )

    # Información de la entrevista
    numero_entrevista = models.PositiveIntegerField(
        default=1,
        verbose_name='Número de entrevista',
        help_text='Número secuencial de la entrevista para este candidato'
    )
    tipo_entrevista = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default='presencial',
        verbose_name='Tipo de entrevista'
    )

    # Programación
    fecha_programada = models.DateTimeField(
        verbose_name='Fecha y hora programada'
    )
    duracion_estimada_minutos = models.PositiveIntegerField(
        default=60,
        validators=[MinValueValidator(15)],
        verbose_name='Duración estimada (minutos)'
    )
    ubicacion = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Ubicación o enlace',
        help_text='Dirección física o enlace de videollamada'
    )

    # Entrevistadores
    entrevistador_principal = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='entrevistas_principal',
        verbose_name='Entrevistador principal'
    )
    entrevistadores_adicionales = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='entrevistas_adicionales',
        verbose_name='Entrevistadores adicionales',
        help_text='Otros entrevistadores participantes (para entrevistas panel)'
    )

    # Estado y ejecución
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='programada',
        db_index=True,
        verbose_name='Estado'
    )
    fecha_realizacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha y hora de realización',
        help_text='Fecha en que efectivamente se realizó la entrevista'
    )
    duracion_real_minutos = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        verbose_name='Duración real (minutos)'
    )

    # Evaluación
    asistio_candidato = models.BooleanField(
        default=True,
        verbose_name='Candidato asistió',
        help_text='Indica si el candidato asistió a la entrevista'
    )
    calificacion_tecnica = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Calificación técnica (0-100)',
        help_text='Evaluación de conocimientos técnicos'
    )
    calificacion_competencias = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Calificación competencias (0-100)',
        help_text='Evaluación de competencias blandas y actitudinales'
    )
    calificacion_general = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Calificación general (0-100)',
        help_text='Calificación global de la entrevista'
    )

    # Retroalimentación
    fortalezas_identificadas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Fortalezas identificadas',
        help_text='Principales fortalezas observadas durante la entrevista'
    )
    aspectos_mejorar = models.TextField(
        blank=True,
        null=True,
        verbose_name='Aspectos a mejorar',
        help_text='Aspectos que el candidato debe mejorar'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Observaciones generales de la entrevista'
    )
    recomendacion = models.CharField(
        max_length=20,
        choices=[
            ('contratar', 'Recomendado para contratar'),
            ('segunda_entrevista', 'Segunda entrevista'),
            ('rechazar', 'No recomendado'),
            ('pendiente', 'Decisión pendiente'),
        ],
        null=True,
        blank=True,
        verbose_name='Recomendación',
        help_text='Recomendación del entrevistador'
    )

    # Archivos
    notas_entrevista = models.FileField(
        upload_to='talent_hub/entrevistas/notas/%Y/%m/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['pdf', 'doc', 'docx'])],
        verbose_name='Notas de la entrevista',
        help_text='Archivo con notas detalladas de la entrevista'
    )

    # Cancelación/Reprogramación
    motivo_cancelacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de cancelación',
        help_text='Razón de la cancelación o reprogramación'
    )
    fecha_reprogramada = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha reprogramada',
        help_text='Nueva fecha si fue reprogramada'
    )

    class Meta:
        db_table = 'talent_hub_entrevista'
        verbose_name = 'Entrevista'
        verbose_name_plural = 'Entrevistas'
        ordering = ['-fecha_programada']
        indexes = [
            models.Index(fields=['candidato', 'estado']),
            models.Index(fields=['fecha_programada']),
            models.Index(fields=['entrevistador_principal']),
            models.Index(fields=['estado', 'is_active']),
            models.Index(fields=['empresa', 'fecha_programada']),
        ]

    def __str__(self):
        return f"Entrevista #{self.numero_entrevista} - {self.candidato.nombre_completo} - {self.fecha_programada.strftime('%Y-%m-%d')}"

    def clean(self):
        """Validaciones del modelo"""
        super().clean()

        # Validar que la empresa coincida con la del candidato
        if self.candidato and self.empresa_id != self.candidato.empresa_id:
            raise ValidationError({
                'candidato': 'La entrevista debe pertenecer a la misma empresa que el candidato.'
            })

        # Validar que si está realizada, tenga fecha de realización
        if self.estado == 'realizada' and not self.fecha_realizacion:
            raise ValidationError({
                'fecha_realizacion': 'Se requiere fecha de realización para entrevistas realizadas.'
            })

        # Validar que si está cancelada, tenga motivo
        if self.estado in ['cancelada', 'reprogramada'] and not self.motivo_cancelacion:
            raise ValidationError({
                'motivo_cancelacion': 'Se requiere especificar el motivo de cancelación o reprogramación.'
            })

        # Validar que si está reprogramada, tenga nueva fecha
        if self.estado == 'reprogramada' and not self.fecha_reprogramada:
            raise ValidationError({
                'fecha_reprogramada': 'Se requiere especificar la nueva fecha programada.'
            })

    def save(self, *args, **kwargs):
        # Auto-calcular número de entrevista si es nueva
        if not self.pk:
            max_numero = Entrevista.objects.filter(
                candidato=self.candidato
            ).aggregate(models.Max('numero_entrevista'))['numero_entrevista__max']
            self.numero_entrevista = (max_numero or 0) + 1

        super().save(*args, **kwargs)

    @property
    def calificacion_promedio(self):
        """Calcula el promedio de las calificaciones"""
        calificaciones = [
            cal for cal in [self.calificacion_tecnica, self.calificacion_competencias]
            if cal is not None
        ]
        if calificaciones:
            return sum(calificaciones) / len(calificaciones)
        return None


class Prueba(BaseCompanyModel):
    """
    Prueba aplicada a un candidato durante el proceso de selección.

    Puede ser técnica, psicotécnica, médica, etc.
    """

    ESTADO_CHOICES = [
        ('programada', 'Programada'),
        ('realizada', 'Realizada'),
        ('calificada', 'Calificada'),
        ('cancelada', 'Cancelada'),
    ]

    # Relación con el candidato
    candidato = models.ForeignKey(
        Candidato,
        on_delete=models.CASCADE,
        related_name='pruebas',
        verbose_name='Candidato'
    )

    # Tipo de prueba
    tipo_prueba = models.ForeignKey(
        TipoPrueba,
        on_delete=models.PROTECT,
        related_name='pruebas',
        verbose_name='Tipo de prueba'
    )

    # Programación
    fecha_programada = models.DateTimeField(
        verbose_name='Fecha y hora programada'
    )
    fecha_realizacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha y hora de realización'
    )

    # Ubicación o proveedor
    ubicacion = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Ubicación',
        help_text='Lugar donde se realizará la prueba'
    )
    proveedor_externo = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Proveedor externo',
        help_text='Nombre de la empresa o institución que aplica la prueba'
    )

    # Responsable
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pruebas_responsable',
        verbose_name='Responsable',
        help_text='Usuario responsable de coordinar la prueba'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='programada',
        db_index=True,
        verbose_name='Estado'
    )

    # Resultados
    calificacion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='Calificación',
        help_text='Calificación obtenida (0-100)'
    )
    aprobado = models.BooleanField(
        null=True,
        blank=True,
        verbose_name='Aprobado',
        help_text='Indica si el candidato aprobó la prueba'
    )
    puntaje_minimo_aprobacion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='Puntaje mínimo de aprobación',
        help_text='Puntaje mínimo requerido para aprobar'
    )

    # Archivos
    archivo_prueba = models.FileField(
        upload_to='talent_hub/pruebas/%Y/%m/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['pdf', 'doc', 'docx', 'xlsx', 'jpg', 'png'])],
        verbose_name='Archivo de la prueba',
        help_text='Archivo con la prueba o plantilla'
    )
    archivo_resultado = models.FileField(
        upload_to='talent_hub/pruebas/resultados/%Y/%m/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['pdf', 'doc', 'docx', 'xlsx', 'jpg', 'png'])],
        verbose_name='Archivo de resultado',
        help_text='Archivo con los resultados de la prueba'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Observaciones sobre la prueba o resultados'
    )
    recomendaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Recomendaciones',
        help_text='Recomendaciones derivadas de los resultados'
    )

    # Cancelación
    motivo_cancelacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de cancelación'
    )

    # Costos (opcional)
    costo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Costo',
        help_text='Costo de aplicación de la prueba (COP)'
    )

    class Meta:
        db_table = 'talent_hub_prueba'
        verbose_name = 'Prueba'
        verbose_name_plural = 'Pruebas'
        ordering = ['-fecha_programada']
        indexes = [
            models.Index(fields=['candidato', 'estado']),
            models.Index(fields=['tipo_prueba']),
            models.Index(fields=['fecha_programada']),
            models.Index(fields=['estado', 'is_active']),
            models.Index(fields=['empresa', 'tipo_prueba']),
        ]

    def __str__(self):
        return f"{self.tipo_prueba.nombre} - {self.candidato.nombre_completo} - {self.fecha_programada.strftime('%Y-%m-%d')}"

    def clean(self):
        """Validaciones del modelo"""
        super().clean()

        # Validar que la empresa coincida con la del candidato
        if self.candidato and self.empresa_id != self.candidato.empresa_id:
            raise ValidationError({
                'candidato': 'La prueba debe pertenecer a la misma empresa que el candidato.'
            })

        # Validar que si está calificada, tenga calificación
        if self.estado == 'calificada' and self.calificacion is None:
            raise ValidationError({
                'calificacion': 'Se requiere calificación para pruebas en estado "calificada".'
            })

        # Auto-calcular aprobación si hay puntaje mínimo
        if self.calificacion is not None and self.puntaje_minimo_aprobacion is not None:
            self.aprobado = self.calificacion >= self.puntaje_minimo_aprobacion


class AfiliacionSS(BaseCompanyModel):
    """
    Afiliación a entidades de seguridad social de un candidato contratado.

    Gestiona las afiliaciones a EPS, ARL, AFP y CCF del nuevo colaborador.
    """

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_proceso', 'En proceso'),
        ('afiliado', 'Afiliado'),
        ('rechazado', 'Rechazado'),
        ('cancelado', 'Cancelado'),
    ]

    # Relación con el candidato
    candidato = models.ForeignKey(
        Candidato,
        on_delete=models.CASCADE,
        related_name='afiliaciones_ss',
        verbose_name='Candidato',
        help_text='Candidato al que se le gestionan las afiliaciones'
    )

    # Entidad
    entidad = models.ForeignKey(
        EntidadSeguridadSocial,
        on_delete=models.PROTECT,
        related_name='afiliaciones',
        verbose_name='Entidad de seguridad social'
    )

    # Información de afiliación
    fecha_solicitud = models.DateField(
        default=timezone.now,
        verbose_name='Fecha de solicitud'
    )
    fecha_afiliacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de afiliación efectiva'
    )
    numero_afiliacion = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número de afiliación',
        help_text='Número de afiliado o carnet'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        db_index=True,
        verbose_name='Estado de la afiliación'
    )

    # Responsable
    responsable_tramite = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='afiliaciones_gestionadas',
        verbose_name='Responsable del trámite',
        help_text='Usuario responsable de gestionar la afiliación'
    )

    # Documentos
    documento_afiliacion = models.FileField(
        upload_to='talent_hub/afiliaciones/%Y/%m/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['pdf', 'jpg', 'png'])],
        verbose_name='Documento de afiliación',
        help_text='Certificado o documento que acredita la afiliación'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Observaciones del proceso de afiliación'
    )
    motivo_rechazo = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de rechazo',
        help_text='Razón por la cual se rechazó la afiliación'
    )

    class Meta:
        db_table = 'talent_hub_afiliacion_ss'
        verbose_name = 'Afiliación a Seguridad Social'
        verbose_name_plural = 'Afiliaciones a Seguridad Social'
        ordering = ['-fecha_solicitud']
        indexes = [
            models.Index(fields=['candidato', 'entidad']),
            models.Index(fields=['estado', 'is_active']),
            models.Index(fields=['fecha_solicitud']),
            models.Index(fields=['empresa', 'estado']),
        ]
        unique_together = [['candidato', 'entidad']]

    def __str__(self):
        return f"{self.candidato.nombre_completo} - {self.entidad}"

    def clean(self):
        """Validaciones del modelo"""
        super().clean()

        # Validar que la empresa coincida con la del candidato
        if self.candidato and self.empresa_id != self.candidato.empresa_id:
            raise ValidationError({
                'candidato': 'La afiliación debe pertenecer a la misma empresa que el candidato.'
            })

        # Validar que el candidato esté contratado
        if self.candidato and self.candidato.estado != 'contratado':
            raise ValidationError({
                'candidato': 'Solo se pueden gestionar afiliaciones para candidatos contratados.'
            })

        # Validar que si está afiliado, tenga fecha de afiliación
        if self.estado == 'afiliado' and not self.fecha_afiliacion:
            raise ValidationError({
                'fecha_afiliacion': 'Se requiere fecha de afiliación para afiliaciones en estado "afiliado".'
            })

        # Validar que si está rechazado, tenga motivo
        if self.estado == 'rechazado' and not self.motivo_rechazo:
            raise ValidationError({
                'motivo_rechazo': 'Se requiere especificar el motivo de rechazo.'
            })


# ==============================================================================
# HISTORIAL DE CONTRATOS - Ley 2466/2025
# ==============================================================================

TIPO_MOVIMIENTO_CONTRATO_CHOICES = [
    ('contrato_inicial', 'Contrato Inicial'),
    ('renovacion', 'Renovación'),
    ('otrosi', 'Otrosí'),
    ('prorroga', 'Prórroga'),
]


class HistorialContrato(BaseCompanyModel):
    """
    Historial de Contratos Laborales.

    Ley 2466/2025 Compliance:
    - Tras 3 renovaciones <1 año, siguiente debe ser >=1 año
    - Duración acumulada max 4 años para término fijo (warning)
    - Justificación requerida si tipo != indefinido
    - Trazabilidad completa de renovaciones y otrosíes
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='historial_contratos',
        verbose_name='Colaborador'
    )
    tipo_contrato = models.ForeignKey(
        TipoContrato,
        on_delete=models.PROTECT,
        related_name='historial_contratos',
        verbose_name='Tipo de Contrato'
    )
    numero_contrato = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Número de Contrato'
    )
    fecha_inicio = models.DateField(
        db_index=True,
        verbose_name='Fecha de Inicio'
    )
    fecha_fin = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Fin',
        help_text='Nulo para contratos a término indefinido'
    )
    salario_pactado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Salario Pactado'
    )
    objeto_contrato = models.TextField(
        blank=True,
        verbose_name='Objeto del Contrato'
    )

    # Tipo de movimiento
    tipo_movimiento = models.CharField(
        max_length=20,
        choices=TIPO_MOVIMIENTO_CONTRATO_CHOICES,
        default='contrato_inicial',
        verbose_name='Tipo de Movimiento'
    )
    contrato_padre = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movimientos',
        verbose_name='Contrato Padre'
    )
    numero_renovacion = models.PositiveIntegerField(
        default=0,
        verbose_name='Número de Renovación'
    )

    # Ley 2466/2025 - Justificación
    justificacion_tipo_contrato = models.TextField(
        blank=True,
        verbose_name='Justificación del Tipo de Contrato',
        help_text='Ley 2466/2025: Requerido si no es indefinido'
    )

    # Preaviso
    fecha_preaviso_terminacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Preaviso'
    )
    preaviso_entregado = models.BooleanField(
        default=False,
        verbose_name='Preaviso Entregado'
    )

    # Firma
    firmado = models.BooleanField(
        default=False,
        verbose_name='Firmado'
    )
    fecha_firma = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Firma'
    )
    archivo_contrato = models.FileField(
        upload_to='talent_hub/contratos/',
        null=True,
        blank=True,
        verbose_name='Archivo del Contrato'
    )

    class Meta:
        db_table = 'talent_hub_historial_contrato'
        verbose_name = 'Historial de Contrato'
        verbose_name_plural = 'Historial de Contratos'
        ordering = ['-fecha_inicio']
        unique_together = [['empresa', 'numero_contrato']]
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['fecha_inicio']),
            models.Index(fields=['tipo_movimiento']),
            models.Index(fields=['numero_contrato']),
        ]

    def __str__(self):
        return f"{self.numero_contrato} - {self.colaborador.get_nombre_corto()} ({self.tipo_contrato})"

    @property
    def esta_vigente(self):
        if not self.fecha_fin:
            return True
        return self.fecha_fin >= timezone.now().date()

    @property
    def dias_para_vencer(self):
        if not self.fecha_fin:
            return None
        return (self.fecha_fin - timezone.now().date()).days

    @property
    def duracion_meses(self):
        if not self.fecha_fin:
            return None
        delta = self.fecha_fin - self.fecha_inicio
        return round(delta.days / 30, 1)

    def clean(self):
        # Ley 2466/2025: Justificación requerida si no es indefinido
        if self.tipo_contrato and self.tipo_contrato.codigo != 'INDEFINIDO':
            if not self.justificacion_tipo_contrato and not self.pk:
                raise ValidationError({
                    'justificacion_tipo_contrato': 'Debe justificar el tipo de contrato cuando no es indefinido (Ley 2466/2025).'
                })

        # Validar fechas
        if self.fecha_fin and self.fecha_inicio and self.fecha_fin < self.fecha_inicio:
            raise ValidationError({
                'fecha_fin': 'La fecha de fin no puede ser anterior a la de inicio.'
            })

    def get_warnings(self):
        """Retorna advertencias según Ley 2466/2025 (no bloquea, solo informa)."""
        warnings = []

        if not self.tipo_contrato or self.tipo_contrato.codigo == 'INDEFINIDO':
            return warnings

        # Contar renovaciones del mismo colaborador con contratos <1 año
        renovaciones_cortas = HistorialContrato.objects.filter(
            empresa=self.empresa,
            colaborador=self.colaborador,
            tipo_movimiento='renovacion',
            is_active=True
        ).count()

        if renovaciones_cortas >= 3:
            if self.fecha_fin and self.fecha_inicio:
                duracion_dias = (self.fecha_fin - self.fecha_inicio).days
                if duracion_dias < 365:
                    warnings.append(
                        'Ley 2466/2025: Tras 3 renovaciones menores a 1 año, '
                        'la siguiente debería ser de al menos 1 año.'
                    )

        # Duración acumulada
        contratos_fijo = HistorialContrato.objects.filter(
            empresa=self.empresa,
            colaborador=self.colaborador,
            tipo_contrato=self.tipo_contrato,
            is_active=True
        ).exclude(pk=self.pk)

        total_dias = sum(
            ((c.fecha_fin - c.fecha_inicio).days if c.fecha_fin else 0)
            for c in contratos_fijo
        )
        if self.fecha_fin and self.fecha_inicio:
            total_dias += (self.fecha_fin - self.fecha_inicio).days

        if total_dias > 365 * 4:
            warnings.append(
                'Ley 2466/2025: La duración acumulada supera 4 años. '
                'Considere contrato a término indefinido.'
            )

        return warnings


# ==============================================================================
# PRUEBAS TÉCNICAS DINÁMICAS (Form Builder)
# ==============================================================================

class PlantillaPruebaDinamica(BaseCompanyModel):
    """
    Plantilla reutilizable de prueba técnica creada con Form Builder.

    Permite a HR crear pruebas personalizadas (conducción, Excel, SST, etc.)
    con preguntas de múltiple tipo y scoring automático.

    Los campos se almacenan como JSON con la estructura de CampoFormulario.
    """
    TIPO_SCORING_CHOICES = [
        ('manual', 'Calificación Manual'),
        ('automatico', 'Scoring Automático'),
        ('mixto', 'Mixto (Auto + Manual)'),
    ]

    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Plantilla',
        help_text='Ej: Prueba de Conducción Preventiva, Test Excel Avanzado'
    )
    descripcion = models.TextField(
        blank=True,
        default='',
        verbose_name='Descripción',
        help_text='Instrucciones generales para el candidato'
    )
    instrucciones = models.TextField(
        blank=True,
        default='',
        verbose_name='Instrucciones',
        help_text='Instrucciones detalladas que verá el candidato antes de iniciar'
    )
    campos = models.JSONField(
        default=list,
        verbose_name='Campos del Formulario',
        help_text='Array de campos con estructura CampoFormulario: '
                  '[{nombre_campo, etiqueta, tipo_campo, opciones, es_obligatorio, '
                  'respuesta_correcta, puntaje, orden, ...}]'
    )
    scoring_config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Configuración de Scoring',
        help_text='Configuración de calificación automática: '
                  '{puntaje_maximo, puntaje_aprobacion, penalizar_incorrectas}'
    )
    tipo_scoring = models.CharField(
        max_length=15,
        choices=TIPO_SCORING_CHOICES,
        default='manual',
        verbose_name='Tipo de Scoring'
    )
    duracion_estimada_minutos = models.PositiveIntegerField(
        default=30,
        verbose_name='Duración Estimada (minutos)',
        help_text='Tiempo estimado para completar la prueba'
    )
    tiempo_limite_minutos = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Tiempo Límite (minutos)',
        help_text='Tiempo máximo (si se aplica). Null = sin límite.'
    )
    categoria = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Categoría',
        help_text='Ej: Técnica, Conocimiento, Habilidad, Conducción, SST'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activa',
        help_text='Las plantillas inactivas no pueden asignarse'
    )
    total_asignaciones = models.PositiveIntegerField(
        default=0,
        verbose_name='Total Asignaciones',
        help_text='Contador de veces que se ha asignado esta plantilla'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='plantillas_prueba_creadas',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'seleccion_plantilla_prueba_dinamica'
        ordering = ['-created_at']
        verbose_name = 'Plantilla de Prueba Dinámica'
        verbose_name_plural = 'Plantillas de Pruebas Dinámicas'
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['empresa', 'categoria']),
        ]

    def __str__(self):
        return f'{self.nombre} ({self.categoria or "Sin categoría"})'

    @property
    def total_campos(self):
        """Número de campos/preguntas en la plantilla."""
        return len(self.campos) if isinstance(self.campos, list) else 0

    @property
    def puntaje_maximo(self):
        """Puntaje máximo posible sumando todos los campos con puntaje."""
        if not isinstance(self.campos, list):
            return 0
        return sum(
            c.get('puntaje', 0) for c in self.campos
            if isinstance(c, dict) and c.get('puntaje')
        )


class AsignacionPruebaDinamica(BaseCompanyModel):
    """
    Asignación de una PlantillaPruebaDinamica a un candidato.

    Genera un token único para que el candidato responda sin autenticación.
    Almacena respuestas, puntaje y estado de completado.
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_progreso', 'En Progreso'),
        ('completada', 'Completada'),
        ('calificada', 'Calificada'),
        ('vencida', 'Vencida'),
        ('cancelada', 'Cancelada'),
    ]

    plantilla = models.ForeignKey(
        PlantillaPruebaDinamica,
        on_delete=models.CASCADE,
        related_name='asignaciones',
        verbose_name='Plantilla'
    )
    candidato = models.ForeignKey(
        'Candidato',
        on_delete=models.CASCADE,
        related_name='pruebas_dinamicas',
        verbose_name='Candidato'
    )
    vacante = models.ForeignKey(
        'VacanteActiva',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pruebas_dinamicas',
        verbose_name='Vacante'
    )
    token = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name='Token de Acceso',
        help_text='Token único para acceso público sin autenticación'
    )
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CHOICES,
        default='pendiente',
        verbose_name='Estado'
    )

    # Fechas
    fecha_asignacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Asignación'
    )
    fecha_vencimiento = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Vencimiento',
        help_text='Si se pasa esta fecha, la prueba queda vencida'
    )
    fecha_inicio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Inicio',
        help_text='Momento en que el candidato abrió la prueba'
    )
    fecha_completado = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Completado'
    )

    # Respuestas y scoring
    respuestas = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Respuestas',
        help_text='Respuestas del candidato: {nombre_campo: valor}'
    )
    puntaje_obtenido = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Puntaje Obtenido'
    )
    puntaje_maximo = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Puntaje Máximo'
    )
    porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Porcentaje (%)'
    )
    aprobado = models.BooleanField(
        null=True,
        blank=True,
        verbose_name='Aprobado'
    )
    detalle_calificacion = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Detalle de Calificación',
        help_text='Detalle por pregunta: {nombre_campo: {correcto, puntaje, respuesta_correcta, respuesta_candidato}}'
    )

    # Metadata
    observaciones = models.TextField(
        blank=True,
        default='',
        verbose_name='Observaciones'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP del Candidato'
    )
    user_agent = models.TextField(
        blank=True,
        default='',
        verbose_name='User Agent'
    )
    email_enviado = models.BooleanField(
        default=False,
        verbose_name='Email Enviado'
    )
    asignado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pruebas_asignadas',
        verbose_name='Asignado por'
    )

    class Meta:
        db_table = 'seleccion_asignacion_prueba_dinamica'
        ordering = ['-fecha_asignacion']
        verbose_name = 'Asignación de Prueba Dinámica'
        verbose_name_plural = 'Asignaciones de Pruebas Dinámicas'
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['candidato', 'estado']),
            models.Index(fields=['token']),
        ]

    def __str__(self):
        return f'{self.plantilla.nombre} -> {self.candidato.nombre_completo}'

    @property
    def esta_vencida(self):
        """Verifica si la prueba ha vencido."""
        if self.fecha_vencimiento and self.estado == 'pendiente':
            return timezone.now() > self.fecha_vencimiento
        return False

    @property
    def tiempo_transcurrido_minutos(self):
        """Minutos desde que el candidato inició la prueba."""
        if self.fecha_inicio:
            delta = (self.fecha_completado or timezone.now()) - self.fecha_inicio
            return int(delta.total_seconds() / 60)
        return None

    def save(self, *args, **kwargs):
        """Genera token automáticamente si no existe."""
        if not self.token:
            import secrets
            self.token = secrets.token_urlsafe(48)
        super().save(*args, **kwargs)

    def calcular_scoring(self):
        """
        Calcula scoring automático comparando respuestas con respuesta_correcta
        de cada campo de la plantilla.

        Solo califica campos que tienen 'respuesta_correcta' definida.
        """
        if not self.respuestas or not isinstance(self.plantilla.campos, list):
            return

        total_puntaje = Decimal('0')
        total_max = Decimal('0')
        detalle = {}

        for campo in self.plantilla.campos:
            if not isinstance(campo, dict):
                continue

            nombre = campo.get('nombre_campo', '')
            respuesta_correcta = campo.get('respuesta_correcta')
            puntaje_campo = Decimal(str(campo.get('puntaje', 0)))

            if not nombre or respuesta_correcta is None or puntaje_campo <= 0:
                continue

            total_max += puntaje_campo
            respuesta_candidato = self.respuestas.get(nombre)

            # Comparación según tipo de campo
            tipo = campo.get('tipo_campo', 'TEXT')
            es_correcto = False

            if tipo in ('SELECT', 'RADIO'):
                es_correcto = str(respuesta_candidato) == str(respuesta_correcta)
            elif tipo == 'CHECKBOX':
                if isinstance(respuesta_correcta, list) and isinstance(respuesta_candidato, list):
                    es_correcto = set(respuesta_candidato) == set(respuesta_correcta)
                else:
                    es_correcto = str(respuesta_candidato) == str(respuesta_correcta)
            elif tipo == 'NUMBER':
                try:
                    es_correcto = float(respuesta_candidato or 0) == float(respuesta_correcta)
                except (ValueError, TypeError):
                    es_correcto = False
            elif tipo in ('TEXT', 'TEXTAREA'):
                # Para texto, no se califica automáticamente
                detalle[nombre] = {
                    'tipo': tipo,
                    'puntaje_maximo': float(puntaje_campo),
                    'puntaje_obtenido': None,
                    'requiere_revision_manual': True,
                    'respuesta_candidato': respuesta_candidato,
                }
                continue
            else:
                es_correcto = str(respuesta_candidato) == str(respuesta_correcta)

            puntaje_obtenido = puntaje_campo if es_correcto else Decimal('0')
            total_puntaje += puntaje_obtenido

            detalle[nombre] = {
                'tipo': tipo,
                'correcto': es_correcto,
                'puntaje_maximo': float(puntaje_campo),
                'puntaje_obtenido': float(puntaje_obtenido),
                'respuesta_correcta': respuesta_correcta,
                'respuesta_candidato': respuesta_candidato,
            }

        self.puntaje_obtenido = total_puntaje
        self.puntaje_maximo = total_max
        self.porcentaje = (
            (total_puntaje / total_max * 100) if total_max > 0 else Decimal('0')
        )

        # Verificar aprobación
        scoring_config = self.plantilla.scoring_config or {}
        puntaje_aprobacion = scoring_config.get('puntaje_aprobacion', 60)
        self.aprobado = float(self.porcentaje) >= float(puntaje_aprobacion)


# ==============================================================================
# ENTREVISTA ASINCRONICA (POR EMAIL)
# ==============================================================================

class EntrevistaAsincronica(BaseCompanyModel):
    """
    Entrevista asincronica enviada por email al candidato.

    El reclutador configura preguntas, se envia un link al candidato,
    el candidato responde a su ritmo, y luego HR evalua las respuestas.

    Similar a AsignacionPruebaDinamica pero enfocado en preguntas
    de entrevista (texto largo, competencias, situacional).
    """

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente de envio'),
        ('enviada', 'Enviada al candidato'),
        ('en_progreso', 'En progreso'),
        ('completada', 'Completada por candidato'),
        ('evaluada', 'Evaluada por HR'),
        ('vencida', 'Vencida'),
        ('cancelada', 'Cancelada'),
    ]

    RECOMENDACION_CHOICES = [
        ('contratar', 'Recomendado para contratar'),
        ('segunda_entrevista', 'Segunda entrevista'),
        ('rechazar', 'No recomendado'),
        ('pendiente', 'Decision pendiente'),
    ]

    # Relaciones
    candidato = models.ForeignKey(
        Candidato,
        on_delete=models.CASCADE,
        related_name='entrevistas_asincronicas',
        verbose_name='Candidato'
    )

    # Contenido
    titulo = models.CharField(
        max_length=200,
        verbose_name='Titulo de la entrevista',
        help_text='Ej: Entrevista tecnica, Entrevista de competencias'
    )
    instrucciones = models.TextField(
        blank=True,
        default='',
        verbose_name='Instrucciones para el candidato',
        help_text='Instrucciones que vera el candidato antes de responder'
    )
    preguntas = models.JSONField(
        default=list,
        verbose_name='Preguntas de la entrevista',
        help_text='Array de preguntas: [{id, pregunta, descripcion, tipo, obligatoria, opciones, orden}]'
    )

    # Token de acceso publico
    token = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name='Token de acceso',
        help_text='Token unico para acceso publico sin autenticacion'
    )

    # Estado y tracking
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        db_index=True,
        verbose_name='Estado'
    )
    email_enviado = models.BooleanField(
        default=False,
        verbose_name='Email enviado'
    )
    fecha_envio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de envio del email'
    )
    fecha_vencimiento = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha limite para responder'
    )
    fecha_inicio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha en que el candidato comenzo a responder'
    )
    fecha_completado = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha en que el candidato envio sus respuestas'
    )

    # Respuestas del candidato
    respuestas = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Respuestas del candidato',
        help_text='Dict {pregunta_id: respuesta}'
    )

    # Evaluacion por HR
    evaluador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='entrevistas_async_evaluadas',
        verbose_name='Evaluador'
    )
    fecha_evaluacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de evaluacion'
    )
    calificacion_general = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Calificacion general (0-100)'
    )
    recomendacion = models.CharField(
        max_length=20,
        choices=RECOMENDACION_CHOICES,
        null=True,
        blank=True,
        verbose_name='Recomendacion'
    )
    fortalezas_identificadas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Fortalezas identificadas'
    )
    aspectos_mejorar = models.TextField(
        blank=True,
        null=True,
        verbose_name='Aspectos a mejorar'
    )
    observaciones_evaluador = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones del evaluador'
    )

    # Metadata de acceso
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP del candidato'
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name='User agent del navegador'
    )

    class Meta:
        db_table = 'talent_hub_entrevista_asincronica'
        verbose_name = 'Entrevista Asincronica'
        verbose_name_plural = 'Entrevistas Asincronicas'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['candidato', 'estado']),
            models.Index(fields=['token']),
            models.Index(fields=['estado', 'is_active']),
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['fecha_vencimiento']),
        ]

    def __str__(self):
        return f"Entrevista Async: {self.titulo} - {self.candidato.nombre_completo}"

    def save(self, *args, **kwargs):
        # Auto-generar token si es nuevo
        if not self.token:
            import secrets
            self.token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if self.candidato and self.empresa_id != self.candidato.empresa_id:
            raise ValidationError({
                'candidato': 'La entrevista debe pertenecer a la misma empresa que el candidato.'
            })

    @property
    def total_preguntas(self):
        return len(self.preguntas) if self.preguntas else 0

    @property
    def total_respuestas(self):
        return len(self.respuestas) if self.respuestas else 0

    @property
    def esta_vencida(self):
        if self.fecha_vencimiento and self.estado in ('pendiente', 'enviada', 'en_progreso'):
            return timezone.now() > self.fecha_vencimiento
        return False

    @property
    def vacante_codigo(self):
        return self.candidato.vacante.codigo_vacante if self.candidato and self.candidato.vacante else ''
