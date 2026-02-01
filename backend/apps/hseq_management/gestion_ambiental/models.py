"""
Modelos para Gestión Ambiental - HSEQ Management
Residuos, Vertimientos, Emisiones, Consumo de Recursos, Huella de Carbono
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


# ============================================================================
# RESIDUOS
# ============================================================================

class TipoResiduo(models.Model):
    """
    Catálogo de tipos de residuos según clasificación ambiental
    """
    CLASE_RESIDUO_CHOICES = [
        ('PELIGROSO', 'Peligroso'),
        ('NO_PELIGROSO', 'No Peligroso'),
        ('RECICLABLE', 'Reciclable'),
        ('ORGANICO', 'Orgánico'),
        ('RAEE', 'RAEE (Residuos de Aparatos Eléctricos y Electrónicos)'),
        ('RCD', 'RCD (Residuos de Construcción y Demolición)'),
        ('ESPECIAL', 'Especial'),
    ]

    CODIGO_CER_HELP = "Código según Lista Europea de Residuos (LER/CER)"

    codigo = models.CharField(
        max_length=20,
        unique=True,
        help_text="Código interno del tipo de residuo"
    )
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    clase = models.CharField(max_length=20, choices=CLASE_RESIDUO_CHOICES)

    # Clasificación internacional
    codigo_cer = models.CharField(
        max_length=10,
        blank=True,
        help_text=CODIGO_CER_HELP
    )

    # Características de peligrosidad (para residuos peligrosos)
    es_corrosivo = models.BooleanField(default=False)
    es_reactivo = models.BooleanField(default=False)
    es_explosivo = models.BooleanField(default=False)
    es_toxico = models.BooleanField(default=False)
    es_inflamable = models.BooleanField(default=False)
    es_infeccioso = models.BooleanField(default=False)

    # Tratamiento
    requiere_tratamiento_especial = models.BooleanField(default=False)
    instrucciones_manejo = models.TextField(blank=True)

    color_contenedor = models.CharField(
        max_length=50,
        blank=True,
        help_text="Color del contenedor según normativa (ej: verde, gris, rojo)"
    )

    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'gestion_ambiental_tipo_residuo'
        verbose_name = 'Tipo de Residuo'
        verbose_name_plural = 'Tipos de Residuos'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['clase', 'activo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class GestorAmbiental(models.Model):
    """
    Empresas gestoras autorizadas para manejo de residuos, vertimientos, etc.
    """
    TIPO_GESTOR_CHOICES = [
        ('RESIDUOS', 'Gestor de Residuos'),
        ('VERTIMIENTOS', 'Gestor de Vertimientos'),
        ('EMISIONES', 'Gestor de Emisiones'),
        ('RECICLAJE', 'Empresa de Reciclaje'),
        ('APROVECHAMIENTO', 'Aprovechamiento'),
        ('DISPOSICION_FINAL', 'Disposición Final'),
    ]

    empresa_id = models.IntegerField(
        help_text="ID de la empresa (multi-tenant)"
    )

    razon_social = models.CharField(max_length=255)
    nit = models.CharField(max_length=20)

    tipo_gestor = models.CharField(max_length=30, choices=TIPO_GESTOR_CHOICES)

    # Licencias y permisos
    numero_licencia_ambiental = models.CharField(max_length=100, blank=True)
    fecha_expedicion_licencia = models.DateField(null=True, blank=True)
    fecha_vencimiento_licencia = models.DateField(null=True, blank=True)
    autoridad_ambiental_emisor = models.CharField(
        max_length=255,
        blank=True,
        help_text="CAR, CRA, Corporación Autónoma Regional, etc."
    )

    # Tipos de residuos que maneja
    tipos_residuos = models.ManyToManyField(
        TipoResiduo,
        blank=True,
        related_name='gestores'
    )

    # Contacto
    contacto_nombre = models.CharField(max_length=255, blank=True)
    contacto_telefono = models.CharField(max_length=50, blank=True)
    contacto_email = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)
    ciudad = models.CharField(max_length=100, blank=True)

    # Certificaciones
    certificaciones = models.TextField(
        blank=True,
        help_text="ISO 14001, BASC, etc."
    )

    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'gestion_ambiental_gestor'
        verbose_name = 'Gestor Ambiental'
        verbose_name_plural = 'Gestores Ambientales'
        ordering = ['razon_social']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo_gestor']),
            models.Index(fields=['nit']),
        ]

    def __str__(self):
        return f"{self.razon_social} - {self.get_tipo_gestor_display()}"

    @property
    def licencia_vigente(self):
        """Verifica si la licencia está vigente"""
        if not self.fecha_vencimiento_licencia:
            return None
        from django.utils import timezone
        return self.fecha_vencimiento_licencia >= timezone.now().date()


class RegistroResiduo(models.Model):
    """
    Registro de generación y disposición de residuos
    """
    TIPO_MOVIMIENTO_CHOICES = [
        ('GENERACION', 'Generación'),
        ('DISPOSICION', 'Disposición'),
        ('TRANSFERENCIA', 'Transferencia'),
        ('APROVECHAMIENTO', 'Aprovechamiento'),
    ]

    empresa_id = models.IntegerField(
        help_text="ID de la empresa (multi-tenant)"
    )

    fecha = models.DateField()
    tipo_residuo = models.ForeignKey(
        TipoResiduo,
        on_delete=models.PROTECT,
        related_name='registros'
    )

    tipo_movimiento = models.CharField(
        max_length=20,
        choices=TIPO_MOVIMIENTO_CHOICES
    )

    # Cantidades
    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    unidad_medida = models.CharField(
        max_length=10,
        choices=[
            ('KG', 'Kilogramos'),
            ('TON', 'Toneladas'),
            ('LT', 'Litros'),
            ('M3', 'Metros cúbicos'),
            ('UND', 'Unidades'),
        ],
        default='KG'
    )

    # Origen/Destino
    area_generadora = models.CharField(
        max_length=255,
        blank=True,
        help_text="Área o proceso que genera el residuo"
    )

    gestor = models.ForeignKey(
        GestorAmbiental,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='residuos_gestionados'
    )

    # Tratamiento
    tratamiento_aplicado = models.CharField(
        max_length=255,
        blank=True,
        help_text="Reciclaje, incineración, relleno sanitario, etc."
    )

    # Documentación
    numero_manifiesto = models.CharField(
        max_length=100,
        blank=True,
        help_text="Número de manifiesto de carga o certificado de disposición"
    )
    certificado_disposicion = models.FileField(
        upload_to='gestion_ambiental/certificados_residuos/',
        null=True,
        blank=True
    )

    observaciones = models.TextField(blank=True)

    # Usuario que registra
    registrado_por = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'gestion_ambiental_registro_residuo'
        verbose_name = 'Registro de Residuo'
        verbose_name_plural = 'Registros de Residuos'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['empresa_id', 'fecha']),
            models.Index(fields=['tipo_residuo', 'tipo_movimiento']),
        ]

    def __str__(self):
        return f"{self.fecha} - {self.tipo_residuo.nombre} - {self.cantidad} {self.unidad_medida}"


# ============================================================================
# VERTIMIENTOS
# ============================================================================

class Vertimiento(models.Model):
    """
    Registro de vertimientos con parámetros fisicoquímicos
    """
    TIPO_VERTIMIENTO_CHOICES = [
        ('DOMESTICO', 'Doméstico'),
        ('INDUSTRIAL', 'Industrial'),
        ('PLUVIAL', 'Pluvial'),
        ('MIXTO', 'Mixto'),
    ]

    CUERPO_RECEPTOR_CHOICES = [
        ('ALCANTARILLADO', 'Alcantarillado Municipal'),
        ('RIO', 'Río'),
        ('QUEBRADA', 'Quebrada'),
        ('LAGO', 'Lago'),
        ('MAR', 'Mar'),
        ('SUELO', 'Suelo'),
        ('PTAR', 'Planta de Tratamiento'),
    ]

    empresa_id = models.IntegerField(
        help_text="ID de la empresa (multi-tenant)"
    )

    fecha_vertimiento = models.DateField()
    hora_vertimiento = models.TimeField(null=True, blank=True)

    tipo_vertimiento = models.CharField(
        max_length=20,
        choices=TIPO_VERTIMIENTO_CHOICES
    )

    # Punto de vertimiento
    punto_vertimiento = models.CharField(
        max_length=255,
        help_text="Identificación del punto de descarga"
    )
    coordenadas = models.CharField(max_length=100, blank=True)

    cuerpo_receptor = models.CharField(
        max_length=30,
        choices=CUERPO_RECEPTOR_CHOICES
    )
    nombre_cuerpo_receptor = models.CharField(max_length=255, blank=True)

    # Caudal
    caudal_m3_dia = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Caudal en metros cúbicos por día"
    )

    # Parámetros fisicoquímicos
    ph = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('14'))]
    )
    temperatura_celsius = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    dbo5_mg_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Demanda Bioquímica de Oxígeno (mg/L)"
    )
    dqo_mg_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Demanda Química de Oxígeno (mg/L)"
    )
    sst_mg_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Sólidos Suspendidos Totales (mg/L)"
    )
    grasas_aceites_mg_l = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Grasas y Aceites (mg/L)"
    )

    # Metales pesados y otros contaminantes
    parametros_adicionales = models.JSONField(
        default=dict,
        blank=True,
        help_text="Otros parámetros: metales pesados, nitrógeno, fósforo, etc."
    )

    # Cumplimiento normativo
    cumple_normativa = models.BooleanField(
        null=True,
        blank=True,
        help_text="¿Cumple con los límites máximos permisibles?"
    )
    norma_referencia = models.CharField(
        max_length=255,
        blank=True,
        help_text="Resolución 631/2015, etc."
    )

    # Tratamiento previo
    tratamiento_previo = models.TextField(
        blank=True,
        help_text="Descripción del tratamiento antes de la descarga"
    )

    observaciones = models.TextField(blank=True)

    # Análisis de laboratorio
    laboratorio_analisis = models.CharField(max_length=255, blank=True)
    numero_informe_laboratorio = models.CharField(max_length=100, blank=True)
    archivo_informe = models.FileField(
        upload_to='gestion_ambiental/informes_vertimientos/',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'gestion_ambiental_vertimiento'
        verbose_name = 'Vertimiento'
        verbose_name_plural = 'Vertimientos'
        ordering = ['-fecha_vertimiento']
        indexes = [
            models.Index(fields=['empresa_id', 'fecha_vertimiento']),
            models.Index(fields=['tipo_vertimiento', 'cumple_normativa']),
        ]

    def __str__(self):
        return f"{self.fecha_vertimiento} - {self.punto_vertimiento}"


# ============================================================================
# EMISIONES
# ============================================================================

class FuenteEmision(models.Model):
    """
    Fuentes de emisión de gases y material particulado
    """
    TIPO_FUENTE_CHOICES = [
        ('FIJA_PUNTUAL', 'Fija Puntual'),
        ('FIJA_DISPERSA', 'Fija Dispersa'),
        ('MOVIL', 'Móvil'),
    ]

    empresa_id = models.IntegerField(
        help_text="ID de la empresa (multi-tenant)"
    )

    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)

    tipo_fuente = models.CharField(max_length=20, choices=TIPO_FUENTE_CHOICES)

    # Ubicación
    area_ubicacion = models.CharField(max_length=255, blank=True)
    coordenadas = models.CharField(max_length=100, blank=True)
    altura_chimenea_m = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Altura de la chimenea en metros (para fuentes fijas)"
    )

    # Proceso asociado
    proceso_generador = models.CharField(
        max_length=255,
        blank=True,
        help_text="Proceso productivo que genera las emisiones"
    )

    # Combustible utilizado
    tipo_combustible = models.CharField(
        max_length=100,
        blank=True,
        help_text="Gas natural, ACPM, carbón, etc."
    )

    # Control de emisiones
    sistema_control = models.TextField(
        blank=True,
        help_text="Filtros, ciclones, lavadores, etc."
    )

    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'gestion_ambiental_fuente_emision'
        verbose_name = 'Fuente de Emisión'
        verbose_name_plural = 'Fuentes de Emisión'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo_fuente']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class RegistroEmision(models.Model):
    """
    Mediciones de emisiones atmosféricas
    """
    empresa_id = models.IntegerField(
        help_text="ID de la empresa (multi-tenant)"
    )

    fecha_medicion = models.DateField()
    hora_medicion = models.TimeField(null=True, blank=True)

    fuente_emision = models.ForeignKey(
        FuenteEmision,
        on_delete=models.PROTECT,
        related_name='registros'
    )

    # Parámetros medidos
    material_particulado_mg_m3 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Material Particulado (mg/m³)"
    )
    pm10_ug_m3 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="PM10 (µg/m³)"
    )
    pm25_ug_m3 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="PM2.5 (µg/m³)"
    )

    # Gases
    so2_ppm = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Dióxido de Azufre (ppm)"
    )
    nox_ppm = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Óxidos de Nitrógeno (ppm)"
    )
    co_ppm = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Monóxido de Carbono (ppm)"
    )
    co2_ppm = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Dióxido de Carbono (ppm)"
    )

    # Compuestos orgánicos volátiles
    cov_mg_m3 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Compuestos Orgánicos Volátiles (mg/m³)"
    )

    # Condiciones de medición
    temperatura_gases_celsius = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )
    velocidad_gases_m_s = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Velocidad de los gases (m/s)"
    )
    humedad_relativa_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))]
    )

    # Cumplimiento
    cumple_normativa = models.BooleanField(
        null=True,
        blank=True,
        help_text="¿Cumple con los límites máximos permisibles?"
    )
    norma_referencia = models.CharField(
        max_length=255,
        blank=True,
        help_text="Resolución 909/2008, etc."
    )

    # Laboratorio
    laboratorio_medicion = models.CharField(max_length=255, blank=True)
    numero_informe = models.CharField(max_length=100, blank=True)
    archivo_informe = models.FileField(
        upload_to='gestion_ambiental/informes_emisiones/',
        null=True,
        blank=True
    )

    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'gestion_ambiental_registro_emision'
        verbose_name = 'Registro de Emisión'
        verbose_name_plural = 'Registros de Emisiones'
        ordering = ['-fecha_medicion']
        indexes = [
            models.Index(fields=['empresa_id', 'fecha_medicion']),
            models.Index(fields=['fuente_emision', 'cumple_normativa']),
        ]

    def __str__(self):
        return f"{self.fecha_medicion} - {self.fuente_emision.nombre}"


# ============================================================================
# CONSUMO DE RECURSOS
# ============================================================================

class TipoRecurso(models.Model):
    """
    Catálogo de tipos de recursos naturales y energéticos
    """
    CATEGORIA_CHOICES = [
        ('AGUA', 'Agua'),
        ('ENERGIA', 'Energía'),
        ('GAS', 'Gas'),
        ('COMBUSTIBLE', 'Combustible'),
        ('MATERIAL', 'Material'),
    ]

    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)

    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)

    # Unidad de medida
    unidad_medida = models.CharField(
        max_length=20,
        help_text="m³, kWh, galones, kg, etc."
    )

    # Factor de conversión a CO2 equivalente
    factor_emision_co2_kg = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Factor de emisión de CO2 por unidad de recurso"
    )

    # Costo promedio
    costo_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Costo promedio por unidad"
    )

    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'gestion_ambiental_tipo_recurso'
        verbose_name = 'Tipo de Recurso'
        verbose_name_plural = 'Tipos de Recursos'
        ordering = ['categoria', 'nombre']
        indexes = [
            models.Index(fields=['categoria', 'activo']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.unidad_medida})"


class ConsumoRecurso(models.Model):
    """
    Registro de consumo mensual de recursos
    """
    empresa_id = models.IntegerField(
        help_text="ID de la empresa (multi-tenant)"
    )

    periodo_year = models.IntegerField(help_text="Año del consumo")
    periodo_month = models.IntegerField(
        help_text="Mes del consumo (1-12)",
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )

    tipo_recurso = models.ForeignKey(
        TipoRecurso,
        on_delete=models.PROTECT,
        related_name='consumos'
    )

    # Consumo
    cantidad_consumida = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))]
    )

    # Fuente/Proveedor
    fuente_suministro = models.CharField(
        max_length=255,
        blank=True,
        help_text="Acueducto, empresa de energía, proveedor, etc."
    )

    # Área de consumo
    area_consumidora = models.CharField(
        max_length=255,
        blank=True,
        help_text="Producción, administrativa, etc."
    )

    # Costo
    costo_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Medición
    lectura_inicial = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    lectura_final = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    numero_factura = models.CharField(max_length=100, blank=True)

    # Emisiones asociadas
    emision_co2_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Emisiones de CO2 equivalente generadas por este consumo"
    )

    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'gestion_ambiental_consumo_recurso'
        verbose_name = 'Consumo de Recurso'
        verbose_name_plural = 'Consumos de Recursos'
        ordering = ['-periodo_year', '-periodo_month']
        unique_together = [['empresa_id', 'periodo_year', 'periodo_month', 'tipo_recurso', 'area_consumidora']]
        indexes = [
            models.Index(fields=['empresa_id', 'periodo_year', 'periodo_month']),
            models.Index(fields=['tipo_recurso', 'periodo_year']),
        ]

    def __str__(self):
        return f"{self.periodo_year}/{self.periodo_month:02d} - {self.tipo_recurso.nombre}: {self.cantidad_consumida} {self.tipo_recurso.unidad_medida}"

    def save(self, *args, **kwargs):
        """Calcular emisiones de CO2 automáticamente si hay factor de emisión"""
        if self.tipo_recurso.factor_emision_co2_kg:
            self.emision_co2_kg = self.cantidad_consumida * self.tipo_recurso.factor_emision_co2_kg
        super().save(*args, **kwargs)


# ============================================================================
# HUELLA DE CARBONO
# ============================================================================

class CalculoHuellaCarbono(models.Model):
    """
    Cálculo de huella de carbono corporativa según GHG Protocol
    Alcances 1, 2 y 3
    """
    empresa_id = models.IntegerField(
        help_text="ID de la empresa (multi-tenant)"
    )

    periodo_year = models.IntegerField(help_text="Año del cálculo")
    periodo_inicio = models.DateField()
    periodo_fin = models.DateField()

    # Metodología
    metodologia = models.CharField(
        max_length=100,
        default='GHG Protocol',
        help_text="GHG Protocol, ISO 14064, PAS 2050, etc."
    )
    version_metodologia = models.CharField(max_length=50, blank=True)

    # Alcance 1: Emisiones directas
    alcance1_combustion_estacionaria = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de combustión en instalaciones fijas"
    )
    alcance1_combustion_movil = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de vehículos propios"
    )
    alcance1_emisiones_proceso = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de procesos industriales"
    )
    alcance1_emisiones_fugitivas = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de fugas de refrigerantes, gases, etc."
    )
    alcance1_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Total Alcance 1 (tCO2e)"
    )

    # Alcance 2: Emisiones indirectas por energía
    alcance2_electricidad = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de consumo eléctrico"
    )
    alcance2_vapor = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de vapor comprado"
    )
    alcance2_calefaccion = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de calefacción/refrigeración"
    )
    alcance2_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Total Alcance 2 (tCO2e)"
    )

    # Alcance 3: Otras emisiones indirectas
    alcance3_viajes_negocio = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de viajes de negocios"
    )
    alcance3_desplazamiento_empleados = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de desplazamiento de empleados"
    )
    alcance3_transporte_upstream = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de transporte de materias primas"
    )
    alcance3_transporte_downstream = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de distribución de productos"
    )
    alcance3_residuos = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de gestión de residuos"
    )
    alcance3_otros = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e de otras fuentes indirectas"
    )
    alcance3_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Total Alcance 3 (tCO2e)"
    )

    # Totales
    huella_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Huella total (tCO2e)"
    )

    # Información adicional
    numero_empleados = models.IntegerField(
        null=True,
        blank=True,
        help_text="Número de empleados en el período"
    )
    huella_per_capita = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="tCO2e por empleado"
    )

    # Detalle de cálculos
    detalle_calculos = models.JSONField(
        default=dict,
        blank=True,
        help_text="Detalle de factores de emisión y fuentes utilizadas"
    )

    # Verificación
    verificado = models.BooleanField(default=False)
    verificador_externo = models.CharField(max_length=255, blank=True)
    fecha_verificacion = models.DateField(null=True, blank=True)

    # Compensación
    compensaciones_co2 = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="tCO2e compensadas (bonos, proyectos)"
    )
    huella_neta = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Huella neta después de compensaciones"
    )

    # Informe
    informe_pdf = models.FileField(
        upload_to='gestion_ambiental/huella_carbono/',
        null=True,
        blank=True
    )

    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'gestion_ambiental_huella_carbono'
        verbose_name = 'Cálculo de Huella de Carbono'
        verbose_name_plural = 'Cálculos de Huella de Carbono'
        ordering = ['-periodo_year']
        unique_together = [['empresa_id', 'periodo_year']]
        indexes = [
            models.Index(fields=['empresa_id', 'periodo_year']),
        ]

    def __str__(self):
        return f"Huella de Carbono {self.periodo_year} - {self.huella_total} tCO2e"

    def save(self, *args, **kwargs):
        """Calcular totales automáticamente"""
        # Alcance 1
        self.alcance1_total = (
            self.alcance1_combustion_estacionaria +
            self.alcance1_combustion_movil +
            self.alcance1_emisiones_proceso +
            self.alcance1_emisiones_fugitivas
        )

        # Alcance 2
        self.alcance2_total = (
            self.alcance2_electricidad +
            self.alcance2_vapor +
            self.alcance2_calefaccion
        )

        # Alcance 3
        self.alcance3_total = (
            self.alcance3_viajes_negocio +
            self.alcance3_desplazamiento_empleados +
            self.alcance3_transporte_upstream +
            self.alcance3_transporte_downstream +
            self.alcance3_residuos +
            self.alcance3_otros
        )

        # Huella total
        self.huella_total = self.alcance1_total + self.alcance2_total + self.alcance3_total

        # Huella neta
        self.huella_neta = self.huella_total - self.compensaciones_co2

        # Per cápita
        if self.numero_empleados and self.numero_empleados > 0:
            self.huella_per_capita = self.huella_total / self.numero_empleados

        super().save(*args, **kwargs)


# ============================================================================
# CERTIFICADOS AMBIENTALES
# ============================================================================

class CertificadoAmbiental(models.Model):
    """
    Certificados de disposición, aprovechamiento, cumplimiento ambiental
    """
    TIPO_CERTIFICADO_CHOICES = [
        ('DISPOSICION_RESIDUOS', 'Disposición de Residuos'),
        ('APROVECHAMIENTO', 'Aprovechamiento'),
        ('RECICLAJE', 'Reciclaje'),
        ('VERTIMIENTO', 'Vertimiento'),
        ('EMISION', 'Emisión'),
        ('CUMPLIMIENTO_AMBIENTAL', 'Cumplimiento Ambiental'),
        ('COMPENSACION_CO2', 'Compensación CO2'),
        ('ISO_14001', 'ISO 14001'),
        ('OTRO', 'Otro'),
    ]

    empresa_id = models.IntegerField(
        help_text="ID de la empresa (multi-tenant)"
    )

    numero_certificado = models.CharField(max_length=100, unique=True)
    tipo_certificado = models.CharField(
        max_length=30,
        choices=TIPO_CERTIFICADO_CHOICES
    )

    # Emisor
    emisor = models.CharField(
        max_length=255,
        help_text="Gestor ambiental, autoridad ambiental, certificadora"
    )

    gestor = models.ForeignKey(
        GestorAmbiental,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificados_emitidos'
    )

    # Fechas
    fecha_emision = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)

    # Detalles
    descripcion = models.TextField(help_text="Descripción del certificado")

    # Residuos certificados
    residuos_relacionados = models.ManyToManyField(
        RegistroResiduo,
        blank=True,
        related_name='certificados'
    )

    # Cantidades certificadas
    cantidad_certificada = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    unidad_medida = models.CharField(max_length=20, blank=True)

    # Archivo
    archivo_certificado = models.FileField(
        upload_to='gestion_ambiental/certificados/',
        help_text="PDF del certificado"
    )

    # Validez
    vigente = models.BooleanField(default=True)

    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'gestion_ambiental_certificado'
        verbose_name = 'Certificado Ambiental'
        verbose_name_plural = 'Certificados Ambientales'
        ordering = ['-fecha_emision']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo_certificado']),
            models.Index(fields=['fecha_vencimiento', 'vigente']),
        ]

    def __str__(self):
        return f"{self.numero_certificado} - {self.get_tipo_certificado_display()}"

    @property
    def esta_vigente(self):
        """Verifica si el certificado está vigente por fecha"""
        if not self.fecha_vencimiento:
            return self.vigente
        from django.utils import timezone
        return self.vigente and self.fecha_vencimiento >= timezone.now().date()
