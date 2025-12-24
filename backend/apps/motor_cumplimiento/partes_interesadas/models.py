"""
Modelos para Partes Interesadas
Subtabs: Identificacion PI, Requisitos PI, Matriz Comunicaciones
"""
from django.db import models
from django.conf import settings


class TipoParteInteresada(models.Model):
    class Categoria(models.TextChoices):
        INTERNA = "interna", "Interna"
        EXTERNA = "externa", "Externa"

    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    categoria = models.CharField(max_length=10, choices=Categoria.choices, default=Categoria.EXTERNA)
    descripcion = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tipo de Parte Interesada"
        verbose_name_plural = "Tipos de Partes Interesadas"
        ordering = ["categoria", "nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.get_categoria_display()})"


class ParteInteresada(models.Model):
    class NivelInfluencia(models.TextChoices):
        ALTA = "alta", "Alta"
        MEDIA = "media", "Media"
        BAJA = "baja", "Baja"

    class NivelInteres(models.TextChoices):
        ALTO = "alto", "Alto"
        MEDIO = "medio", "Medio"
        BAJO = "bajo", "Bajo"

    empresa_id = models.PositiveBigIntegerField(default=1, db_index=True)
    tipo = models.ForeignKey(TipoParteInteresada, on_delete=models.PROTECT, related_name="partes_interesadas")
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    representante = models.CharField(max_length=200, blank=True)
    cargo_representante = models.CharField(max_length=100, blank=True)
    telefono = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)
    nivel_influencia = models.CharField(max_length=10, choices=NivelInfluencia.choices, default=NivelInfluencia.MEDIA)
    nivel_interes = models.CharField(max_length=10, choices=NivelInteres.choices, default=NivelInteres.MEDIO)
    relacionado_sst = models.BooleanField(default=False)
    relacionado_ambiental = models.BooleanField(default=False)
    relacionado_calidad = models.BooleanField(default=False)
    relacionado_pesv = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="partes_interesadas_creadas")

    class Meta:
        verbose_name = "Parte Interesada"
        verbose_name_plural = "Partes Interesadas"
        ordering = ["-nivel_influencia", "-nivel_interes", "nombre"]
        indexes = [models.Index(fields=["empresa_id", "tipo"])]

    def __str__(self):
        return f"{self.nombre} ({self.tipo.nombre})"


class RequisitoParteInteresada(models.Model):
    class TipoRequisito(models.TextChoices):
        NECESIDAD = "necesidad", "Necesidad"
        EXPECTATIVA = "expectativa", "Expectativa"
        REQUISITO_LEGAL = "requisito_legal", "Requisito Legal"
        REQUISITO_CONTRACTUAL = "requisito_contractual", "Requisito Contractual"

    class Prioridad(models.TextChoices):
        ALTA = "alta", "Alta"
        MEDIA = "media", "Media"
        BAJA = "baja", "Baja"

    parte_interesada = models.ForeignKey(ParteInteresada, on_delete=models.CASCADE, related_name="requisitos")
    tipo = models.CharField(max_length=25, choices=TipoRequisito.choices, default=TipoRequisito.EXPECTATIVA)
    descripcion = models.TextField()
    prioridad = models.CharField(max_length=10, choices=Prioridad.choices, default=Prioridad.MEDIA)
    como_se_aborda = models.TextField(blank=True)
    proceso_relacionado = models.CharField(max_length=200, blank=True)
    indicador_seguimiento = models.CharField(max_length=200, blank=True)
    cumple = models.BooleanField(default=False)
    evidencia_cumplimiento = models.TextField(blank=True)
    fecha_ultima_revision = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Requisito de Parte Interesada"
        verbose_name_plural = "Requisitos de Partes Interesadas"
        ordering = ["-prioridad", "tipo"]

    def __str__(self):
        return f"{self.get_tipo_display()}: {self.descripcion[:50]}"


class MatrizComunicacion(models.Model):
    class FrecuenciaComunicacion(models.TextChoices):
        DIARIA = "diaria", "Diaria"
        SEMANAL = "semanal", "Semanal"
        QUINCENAL = "quincenal", "Quincenal"
        MENSUAL = "mensual", "Mensual"
        BIMESTRAL = "bimestral", "Bimestral"
        TRIMESTRAL = "trimestral", "Trimestral"
        SEMESTRAL = "semestral", "Semestral"
        ANUAL = "anual", "Anual"
        SEGUN_NECESIDAD = "segun_necesidad", "Segun Necesidad"

    class MedioComunicacion(models.TextChoices):
        EMAIL = "email", "Correo Electronico"
        REUNION = "reunion", "Reunion"
        INFORME = "informe", "Informe Escrito"
        CARTELERA = "cartelera", "Cartelera"
        INTRANET = "intranet", "Intranet"
        TELEFONO = "telefono", "Telefono"
        REDES = "redes", "Redes Sociales"
        OTRO = "otro", "Otro"

    empresa_id = models.PositiveBigIntegerField(default=1, db_index=True)
    parte_interesada = models.ForeignKey(ParteInteresada, on_delete=models.CASCADE, related_name="comunicaciones")
    que_comunicar = models.TextField()
    cuando_comunicar = models.CharField(max_length=20, choices=FrecuenciaComunicacion.choices)
    como_comunicar = models.CharField(max_length=20, choices=MedioComunicacion.choices)
    responsable = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="comunicaciones_responsable")
    registro_evidencia = models.CharField(max_length=200, blank=True)
    aplica_sst = models.BooleanField(default=False)
    aplica_ambiental = models.BooleanField(default=False)
    aplica_calidad = models.BooleanField(default=False)
    aplica_pesv = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Comunicacion con Parte Interesada"
        verbose_name_plural = "Matriz de Comunicaciones"
        ordering = ["parte_interesada", "cuando_comunicar"]

    def __str__(self):
        return f"{self.parte_interesada.nombre} - {self.get_cuando_comunicar_display()}"
