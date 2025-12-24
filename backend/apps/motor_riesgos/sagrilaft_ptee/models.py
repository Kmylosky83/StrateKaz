"""
Modelos para SAGRILAFT/PTEE - Sistema de Administración del Riesgo de Lavado de Activos y
Financiación del Terrorismo / Programa de Transparencia y Ética Empresarial
Basado en regulación colombiana (Circular Externa 100-000016 de 2020 - Superintendencia de Sociedades)
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class FactorRiesgoLAFT(models.Model):
    """
    Catálogo de Factores de Riesgo LAFT
    Factores según circular: Cliente, Jurisdicción, Producto/Servicio, Canal de Distribución
    """
    TIPO_FACTOR_CHOICES = [
        ('CLIENTE', 'Cliente'),
        ('JURISDICCION', 'Jurisdicción'),
        ('PRODUCTO_SERVICIO', 'Producto/Servicio'),
        ('CANAL_DISTRIBUCION', 'Canal de Distribución'),
    ]

    NIVEL_RIESGO_CHOICES = [
        ('BAJO', 'Bajo'),
        ('MEDIO', 'Medio'),
        ('ALTO', 'Alto'),
        ('EXTREMO', 'Extremo'),
    ]

    codigo = models.CharField(
        max_length=30,
        unique=True,
        verbose_name='Código',
        help_text='Código único del factor de riesgo (ej: FR-CLI-001)'
    )
    tipo_factor = models.CharField(
        max_length=30,
        choices=TIPO_FACTOR_CHOICES,
        verbose_name='Tipo de Factor',
        db_index=True
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Factor'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada del factor de riesgo'
    )
    nivel_riesgo_inherente = models.CharField(
        max_length=10,
        choices=NIVEL_RIESGO_CHOICES,
        default='MEDIO',
        verbose_name='Nivel de Riesgo Inherente'
    )
    puntaje_base = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Puntaje Base',
        help_text='Puntaje de 0 a 100'
    )
    criterios_evaluacion = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Criterios de Evaluación',
        help_text='JSON con criterios específicos de evaluación'
    )
    normativa_aplicable = models.TextField(
        blank=True,
        verbose_name='Normativa Aplicable',
        help_text='Referencias normativas relacionadas'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sagrilaft_factor_riesgo_laft'
        verbose_name = 'Factor de Riesgo LAFT'
        verbose_name_plural = 'Factores de Riesgo LAFT'
        ordering = ['tipo_factor', 'codigo']
        indexes = [
            models.Index(fields=['tipo_factor', 'is_active']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class SegmentoCliente(models.Model):
    """
    Segmentación de Clientes para Clasificación de Riesgo LAFT
    Permite clasificar clientes según perfil de riesgo
    """
    TIPO_CLIENTE_CHOICES = [
        ('PERSONA_NATURAL', 'Persona Natural'),
        ('PERSONA_JURIDICA', 'Persona Jurídica'),
        ('PEP', 'Persona Expuesta Políticamente (PEP)'),
    ]

    NIVEL_RIESGO_CHOICES = [
        ('BAJO', 'Bajo'),
        ('MEDIO', 'Medio'),
        ('ALTO', 'Alto'),
        ('EXTREMO', 'Extremo'),
    ]

    codigo = models.CharField(
        max_length=30,
        verbose_name='Código del Segmento',
        help_text='Código único (ej: SEG-PN-BAJO)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Segmento'
    )
    tipo_cliente = models.CharField(
        max_length=20,
        choices=TIPO_CLIENTE_CHOICES,
        verbose_name='Tipo de Cliente',
        db_index=True
    )
    nivel_riesgo = models.CharField(
        max_length=10,
        choices=NIVEL_RIESGO_CHOICES,
        verbose_name='Nivel de Riesgo'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Características del segmento'
    )
    criterios_clasificacion = models.JSONField(
        default=dict,
        verbose_name='Criterios de Clasificación',
        help_text='JSON con criterios para clasificar clientes en este segmento'
    )
    requiere_debida_diligencia_reforzada = models.BooleanField(
        default=False,
        verbose_name='Requiere Debida Diligencia Reforzada'
    )
    requiere_debida_diligencia_simplificada = models.BooleanField(
        default=False,
        verbose_name='Requiere Debida Diligencia Simplificada'
    )
    frecuencia_monitoreo_dias = models.IntegerField(
        default=180,
        validators=[MinValueValidator(1)],
        verbose_name='Frecuencia de Monitoreo (días)',
        help_text='Días entre revisiones de debida diligencia'
    )
    monto_maximo_transaccion = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Monto Máximo de Transacción',
        help_text='Monto máximo sin alertas adicionales'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='segmentos_cliente_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'sagrilaft_segmento_cliente'
        verbose_name = 'Segmento de Cliente'
        verbose_name_plural = 'Segmentos de Clientes'
        ordering = ['tipo_cliente', 'nivel_riesgo', 'codigo']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo_cliente']),
            models.Index(fields=['empresa_id', 'nivel_riesgo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.get_nivel_riesgo_display()})"


class MatrizRiesgoLAFT(models.Model):
    """
    Matriz de Riesgo LAFT - Evaluación consolidada por cliente/tercero
    Calcula riesgo inherente y residual considerando todos los factores
    """
    TIPO_EVALUADO_CHOICES = [
        ('CLIENTE', 'Cliente'),
        ('PROVEEDOR', 'Proveedor'),
        ('EMPLEADO', 'Empleado'),
        ('CONTRATISTA', 'Contratista'),
        ('SOCIO', 'Socio/Accionista'),
    ]

    NIVEL_RIESGO_CHOICES = [
        ('BAJO', 'Bajo'),
        ('MEDIO', 'Medio'),
        ('ALTO', 'Alto'),
        ('EXTREMO', 'Extremo'),
    ]

    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('APROBADO', 'Aprobado'),
        ('VIGENTE', 'Vigente'),
        ('EN_REVISION', 'En Revisión'),
        ('OBSOLETO', 'Obsoleto'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        verbose_name='Código de Evaluación',
        help_text='Código único (ej: MLAFT-2024-001)'
    )
    tipo_evaluado = models.CharField(
        max_length=20,
        choices=TIPO_EVALUADO_CHOICES,
        verbose_name='Tipo de Evaluado',
        db_index=True
    )
    nombre_evaluado = models.CharField(
        max_length=255,
        verbose_name='Nombre del Evaluado'
    )
    identificacion_evaluado = models.CharField(
        max_length=50,
        verbose_name='Identificación',
        help_text='NIT, CC, CE, Pasaporte'
    )
    segmento = models.ForeignKey(
        SegmentoCliente,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='matrices_riesgo',
        verbose_name='Segmento'
    )

    # Evaluación de Factores
    puntaje_factor_cliente = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Puntaje Factor Cliente'
    )
    puntaje_factor_jurisdiccion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Puntaje Factor Jurisdicción'
    )
    puntaje_factor_producto = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Puntaje Factor Producto/Servicio'
    )
    puntaje_factor_canal = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Puntaje Factor Canal'
    )

    # Puntajes Consolidados
    puntaje_riesgo_inherente = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        editable=False,
        verbose_name='Puntaje Riesgo Inherente',
        help_text='Calculado automáticamente'
    )
    nivel_riesgo_inherente = models.CharField(
        max_length=10,
        choices=NIVEL_RIESGO_CHOICES,
        editable=False,
        verbose_name='Nivel Riesgo Inherente'
    )

    # Controles aplicados
    controles_aplicados = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Controles Aplicados',
        help_text='Lista de controles implementados para mitigar el riesgo'
    )
    efectividad_controles = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Efectividad de Controles (%)'
    )

    # Riesgo Residual
    puntaje_riesgo_residual = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        editable=False,
        verbose_name='Puntaje Riesgo Residual',
        help_text='Calculado: inherente * (1 - efectividad_controles/100)'
    )
    nivel_riesgo_residual = models.CharField(
        max_length=10,
        choices=NIVEL_RIESGO_CHOICES,
        editable=False,
        verbose_name='Nivel Riesgo Residual'
    )

    # Gestión
    fecha_evaluacion = models.DateField(
        verbose_name='Fecha de Evaluación'
    )
    proxima_revision = models.DateField(
        verbose_name='Próxima Revisión',
        help_text='Calculada según frecuencia del segmento'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR',
        verbose_name='Estado'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='matrices_laft_aprobadas',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='matrices_laft_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'sagrilaft_matriz_riesgo_laft'
        verbose_name = 'Matriz de Riesgo LAFT'
        verbose_name_plural = 'Matrices de Riesgo LAFT'
        ordering = ['-fecha_evaluacion', 'codigo']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo_evaluado']),
            models.Index(fields=['empresa_id', 'nivel_riesgo_residual']),
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['identificacion_evaluado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre_evaluado} ({self.get_nivel_riesgo_residual_display()})"

    def save(self, *args, **kwargs):
        """
        Calcula automáticamente los puntajes y niveles de riesgo
        """
        # Calcular riesgo inherente (promedio ponderado de factores)
        # Ponderación: Cliente 40%, Jurisdicción 30%, Producto 20%, Canal 10%
        self.puntaje_riesgo_inherente = (
            (self.puntaje_factor_cliente * Decimal('0.40')) +
            (self.puntaje_factor_jurisdiccion * Decimal('0.30')) +
            (self.puntaje_factor_producto * Decimal('0.20')) +
            (self.puntaje_factor_canal * Decimal('0.10'))
        )

        # Determinar nivel de riesgo inherente
        self.nivel_riesgo_inherente = self._calcular_nivel_riesgo(
            self.puntaje_riesgo_inherente
        )

        # Calcular riesgo residual
        self.puntaje_riesgo_residual = self.puntaje_riesgo_inherente * (
            Decimal('1.00') - (self.efectividad_controles / Decimal('100.00'))
        )

        # Determinar nivel de riesgo residual
        self.nivel_riesgo_residual = self._calcular_nivel_riesgo(
            self.puntaje_riesgo_residual
        )

        super().save(*args, **kwargs)

    def _calcular_nivel_riesgo(self, puntaje):
        """
        Determina el nivel de riesgo según el puntaje
        Rangos estándar SAGRILAFT:
        - Bajo: 0-25
        - Medio: 26-50
        - Alto: 51-75
        - Extremo: 76-100
        """
        if puntaje <= 25:
            return 'BAJO'
        elif puntaje <= 50:
            return 'MEDIO'
        elif puntaje <= 75:
            return 'ALTO'
        else:
            return 'EXTREMO'


class SeñalAlerta(models.Model):
    """
    Catálogo y registro de Señales de Alerta LAFT
    Incluye tanto el catálogo de señales como los eventos detectados
    """
    CATEGORIA_CHOICES = [
        ('TRANSACCIONAL', 'Transaccional'),
        ('COMPORTAMENTAL', 'Comportamental'),
        ('GEOGRAFICA', 'Geográfica'),
        ('DOCUMENTAL', 'Documental'),
        ('REPUTACIONAL', 'Reputacional'),
        ('LISTAS_CONTROL', 'Listas de Control'),
    ]

    SEVERIDAD_CHOICES = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('CRITICA', 'Crítica'),
    ]

    ESTADO_CHOICES = [
        ('DETECTADA', 'Detectada'),
        ('EN_ANALISIS', 'En Análisis'),
        ('CONFIRMADA', 'Confirmada'),
        ('FALSO_POSITIVO', 'Falso Positivo'),
        ('ESCALADA', 'Escalada'),
        ('CERRADA', 'Cerrada'),
    ]

    # Si es un catálogo o un evento
    es_catalogo = models.BooleanField(
        default=False,
        verbose_name='Es Catálogo',
        help_text='True para definiciones de señales, False para eventos detectados'
    )

    # Identificación
    codigo = models.CharField(
        max_length=50,
        verbose_name='Código',
        help_text='Código de la señal (ej: SA-TRANS-001) o del evento (ej: EV-2024-0001)'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre de la Señal'
    )
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_CHOICES,
        verbose_name='Categoría',
        db_index=True
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción de la señal o del evento detectado'
    )

    # Severidad y evaluación
    severidad = models.CharField(
        max_length=10,
        choices=SEVERIDAD_CHOICES,
        verbose_name='Severidad'
    )
    criterios_deteccion = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Criterios de Detección',
        help_text='Criterios técnicos para detectar esta señal'
    )

    # Si es un evento detectado
    matriz_riesgo = models.ForeignKey(
        MatrizRiesgoLAFT,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='señales_alerta',
        verbose_name='Matriz de Riesgo Asociada'
    )
    fecha_deteccion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Detección'
    )
    origen_deteccion = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Origen de Detección',
        help_text='Sistema, Usuario, Auditoría, etc.'
    )
    evidencia = models.TextField(
        blank=True,
        verbose_name='Evidencia',
        help_text='Descripción de la evidencia que generó la alerta'
    )
    monto_involucrado = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Monto Involucrado'
    )

    # Análisis
    analista_asignado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='señales_analizadas',
        verbose_name='Analista Asignado'
    )
    fecha_analisis = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Análisis'
    )
    resultado_analisis = models.TextField(
        blank=True,
        verbose_name='Resultado del Análisis'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='DETECTADA',
        verbose_name='Estado'
    )
    requiere_ros = models.BooleanField(
        default=False,
        verbose_name='Requiere ROS',
        help_text='Indica si requiere Reporte de Operación Sospechosa'
    )

    # Normativa
    normativa_aplicable = models.TextField(
        blank=True,
        verbose_name='Normativa Aplicable'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    # Multi-tenancy (solo para eventos, no para catálogo)
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        null=True,
        blank=True,
        verbose_name='Empresa ID'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='señales_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'sagrilaft_señal_alerta'
        verbose_name = 'Señal de Alerta'
        verbose_name_plural = 'Señales de Alerta'
        ordering = ['-fecha_deteccion', 'severidad', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'severidad']),
            models.Index(fields=['categoria', 'es_catalogo']),
            models.Index(fields=['fecha_deteccion']),
        ]

    def __str__(self):
        tipo = "Catálogo" if self.es_catalogo else "Evento"
        return f"{tipo}: {self.codigo} - {self.nombre}"


class ReporteOperacionSospechosa(models.Model):
    """
    Reporte de Operación Sospechosa (ROS)
    Reportes a la UIAF (Unidad de Información y Análisis Financiero)
    """
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('EN_REVISION', 'En Revisión'),
        ('APROBADO', 'Aprobado'),
        ('ENVIADO', 'Enviado a UIAF'),
        ('CONFIRMADO', 'Confirmado por UIAF'),
        ('ARCHIVADO', 'Archivado'),
    ]

    TIPO_OPERACION_CHOICES = [
        ('LAVADO_ACTIVOS', 'Lavado de Activos'),
        ('FINANCIACION_TERRORISMO', 'Financiación del Terrorismo'),
        ('ADMINISTRACION_RECURSOS_ILICITOS', 'Administración de Recursos Ilícitos'),
    ]

    # Identificación
    numero_ros = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Número ROS',
        help_text='Número único del reporte (ej: ROS-2024-0001)'
    )
    fecha_deteccion = models.DateField(
        verbose_name='Fecha de Detección'
    )
    tipo_operacion = models.CharField(
        max_length=50,
        choices=TIPO_OPERACION_CHOICES,
        verbose_name='Tipo de Operación Sospechosa'
    )

    # Sujeto reportado
    matriz_riesgo = models.ForeignKey(
        MatrizRiesgoLAFT,
        on_delete=models.PROTECT,
        related_name='reportes_ros',
        verbose_name='Matriz de Riesgo'
    )
    nombre_reportado = models.CharField(
        max_length=255,
        verbose_name='Nombre del Reportado'
    )
    identificacion_reportado = models.CharField(
        max_length=50,
        verbose_name='Identificación del Reportado'
    )
    tipo_identificacion = models.CharField(
        max_length=20,
        default='NIT',
        verbose_name='Tipo de Identificación'
    )

    # Señales de alerta relacionadas
    señales_alerta = models.ManyToManyField(
        SeñalAlerta,
        related_name='reportes_ros',
        verbose_name='Señales de Alerta Relacionadas'
    )

    # Descripción de la operación
    descripcion_operacion = models.TextField(
        verbose_name='Descripción de la Operación',
        help_text='Descripción detallada de la operación sospechosa'
    )
    monto_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name='Monto Total',
        help_text='Monto total de las operaciones sospechosas'
    )
    moneda = models.CharField(
        max_length=3,
        default='COP',
        verbose_name='Moneda'
    )
    periodo_operaciones = models.CharField(
        max_length=100,
        verbose_name='Período de las Operaciones',
        help_text='Rango de fechas de las operaciones sospechosas'
    )

    # Análisis
    analisis_detallado = models.TextField(
        verbose_name='Análisis Detallado',
        help_text='Análisis técnico de por qué se considera sospechosa'
    )
    fundamentos_sospecha = models.TextField(
        verbose_name='Fundamentos de la Sospecha',
        help_text='Fundamentos legales y técnicos'
    )
    documentos_soporte = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Documentos de Soporte',
        help_text='Lista de documentos adjuntos (URLs o referencias)'
    )

    # Responsables
    elaborado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ros_elaborados',
        verbose_name='Elaborado por'
    )
    fecha_elaboracion = models.DateField(
        verbose_name='Fecha de Elaboración'
    )
    revisado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ros_revisados',
        verbose_name='Revisado por'
    )
    fecha_revision = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Revisión'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ros_aprobados',
        verbose_name='Aprobado por (Oficial de Cumplimiento)'
    )
    fecha_aprobacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    # Envío a UIAF
    fecha_envio_uiaf = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Envío a UIAF'
    )
    numero_radicado_uiaf = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de Radicado UIAF'
    )
    respuesta_uiaf = models.TextField(
        blank=True,
        verbose_name='Respuesta UIAF'
    )

    # Estado y seguimiento
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR',
        verbose_name='Estado'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sagrilaft_reporte_operacion_sospechosa'
        verbose_name = 'Reporte de Operación Sospechosa (ROS)'
        verbose_name_plural = 'Reportes de Operaciones Sospechosas (ROS)'
        ordering = ['-fecha_deteccion', 'numero_ros']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['identificacion_reportado']),
            models.Index(fields=['fecha_envio_uiaf']),
        ]

    def __str__(self):
        return f"{self.numero_ros} - {self.nombre_reportado} ({self.get_estado_display()})"


class DebidaDiligencia(models.Model):
    """
    Registro de Debida Diligencia para clientes/terceros
    Documentación y verificación de identidad según nivel de riesgo
    """
    TIPO_DILIGENCIA_CHOICES = [
        ('NORMAL', 'Debida Diligencia Normal'),
        ('SIMPLIFICADA', 'Debida Diligencia Simplificada'),
        ('REFORZADA', 'Debida Diligencia Reforzada'),
    ]

    ESTADO_CHOICES = [
        ('INICIADA', 'Iniciada'),
        ('EN_PROCESO', 'En Proceso'),
        ('DOCUMENTOS_INCOMPLETOS', 'Documentos Incompletos'),
        ('COMPLETADA', 'Completada'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
        ('REQUIERE_ACTUALIZACION', 'Requiere Actualización'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        verbose_name='Código',
        help_text='Código único (ej: DD-2024-0001)'
    )
    matriz_riesgo = models.ForeignKey(
        MatrizRiesgoLAFT,
        on_delete=models.CASCADE,
        related_name='diligencias',
        verbose_name='Matriz de Riesgo'
    )
    tipo_diligencia = models.CharField(
        max_length=20,
        choices=TIPO_DILIGENCIA_CHOICES,
        verbose_name='Tipo de Diligencia'
    )

    # Fechas
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio'
    )
    fecha_vencimiento = models.DateField(
        verbose_name='Fecha de Vencimiento',
        help_text='Fecha límite para completar la diligencia'
    )
    fecha_completada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Completada'
    )
    proxima_actualizacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próxima Actualización',
        help_text='Calculada según frecuencia del segmento'
    )

    # Documentación requerida
    documentos_requeridos = models.JSONField(
        default=list,
        verbose_name='Documentos Requeridos',
        help_text='Lista de documentos que se deben verificar'
    )
    documentos_recibidos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Documentos Recibidos',
        help_text='Lista de documentos verificados con fechas'
    )
    porcentaje_completitud = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        editable=False,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Porcentaje de Completitud (%)'
    )

    # Verificación de identidad
    verificacion_identidad_realizada = models.BooleanField(
        default=False,
        verbose_name='Verificación de Identidad Realizada'
    )
    metodo_verificacion = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Método de Verificación',
        help_text='Presencial, Video llamada, Biometría, etc.'
    )
    fecha_verificacion_identidad = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Verificación de Identidad'
    )

    # Consulta en listas restrictivas
    consulta_listas_onu = models.BooleanField(
        default=False,
        verbose_name='Consulta Listas ONU'
    )
    consulta_listas_ofac = models.BooleanField(
        default=False,
        verbose_name='Consulta Listas OFAC'
    )
    consulta_listas_clinton = models.BooleanField(
        default=False,
        verbose_name='Consulta Lista Clinton'
    )
    consulta_listas_nacionales = models.BooleanField(
        default=False,
        verbose_name='Consulta Listas Nacionales'
    )
    fecha_consulta_listas = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Consulta en Listas'
    )
    resultado_listas = models.TextField(
        blank=True,
        verbose_name='Resultado de Consulta en Listas',
        help_text='Positivo/Negativo y detalles'
    )

    # PEP (Persona Expuesta Políticamente)
    es_pep = models.BooleanField(
        default=False,
        verbose_name='Es PEP'
    )
    detalles_pep = models.TextField(
        blank=True,
        verbose_name='Detalles PEP',
        help_text='Cargo público, período, etc.'
    )

    # Origen de fondos
    origen_fondos_declarado = models.TextField(
        blank=True,
        verbose_name='Origen de Fondos Declarado'
    )
    origen_fondos_verificado = models.BooleanField(
        default=False,
        verbose_name='Origen de Fondos Verificado'
    )

    # Referencias comerciales y bancarias
    referencias_comerciales = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Referencias Comerciales'
    )
    referencias_bancarias = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Referencias Bancarias'
    )

    # Visita/entrevista (para diligencia reforzada)
    requiere_visita = models.BooleanField(
        default=False,
        verbose_name='Requiere Visita'
    )
    fecha_visita = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Visita'
    )
    informe_visita = models.TextField(
        blank=True,
        verbose_name='Informe de Visita'
    )

    # Responsables
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='diligencias_responsable',
        verbose_name='Responsable'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='diligencias_aprobadas',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    # Estado
    estado = models.CharField(
        max_length=30,
        choices=ESTADO_CHOICES,
        default='INICIADA',
        verbose_name='Estado'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    motivo_rechazo = models.TextField(
        blank=True,
        verbose_name='Motivo de Rechazo'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='diligencias_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'sagrilaft_debida_diligencia'
        verbose_name = 'Debida Diligencia'
        verbose_name_plural = 'Debidas Diligencias'
        ordering = ['-fecha_inicio', 'codigo']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'tipo_diligencia']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['proxima_actualizacion']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.matriz_riesgo.nombre_evaluado} ({self.get_estado_display()})"

    def save(self, *args, **kwargs):
        """
        Calcula el porcentaje de completitud automáticamente
        """
        if self.documentos_requeridos:
            total_requeridos = len(self.documentos_requeridos)
            total_recibidos = len(self.documentos_recibidos) if self.documentos_recibidos else 0

            if total_requeridos > 0:
                self.porcentaje_completitud = Decimal(
                    (total_recibidos / total_requeridos) * 100
                ).quantize(Decimal('0.01'))

        super().save(*args, **kwargs)
