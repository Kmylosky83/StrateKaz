"""
Modelos para riesgos_procesos - ISO 31000 Process Risk Management
Gestión de Riesgos de Procesos según ISO 31000
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class CategoriaRiesgo(models.Model):
    """
    Categorías de riesgos según ISO 31000
    Catálogo de clasificación de riesgos
    """
    TIPO_CHOICES = [
        ('ESTRATEGICO', 'Estratégico'),
        ('OPERACIONAL', 'Operacional'),
        ('FINANCIERO', 'Financiero'),
        ('CUMPLIMIENTO', 'Cumplimiento'),
        ('REPUTACIONAL', 'Reputacional'),
        ('TECNOLOGICO', 'Tecnológico'),
        ('AMBIENTAL', 'Ambiental'),
        ('SEGURIDAD', 'Seguridad y Salud'),
    ]

    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        verbose_name='Tipo de Categoría'
    )
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        verbose_name='Color Hexadecimal',
        help_text='Color para visualización en mapa de calor (ej: #FF5733)'
    )
    is_active = models.BooleanField(default=True, verbose_name='Activo')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'motor_riesgos_categoria_riesgo'
        verbose_name = 'Categoría de Riesgo'
        verbose_name_plural = 'Categorías de Riesgos'
        ordering = ['tipo', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class RiesgoProceso(models.Model):
    """
    Registro de riesgos de procesos según ISO 31000
    Incluye evaluación de riesgo inherente y residual
    """
    PROBABILIDAD_CHOICES = [
        (1, '1 - Muy Baja'),
        (2, '2 - Baja'),
        (3, '3 - Media'),
        (4, '4 - Alta'),
        (5, '5 - Muy Alta'),
    ]

    IMPACTO_CHOICES = [
        (1, '1 - Insignificante'),
        (2, '2 - Menor'),
        (3, '3 - Moderado'),
        (4, '4 - Mayor'),
        (5, '5 - Catastrófico'),
    ]

    NIVEL_RIESGO_CHOICES = [
        ('BAJO', 'Bajo (1-4)'),
        ('MODERADO', 'Moderado (5-9)'),
        ('ALTO', 'Alto (10-14)'),
        ('CRITICO', 'Crítico (15-25)'),
    ]

    ESTADO_CHOICES = [
        ('IDENTIFICADO', 'Identificado'),
        ('EN_EVALUACION', 'En Evaluación'),
        ('EN_TRATAMIENTO', 'En Tratamiento'),
        ('MONITOREADO', 'Monitoreado'),
        ('CERRADO', 'Cerrado'),
    ]

    # Identificación
    codigo = models.CharField(max_length=50, verbose_name='Código')
    nombre = models.CharField(max_length=300, verbose_name='Nombre del Riesgo')
    descripcion = models.TextField(verbose_name='Descripción')

    # Clasificación
    categoria = models.ForeignKey(
        CategoriaRiesgo,
        on_delete=models.PROTECT,
        related_name='riesgos',
        verbose_name='Categoría'
    )
    proceso = models.CharField(
        max_length=200,
        verbose_name='Proceso',
        help_text='Proceso al que pertenece el riesgo'
    )
    subproceso = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Subproceso'
    )

    # Análisis de causas y consecuencias
    causas = models.TextField(verbose_name='Causas del Riesgo')
    consecuencias = models.TextField(verbose_name='Consecuencias Potenciales')

    # Controles existentes
    controles_existentes = models.TextField(
        blank=True,
        verbose_name='Controles Existentes',
        help_text='Controles actuales para mitigar el riesgo'
    )

    # Evaluación del riesgo INHERENTE (sin controles)
    probabilidad_inherente = models.IntegerField(
        choices=PROBABILIDAD_CHOICES,
        verbose_name='Probabilidad Inherente',
        help_text='Probabilidad sin controles (1-5)'
    )
    impacto_inherente = models.IntegerField(
        choices=IMPACTO_CHOICES,
        verbose_name='Impacto Inherente',
        help_text='Impacto sin controles (1-5)'
    )
    nivel_inherente = models.IntegerField(
        editable=False,
        verbose_name='Nivel de Riesgo Inherente',
        help_text='Probabilidad × Impacto (1-25)'
    )
    interpretacion_inherente = models.CharField(
        max_length=20,
        choices=NIVEL_RIESGO_CHOICES,
        editable=False,
        verbose_name='Interpretación Riesgo Inherente'
    )

    # Evaluación del riesgo RESIDUAL (con controles)
    probabilidad_residual = models.IntegerField(
        choices=PROBABILIDAD_CHOICES,
        verbose_name='Probabilidad Residual',
        help_text='Probabilidad con controles (1-5)'
    )
    impacto_residual = models.IntegerField(
        choices=IMPACTO_CHOICES,
        verbose_name='Impacto Residual',
        help_text='Impacto con controles (1-5)'
    )
    nivel_residual = models.IntegerField(
        editable=False,
        verbose_name='Nivel de Riesgo Residual',
        help_text='Probabilidad × Impacto (1-25)'
    )
    interpretacion_residual = models.CharField(
        max_length=20,
        choices=NIVEL_RIESGO_CHOICES,
        editable=False,
        verbose_name='Interpretación Riesgo Residual'
    )

    # Propietario del riesgo
    propietario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='riesgos_propietario',
        verbose_name='Propietario del Riesgo',
        help_text='Responsable de gestionar el riesgo'
    )

    # Estado y fechas
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='IDENTIFICADO',
        verbose_name='Estado'
    )
    fecha_identificacion = models.DateField(verbose_name='Fecha de Identificación')
    fecha_evaluacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Evaluación'
    )
    proxima_revision = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próxima Revisión'
    )

    # Requisitos legales o normativos
    requisito_legal = models.TextField(
        blank=True,
        verbose_name='Requisito Legal/Normativo Asociado'
    )

    # Observaciones
    observaciones = models.TextField(blank=True, verbose_name='Observaciones')

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(db_index=True, verbose_name='Empresa ID')

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='riesgos_proceso_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'motor_riesgos_riesgo_proceso'
        verbose_name = 'Riesgo de Proceso'
        verbose_name_plural = 'Riesgos de Procesos'
        ordering = ['-nivel_residual', 'proceso', 'codigo']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'categoria']),
            models.Index(fields=['empresa_id', 'proceso']),
            models.Index(fields=['empresa_id', 'interpretacion_residual']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def save(self, *args, **kwargs):
        # Calcular nivel inherente
        self.nivel_inherente = self.probabilidad_inherente * self.impacto_inherente
        self.interpretacion_inherente = self._interpretar_nivel(self.nivel_inherente)

        # Calcular nivel residual
        self.nivel_residual = self.probabilidad_residual * self.impacto_residual
        self.interpretacion_residual = self._interpretar_nivel(self.nivel_residual)

        super().save(*args, **kwargs)

    def _interpretar_nivel(self, nivel):
        """
        Interpreta el nivel de riesgo según escala ISO 31000
        1-4: Bajo
        5-9: Moderado
        10-14: Alto
        15-25: Crítico
        """
        if nivel >= 15:
            return 'CRITICO'
        elif nivel >= 10:
            return 'ALTO'
        elif nivel >= 5:
            return 'MODERADO'
        else:
            return 'BAJO'

    def get_color_nivel(self, nivel):
        """Retorna color para visualización según nivel"""
        interpretacion = self._interpretar_nivel(nivel)
        colores = {
            'BAJO': '#28a745',      # Verde
            'MODERADO': '#ffc107',  # Amarillo
            'ALTO': '#fd7e14',      # Naranja
            'CRITICO': '#dc3545',   # Rojo
        }
        return colores.get(interpretacion, '#6c757d')

    def calcular_reduccion_riesgo(self):
        """Calcula el % de reducción del riesgo con controles"""
        if self.nivel_inherente == 0:
            return 0
        reduccion = ((self.nivel_inherente - self.nivel_residual) / self.nivel_inherente) * 100
        return round(reduccion, 2)


class TratamientoRiesgo(models.Model):
    """
    Planes de tratamiento para riesgos según ISO 31000
    Estrategias: Evitar, Reducir, Transferir, Aceptar
    """
    ESTRATEGIA_CHOICES = [
        ('EVITAR', 'Evitar - Eliminar la actividad que genera el riesgo'),
        ('REDUCIR', 'Reducir - Implementar controles para mitigar'),
        ('TRANSFERIR', 'Transferir - Compartir con terceros (seguros, outsourcing)'),
        ('ACEPTAR', 'Aceptar - Retener el riesgo informadamente'),
    ]

    PRIORIDAD_CHOICES = [
        ('ALTA', 'Alta'),
        ('MEDIA', 'Media'),
        ('BAJA', 'Baja'),
    ]

    ESTADO_CHOICES = [
        ('PROPUESTO', 'Propuesto'),
        ('APROBADO', 'Aprobado'),
        ('EN_IMPLEMENTACION', 'En Implementación'),
        ('IMPLEMENTADO', 'Implementado'),
        ('VERIFICADO', 'Verificado'),
        ('CANCELADO', 'Cancelado'),
    ]

    riesgo = models.ForeignKey(
        RiesgoProceso,
        on_delete=models.CASCADE,
        related_name='tratamientos',
        verbose_name='Riesgo'
    )

    # Estrategia de tratamiento
    estrategia = models.CharField(
        max_length=20,
        choices=ESTRATEGIA_CHOICES,
        verbose_name='Estrategia de Tratamiento'
    )
    descripcion = models.TextField(
        verbose_name='Descripción del Tratamiento',
        help_text='Detalle de las acciones a implementar'
    )

    # Planificación
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tratamientos_responsable',
        verbose_name='Responsable'
    )
    fecha_inicio_planificada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Inicio Planificada'
    )
    fecha_fin_planificada = models.DateField(verbose_name='Fecha Fin Planificada')

    # Ejecución
    fecha_inicio_real = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Inicio Real'
    )
    fecha_fin_real = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Fin Real'
    )

    # Costos
    costo_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Costo Estimado',
        help_text='Costo estimado de implementación'
    )
    costo_real = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Costo Real'
    )

    # Prioridad y estado
    prioridad = models.CharField(
        max_length=10,
        choices=PRIORIDAD_CHOICES,
        default='MEDIA',
        verbose_name='Prioridad'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PROPUESTO',
        verbose_name='Estado'
    )

    # Efectividad
    efectividad_esperada = models.TextField(
        blank=True,
        verbose_name='Efectividad Esperada',
        help_text='Resultados esperados del tratamiento'
    )
    efectividad_real = models.TextField(
        blank=True,
        verbose_name='Efectividad Real',
        help_text='Resultados obtenidos tras implementación'
    )

    # Evidencia
    evidencia = models.TextField(
        blank=True,
        verbose_name='Evidencia',
        help_text='Documentos, registros, etc. que soportan la implementación'
    )

    # Observaciones
    observaciones = models.TextField(blank=True, verbose_name='Observaciones')

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(db_index=True, verbose_name='Empresa ID')

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tratamientos_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'motor_riesgos_tratamiento_riesgo'
        verbose_name = 'Tratamiento de Riesgo'
        verbose_name_plural = 'Tratamientos de Riesgos'
        ordering = ['prioridad', 'fecha_fin_planificada']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'estrategia']),
            models.Index(fields=['empresa_id', 'prioridad']),
        ]

    def __str__(self):
        return f"{self.riesgo.codigo} - {self.get_estrategia_display()}"

    def esta_vencido(self):
        """Verifica si el tratamiento está vencido"""
        if self.estado in ['IMPLEMENTADO', 'VERIFICADO', 'CANCELADO']:
            return False
        if self.fecha_fin_planificada and self.fecha_fin_planificada < timezone.now().date():
            return True
        return False

    def dias_restantes(self):
        """Calcula días restantes para completar el tratamiento"""
        if self.fecha_fin_planificada:
            delta = self.fecha_fin_planificada - timezone.now().date()
            return delta.days
        return None

    def porcentaje_avance(self):
        """Calcula porcentaje de avance según estado"""
        avances = {
            'PROPUESTO': 0,
            'APROBADO': 20,
            'EN_IMPLEMENTACION': 50,
            'IMPLEMENTADO': 80,
            'VERIFICADO': 100,
            'CANCELADO': 0,
        }
        return avances.get(self.estado, 0)


class MonitoreoRiesgo(models.Model):
    """
    Registro de monitoreo y seguimiento de riesgos
    Permite tracking de tendencias y cambios en el tiempo
    """
    TENDENCIA_CHOICES = [
        ('AUMENTANDO', 'Aumentando'),
        ('ESTABLE', 'Estable'),
        ('DISMINUYENDO', 'Disminuyendo'),
    ]

    riesgo = models.ForeignKey(
        RiesgoProceso,
        on_delete=models.CASCADE,
        related_name='monitoreos',
        verbose_name='Riesgo'
    )

    # Fecha del monitoreo
    fecha_monitoreo = models.DateField(verbose_name='Fecha de Monitoreo')
    periodo = models.CharField(
        max_length=50,
        verbose_name='Período',
        help_text='Ej: Q1-2025, Enero 2025, Semestre 1-2025'
    )

    # Reevaluación del riesgo
    probabilidad_actual = models.IntegerField(
        choices=RiesgoProceso.PROBABILIDAD_CHOICES,
        verbose_name='Probabilidad Actual'
    )
    impacto_actual = models.IntegerField(
        choices=RiesgoProceso.IMPACTO_CHOICES,
        verbose_name='Impacto Actual'
    )
    nivel_actual = models.IntegerField(
        editable=False,
        verbose_name='Nivel de Riesgo Actual'
    )
    interpretacion_actual = models.CharField(
        max_length=20,
        choices=RiesgoProceso.NIVEL_RIESGO_CHOICES,
        editable=False,
        verbose_name='Interpretación Actual'
    )

    # Análisis de tendencia
    tendencia = models.CharField(
        max_length=20,
        choices=TENDENCIA_CHOICES,
        verbose_name='Tendencia'
    )

    # Indicadores de riesgo (KRIs - Key Risk Indicators)
    kri_data = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Indicadores de Riesgo (KRI)',
        help_text='JSON con indicadores específicos del riesgo'
    )

    # Eventos materializados
    eventos_materializados = models.TextField(
        blank=True,
        verbose_name='Eventos Materializados',
        help_text='Descripción de eventos ocurridos relacionados con este riesgo'
    )
    numero_eventos = models.PositiveIntegerField(
        default=0,
        verbose_name='Número de Eventos'
    )

    # Efectividad de controles
    controles_efectivos = models.BooleanField(
        default=True,
        verbose_name='Controles Efectivos'
    )
    controles_observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones sobre Controles'
    )

    # Acciones requeridas
    acciones_requeridas = models.TextField(
        blank=True,
        verbose_name='Acciones Requeridas',
        help_text='Nuevas acciones identificadas durante el monitoreo'
    )

    # Responsable del monitoreo
    monitoreado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='monitoreos_realizados',
        verbose_name='Monitoreado por'
    )

    # Aprobación
    aprobado = models.BooleanField(default=False, verbose_name='Aprobado')
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='monitoreos_aprobados',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    # Observaciones generales
    observaciones = models.TextField(blank=True, verbose_name='Observaciones')

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(db_index=True, verbose_name='Empresa ID')

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'motor_riesgos_monitoreo_riesgo'
        verbose_name = 'Monitoreo de Riesgo'
        verbose_name_plural = 'Monitoreos de Riesgos'
        ordering = ['-fecha_monitoreo']
        indexes = [
            models.Index(fields=['empresa_id', 'periodo']),
            models.Index(fields=['empresa_id', 'riesgo', 'fecha_monitoreo']),
        ]

    def __str__(self):
        return f"{self.riesgo.codigo} - Monitoreo {self.fecha_monitoreo}"

    def save(self, *args, **kwargs):
        # Calcular nivel actual
        self.nivel_actual = self.probabilidad_actual * self.impacto_actual

        # Interpretar nivel
        if self.nivel_actual >= 15:
            self.interpretacion_actual = 'CRITICO'
        elif self.nivel_actual >= 10:
            self.interpretacion_actual = 'ALTO'
        elif self.nivel_actual >= 5:
            self.interpretacion_actual = 'MODERADO'
        else:
            self.interpretacion_actual = 'BAJO'

        super().save(*args, **kwargs)

    def comparar_con_anterior(self):
        """Compara con el monitoreo anterior para detectar cambios"""
        anterior = MonitoreoRiesgo.objects.filter(
            riesgo=self.riesgo,
            fecha_monitoreo__lt=self.fecha_monitoreo
        ).order_by('-fecha_monitoreo').first()

        if not anterior:
            return None

        return {
            'nivel_anterior': anterior.nivel_actual,
            'nivel_actual': self.nivel_actual,
            'cambio': self.nivel_actual - anterior.nivel_actual,
            'porcentaje_cambio': round(
                ((self.nivel_actual - anterior.nivel_actual) / anterior.nivel_actual) * 100, 2
            ) if anterior.nivel_actual > 0 else 0
        }


class MapaCalor(models.Model):
    """
    Mapa de calor de riesgos (Heat Map)
    Snapshot de la matriz de riesgos en un punto del tiempo
    """
    TIPO_CHOICES = [
        ('INHERENTE', 'Riesgo Inherente'),
        ('RESIDUAL', 'Riesgo Residual'),
    ]

    nombre = models.CharField(max_length=200, verbose_name='Nombre del Mapa')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    tipo_mapa = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default='RESIDUAL',
        verbose_name='Tipo de Mapa'
    )

    # Período y alcance
    periodo = models.CharField(
        max_length=50,
        verbose_name='Período',
        help_text='Ej: Q1-2025, Año 2025'
    )
    fecha_snapshot = models.DateField(verbose_name='Fecha del Snapshot')

    # Filtros aplicados
    procesos_incluidos = models.TextField(
        blank=True,
        verbose_name='Procesos Incluidos',
        help_text='Lista de procesos incluidos en el mapa'
    )
    categorias_incluidas = models.TextField(
        blank=True,
        verbose_name='Categorías Incluidas'
    )

    # Datos del mapa (JSON)
    datos_matriz = models.JSONField(
        verbose_name='Datos de la Matriz',
        help_text='Matriz 5x5 con los riesgos posicionados'
    )

    # Estadísticas
    total_riesgos = models.PositiveIntegerField(
        default=0,
        verbose_name='Total de Riesgos'
    )
    riesgos_criticos = models.PositiveIntegerField(
        default=0,
        verbose_name='Riesgos Críticos'
    )
    riesgos_altos = models.PositiveIntegerField(
        default=0,
        verbose_name='Riesgos Altos'
    )
    riesgos_moderados = models.PositiveIntegerField(
        default=0,
        verbose_name='Riesgos Moderados'
    )
    riesgos_bajos = models.PositiveIntegerField(
        default=0,
        verbose_name='Riesgos Bajos'
    )

    # Análisis y conclusiones
    analisis = models.TextField(
        blank=True,
        verbose_name='Análisis',
        help_text='Análisis de los resultados del mapa de calor'
    )
    recomendaciones = models.TextField(
        blank=True,
        verbose_name='Recomendaciones'
    )

    # Elaboración y aprobación
    elaborado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='mapas_calor_elaborados',
        verbose_name='Elaborado por'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mapas_calor_aprobados',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(db_index=True, verbose_name='Empresa ID')

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'motor_riesgos_mapa_calor'
        verbose_name = 'Mapa de Calor'
        verbose_name_plural = 'Mapas de Calor'
        ordering = ['-fecha_snapshot']
        indexes = [
            models.Index(fields=['empresa_id', 'periodo']),
            models.Index(fields=['empresa_id', 'tipo_mapa']),
        ]

    def __str__(self):
        return f"{self.nombre} - {self.periodo}"

    def generar_datos_matriz(self, queryset_riesgos):
        """
        Genera los datos JSON de la matriz 5x5 a partir de un queryset de riesgos
        """
        matriz = {
            'celdas': {},  # Formato: 'probabilidad_impacto': [lista de riesgos]
            'metadata': {
                'generado': timezone.now().isoformat(),
                'total_riesgos': 0,
            }
        }

        contadores = {
            'CRITICO': 0,
            'ALTO': 0,
            'MODERADO': 0,
            'BAJO': 0,
        }

        for riesgo in queryset_riesgos:
            if self.tipo_mapa == 'INHERENTE':
                prob = riesgo.probabilidad_inherente
                imp = riesgo.impacto_inherente
                interpretacion = riesgo.interpretacion_inherente
            else:
                prob = riesgo.probabilidad_residual
                imp = riesgo.impacto_residual
                interpretacion = riesgo.interpretacion_residual

            key = f"{prob}_{imp}"

            if key not in matriz['celdas']:
                matriz['celdas'][key] = []

            matriz['celdas'][key].append({
                'codigo': riesgo.codigo,
                'nombre': riesgo.nombre,
                'categoria': riesgo.categoria.nombre,
                'proceso': riesgo.proceso,
                'nivel': prob * imp,
                'interpretacion': interpretacion,
            })

            contadores[interpretacion] += 1

        matriz['metadata']['total_riesgos'] = queryset_riesgos.count()
        matriz['metadata']['distribucion'] = contadores

        self.datos_matriz = matriz
        self.total_riesgos = queryset_riesgos.count()
        self.riesgos_criticos = contadores['CRITICO']
        self.riesgos_altos = contadores['ALTO']
        self.riesgos_moderados = contadores['MODERADO']
        self.riesgos_bajos = contadores['BAJO']

    def get_distribucion_porcentaje(self):
        """Retorna la distribución de riesgos en porcentajes"""
        if self.total_riesgos == 0:
            return {
                'criticos': 0,
                'altos': 0,
                'moderados': 0,
                'bajos': 0,
            }

        return {
            'criticos': round((self.riesgos_criticos / self.total_riesgos) * 100, 2),
            'altos': round((self.riesgos_altos / self.total_riesgos) * 100, 2),
            'moderados': round((self.riesgos_moderados / self.total_riesgos) * 100, 2),
            'bajos': round((self.riesgos_bajos / self.total_riesgos) * 100, 2),
        }
