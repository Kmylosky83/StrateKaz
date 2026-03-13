"""
Modelos para Gestión de Proveedores - Supply Chain
Sistema de Gestión StrateKaz

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.
"""
from django.db import models
from django.db.models import Q
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError

# Datos Maestros Compartidos — importados de Core (C0)
from apps.core.models import TipoDocumentoIdentidad, Departamento, Ciudad


# Stub para compatibilidad con migración 0001_initial (modelo movido a production_ops)
def prueba_acidez_upload_path(instance, filename):
    return f'pruebas_acidez/{filename}'


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


# TipoDocumentoIdentidad, Departamento, Ciudad → Movidos a Core (C0)
# Se importan al inicio del archivo desde apps.core.models

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
        max_length=50,
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
        max_length=50,
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
    direccion = models.TextField(blank=True, default='', verbose_name='Dirección')
    ciudad = models.CharField(max_length=100, blank=True, default='')
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

    # Consultor independiente vs firma consultora
    es_independiente = models.BooleanField(
        default=False,
        verbose_name='Es independiente',
        help_text='True = consultor/contratista independiente (persona natural). '
                  'False = firma consultora/contratista con equipo.',
    )

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
        constraints = [
            models.UniqueConstraint(
                fields=['numero_documento'],
                condition=Q(deleted_at__isnull=True),
                name='unique_numero_documento_activo',
            ),
            models.UniqueConstraint(
                fields=['codigo_interno'],
                condition=Q(deleted_at__isnull=True),
                name='unique_codigo_interno_activo',
            ),
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
            # Fallback manual con prefijo del tipo (excluir soft-deleted)
            ultimo = Proveedor.objects.filter(
                codigo_interno__startswith=f'{prefijo_fallback}-',
                deleted_at__isnull=True,
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
        """Soft delete: marca como eliminado y libera campos únicos."""
        self.deleted_at = timezone.now()
        self.is_active = False
        # Manglar campos únicos para liberar valores y permitir recreación
        if not self.numero_documento.startswith('DEL-'):
            self.numero_documento = f'DEL-{self.id}-{self.numero_documento}'
        if not self.codigo_interno.startswith('DEL-'):
            self.codigo_interno = f'DEL-{self.id}-{self.codigo_interno}'
        self.save(update_fields=[
            'deleted_at', 'is_active', 'numero_documento', 'codigo_interno', 'updated_at',
        ])
        # Desactivar todos los usuarios vinculados a este proveedor
        self.usuarios_vinculados.filter(is_active=True).update(is_active=False)

    def restore(self):
        self.deleted_at = None
        self.is_active = True
        # Restaurar campos únicos originales (quitar prefijo DEL-{id}-)
        prefix = f'DEL-{self.id}-'
        if self.numero_documento.startswith(prefix):
            self.numero_documento = self.numero_documento[len(prefix):]
        if self.codigo_interno.startswith(prefix):
            self.codigo_interno = self.codigo_interno[len(prefix):]
        self.save(update_fields=[
            'deleted_at', 'is_active', 'numero_documento', 'codigo_interno', 'updated_at',
        ])

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


# PruebaAcidez → Movido a production_ops.recepcion (control de calidad en recepción)

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
