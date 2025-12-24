"""
Modelos para contexto_organizacional - motor_riesgos
Análisis DOFA y PESTEL para contexto organizacional
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class FactorExterno(models.Model):
    """Factores externos PESTEL"""
    TIPO_CHOICES = [
        ('POLITICO', 'Político'),
        ('ECONOMICO', 'Económico'),
        ('SOCIAL', 'Social'),
        ('TECNOLOGICO', 'Tecnológico'),
        ('ECOLOGICO', 'Ecológico'),
        ('LEGAL', 'Legal'),
    ]

    IMPACTO_CHOICES = [
        ('POSITIVO', 'Positivo'),
        ('NEGATIVO', 'Negativo'),
        ('NEUTRO', 'Neutro'),
    ]

    PROBABILIDAD_CHOICES = [
        ('ALTA', 'Alta'),
        ('MEDIA', 'Media'),
        ('BAJA', 'Baja'),
    ]

    RELEVANCIA_CHOICES = [
        ('ALTA', 'Alta'),
        ('MEDIA', 'Media'),
        ('BAJA', 'Baja'),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, verbose_name='Tipo PESTEL')
    descripcion = models.TextField(verbose_name='Descripción')
    impacto = models.CharField(max_length=20, choices=IMPACTO_CHOICES, verbose_name='Impacto')
    probabilidad = models.CharField(max_length=20, choices=PROBABILIDAD_CHOICES, verbose_name='Probabilidad')
    relevancia = models.CharField(max_length=20, choices=RELEVANCIA_CHOICES, verbose_name='Relevancia')
    is_active = models.BooleanField(default=True, verbose_name='Activo')

    empresa_id = models.PositiveBigIntegerField(db_index=True, verbose_name='Empresa ID')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='factores_externos_created', verbose_name='Creado por'
    )

    class Meta:
        db_table = 'contexto_factor_externo'
        verbose_name = 'Factor Externo'
        verbose_name_plural = 'Factores Externos'
        ordering = ['tipo', '-created_at']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.descripcion[:50]}"


class FactorInterno(models.Model):
    """Factores internos para DOFA"""
    TIPO_CHOICES = [
        ('FORTALEZA', 'Fortaleza'),
        ('DEBILIDAD', 'Debilidad'),
    ]

    IMPACTO_CHOICES = [
        ('ALTO', 'Alto'),
        ('MEDIO', 'Medio'),
        ('BAJO', 'Bajo'),
    ]

    RELEVANCIA_CHOICES = [
        ('ALTA', 'Alta'),
        ('MEDIA', 'Media'),
        ('BAJA', 'Baja'),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, verbose_name='Tipo')
    descripcion = models.TextField(verbose_name='Descripción')
    area_afectada = models.CharField(max_length=200, verbose_name='Área Afectada')
    impacto = models.CharField(max_length=20, choices=IMPACTO_CHOICES, verbose_name='Impacto')
    relevancia = models.CharField(max_length=20, choices=RELEVANCIA_CHOICES, verbose_name='Relevancia')
    is_active = models.BooleanField(default=True, verbose_name='Activo')

    empresa_id = models.PositiveBigIntegerField(db_index=True, verbose_name='Empresa ID')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='factores_internos_created', verbose_name='Creado por'
    )

    class Meta:
        db_table = 'contexto_factor_interno'
        verbose_name = 'Factor Interno'
        verbose_name_plural = 'Factores Internos'
        ordering = ['tipo', '-created_at']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.descripcion[:50]}"


class AnalisisDOFA(models.Model):
    """Análisis DOFA consolidado"""
    periodo = models.CharField(max_length=50, verbose_name='Período')
    fecha_analisis = models.DateField(verbose_name='Fecha de Análisis')
    fortalezas = models.ManyToManyField(
        FactorInterno, related_name='analisis_fortalezas',
        limit_choices_to={'tipo': 'FORTALEZA'}, blank=True
    )
    debilidades = models.ManyToManyField(
        FactorInterno, related_name='analisis_debilidades',
        limit_choices_to={'tipo': 'DEBILIDAD'}, blank=True
    )
    oportunidades = models.ManyToManyField(
        FactorExterno, related_name='analisis_oportunidades',
        limit_choices_to={'impacto': 'POSITIVO'}, blank=True
    )
    amenazas = models.ManyToManyField(
        FactorExterno, related_name='analisis_amenazas',
        limit_choices_to={'impacto': 'NEGATIVO'}, blank=True
    )
    conclusiones = models.TextField(blank=True, verbose_name='Conclusiones')
    elaborado_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='dofa_elaborados', verbose_name='Elaborado por'
    )
    aprobado_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='dofa_aprobados', verbose_name='Aprobado por'
    )

    empresa_id = models.PositiveBigIntegerField(db_index=True, verbose_name='Empresa ID')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contexto_analisis_dofa'
        verbose_name = 'Análisis DOFA'
        verbose_name_plural = 'Análisis DOFA'
        ordering = ['-fecha_analisis']
        indexes = [
            models.Index(fields=['empresa_id', 'periodo']),
        ]

    def __str__(self):
        return f"DOFA - {self.periodo}"


class EstrategiaDOFA(models.Model):
    """Estrategias derivadas del análisis DOFA"""
    TIPO_CHOICES = [
        ('FO', 'FO - Fortalezas/Oportunidades'),
        ('FA', 'FA - Fortalezas/Amenazas'),
        ('DO', 'DO - Debilidades/Oportunidades'),
        ('DA', 'DA - Debilidades/Amenazas'),
    ]

    PRIORIDAD_CHOICES = [
        ('ALTA', 'Alta'),
        ('MEDIA', 'Media'),
        ('BAJA', 'Baja'),
    ]

    ESTADO_CHOICES = [
        ('PROPUESTA', 'Propuesta'),
        ('APROBADA', 'Aprobada'),
        ('EN_EJECUCION', 'En Ejecución'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]

    analisis_dofa = models.ForeignKey(
        AnalisisDOFA, on_delete=models.CASCADE,
        related_name='estrategias', verbose_name='Análisis DOFA'
    )
    tipo = models.CharField(max_length=5, choices=TIPO_CHOICES, verbose_name='Tipo')
    descripcion = models.TextField(verbose_name='Descripción')
    objetivo = models.TextField(verbose_name='Objetivo')
    responsable = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='estrategias_responsable', verbose_name='Responsable'
    )
    fecha_limite = models.DateField(null=True, blank=True, verbose_name='Fecha Límite')
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, verbose_name='Prioridad')
    estado = models.CharField(
        max_length=20, choices=ESTADO_CHOICES,
        default='PROPUESTA', verbose_name='Estado'
    )

    empresa_id = models.PositiveBigIntegerField(db_index=True, verbose_name='Empresa ID')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='estrategias_created', verbose_name='Creado por'
    )

    class Meta:
        db_table = 'contexto_estrategia_dofa'
        verbose_name = 'Estrategia DOFA'
        verbose_name_plural = 'Estrategias DOFA'
        ordering = ['prioridad', '-created_at']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo']),
            models.Index(fields=['empresa_id', 'estado']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.descripcion[:50]}"
