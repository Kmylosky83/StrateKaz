"""
MC-002: Modelo de Configuración de Consecutivos
Sistema de Gestión StrateKaz

Define:
- ConsecutivoConfig: Configuración de numeración automática para documentos y registros

Características:
- Numeración automática con formato configurable (prefijo, año, mes, día, sufijo)
- Reinicio automático anual/mensual
- Thread-safe con select_for_update
- Soporte multi-tenant

Ubicación: organizacion (catálogo transversal de la organización)
"""
from datetime import date
from decimal import Decimal

from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

from apps.core.base_models import AuditModel, SoftDeleteModel


# ==============================================================================
# CONSTANTES
# ==============================================================================

CATEGORIA_CONSECUTIVO_CHOICES = [
    ('DOCUMENTOS', 'Documentos'),
    ('COMPRAS', 'Compras'),
    ('VENTAS', 'Ventas'),
    ('INVENTARIO', 'Inventario'),
    ('CONTABILIDAD', 'Contabilidad'),
    ('PRODUCCION', 'Producción'),
    ('CALIDAD', 'Calidad'),
    ('RRHH', 'Recursos Humanos'),
    ('SST', 'Seguridad y Salud'),
    ('AMBIENTAL', 'Gestión Ambiental'),
    ('GENERAL', 'General'),
]

SEPARADOR_CHOICES = [
    ('-', 'Guión (-)'),
    ('/', 'Diagonal (/)'),
    ('_', 'Guión bajo (_)'),
    ('.', 'Punto (.)'),
    ('', 'Sin separador'),
]


# ==============================================================================
# MODELO CONSECUTIVO CONFIG
# ==============================================================================

class ConsecutivoConfig(AuditModel, SoftDeleteModel):
    """
    Configuración de consecutivos para numeración automática.

    Permite configurar el formato de numeración para diferentes tipos de
    documentos o registros con soporte para:
    - Prefijo y sufijo personalizables
    - Inclusión de año, mes o día
    - Reinicio automático anual o mensual
    - Thread-safe para evitar duplicados

    Hereda de:
    - AuditModel: created_at, updated_at, created_by, updated_by
    - SoftDeleteModel: is_active, deleted_at, soft_delete(), restore()

    Ejemplo de formato generado: FAC-2024-00001
    """

    # Identificación
    codigo = models.CharField(
        max_length=50,
        verbose_name='Código',
        help_text='Código único del consecutivo (ej: FACTURA, OC, REQ)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del consecutivo'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción del uso de este consecutivo'
    )
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_CONSECUTIVO_CHOICES,
        default='GENERAL',
        verbose_name='Categoría',
        help_text='Categoría para agrupar consecutivos'
    )

    # Configuración de formato
    prefix = models.CharField(
        max_length=20,
        verbose_name='Prefijo',
        help_text='Prefijo del consecutivo (ej: FAC, OC, REQ)'
    )
    suffix = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Sufijo',
        help_text='Sufijo opcional al final (ej: CO, -A)'
    )
    separator = models.CharField(
        max_length=1,
        choices=SEPARADOR_CHOICES,
        default='-',
        verbose_name='Separador',
        help_text='Caracter separador entre componentes'
    )

    # Configuración de número
    current_number = models.PositiveIntegerField(
        default=0,
        verbose_name='Número Actual',
        help_text='Último número generado'
    )
    padding = models.PositiveSmallIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name='Dígitos de Relleno',
        help_text='Cantidad de dígitos con ceros a la izquierda (1-10)'
    )
    numero_inicial = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Número Inicial',
        help_text='Número desde el cual inicia la secuencia'
    )

    # Componentes de fecha
    include_year = models.BooleanField(
        default=True,
        verbose_name='Incluir Año',
        help_text='Incluir el año en formato YYYY'
    )
    include_month = models.BooleanField(
        default=False,
        verbose_name='Incluir Mes',
        help_text='Incluir el mes en formato MM (requiere año o produce YYYYMM)'
    )
    include_day = models.BooleanField(
        default=False,
        verbose_name='Incluir Día',
        help_text='Incluir el día en formato DD (requiere mes o produce YYYYMMDD)'
    )

    # Reinicio automático
    reset_yearly = models.BooleanField(
        default=True,
        verbose_name='Reinicio Anual',
        help_text='Reiniciar la numeración cada año'
    )
    reset_monthly = models.BooleanField(
        default=False,
        verbose_name='Reinicio Mensual',
        help_text='Reiniciar la numeración cada mes'
    )
    last_reset_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Última Fecha de Reinicio',
        help_text='Fecha del último reinicio de la secuencia'
    )

    # Control
    es_sistema = models.BooleanField(
        default=False,
        verbose_name='Es del Sistema',
        help_text='Indica si es un consecutivo del sistema (no editable)'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    class Meta:
        db_table = 'configuracion_consecutivo'  # Mantener tabla original
        verbose_name = 'Configuración de Consecutivo'
        verbose_name_plural = 'Configuraciones de Consecutivos'
        ordering = ['categoria', 'codigo']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'categoria']),
            models.Index(fields=['empresa_id', 'is_active']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.prefix})"

    def clean(self):
        """Validaciones del modelo."""
        super().clean()

        # Si tiene día, debe tener mes o el formato será YYYYMMDD
        if self.include_day and not self.include_month and not self.include_year:
            raise ValidationError({
                'include_day': 'Si incluye día, debe incluir al menos año o mes'
            })

        # Reinicio mensual implica reinicio más frecuente que anual
        if self.reset_monthly and self.reset_yearly:
            # Ambos activos: mensual tiene prioridad
            pass

    def _check_and_reset(self) -> bool:
        """
        Verifica si es necesario reiniciar el contador.
        Retorna True si se realizó un reinicio.
        """
        today = timezone.now().date()
        needs_reset = False

        if self.last_reset_date is None:
            # Primera vez, establecer fecha
            self.last_reset_date = today
            return False

        if self.reset_monthly:
            # Reinicio mensual: verificar cambio de mes
            if (today.year != self.last_reset_date.year or
                today.month != self.last_reset_date.month):
                needs_reset = True
        elif self.reset_yearly:
            # Reinicio anual: verificar cambio de año
            if today.year != self.last_reset_date.year:
                needs_reset = True

        if needs_reset:
            self.current_number = self.numero_inicial - 1  # Se incrementará después
            self.last_reset_date = today
            return True

        return False

    def get_next_number(self) -> int:
        """
        Obtiene el siguiente número de la secuencia.
        Thread-safe usando select_for_update.

        Returns:
            int: El siguiente número disponible
        """
        with transaction.atomic():
            # Bloquear el registro para evitar race conditions
            locked_config = ConsecutivoConfig.objects.select_for_update().get(pk=self.pk)

            # Verificar y reiniciar si es necesario
            locked_config._check_and_reset()

            # Incrementar
            locked_config.current_number += 1
            locked_config.save(update_fields=['current_number', 'last_reset_date', 'updated_at'])

            # Actualizar instancia actual
            self.current_number = locked_config.current_number
            self.last_reset_date = locked_config.last_reset_date

            return locked_config.current_number

    def format_number(self, number: int, date: date = None) -> str:
        """
        Formatea un número según la configuración.

        Args:
            number: Número a formatear
            date: Fecha para los componentes de fecha (default: hoy)

        Returns:
            str: Consecutivo formateado (ej: FAC-2024-00001)
        """
        if date is None:
            date = timezone.now().date()

        parts = []

        # Prefijo
        if self.prefix:
            parts.append(self.prefix)

        # Componentes de fecha
        if self.include_day:
            # Formato completo YYYYMMDD
            parts.append(date.strftime('%Y%m%d'))
        elif self.include_month:
            # Formato YYYYMM
            parts.append(date.strftime('%Y%m'))
        elif self.include_year:
            # Solo año YYYY
            parts.append(date.strftime('%Y'))

        # Número con padding
        padded_number = str(number).zfill(self.padding)
        parts.append(padded_number)

        # Sufijo
        if self.suffix:
            parts.append(self.suffix)

        # Unir con separador
        return self.separator.join(parts)

    def generate_next(self) -> str:
        """
        Genera el siguiente consecutivo completo.
        Incrementa el contador y retorna el consecutivo formateado.

        Returns:
            str: Consecutivo formateado completo
        """
        if not self.is_active:
            raise ValueError(
                f"El consecutivo '{self.codigo}' está inactivo y no puede generar números."
            )

        next_num = self.get_next_number()
        return self.format_number(next_num)

    def get_ejemplo_formato(self) -> str:
        """
        Obtiene un ejemplo del formato sin incrementar el contador.
        Útil para previsualización.

        Returns:
            str: Ejemplo del siguiente consecutivo
        """
        next_num = self.current_number + 1
        return self.format_number(next_num)

    def preview_format(self, number: int = None) -> str:
        """
        Previsualiza el formato con un número específico.

        Args:
            number: Número a usar (default: siguiente)

        Returns:
            str: Consecutivo formateado
        """
        if number is None:
            number = self.current_number + 1
        return self.format_number(number)

    @classmethod
    def obtener_siguiente_consecutivo(cls, codigo: str, empresa_id: int = None) -> str:
        """
        Método de clase para obtener el siguiente consecutivo por código.

        Args:
            codigo: Código del tipo de consecutivo
            empresa_id: ID de la empresa (opcional, requerido en contexto multi-tenant)

        Returns:
            str: Consecutivo generado

        Raises:
            ConsecutivoConfig.DoesNotExist: Si no existe configuración
            ValueError: Si el consecutivo está inactivo
        """
        filters = {'codigo': codigo}
        if empresa_id is not None:
            filters['empresa_id'] = empresa_id

        try:
            config = cls.objects.get(**filters)
        except cls.DoesNotExist:
            raise cls.DoesNotExist(
                f"No existe configuración de consecutivo para el código '{codigo}'"
            )

        return config.generate_next()

    @classmethod
    def get_choices(cls, empresa_id: int, categoria: str = None) -> list:
        """
        Obtiene opciones para selector de consecutivos.

        Args:
            empresa_id: ID de la empresa
            categoria: Filtrar por categoría (opcional)

        Returns:
            list: Lista de dicts con value/label
        """
        queryset = cls.objects.filter(
            empresa_id=empresa_id,
            is_active=True
        )

        if categoria:
            queryset = queryset.filter(categoria=categoria)

        return [
            {
                'value': c.id,
                'label': f"{c.codigo} - {c.nombre}",
                'codigo': c.codigo,
                'ejemplo': c.get_ejemplo_formato()
            }
            for c in queryset.order_by('categoria', 'codigo')
        ]


# ==============================================================================
# DATOS INICIALES DEL SISTEMA
# ==============================================================================

CONSECUTIVOS_SISTEMA = [
    {
        'codigo': 'FACTURA',
        'nombre': 'Factura de Venta',
        'categoria': 'VENTAS',
        'prefix': 'FAC',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'ORDEN_COMPRA',
        'nombre': 'Orden de Compra',
        'categoria': 'COMPRAS',
        'prefix': 'OC',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'REQUISICION',
        'nombre': 'Requisición de Materiales',
        'categoria': 'COMPRAS',
        'prefix': 'REQ',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'DOCUMENTO',
        'nombre': 'Documento del Sistema de Gestión',
        'categoria': 'DOCUMENTOS',
        'prefix': 'DOC',
        'padding': 4,
        'include_year': True,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'PROCEDIMIENTO',
        'nombre': 'Procedimiento',
        'categoria': 'DOCUMENTOS',
        'prefix': 'PR',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'INSTRUCTIVO',
        'nombre': 'Instructivo',
        'categoria': 'DOCUMENTOS',
        'prefix': 'IN',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'FORMATO',
        'nombre': 'Formato',
        'categoria': 'DOCUMENTOS',
        'prefix': 'FT',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'ACCION_CORRECTIVA',
        'nombre': 'Acción Correctiva',
        'categoria': 'CALIDAD',
        'prefix': 'AC',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'NO_CONFORMIDAD',
        'nombre': 'No Conformidad',
        'categoria': 'CALIDAD',
        'prefix': 'NC',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'INCIDENTE_SST',
        'nombre': 'Incidente de SST',
        'categoria': 'SST',
        'prefix': 'INC',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'PROVEEDOR',
        'nombre': 'Código de Proveedor',
        'categoria': 'COMPRAS',
        'prefix': 'PROV',
        'padding': 5,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
]
