"""
Modelos de Proveedor — CT-layer (Catálogo de Productos).

Dato maestro multi-industria. Identificación + contacto mínimos + productos
suministrados. Datos tributarios, bancarios, contratos y evaluaciones NO
viven aquí — se gestionan en Administración/Compras cuando esos módulos
entren a LIVE.

Los modelos declaran `app_label='catalogo_productos'` para que las tablas
y migraciones queden en el app de CT (sin crear sub-app Django).
"""
from django.db import models
from django.db.models import Q
from django.core.exceptions import ValidationError

from utils.models import TenantModel

# Datos Maestros Compartidos — importados de Core (C0)
from apps.core.models import TipoDocumentoIdentidad, Departamento


# ==============================================================================
# CATÁLOGO DINÁMICO: TipoProveedor
# ==============================================================================

class TipoProveedor(models.Model):
    """
    Clasificación operativa dinámica del proveedor.

    Editable por el tenant: puede agregar/desactivar tipos. Ejemplos de seed:
      MATERIA_PRIMA, PRODUCTOS_SERVICIOS, UNIDAD_NEGOCIO, TRANSPORTISTA,
      CONSULTOR, CONTRATISTA.

    Flags operativos controlan sub-formularios en la UI (modalidad logística
    aplica solo cuando requiere_modalidad_logistica=True, etc.).
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
    )
    requiere_materia_prima = models.BooleanField(
        default=False,
        verbose_name='Requiere productos suministrados',
        help_text='Si es True, la UI exige seleccionar productos que el proveedor suministra.',
    )
    requiere_modalidad_logistica = models.BooleanField(
        default=False,
        verbose_name='Requiere modalidad logística',
        help_text='Si es True, al asignar un precio se solicita la modalidad (entrega en planta / recolección).',
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'catalogo_productos'
        db_table = 'catalogo_productos_tipo_proveedor'
        verbose_name = 'Tipo de Proveedor'
        verbose_name_plural = 'Tipos de Proveedor'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


# ==============================================================================
# MODELO PRINCIPAL: Proveedor
# ==============================================================================

class Proveedor(TenantModel):
    """
    Proveedor — dato maestro multi-industria.

    Campos mínimos: identificación (tipo_persona, documento, razón social),
    contacto (tel/email/ciudad) y productos que suministra.

    Los datos bancarios, formas de pago, condiciones comerciales, evaluaciones
    y contratos fueron eliminados del modelo (2026-04-21). Se gestionan en
    Administración/Compras cuando esos módulos entren a LIVE.
    """

    class TipoPersona(models.TextChoices):
        NATURAL = 'natural', 'Persona Natural'
        EMPRESA = 'empresa', 'Empresa'

    # --- Identificación ---
    codigo_interno = models.CharField(
        max_length=50,
        editable=False,
        db_index=True,
        verbose_name='Código interno',
        help_text='Auto-generado al crear. Prefijo PROV- unificado.',
    )
    tipo_persona = models.CharField(
        max_length=20,
        choices=TipoPersona.choices,
        default=TipoPersona.EMPRESA,
        db_index=True,
        verbose_name='Tipo de persona',
    )
    tipo_proveedor = models.ForeignKey(
        TipoProveedor,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='proveedores',
        verbose_name='Tipo de proveedor',
        help_text='Clasificación operativa. Opcional al crear; se asigna después.',
    )
    razon_social = models.CharField(
        max_length=200,
        verbose_name='Razón social',
    )
    nombre_comercial = models.CharField(
        max_length=200,
        db_index=True,
        verbose_name='Nombre comercial',
    )
    tipo_documento = models.ForeignKey(
        TipoDocumentoIdentidad,
        on_delete=models.PROTECT,
        related_name='proveedores_ct',
        verbose_name='Tipo de documento',
    )
    numero_documento = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Número de documento',
    )
    nit = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='NIT',
        help_text='Solo para persona jurídica (empresa).',
    )

    # --- Contacto ---
    telefono = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    ciudad = models.CharField(max_length=100, blank=True, default='')
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='proveedores_ct',
        verbose_name='Departamento',
    )
    direccion = models.TextField(blank=True, default='', verbose_name='Dirección')

    # --- Productos suministrados (M2M al catálogo maestro de la misma app) ---
    productos_suministrados = models.ManyToManyField(
        'catalogo_productos.Producto',
        blank=True,
        related_name='proveedores_ct',
        verbose_name='Productos que suministra',
    )

    # --- Vínculo con Parte Interesada (C1 — Fundación) ---
    parte_interesada_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Parte Interesada',
    )
    parte_interesada_nombre = models.CharField(
        max_length=200,
        blank=True,
        default='',
        verbose_name='Nombre Parte Interesada (cache)',
    )

    # --- Estado operativo ---
    # is_active: semántica de negocio (proveedor comercialmente activo),
    # independiente del soft-delete de TenantModel.
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        app_label = 'catalogo_productos'
        db_table = 'catalogo_productos_proveedor'
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['nombre_comercial']
        indexes = [
            models.Index(fields=['tipo_persona', 'is_active']),
            models.Index(fields=['numero_documento']),
            models.Index(fields=['nombre_comercial']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['numero_documento'],
                condition=Q(is_deleted=False),
                name='uq_catprod_proveedor_numero_doc_activo',
            ),
            models.UniqueConstraint(
                fields=['codigo_interno'],
                condition=Q(is_deleted=False),
                name='uq_catprod_proveedor_codigo_activo',
            ),
        ]

    def __str__(self):
        return self.nombre_comercial

    @staticmethod
    def generar_codigo_interno():
        """
        Genera código interno con prefijo unificado PROV-NNNNN.

        Usa ConsecutivoConfig si está disponible; si no, calcula el siguiente
        número por scan del máximo existente.
        """
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

        try:
            return ConsecutivoConfig.obtener_siguiente_consecutivo('PROVEEDOR')
        except ConsecutivoConfig.DoesNotExist:
            ultimo = Proveedor.objects.filter(
                codigo_interno__startswith='PROV-',
            ).order_by('-codigo_interno').first()

            if ultimo and ultimo.codigo_interno:
                try:
                    numero = int(ultimo.codigo_interno.split('-')[1]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1

            return f'PROV-{numero:05d}'

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo_interno:
            self.codigo_interno = self.generar_codigo_interno()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        # NIT solo aplica para EMPRESA
        if self.tipo_persona != self.TipoPersona.EMPRESA and self.nit:
            raise ValidationError({
                'nit': 'El NIT solo aplica para personas jurídicas (Empresa).',
            })

    def delete(self, using=None, keep_parents=False, user=None):
        """
        Soft-delete con efectos de negocio:
          1. Marca el proveedor como comercialmente inactivo (is_active=False).
          2. Desactiva los User que tengan proveedor_id_ext apuntando a este.
             (proveedor_id_ext es IntegerField no-FK — ver SOURCE_OF_TRUTH.md).
        """
        from django.contrib.auth import get_user_model

        self.is_active = False
        self.save(update_fields=['is_active'])

        User = get_user_model()
        User.objects.filter(
            proveedor_id_ext=self.pk, is_active=True,
        ).update(is_active=False)

        super().delete(using=using, keep_parents=keep_parents, user=user)
