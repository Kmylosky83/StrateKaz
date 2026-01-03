"""
Modelos de Unidades de Medida - Sistema Dinámico Multi-Industria
Sistema de Gestión StrateKaz

Permite configurar unidades de medida por industria:
- Procesamiento: toneladas, kg, libras
- Manufactura: unidades, piezas, docenas
- Logística: m³, pallets, contenedores
- Servicios: horas, proyectos
- Retail: cajas, paquetes
"""
from django.db import models
from django.core.exceptions import ValidationError
from decimal import Decimal

from apps.core.base_models import TimestampedModel, AuditModel, SoftDeleteModel


# ==============================================================================
# CONSTANTES
# ==============================================================================

CATEGORIA_UNIDAD_CHOICES = [
    ('MASA', 'Masa / Peso'),
    ('VOLUMEN', 'Volumen'),
    ('LONGITUD', 'Longitud'),
    ('AREA', 'Área'),
    ('CANTIDAD', 'Cantidad / Unidades'),
    ('TIEMPO', 'Tiempo'),
    ('CONTENEDOR', 'Contenedores / Embalaje'),
    ('OTRO', 'Otro'),
]


# ==============================================================================
# MODELO UNIDAD DE MEDIDA
# ==============================================================================

class UnidadMedida(AuditModel, SoftDeleteModel):
    """
    Catálogo de Unidades de Medida

    Sistema dinámico y configurable para soportar diferentes industrias.
    Incluye factores de conversión para transformaciones automáticas.

    Ejemplos:
    - Procesamiento: kg, ton, lb
    - Manufactura: unidades, piezas, docenas
    - Logística: m³, pallets, contenedores
    - Servicios: horas, días, proyectos
    - Retail: cajas, paquetes

    Hereda de AuditModel, SoftDeleteModel:
    - created_at, updated_at, created_by, updated_by
    - is_active, deleted_at, soft_delete(), restore()
    """

    # =========================================================================
    # IDENTIFICACIÓN
    # =========================================================================

    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la unidad (ej: KG, TON, M3, UND)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre completo de la unidad (ej: Kilogramo, Tonelada)'
    )
    nombre_plural = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Nombre Plural',
        help_text='Nombre en plural (ej: Kilogramos, Toneladas). Si vacío, se agrega "s"'
    )
    simbolo = models.CharField(
        max_length=10,
        verbose_name='Símbolo',
        help_text='Símbolo o abreviatura (ej: kg, ton, m³, hrs)'
    )
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_UNIDAD_CHOICES,
        db_index=True,
        verbose_name='Categoría',
        help_text='Categoría de la unidad de medida'
    )

    # =========================================================================
    # CONVERSIÓN
    # =========================================================================

    unidad_base = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='unidades_derivadas',
        verbose_name='Unidad Base',
        help_text='Unidad base para conversión (ej: kg es base de ton)'
    )
    factor_conversion = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        default=Decimal('1.0'),
        verbose_name='Factor de Conversión',
        help_text='Factor para convertir a unidad base (ej: 1 ton = 1000 kg → factor: 1000)'
    )

    # =========================================================================
    # PRESENTACIÓN
    # =========================================================================

    decimales_display = models.IntegerField(
        default=2,
        verbose_name='Decimales para Display',
        help_text='Cantidad de decimales para mostrar (0-6)'
    )
    prefiere_notacion_cientifica = models.BooleanField(
        default=False,
        verbose_name='Notación Científica',
        help_text='Usar notación científica para valores muy grandes/pequeños'
    )
    usar_separador_miles = models.BooleanField(
        default=True,
        verbose_name='Usar Separador de Miles',
        help_text='Formatear con separador de miles (ej: 1,200 vs 1200)'
    )

    # =========================================================================
    # METADATOS
    # =========================================================================

    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción o notas sobre la unidad'
    )
    es_sistema = models.BooleanField(
        default=False,
        verbose_name='Es del Sistema',
        help_text='Unidad precargada del sistema (no editable por usuarios)'
    )
    orden_display = models.IntegerField(
        default=0,
        verbose_name='Orden de Visualización',
        help_text='Orden para mostrar en listas (menor primero)'
    )

    class Meta:
        db_table = 'configuracion_unidad_medida'
        verbose_name = 'Unidad de Medida'
        verbose_name_plural = 'Unidades de Medida'
        ordering = ['categoria', 'orden_display', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['categoria', 'is_active']),
            models.Index(fields=['es_sistema']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.simbolo})"

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar decimales
        if self.decimales_display < 0 or self.decimales_display > 6:
            raise ValidationError({
                'decimales_display': 'Los decimales deben estar entre 0 y 6.'
            })

        # Validar factor de conversión positivo
        if self.factor_conversion <= 0:
            raise ValidationError({
                'factor_conversion': 'El factor de conversión debe ser positivo.'
            })

        # Validar que si tiene unidad_base, no sea circular
        if self.unidad_base:
            if self.unidad_base == self:
                raise ValidationError({
                    'unidad_base': 'La unidad base no puede ser la misma unidad.'
                })

            # Validar que categoría coincida con unidad base
            if self.unidad_base.categoria != self.categoria:
                raise ValidationError({
                    'unidad_base': 'La unidad base debe ser de la misma categoría.'
                })

            # Prevenir ciclos (nivel 1 - básico)
            if self.unidad_base.unidad_base == self:
                raise ValidationError({
                    'unidad_base': 'No se permiten conversiones circulares.'
                })

        # Si no tiene unidad_base, debe tener factor 1
        if not self.unidad_base and self.factor_conversion != 1:
            raise ValidationError({
                'factor_conversion': 'Una unidad sin base debe tener factor de conversión 1.'
            })

    def save(self, *args, **kwargs):
        """Override save para ejecutar validaciones."""
        # Generar nombre plural si está vacío
        if not self.nombre_plural:
            self.nombre_plural = f"{self.nombre}s"

        self.full_clean()
        super().save(*args, **kwargs)

    # =========================================================================
    # MÉTODOS DE CONVERSIÓN
    # =========================================================================

    def convertir_a_base(self, valor):
        """
        Convierte un valor de esta unidad a su unidad base.

        Args:
            valor (Decimal|float): Valor a convertir

        Returns:
            Decimal: Valor en unidad base
        """
        if not isinstance(valor, Decimal):
            valor = Decimal(str(valor))

        if not self.unidad_base:
            # Ya es unidad base
            return valor

        return valor * self.factor_conversion

    def convertir_desde_base(self, valor):
        """
        Convierte un valor desde la unidad base a esta unidad.

        Args:
            valor (Decimal|float): Valor en unidad base

        Returns:
            Decimal: Valor en esta unidad
        """
        if not isinstance(valor, Decimal):
            valor = Decimal(str(valor))

        if not self.unidad_base:
            # Ya es unidad base
            return valor

        return valor / self.factor_conversion

    def convertir_a(self, valor, unidad_destino):
        """
        Convierte un valor de esta unidad a otra unidad de la misma categoría.

        Args:
            valor (Decimal|float): Valor a convertir
            unidad_destino (UnidadMedida): Unidad destino

        Returns:
            Decimal: Valor convertido

        Raises:
            ValidationError: Si las unidades no son compatibles
        """
        if self.categoria != unidad_destino.categoria:
            raise ValidationError(
                f'No se puede convertir {self.categoria} a {unidad_destino.categoria}'
            )

        # Convertir a unidad base, luego a destino
        valor_base = self.convertir_a_base(valor)
        return unidad_destino.convertir_desde_base(valor_base)

    # =========================================================================
    # MÉTODOS DE FORMATEO
    # =========================================================================

    def formatear(self, valor, incluir_simbolo=True, locale_config=None):
        """
        Formatea un valor numérico según la configuración de la unidad.

        Args:
            valor (Decimal|float): Valor a formatear
            incluir_simbolo (bool): Si incluir el símbolo de la unidad
            locale_config (dict): Configuración regional opcional
                {
                    'separador_miles': '.',
                    'separador_decimales': ',',
                }

        Returns:
            str: Valor formateado (ej: "5.2 ton", "1,200 unidades")
        """
        if valor is None:
            return ''

        if not isinstance(valor, Decimal):
            valor = Decimal(str(valor))

        # Determinar si usar notación científica
        if self.prefiere_notacion_cientifica:
            if abs(valor) >= 1e6 or (abs(valor) < 1e-3 and valor != 0):
                texto = f"{valor:.{self.decimales_display}e}"
                return f"{texto} {self.simbolo}" if incluir_simbolo else texto

        # Redondear según decimales
        valor_redondeado = round(valor, self.decimales_display)

        # Separar parte entera y decimal
        partes = str(valor_redondeado).split('.')
        parte_entera = int(partes[0])
        parte_decimal = partes[1] if len(partes) > 1 else None

        # Aplicar separador de miles
        if self.usar_separador_miles and locale_config:
            sep_miles = locale_config.get('separador_miles', ',')
            texto_entero = f"{parte_entera:,}".replace(',', sep_miles)
        elif self.usar_separador_miles:
            texto_entero = f"{parte_entera:,}"
        else:
            texto_entero = str(parte_entera)

        # Construir texto final
        if self.decimales_display > 0 and parte_decimal:
            # Asegurar cantidad correcta de decimales
            parte_decimal = parte_decimal.ljust(self.decimales_display, '0')[:self.decimales_display]

            if locale_config:
                sep_decimales = locale_config.get('separador_decimales', '.')
            else:
                sep_decimales = '.'

            texto = f"{texto_entero}{sep_decimales}{parte_decimal}"
        else:
            texto = texto_entero

        # Agregar símbolo si se requiere
        if incluir_simbolo:
            # Determinar si usar nombre o símbolo
            if valor == 1:
                sufijo = self.nombre
            else:
                sufijo = self.nombre_plural if self.nombre_plural else self.simbolo

            return f"{texto} {sufijo}"

        return texto

    # =========================================================================
    # MÉTODOS DE CLASE
    # =========================================================================

    @classmethod
    def obtener_por_categoria(cls, categoria, activas_only=True):
        """
        Obtiene unidades por categoría.

        Args:
            categoria (str): Categoría de unidad
            activas_only (bool): Solo unidades activas

        Returns:
            QuerySet: Unidades de la categoría
        """
        qs = cls.objects.filter(categoria=categoria, deleted_at__isnull=True)
        if activas_only:
            qs = qs.filter(is_active=True)
        return qs.order_by('orden_display', 'nombre')

    @classmethod
    def obtener_por_codigo(cls, codigo):
        """
        Obtiene una unidad por su código.

        Args:
            codigo (str): Código de la unidad

        Returns:
            UnidadMedida|None: Unidad encontrada o None
        """
        try:
            return cls.objects.get(
                codigo=codigo.upper(),
                is_active=True,
                deleted_at__isnull=True
            )
        except cls.DoesNotExist:
            return None

    @classmethod
    def cargar_unidades_sistema(cls):
        """
        Carga las unidades de medida predefinidas del sistema.
        Este método es idempotente (puede ejecutarse múltiples veces).

        Returns:
            int: Cantidad de unidades creadas
        """
        unidades_sistema = [
            # MASA / PESO
            {
                'codigo': 'KG',
                'nombre': 'Kilogramo',
                'nombre_plural': 'Kilogramos',
                'simbolo': 'kg',
                'categoria': 'MASA',
                'decimales_display': 2,
                'orden_display': 10,
                'es_sistema': True,
            },
            {
                'codigo': 'TON',
                'nombre': 'Tonelada',
                'nombre_plural': 'Toneladas',
                'simbolo': 'ton',
                'categoria': 'MASA',
                'unidad_base_codigo': 'KG',
                'factor_conversion': Decimal('1000'),
                'decimales_display': 2,
                'orden_display': 20,
                'es_sistema': True,
            },
            {
                'codigo': 'GR',
                'nombre': 'Gramo',
                'nombre_plural': 'Gramos',
                'simbolo': 'g',
                'categoria': 'MASA',
                'unidad_base_codigo': 'KG',
                'factor_conversion': Decimal('0.001'),
                'decimales_display': 0,
                'orden_display': 5,
                'es_sistema': True,
            },
            {
                'codigo': 'LB',
                'nombre': 'Libra',
                'nombre_plural': 'Libras',
                'simbolo': 'lb',
                'categoria': 'MASA',
                'unidad_base_codigo': 'KG',
                'factor_conversion': Decimal('0.453592'),
                'decimales_display': 2,
                'orden_display': 15,
                'es_sistema': True,
            },

            # VOLUMEN
            {
                'codigo': 'M3',
                'nombre': 'Metro Cúbico',
                'nombre_plural': 'Metros Cúbicos',
                'simbolo': 'm³',
                'categoria': 'VOLUMEN',
                'decimales_display': 2,
                'orden_display': 10,
                'es_sistema': True,
            },
            {
                'codigo': 'LT',
                'nombre': 'Litro',
                'nombre_plural': 'Litros',
                'simbolo': 'L',
                'categoria': 'VOLUMEN',
                'unidad_base_codigo': 'M3',
                'factor_conversion': Decimal('0.001'),
                'decimales_display': 2,
                'orden_display': 5,
                'es_sistema': True,
            },

            # CANTIDAD
            {
                'codigo': 'UND',
                'nombre': 'Unidad',
                'nombre_plural': 'Unidades',
                'simbolo': 'und',
                'categoria': 'CANTIDAD',
                'decimales_display': 0,
                'orden_display': 10,
                'es_sistema': True,
            },
            {
                'codigo': 'PZA',
                'nombre': 'Pieza',
                'nombre_plural': 'Piezas',
                'simbolo': 'pza',
                'categoria': 'CANTIDAD',
                'decimales_display': 0,
                'orden_display': 20,
                'es_sistema': True,
            },
            {
                'codigo': 'DOC',
                'nombre': 'Docena',
                'nombre_plural': 'Docenas',
                'simbolo': 'doc',
                'categoria': 'CANTIDAD',
                'unidad_base_codigo': 'UND',
                'factor_conversion': Decimal('12'),
                'decimales_display': 0,
                'orden_display': 30,
                'es_sistema': True,
            },
            {
                'codigo': 'CIENTO',
                'nombre': 'Ciento',
                'nombre_plural': 'Cientos',
                'simbolo': 'cto',
                'categoria': 'CANTIDAD',
                'unidad_base_codigo': 'UND',
                'factor_conversion': Decimal('100'),
                'decimales_display': 0,
                'orden_display': 40,
                'es_sistema': True,
            },

            # TIEMPO
            {
                'codigo': 'HORA',
                'nombre': 'Hora',
                'nombre_plural': 'Horas',
                'simbolo': 'hr',
                'categoria': 'TIEMPO',
                'decimales_display': 2,
                'orden_display': 10,
                'es_sistema': True,
            },
            {
                'codigo': 'DIA',
                'nombre': 'Día',
                'nombre_plural': 'Días',
                'simbolo': 'día',
                'categoria': 'TIEMPO',
                'unidad_base_codigo': 'HORA',
                'factor_conversion': Decimal('24'),
                'decimales_display': 0,
                'orden_display': 20,
                'es_sistema': True,
            },

            # CONTENEDOR / EMBALAJE
            {
                'codigo': 'PALLET',
                'nombre': 'Pallet',
                'nombre_plural': 'Pallets',
                'simbolo': 'plt',
                'categoria': 'CONTENEDOR',
                'decimales_display': 0,
                'orden_display': 10,
                'es_sistema': True,
            },
            {
                'codigo': 'CAJA',
                'nombre': 'Caja',
                'nombre_plural': 'Cajas',
                'simbolo': 'cja',
                'categoria': 'CONTENEDOR',
                'decimales_display': 0,
                'orden_display': 20,
                'es_sistema': True,
            },
            {
                'codigo': 'CONTENEDOR',
                'nombre': 'Contenedor',
                'nombre_plural': 'Contenedores',
                'simbolo': 'cont',
                'categoria': 'CONTENEDOR',
                'decimales_display': 0,
                'orden_display': 30,
                'es_sistema': True,
            },
        ]

        creadas = 0
        for data in unidades_sistema:
            codigo = data.pop('codigo')
            unidad_base_codigo = data.pop('unidad_base_codigo', None)

            # Verificar si ya existe
            existing = cls.objects.filter(codigo=codigo).first()
            if existing:
                continue

            # Obtener unidad base si aplica
            if unidad_base_codigo:
                try:
                    unidad_base = cls.objects.get(codigo=unidad_base_codigo)
                    data['unidad_base'] = unidad_base
                except cls.DoesNotExist:
                    # La unidad base aún no existe, saltarla
                    continue

            # Crear unidad
            cls.objects.create(codigo=codigo, **data)
            creadas += 1

        return creadas
