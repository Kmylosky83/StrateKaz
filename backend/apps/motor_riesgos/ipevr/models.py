"""
Modelos para IPEVR - Identificación de Peligros, Evaluación y Valoración de Riesgos
Basado en GTC-45 (Guía Técnica Colombiana)
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class ClasificacionPeligro(models.Model):
    """Clasificación de peligros según GTC-45"""
    TIPO_CHOICES = [
        ('BIOLOGICO', 'Biológico'),
        ('FISICO', 'Físico'),
        ('QUIMICO', 'Químico'),
        ('PSICOSOCIAL', 'Psicosocial'),
        ('BIOMECANICO', 'Biomecánico'),
        ('CONDICIONES_SEGURIDAD', 'Condiciones de Seguridad'),
        ('FENOMENOS_NATURALES', 'Fenómenos Naturales'),
    ]

    codigo = models.CharField(max_length=20, unique=True, verbose_name='Código')
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES, verbose_name='Tipo')
    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    efectos_posibles = models.TextField(blank=True, verbose_name='Efectos Posibles en la Salud')
    is_active = models.BooleanField(default=True, verbose_name='Activo')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ipevr_clasificacion_peligro'
        verbose_name = 'Clasificación de Peligro'
        verbose_name_plural = 'Clasificaciones de Peligros'
        ordering = ['tipo', 'codigo']

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.nombre}"


class Peligro(models.Model):
    """Peligros identificados en la organización"""
    clasificacion = models.ForeignKey(
        ClasificacionPeligro,
        on_delete=models.PROTECT,
        related_name='peligros',
        verbose_name='Clasificación'
    )
    codigo = models.CharField(max_length=50, verbose_name='Código')
    descripcion = models.TextField(verbose_name='Descripción del Peligro')
    fuente = models.CharField(max_length=200, verbose_name='Fuente Generadora')
    medio = models.CharField(max_length=200, blank=True, verbose_name='Medio de Transmisión')
    efectos = models.TextField(verbose_name='Efectos Posibles')

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(db_index=True, verbose_name='Empresa ID')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='peligros_created', verbose_name='Creado por'
    )

    class Meta:
        db_table = 'ipevr_peligro'
        verbose_name = 'Peligro'
        verbose_name_plural = 'Peligros'
        ordering = ['clasificacion', 'codigo']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'clasificacion']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.descripcion[:50]}"


class MatrizIPEVR(models.Model):
    """Matriz de Identificación de Peligros y Valoración de Riesgos GTC-45"""

    ACEPTABILIDAD_CHOICES = [
        ('I', 'No Aceptable'),
        ('II', 'No Aceptable o Aceptable con Control Específico'),
        ('III', 'Aceptable'),
        ('IV', 'Aceptable'),
    ]

    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('VIGENTE', 'Vigente'),
        ('EN_REVISION', 'En Revisión'),
        ('OBSOLETO', 'Obsoleto'),
    ]

    # Identificación
    codigo = models.CharField(max_length=50, verbose_name='Código')
    proceso = models.CharField(max_length=200, verbose_name='Proceso')
    zona_lugar = models.CharField(max_length=200, verbose_name='Zona/Lugar')
    actividad = models.CharField(max_length=300, verbose_name='Actividad')
    tarea = models.CharField(max_length=300, verbose_name='Tarea')
    rutinaria = models.BooleanField(default=True, verbose_name='Tarea Rutinaria')

    # Peligro
    peligro = models.ForeignKey(
        Peligro, on_delete=models.PROTECT,
        related_name='matrices', verbose_name='Peligro'
    )

    # Controles existentes
    control_fuente = models.TextField(blank=True, verbose_name='Control en la Fuente')
    control_medio = models.TextField(blank=True, verbose_name='Control en el Medio')
    control_individuo = models.TextField(blank=True, verbose_name='Control en el Individuo')

    # Evaluación del riesgo - GTC-45
    # Nivel de Deficiencia (ND)
    nivel_deficiencia = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name='Nivel de Deficiencia (ND)',
        help_text='0=No deficiencia, 2=Bajo, 6=Medio, 10=Alto'
    )
    # Nivel de Exposición (NE)
    nivel_exposicion = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)],
        verbose_name='Nivel de Exposición (NE)',
        help_text='1=Esporádica, 2=Ocasional, 3=Frecuente, 4=Continua'
    )
    # Nivel de Probabilidad (NP = ND x NE) - Calculado
    nivel_probabilidad = models.IntegerField(
        editable=False, verbose_name='Nivel de Probabilidad (NP)'
    )
    # Nivel de Consecuencia (NC)
    nivel_consecuencia = models.IntegerField(
        validators=[MinValueValidator(10), MaxValueValidator(100)],
        verbose_name='Nivel de Consecuencia (NC)',
        help_text='10=Leve, 25=Grave, 60=Muy Grave, 100=Mortal'
    )
    # Nivel de Riesgo (NR = NP x NC) - Calculado
    nivel_riesgo = models.IntegerField(
        editable=False, verbose_name='Nivel de Riesgo (NR)'
    )
    # Interpretación del NR
    interpretacion_nr = models.CharField(
        max_length=20, editable=False,
        verbose_name='Interpretación del NR'
    )
    # Aceptabilidad
    aceptabilidad = models.CharField(
        max_length=5, choices=ACEPTABILIDAD_CHOICES,
        editable=False, verbose_name='Aceptabilidad del Riesgo'
    )

    # Número de expuestos
    num_expuestos = models.PositiveIntegerField(
        default=1, verbose_name='Número de Expuestos'
    )

    # Peor consecuencia
    peor_consecuencia = models.TextField(verbose_name='Peor Consecuencia')

    # Requisito legal asociado
    requisito_legal = models.TextField(blank=True, verbose_name='Requisito Legal Asociado')

    # Estado y gestión
    estado = models.CharField(
        max_length=20, choices=ESTADO_CHOICES,
        default='BORRADOR', verbose_name='Estado'
    )
    fecha_evaluacion = models.DateField(verbose_name='Fecha de Evaluación')
    proxima_revision = models.DateField(
        null=True, blank=True, verbose_name='Próxima Revisión'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(db_index=True, verbose_name='Empresa ID')

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='matrices_ipevr_created', verbose_name='Creado por'
    )

    class Meta:
        db_table = 'ipevr_matriz'
        verbose_name = 'Matriz IPEVR'
        verbose_name_plural = 'Matrices IPEVR'
        ordering = ['-nivel_riesgo', 'proceso']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'proceso']),
            models.Index(fields=['empresa_id', 'aceptabilidad']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.proceso} - {self.actividad[:30]}"

    def save(self, *args, **kwargs):
        # Calcular NP (Nivel de Probabilidad)
        self.nivel_probabilidad = self.nivel_deficiencia * self.nivel_exposicion

        # Calcular NR (Nivel de Riesgo)
        self.nivel_riesgo = self.nivel_probabilidad * self.nivel_consecuencia

        # Interpretar NR según GTC-45
        self.interpretacion_nr = self._interpretar_nivel_riesgo()
        self.aceptabilidad = self._calcular_aceptabilidad()

        super().save(*args, **kwargs)

    def _interpretar_nivel_riesgo(self):
        """Interpreta el nivel de riesgo según GTC-45"""
        nr = self.nivel_riesgo
        if nr >= 600:
            return 'I'
        elif nr >= 150:
            return 'II'
        elif nr >= 40:
            return 'III'
        else:
            return 'IV'

    def _calcular_aceptabilidad(self):
        """Calcula aceptabilidad según interpretación"""
        return self.interpretacion_nr

    def get_interpretacion_display(self):
        """Texto descriptivo de la interpretación"""
        interpretaciones = {
            'I': 'Situación crítica. Suspender actividades hasta control.',
            'II': 'Corregir y adoptar medidas de control inmediato.',
            'III': 'Mejorar si es posible. Justificar intervención.',
            'IV': 'Mantener medidas de control existentes.',
        }
        return interpretaciones.get(self.interpretacion_nr, '')


class ControlPropuesto(models.Model):
    """Controles propuestos para la matriz IPEVR"""
    TIPO_CONTROL_CHOICES = [
        ('ELIMINACION', 'Eliminación'),
        ('SUSTITUCION', 'Sustitución'),
        ('CONTROLES_INGENIERIA', 'Controles de Ingeniería'),
        ('CONTROLES_ADMIN', 'Controles Administrativos'),
        ('EPP', 'Equipos de Protección Personal'),
    ]

    ESTADO_CHOICES = [
        ('PROPUESTO', 'Propuesto'),
        ('EN_IMPLEMENTACION', 'En Implementación'),
        ('IMPLEMENTADO', 'Implementado'),
        ('VERIFICADO', 'Verificado'),
    ]

    matriz = models.ForeignKey(
        MatrizIPEVR, on_delete=models.CASCADE,
        related_name='controles_propuestos', verbose_name='Matriz IPEVR'
    )
    tipo_control = models.CharField(
        max_length=25, choices=TIPO_CONTROL_CHOICES,
        verbose_name='Tipo de Control'
    )
    descripcion = models.TextField(verbose_name='Descripción del Control')
    responsable = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='controles_ipevr_responsable', verbose_name='Responsable'
    )
    fecha_implementacion = models.DateField(
        null=True, blank=True, verbose_name='Fecha de Implementación'
    )
    estado = models.CharField(
        max_length=20, choices=ESTADO_CHOICES,
        default='PROPUESTO', verbose_name='Estado'
    )
    evidencia = models.TextField(blank=True, verbose_name='Evidencia')

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(db_index=True, verbose_name='Empresa ID')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ipevr_control_propuesto'
        verbose_name = 'Control Propuesto'
        verbose_name_plural = 'Controles Propuestos'
        ordering = ['tipo_control', 'fecha_implementacion']

    def __str__(self):
        return f"{self.get_tipo_control_display()} - {self.descripcion[:50]}"
