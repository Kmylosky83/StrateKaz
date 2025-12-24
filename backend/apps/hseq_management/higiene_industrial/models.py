"""
Modelos para Higiene Industrial - HSEQ Management
Gestión de mediciones ambientales, controles de exposición y monitoreo biológico
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal


class TipoAgente(models.Model):
    """
    Tipos de agentes de riesgo (físicos, químicos, biológicos, etc.)
    """
    CATEGORIA_CHOICES = [
        ('FISICO', 'Físico'),
        ('QUIMICO', 'Químico'),
        ('BIOLOGICO', 'Biológico'),
        ('ERGONOMICO', 'Ergonómico'),
        ('PSICOSOCIAL', 'Psicosocial'),
    ]

    empresa_id = models.IntegerField(
        verbose_name='ID Empresa',
        help_text='ID de la empresa (multi-tenant)',
        db_index=True
    )
    codigo = models.CharField(
        max_length=20,
        verbose_name='Código',
        help_text='Código único del tipo de agente'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre'
    )
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_CHOICES,
        verbose_name='Categoría'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    normativa_aplicable = models.TextField(
        blank=True,
        verbose_name='Normativa Aplicable',
        help_text='Normativas y resoluciones aplicables (ej: Res. 2400/1979)'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')
    created_by = models.CharField(max_length=100, blank=True, verbose_name='Creado Por')
    updated_by = models.CharField(max_length=100, blank=True, verbose_name='Actualizado Por')

    class Meta:
        db_table = 'hseq_tipo_agente'
        verbose_name = 'Tipo de Agente'
        verbose_name_plural = 'Tipos de Agentes'
        ordering = ['categoria', 'nombre']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id', 'categoria']),
            models.Index(fields=['empresa_id', 'is_active']),
        ]

    def __str__(self):
        return f"{self.get_categoria_display()} - {self.nombre}"


class AgenteRiesgo(models.Model):
    """
    Agentes específicos de riesgo: ruido, iluminación, material particulado, etc.
    """
    empresa_id = models.IntegerField(
        verbose_name='ID Empresa',
        db_index=True
    )
    tipo_agente = models.ForeignKey(
        TipoAgente,
        on_delete=models.PROTECT,
        related_name='agentes',
        verbose_name='Tipo de Agente'
    )
    codigo = models.CharField(
        max_length=30,
        verbose_name='Código',
        help_text='Código único del agente (ej: RUI-001)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Agente',
        help_text='Ej: Ruido Continuo, Polvo de Sílice, Vibración Mano-Brazo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Límites permisibles
    limite_permisible = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Límite Permisible',
        help_text='Valor límite según normativa'
    )
    unidad_medida = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Unidad de Medida',
        help_text='Ej: dB(A), lux, mg/m³, ppm'
    )
    tiempo_exposicion_referencia = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Tiempo de Exposición',
        help_text='Ej: 8 horas, TWA, STEL'
    )

    # Efectos en la salud
    efectos_salud = models.TextField(
        blank=True,
        verbose_name='Efectos en la Salud'
    )

    # Vías de entrada (para químicos/biológicos)
    via_respiratoria = models.BooleanField(
        default=False,
        verbose_name='Vía Respiratoria'
    )
    via_dermica = models.BooleanField(
        default=False,
        verbose_name='Vía Dérmica'
    )
    via_digestiva = models.BooleanField(
        default=False,
        verbose_name='Vía Digestiva'
    )
    via_parenteral = models.BooleanField(
        default=False,
        verbose_name='Vía Parenteral'
    )

    normativa_referencia = models.TextField(
        blank=True,
        verbose_name='Normativa de Referencia'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')
    created_by = models.CharField(max_length=100, blank=True, verbose_name='Creado Por')
    updated_by = models.CharField(max_length=100, blank=True, verbose_name='Actualizado Por')

    class Meta:
        db_table = 'hseq_agente_riesgo'
        verbose_name = 'Agente de Riesgo'
        verbose_name_plural = 'Agentes de Riesgo'
        ordering = ['tipo_agente', 'nombre']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id', 'tipo_agente']),
            models.Index(fields=['empresa_id', 'is_active']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class GrupoExposicionSimilar(models.Model):
    """
    GES - Grupos de Exposición Similar
    Grupos de trabajadores con exposición similar a agentes de riesgo
    """
    empresa_id = models.IntegerField(
        verbose_name='ID Empresa',
        db_index=True
    )
    codigo = models.CharField(
        max_length=30,
        verbose_name='Código GES',
        help_text='Código único del grupo'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del GES',
        help_text='Ej: Operadores de Planta, Personal de Mantenimiento'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Ubicación y área
    area = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Área de Trabajo'
    )
    proceso = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Proceso'
    )

    # Número de trabajadores
    numero_trabajadores = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Número de Trabajadores'
    )

    # Agentes a los que está expuesto
    agentes_riesgo = models.ManyToManyField(
        AgenteRiesgo,
        related_name='grupos_exposicion',
        verbose_name='Agentes de Riesgo',
        blank=True
    )

    # Jornada laboral
    horas_dia = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=8,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Horas por Día'
    )
    dias_semana = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(7)],
        verbose_name='Días por Semana'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')
    created_by = models.CharField(max_length=100, blank=True, verbose_name='Creado Por')
    updated_by = models.CharField(max_length=100, blank=True, verbose_name='Actualizado Por')

    class Meta:
        db_table = 'hseq_grupo_exposicion_similar'
        verbose_name = 'Grupo de Exposición Similar (GES)'
        verbose_name_plural = 'Grupos de Exposición Similar (GES)'
        ordering = ['area', 'nombre']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id', 'is_active']),
            models.Index(fields=['empresa_id', 'area']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.numero_trabajadores} trabajadores)"


class PuntoMedicion(models.Model):
    """
    Ubicaciones específicas de medición ambiental
    """
    empresa_id = models.IntegerField(
        verbose_name='ID Empresa',
        db_index=True
    )
    codigo = models.CharField(
        max_length=30,
        verbose_name='Código Punto',
        help_text='Código único del punto de medición'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Punto'
    )

    # Ubicación
    area = models.CharField(
        max_length=200,
        verbose_name='Área'
    )
    seccion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Sección'
    )
    coordenadas_x = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Coordenada X'
    )
    coordenadas_y = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Coordenada Y'
    )
    coordenadas_z = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Coordenada Z (altura)'
    )

    # Relación con GES
    grupo_exposicion = models.ForeignKey(
        GrupoExposicionSimilar,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='puntos_medicion',
        verbose_name='Grupo de Exposición'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')
    created_by = models.CharField(max_length=100, blank=True, verbose_name='Creado Por')
    updated_by = models.CharField(max_length=100, blank=True, verbose_name='Actualizado Por')

    class Meta:
        db_table = 'hseq_punto_medicion'
        verbose_name = 'Punto de Medición'
        verbose_name_plural = 'Puntos de Medición'
        ordering = ['area', 'nombre']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id', 'is_active']),
            models.Index(fields=['empresa_id', 'area']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.area})"


class MedicionAmbiental(models.Model):
    """
    Mediciones ambientales con valores, límites permisibles y evaluación de cumplimiento
    """
    ESTADO_CHOICES = [
        ('PLANIFICADA', 'Planificada'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADA', 'Completada'),
        ('REVISADA', 'Revisada'),
        ('APROBADA', 'Aprobada'),
        ('CANCELADA', 'Cancelada'),
    ]

    CUMPLIMIENTO_CHOICES = [
        ('CUMPLE', 'Cumple'),
        ('NO_CUMPLE', 'No Cumple'),
        ('PENDIENTE', 'Pendiente Evaluación'),
    ]

    empresa_id = models.IntegerField(
        verbose_name='ID Empresa',
        db_index=True
    )
    numero_medicion = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Número de Medición',
        help_text='Número único consecutivo de medición'
    )

    # Agente y punto
    agente_riesgo = models.ForeignKey(
        AgenteRiesgo,
        on_delete=models.PROTECT,
        related_name='mediciones',
        verbose_name='Agente de Riesgo'
    )
    punto_medicion = models.ForeignKey(
        PuntoMedicion,
        on_delete=models.PROTECT,
        related_name='mediciones',
        verbose_name='Punto de Medición'
    )
    grupo_exposicion = models.ForeignKey(
        GrupoExposicionSimilar,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mediciones',
        verbose_name='Grupo de Exposición'
    )

    # Fechas y tiempos
    fecha_medicion = models.DateField(
        verbose_name='Fecha de Medición'
    )
    hora_inicio = models.TimeField(
        verbose_name='Hora Inicio'
    )
    hora_fin = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora Fin'
    )
    duracion_minutos = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        verbose_name='Duración (minutos)'
    )

    # Valores medidos
    valor_medido = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        verbose_name='Valor Medido'
    )
    unidad_medida = models.CharField(
        max_length=50,
        verbose_name='Unidad de Medida'
    )

    # Límite permisible aplicable
    limite_permisible_aplicable = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Límite Permisible Aplicable'
    )

    # Evaluación de cumplimiento
    cumplimiento = models.CharField(
        max_length=20,
        choices=CUMPLIMIENTO_CHOICES,
        default='PENDIENTE',
        verbose_name='Cumplimiento'
    )
    porcentaje_limite = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='% del Límite',
        help_text='Porcentaje respecto al límite permisible'
    )

    # Condiciones ambientales
    temperatura_ambiente = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Temperatura (°C)'
    )
    humedad_relativa = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Humedad Relativa (%)'
    )
    presion_atmosferica = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Presión Atmosférica (mmHg)'
    )

    # Equipo e información técnica
    equipo_utilizado = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Equipo Utilizado'
    )
    numero_serie = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de Serie'
    )
    fecha_calibracion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Calibración Equipo'
    )

    # Responsables
    realizado_por = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Realizado Por',
        help_text='Técnico o empresa que realizó la medición'
    )
    licencia_profesional = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Licencia Profesional',
        help_text='Licencia del profesional que realizó la medición'
    )

    # Estado y seguimiento
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PLANIFICADA',
        verbose_name='Estado'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    recomendaciones = models.TextField(
        blank=True,
        verbose_name='Recomendaciones'
    )

    # Documentación
    informe_adjunto = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Informe Adjunto',
        help_text='Ruta al archivo del informe'
    )

    # Próxima medición
    fecha_proxima_medicion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próxima Medición'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')
    created_by = models.CharField(max_length=100, blank=True, verbose_name='Creado Por')
    updated_by = models.CharField(max_length=100, blank=True, verbose_name='Actualizado Por')

    class Meta:
        db_table = 'hseq_medicion_ambiental'
        verbose_name = 'Medición Ambiental'
        verbose_name_plural = 'Mediciones Ambientales'
        ordering = ['-fecha_medicion', '-hora_inicio']
        indexes = [
            models.Index(fields=['empresa_id', 'fecha_medicion']),
            models.Index(fields=['empresa_id', 'agente_riesgo']),
            models.Index(fields=['empresa_id', 'cumplimiento']),
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['numero_medicion']),
        ]

    def __str__(self):
        return f"{self.numero_medicion} - {self.agente_riesgo.nombre} ({self.fecha_medicion})"

    def evaluar_cumplimiento(self):
        """
        Evalúa automáticamente el cumplimiento basado en el valor medido vs límite
        """
        if self.limite_permisible_aplicable and self.valor_medido is not None:
            # Calcular porcentaje
            self.porcentaje_limite = (
                (self.valor_medido / self.limite_permisible_aplicable) * 100
            )

            # Determinar cumplimiento
            if self.valor_medido <= self.limite_permisible_aplicable:
                self.cumplimiento = 'CUMPLE'
            else:
                self.cumplimiento = 'NO_CUMPLE'
        else:
            self.cumplimiento = 'PENDIENTE'
            self.porcentaje_limite = None

    def save(self, *args, **kwargs):
        """Evaluar cumplimiento antes de guardar"""
        self.evaluar_cumplimiento()
        super().save(*args, **kwargs)


class ControlExposicion(models.Model):
    """
    Controles implementados para reducir exposición: fuente, medio, individuo
    """
    JERARQUIA_CHOICES = [
        ('ELIMINACION', 'Eliminación'),
        ('SUSTITUCION', 'Sustitución'),
        ('CONTROLES_INGENIERIA', 'Controles de Ingeniería'),
        ('CONTROLES_ADMINISTRATIVOS', 'Controles Administrativos'),
        ('EPP', 'Equipos de Protección Personal'),
    ]

    TIPO_CONTROL_CHOICES = [
        ('FUENTE', 'Control en la Fuente'),
        ('MEDIO', 'Control en el Medio'),
        ('INDIVIDUO', 'Control en el Individuo'),
    ]

    ESTADO_CHOICES = [
        ('PLANIFICADO', 'Planificado'),
        ('EN_IMPLEMENTACION', 'En Implementación'),
        ('IMPLEMENTADO', 'Implementado'),
        ('EN_MANTENIMIENTO', 'En Mantenimiento'),
        ('SUSPENDIDO', 'Suspendido'),
        ('RETIRADO', 'Retirado'),
    ]

    empresa_id = models.IntegerField(
        verbose_name='ID Empresa',
        db_index=True
    )
    codigo = models.CharField(
        max_length=30,
        verbose_name='Código Control',
        help_text='Código único del control'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Control'
    )
    descripcion = models.TextField(
        verbose_name='Descripción Detallada'
    )

    # Clasificación del control
    jerarquia_control = models.CharField(
        max_length=30,
        choices=JERARQUIA_CHOICES,
        verbose_name='Jerarquía de Control'
    )
    tipo_control = models.CharField(
        max_length=20,
        choices=TIPO_CONTROL_CHOICES,
        verbose_name='Tipo de Control'
    )

    # Agente al que aplica
    agente_riesgo = models.ForeignKey(
        AgenteRiesgo,
        on_delete=models.PROTECT,
        related_name='controles',
        verbose_name='Agente de Riesgo'
    )

    # Ubicación y alcance
    area_aplicacion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Área de Aplicación'
    )
    grupos_exposicion = models.ManyToManyField(
        GrupoExposicionSimilar,
        related_name='controles',
        verbose_name='Grupos de Exposición',
        blank=True
    )
    puntos_medicion = models.ManyToManyField(
        PuntoMedicion,
        related_name='controles',
        verbose_name='Puntos de Medición',
        blank=True
    )

    # Implementación
    fecha_implementacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Implementación'
    )
    responsable_implementacion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Responsable Implementación'
    )

    # Efectividad
    efectividad_esperada = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Efectividad Esperada (%)',
        help_text='Porcentaje de reducción esperado'
    )
    efectividad_medida = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Efectividad Medida (%)',
        help_text='Porcentaje de reducción real medido'
    )
    fecha_medicion_efectividad = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Medición Efectividad'
    )

    # Mantenimiento
    requiere_mantenimiento = models.BooleanField(
        default=False,
        verbose_name='Requiere Mantenimiento'
    )
    frecuencia_mantenimiento = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Frecuencia Mantenimiento',
        help_text='Ej: Mensual, Trimestral, Semestral'
    )
    fecha_ultimo_mantenimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Último Mantenimiento'
    )
    fecha_proximo_mantenimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próximo Mantenimiento'
    )

    # Costos
    costo_implementacion = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Costo Implementación'
    )
    costo_mantenimiento_anual = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Costo Mantenimiento Anual'
    )

    # Estado
    estado = models.CharField(
        max_length=30,
        choices=ESTADO_CHOICES,
        default='PLANIFICADO',
        verbose_name='Estado'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')
    created_by = models.CharField(max_length=100, blank=True, verbose_name='Creado Por')
    updated_by = models.CharField(max_length=100, blank=True, verbose_name='Actualizado Por')

    class Meta:
        db_table = 'hseq_control_exposicion'
        verbose_name = 'Control de Exposición'
        verbose_name_plural = 'Controles de Exposición'
        ordering = ['jerarquia_control', 'nombre']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id', 'agente_riesgo']),
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'jerarquia_control']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.get_jerarquia_control_display()})"


class MonitoreoBiologico(models.Model):
    """
    Exámenes y monitoreo biológico por exposición a agentes de riesgo
    """
    TIPO_EXAMEN_CHOICES = [
        ('INGRESO', 'Examen de Ingreso'),
        ('PERIODICO', 'Examen Periódico'),
        ('RETIRO', 'Examen de Retiro'),
        ('POST_INCAPACIDAD', 'Post-Incapacidad'),
        ('REUBICACION', 'Reubicación'),
    ]

    RESULTADO_CHOICES = [
        ('APTO', 'Apto'),
        ('APTO_CON_RECOMENDACIONES', 'Apto con Recomendaciones'),
        ('NO_APTO', 'No Apto'),
        ('PENDIENTE', 'Pendiente'),
    ]

    empresa_id = models.IntegerField(
        verbose_name='ID Empresa',
        db_index=True
    )
    numero_examen = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Número de Examen',
        help_text='Número único del examen'
    )

    # Trabajador
    trabajador_nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Trabajador'
    )
    trabajador_identificacion = models.CharField(
        max_length=50,
        verbose_name='Identificación'
    )
    trabajador_cargo = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Cargo'
    )

    # Grupo de exposición
    grupo_exposicion = models.ForeignKey(
        GrupoExposicionSimilar,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='monitoreos_biologicos',
        verbose_name='Grupo de Exposición'
    )

    # Agentes a los que está expuesto
    agentes_riesgo = models.ManyToManyField(
        AgenteRiesgo,
        related_name='monitoreos_biologicos',
        verbose_name='Agentes de Riesgo'
    )

    # Tipo de examen
    tipo_examen = models.CharField(
        max_length=30,
        choices=TIPO_EXAMEN_CHOICES,
        verbose_name='Tipo de Examen'
    )
    fecha_examen = models.DateField(
        verbose_name='Fecha del Examen'
    )

    # Exámenes realizados
    examenes_realizados = models.TextField(
        verbose_name='Exámenes Realizados',
        help_text='Lista de exámenes: espirometría, audiometría, laboratorio, etc.'
    )

    # Indicadores biológicos (para químicos)
    indicador_biologico = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Indicador Biológico',
        help_text='Ej: Plomo en sangre, Ácido hipúrico, Colinesterasa'
    )
    valor_medido = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Valor Medido'
    )
    unidad_medida = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Unidad'
    )
    valor_referencia = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Valor de Referencia'
    )

    # Resultado
    resultado = models.CharField(
        max_length=30,
        choices=RESULTADO_CHOICES,
        default='PENDIENTE',
        verbose_name='Resultado'
    )
    hallazgos = models.TextField(
        blank=True,
        verbose_name='Hallazgos'
    )
    recomendaciones = models.TextField(
        blank=True,
        verbose_name='Recomendaciones Médicas'
    )
    restricciones = models.TextField(
        blank=True,
        verbose_name='Restricciones'
    )

    # Profesional
    medico_responsable = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Médico Responsable'
    )
    licencia_medica = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Licencia Médica'
    )
    ips_entidad = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='IPS/Entidad'
    )

    # Seguimiento
    requiere_seguimiento = models.BooleanField(
        default=False,
        verbose_name='Requiere Seguimiento'
    )
    fecha_proximo_examen = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próximo Examen'
    )

    # Documentación
    informe_adjunto = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Informe Adjunto',
        help_text='Ruta al archivo del informe médico'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')
    created_by = models.CharField(max_length=100, blank=True, verbose_name='Creado Por')
    updated_by = models.CharField(max_length=100, blank=True, verbose_name='Actualizado Por')

    class Meta:
        db_table = 'hseq_monitoreo_biologico'
        verbose_name = 'Monitoreo Biológico'
        verbose_name_plural = 'Monitoreo Biológico'
        ordering = ['-fecha_examen']
        indexes = [
            models.Index(fields=['empresa_id', 'fecha_examen']),
            models.Index(fields=['empresa_id', 'trabajador_identificacion']),
            models.Index(fields=['empresa_id', 'resultado']),
            models.Index(fields=['numero_examen']),
        ]

    def __str__(self):
        return f"{self.numero_examen} - {self.trabajador_nombre} ({self.fecha_examen})"
