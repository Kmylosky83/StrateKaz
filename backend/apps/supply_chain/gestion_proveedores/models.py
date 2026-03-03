"""
Modelos para Gestión de Proveedores - Supply Chain
Sistema de Gestión StrateKaz

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError


# ==============================================================================
# MODELOS DE CATÁLOGO DINÁMICO
# ==============================================================================

class CategoriaMateriaPrima(models.Model):
    """
    Categoría principal de materia prima (dinámico).
    Ejemplos: HUESO, SEBO_CRUDO, SEBO_PROCESADO, OTROS
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la categoría (ej: HUESO, SEBO_CRUDO)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre de la categoría'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_categoria_materia_prima'
        verbose_name = 'Categoría de Materia Prima'
        verbose_name_plural = 'Categorías de Materia Prima'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class TipoMateriaPrima(models.Model):
    """
    Tipo específico de materia prima (dinámico).
    Ejemplos: HUESO_CRUDO, SEBO_PROCESADO_A, ACU
    """
    categoria = models.ForeignKey(
        CategoriaMateriaPrima,
        on_delete=models.PROTECT,
        related_name='tipos',
        verbose_name='Categoría'
    )
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo (ej: HUESO_CRUDO, SEBO_PROCESADO_A)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre del tipo de materia prima'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    # Para sebo procesado: rangos de acidez
    acidez_min = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Acidez mínima (%)',
        help_text='Límite inferior de acidez (solo para sebo procesado)'
    )
    acidez_max = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Acidez máxima (%)',
        help_text='Límite superior de acidez (solo para sebo procesado)'
    )
    # Código legacy para compatibilidad
    codigo_legacy = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Código legacy',
        help_text='Código anterior para migración de datos'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_tipo_materia_prima'
        verbose_name = 'Tipo de Materia Prima'
        verbose_name_plural = 'Tipos de Materia Prima'
        ordering = ['categoria__orden', 'orden', 'nombre']

    def __str__(self):
        return f"{self.categoria.nombre} - {self.nombre}"

    @classmethod
    def obtener_por_acidez(cls, valor_acidez):
        """
        Obtiene el tipo de sebo procesado según valor de acidez.
        """
        return cls.objects.filter(
            acidez_min__lte=valor_acidez,
            acidez_max__gte=valor_acidez,
            is_active=True
        ).first()


class TipoProveedor(models.Model):
    """
    Tipo de proveedor (dinámico).
    Ejemplos: MATERIA_PRIMA_EXTERNO, UNIDAD_NEGOCIO, PRODUCTO_SERVICIO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    requiere_materia_prima = models.BooleanField(
        default=False,
        verbose_name='Requiere tipo materia prima',
        help_text='Indica si este tipo de proveedor debe especificar materias primas'
    )
    requiere_modalidad_logistica = models.BooleanField(
        default=False,
        verbose_name='Requiere modalidad logística'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_tipo_proveedor'
        verbose_name = 'Tipo de Proveedor'
        verbose_name_plural = 'Tipos de Proveedor'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class ModalidadLogistica(models.Model):
    """
    Modalidad logística (dinámico).
    Ejemplos: ENTREGA_PLANTA, COMPRA_EN_PUNTO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_modalidad_logistica'
        verbose_name = 'Modalidad Logística'
        verbose_name_plural = 'Modalidades Logísticas'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class FormaPago(models.Model):
    """
    Forma de pago (dinámico).
    Ejemplos: CONTADO, CHEQUE, TRANSFERENCIA, CREDITO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_forma_pago'
        verbose_name = 'Forma de Pago'
        verbose_name_plural = 'Formas de Pago'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class TipoCuentaBancaria(models.Model):
    """
    Tipo de cuenta bancaria (dinámico).
    Ejemplos: AHORROS, CORRIENTE
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_tipo_cuenta_bancaria'
        verbose_name = 'Tipo de Cuenta Bancaria'
        verbose_name_plural = 'Tipos de Cuenta Bancaria'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class TipoDocumentoIdentidad(models.Model):
    """
    Tipo de documento de identidad (dinámico).
    Ejemplos: CC, CE, NIT, PASSPORT
    """
    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_tipo_documento_identidad'
        verbose_name = 'Tipo de Documento de Identidad'
        verbose_name_plural = 'Tipos de Documento de Identidad'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Departamento(models.Model):
    """
    Departamentos de Colombia (dinámico).
    Catálogo de departamentos para geolocalización.
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código del departamento (ej: ANTIOQUIA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    codigo_dane = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name='Código DANE'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_departamento'
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class Ciudad(models.Model):
    """
    Ciudades de Colombia (dinámico).
    """
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.PROTECT,
        related_name='ciudades',
        verbose_name='Departamento'
    )
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    codigo_dane = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name='Código DANE'
    )
    es_capital = models.BooleanField(default=False)
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_ciudad'
        verbose_name = 'Ciudad'
        verbose_name_plural = 'Ciudades'
        ordering = ['departamento__nombre', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.departamento.nombre})"


# ==============================================================================
# MODELOS PRINCIPALES
# ==============================================================================

class UnidadNegocio(models.Model):
    """
    Unidad de Negocio - Unidades internas de la organización.
    Ejemplos: Plantas de producción, Sucursales, Sedes administrativas
    """
    TIPO_UNIDAD_CHOICES = [
        ('SEDE', 'Sede Administrativa'),
        ('SUCURSAL', 'Sucursal'),
        ('PLANTA', 'Planta de Producción'),
        ('CENTRO_ACOPIO', 'Centro de Acopio'),
        ('ALMACEN', 'Almacén'),
        ('OTRO', 'Otro'),
    ]

    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la unidad de negocio (ej: PLANTA_BOG_01)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre'
    )
    tipo_unidad = models.CharField(
        max_length=20,
        choices=TIPO_UNIDAD_CHOICES,
        verbose_name='Tipo de unidad'
    )
    direccion = models.TextField(
        verbose_name='Dirección'
    )
    ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad'
    )
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='unidades_negocio',
        verbose_name='Departamento',
        help_text='Departamento de Colombia (desde catálogo dinámico)'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='sc_unidades_negocio_responsable',
        null=True,
        blank=True,
        verbose_name='Responsable'
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_chain_unidad_negocio'
        verbose_name = 'Unidad de Negocio'
        verbose_name_plural = 'Unidades de Negocio'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active', 'tipo_unidad']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])


class Proveedor(models.Model):
    """
    Proveedor - Modelo principal 100% dinámico.
    """
    # Código interno autogenerado
    codigo_interno = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código interno'
    )

    # Tipo de proveedor (dinámico)
    tipo_proveedor = models.ForeignKey(
        TipoProveedor,
        on_delete=models.PROTECT,
        related_name='proveedores',
        verbose_name='Tipo de proveedor'
    )

    # Tipos de materia prima que maneja (M2M dinámico)
    tipos_materia_prima = models.ManyToManyField(
        TipoMateriaPrima,
        blank=True,
        related_name='proveedores',
        verbose_name='Tipos de materia prima'
    )

    # Modalidad logística (dinámico)
    modalidad_logistica = models.ForeignKey(
        ModalidadLogistica,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='proveedores',
        verbose_name='Modalidad logística'
    )

    # Información básica
    nombre_comercial = models.CharField(
        max_length=200,
        db_index=True,
        verbose_name='Nombre comercial'
    )
    razon_social = models.CharField(
        max_length=200,
        verbose_name='Razón social'
    )
    tipo_documento = models.ForeignKey(
        TipoDocumentoIdentidad,
        on_delete=models.PROTECT,
        related_name='proveedores',
        verbose_name='Tipo de documento'
    )
    numero_documento = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Número de documento'
    )
    nit = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='NIT'
    )

    # Contacto
    telefono = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    direccion = models.TextField(verbose_name='Dirección')
    ciudad = models.CharField(max_length=100)
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='proveedores',
        verbose_name='Departamento'
    )

    # Relación con Unidad de Negocio
    unidad_negocio = models.ForeignKey(
        UnidadNegocio,
        on_delete=models.PROTECT,
        related_name='proveedores',
        null=True,
        blank=True,
        verbose_name='Unidad de negocio'
    )

    # Información financiera (M2M dinámico)
    formas_pago = models.ManyToManyField(
        FormaPago,
        blank=True,
        related_name='proveedores',
        verbose_name='Formas de pago'
    )
    dias_plazo_pago = models.IntegerField(null=True, blank=True)

    # Información bancaria
    banco = models.CharField(max_length=100, null=True, blank=True)
    tipo_cuenta = models.ForeignKey(
        TipoCuentaBancaria,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='proveedores',
        verbose_name='Tipo de cuenta'
    )
    numero_cuenta = models.CharField(max_length=30, null=True, blank=True)
    titular_cuenta = models.CharField(max_length=200, null=True, blank=True)

    # Metadatos
    observaciones = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='sc_proveedores_creados',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_chain_proveedor'
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['nombre_comercial']
        indexes = [
            models.Index(fields=['tipo_proveedor', 'is_active']),
            models.Index(fields=['numero_documento']),
            models.Index(fields=['nombre_comercial']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.nombre_comercial} ({self.tipo_proveedor.nombre})"

    # Mapeo de código TipoProveedor → código ConsecutivoConfig
    CONSECUTIVO_POR_TIPO = {
        'MATERIA_PRIMA': 'PROVEEDOR_MP',
        'PRODUCTOS_SERVICIOS': 'PROVEEDOR_PS',
        'UNIDAD_NEGOCIO': 'PROVEEDOR_UN',
        'TRANSPORTISTA': 'PROVEEDOR_TR',
        'CONSULTOR': 'PROVEEDOR_CO',
        'CONTRATISTA': 'PROVEEDOR_CT',
    }

    PREFIJO_POR_TIPO = {
        'MATERIA_PRIMA': 'MP',
        'PRODUCTOS_SERVICIOS': 'PS',
        'UNIDAD_NEGOCIO': 'UN',
        'TRANSPORTISTA': 'TR',
        'CONSULTOR': 'CO',
        'CONTRATISTA': 'CT',
    }

    @staticmethod
    def generar_codigo_interno(tipo_proveedor):
        """Genera código interno usando consecutivo específico por tipo de proveedor."""
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

        tipo_codigo = tipo_proveedor.codigo if tipo_proveedor else ''
        consecutivo_code = Proveedor.CONSECUTIVO_POR_TIPO.get(tipo_codigo, 'PROVEEDOR_PS')
        prefijo_fallback = Proveedor.PREFIJO_POR_TIPO.get(tipo_codigo, 'PROV')

        try:
            return ConsecutivoConfig.obtener_siguiente_consecutivo(consecutivo_code)
        except ConsecutivoConfig.DoesNotExist:
            # Fallback manual con prefijo del tipo
            ultimo = Proveedor.objects.filter(
                codigo_interno__startswith=f'{prefijo_fallback}-'
            ).order_by('-codigo_interno').first()

            if ultimo and ultimo.codigo_interno:
                try:
                    numero = int(ultimo.codigo_interno.split('-')[1]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1

            return f'{prefijo_fallback}-{numero:05d}'

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    @property
    def es_proveedor_materia_prima(self):
        return self.tipo_proveedor.requiere_materia_prima

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo_interno:
            self.codigo_interno = self.generar_codigo_interno(self.tipo_proveedor)
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()

        # Validaciones dinámicas según tipo de proveedor
        if self.tipo_proveedor:
            if self.tipo_proveedor.requiere_modalidad_logistica and not self.modalidad_logistica:
                raise ValidationError({
                    'modalidad_logistica': 'Este tipo de proveedor requiere modalidad logística'
                })


class PrecioMateriaPrima(models.Model):
    """
    Precio por Tipo de Materia Prima (dinámico).
    """
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='precios_materia_prima',
        verbose_name='Proveedor'
    )
    tipo_materia = models.ForeignKey(
        TipoMateriaPrima,
        on_delete=models.PROTECT,
        related_name='precios',
        verbose_name='Tipo de materia prima'
    )
    precio_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio por kg'
    )
    modificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='sc_precios_materia_modificados',
        verbose_name='Modificado por'
    )
    modificado_fecha = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_precio_materia_prima'
        verbose_name = 'Precio de Materia Prima'
        verbose_name_plural = 'Precios de Materias Primas'
        ordering = ['proveedor', 'tipo_materia']
        unique_together = [['proveedor', 'tipo_materia']]
        indexes = [
            models.Index(fields=['proveedor', 'tipo_materia']),
            models.Index(fields=['tipo_materia']),
        ]

    def __str__(self):
        return f"{self.proveedor.nombre_comercial} - {self.tipo_materia.nombre}: ${self.precio_kg}/kg"

    def clean(self):
        super().clean()
        if self.precio_kg is not None and self.precio_kg < 0:
            raise ValidationError({'precio_kg': 'El precio no puede ser negativo'})


class HistorialPrecioProveedor(models.Model):
    """
    Historial de Precios de Proveedores (auditoría).
    """
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='historial_precios',
        verbose_name='Proveedor'
    )
    tipo_materia = models.ForeignKey(
        TipoMateriaPrima,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='historial_precios',
        verbose_name='Tipo de materia prima'
    )
    precio_anterior = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio anterior'
    )
    precio_nuevo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio nuevo'
    )
    modificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='sc_historiales_precio_proveedor',
        verbose_name='Modificado por'
    )
    motivo = models.TextField(verbose_name='Motivo del cambio')
    fecha_modificacion = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'supply_chain_historial_precio'
        verbose_name = 'Historial de Precio'
        verbose_name_plural = 'Historiales de Precios'
        ordering = ['-fecha_modificacion']
        indexes = [
            models.Index(fields=['proveedor', '-fecha_modificacion']),
            models.Index(fields=['modificado_por']),
        ]

    def __str__(self):
        tipo_nombre = self.tipo_materia.nombre if self.tipo_materia else 'N/A'
        return f"{self.proveedor.nombre_comercial} - {tipo_nombre}: {self.precio_anterior} -> {self.precio_nuevo}"

    @property
    def variacion_precio(self):
        if self.precio_anterior is None or self.precio_anterior == 0:
            return None
        variacion = ((self.precio_nuevo - self.precio_anterior) / self.precio_anterior) * 100
        return round(variacion, 2)

    @property
    def tipo_cambio(self):
        if self.precio_anterior is None:
            return 'INICIAL'
        elif self.precio_nuevo > self.precio_anterior:
            return 'AUMENTO'
        elif self.precio_nuevo < self.precio_anterior:
            return 'REDUCCION'
        else:
            return 'SIN_CAMBIO'


class CondicionComercialProveedor(models.Model):
    """
    Condiciones Comerciales de Proveedores.
    """
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='condiciones_comerciales',
        verbose_name='Proveedor'
    )
    descripcion = models.CharField(max_length=200, verbose_name='Descripción')
    valor_acordado = models.TextField(verbose_name='Valor acordado')
    forma_pago = models.CharField(max_length=100, null=True, blank=True)
    plazo_entrega = models.CharField(max_length=100, null=True, blank=True)
    garantias = models.TextField(null=True, blank=True)
    vigencia_desde = models.DateField(verbose_name='Vigencia desde')
    vigencia_hasta = models.DateField(null=True, blank=True, verbose_name='Vigencia hasta')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='sc_condiciones_comerciales_creadas',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_condicion_comercial'
        verbose_name = 'Condición Comercial'
        verbose_name_plural = 'Condiciones Comerciales'
        ordering = ['-vigencia_desde']
        indexes = [
            models.Index(fields=['proveedor', '-vigencia_desde']),
            models.Index(fields=['vigencia_desde', 'vigencia_hasta']),
        ]

    def __str__(self):
        return f"{self.proveedor.nombre_comercial} - {self.descripcion}"

    @property
    def esta_vigente(self):
        from datetime import date
        hoy = date.today()
        if self.vigencia_hasta is None:
            return hoy >= self.vigencia_desde
        return self.vigencia_desde <= hoy <= self.vigencia_hasta


def prueba_acidez_upload_path(instance, filename):
    import os
    from datetime import date
    ext = filename.split('.')[-1]
    today = date.today()
    new_filename = f"foto_{today.strftime('%Y%m%d')}_{instance.proveedor_id or 'temp'}.{ext}"
    return os.path.join('pruebas_acidez', str(today.year), str(today.month).zfill(2), new_filename)


class PruebaAcidez(models.Model):
    """
    Prueba de Acidez - Para determinar calidad del sebo procesado.
    """
    CALIDAD_SEBO_CHOICES = [
        ('A', 'Calidad A (Acidez < 3%)'),
        ('B', 'Calidad B (Acidez 3-5%)'),
        ('B1', 'Calidad B1 (Acidez 5-8%)'),
        ('B2', 'Calidad B2 (Acidez 8-12%)'),
        ('B4', 'Calidad B4 (Acidez 12-15%)'),
        ('C', 'Calidad C (Acidez > 15%)'),
    ]

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='pruebas_acidez',
        verbose_name='Proveedor'
    )
    fecha_prueba = models.DateTimeField(verbose_name='Fecha de prueba')
    valor_acidez = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Valor de acidez (%)'
    )
    calidad_resultante = models.CharField(
        max_length=2,
        choices=CALIDAD_SEBO_CHOICES,
        verbose_name='Calidad resultante'
    )
    # Referencia dinámica al tipo de materia prima resultante
    tipo_materia_resultante = models.ForeignKey(
        TipoMateriaPrima,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='pruebas_acidez',
        verbose_name='Tipo materia resultante'
    )
    foto_prueba = models.ImageField(
        upload_to=prueba_acidez_upload_path,
        verbose_name='Foto de la prueba'
    )
    cantidad_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Cantidad (kg)'
    )
    precio_kg_aplicado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio por kg aplicado'
    )
    valor_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Valor total'
    )
    observaciones = models.TextField(blank=True, null=True)
    lote_numero = models.CharField(max_length=50, blank=True, null=True)
    codigo_voucher = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Código de voucher'
    )
    realizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='sc_pruebas_acidez_realizadas',
        verbose_name='Realizado por'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_chain_prueba_acidez'
        verbose_name = 'Prueba de Acidez'
        verbose_name_plural = 'Pruebas de Acidez'
        ordering = ['-fecha_prueba', '-created_at']
        indexes = [
            models.Index(fields=['proveedor', '-fecha_prueba']),
            models.Index(fields=['calidad_resultante', '-fecha_prueba']),
            models.Index(fields=['codigo_voucher']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"Prueba {self.codigo_voucher} - {self.proveedor.nombre_comercial}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def determinar_calidad_y_tipo(self):
        """
        Determina la calidad y tipo de materia prima según acidez.
        Usa el catálogo dinámico TipoMateriaPrima.
        """
        tipo = TipoMateriaPrima.obtener_por_acidez(self.valor_acidez)
        if tipo:
            # Mapear a calidad basada en el código
            calidad_map = {
                'SEBO_PROCESADO_A': 'A',
                'SEBO_PROCESADO_B': 'B',
                'SEBO_PROCESADO_B1': 'B1',
                'SEBO_PROCESADO_B2': 'B2',
                'SEBO_PROCESADO_B4': 'B4',
                'SEBO_PROCESADO_C': 'C',
            }
            calidad = calidad_map.get(tipo.codigo, 'C')
            return calidad, tipo
        return 'C', None

    @classmethod
    def generar_codigo_voucher(cls):
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        try:
            return ConsecutivoConfig.obtener_siguiente_consecutivo('PRUEBA_ACIDEZ')
        except ConsecutivoConfig.DoesNotExist:
            from datetime import date
            hoy = date.today()
            prefijo = f"ACID-{hoy.strftime('%Y%m%d')}-"
            ultimo = cls.objects.filter(
                codigo_voucher__startswith=prefijo
            ).order_by('-codigo_voucher').first()
            if ultimo:
                try:
                    numero = int(ultimo.codigo_voucher.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1
            return f"{prefijo}{numero:04d}"

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def save(self, *args, **kwargs):
        # Determinar calidad y tipo automáticamente
        if self.valor_acidez is not None:
            calidad, tipo = self.determinar_calidad_y_tipo()
            self.calidad_resultante = calidad
            self.tipo_materia_resultante = tipo

        # Generar código de voucher
        if not self.codigo_voucher:
            self.codigo_voucher = self.generar_codigo_voucher()

        # Calcular valor total
        if self.cantidad_kg and self.precio_kg_aplicado:
            from decimal import Decimal
            self.valor_total = Decimal(str(self.cantidad_kg)) * Decimal(str(self.precio_kg_aplicado))

        super().save(*args, **kwargs)


# ==============================================================================
# MODELO DE SELECCIÓN Y EVALUACIÓN DE PROVEEDORES
# ==============================================================================

class CriterioEvaluacion(models.Model):
    """
    Criterio de evaluación de proveedores (dinámico).
    """
    codigo = models.CharField(max_length=50, unique=True, db_index=True)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    peso = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.0,
        verbose_name='Peso del criterio'
    )
    aplica_a_tipo = models.ManyToManyField(
        TipoProveedor,
        blank=True,
        related_name='criterios_evaluacion',
        help_text='Tipos de proveedor a los que aplica este criterio'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_criterio_evaluacion'
        verbose_name = 'Criterio de Evaluación'
        verbose_name_plural = 'Criterios de Evaluación'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class EvaluacionProveedor(models.Model):
    """
    Evaluación periódica de proveedores.
    """
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADA', 'Completada'),
        ('APROBADA', 'Aprobada'),
    ]

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='evaluaciones',
        verbose_name='Proveedor'
    )
    periodo = models.CharField(
        max_length=20,
        verbose_name='Período',
        help_text='Ej: 2025-Q1, 2025-S1'
    )
    fecha_evaluacion = models.DateField(verbose_name='Fecha de evaluación')
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR'
    )
    calificacion_total = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Calificación total'
    )
    observaciones = models.TextField(blank=True, null=True)
    evaluado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='evaluaciones_proveedores',
        verbose_name='Evaluado por'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='evaluaciones_aprobadas',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_evaluacion_proveedor'
        verbose_name = 'Evaluación de Proveedor'
        verbose_name_plural = 'Evaluaciones de Proveedores'
        ordering = ['-fecha_evaluacion']
        unique_together = [['proveedor', 'periodo']]

    def __str__(self):
        return f"{self.proveedor.nombre_comercial} - {self.periodo}"

    def calcular_calificacion(self):
        """Calcula la calificación total basada en los detalles."""
        detalles = self.detalles.all()
        if not detalles:
            return None

        suma_ponderada = sum(d.calificacion * d.criterio.peso for d in detalles)
        suma_pesos = sum(d.criterio.peso for d in detalles)

        if suma_pesos > 0:
            self.calificacion_total = suma_ponderada / suma_pesos
            return self.calificacion_total
        return None


class DetalleEvaluacion(models.Model):
    """
    Detalle de evaluación por criterio.
    """
    evaluacion = models.ForeignKey(
        EvaluacionProveedor,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Evaluación'
    )
    criterio = models.ForeignKey(
        CriterioEvaluacion,
        on_delete=models.PROTECT,
        related_name='detalles_evaluacion',
        verbose_name='Criterio'
    )
    calificacion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Calificación',
        help_text='Valor de 0 a 100'
    )
    observaciones = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_detalle_evaluacion'
        verbose_name = 'Detalle de Evaluación'
        verbose_name_plural = 'Detalles de Evaluación'
        unique_together = [['evaluacion', 'criterio']]

    def __str__(self):
        return f"{self.evaluacion} - {self.criterio.nombre}: {self.calificacion}"

    def clean(self):
        super().clean()
        if self.calificacion is not None:
            if self.calificacion < 0 or self.calificacion > 100:
                raise ValidationError({
                    'calificacion': 'La calificación debe estar entre 0 y 100'
                })
