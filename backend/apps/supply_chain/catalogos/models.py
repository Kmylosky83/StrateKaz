"""
Modelos para catálogos de Supply Chain
Sistema de Gestión StrateKaz
"""
from django.db import models
from django.db.models import Q

from utils.models import TenantModel


class RutaRecoleccion(TenantModel):
    """
    Ruta de recolección de materia prima (H-SC-10).

    Representa un recorrido logístico propio de la empresa que recolecta
    MP desde productores/proveedores externos. Conceptualmente pertenece
    a Supply Chain (no a Fundación): es un recurso operativo, no una sede
    física con dirección.

    Migrado desde `SedeEmpresa` con `tipo_unidad='RUTA_RECOLECCION'` (H-SC-10).
    Las rutas típicamente actúan como proveedor interno: el signal
    `sincronizar_proveedor_espejo_ruta` crea un `Proveedor` espejo para que
    aparezcan como transportador en vouchers de recepción.
    """

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la ruta (ej: RUTA-001)',
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la ruta',
    )
    descripcion = models.TextField(
        blank=True,
        default='',
        verbose_name='Descripción',
    )
    es_proveedor_interno = models.BooleanField(
        default=True,
        verbose_name='Es proveedor interno',
        help_text=(
            'Si es True, se crea automáticamente un Proveedor espejo en '
            'catalogo_productos para que la ruta pueda operar como '
            'transportador en vouchers de recepción.'
        ),
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
    )

    class Meta:
        db_table = 'supply_chain_ruta_recoleccion'
        verbose_name = 'Ruta de Recolección'
        verbose_name_plural = 'Rutas de Recolección'
        ordering = ['codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class TipoAlmacen(models.Model):
    """
    Tipo de almacenamiento físico (catálogo universal, no tenant).

    Define la clasificación de cómo se almacena el inventario:
    silo (granel líquido/sólido), contenedor, pallet (estibado), piso (suelto).

    Usado por: Almacen.tipo_almacen (FK nullable, backward compat con almacenes existentes).
    """
    codigo = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único (ej: SILO, CONTENEDOR, PALLET, PISO)'
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
    icono = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre de ícono Lucide React (ej: Cylinder, Package, Layers, Grid)'
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
        db_table = 'supply_chain_tipo_almacen'
        verbose_name = 'Tipo de Almacén'
        verbose_name_plural = 'Tipos de Almacén'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class Almacen(TenantModel):
    """
    Almacenes del tenant para almacenamiento de inventario.

    Hereda de TenantModel: el schema-per-tenant reemplaza la FK empresa
    (doctrina modular-tenancy). Se migró desde BaseCompanyModel en S6.
    """
    codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del almacén (ej: ALM-001)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre del almacén'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    direccion = models.TextField(
        blank=True,
        verbose_name='Dirección'
    )
    es_principal = models.BooleanField(
        default=False,
        verbose_name='Es principal',
        help_text='Indica si es el almacén principal'
    )
    permite_despacho = models.BooleanField(
        default=True,
        verbose_name='Permite despacho'
    )
    permite_recepcion = models.BooleanField(
        default=True,
        verbose_name='Permite recepción'
    )
    tipo_almacen = models.ForeignKey(
        TipoAlmacen,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='almacenes',
        verbose_name='Tipo de almacén',
        help_text='Clasificación de cómo se almacena (silo / contenedor / pallet / piso)'
    )
    sede = models.ForeignKey(
        'configuracion.SedeEmpresa',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='almacenes',
        verbose_name='Sede',
        help_text='Sede física donde vive este almacén',
    )
    capacidad_maxima = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Capacidad máxima',
        help_text='Capacidad máxima numérica (la unidad se define por tipo_almacen o la unidad de medida del producto)'
    )
    # is_active: semántica de negocio (almacén operativamente activo),
    # independiente del soft-delete de TenantModel.
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
    )

    class Meta:
        verbose_name = 'Almacén'
        verbose_name_plural = 'Almacenes'
        ordering = ['codigo']
        db_table = 'supply_chain_almacen'
        constraints = [
            models.UniqueConstraint(
                fields=['codigo'],
                condition=Q(is_deleted=False),
                name='uq_almacen_codigo_active',
            ),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
