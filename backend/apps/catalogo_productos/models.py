"""
Catálogo de Productos — App CT-layer (transversal).

Dato maestro universal de productos, categorías y unidades de medida.
Consumido por: Supply Chain, Almacenamiento, Production Ops, Sales CRM,
Configuración (Sedes), y cualquier C2 que necesite dato maestro.

UnidadMedida:
  Source-of-truth único del sistema. Absorbió el modelo legacy
  `gestion_estrategica.organizacion.UnidadMedida` en S7-consolidacion.
  Soporta: conversión jerárquica (unidad_base), formateo de display
  (decimales, separador miles, notación científica) y clasificación por
  tipo (PESO, VOLUMEN, LONGITUD, AREA, UNIDAD, TIEMPO, CONTENEDOR, OTRO).
"""
from decimal import Decimal

from django.core.exceptions import ValidationError
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

    Source-of-truth único del sistema. Soporta conversión jerárquica
    (via `unidad_base`), formateo de display (decimales, separador de
    miles, notación científica) y clasificación por `tipo`.
    """

    TIPO_CHOICES = [
        ('PESO', 'Peso'),
        ('VOLUMEN', 'Volumen'),
        ('LONGITUD', 'Longitud'),
        ('AREA', 'Área'),
        ('UNIDAD', 'Unidad'),
        ('TIEMPO', 'Tiempo'),
        ('CONTENEDOR', 'Contenedor / Embalaje'),
        ('OTRO', 'Otro'),
    ]

    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
    )
    nombre_plural = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Nombre plural',
        help_text='Ej: Kilogramos. Si se deja vacío, se agrega "s" al nombre.',
    )
    abreviatura = models.CharField(
        max_length=20,
        verbose_name='Abreviatura',
        help_text='Ej: kg, L, m, und',
    )
    simbolo = models.CharField(
        max_length=10,
        blank=True,
        default='',
        verbose_name='Símbolo',
        help_text='Símbolo corto (ej: m³, hrs). Si vacío, se usa abreviatura.',
    )
    descripcion = models.TextField(
        blank=True,
        default='',
        verbose_name='Descripción',
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default='UNIDAD',
        verbose_name='Tipo',
    )
    unidad_base = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='unidades_derivadas',
        verbose_name='Unidad base',
        help_text='Unidad base para conversión (ej: kg es base de ton)',
    )
    factor_conversion = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        default=Decimal('1.0'),
        null=True,
        blank=True,
        verbose_name='Factor de conversión',
        help_text='Factor para convertir a unidad base (ej: 1 ton = 1000 kg → factor: 1000)',
    )
    es_base = models.BooleanField(
        default=False,
        verbose_name='Es unidad base',
        help_text='Si es la unidad base del tipo (ej: kg para PESO)',
    )
    decimales_display = models.PositiveSmallIntegerField(
        default=2,
        verbose_name='Decimales para display',
        help_text='Cantidad de decimales al mostrar (0-6)',
    )
    prefiere_notacion_cientifica = models.BooleanField(
        default=False,
        verbose_name='Notación científica',
        help_text='Usar notación científica para valores muy grandes/pequeños',
    )
    usar_separador_miles = models.BooleanField(
        default=True,
        verbose_name='Usar separador de miles',
        help_text='Formatear con separador de miles (1,200 vs 1200)',
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
        suffix = self.simbolo or self.abreviatura
        return f'{self.nombre} ({suffix})'

    def clean(self):
        super().clean()
        if self.decimales_display is not None and (self.decimales_display < 0 or self.decimales_display > 6):
            raise ValidationError({'decimales_display': 'Los decimales deben estar entre 0 y 6.'})
        if self.factor_conversion is not None and self.factor_conversion <= 0:
            raise ValidationError({'factor_conversion': 'El factor de conversión debe ser positivo.'})
        if self.unidad_base:
            if self.unidad_base_id == self.pk and self.pk is not None:
                raise ValidationError({'unidad_base': 'La unidad base no puede ser la misma unidad.'})
            if self.unidad_base.tipo != self.tipo:
                raise ValidationError({'unidad_base': 'La unidad base debe ser del mismo tipo.'})
            if self.unidad_base.unidad_base_id == self.pk and self.pk is not None:
                raise ValidationError({'unidad_base': 'No se permiten conversiones circulares.'})

    def save(self, *args, **kwargs):
        if not self.nombre_plural:
            self.nombre_plural = f'{self.nombre}s'
        if not self.simbolo:
            self.simbolo = self.abreviatura
        super().save(*args, **kwargs)

    # ──────────────────────────────────────────────────────────────
    # Conversión
    # ──────────────────────────────────────────────────────────────

    def convertir_a_base(self, valor):
        """Convierte un valor de esta unidad a su unidad base."""
        if not isinstance(valor, Decimal):
            valor = Decimal(str(valor))
        if not self.unidad_base or self.factor_conversion is None:
            return valor
        return valor * self.factor_conversion

    def convertir_desde_base(self, valor):
        """Convierte un valor desde la unidad base a esta unidad."""
        if not isinstance(valor, Decimal):
            valor = Decimal(str(valor))
        if not self.unidad_base or self.factor_conversion is None:
            return valor
        return valor / self.factor_conversion

    def convertir_a(self, valor, unidad_destino):
        """Convierte un valor de esta unidad a otra unidad del mismo tipo."""
        if self.tipo != unidad_destino.tipo:
            raise ValidationError(f'No se puede convertir {self.tipo} a {unidad_destino.tipo}')
        valor_base = self.convertir_a_base(valor)
        return unidad_destino.convertir_desde_base(valor_base)

    # ──────────────────────────────────────────────────────────────
    # Formateo
    # ──────────────────────────────────────────────────────────────

    def formatear(self, valor, incluir_simbolo=True, locale_config=None):
        """Formatea un valor numérico según la configuración de la unidad."""
        if valor is None:
            return ''
        if not isinstance(valor, Decimal):
            valor = Decimal(str(valor))

        if self.prefiere_notacion_cientifica:
            if abs(valor) >= Decimal('1e6') or (abs(valor) < Decimal('1e-3') and valor != 0):
                texto = f'{valor:.{self.decimales_display}e}'
                return f'{texto} {self.simbolo or self.abreviatura}' if incluir_simbolo else texto

        valor_redondeado = round(valor, self.decimales_display)
        partes = str(valor_redondeado).split('.')
        parte_entera = int(partes[0])
        parte_decimal = partes[1] if len(partes) > 1 else None

        if self.usar_separador_miles and locale_config:
            sep_miles = locale_config.get('separador_miles', ',')
            texto_entero = f'{parte_entera:,}'.replace(',', sep_miles)
        elif self.usar_separador_miles:
            texto_entero = f'{parte_entera:,}'
        else:
            texto_entero = str(parte_entera)

        if self.decimales_display > 0 and parte_decimal:
            parte_decimal = parte_decimal.ljust(self.decimales_display, '0')[:self.decimales_display]
            sep_dec = (locale_config or {}).get('separador_decimales', '.')
            texto = f'{texto_entero}{sep_dec}{parte_decimal}'
        else:
            texto = texto_entero

        if incluir_simbolo:
            sufijo = self.nombre if valor == 1 else (self.nombre_plural or self.simbolo or self.abreviatura)
            return f'{texto} {sufijo}'
        return texto

    # ──────────────────────────────────────────────────────────────
    # Lookups
    # ──────────────────────────────────────────────────────────────

    # Mapeo de categorías legacy (MASA/CANTIDAD) a tipos canónicos (PESO/UNIDAD).
    # Preserva compatibilidad con callers que pasan la categoría legacy.
    _LEGACY_CATEGORIA_MAP = {
        'MASA': 'PESO',
        'CANTIDAD': 'UNIDAD',
    }

    @classmethod
    def obtener_por_tipo(cls, tipo, activas_only=True):
        qs = cls.objects.filter(tipo=tipo, is_deleted=False)
        return qs.order_by('orden', 'nombre')

    @classmethod
    def obtener_por_categoria(cls, categoria, activas_only=True):
        """Alias para compatibilidad con callers legacy (MASA → PESO, etc.)."""
        tipo = cls._LEGACY_CATEGORIA_MAP.get(categoria, categoria)
        return cls.obtener_por_tipo(tipo, activas_only=activas_only)

    @classmethod
    def obtener_por_codigo(cls, codigo):
        """Busca flexible en abreviatura / simbolo / nombre (case-insensitive).

        Soporta callers legacy que pasan 'KG', 'TON', 'M3', etc.
        """
        if not codigo:
            return None
        codigo_str = str(codigo).strip()
        qs = cls.objects.filter(is_deleted=False)
        # Match por abreviatura, simbolo o nombre (case-insensitive)
        from django.db.models import Q
        return qs.filter(
            Q(abreviatura__iexact=codigo_str)
            | Q(simbolo__iexact=codigo_str)
            | Q(nombre__iexact=codigo_str)
        ).first()


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
