"""
Modelos para Encuestas de Contexto Organizacional
===================================================

Sistema de encuestas PCI-POAM y libres para análisis de contexto organizacional.
Permite recopilar opiniones de colaboradores sobre fortalezas, debilidades,
oportunidades y amenazas. Alimenta automáticamente DOFA y PESTEL.

Modelos:
- PreguntaContexto: Banco de preguntas estándar PCI-POAM (75 preguntas)
- EncuestaDofa: Encuesta vinculada a un análisis DOFA (y opcionalmente PESTEL)
- TemaEncuesta: Temas/aspectos a evaluar en la encuesta
- ParticipanteEncuesta: Control de participantes y acceso
- RespuestaEncuesta: Respuestas individuales de colaboradores
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.base_models import BaseCompanyModel, TimestampedModel, SoftDeleteModel, OrderedModel


# ==============================================================================
# BANCO DE PREGUNTAS ESTÁNDAR PCI-POAM
# ==============================================================================

class PreguntaContexto(TimestampedModel, SoftDeleteModel, OrderedModel):
    """
    Banco de preguntas estándar PCI-POAM para diagnóstico organizacional.

    PCI (Perfil de Capacidad Interna): 52 preguntas → clasifican F/D
    POAM (Perfil de Oportunidades y Amenazas): 23 preguntas → clasifican O/A

    Cada pregunta tiene mapeo a:
    - Capacidad (PCI) o Factor externo (POAM)
    - Dimensión PESTEL (para preguntas POAM)
    - Clasificación esperada (F/D o O/A)

    Las 75 preguntas estándar son genéricas para cualquier industria.
    Las empresas pueden agregar preguntas personalizadas (es_sistema=False).
    """

    class Perfil(models.TextChoices):
        PCI = 'pci', 'PCI - Perfil de Capacidad Interna'
        POAM = 'poam', 'POAM - Perfil de Oportunidades y Amenazas'

    class CapacidadPCI(models.TextChoices):
        DIRECTIVA = 'directiva', 'Capacidad Directiva'
        TALENTO_HUMANO = 'talento_humano', 'Capacidad del Talento Humano'
        TECNOLOGICA = 'tecnologica', 'Capacidad Tecnológica'
        COMPETITIVA = 'competitiva', 'Capacidad Competitiva'
        FINANCIERA = 'financiera', 'Capacidad Financiera'

    class FactorPOAM(models.TextChoices):
        ECONOMICO = 'economico', 'Factores Económicos'
        POLITICO = 'politico', 'Factores Políticos'
        SOCIAL = 'social', 'Factores Sociales'
        TECNOLOGICO = 'tecnologico', 'Factores Tecnológicos'
        GEOGRAFICO = 'geografico', 'Factores Geográficos'

    class ClasificacionEsperada(models.TextChoices):
        FORTALEZA_DEBILIDAD = 'fd', 'Fortaleza / Debilidad'
        OPORTUNIDAD_AMENAZA = 'oa', 'Oportunidad / Amenaza'

    codigo = models.CharField(
        max_length=10,
        unique=True,
        verbose_name='Código',
        help_text='Código único (ej: PCI-01, POAM-53)'
    )
    texto = models.TextField(
        verbose_name='Texto de la Pregunta',
        help_text='La pregunta completa tal como se presenta al encuestado'
    )
    perfil = models.CharField(
        max_length=5,
        choices=Perfil.choices,
        verbose_name='Perfil'
    )
    capacidad_pci = models.CharField(
        max_length=20,
        choices=CapacidadPCI.choices,
        blank=True,
        verbose_name='Capacidad PCI',
        help_text='Solo para preguntas PCI: a qué capacidad interna pertenece'
    )
    factor_poam = models.CharField(
        max_length=15,
        choices=FactorPOAM.choices,
        blank=True,
        verbose_name='Factor POAM',
        help_text='Solo para preguntas POAM: a qué factor externo pertenece'
    )
    clasificacion_esperada = models.CharField(
        max_length=2,
        choices=ClasificacionEsperada.choices,
        verbose_name='Clasificación Esperada',
        help_text='F/D para PCI, O/A para POAM'
    )
    dimension_pestel = models.CharField(
        max_length=15,
        blank=True,
        verbose_name='Dimensión PESTEL',
        help_text='Para POAM: a qué dimensión PESTEL mapea (politico, economico, social, tecnologico, ecologico)'
    )
    es_sistema = models.BooleanField(
        default=True,
        verbose_name='Es del Sistema',
        help_text='Las 75 preguntas estándar son del sistema. Las personalizadas no.'
    )

    class Meta:
        db_table = 'encuestas_pregunta_contexto'
        verbose_name = 'Pregunta de Contexto'
        verbose_name_plural = 'Preguntas de Contexto'
        ordering = ['perfil', 'orden']
        indexes = [
            models.Index(fields=['perfil', 'capacidad_pci']),
            models.Index(fields=['perfil', 'factor_poam']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"[{self.codigo}] {self.texto[:80]}"


class EncuestaDofa(BaseCompanyModel):
    """
    Encuesta colaborativa vinculada a un análisis DOFA.

    Soporta dos tipos:
    - 'libre': Preguntas/temas definidos manualmente
    - 'pci_poam': 75 preguntas estándar PCI-POAM auto-cargadas

    Permite recopilar insumos de colaboradores para identificar
    fortalezas, debilidades, oportunidades y amenazas.
    """

    class EstadoEncuesta(models.TextChoices):
        BORRADOR = 'borrador', 'Borrador'
        ACTIVA = 'activa', 'Activa'
        CERRADA = 'cerrada', 'Cerrada'
        PROCESADA = 'procesada', 'Procesada'
        CANCELADA = 'cancelada', 'Cancelada'

    class TipoEncuesta(models.TextChoices):
        LIBRE = 'libre', 'Libre'
        PCI_POAM = 'pci_poam', 'PCI-POAM'

    # Tipo de encuesta
    tipo_encuesta = models.CharField(
        max_length=20,
        choices=TipoEncuesta.choices,
        default=TipoEncuesta.LIBRE,
        verbose_name='Tipo de Encuesta',
        help_text='Libre: temas manuales. PCI-POAM: 75 preguntas estándar.'
    )

    # Vinculación con análisis DOFA
    analisis_dofa = models.ForeignKey(
        'gestion_estrategica_contexto.AnalisisDOFA',
        on_delete=models.CASCADE,
        related_name='encuestas',
        verbose_name='Análisis DOFA',
        help_text='Análisis DOFA al que pertenece esta encuesta'
    )

    # Vinculación con análisis PESTEL (para PCI-POAM)
    analisis_pestel = models.ForeignKey(
        'gestion_estrategica_contexto.AnalisisPESTEL',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='encuestas',
        verbose_name='Análisis PESTEL',
        help_text='Análisis PESTEL destino para consolidar preguntas POAM'
    )

    # Información básica
    titulo = models.CharField(
        max_length=200,
        verbose_name='Título de la Encuesta'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Instrucciones para los participantes'
    )

    # Control de acceso público
    token_publico = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name='Token de Acceso Público',
        help_text='Token único para acceso anónimo vía enlace público'
    )
    es_publica = models.BooleanField(
        default=False,
        verbose_name='¿Es Pública?',
        help_text='Si es pública, cualquiera con el enlace puede responder'
    )
    requiere_justificacion = models.BooleanField(
        default=True,
        verbose_name='¿Requiere Justificación?',
        help_text='Si los participantes deben justificar su clasificación'
    )

    # Fechas de vigencia
    fecha_inicio = models.DateTimeField(
        verbose_name='Fecha de Inicio',
        help_text='Cuándo se abre la encuesta para respuestas'
    )
    fecha_cierre = models.DateTimeField(
        verbose_name='Fecha de Cierre',
        help_text='Cuándo se cierra la encuesta'
    )

    # Estado y responsable
    estado = models.CharField(
        max_length=20,
        choices=EstadoEncuesta.choices,
        default=EstadoEncuesta.BORRADOR,
        verbose_name='Estado'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='encuestas_dofa_responsable',
        verbose_name='Responsable'
    )

    # Estadísticas
    total_invitados = models.PositiveIntegerField(
        default=0,
        verbose_name='Total Invitados'
    )
    total_respondidos = models.PositiveIntegerField(
        default=0,
        verbose_name='Total Respondidos'
    )

    # Configuración de notificaciones
    notificacion_enviada = models.BooleanField(
        default=False,
        verbose_name='Notificación Enviada'
    )
    fecha_notificacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Notificación'
    )

    class Meta:
        db_table = 'encuestas_dofa'
        verbose_name = 'Encuesta DOFA'
        verbose_name_plural = 'Encuestas DOFA'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['token_publico']),
            models.Index(fields=['fecha_inicio', 'fecha_cierre']),
        ]

    def __str__(self):
        return f"{self.titulo} - {self.get_estado_display()}"

    @property
    def esta_vigente(self):
        """Verifica si la encuesta está dentro del período de vigencia"""
        now = timezone.now()
        return (
            self.estado == self.EstadoEncuesta.ACTIVA and
            self.fecha_inicio <= now <= self.fecha_cierre
        )

    @property
    def porcentaje_participacion(self):
        """Calcula el porcentaje de participación"""
        if self.total_invitados == 0:
            return 0
        return round((self.total_respondidos / self.total_invitados) * 100, 1)

    @property
    def enlace_publico(self):
        """Genera el enlace público para la encuesta (ruta relativa).

        El frontend (app.stratekaz.com) construye la URL completa.
        El tenant se resuelve vía endpoint lookup /api/encuestas-dofa/lookup/{token}/
        """
        return f"/encuestas/responder/{self.token_publico}/"

    def activar(self):
        """Activa la encuesta para recibir respuestas"""
        self.estado = self.EstadoEncuesta.ACTIVA
        self.save(update_fields=['estado', 'updated_at'])

    def cerrar(self):
        """Cierra la encuesta"""
        self.estado = self.EstadoEncuesta.CERRADA
        self.save(update_fields=['estado', 'updated_at'])

    def actualizar_estadisticas(self):
        """Actualiza las estadísticas de participación.

        Cuenta respondentes únicos (autenticados + anónimos) vía
        EncuestaDofa → temas → respuestas (relación indirecta).
        """
        respondentes_autenticados = (
            RespuestaEncuesta.objects.filter(tema__encuesta=self)
            .exclude(respondente__isnull=True)
            .values('respondente')
            .distinct()
            .count()
        )
        respondentes_anonimos = (
            RespuestaEncuesta.objects.filter(tema__encuesta=self)
            .filter(respondente__isnull=True)
            .exclude(token_anonimo='')
            .values('token_anonimo')
            .distinct()
            .count()
        )
        self.total_respondidos = respondentes_autenticados + respondentes_anonimos
        self.save(update_fields=['total_respondidos', 'updated_at'])


class TemaEncuesta(BaseCompanyModel):
    """
    Tema o aspecto a evaluar en la encuesta.

    Cada tema representa un aspecto organizacional que los
    colaboradores deben clasificar como Fortaleza o Debilidad.
    """

    encuesta = models.ForeignKey(
        EncuestaDofa,
        on_delete=models.CASCADE,
        related_name='temas',
        verbose_name='Encuesta'
    )

    # Vinculación con pregunta estándar (para PCI-POAM)
    pregunta_contexto = models.ForeignKey(
        PreguntaContexto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='temas',
        verbose_name='Pregunta Estándar',
        help_text='Pregunta del banco PCI-POAM (solo para encuestas tipo pci_poam)'
    )

    # Vinculación opcional con área
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='temas_encuesta',
        verbose_name='Área Relacionada',
        help_text='Área organizacional a la que aplica este tema'
    )

    # Contenido del tema
    titulo = models.CharField(
        max_length=500,
        verbose_name='Título del Tema',
        help_text='Aspecto a evaluar (ej: Gestión del conocimiento)'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Contexto adicional para el participante'
    )

    # Orden de presentación
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )

    class Meta:
        db_table = 'encuestas_tema'
        verbose_name = 'Tema de Encuesta'
        verbose_name_plural = 'Temas de Encuesta'
        ordering = ['encuesta', 'orden']
        indexes = [
            models.Index(fields=['encuesta', 'orden']),
        ]

    def __str__(self):
        return f"{self.encuesta.titulo} - {self.titulo}"

    @property
    def total_votos_fortaleza(self):
        """Total de votos como fortaleza"""
        return self.respuestas.filter(clasificacion='fortaleza').count()

    @property
    def total_votos_debilidad(self):
        """Total de votos como debilidad"""
        return self.respuestas.filter(clasificacion='debilidad').count()

    @property
    def clasificacion_consenso(self):
        """Clasificación por consenso (mayoría de votos)"""
        fortalezas = self.total_votos_fortaleza
        debilidades = self.total_votos_debilidad
        if fortalezas > debilidades:
            return 'fortaleza'
        elif debilidades > fortalezas:
            return 'debilidad'
        return 'empate'


class ParticipanteEncuesta(TimestampedModel):
    """
    Control de participantes invitados a la encuesta.

    Permite definir quiénes pueden responder y rastrear
    el estado de su participación.
    """

    class TipoParticipante(models.TextChoices):
        USUARIO = 'usuario', 'Usuario Específico'
        AREA = 'area', 'Por Área'
        CARGO = 'cargo', 'Por Cargo'

    class EstadoParticipacion(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        NOTIFICADO = 'notificado', 'Notificado'
        EN_PROGRESO = 'en_progreso', 'En Progreso'
        COMPLETADO = 'completado', 'Completado'

    encuesta = models.ForeignKey(
        EncuestaDofa,
        on_delete=models.CASCADE,
        related_name='participantes',
        verbose_name='Encuesta'
    )

    # Tipo y referencia del participante
    tipo = models.CharField(
        max_length=20,
        choices=TipoParticipante.choices,
        default=TipoParticipante.USUARIO,
        verbose_name='Tipo de Participante'
    )

    # Referencias según tipo
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='participaciones_encuesta',
        verbose_name='Usuario'
    )
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='participaciones_encuesta',
        verbose_name='Área'
    )
    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='participaciones_encuesta',
        verbose_name='Cargo'
    )

    # Estado de participación
    estado = models.CharField(
        max_length=20,
        choices=EstadoParticipacion.choices,
        default=EstadoParticipacion.PENDIENTE,
        verbose_name='Estado'
    )

    # Fechas de seguimiento
    fecha_notificacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Notificación'
    )
    fecha_inicio_respuesta = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha Inicio Respuesta'
    )
    fecha_completado = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha Completado'
    )

    class Meta:
        db_table = 'encuestas_participante'
        verbose_name = 'Participante de Encuesta'
        verbose_name_plural = 'Participantes de Encuesta'
        ordering = ['encuesta', 'tipo', 'estado']
        indexes = [
            models.Index(fields=['encuesta', 'estado']),
            models.Index(fields=['usuario']),
        ]

    def __str__(self):
        if self.usuario:
            return f"{self.encuesta.titulo} - {self.usuario.get_full_name()}"
        elif self.area:
            return f"{self.encuesta.titulo} - Área: {self.area.name}"
        elif self.cargo:
            return f"{self.encuesta.titulo} - Cargo: {self.cargo.nombre}"
        return f"{self.encuesta.titulo} - Participante"

    def marcar_notificado(self):
        """Marca al participante como notificado"""
        self.estado = self.EstadoParticipacion.NOTIFICADO
        self.fecha_notificacion = timezone.now()
        self.save(update_fields=['estado', 'fecha_notificacion', 'updated_at'])

    def marcar_completado(self):
        """Marca al participante como completado"""
        self.estado = self.EstadoParticipacion.COMPLETADO
        self.fecha_completado = timezone.now()
        self.save(update_fields=['estado', 'fecha_completado', 'updated_at'])


class RespuestaEncuesta(TimestampedModel):
    """
    Respuesta individual de un colaborador a un tema de la encuesta.

    Cada respuesta clasifica un tema como Fortaleza o Debilidad
    con justificación opcional.
    """

    class Clasificacion(models.TextChoices):
        FORTALEZA = 'fortaleza', 'Fortaleza'
        DEBILIDAD = 'debilidad', 'Debilidad'
        OPORTUNIDAD = 'oportunidad', 'Oportunidad'
        AMENAZA = 'amenaza', 'Amenaza'

    class NivelImpacto(models.TextChoices):
        ALTO = 'alto', 'Alto'
        MEDIO = 'medio', 'Medio'
        BAJO = 'bajo', 'Bajo'

    tema = models.ForeignKey(
        TemaEncuesta,
        on_delete=models.CASCADE,
        related_name='respuestas',
        verbose_name='Tema'
    )

    # Respondente (puede ser null para respuestas anónimas)
    respondente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='respuestas_encuesta_dofa',
        verbose_name='Respondente'
    )

    # Token para respuestas anónimas
    token_anonimo = models.CharField(
        max_length=64,
        blank=True,
        verbose_name='Token Anónimo',
        help_text='Identificador para respuestas anónimas'
    )

    # Clasificación
    clasificacion = models.CharField(
        max_length=15,
        choices=Clasificacion.choices,
        verbose_name='Clasificación',
        help_text='¿Es Fortaleza o Debilidad?'
    )

    # Justificación
    justificacion = models.TextField(
        blank=True,
        verbose_name='Justificación',
        help_text='Razón de la clasificación'
    )

    # Impacto percibido
    impacto_percibido = models.CharField(
        max_length=10,
        choices=NivelImpacto.choices,
        default=NivelImpacto.MEDIO,
        verbose_name='Impacto Percibido'
    )

    # Metadatos
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='Dirección IP'
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent'
    )

    class Meta:
        db_table = 'encuestas_respuesta'
        verbose_name = 'Respuesta de Encuesta'
        verbose_name_plural = 'Respuestas de Encuesta'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tema', 'clasificacion']),
            models.Index(fields=['respondente']),
            models.Index(fields=['token_anonimo']),
        ]
        # Un usuario solo puede responder una vez por tema
        constraints = [
            models.UniqueConstraint(
                fields=['tema', 'respondente'],
                condition=models.Q(respondente__isnull=False),
                name='unique_respuesta_usuario_tema'
            ),
            models.UniqueConstraint(
                fields=['tema', 'token_anonimo'],
                condition=models.Q(token_anonimo__gt=''),
                name='unique_respuesta_anonimo_tema'
            ),
        ]

    def __str__(self):
        quien = self.respondente.get_full_name() if self.respondente else 'Anónimo'
        return f"{self.tema.titulo} - {quien}: {self.get_clasificacion_display()}"
