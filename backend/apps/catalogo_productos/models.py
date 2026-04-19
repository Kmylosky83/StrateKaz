"""
Catálogo de Productos — App CT-layer (transversal).

Dato maestro universal de productos, categorías y unidades de medida.
Consumido por: Supply Chain, Almacenamiento, Production Ops, Sales CRM.

Nota sobre UnidadMedida:
  Reemplaza supply_chain.catalogos.UnidadMedida (que hereda de models.Model).
  Este modelo hereda de TenantModel (multi-tenant + soft-delete + audit).
  La migración de datos se hará en Sesión 2 cuando se activen las apps de
  supply_chain. Por ahora coexisten sin conflicto (apps distintas, tablas distintas).
"""
from django.db import models

from utils.models import TenantModel


class CategoriaProducto(TenantModel):
    """Categoría jerárquica de productos (ej: Materias Primas > Grasas)."""

    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
    )
    descripcion = models.TextField(
        blank=True,
        default='',
        verbose_name='Descripción',
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subcategorias',
        verbose_name='Categoría padre',
    )
    codigo = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name='Código interno',
        help_text='Código opcional para integración con sistemas externos',
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name='Es del sistema',
        help_text='Las categorías del sistema son protegidas y no se pueden eliminar',
    )

    class Meta:
        verbose_name = 'Categoría de producto'
        verbose_name_plural = 'Categorías de productos'
        ordering = ['orden', 'nombre']
        constraints = [
            models.UniqueConstraint(
                fields=['nombre', 'parent'],
                condition=models.Q(is_deleted=False),
                name='uq_categoria_nombre_parent_active',
            ),
        ]

    def __str__(self):
        if self.parent:
            return f'{self.parent.nombre} > {self.nombre}'
        return self.nombre

    @staticmethod
    def generar_codigo():
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        return ConsecutivoConfig.obtener_siguiente_consecutivo('CATEGORIA_PRODUCTO')

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            self.codigo = self.generar_codigo()
        super().save(*args, **kwargs)

    @property
    def full_path(self):
        """Ruta completa: Raíz > Sub > Sub-sub."""
        parts = [self.nombre]
        current = self.parent
        while current:
            parts.insert(0, current.nombre)
            current = current.parent
        return ' > '.join(parts)


class UnidadMedida(TenantModel):
    """
    Unidad de medida estándar (kg, litros, unidades, etc.).

    Reemplaza supply_chain.catalogos.UnidadMedida (models.Model plano).
    Campos compatibles: nombre, tipo, factor de conversión.
    Campos nuevos: abreviatura, es_base.
    """

    TIPO_CHOICES = [
        ('PESO', 'Peso'),
        ('VOLUMEN', 'Volumen'),
        ('LONGITUD', 'Longitud'),
        ('AREA', 'Área'),
        ('UNIDAD', 'Unidad'),
        ('OTRO', 'Otro'),
    ]

    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
    )
    abreviatura = models.CharField(
        max_length=20,
        verbose_name='Abreviatura',
        help_text='Ej: kg, L, m, und',
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default='UNIDAD',
        verbose_name='Tipo',
    )
    factor_conversion = models.DecimalField(
        max_digits=15,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name='Factor de conversión',
        help_text='Conversión a la unidad base del tipo (ej: 1000 para g→kg)',
    )
    es_base = models.BooleanField(
        default=False,
        verbose_name='Es unidad base',
        help_text='Si es la unidad base del tipo (ej: kg para PESO)',
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name='Es del sistema',
        help_text='Las unidades del sistema son protegidas y no se pueden eliminar',
    )

    class Meta:
        verbose_name = 'Unidad de medida'
        verbose_name_plural = 'Unidades de medida'
        ordering = ['tipo', 'orden', 'nombre']
        constraints = [
            models.UniqueConstraint(
                fields=['nombre'],
                condition=models.Q(is_deleted=False),
                name='uq_unidad_medida_nombre_active',
            ),
        ]

    def __str__(self):
        return f'{self.nombre} ({self.abreviatura})'


class Producto(TenantModel):
    """
    Producto maestro — referenciado por Supply Chain, Almacenamiento, etc.

    Tipos:
      - MATERIA_PRIMA: material que compra la empresa (ej: grasa, aceite)
      - INSUMO: material de consumo interno (ej: empaques, etiquetas)
      - PRODUCTO_TERMINADO: producto que la empresa vende
      - SERVICIO: servicio contratado o prestado
    """

    TIPO_CHOICES = [
        ('MATERIA_PRIMA', 'Materia prima'),
        ('INSUMO', 'Insumo'),
        ('PRODUCTO_TERMINADO', 'Producto terminado'),
        ('SERVICIO', 'Servicio'),
    ]

    codigo = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Código',
        help_text='Código interno único del producto',
    )
    nombre = models.CharField(
        max_length=300,
        verbose_name='Nombre',
    )
    descripcion = models.TextField(
        blank=True,
        default='',
        verbose_name='Descripción',
    )
    categoria = models.ForeignKey(
        CategoriaProducto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='productos',
        verbose_name='Categoría',
    )
    unidad_medida = models.ForeignKey(
        UnidadMedida,
        on_delete=models.PROTECT,
        related_name='productos',
        verbose_name='Unidad de medida',
    )
    # NOTA: hoy `tipo` es solo un label clasificatorio (no controla comportamiento).
    # A futuro: SERVICIO → skip inventario, PRODUCTO_TERMINADO → habilita en Sales CRM.
    # Mientras tanto, la clasificación administrativa la hace el usuario con
    # categorías custom (ej: "Grasas Animales > Sebo Vacuno").
    tipo = models.CharField(
        max_length=30,
        choices=TIPO_CHOICES,
        default='MATERIA_PRIMA',
        verbose_name='Tipo',
    )
    precio_referencia = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio estimado (referencia)',
        help_text=(
            'Valor estimado para presupuesto inicial. El precio real se define '
            'por proveedor en Supply Chain > Precios.'
        ),
    )
    sku = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='SKU / Código externo',
        help_text=(
            'Código de barras, referencia del proveedor o código externo '
            '(EAN-13, SAP, INVIMA, etc.)'
        ),
    )
    notas = models.TextField(
        blank=True,
        default='',
        verbose_name='Notas',
    )

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['codigo', 'nombre']

    def __str__(self):
        return f'[{self.codigo}] {self.nombre}'

    @staticmethod
    def generar_codigo():
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        return ConsecutivoConfig.obtener_siguiente_consecutivo('PRODUCTO')

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            self.codigo = self.generar_codigo()
        super().save(*args, **kwargs)


# Registrar extensiones para que Django las descubra en el app registry.
# Patrón: docs/01-arquitectura/modular-tenancy.md sección 3.
from apps.catalogo_productos.extensiones.espec_calidad import ProductoEspecCalidad  # noqa: E402, F401
