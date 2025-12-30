"""
Modelos para IPEVR - Identificacion de Peligros, Evaluacion y Valoracion de Riesgos
====================================================================================

Sistema basado en GTC-45 (Guia Tecnica Colombiana) para la identificacion
de peligros y valoracion de riesgos ocupacionales.

Incluye:
- Clasificacion de 78 peligros en 7 categorias
- Matriz IPEVR con calculo automatico de NP, NR y aceptabilidad
- Controles segun jerarquia GTC-45

Autor: Sistema ERP StrateKaz
Fecha: 26 Diciembre 2025
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

from apps.core.base_models import BaseCompanyModel, TimestampedModel, SoftDeleteModel, OrderedModel


class ClasificacionPeligro(TimestampedModel, SoftDeleteModel, OrderedModel):
    """
    Catalogo global de clasificaciones de peligros segun GTC-45.

    Las 7 categorias principales de peligros ocupacionales:
    - Biologico: Virus, bacterias, hongos, parasitos
    - Fisico: Ruido, iluminacion, vibracion, temperaturas
    - Quimico: Gases, vapores, polvos, liquidos
    - Psicosocial: Carga mental, estres, acoso
    - Biomecanico: Posturas, movimientos repetitivos, cargas
    - Seguridad: Mecanico, electrico, locativo, accidentes
    - Fenomenos naturales: Sismos, inundaciones, tormentas
    """

    class Categoria(models.TextChoices):
        BIOLOGICO = "biologico", "Biologico"
        FISICO = "fisico", "Fisico"
        QUIMICO = "quimico", "Quimico"
        PSICOSOCIAL = "psicosocial", "Psicosocial"
        BIOMECANICO = "biomecanico", "Biomecanico"
        SEGURIDAD = "seguridad", "Condiciones de Seguridad"
        FENOMENOS = "fenomenos", "Fenomenos Naturales"

    codigo = models.CharField(
        max_length=10,
        unique=True,
        db_index=True,
        verbose_name='Codigo'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    categoria = models.CharField(
        max_length=15,
        choices=Categoria.choices,
        default=Categoria.SEGURIDAD,
        verbose_name='Categoria GTC-45'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripcion'
    )
    color = models.CharField(
        max_length=7,
        default='#6B7280',
        verbose_name='Color',
        help_text='Color hexadecimal para visualizacion'
    )
    icono = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Icono',
        help_text='Nombre del icono Lucide'
    )

    class Meta:
        db_table = 'motor_riesgos_clasificacion_peligro'
        verbose_name = 'Clasificacion de Peligro'
        verbose_name_plural = 'Clasificaciones de Peligros'
        ordering = ['orden', 'categoria', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class PeligroGTC45(TimestampedModel, SoftDeleteModel, OrderedModel):
    """
    Catalogo de peligros segun GTC-45.

    Contiene los 78 peligros tipificados en la guia tecnica colombiana,
    organizados por clasificacion.
    """

    clasificacion = models.ForeignKey(
        ClasificacionPeligro,
        on_delete=models.PROTECT,
        related_name='peligros',
        verbose_name='Clasificacion'
    )
    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Codigo'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Peligro'
    )
    descripcion = models.TextField(
        verbose_name='Descripcion'
    )
    efectos_posibles = models.TextField(
        verbose_name='Efectos Posibles en la Salud',
        help_text='Consecuencias potenciales para la salud del trabajador'
    )

    class Meta:
        db_table = 'motor_riesgos_peligro_gtc45'
        verbose_name = 'Peligro GTC-45'
        verbose_name_plural = 'Peligros GTC-45'
        ordering = ['clasificacion', 'orden', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class MatrizIPEVR(BaseCompanyModel):
    """
    Matriz de Identificacion de Peligros y Valoracion de Riesgos.

    Implementa el metodo GTC-45 para valoracion de riesgos ocupacionales:
    - NP (Nivel de Probabilidad) = ND x NE
    - NR (Nivel de Riesgo) = NP x NC
    - Aceptabilidad segun interpretacion del NR

    Escala de Nivel de Deficiencia (ND):
    - 10: Muy Alto - Se ha(n) detectado peligro(s) que determina(n) como muy posible
    - 6: Alto - Se ha(n) detectado algun(os) peligro(s) que pueden dar lugar
    - 2: Medio - Se han detectado peligros que pueden dar lugar
    - 0: Sin deficiencia - No se ha detectado peligro

    Escala de Nivel de Exposicion (NE):
    - 4: Continua - La situacion de exposicion se presenta sin interrupcion
    - 3: Frecuente - La situacion de exposicion varias veces durante jornada
    - 2: Ocasional - Alguna vez durante la jornada laboral
    - 1: Esporadica - Involucra por tiempos cortos

    Escala de Nivel de Consecuencia (NC):
    - 100: Mortal o Catastrofico - Muerte
    - 60: Muy Grave - Lesiones graves irreparables
    - 25: Grave - Lesiones con incapacidad temporal
    - 10: Leve - Lesiones que no requieren hospitalizacion
    """

    class EstadoMatriz(models.TextChoices):
        BORRADOR = "borrador", "Borrador"
        EN_REVISION = "en_revision", "En Revision"
        APROBADA = "aprobada", "Aprobada"
        VIGENTE = "vigente", "Vigente"
        OBSOLETA = "obsoleta", "Obsoleta"

    # Identificacion del puesto/actividad
    area = models.CharField(
        max_length=200,
        verbose_name='Area/Seccion'
    )
    cargo = models.CharField(
        max_length=200,
        verbose_name='Cargo'
    )
    proceso = models.CharField(
        max_length=200,
        verbose_name='Proceso'
    )
    actividad = models.CharField(
        max_length=300,
        verbose_name='Actividad'
    )
    tarea = models.TextField(
        verbose_name='Tarea Especifica'
    )
    rutinaria = models.BooleanField(
        default=True,
        verbose_name='Tarea Rutinaria',
        help_text='Marcar si la tarea se realiza de forma habitual'
    )

    # Peligro identificado
    peligro = models.ForeignKey(
        PeligroGTC45,
        on_delete=models.PROTECT,
        related_name='matrices_ipevr',
        verbose_name='Peligro'
    )
    fuente = models.CharField(
        max_length=200,
        verbose_name='Fuente Generadora',
        help_text='Que genera el peligro'
    )
    medio = models.CharField(
        max_length=200,
        verbose_name='Medio de Propagacion',
        help_text='Como se transmite el peligro'
    )
    trabajador = models.CharField(
        max_length=200,
        verbose_name='Receptor/Trabajador',
        help_text='Quien esta expuesto'
    )
    efectos = models.TextField(
        verbose_name='Efectos Posibles'
    )

    # Controles existentes
    control_fuente = models.TextField(
        blank=True,
        verbose_name='Control en la Fuente'
    )
    control_medio = models.TextField(
        blank=True,
        verbose_name='Control en el Medio'
    )
    control_individuo = models.TextField(
        blank=True,
        verbose_name='Control en el Individuo (EPP)'
    )

    # Evaluacion del riesgo GTC-45
    nivel_deficiencia = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name='Nivel de Deficiencia (ND)',
        help_text='0=Sin deficiencia, 2=Medio, 6=Alto, 10=Muy Alto'
    )
    nivel_exposicion = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)],
        verbose_name='Nivel de Exposicion (NE)',
        help_text='1=Esporadica, 2=Ocasional, 3=Frecuente, 4=Continua'
    )
    nivel_consecuencia = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(10), MaxValueValidator(100)],
        verbose_name='Nivel de Consecuencia (NC)',
        help_text='10=Leve, 25=Grave, 60=Muy Grave, 100=Mortal'
    )

    # Numero de expuestos
    num_expuestos = models.PositiveSmallIntegerField(
        default=1,
        verbose_name='Numero de Expuestos'
    )

    # Peor consecuencia y requisito legal
    peor_consecuencia = models.TextField(
        verbose_name='Peor Consecuencia',
        help_text='Descripcion del peor escenario posible'
    )
    requisito_legal = models.TextField(
        blank=True,
        verbose_name='Requisito Legal Asociado'
    )

    # Medidas de intervencion propuestas
    eliminacion = models.TextField(
        blank=True,
        verbose_name='Eliminacion'
    )
    sustitucion = models.TextField(
        blank=True,
        verbose_name='Sustitucion'
    )
    controles_ingenieria = models.TextField(
        blank=True,
        verbose_name='Controles de Ingenieria'
    )
    controles_administrativos = models.TextField(
        blank=True,
        verbose_name='Controles Administrativos'
    )
    epp = models.TextField(
        blank=True,
        verbose_name='Equipos de Proteccion Personal'
    )

    # Responsable y fechas
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='matrices_ipevr_responsable',
        verbose_name='Responsable'
    )
    fecha_valoracion = models.DateField(
        verbose_name='Fecha de Valoracion'
    )
    fecha_proxima_revision = models.DateField(
        null=True,
        blank=True,
        verbose_name='Proxima Revision'
    )

    # Estado
    estado = models.CharField(
        max_length=15,
        choices=EstadoMatriz.choices,
        default=EstadoMatriz.BORRADOR,
        verbose_name='Estado'
    )

    class Meta:
        db_table = 'motor_riesgos_matriz_ipevr'
        verbose_name = 'Matriz IPEVR'
        verbose_name_plural = 'Matrices IPEVR'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa', 'area']),
            models.Index(fields=['empresa', 'cargo']),
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['empresa', 'peligro']),
        ]

    def __str__(self):
        return f"{self.area} - {self.cargo} - {self.peligro.nombre[:30]}"

    @property
    def nivel_probabilidad(self):
        """NP = ND x NE"""
        return self.nivel_deficiencia * self.nivel_exposicion

    @property
    def interpretacion_np(self):
        """Interpreta el nivel de probabilidad segun GTC-45."""
        np = self.nivel_probabilidad
        if np >= 24:
            return "muy_alto"
        elif np >= 10:
            return "alto"
        elif np >= 6:
            return "medio"
        return "bajo"

    @property
    def nivel_riesgo(self):
        """NR = NP x NC"""
        return self.nivel_probabilidad * self.nivel_consecuencia

    @property
    def interpretacion_nr(self):
        """
        Interpreta el nivel de riesgo segun GTC-45.
        I: NR >= 600
        II: 150 <= NR < 600
        III: 40 <= NR < 150
        IV: NR < 40
        """
        nr = self.nivel_riesgo
        if nr >= 600:
            return "I"
        elif nr >= 150:
            return "II"
        elif nr >= 40:
            return "III"
        return "IV"

    @property
    def aceptabilidad(self):
        """
        Determina la aceptabilidad del riesgo.
        I, II: No aceptable
        III, IV: Aceptable (con control)
        """
        interp = self.interpretacion_nr
        if interp in ["I", "II"]:
            return "no_aceptable"
        return "aceptable"

    @property
    def significado_aceptabilidad(self):
        """Texto descriptivo de la aceptabilidad."""
        significados = {
            "I": "Situacion critica. Suspender actividades hasta controlar el riesgo.",
            "II": "Corregir y adoptar medidas de control de inmediato.",
            "III": "Mejorar si es posible. Seria conveniente justificar la intervencion.",
            "IV": "Mantener medidas de control existentes. Considerar soluciones rentables.",
        }
        return significados.get(self.interpretacion_nr, "")


class ControlSST(BaseCompanyModel):
    """
    Controles de SST implementados para una matriz IPEVR.

    Sigue la jerarquia de controles de la GTC-45:
    1. Eliminacion
    2. Sustitucion
    3. Controles de Ingenieria
    4. Controles Administrativos
    5. EPP (Equipos de Proteccion Personal)
    """

    class TipoControl(models.TextChoices):
        ELIMINACION = "eliminacion", "Eliminacion"
        SUSTITUCION = "sustitucion", "Sustitucion"
        INGENIERIA = "ingenieria", "Control de Ingenieria"
        ADMINISTRATIVO = "administrativo", "Control Administrativo"
        EPP = "epp", "Equipo de Proteccion Personal"

    class EstadoControl(models.TextChoices):
        PROPUESTO = "propuesto", "Propuesto"
        EN_IMPLEMENTACION = "en_implementacion", "En Implementacion"
        IMPLEMENTADO = "implementado", "Implementado"
        VERIFICADO = "verificado", "Verificado"
        CANCELADO = "cancelado", "Cancelado"

    class Efectividad(models.TextChoices):
        ALTA = "alta", "Alta"
        MEDIA = "media", "Media"
        BAJA = "baja", "Baja"
        NO_EVALUADA = "no_evaluada", "No Evaluada"

    matriz_ipevr = models.ForeignKey(
        MatrizIPEVR,
        on_delete=models.CASCADE,
        related_name='controles_sst',
        verbose_name='Matriz IPEVR'
    )
    tipo_control = models.CharField(
        max_length=15,
        choices=TipoControl.choices,
        verbose_name='Tipo de Control'
    )
    descripcion = models.TextField(
        verbose_name='Descripcion del Control'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='controles_sst_responsable',
        verbose_name='Responsable'
    )
    fecha_implementacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Implementacion'
    )
    estado = models.CharField(
        max_length=20,
        choices=EstadoControl.choices,
        default=EstadoControl.PROPUESTO,
        verbose_name='Estado'
    )
    efectividad = models.CharField(
        max_length=15,
        choices=Efectividad.choices,
        default=Efectividad.NO_EVALUADA,
        verbose_name='Efectividad'
    )
    evidencia = models.FileField(
        upload_to='sst/controles/',
        blank=True,
        null=True,
        verbose_name='Evidencia'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'motor_riesgos_control_sst'
        verbose_name = 'Control SST'
        verbose_name_plural = 'Controles SST'
        ordering = ['tipo_control', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'matriz_ipevr']),
            models.Index(fields=['empresa', 'tipo_control']),
            models.Index(fields=['empresa', 'estado']),
        ]

    def __str__(self):
        return f"{self.get_tipo_control_display()} - {self.descripcion[:50]}"
