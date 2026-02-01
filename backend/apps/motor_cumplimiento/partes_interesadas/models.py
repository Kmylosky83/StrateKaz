"""
Modelos para Partes Interesadas
Subtabs: Identificacion PI, Requisitos PI, Matriz Comunicaciones
"""
from django.db import models
from django.conf import settings
from apps.core.base_models import TimestampedModel, SoftDeleteModel, BaseCompanyModel, OrderedModel


class TipoParteInteresada(TimestampedModel, SoftDeleteModel, OrderedModel):
    """
    Catálogo global de tipos de partes interesadas.

    Modelo global (no depende de empresa específica).
    Hereda: created_at, updated_at, is_active, deleted_at, orden
    """
    class Categoria(models.TextChoices):
        INTERNA = "interna", "Interna"
        EXTERNA = "externa", "Externa"

    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    categoria = models.CharField(max_length=10, choices=Categoria.choices, default=Categoria.EXTERNA)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = "Tipo de Parte Interesada"
        verbose_name_plural = "Tipos de Partes Interesadas"
        ordering = ["orden", "categoria", "nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.get_categoria_display()})"


class ParteInteresada(BaseCompanyModel):
    """
    Identificación de partes interesadas de la empresa.

    Modelo por empresa.
    Hereda: empresa, created_at, updated_at, created_by, updated_by, is_active, deleted_at
    """
    class NivelInfluencia(models.TextChoices):
        ALTA = "alta", "Alta"
        MEDIA = "media", "Media"
        BAJA = "baja", "Baja"

    class NivelInteres(models.TextChoices):
        ALTO = "alto", "Alto"
        MEDIO = "medio", "Medio"
        BAJO = "bajo", "Bajo"

    tipo = models.ForeignKey(
        TipoParteInteresada,
        on_delete=models.PROTECT,
        related_name="partes_interesadas",
        verbose_name="Tipo de Parte Interesada"
    )
    nombre = models.CharField(max_length=200, verbose_name="Nombre")
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    representante = models.CharField(max_length=200, blank=True, verbose_name="Representante")
    cargo_representante = models.CharField(max_length=100, blank=True, verbose_name="Cargo del Representante")
    telefono = models.CharField(max_length=50, blank=True, verbose_name="Teléfono")
    email = models.EmailField(blank=True, verbose_name="Correo Electrónico")
    direccion = models.TextField(blank=True, verbose_name="Dirección")

    # Análisis de influencia e interés
    nivel_influencia = models.CharField(
        max_length=10,
        choices=NivelInfluencia.choices,
        default=NivelInfluencia.MEDIA,
        verbose_name="Nivel de Influencia"
    )
    nivel_interes = models.CharField(
        max_length=10,
        choices=NivelInteres.choices,
        default=NivelInteres.MEDIO,
        verbose_name="Nivel de Interés"
    )

    # Relación con sistemas de gestión
    relacionado_sst = models.BooleanField(default=False, verbose_name="Relacionado con SST")
    relacionado_ambiental = models.BooleanField(default=False, verbose_name="Relacionado con Ambiental")
    relacionado_calidad = models.BooleanField(default=False, verbose_name="Relacionado con Calidad")
    relacionado_pesv = models.BooleanField(default=False, verbose_name="Relacionado con PESV")

    class Meta:
        verbose_name = "Parte Interesada"
        verbose_name_plural = "Partes Interesadas"
        ordering = ["-nivel_influencia", "-nivel_interes", "nombre"]
        indexes = [
            models.Index(fields=["empresa", "tipo"]),
            models.Index(fields=["empresa", "nivel_influencia", "nivel_interes"])
        ]

    def __str__(self):
        return f"{self.nombre} ({self.tipo.nombre})"


class RequisitoParteInteresada(BaseCompanyModel):
    """
    Requisitos, necesidades y expectativas de partes interesadas.

    Modelo por empresa.
    Hereda: empresa, created_at, updated_at, created_by, updated_by, is_active, deleted_at
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

    Modelo por empresa.
    Hereda: empresa, created_at, updated_at, created_by, updated_by, is_active, deleted_at
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
        REUNION = "reunion", "Reunión"
        INFORME = "informe", "Informe Escrito"
        CARTELERA = "cartelera", "Cartelera"
        INTRANET = "intranet", "Intranet"
        TELEFONO = "telefono", "Teléfono"
        REDES = "redes", "Redes Sociales"
        OTRO = "otro", "Otro"

    parte_interesada = models.ForeignKey(
        ParteInteresada,
        on_delete=models.CASCADE,
        related_name="comunicaciones",
        verbose_name="Parte Interesada"
    )
    que_comunicar = models.TextField(verbose_name="Qué Comunicar")
    cuando_comunicar = models.CharField(
        max_length=20,
        choices=FrecuenciaComunicacion.choices,
        verbose_name="Frecuencia"
    )
    como_comunicar = models.CharField(
        max_length=20,
        choices=MedioComunicacion.choices,
        verbose_name="Medio"
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="comunicaciones_responsable",
        verbose_name="Responsable"
    )
    registro_evidencia = models.CharField(max_length=200, blank=True, verbose_name="Registro/Evidencia")

    # Aplicabilidad a módulos
    aplica_sst = models.BooleanField(default=False, verbose_name="Aplica a SST")
    aplica_ambiental = models.BooleanField(default=False, verbose_name="Aplica a Ambiental")
    aplica_calidad = models.BooleanField(default=False, verbose_name="Aplica a Calidad")
    aplica_pesv = models.BooleanField(default=False, verbose_name="Aplica a PESV")

    class Meta:
        verbose_name = "Comunicación con Parte Interesada"
        verbose_name_plural = "Matriz de Comunicaciones"
        ordering = ["parte_interesada", "cuando_comunicar"]
        indexes = [
            models.Index(fields=["empresa", "parte_interesada"]),
            models.Index(fields=["empresa", "cuando_comunicar"])
        ]

    def __str__(self):
        return f"{self.parte_interesada.nombre} - {self.get_cuando_comunicar_display()}"
