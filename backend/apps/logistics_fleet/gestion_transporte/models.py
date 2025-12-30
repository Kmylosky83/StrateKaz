"""
Modelos para Gestión de Transporte
Sistema de programación y ejecución de rutas, despachos y manifiestos
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from apps.core.base_models.base import BaseCompanyModel, OrderedModel
from decimal import Decimal


class TipoRuta(OrderedModel):
    """
    Catálogo de tipos de rutas
    Define la naturaleza de la ruta: recolección, entrega, transferencia
    """

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de ruta (ej: RECOLECCION, ENTREGA, TRANSFERENCIA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de ruta'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del tipo de ruta'
    )

    # Características del tipo de ruta
    es_recoleccion = models.BooleanField(
        default=False,
        verbose_name='Es recolección',
        help_text='Indica si es una ruta de recolección de materia prima'
    )
    es_entrega = models.BooleanField(
        default=False,
        verbose_name='Es entrega',
        help_text='Indica si es una ruta de entrega/distribución'
    )
    es_transferencia = models.BooleanField(
        default=False,
        verbose_name='Es transferencia',
        help_text='Indica si es una ruta de transferencia entre bodegas'
    )
    requiere_cadena_frio = models.BooleanField(
        default=False,
        verbose_name='Requiere cadena de frío',
        help_text='Indica si requiere vehículo refrigerado'
    )

    class Meta:
        verbose_name = 'Tipo de Ruta'
        verbose_name_plural = 'Tipos de Rutas'
        ordering = ['orden', 'nombre']
        db_table = 'transporte_tipo_ruta'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class EstadoDespacho(OrderedModel):
    """
    Catálogo de estados de despacho
    Define el flujo de estados por los que pasa un despacho
    """

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del estado (ej: PROGRAMADO, EN_TRANSITO, ENTREGADO)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del estado'
    )
    color = models.CharField(
        max_length=7,
        default='#6c757d',
        verbose_name='Color',
        help_text='Color hexadecimal para visualización (ej: #28a745)'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción del estado'
    )

    # Comportamiento del estado
    en_transito = models.BooleanField(
        default=False,
        verbose_name='En tránsito',
        help_text='Indica si el despacho está en movimiento'
    )
    es_final = models.BooleanField(
        default=False,
        verbose_name='Es estado final',
        help_text='Indica si es un estado terminal (completado/cancelado)'
    )
    permite_edicion = models.BooleanField(
        default=True,
        verbose_name='Permite edición',
        help_text='Indica si permite editar el despacho en este estado'
    )

    class Meta:
        verbose_name = 'Estado de Despacho'
        verbose_name_plural = 'Estados de Despacho'
        ordering = ['orden', 'nombre']
        db_table = 'transporte_estado_despacho'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Ruta(BaseCompanyModel):
    """
    Rutas predefinidas para transporte
    Define origen, destino, puntos intermedios y costos estimados
    """

    codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la ruta (ej: RUT-001)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la ruta'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción de la ruta y observaciones'
    )

    # Tipo de ruta
    tipo_ruta = models.ForeignKey(
        TipoRuta,
        on_delete=models.PROTECT,
        related_name='rutas',
        verbose_name='Tipo de ruta',
        help_text='Tipo de ruta (recolección, entrega, etc.)'
    )

    # Origen
    origen_nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre origen',
        help_text='Nombre del punto de origen'
    )
    origen_direccion = models.CharField(
        max_length=300,
        verbose_name='Dirección origen',
        help_text='Dirección completa del origen'
    )
    origen_ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad origen',
        help_text='Ciudad del origen'
    )

    # Destino
    destino_nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre destino',
        help_text='Nombre del punto de destino'
    )
    destino_direccion = models.CharField(
        max_length=300,
        verbose_name='Dirección destino',
        help_text='Dirección completa del destino'
    )
    destino_ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad destino',
        help_text='Ciudad del destino'
    )

    # Información de la ruta
    distancia_km = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Distancia (km)',
        help_text='Distancia total de la ruta en kilómetros'
    )
    tiempo_estimado_minutos = models.PositiveIntegerField(
        verbose_name='Tiempo estimado (minutos)',
        help_text='Tiempo estimado de recorrido en minutos'
    )

    # Costos
    costo_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Costo estimado',
        help_text='Costo estimado de la ruta (combustible, peajes, etc.)'
    )
    peajes_estimados = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Peajes estimados',
        help_text='Valor estimado de peajes'
    )

    # Puntos intermedios
    puntos_intermedios = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Puntos intermedios',
        help_text='Lista de puntos intermedios: [{nombre, direccion, orden}]'
    )

    class Meta:
        verbose_name = 'Ruta'
        verbose_name_plural = 'Rutas'
        ordering = ['-created_at']
        db_table = 'transporte_ruta'
        unique_together = [['empresa', 'codigo']]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Conductor(BaseCompanyModel):
    """
    Conductores de la empresa o terceros
    Registro completo de conductores con licencias y documentación
    """

    TIPO_DOCUMENTO_CHOICES = [
        ('CC', 'Cédula de Ciudadanía'),
        ('CE', 'Cédula de Extranjería'),
        ('PA', 'Pasaporte'),
    ]

    CATEGORIA_LICENCIA_CHOICES = [
        ('A1', 'A1 - Motocicletas'),
        ('A2', 'A2 - Motocicletas y triciclos'),
        ('B1', 'B1 - Automóviles'),
        ('B2', 'B2 - Camionetas y camperos'),
        ('B3', 'B3 - Camionetas con acoplado'),
        ('C1', 'C1 - Camiones rígidos'),
        ('C2', 'C2 - Camiones articulados'),
        ('C3', 'C3 - Vehículos articulados pesados'),
    ]

    # Relación opcional con usuario del sistema
    usuario = models.OneToOneField(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conductor_profile',
        verbose_name='Usuario',
        help_text='Usuario del sistema asociado (opcional)'
    )

    # Identificación
    nombre_completo = models.CharField(
        max_length=200,
        verbose_name='Nombre completo',
        help_text='Nombre completo del conductor'
    )
    tipo_documento = models.CharField(
        max_length=2,
        choices=TIPO_DOCUMENTO_CHOICES,
        default='CC',
        verbose_name='Tipo de documento',
        help_text='Tipo de documento de identidad'
    )
    documento_identidad = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Documento de identidad',
        help_text='Número de documento de identidad'
    )

    # Contacto
    telefono = models.CharField(
        max_length=20,
        verbose_name='Teléfono',
        help_text='Número de teléfono de contacto'
    )
    email = models.EmailField(
        blank=True,
        verbose_name='Email',
        help_text='Correo electrónico'
    )

    # Licencia de conducción
    licencia_conduccion = models.CharField(
        max_length=50,
        verbose_name='Licencia de conducción',
        help_text='Número de licencia de conducción'
    )
    categoria_licencia = models.CharField(
        max_length=2,
        choices=CATEGORIA_LICENCIA_CHOICES,
        verbose_name='Categoría licencia',
        help_text='Categoría de la licencia de conducción'
    )
    fecha_vencimiento_licencia = models.DateField(
        verbose_name='Vencimiento licencia',
        help_text='Fecha de vencimiento de la licencia'
    )

    # Fechas de vinculación
    fecha_ingreso = models.DateField(
        default=timezone.now,
        verbose_name='Fecha de ingreso',
        help_text='Fecha de ingreso del conductor'
    )
    fecha_retiro = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de retiro',
        help_text='Fecha de retiro del conductor (si aplica)'
    )

    # Tipo de conductor
    es_empleado = models.BooleanField(
        default=True,
        verbose_name='Es empleado',
        help_text='Indica si es empleado directo o conductor tercero'
    )
    empresa_transportadora = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Empresa transportadora',
        help_text='Nombre de la empresa transportadora (si es tercero)'
    )

    # Archivos
    foto_url = models.URLField(
        blank=True,
        verbose_name='URL foto',
        help_text='URL de la foto del conductor'
    )
    firma_url = models.URLField(
        blank=True,
        verbose_name='URL firma',
        help_text='URL de la firma digital del conductor'
    )

    class Meta:
        verbose_name = 'Conductor'
        verbose_name_plural = 'Conductores'
        ordering = ['nombre_completo']
        db_table = 'transporte_conductor'
        unique_together = [['empresa', 'documento_identidad']]
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['documento_identidad']),
        ]

    def __str__(self):
        return f"{self.documento_identidad} - {self.nombre_completo}"

    @property
    def licencia_vigente(self):
        """Verifica si la licencia está vigente"""
        if self.fecha_vencimiento_licencia:
            return self.fecha_vencimiento_licencia >= timezone.now().date()
        return False

    @property
    def esta_activo(self):
        """Verifica si el conductor está activo"""
        return self.is_active and not self.fecha_retiro


class ProgramacionRuta(BaseCompanyModel):
    """
    Programación de viajes/rutas
    Asigna vehículo y conductor a una ruta en una fecha específica
    """

    ESTADO_CHOICES = [
        ('PROGRAMADA', 'Programada'),
        ('EN_CURSO', 'En Curso'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único auto-generado: PR-YYYYMMDD-NNNN'
    )

    # Relaciones
    ruta = models.ForeignKey(
        Ruta,
        on_delete=models.PROTECT,
        related_name='programaciones',
        verbose_name='Ruta',
        help_text='Ruta a ejecutar'
    )
    vehiculo = models.ForeignKey(
        'gestion_flota.Vehiculo',
        on_delete=models.PROTECT,
        related_name='programaciones_ruta',
        verbose_name='Vehículo',
        help_text='Vehículo asignado a la ruta'
    )
    conductor = models.ForeignKey(
        Conductor,
        on_delete=models.PROTECT,
        related_name='programaciones',
        verbose_name='Conductor',
        help_text='Conductor asignado'
    )

    # Programación
    fecha_programada = models.DateField(
        verbose_name='Fecha programada',
        help_text='Fecha programada para el viaje'
    )
    hora_salida_programada = models.TimeField(
        verbose_name='Hora salida programada',
        help_text='Hora de salida programada'
    )
    hora_llegada_estimada = models.TimeField(
        verbose_name='Hora llegada estimada',
        help_text='Hora de llegada estimada'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PROGRAMADA',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado actual de la programación'
    )

    # Kilometraje
    km_inicial = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Km inicial',
        help_text='Kilometraje inicial del vehículo'
    )
    km_final = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Km final',
        help_text='Kilometraje final del vehículo'
    )
    km_recorridos = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False,
        verbose_name='Km recorridos',
        help_text='Kilómetros recorridos (calculado)'
    )

    # Ejecución real
    hora_salida_real = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Hora salida real',
        help_text='Hora real de salida'
    )
    hora_llegada_real = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Hora llegada real',
        help_text='Hora real de llegada'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones del viaje'
    )

    # Quién programó
    programado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='programaciones_rutas',
        verbose_name='Programado por',
        help_text='Usuario que programó el viaje'
    )

    class Meta:
        verbose_name = 'Programación de Ruta'
        verbose_name_plural = 'Programaciones de Rutas'
        ordering = ['-fecha_programada', '-hora_salida_programada']
        db_table = 'transporte_programacion_ruta'
        indexes = [
            models.Index(fields=['empresa', 'estado', 'fecha_programada']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.ruta.nombre} ({self.fecha_programada})"

    def save(self, *args, **kwargs):
        # Auto-generar código si no existe
        if not self.codigo:
            from django.utils import timezone
            fecha = self.fecha_programada or timezone.now().date()
            fecha_str = fecha.strftime('%Y%m%d')

            # Obtener último número del día
            ultimo = ProgramacionRuta.objects.filter(
                codigo__startswith=f'PR-{fecha_str}'
            ).order_by('-codigo').first()

            if ultimo:
                ultimo_num = int(ultimo.codigo.split('-')[-1])
                nuevo_num = ultimo_num + 1
            else:
                nuevo_num = 1

            self.codigo = f'PR-{fecha_str}-{nuevo_num:04d}'

        # Calcular km recorridos
        if self.km_inicial and self.km_final:
            self.km_recorridos = self.km_final - self.km_inicial

        super().save(*args, **kwargs)


class Despacho(BaseCompanyModel):
    """
    Despachos de mercancía
    Registro de despachos asociados a programaciones de ruta
    """

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único auto-generado: DESP-YYYYMMDD-NNNN'
    )

    # Relaciones
    programacion_ruta = models.ForeignKey(
        ProgramacionRuta,
        on_delete=models.PROTECT,
        related_name='despachos',
        verbose_name='Programación ruta',
        help_text='Programación de ruta asociada'
    )
    estado_despacho = models.ForeignKey(
        EstadoDespacho,
        on_delete=models.PROTECT,
        related_name='despachos',
        verbose_name='Estado',
        help_text='Estado actual del despacho'
    )

    # Cliente
    cliente_nombre = models.CharField(
        max_length=200,
        verbose_name='Cliente',
        help_text='Nombre del cliente'
    )
    cliente_direccion = models.CharField(
        max_length=300,
        verbose_name='Dirección cliente',
        help_text='Dirección de entrega'
    )
    cliente_telefono = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Teléfono cliente',
        help_text='Teléfono de contacto'
    )
    cliente_contacto = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Contacto cliente',
        help_text='Nombre de la persona de contacto'
    )

    # Información de carga
    peso_total_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Peso total (kg)',
        help_text='Peso total del despacho en kilogramos'
    )
    volumen_total_m3 = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.001'))],
        verbose_name='Volumen total (m³)',
        help_text='Volumen total del despacho en metros cúbicos'
    )
    valor_declarado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor declarado',
        help_text='Valor declarado de la mercancía'
    )

    # Cadena de frío
    requiere_cadena_frio = models.BooleanField(
        default=False,
        verbose_name='Requiere cadena de frío',
        help_text='Indica si requiere refrigeración'
    )
    temperatura_requerida = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Temperatura requerida',
        help_text='Rango de temperatura requerido (ej: -2°C a 4°C)'
    )

    # Observaciones
    observaciones_entrega = models.TextField(
        blank=True,
        verbose_name='Observaciones de entrega',
        help_text='Instrucciones especiales para la entrega'
    )

    # Fechas de entrega
    fecha_entrega_estimada = models.DateTimeField(
        verbose_name='Fecha entrega estimada',
        help_text='Fecha y hora estimada de entrega'
    )
    fecha_entrega_real = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha entrega real',
        help_text='Fecha y hora real de entrega'
    )

    # Recepción
    recibido_por = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Recibido por',
        help_text='Nombre de quien recibe'
    )
    documento_recibido = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Documento quien recibe',
        help_text='Documento de identidad de quien recibe'
    )
    firma_recibido_url = models.URLField(
        blank=True,
        verbose_name='URL firma recibido',
        help_text='URL de la firma digital de quien recibe'
    )

    # Novedades
    novedad = models.BooleanField(
        default=False,
        verbose_name='Tiene novedad',
        help_text='Indica si hubo alguna novedad en la entrega'
    )
    descripcion_novedad = models.TextField(
        blank=True,
        verbose_name='Descripción novedad',
        help_text='Descripción de la novedad'
    )

    class Meta:
        verbose_name = 'Despacho'
        verbose_name_plural = 'Despachos'
        ordering = ['-created_at']
        db_table = 'transporte_despacho'
        indexes = [
            models.Index(fields=['empresa', 'estado_despacho']),
            models.Index(fields=['codigo']),
            models.Index(fields=['fecha_entrega_estimada']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.cliente_nombre}"

    def save(self, *args, **kwargs):
        # Auto-generar código si no existe
        if not self.codigo:
            from django.utils import timezone
            fecha = timezone.now().date()
            fecha_str = fecha.strftime('%Y%m%d')

            # Obtener último número del día
            ultimo = Despacho.objects.filter(
                codigo__startswith=f'DESP-{fecha_str}'
            ).order_by('-codigo').first()

            if ultimo:
                ultimo_num = int(ultimo.codigo.split('-')[-1])
                nuevo_num = ultimo_num + 1
            else:
                nuevo_num = 1

            self.codigo = f'DESP-{fecha_str}-{nuevo_num:04d}'

        super().save(*args, **kwargs)


class DetalleDespacho(BaseCompanyModel):
    """
    Detalle de líneas de despacho
    Productos incluidos en cada despacho
    """

    despacho = models.ForeignKey(
        Despacho,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Despacho',
        help_text='Despacho al que pertenece esta línea'
    )

    # Producto (opcional si viene de stock)
    stock_producto = models.ForeignKey(
        'producto_terminado.StockProducto',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='detalles_despacho',
        verbose_name='Stock producto',
        help_text='Producto de stock asociado (opcional)'
    )

    # Descripción del producto
    descripcion_producto = models.CharField(
        max_length=300,
        verbose_name='Descripción producto',
        help_text='Descripción del producto'
    )
    codigo_producto = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Código producto',
        help_text='Código del producto'
    )

    # Cantidades
    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Cantidad',
        help_text='Cantidad del producto'
    )
    unidad_medida = models.CharField(
        max_length=50,
        default='kg',
        verbose_name='Unidad de medida',
        help_text='Unidad de medida (kg, unidad, caja, etc.)'
    )
    peso_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Peso (kg)',
        help_text='Peso en kilogramos'
    )

    # Trazabilidad
    lote_origen = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Lote origen',
        help_text='Lote de producción del producto'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones del detalle'
    )

    class Meta:
        verbose_name = 'Detalle de Despacho'
        verbose_name_plural = 'Detalles de Despacho'
        ordering = ['id']
        db_table = 'transporte_detalle_despacho'

    def __str__(self):
        return f"{self.despacho.codigo} - {self.descripcion_producto}"


class Manifiesto(BaseCompanyModel):
    """
    Manifiesto de carga - Documento RNDC
    Registro oficial del transporte de mercancía
    """

    numero_manifiesto = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Número manifiesto',
        help_text='Número de manifiesto (auto o manual)'
    )

    # Relación con programación
    programacion_ruta = models.ForeignKey(
        ProgramacionRuta,
        on_delete=models.PROTECT,
        related_name='manifiestos',
        verbose_name='Programación ruta',
        help_text='Programación de ruta asociada'
    )

    # Fecha
    fecha_expedicion = models.DateTimeField(
        default=timezone.now,
        verbose_name='Fecha expedición',
        help_text='Fecha de expedición del manifiesto'
    )

    # Remitente
    remitente_nombre = models.CharField(
        max_length=200,
        verbose_name='Remitente',
        help_text='Nombre del remitente'
    )
    remitente_nit = models.CharField(
        max_length=20,
        verbose_name='NIT remitente',
        help_text='NIT del remitente'
    )
    remitente_direccion = models.CharField(
        max_length=300,
        verbose_name='Dirección remitente',
        help_text='Dirección del remitente'
    )

    # Destinatario
    destinatario_nombre = models.CharField(
        max_length=200,
        verbose_name='Destinatario',
        help_text='Nombre del destinatario'
    )
    destinatario_nit = models.CharField(
        max_length=20,
        verbose_name='NIT destinatario',
        help_text='NIT del destinatario'
    )
    destinatario_direccion = models.CharField(
        max_length=300,
        verbose_name='Dirección destinatario',
        help_text='Dirección del destinatario'
    )

    # Origen y destino
    origen_ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad origen',
        help_text='Ciudad de origen'
    )
    destino_ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad destino',
        help_text='Ciudad de destino'
    )

    # Descripción de la carga
    descripcion_carga = models.TextField(
        verbose_name='Descripción carga',
        help_text='Descripción de la carga transportada'
    )
    peso_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Peso (kg)',
        help_text='Peso total en kilogramos'
    )
    unidades = models.PositiveIntegerField(
        default=1,
        verbose_name='Unidades',
        help_text='Número de unidades/paquetes'
    )

    # Valores
    valor_flete = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor flete',
        help_text='Valor del flete'
    )
    valor_declarado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Valor declarado',
        help_text='Valor declarado de la mercancía'
    )

    # Información del vehículo
    vehiculo_placa = models.CharField(
        max_length=10,
        verbose_name='Placa vehículo',
        help_text='Placa del vehículo'
    )
    vehiculo_tipo = models.CharField(
        max_length=100,
        verbose_name='Tipo vehículo',
        help_text='Tipo de vehículo'
    )

    # Información del conductor
    conductor_nombre = models.CharField(
        max_length=200,
        verbose_name='Conductor',
        help_text='Nombre del conductor'
    )
    conductor_documento = models.CharField(
        max_length=20,
        verbose_name='Documento conductor',
        help_text='Documento del conductor'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones del manifiesto'
    )

    # PDF del manifiesto
    pdf_url = models.URLField(
        blank=True,
        verbose_name='URL PDF',
        help_text='URL del PDF del manifiesto'
    )

    # Generado por
    generado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='manifiestos_generados',
        verbose_name='Generado por',
        help_text='Usuario que generó el manifiesto'
    )

    class Meta:
        verbose_name = 'Manifiesto'
        verbose_name_plural = 'Manifiestos'
        ordering = ['-fecha_expedicion']
        db_table = 'transporte_manifiesto'
        indexes = [
            models.Index(fields=['empresa', 'fecha_expedicion']),
            models.Index(fields=['numero_manifiesto']),
        ]

    def __str__(self):
        return f"{self.numero_manifiesto} - {self.remitente_nombre} → {self.destinatario_nombre}"

    def save(self, *args, **kwargs):
        # Auto-generar número si no existe
        if not self.numero_manifiesto:
            from django.utils import timezone
            fecha = timezone.now()
            fecha_str = fecha.strftime('%Y%m%d')

            # Obtener último número del día
            ultimo = Manifiesto.objects.filter(
                numero_manifiesto__startswith=f'MAN-{fecha_str}'
            ).order_by('-numero_manifiesto').first()

            if ultimo:
                ultimo_num = int(ultimo.numero_manifiesto.split('-')[-1])
                nuevo_num = ultimo_num + 1
            else:
                nuevo_num = 1

            self.numero_manifiesto = f'MAN-{fecha_str}-{nuevo_num:04d}'

        super().save(*args, **kwargs)
