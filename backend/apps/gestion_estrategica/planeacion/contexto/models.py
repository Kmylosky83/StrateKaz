"""
Modelos para Contexto Organizacional - Motor de Riesgos
=======================================================

Análisis estratégico del contexto organizacional incluyendo:
- DOFA (Debilidades, Oportunidades, Fortalezas, Amenazas)
- PESTEL (Político, Económico, Social, Tecnológico, Ecológico, Legal)
- 5 Fuerzas de Porter

Cumple con:
- ISO 31000: Gestión de Riesgos (Contexto Organizacional)
- ISO 9001: Contexto de la Organización
- Planeación Estratégica Empresarial

Autor: Sistema ERP StrateKaz
Fecha: 2025-12-26
"""

from django.db import models
from django.conf import settings
from apps.core.base_models import BaseCompanyModel, TimestampedModel, SoftDeleteModel, OrderedModel


class AnalisisDOFA(BaseCompanyModel):
    """
    Análisis DOFA consolidado del periodo.

    Contiene la consolidación del análisis de Debilidades, Oportunidades,
    Fortalezas y Amenazas para un periodo específico.
    """

    class EstadoAnalisis(models.TextChoices):
        BORRADOR = "borrador", "Borrador"
        EN_REVISION = "en_revision", "En Revisión"
        APROBADO = "aprobado", "Aprobado"
        VIGENTE = "vigente", "Vigente"
        ARCHIVADO = "archivado", "Archivado"

    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Análisis'
    )
    fecha_analisis = models.DateField(
        verbose_name='Fecha de Análisis'
    )
    periodo = models.CharField(
        max_length=50,
        verbose_name='Periodo',
        help_text='Ej: 2025-Q1, 2025 Anual, Enero 2025'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='dofa_responsable',
        verbose_name='Responsable del Análisis'
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoAnalisis.choices,
        default=EstadoAnalisis.BORRADOR,
        verbose_name='Estado'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones y Conclusiones'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dofa_aprobados',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    class Meta:
        db_table = 'motor_riesgos_analisis_dofa'
        verbose_name = 'Análisis DOFA'
        verbose_name_plural = 'Análisis DOFA'
        ordering = ['-fecha_analisis']
        indexes = [
            models.Index(fields=['empresa', 'periodo']),
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['fecha_analisis']),
        ]

    def __str__(self):
        return f"DOFA {self.periodo} - {self.nombre}"


class FactorDOFA(BaseCompanyModel, OrderedModel):
    """
    Factor individual del análisis DOFA.

    Representa cada elemento identificado en el análisis DOFA,
    clasificado como Fortaleza, Oportunidad, Debilidad o Amenaza.
    """

    class TipoFactor(models.TextChoices):
        FORTALEZA = "fortaleza", "Fortaleza"
        OPORTUNIDAD = "oportunidad", "Oportunidad"
        DEBILIDAD = "debilidad", "Debilidad"
        AMENAZA = "amenaza", "Amenaza"

    class NivelImpacto(models.TextChoices):
        ALTO = "alto", "Alto"
        MEDIO = "medio", "Medio"
        BAJO = "bajo", "Bajo"

    analisis = models.ForeignKey(
        AnalisisDOFA,
        on_delete=models.CASCADE,
        related_name='factores',
        verbose_name='Análisis DOFA'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TipoFactor.choices,
        verbose_name='Tipo de Factor'
    )
    descripcion = models.TextField(
        verbose_name='Descripción del Factor'
    )
    area_afectada = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Área o Proceso Afectado'
    )
    impacto = models.CharField(
        max_length=10,
        choices=NivelImpacto.choices,
        default=NivelImpacto.MEDIO,
        verbose_name='Nivel de Impacto'
    )
    evidencias = models.TextField(
        blank=True,
        verbose_name='Evidencias o Sustentación'
    )
    # orden heredado de OrderedModel

    class Meta:
        db_table = 'motor_riesgos_factor_dofa'
        verbose_name = 'Factor DOFA'
        verbose_name_plural = 'Factores DOFA'
        ordering = ['analisis', 'tipo', 'orden']
        indexes = [
            models.Index(fields=['empresa', 'analisis', 'tipo']),
            models.Index(fields=['tipo', 'impacto']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()}: {self.descripcion[:50]}"


class EstrategiaTOWS(BaseCompanyModel):
    """
    Estrategias derivadas de la Matriz TOWS (DOFA cruzado).

    Estrategias generadas del cruce de factores internos y externos:
    - FO: Maximizar Fortalezas aprovechando Oportunidades
    - FA: Usar Fortalezas para neutralizar Amenazas
    - DO: Minimizar Debilidades aprovechando Oportunidades
    - DA: Minimizar Debilidades y evitar Amenazas
    """

    class TipoEstrategia(models.TextChoices):
        FO = "fo", "FO - Fortalezas-Oportunidades (Ofensiva)"
        FA = "fa", "FA - Fortalezas-Amenazas (Defensiva)"
        DO = "do", "DO - Debilidades-Oportunidades (Adaptativa)"
        DA = "da", "DA - Debilidades-Amenazas (Supervivencia)"

    class EstadoEstrategia(models.TextChoices):
        PROPUESTA = "propuesta", "Propuesta"
        APROBADA = "aprobada", "Aprobada"
        EN_EJECUCION = "en_ejecucion", "En Ejecución"
        COMPLETADA = "completada", "Completada"
        CANCELADA = "cancelada", "Cancelada"
        SUSPENDIDA = "suspendida", "Suspendida"

    class Prioridad(models.TextChoices):
        ALTA = "alta", "Alta"
        MEDIA = "media", "Media"
        BAJA = "baja", "Baja"

    analisis = models.ForeignKey(
        AnalisisDOFA,
        on_delete=models.CASCADE,
        related_name='estrategias',
        verbose_name='Análisis DOFA'
    )
    tipo = models.CharField(
        max_length=5,
        choices=TipoEstrategia.choices,
        verbose_name='Tipo de Estrategia'
    )
    descripcion = models.TextField(
        verbose_name='Descripción de la Estrategia'
    )
    objetivo = models.TextField(
        verbose_name='Objetivo Esperado'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='estrategias_tows_responsable',
        verbose_name='Responsable'
    )
    fecha_implementacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Planificada de Implementación'
    )
    fecha_limite = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Límite'
    )
    prioridad = models.CharField(
        max_length=10,
        choices=Prioridad.choices,
        default=Prioridad.MEDIA,
        verbose_name='Prioridad'
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoEstrategia.choices,
        default=EstadoEstrategia.PROPUESTA,
        verbose_name='Estado'
    )
    recursos_necesarios = models.TextField(
        blank=True,
        verbose_name='Recursos Necesarios'
    )
    indicadores_exito = models.TextField(
        blank=True,
        verbose_name='Indicadores de Éxito'
    )
    progreso_porcentaje = models.PositiveIntegerField(
        default=0,
        verbose_name='Progreso (%)',
        help_text='Porcentaje de avance en la implementación'
    )

    class Meta:
        db_table = 'motor_riesgos_estrategia_tows'
        verbose_name = 'Estrategia TOWS'
        verbose_name_plural = 'Estrategias TOWS'
        ordering = ['-prioridad', 'fecha_limite']
        indexes = [
            models.Index(fields=['empresa', 'analisis', 'tipo']),
            models.Index(fields=['estado', 'prioridad']),
            models.Index(fields=['fecha_limite']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()}: {self.descripcion[:50]}"


class AnalisisPESTEL(BaseCompanyModel):
    """
    Análisis PESTEL del entorno externo.

    Análisis de factores Políticos, Económicos, Sociales, Tecnológicos,
    Ecológicos y Legales que afectan a la organización.
    """

    class EstadoAnalisis(models.TextChoices):
        BORRADOR = "borrador", "Borrador"
        EN_REVISION = "en_revision", "En Revisión"
        APROBADO = "aprobado", "Aprobado"
        VIGENTE = "vigente", "Vigente"
        ARCHIVADO = "archivado", "Archivado"

    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Análisis'
    )
    fecha_analisis = models.DateField(
        verbose_name='Fecha de Análisis'
    )
    periodo = models.CharField(
        max_length=50,
        verbose_name='Periodo',
        help_text='Ej: 2025-Q1, 2025 Anual'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='pestel_responsable',
        verbose_name='Responsable del Análisis'
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoAnalisis.choices,
        default=EstadoAnalisis.BORRADOR,
        verbose_name='Estado'
    )
    conclusiones = models.TextField(
        blank=True,
        verbose_name='Conclusiones Generales'
    )

    class Meta:
        db_table = 'motor_riesgos_analisis_pestel'
        verbose_name = 'Análisis PESTEL'
        verbose_name_plural = 'Análisis PESTEL'
        ordering = ['-fecha_analisis']
        indexes = [
            models.Index(fields=['empresa', 'periodo']),
            models.Index(fields=['fecha_analisis']),
        ]

    def __str__(self):
        return f"PESTEL {self.periodo} - {self.nombre}"


class FactorPESTEL(BaseCompanyModel, OrderedModel):
    """
    Factor individual del análisis PESTEL.

    Representa cada factor externo identificado en el análisis PESTEL.
    """

    class TipoFactor(models.TextChoices):
        POLITICO = "politico", "Político"
        ECONOMICO = "economico", "Económico"
        SOCIAL = "social", "Social"
        TECNOLOGICO = "tecnologico", "Tecnológico"
        ECOLOGICO = "ecologico", "Ecológico (Ambiental)"
        LEGAL = "legal", "Legal (Regulatorio)"

    class TendenciaFactor(models.TextChoices):
        MEJORANDO = "mejorando", "Mejorando (Favorable)"
        ESTABLE = "estable", "Estable (Sin cambios)"
        EMPEORANDO = "empeorando", "Empeorando (Desfavorable)"

    class NivelImpacto(models.TextChoices):
        ALTO = "alto", "Alto"
        MEDIO = "medio", "Medio"
        BAJO = "bajo", "Bajo"

    class Probabilidad(models.TextChoices):
        ALTA = "alta", "Alta"
        MEDIA = "media", "Media"
        BAJA = "baja", "Baja"

    analisis = models.ForeignKey(
        AnalisisPESTEL,
        on_delete=models.CASCADE,
        related_name='factores',
        verbose_name='Análisis PESTEL'
    )
    tipo = models.CharField(
        max_length=15,
        choices=TipoFactor.choices,
        verbose_name='Dimensión PESTEL'
    )
    descripcion = models.TextField(
        verbose_name='Descripción del Factor'
    )
    tendencia = models.CharField(
        max_length=15,
        choices=TendenciaFactor.choices,
        default=TendenciaFactor.ESTABLE,
        verbose_name='Tendencia del Factor'
    )
    impacto = models.CharField(
        max_length=10,
        choices=NivelImpacto.choices,
        verbose_name='Nivel de Impacto en la Organización'
    )
    probabilidad = models.CharField(
        max_length=10,
        choices=Probabilidad.choices,
        verbose_name='Probabilidad de Ocurrencia/Permanencia'
    )
    implicaciones = models.TextField(
        blank=True,
        verbose_name='Implicaciones para la Organización'
    )
    fuentes = models.TextField(
        blank=True,
        verbose_name='Fuentes de Información',
        help_text='Referencias, estudios, informes consultados'
    )
    # orden heredado de OrderedModel

    class Meta:
        db_table = 'motor_riesgos_factor_pestel'
        verbose_name = 'Factor PESTEL'
        verbose_name_plural = 'Factores PESTEL'
        ordering = ['analisis', 'tipo', 'orden']
        indexes = [
            models.Index(fields=['empresa', 'analisis', 'tipo']),
            models.Index(fields=['tipo', 'impacto', 'probabilidad']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()}: {self.descripcion[:50]}"


class FuerzaPorter(BaseCompanyModel):
    """
    Análisis de las 5 Fuerzas de Porter.

    Evaluación de la competitividad de la industria basado en:
    1. Rivalidad entre competidores
    2. Amenaza de nuevos entrantes
    3. Amenaza de productos sustitutos
    4. Poder de negociación de proveedores
    5. Poder de negociación de clientes
    """

    class TipoFuerza(models.TextChoices):
        RIVALIDAD = "rivalidad", "1. Rivalidad entre Competidores Existentes"
        NUEVOS_ENTRANTES = "nuevos_entrantes", "2. Amenaza de Nuevos Entrantes"
        SUSTITUTOS = "sustitutos", "3. Amenaza de Productos/Servicios Sustitutos"
        PODER_PROVEEDORES = "poder_proveedores", "4. Poder de Negociación de Proveedores"
        PODER_CLIENTES = "poder_clientes", "5. Poder de Negociación de Clientes"

    class NivelFuerza(models.TextChoices):
        ALTO = "alto", "Alto (Desfavorable)"
        MEDIO = "medio", "Medio (Moderado)"
        BAJO = "bajo", "Bajo (Favorable)"

    tipo = models.CharField(
        max_length=20,
        choices=TipoFuerza.choices,
        verbose_name='Fuerza de Porter'
    )
    nivel = models.CharField(
        max_length=10,
        choices=NivelFuerza.choices,
        verbose_name='Nivel de Intensidad de la Fuerza'
    )
    descripcion = models.TextField(
        verbose_name='Descripción y Análisis'
    )
    factores = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Factores Clave',
        help_text='Lista de factores que contribuyen a esta fuerza'
    )
    fecha_analisis = models.DateField(
        verbose_name='Fecha de Análisis'
    )
    periodo = models.CharField(
        max_length=50,
        verbose_name='Periodo',
        help_text='Ej: 2025-Q1, 2025 Anual'
    )
    implicaciones_estrategicas = models.TextField(
        blank=True,
        verbose_name='Implicaciones Estratégicas',
        help_text='Cómo esta fuerza afecta la estrategia competitiva'
    )

    class Meta:
        db_table = 'motor_riesgos_fuerza_porter'
        verbose_name = 'Fuerza de Porter'
        verbose_name_plural = 'Fuerzas de Porter'
        ordering = ['tipo']
        indexes = [
            models.Index(fields=['empresa', 'periodo']),
            models.Index(fields=['tipo', 'nivel']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'tipo', 'periodo'],
                name='unique_porter_fuerza_empresa_periodo'
            )
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.get_nivel_display()}"
