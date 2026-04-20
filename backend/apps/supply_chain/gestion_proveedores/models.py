"""
Modelos para Gestión de Proveedores - Supply Chain
Sistema de Gestión StrateKaz

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.
"""
from django.db import models
from django.db.models import F, Q
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError

from utils.models import TenantModel, TimeStampedModel

# Datos Maestros Compartidos — importados de Core (C0)
from apps.core.models import TipoDocumentoIdentidad, Departamento, Ciudad


# Stub para compatibilidad con migración 0001_initial (modelo movido a production_ops)
def prueba_acidez_upload_path(instance, filename):
    return f'pruebas_acidez/{filename}'


# ==============================================================================
# MODELOS DE CATÁLOGO DINÁMICO
# ==============================================================================

# CategoriaMateriaPrima y TipoMateriaPrima eliminados post-S7 (2026-04-19).
# El catalogo unico de productos/categorias vive en catalogo_productos (CT-layer).
# Proveedor.productos_suministrados M2M reemplaza Proveedor.tipos_materia_prima.
# Data migrada en gestion_proveedores.0003_migrar_tipos_materia_prima_a_productos.


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

# UnidadNegocio → Migrado a Fundación (apps.gestion_estrategica.configuracion.models)
# Endpoint: /api/fundacion/configuracion/unidades-negocio/


class Proveedor(TenantModel):
    """
    Proveedor — Modelo principal 100% dinámico.

    Dos dimensiones de clasificación:
      - tipo_entidad (TextChoices): rol semántico en el sistema
      - tipo_proveedor (FK dinámica): clasificación operativa del tenant
    """

    class TipoEntidad(models.TextChoices):
        MATERIA_PRIMA = 'materia_prima', 'Proveedor de Materia Prima'
        SERVICIO = 'servicio', 'Proveedor de Servicios'
        UNIDAD_INTERNA = 'unidad_interna', 'Unidad Interna'

    tipo_entidad = models.CharField(
        max_length=20,
        choices=TipoEntidad.choices,
        default=TipoEntidad.MATERIA_PRIMA,
        verbose_name='Tipo de entidad',
        help_text=(
            'Rol semántico en el sistema. '
            'Materia prima: proveedor de insumos. '
            'Servicio: proveedor de productos/servicios. '
            'Unidad interna: puede ser proveedor Y cliente.'
        ),
        db_index=True,
    )

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

    # Productos que suministra — source-of-truth en catalogo_productos (CT)
    productos_suministrados = models.ManyToManyField(
        'catalogo_productos.Producto',
        blank=True,
        related_name='proveedores',
        verbose_name='Productos que suministra',
        help_text='Productos del catálogo maestro que el proveedor suministra',
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

    # Cross-module: UnidadNegocio vive en Fundación (configuracion)
    unidad_negocio_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        db_column='unidad_negocio_id',
        verbose_name='Unidad de negocio (ID)'
    )
    unidad_negocio_nombre = models.CharField(
        max_length=150,
        blank=True,
        default='',
        verbose_name='Unidad de negocio (nombre cache)'
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

    # Vínculo con Parte Interesada (C1 — Fundación)
    parte_interesada_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Parte Interesada',
        help_text='ID de la Parte Interesada vinculada (gestion_estrategica.ParteInteresada)'
    )
    parte_interesada_nombre = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nombre Parte Interesada',
        help_text='Cache: nombre de la parte interesada vinculada'
    )

    # Metadatos
    observaciones = models.TextField(null=True, blank=True)
    # is_active: semántica de negocio (proveedor comercialmente activo),
    # independiente del soft-delete de TenantModel.
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = 'supply_chain_proveedor'
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['nombre_comercial']
        indexes = [
            models.Index(fields=['tipo_proveedor', 'is_active']),
            models.Index(fields=['numero_documento']),
            models.Index(fields=['nombre_comercial']),
            models.Index(fields=['tipo_entidad']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['numero_documento'],
                condition=Q(is_deleted=False),
                name='unique_numero_documento_activo',
            ),
            models.UniqueConstraint(
                fields=['codigo_interno'],
                condition=Q(is_deleted=False),
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
            # Fallback manual con prefijo del tipo. El manager de TenantModel
            # ya excluye is_deleted=True por defecto.
            ultimo = Proveedor.objects.filter(
                codigo_interno__startswith=f'{prefijo_fallback}-',
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
    def es_proveedor_materia_prima(self):
        return self.tipo_proveedor.requiere_materia_prima

    def delete(self, using=None, keep_parents=False, user=None):
        """
        Override de TenantModel.delete() para preservar efectos laterales
        de negocio del soft-delete original:
          1. Marca el proveedor como comercialmente inactivo (is_active=False)
          2. Desactiva todos los usuarios vinculados (seguridad: usuarios de
             proveedor borrado no pueden seguir autenticándose).
             User.proveedor_id_ext es IntegerField (no FK — ver SOURCE_OF_TRUTH.md),
             por eso filtramos manualmente en vez de usar reverse relation.

        El mangling de prefijo 'DEL-' del código legacy se eliminó:
        UniqueConstraint condicional con Q(is_deleted=False) cumple la misma
        función sin tocar los datos.
        """
        from django.contrib.auth import get_user_model

        self.is_active = False
        self.save(update_fields=['is_active'])
        User = get_user_model()
        User.objects.filter(
            proveedor_id_ext=self.pk, is_active=True,
        ).update(is_active=False)
        super().delete(using=using, keep_parents=keep_parents, user=user)

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


class PrecioMateriaPrima(TenantModel):
    """
    Precio vigente por Proveedor × (Materia Prima legacy / Producto catálogo).

    Coexistencia (D3): el registro puede apuntar a TipoMateriaPrima (legado)
    y/o a Producto del catálogo maestro. Al menos uno debe estar presente.
    Los cambios históricos se registran en HistorialPrecioProveedor.
    """
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='precios_materia_prima',
        verbose_name='Proveedor'
    )
    producto = models.ForeignKey(
        'catalogo_productos.Producto',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='precios_proveedor',
        verbose_name='Producto del catálogo',
        help_text='Producto maestro del catalogo_productos (tipo=MATERIA_PRIMA)',
    )
    precio_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio por kg'
    )

    class Meta:
        db_table = 'supply_chain_precio_materia_prima'
        verbose_name = 'Precio de Materia Prima'
        verbose_name_plural = 'Precios de Materias Primas'
        ordering = ['proveedor']
        indexes = [
            models.Index(fields=['proveedor', 'producto']),
            models.Index(fields=['producto']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['proveedor', 'producto'],
                condition=Q(is_deleted=False),
                name='uq_precio_proveedor_producto_active',
            ),
        ]

    def __str__(self):
        return f"{self.proveedor.nombre_comercial} - {self.producto.nombre}: ${self.precio_kg}/kg"

    def clean(self):
        super().clean()
        if self.precio_kg is not None and self.precio_kg < 0:
            raise ValidationError({'precio_kg': 'El precio no puede ser negativo'})


class HistorialPrecioProveedor(TimeStampedModel):
    """
    Historial inmutable de cambios de precio de proveedores (audit log).

    Append-only: una vez creado, el registro no se modifica ni elimina.
    Hereda sólo de TimeStampedModel (created_at, updated_at) — sin
    SoftDelete ni AuditModel: en un audit log, "quién" es dato de negocio
    (modificado_por), no metadato técnico.
    """
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='historial_precios',
        verbose_name='Proveedor'
    )
    producto = models.ForeignKey(
        'catalogo_productos.Producto',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='historial_precios_proveedor',
        verbose_name='Producto del catálogo',
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
    # Campo de negocio del audit log. on_delete=SET_NULL alineado con
    # política TenantModel (Habeas Data Ley 1581). Ver docs/history/2026-04-12.
    modificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sc_historiales_precio_proveedor',
        verbose_name='Modificado por'
    )
    motivo = models.TextField(verbose_name='Motivo del cambio')

    class Meta:
        db_table = 'supply_chain_historial_precio'
        verbose_name = 'Historial de Precio'
        verbose_name_plural = 'Historiales de Precios'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['proveedor', '-created_at']),
            models.Index(fields=['modificado_por']),
            models.Index(fields=['producto']),
        ]

    def __str__(self):
        item = self.producto.nombre if self.producto else 'N/A'
        return f"{self.proveedor.nombre_comercial} - {item}: {self.precio_anterior} -> {self.precio_nuevo}"

    def save(self, *args, **kwargs):
        """Enforce append-only: una vez creado, no se puede modificar."""
        if self.pk is not None:
            raise PermissionError(
                'HistorialPrecioProveedor es append-only: no se permite '
                'modificar registros existentes.'
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Enforce append-only: no se permite eliminar."""
        raise PermissionError(
            'HistorialPrecioProveedor es append-only: no se permite '
            'eliminar registros.'
        )

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


class CondicionComercialProveedor(TenantModel):
    """
    Condiciones comerciales bitemporales por proveedor.

    Modelo bitemporal correcto: (vigencia_desde, vigencia_hasta). Permite
    historial completo de condiciones pactadas sin bloquear nuevas.
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

    class Meta:
        db_table = 'supply_chain_condicion_comercial'
        verbose_name = 'Condición Comercial'
        verbose_name_plural = 'Condiciones Comerciales'
        ordering = ['-vigencia_desde']
        indexes = [
            models.Index(fields=['proveedor', '-vigencia_desde']),
            models.Index(fields=['vigencia_desde', 'vigencia_hasta']),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    Q(vigencia_hasta__isnull=True) |
                    Q(vigencia_hasta__gte=F('vigencia_desde'))
                ),
                name='ck_condicion_vigencia_rango_valido',
            ),
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
