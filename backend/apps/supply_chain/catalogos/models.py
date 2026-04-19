"""
Modelos para catálogos de Supply Chain
Sistema de Gestión StrateKaz
"""
from django.db import models
from django.db.models import Q

from utils.models import TenantModel


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


class UnidadMedida(models.Model):
    """
    Unidad de medida para inventarios y operaciones (catálogo compartido).
    Ejemplos: KG, LB, TONELADAS, LITROS, GALONES, UNIDADES

    Utilizado por:
    - Programación de Abastecimiento (cantidades recolectadas/compradas)
    - Almacenamiento (inventarios y movimientos)
    - Recepción (entradas de materia prima)
    """
    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la unidad (ej: KG, TON, LB, LT, UN)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre completo',
        help_text='Nombre completo de la unidad (ej: Kilogramos, Toneladas)'
    )
    simbolo = models.CharField(
        max_length=10,
        verbose_name='Símbolo/Abreviatura',
        help_text='Símbolo corto para mostrar en UI (ej: kg, t, lb, L)'
    )
    tipo = models.CharField(
        max_length=20,
        choices=[
            ('PESO', 'Peso'),
            ('VOLUMEN', 'Volumen'),
            ('LONGITUD', 'Longitud'),
            ('UNIDAD', 'Unidad'),
            ('OTRO', 'Otro'),
        ],
        default='PESO',
        verbose_name='Tipo de medida'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    factor_conversion_kg = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name='Factor de conversión a KG',
        help_text='Factor para convertir a kilogramos base (ej: 1 para KG, 1000 para TON, 0.4536 para LB)'
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
        db_table = 'supply_chain_unidad_medida'
        verbose_name = 'Unidad de Medida'
        verbose_name_plural = 'Unidades de Medida'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.simbolo})"

    @property
    def abreviatura(self):
        """Alias para compatibilidad con código existente"""
        return self.simbolo


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
