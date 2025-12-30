"""
Modelos para Gestión de Flota - Logistics Fleet Management
Sistema de Gestión Grasas y Huesos del Norte

Cumplimiento PESV (Resolución 40595/2022) para gestión de flota vehicular
de recolección y distribución.

Incluye:
- Catálogos dinámicos: TipoVehiculo, EstadoVehiculo
- Gestión vehículos: Vehiculo, DocumentoVehiculo, HojaVidaVehiculo
- Mantenimiento: MantenimientoVehiculo
- Costos: CostoOperacion
- PESV: VerificacionTercero (inspecciones preoperacionales)
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from apps.core.base_models import BaseCompanyModel, OrderedModel


# ==============================================================================
# CATÁLOGOS DINÁMICOS
# ==============================================================================

class TipoVehiculo(OrderedModel):
    """
    Tipo de Vehículo - Catálogo dinámico.

    Define clasificación de vehículos según capacidad, tipo de operación
    y requisitos regulatorios (licencias, refrigeración, etc.)

    Ejemplos: CAMION_3TON, FURGON_1TON, MOTO_CARGA
    """
    CATEGORIA_LICENCIA_CHOICES = [
        ('A1', 'A1 - Motocicletas hasta 125cc'),
        ('A2', 'A2 - Motocicletas, Mototaxis'),
        ('B1', 'B1 - Automóviles, Motocarros'),
        ('B2', 'B2 - Camionetas, Microbuses, Camperos'),
        ('B3', 'B3 - Vehículos de servicio público'),
        ('C1', 'C1 - Camiones rígidos, Busetas'),
        ('C2', 'C2 - Camiones articulados'),
        ('C3', 'C3 - Vehículos articulados de mayor capacidad'),
    ]

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de vehículo (ej: CAMION_3TON)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de vehículo'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )

    # Capacidades
    capacidad_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Capacidad de carga (kg)',
        help_text='Capacidad máxima de carga en kilogramos'
    )
    capacidad_m3 = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Capacidad volumétrica (m³)',
        help_text='Capacidad volumétrica en metros cúbicos'
    )

    # Requisitos especiales
    requiere_refrigeracion = models.BooleanField(
        default=False,
        verbose_name='Requiere refrigeración',
        help_text='Indica si este tipo de vehículo debe tener sistema de refrigeración'
    )
    requiere_licencia_especial = models.BooleanField(
        default=False,
        verbose_name='Requiere licencia especial',
        help_text='Indica si requiere licencia de conducción especial'
    )
    categoria_licencia = models.CharField(
        max_length=10,
        choices=CATEGORIA_LICENCIA_CHOICES,
        blank=True,
        null=True,
        verbose_name='Categoría de licencia requerida',
        help_text='Categoría mínima de licencia según Resolución 40595/2022'
    )

    # Control
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'logistics_tipo_vehiculo'
        verbose_name = 'Tipo de Vehículo'
        verbose_name_plural = 'Tipos de Vehículos'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo', 'is_active']),
            models.Index(fields=['orden']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

    def clean(self):
        super().clean()
        if self.requiere_licencia_especial and not self.categoria_licencia:
            raise ValidationError({
                'categoria_licencia': 'Debe especificar categoría de licencia si requiere licencia especial'
            })


class EstadoVehiculo(OrderedModel):
    """
    Estado de Vehículo - Catálogo dinámico.

    Define estados operacionales de los vehículos de la flota.

    Ejemplos: DISPONIBLE, EN_RUTA, MANTENIMIENTO, FUERA_SERVICIO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del estado (ej: DISPONIBLE, EN_RUTA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del estado'
    )
    color = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Color (código hex)',
        help_text='Color para visualización (ej: #28a745, #dc3545)'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )

    # Configuración funcional
    disponible_para_ruta = models.BooleanField(
        default=True,
        verbose_name='Disponible para asignar a ruta',
        help_text='Indica si vehículos en este estado pueden asignarse a rutas'
    )
    requiere_mantenimiento = models.BooleanField(
        default=False,
        verbose_name='Requiere mantenimiento',
        help_text='Indica si este estado implica que el vehículo requiere mantenimiento'
    )

    # Control
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'logistics_estado_vehiculo'
        verbose_name = 'Estado de Vehículo'
        verbose_name_plural = 'Estados de Vehículos'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo', 'is_active']),
            models.Index(fields=['disponible_para_ruta']),
        ]

    def __str__(self):
        return self.nombre


# ==============================================================================
# MODELO PRINCIPAL - VEHÍCULOS
# ==============================================================================

class Vehiculo(BaseCompanyModel):
    """
    Vehículo - Modelo principal de la flota.

    Gestión completa de vehículos con información técnica, legal,
    operativa y de propiedad. Cumplimiento PESV.
    """
    # Identificación
    placa = models.CharField(
        max_length=10,
        unique=True,
        db_index=True,
        verbose_name='Placa',
        help_text='Placa única del vehículo (ej: ABC123)'
    )
    tipo_vehiculo = models.ForeignKey(
        TipoVehiculo,
        on_delete=models.PROTECT,
        related_name='vehiculos',
        verbose_name='Tipo de vehículo'
    )
    estado = models.ForeignKey(
        EstadoVehiculo,
        on_delete=models.PROTECT,
        related_name='vehiculos',
        verbose_name='Estado actual'
    )

    # Información básica
    marca = models.CharField(
        max_length=50,
        verbose_name='Marca',
        help_text='Marca del vehículo (ej: Chevrolet, Toyota, Mazda)'
    )
    modelo = models.CharField(
        max_length=50,
        verbose_name='Modelo',
        help_text='Modelo del vehículo (ej: NPR, Hilux, B2200)'
    )
    anio = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1950),
            MaxValueValidator(2050)
        ],
        verbose_name='Año',
        help_text='Año de fabricación del vehículo'
    )
    color = models.CharField(
        max_length=30,
        blank=True,
        null=True,
        verbose_name='Color'
    )

    # Identificación técnica
    numero_motor = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número de motor'
    )
    numero_chasis = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número de chasis'
    )
    vin = models.CharField(
        max_length=17,
        blank=True,
        null=True,
        verbose_name='VIN (Vehicle Identification Number)',
        help_text='Número de identificación vehicular de 17 caracteres'
    )

    # Capacidad operativa
    capacidad_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Capacidad de carga (kg)',
        help_text='Capacidad real de carga del vehículo'
    )
    km_actual = models.PositiveIntegerField(
        default=0,
        verbose_name='Kilometraje actual',
        help_text='Odómetro actual del vehículo'
    )

    # Documentos legales (fechas de vencimiento)
    fecha_matricula = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de matrícula'
    )
    fecha_soat = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='Fecha de vencimiento SOAT',
        help_text='Fecha de vencimiento del Seguro Obligatorio de Accidentes de Tránsito'
    )
    fecha_tecnomecanica = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='Fecha de vencimiento Tecnomecánica',
        help_text='Fecha de vencimiento de la revisión tecnomecánica'
    )

    # Propiedad
    propietario_nombre = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Nombre del propietario',
        help_text='Nombre completo o razón social del propietario'
    )
    propietario_documento = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Documento del propietario',
        help_text='NIT o cédula del propietario'
    )
    es_propio = models.BooleanField(
        default=True,
        verbose_name='Es propio de la empresa',
        help_text='Indica si el vehículo es propiedad de la empresa'
    )
    es_contratado = models.BooleanField(
        default=False,
        verbose_name='Es contratado/arrendado',
        help_text='Indica si el vehículo está contratado o arrendado'
    )

    # Tecnología GPS
    gps_instalado = models.BooleanField(
        default=False,
        verbose_name='GPS instalado',
        help_text='Indica si el vehículo tiene sistema GPS instalado'
    )
    numero_gps = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número/ID del GPS',
        help_text='Identificador del dispositivo GPS instalado'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones generales'
    )

    class Meta:
        db_table = 'logistics_vehiculo'
        verbose_name = 'Vehículo'
        verbose_name_plural = 'Vehículos'
        ordering = ['placa']
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['placa']),
            models.Index(fields=['estado', 'is_active']),
            models.Index(fields=['fecha_soat']),
            models.Index(fields=['fecha_tecnomecanica']),
        ]

    def __str__(self):
        return f"{self.placa} - {self.marca} {self.modelo}"

    def clean(self):
        super().clean()

        # Validar que si es contratado no puede ser propio
        if self.es_contratado and self.es_propio:
            raise ValidationError({
                'es_contratado': 'Un vehículo no puede ser propio y contratado simultáneamente'
            })

        # Validar VIN si se proporciona
        if self.vin and len(self.vin) != 17:
            raise ValidationError({
                'vin': 'El VIN debe tener exactamente 17 caracteres'
            })

    @property
    def dias_hasta_vencimiento_soat(self):
        """Calcula días hasta vencimiento del SOAT."""
        if not self.fecha_soat:
            return None
        delta = self.fecha_soat - timezone.now().date()
        return delta.days

    @property
    def dias_hasta_vencimiento_tecnomecanica(self):
        """Calcula días hasta vencimiento de tecnomecánica."""
        if not self.fecha_tecnomecanica:
            return None
        delta = self.fecha_tecnomecanica - timezone.now().date()
        return delta.days

    @property
    def documentos_al_dia(self):
        """Verifica si todos los documentos están al día."""
        if not self.fecha_soat or not self.fecha_tecnomecanica:
            return False
        hoy = timezone.now().date()
        return self.fecha_soat >= hoy and self.fecha_tecnomecanica >= hoy

    @property
    def disponible_para_operar(self):
        """Verifica si el vehículo está disponible para operar."""
        return (
            self.is_active and
            self.estado.disponible_para_ruta and
            self.documentos_al_dia
        )


# ==============================================================================
# DOCUMENTOS Y LEGALES
# ==============================================================================

class DocumentoVehiculo(BaseCompanyModel):
    """
    Documento de Vehículo - Gestión de documentación legal.

    Almacena y controla vencimientos de documentos legales
    de los vehículos (SOAT, Tecnomecánica, Pólizas, etc.)
    """
    TIPO_DOCUMENTO_CHOICES = [
        ('SOAT', 'SOAT - Seguro Obligatorio'),
        ('TECNOMECANICA', 'Revisión Tecnomecánica'),
        ('TARJETA_PROPIEDAD', 'Tarjeta de Propiedad'),
        ('POLIZA', 'Póliza de Seguro'),
        ('OPERACION', 'Tarjeta de Operación'),
        ('OTRO', 'Otro Documento'),
    ]

    vehiculo = models.ForeignKey(
        Vehiculo,
        on_delete=models.CASCADE,
        related_name='documentos',
        verbose_name='Vehículo'
    )
    tipo_documento = models.CharField(
        max_length=30,
        choices=TIPO_DOCUMENTO_CHOICES,
        db_index=True,
        verbose_name='Tipo de documento'
    )
    numero_documento = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Número de documento',
        help_text='Número o código del documento'
    )
    fecha_expedicion = models.DateField(
        verbose_name='Fecha de expedición'
    )
    fecha_vencimiento = models.DateField(
        db_index=True,
        verbose_name='Fecha de vencimiento'
    )
    entidad_emisora = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Entidad emisora',
        help_text='Entidad que emitió el documento (ej: Aseguradora, CDA)'
    )
    documento_url = models.FileField(
        upload_to='fleet/documentos/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Archivo del documento',
        help_text='Archivo PDF o imagen del documento'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'logistics_documento_vehiculo'
        verbose_name = 'Documento de Vehículo'
        verbose_name_plural = 'Documentos de Vehículos'
        ordering = ['-fecha_vencimiento']
        indexes = [
            models.Index(fields=['vehiculo', 'tipo_documento']),
            models.Index(fields=['fecha_vencimiento', 'is_active']),
            models.Index(fields=['tipo_documento', 'fecha_vencimiento']),
        ]

    def __str__(self):
        return f"{self.vehiculo.placa} - {self.get_tipo_documento_display()}"

    @property
    def dias_hasta_vencimiento(self):
        """Calcula días hasta vencimiento."""
        delta = self.fecha_vencimiento - timezone.now().date()
        return delta.days

    @property
    def esta_vencido(self):
        """Verifica si el documento está vencido."""
        return self.fecha_vencimiento < timezone.now().date()

    @property
    def proximo_a_vencer(self):
        """Verifica si está próximo a vencer (30 días)."""
        return 0 <= self.dias_hasta_vencimiento <= 30

    def clean(self):
        super().clean()
        if self.fecha_vencimiento <= self.fecha_expedicion:
            raise ValidationError({
                'fecha_vencimiento': 'La fecha de vencimiento debe ser posterior a la fecha de expedición'
            })


class HojaVidaVehiculo(BaseCompanyModel):
    """
    Hoja de Vida de Vehículo - Historial de eventos.

    Registra todos los eventos relevantes del vehículo:
    mantenimientos, accidentes, infracciones, modificaciones, etc.
    """
    TIPO_EVENTO_CHOICES = [
        ('MANTENIMIENTO', 'Mantenimiento'),
        ('REPARACION', 'Reparación'),
        ('ACCIDENTE', 'Accidente'),
        ('INFRACCION', 'Infracción/Comparendo'),
        ('MODIFICACION', 'Modificación técnica'),
        ('CAMBIO_PROPIETARIO', 'Cambio de propietario'),
        ('ADQUISICION', 'Adquisición'),
        ('BAJA', 'Baja del vehículo'),
        ('OTRO', 'Otro evento'),
    ]

    vehiculo = models.ForeignKey(
        Vehiculo,
        on_delete=models.CASCADE,
        related_name='hoja_vida',
        verbose_name='Vehículo'
    )
    fecha = models.DateField(
        db_index=True,
        verbose_name='Fecha del evento'
    )
    tipo_evento = models.CharField(
        max_length=30,
        choices=TIPO_EVENTO_CHOICES,
        db_index=True,
        verbose_name='Tipo de evento'
    )
    descripcion = models.TextField(
        verbose_name='Descripción del evento'
    )
    km_evento = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Kilometraje en el evento',
        help_text='Kilometraje del vehículo al momento del evento'
    )

    # Información financiera
    costo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Costo',
        help_text='Costo asociado al evento (si aplica)'
    )
    proveedor = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Proveedor',
        help_text='Proveedor o taller que realizó el servicio (si aplica)'
    )
    documento_soporte_url = models.FileField(
        upload_to='fleet/hoja_vida/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Documento soporte',
        help_text='Factura, orden de trabajo, acta, etc.'
    )

    # Auditoría
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='hojas_vida_vehiculos_registradas',
        verbose_name='Registrado por'
    )

    class Meta:
        db_table = 'logistics_hoja_vida_vehiculo'
        verbose_name = 'Hoja de Vida de Vehículo'
        verbose_name_plural = 'Hojas de Vida de Vehículos'
        ordering = ['-fecha', '-created_at']
        indexes = [
            models.Index(fields=['vehiculo', '-fecha']),
            models.Index(fields=['tipo_evento', '-fecha']),
            models.Index(fields=['fecha']),
        ]

    def __str__(self):
        return f"{self.vehiculo.placa} - {self.get_tipo_evento_display()} ({self.fecha})"


# ==============================================================================
# MANTENIMIENTO
# ==============================================================================

class MantenimientoVehiculo(BaseCompanyModel):
    """
    Mantenimiento de Vehículo - Gestión de mantenimientos.

    Programa y controla mantenimientos preventivos, correctivos y predictivos
    de la flota. Incluye costos, responsables y seguimiento de kilometraje.
    """
    TIPO_MANTENIMIENTO_CHOICES = [
        ('PREVENTIVO', 'Preventivo'),
        ('CORRECTIVO', 'Correctivo'),
        ('PREDICTIVO', 'Predictivo'),
    ]

    ESTADO_CHOICES = [
        ('PROGRAMADO', 'Programado'),
        ('EN_EJECUCION', 'En Ejecución'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]

    vehiculo = models.ForeignKey(
        Vehiculo,
        on_delete=models.CASCADE,
        related_name='mantenimientos',
        verbose_name='Vehículo'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_MANTENIMIENTO_CHOICES,
        db_index=True,
        verbose_name='Tipo de mantenimiento'
    )
    descripcion = models.TextField(
        verbose_name='Descripción del mantenimiento',
        help_text='Detalle de trabajos a realizar o realizados'
    )

    # Fechas
    fecha_programada = models.DateField(
        db_index=True,
        verbose_name='Fecha programada'
    )
    fecha_ejecucion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de ejecución real'
    )

    # Kilometraje
    km_mantenimiento = models.PositiveIntegerField(
        verbose_name='Kilometraje al mantenimiento',
        help_text='Kilometraje del vehículo al realizar el mantenimiento'
    )
    km_proximo_mantenimiento = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Kilometraje próximo mantenimiento',
        help_text='Kilometraje estimado para el siguiente mantenimiento'
    )

    # Costos
    costo_mano_obra = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Costo mano de obra'
    )
    costo_repuestos = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Costo de repuestos'
    )
    costo_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        editable=False,
        verbose_name='Costo total',
        help_text='Calculado automáticamente (mano de obra + repuestos)'
    )

    # Proveedor
    proveedor_nombre = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Nombre del proveedor/taller'
    )
    factura_numero = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número de factura'
    )

    # Responsable y estado
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='mantenimientos_responsable',
        null=True,
        blank=True,
        verbose_name='Responsable del mantenimiento'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PROGRAMADO',
        db_index=True,
        verbose_name='Estado'
    )

    class Meta:
        db_table = 'logistics_mantenimiento_vehiculo'
        verbose_name = 'Mantenimiento de Vehículo'
        verbose_name_plural = 'Mantenimientos de Vehículos'
        ordering = ['-fecha_programada']
        indexes = [
            models.Index(fields=['vehiculo', '-fecha_programada']),
            models.Index(fields=['estado', 'fecha_programada']),
            models.Index(fields=['tipo', '-fecha_programada']),
        ]

    def __str__(self):
        return f"{self.vehiculo.placa} - {self.get_tipo_display()} ({self.fecha_programada})"

    def save(self, *args, **kwargs):
        # Calcular costo total automáticamente
        self.costo_total = self.costo_mano_obra + self.costo_repuestos
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if self.fecha_ejecucion and self.fecha_ejecucion < self.fecha_programada:
            raise ValidationError({
                'fecha_ejecucion': 'La fecha de ejecución no puede ser anterior a la fecha programada'
            })

    @property
    def esta_vencido(self):
        """Verifica si el mantenimiento programado está vencido."""
        if self.estado in ['COMPLETADO', 'CANCELADO']:
            return False
        return self.fecha_programada < timezone.now().date()


# ==============================================================================
# COSTOS OPERATIVOS
# ==============================================================================

class CostoOperacion(BaseCompanyModel):
    """
    Costo de Operación - Registro de costos operativos.

    Registra costos variables de operación de la flota:
    combustible, peajes, parqueaderos, lavados, etc.

    Permite calcular indicadores de eficiencia (km/litro, costo/km).
    """
    TIPO_COSTO_CHOICES = [
        ('COMBUSTIBLE', 'Combustible'),
        ('PEAJE', 'Peaje'),
        ('PARQUEADERO', 'Parqueadero'),
        ('LAVADO', 'Lavado'),
        ('LUBRICANTES', 'Lubricantes'),
        ('NEUMATICOS', 'Neumáticos'),
        ('MULTA', 'Multa/Infracción'),
        ('OTRO', 'Otro costo'),
    ]

    vehiculo = models.ForeignKey(
        Vehiculo,
        on_delete=models.CASCADE,
        related_name='costos_operacion',
        verbose_name='Vehículo'
    )
    fecha = models.DateField(
        db_index=True,
        verbose_name='Fecha del gasto'
    )
    tipo_costo = models.CharField(
        max_length=20,
        choices=TIPO_COSTO_CHOICES,
        db_index=True,
        verbose_name='Tipo de costo'
    )
    valor = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Valor ($)',
        help_text='Valor total del gasto'
    )

    # Para combustible
    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Cantidad (litros)',
        help_text='Cantidad de litros (solo para combustible)'
    )
    km_recorridos = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Kilómetros recorridos',
        help_text='Kilómetros recorridos desde el último registro'
    )
    consumo_km_litro = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False,
        verbose_name='Consumo (km/litro)',
        help_text='Calculado automáticamente para combustible'
    )

    # Información adicional
    factura_numero = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número de factura/recibo'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )

    # Auditoría
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='costos_operacion_registrados',
        verbose_name='Registrado por'
    )

    class Meta:
        db_table = 'logistics_costo_operacion'
        verbose_name = 'Costo de Operación'
        verbose_name_plural = 'Costos de Operación'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['vehiculo', '-fecha']),
            models.Index(fields=['tipo_costo', '-fecha']),
            models.Index(fields=['fecha']),
        ]

    def __str__(self):
        return f"{self.vehiculo.placa} - {self.get_tipo_costo_display()} ({self.fecha})"

    def save(self, *args, **kwargs):
        # Calcular consumo km/litro para combustible
        if self.tipo_costo == 'COMBUSTIBLE' and self.cantidad and self.km_recorridos:
            self.consumo_km_litro = Decimal(self.km_recorridos) / self.cantidad
        super().save(*args, **kwargs)

    @property
    def costo_por_km(self):
        """Calcula el costo por kilómetro."""
        if self.km_recorridos and self.km_recorridos > 0:
            return self.valor / Decimal(self.km_recorridos)
        return None


# ==============================================================================
# PESV - INSPECCIONES Y VERIFICACIONES
# ==============================================================================

class VerificacionTercero(BaseCompanyModel):
    """
    Verificación de Tercero - Inspecciones PESV.

    Implementa las inspecciones preoperacionales diarias según
    Resolución 40595/2022 (PESV) y auditorías de terceros.

    Incluye checklist dinámico en JSON para flexibilidad.
    """
    TIPO_VERIFICACION_CHOICES = [
        ('PREOPERACIONAL_DIARIA', 'Inspección Preoperacional Diaria'),
        ('INSPECCION_MENSUAL', 'Inspección Mensual'),
        ('AUDITORIA_EXTERNA', 'Auditoría Externa'),
        ('INSPECCION_ESPECIAL', 'Inspección Especial'),
    ]

    RESULTADO_CHOICES = [
        ('APROBADO', 'Aprobado'),
        ('APROBADO_CON_OBSERVACIONES', 'Aprobado con Observaciones'),
        ('RECHAZADO', 'Rechazado - No Conforme'),
    ]

    vehiculo = models.ForeignKey(
        Vehiculo,
        on_delete=models.CASCADE,
        related_name='verificaciones',
        verbose_name='Vehículo'
    )
    fecha = models.DateTimeField(
        db_index=True,
        verbose_name='Fecha y hora de verificación'
    )
    tipo = models.CharField(
        max_length=30,
        choices=TIPO_VERIFICACION_CHOICES,
        db_index=True,
        verbose_name='Tipo de verificación'
    )

    # Inspector
    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='verificaciones_realizadas',
        verbose_name='Inspector (usuario)',
        help_text='Usuario del sistema que realizó la inspección'
    )
    inspector_externo = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Inspector externo',
        help_text='Nombre del inspector si es tercero/externo'
    )

    # Checklist dinámico
    checklist_items = models.JSONField(
        default=list,
        verbose_name='Items del checklist',
        help_text='Array de objetos: [{item: "", cumple: true/false, observacion: ""}]'
    )

    # Resultado
    resultado = models.CharField(
        max_length=30,
        choices=RESULTADO_CHOICES,
        db_index=True,
        verbose_name='Resultado de la verificación'
    )

    # Información operativa
    kilometraje = models.PositiveIntegerField(
        verbose_name='Kilometraje al momento de inspección'
    )
    nivel_combustible = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Nivel de combustible',
        help_text='Ej: 1/4, 1/2, 3/4, Lleno'
    )

    # Observaciones y acciones
    observaciones_generales = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones generales'
    )
    firma_inspector_url = models.FileField(
        upload_to='fleet/verificaciones/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Firma del inspector',
        help_text='Imagen de la firma digital del inspector'
    )
    acciones_correctivas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Acciones correctivas requeridas',
        help_text='Acciones a tomar si el resultado no es aprobado'
    )

    class Meta:
        db_table = 'logistics_verificacion_tercero'
        verbose_name = 'Verificación de Tercero (PESV)'
        verbose_name_plural = 'Verificaciones de Tercero (PESV)'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['vehiculo', '-fecha']),
            models.Index(fields=['tipo', '-fecha']),
            models.Index(fields=['resultado', '-fecha']),
            models.Index(fields=['fecha']),
        ]

    def __str__(self):
        return f"{self.vehiculo.placa} - {self.get_tipo_display()} ({self.fecha.date()})"

    @property
    def requiere_accion_inmediata(self):
        """Verifica si requiere acción inmediata (resultado rechazado)."""
        return self.resultado == 'RECHAZADO'

    @property
    def porcentaje_cumplimiento(self):
        """Calcula porcentaje de cumplimiento del checklist."""
        if not self.checklist_items:
            return None

        total_items = len(self.checklist_items)
        if total_items == 0:
            return None

        items_conformes = sum(1 for item in self.checklist_items if item.get('cumple', False))
        return round((items_conformes / total_items) * 100, 2)

    def clean(self):
        super().clean()

        # Validar que tenga al menos un inspector
        if not self.inspector and not self.inspector_externo:
            raise ValidationError({
                'inspector': 'Debe especificar un inspector (usuario o externo)'
            })

        # Validar que el checklist tenga la estructura correcta
        if self.checklist_items:
            for item in self.checklist_items:
                if not isinstance(item, dict) or 'item' not in item or 'cumple' not in item:
                    raise ValidationError({
                        'checklist_items': 'Cada item del checklist debe tener estructura: {item: "", cumple: bool, observacion: ""}'
                    })
