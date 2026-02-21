"""
Modelos para Contexto Organizacional - Gestión Estratégica
==========================================================

Análisis estratégico del contexto organizacional incluyendo:
- DOFA (Debilidades, Oportunidades, Fortalezas, Amenazas)
- PESTEL (Político, Económico, Social, Tecnológico, Ecológico, Legal)
- 5 Fuerzas de Porter
- TOWS (Estrategias cruzadas)
- Partes Interesadas (Stakeholders)

Cumple con:
- ISO 9001:2015 Cláusula 4.1: Comprensión de la organización y su contexto
- ISO 9001:2015 Cláusula 4.2: Partes interesadas
- ISO 31000: Gestión de Riesgos (Contexto Organizacional)

Autor: Sistema ERP StrateKaz
Fecha: 2025-12-26
Actualizado: 2026-01-24 - Migrado a app independiente
"""

from django.db import models
from django.conf import settings
from apps.core.base_models import BaseCompanyModel, TimestampedModel, SoftDeleteModel, OrderedModel
from apps.gestion_estrategica.organizacion.models import Area


# ============================================================================
# CATÁLOGOS GLOBALES (No dependen de empresa)
# ============================================================================

class TipoAnalisisDOFA(TimestampedModel, SoftDeleteModel, OrderedModel):
    """
    Catálogo de tipos de análisis DOFA.
    Modelo global (no depende de empresa específica).

    Ejemplos:
    - Organizacional: Análisis de toda la empresa
    - Por Área: Análisis específico de un área/departamento
    - Por Proyecto: Análisis vinculado a un proyecto específico
    - Estratégico Anual: Revisión anual del contexto estratégico
    - Pre-Auditoría: Antes de auditorías de certificación
    """
    codigo = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del Tipo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Cuándo y para qué se usa este tipo de análisis'
    )
    icono = models.CharField(
        max_length=50,
        blank=True,
        default='Grid3X3',
        verbose_name='Ícono',
        help_text='Nombre del ícono de Lucide React'
    )
    color = models.CharField(
        max_length=20,
        blank=True,
        default='purple',
        verbose_name='Color',
        help_text='Color semántico (purple, blue, green, etc.)'
    )

    class Meta:
        db_table = 'contexto_tipo_analisis_dofa'
        verbose_name = 'Tipo de Análisis DOFA'
        verbose_name_plural = 'Tipos de Análisis DOFA'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


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

    # Tipo de análisis (catálogo global)
    tipo_analisis = models.ForeignKey(
        TipoAnalisisDOFA,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='analisis',
        verbose_name='Tipo de Análisis',
        help_text='Clasificación del tipo de análisis DOFA'
    )
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
    # FK a Cargo en lugar de User - más estable organizacionalmente
    responsable = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dofa_responsable',
        verbose_name='Cargo Responsable'
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
        db_table = 'contexto_analisis_dofa'
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
        verbose_name='Área o Proceso Afectado (texto)'
    )
    area = models.ForeignKey(
        Area,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='factores_dofa',
        verbose_name='Área Organizacional'
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
    fuente = models.CharField(
        max_length=50,
        default='manual',
        verbose_name='Fuente del Factor',
        help_text='manual, encuesta, importado'
    )
    votos_fortaleza = models.PositiveIntegerField(
        default=0,
        verbose_name='Votos como Fortaleza'
    )
    votos_debilidad = models.PositiveIntegerField(
        default=0,
        verbose_name='Votos como Debilidad'
    )

    class Meta:
        db_table = 'contexto_factor_dofa'
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
    # FK a Cargo en lugar de User - más estable organizacionalmente
    responsable = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='estrategias_tows_responsable',
        verbose_name='Cargo Responsable'
    )
    area_responsable = models.ForeignKey(
        Area,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='estrategias_tows',
        verbose_name='Área Responsable'
    )
    # NOTA: La vinculación con objetivo estratégico se movió a StrategicObjective.estrategia_origen
    # para eliminar la dependencia circular contexto → planeacion.
    # Ahora la relación es: planeacion.StrategicObjective.estrategia_origen → EstrategiaTOWS
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
        verbose_name='Progreso (%)'
    )

    class Meta:
        db_table = 'contexto_estrategia_tows'
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


class TipoAnalisisPESTEL(TimestampedModel, SoftDeleteModel, OrderedModel):
    """
    Catálogo de tipos de análisis PESTEL.
    Modelo global (no depende de empresa específica).

    Ejemplos:
    - Macro-Entorno: Análisis completo del entorno externo
    - Sectorial: Análisis específico del sector/industria
    - Por Mercado: Análisis de un mercado geográfico específico
    - Pre-Expansión: Antes de entrar a un nuevo mercado
    """
    codigo = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del Tipo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Cuándo y para qué se usa este tipo de análisis'
    )
    icono = models.CharField(
        max_length=50,
        blank=True,
        default='Globe2',
        verbose_name='Ícono',
        help_text='Nombre del ícono de Lucide React'
    )
    color = models.CharField(
        max_length=20,
        blank=True,
        default='cyan',
        verbose_name='Color',
        help_text='Color semántico (cyan, blue, green, etc.)'
    )

    class Meta:
        db_table = 'contexto_tipo_analisis_pestel'
        verbose_name = 'Tipo de Análisis PESTEL'
        verbose_name_plural = 'Tipos de Análisis PESTEL'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


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

    # Tipo de análisis (catálogo global)
    tipo_analisis = models.ForeignKey(
        TipoAnalisisPESTEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='analisis',
        verbose_name='Tipo de Análisis',
        help_text='Clasificación del tipo de análisis PESTEL'
    )
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
    # FK a Cargo en lugar de User - más estable organizacionalmente
    responsable = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pestel_responsable',
        verbose_name='Cargo Responsable'
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
        db_table = 'contexto_analisis_pestel'
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
        verbose_name='Fuentes de Información'
    )

    class Meta:
        db_table = 'contexto_factor_pestel'
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
        verbose_name='Factores Clave'
    )
    fecha_analisis = models.DateField(
        verbose_name='Fecha de Análisis'
    )
    periodo = models.CharField(
        max_length=50,
        verbose_name='Periodo'
    )
    implicaciones_estrategicas = models.TextField(
        blank=True,
        verbose_name='Implicaciones Estratégicas'
    )

    class Meta:
        db_table = 'contexto_fuerza_porter'
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
                name='unique_contexto_porter_empresa_periodo'
            )
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.get_nivel_display()}"


# ============================================================================
# PARTES INTERESADAS (Stakeholders) - ISO 9001:2015 Cláusula 4.2
# ============================================================================

class GrupoParteInteresada(TimestampedModel, SoftDeleteModel, OrderedModel):
    """
    Catálogo de GRUPOS macro de partes interesadas.
    Nivel superior de clasificación jerárquica (Sprint 17).

    Ejemplos: Personal, Propiedad, Clientes, Proveedores, Competidores,
    Comunidad Local, Administraciones Públicas, Agentes Sociales,
    Sociedad, Medio Ambiente.

    Gestión:
    - 10 grupos pre-seeded en seed_grupos_partes_interesadas.py
    - CRUD COMPLETO: Empresas pueden agregar/editar/eliminar grupos personalizados
    - SoftDelete: No se eliminan físicamente, solo se marcan como deleted
    - Ordenables: Campo 'orden' para organización visual
    - es_sistema: Flag para proteger los 10 grupos predefinidos
    """
    codigo = models.CharField(
        max_length=30,
        unique=True,
        verbose_name='Código',
        help_text='Código único del grupo (ej: PERSONAL, CLIENTES)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del Grupo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción del grupo y su propósito'
    )
    icono = models.CharField(
        max_length=50,
        blank=True,
        default='Users',
        verbose_name='Ícono',
        help_text='Nombre del ícono de Lucide React'
    )
    color = models.CharField(
        max_length=20,
        blank=True,
        default='blue',
        verbose_name='Color',
        help_text='Color semántico (blue, green, purple, orange, etc.)'
    )
    es_sistema = models.BooleanField(
        default=False,
        verbose_name='Es del Sistema',
        help_text='Grupos del sistema no pueden ser eliminados (solo los 10 pre-seeded)'
    )

    class Meta:
        db_table = 'contexto_grupo_parte_interesada'
        verbose_name = 'Grupo de Parte Interesada'
        verbose_name_plural = 'Grupos de Partes Interesadas'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['es_sistema', 'is_active']),
        ]

    def __str__(self):
        return self.nombre


class TipoParteInteresada(TimestampedModel, SoftDeleteModel, OrderedModel):
    """
    Catálogo de TIPOS (SUBGRUPOS) de partes interesadas.
    Nivel inferior - se crean dinámicamente por las empresas (Sprint 17).

    Ejemplos dentro de PERSONAL:
    - Alta Dirección
    - Personal de Oficina
    - Nuevos Empleados

    Gestión:
    - NO pre-seeded (excepto ejemplos opcionales)
    - CRUD COMPLETO: Empresas crean sus propios tipos
    - Relacionados con GRUPO mediante FK
    - SoftDelete habilitado
    """
    class Categoria(models.TextChoices):
        INTERNA = "interna", "Interna"
        EXTERNA = "externa", "Externa"

    # NUEVO: Relación con GRUPO (Sprint 17)
    grupo = models.ForeignKey(
        GrupoParteInteresada,
        on_delete=models.PROTECT,
        related_name='tipos',
        null=True,  # Temporal para migración - luego NOT NULL
        blank=True,
        verbose_name='Grupo',
        help_text='Grupo macro al que pertenece este tipo'
    )

    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=100)
    categoria = models.CharField(
        max_length=10,
        choices=Categoria.choices,
        default=Categoria.EXTERNA
    )
    descripcion = models.TextField(blank=True)

    # NUEVO: Flag sistema (para tipos ejemplo) (Sprint 17)
    es_sistema = models.BooleanField(
        default=False,
        verbose_name='Es del Sistema',
        help_text='Tipos del sistema son ejemplos predefinidos (eliminables)'
    )

    class Meta:
        db_table = 'contexto_tipo_parte_interesada'
        verbose_name = "Tipo de Parte Interesada"
        verbose_name_plural = "Tipos de Partes Interesadas"
        ordering = ["grupo__orden", "orden", "nombre"]  # Ordenar por grupo primero
        indexes = [
            models.Index(fields=['grupo', 'categoria']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        if self.grupo:
            return f"{self.grupo.nombre} → {self.nombre}"
        return f"{self.nombre} ({self.get_categoria_display()})"


class ParteInteresada(BaseCompanyModel):
    """
    Identificación de partes interesadas de la organización.
    Cumple con ISO 9001:2015 Cláusula 4.2.

    CAMBIOS SPRINT 17:
    - Responsable en la empresa (Colaborador/Cargo/Área)
    - Impacto bidireccional (PI→Empresa + Empresa→PI)
    - Temas de interés bidireccionales

    Incluye:
    - Información básica y de contacto
    - Matriz poder-interés (cuadrantes)
    - Canales y frecuencia de comunicación
    - Necesidades, expectativas y requisitos pertinentes (ISO 9001:2015)
    """
    class NivelInfluencia(models.TextChoices):
        ALTA = "alta", "Alta"
        MEDIA = "media", "Media"
        BAJA = "baja", "Baja"

    class NivelInteres(models.TextChoices):
        ALTO = "alto", "Alto"
        MEDIO = "medio", "Medio"
        BAJO = "bajo", "Bajo"

    class CanalComunicacion(models.TextChoices):
        EMAIL = "email", "Correo Electrónico"
        TELEFONO = "telefono", "Teléfono"
        REUNION = "reunion", "Reunión Presencial"
        VIDEOCONFERENCIA = "videoconferencia", "Videoconferencia"
        WHATSAPP = "whatsapp", "WhatsApp"
        PORTAL_WEB = "portal_web", "Portal Web"
        REDES_SOCIALES = "redes_sociales", "Redes Sociales"
        CORRESPONDENCIA = "correspondencia", "Correspondencia Física"
        OTRO = "otro", "Otro"

    class FrecuenciaComunicacion(models.TextChoices):
        DIARIA = "diaria", "Diaria"
        SEMANAL = "semanal", "Semanal"
        QUINCENAL = "quincenal", "Quincenal"
        MENSUAL = "mensual", "Mensual"
        BIMESTRAL = "bimestral", "Bimestral"
        TRIMESTRAL = "trimestral", "Trimestral"
        SEMESTRAL = "semestral", "Semestral"
        ANUAL = "anual", "Anual"
        SEGUN_NECESIDAD = "segun_necesidad", "Según Necesidad"

    tipo = models.ForeignKey(
        TipoParteInteresada,
        on_delete=models.PROTECT,
        related_name="partes_interesadas",
        verbose_name="Tipo de Parte Interesada"
    )
    nombre = models.CharField(max_length=200, verbose_name="Nombre")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")

    # Información de contacto básica
    representante = models.CharField(max_length=200, blank=True, verbose_name="Representante")
    cargo_representante = models.CharField(max_length=100, blank=True, verbose_name="Cargo del Representante")
    telefono = models.CharField(max_length=50, blank=True, verbose_name="Teléfono")
    email = models.EmailField(blank=True, verbose_name="Correo Electrónico")
    direccion = models.TextField(blank=True, verbose_name="Dirección")
    sitio_web = models.URLField(
        max_length=500,
        blank=True,
        verbose_name="Sitio Web",
        help_text="URL del sitio web de la parte interesada"
    )

    # ========================================================================
    # RESPONSABLE EN LA EMPRESA (NUEVO - Sprint 17) ⭐
    # ========================================================================
    responsable_empresa = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='partes_interesadas_asignadas',
        verbose_name='Responsable en la Empresa',
        help_text='Persona responsable de gestionar la relación con esta PI'
    )
    cargo_responsable = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='partes_interesadas_cargo',
        verbose_name='Cargo Responsable',
        help_text='Cargo responsable (alternativa si no hay colaborador específico)'
    )
    area_responsable = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='partes_interesadas_area',
        verbose_name='Área Responsable'
    )

    # ========================================================================
    # MATRIZ PODER-INTERÉS (MEJORADA - Sprint 17) ⭐
    # ========================================================================

    # Influencia/Impacto PI → Empresa (RENOMBRADO para claridad)
    nivel_influencia_pi = models.CharField(
        max_length=10,
        choices=NivelInfluencia.choices,
        default=NivelInfluencia.MEDIA,
        verbose_name='Impacto PI sobre Empresa',
        help_text='Grado de impacto que la parte interesada tiene sobre la empresa (PODER)'
    )

    # NUEVO: Influencia/Impacto Empresa → PI ⭐
    nivel_influencia_empresa = models.CharField(
        max_length=10,
        choices=NivelInfluencia.choices,
        default=NivelInfluencia.MEDIA,
        verbose_name='Impacto Empresa sobre PI',
        help_text='Grado de impacto que la empresa tiene sobre la parte interesada'
    )

    # Interés de la PI en la empresa (sin cambio conceptual)
    nivel_interes = models.CharField(
        max_length=10,
        choices=NivelInteres.choices,
        default=NivelInteres.MEDIO,
        verbose_name='Nivel de Interés de la PI',
        help_text='Qué tan interesada está la PI en las actividades de la empresa'
    )

    # Comunicación - para automatización de matriz de comunicaciones
    canal_principal = models.CharField(
        max_length=20,
        choices=CanalComunicacion.choices,
        default=CanalComunicacion.EMAIL,
        verbose_name="Canal de Comunicación Principal",
        help_text="Canal preferido para comunicarse con esta parte interesada"
    )
    canales_adicionales = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Canales Adicionales de Comunicación",
        help_text="Lista de canales adicionales (ej: ['whatsapp', 'telefono'])"
    )
    frecuencia_comunicacion = models.CharField(
        max_length=20,
        choices=FrecuenciaComunicacion.choices,
        default=FrecuenciaComunicacion.MENSUAL,
        verbose_name="Frecuencia de Comunicación",
        help_text="Frecuencia recomendada de comunicación según matriz poder-interés"
    )

    # ========================================================================
    # TEMAS DE INTERÉS (BIDIRECCIONALES - Sprint 17) ⭐
    # ========================================================================

    # Temas de interés PARA la PI (qué le importa a la PI de nosotros)
    temas_interes_pi = models.TextField(
        blank=True,
        verbose_name='Temas de Interés Principal para la PI',
        help_text='Qué temas, aspectos o resultados le interesan a esta PI de la empresa'
    )

    # NUEVO: Temas de interés PARA la empresa (qué nos importa de la PI) ⭐
    temas_interes_empresa = models.TextField(
        blank=True,
        verbose_name='Temas de Interés Principal para la Empresa',
        help_text='Qué espera o necesita la empresa de esta PI'
    )

    # ========================================================================
    # ISO 9001:2015 Cláusula 4.2 - Necesidades, Expectativas y Requisitos
    # ========================================================================
    necesidades = models.TextField(
        blank=True,
        verbose_name="Necesidades",
        help_text="¿Qué necesita esta parte interesada de la organización?"
    )
    expectativas = models.TextField(
        blank=True,
        verbose_name="Expectativas",
        help_text="¿Qué espera esta parte interesada de la organización?"
    )
    requisitos_pertinentes = models.TextField(
        blank=True,
        verbose_name="Requisitos Pertinentes",
        help_text="Requisitos que la organización debe cumplir para esta parte interesada"
    )
    es_requisito_legal = models.BooleanField(
        default=False,
        verbose_name="Tiene Requisitos Legales",
        help_text="Indica si los requisitos de esta parte interesada son de carácter legal"
    )

    # Sistemas de gestión relacionados - Campos legacy (deprecados, usar normas_relacionadas)
    relacionado_sst = models.BooleanField(default=False, verbose_name="Relacionado con SST (ISO 45001)")
    relacionado_ambiental = models.BooleanField(default=False, verbose_name="Relacionado con Ambiental (ISO 14001)")
    relacionado_calidad = models.BooleanField(default=False, verbose_name="Relacionado con Calidad (ISO 9001)")
    relacionado_pesv = models.BooleanField(default=False, verbose_name="Relacionado con PESV")

    # Sistemas de gestión relacionados - Dinámico desde configuración
    normas_relacionadas = models.ManyToManyField(
        'configuracion.NormaISO',
        blank=True,
        related_name='partes_interesadas_relacionadas',
        verbose_name='Sistemas de Gestión Relacionados',
        help_text='Normas ISO o sistemas de gestión con los que esta parte interesada tiene relación'
    )

    class Meta:
        db_table = 'contexto_parte_interesada'
        verbose_name = "Parte Interesada"
        verbose_name_plural = "Partes Interesadas"
        ordering = ["-nivel_influencia_pi", "-nivel_interes", "nombre"]  # Actualizado a nivel_influencia_pi
        indexes = [
            models.Index(fields=["empresa", "tipo"]),
            models.Index(fields=["empresa", "nivel_influencia_pi", "nivel_interes"]),  # Actualizado
            models.Index(fields=["empresa", "responsable_empresa"]),  # NUEVO
            models.Index(fields=["empresa", "area_responsable"]),  # NUEVO
        ]

    def __str__(self):
        return f"{self.nombre} ({self.tipo.nombre})"

    @property
    def cuadrante_matriz(self) -> str:
        """Retorna el cuadrante de la matriz poder-interés (basado en influencia_pi)."""
        if self.nivel_influencia_pi == 'alta' and self.nivel_interes == 'alto':
            return 'gestionar_cerca'
        elif self.nivel_influencia_pi == 'alta':
            return 'mantener_satisfecho'
        elif self.nivel_interes == 'alto':
            return 'mantener_informado'
        return 'monitorear'

    @property
    def grupo_nombre(self) -> str:
        """Retorna el nombre del grupo (para serializers/frontend)."""
        return self.tipo.grupo.nombre if self.tipo and self.tipo.grupo else ''

    def generar_comunicacion_automatica(self):
        """
        Genera entradas en MatrizComunicacion para CADA canal de comunicación
        (principal + adicionales).

        Lógica inteligente según cuadrante:
        - Gestionar de cerca → Frecuencia alta (mensual/quincenal)
        - Mantener satisfecho → Frecuencia media (trimestral)
        - Mantener informado → Frecuencia media (bimestral)
        - Monitorear → Frecuencia baja (semestral/anual)
        """
        frecuencia_map = {
            'gestionar_cerca': 'mensual',
            'mantener_satisfecho': 'trimestral',
            'mantener_informado': 'bimestral',
            'monitorear': 'semestral',
        }

        frecuencia = frecuencia_map.get(self.cuadrante_matriz, 'trimestral')

        # Recolectar todos los canales (principal + adicionales), sin duplicados
        todos_canales = [self.canal_principal]
        if self.canales_adicionales:
            todos_canales.extend(self.canales_adicionales)
        todos_canales = list(dict.fromkeys(todos_canales))

        resultados = []
        for canal in todos_canales:
            comunicacion, created = MatrizComunicacion.objects.get_or_create(
                parte_interesada=self,
                como_comunicar=canal,
                defaults={
                    'que_comunicar': self.temas_interes_pi or 'Información relevante',
                    'cuando_comunicar': frecuencia,
                    'responsable': self.cargo_responsable,
                    'empresa': self.empresa,
                }
            )
            resultados.append((comunicacion, created))

        return resultados


class RequisitoParteInteresada(BaseCompanyModel):
    """
    Requisitos, necesidades y expectativas de partes interesadas.
    """
    class TipoRequisito(models.TextChoices):
        NECESIDAD = "necesidad", "Necesidad"
        EXPECTATIVA = "expectativa", "Expectativa"
        REQUISITO_LEGAL = "requisito_legal", "Requisito Legal"
        REQUISITO_CONTRACTUAL = "requisito_contractual", "Requisito Contractual"

    class Prioridad(models.TextChoices):
        ALTA = "alta", "Alta"
        MEDIA = "media", "Media"
        BAJA = "baja", "Baja"

    parte_interesada = models.ForeignKey(
        ParteInteresada,
        on_delete=models.CASCADE,
        related_name="requisitos",
        verbose_name="Parte Interesada"
    )
    tipo = models.CharField(
        max_length=25,
        choices=TipoRequisito.choices,
        default=TipoRequisito.EXPECTATIVA,
        verbose_name="Tipo de Requisito"
    )
    descripcion = models.TextField(verbose_name="Descripción")
    prioridad = models.CharField(
        max_length=10,
        choices=Prioridad.choices,
        default=Prioridad.MEDIA,
        verbose_name="Prioridad"
    )
    como_se_aborda = models.TextField(blank=True, verbose_name="Cómo se Aborda")
    proceso_relacionado = models.CharField(max_length=200, blank=True, verbose_name="Proceso Relacionado")
    indicador_seguimiento = models.CharField(max_length=200, blank=True, verbose_name="Indicador de Seguimiento")
    cumple = models.BooleanField(default=False, verbose_name="Cumple")
    evidencia_cumplimiento = models.TextField(blank=True, verbose_name="Evidencia de Cumplimiento")
    fecha_ultima_revision = models.DateField(null=True, blank=True, verbose_name="Última Revisión")

    class Meta:
        db_table = 'contexto_requisito_parte_interesada'
        verbose_name = "Requisito de Parte Interesada"
        verbose_name_plural = "Requisitos de Partes Interesadas"
        ordering = ["-prioridad", "tipo"]
        indexes = [
            models.Index(fields=["empresa", "parte_interesada"]),
            models.Index(fields=["empresa", "prioridad"])
        ]

    def __str__(self):
        return f"{self.get_tipo_display()}: {self.descripcion[:50]}"


class MatrizComunicacion(BaseCompanyModel):
    """
    Matriz de comunicaciones con partes interesadas.

    Define qué se comunica, cuándo, cómo y quién es responsable
    para cada parte interesada. Vinculada dinámicamente con las
    Normas ISO configuradas en el sistema.

    ISO 9001:2015 Cláusula 7.4 - Comunicación
    """
    class FrecuenciaComunicacion(models.TextChoices):
        DIARIA = "diaria", "Diaria"
        SEMANAL = "semanal", "Semanal"
        QUINCENAL = "quincenal", "Quincenal"
        MENSUAL = "mensual", "Mensual"
        BIMESTRAL = "bimestral", "Bimestral"
        TRIMESTRAL = "trimestral", "Trimestral"
        SEMESTRAL = "semestral", "Semestral"
        ANUAL = "anual", "Anual"
        SEGUN_NECESIDAD = "segun_necesidad", "Según Necesidad"

    class MedioComunicacion(models.TextChoices):
        EMAIL = "email", "Correo Electrónico"
        REUNION = "reunion", "Reunión Presencial"
        VIDEOCONFERENCIA = "videoconferencia", "Videoconferencia"
        INFORME = "informe", "Informe Escrito"
        CARTELERA = "cartelera", "Cartelera/Mural"
        INTRANET = "intranet", "Intranet/Portal"
        TELEFONO = "telefono", "Teléfono"
        WHATSAPP = "whatsapp", "WhatsApp/Mensajería"
        REDES = "redes", "Redes Sociales"
        CAPACITACION = "capacitacion", "Capacitación/Charla"
        OTRO = "otro", "Otro"

    parte_interesada = models.ForeignKey(
        ParteInteresada,
        on_delete=models.CASCADE,
        related_name="comunicaciones",
        verbose_name="Parte Interesada"
    )
    que_comunicar = models.TextField(
        verbose_name="Qué Comunicar",
        help_text="Información o mensaje a comunicar"
    )
    cuando_comunicar = models.CharField(
        max_length=20,
        choices=FrecuenciaComunicacion.choices,
        verbose_name="Frecuencia"
    )
    como_comunicar = models.CharField(
        max_length=20,
        choices=MedioComunicacion.choices,
        verbose_name="Medio de Comunicación"
    )
    # Responsable por Cargo (más estable organizacionalmente)
    responsable = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="comunicaciones_responsable",
        verbose_name="Cargo Responsable"
    )
    registro_evidencia = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Registro/Evidencia",
        help_text="Documento o registro donde queda evidencia de la comunicación"
    )

    # Relación dinámica con Normas ISO (reemplaza campos booleanos hardcodeados)
    normas_aplicables = models.ManyToManyField(
        'configuracion.NormaISO',
        blank=True,
        related_name="comunicaciones_matriz",
        verbose_name="Normas/Sistemas Aplicables",
        help_text="Normas ISO o sistemas de gestión a los que aplica esta comunicación"
    )

    # Campos adicionales para trazabilidad
    es_obligatoria = models.BooleanField(
        default=False,
        verbose_name="Comunicación Obligatoria",
        help_text="Indica si esta comunicación es de carácter obligatorio"
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name="Observaciones"
    )

    class Meta:
        db_table = 'contexto_matriz_comunicacion'
        verbose_name = "Comunicación con Parte Interesada"
        verbose_name_plural = "Matriz de Comunicaciones"
        ordering = ["parte_interesada", "cuando_comunicar"]
        indexes = [
            models.Index(fields=["empresa", "parte_interesada"]),
            models.Index(fields=["empresa", "cuando_comunicar"]),
            models.Index(fields=["empresa", "como_comunicar"]),
        ]

    def __str__(self):
        return f"{self.parte_interesada.nombre} - {self.get_como_comunicar_display()} ({self.get_cuando_comunicar_display()})"

    @property
    def normas_lista(self):
        """Retorna lista de códigos de normas aplicables."""
        return list(self.normas_aplicables.values_list('code', flat=True))
