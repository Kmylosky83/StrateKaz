"""
Modelos para catálogos de Supply Chain
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.db import models
from apps.core.base_models.base import BaseCompanyModel


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


class Almacen(BaseCompanyModel):
    """
    Almacenes de la empresa para almacenamiento de inventario
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

    class Meta:
        verbose_name = 'Almacén'
        verbose_name_plural = 'Almacenes'
        ordering = ['codigo']
        unique_together = [['empresa', 'codigo']]
        db_table = 'supply_chain_almacen'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
