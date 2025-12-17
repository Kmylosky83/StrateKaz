"""
Modelos de Organización - Tab de Dirección Estratégica

Secciones: organigrama, areas, cargos_roles
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class Area(models.Model):
    """
    Modelo para gestionar áreas/departamentos de la organización.

    Estructura jerárquica que permite definir la estructura organizacional
    con centros de costo y responsables asignados.
    """
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Código',
        help_text='Código único del área (ej: GER, OPE, ADM)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del área o departamento'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción de las funciones del área'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Área Padre',
        help_text='Área superior en la jerarquía'
    )
    cost_center = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Centro de Costo',
        help_text='Código del centro de costo asociado'
    )
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_areas',
        verbose_name='Responsable',
        help_text='Usuario responsable del área'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo',
        db_index=True
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='areas_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'organizacion_area'
        verbose_name = 'Área'
        verbose_name_plural = 'Áreas'
        ordering = ['order', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
            models.Index(fields=['parent']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def children_count(self):
        """Cuenta el número de subáreas"""
        return self.children.filter(is_active=True).count()

    @property
    def full_path(self):
        """Retorna la ruta completa del área (ej: Gerencia > Operaciones > Logística)"""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return ' > '.join(path)

    @property
    def level(self):
        """Retorna el nivel de profundidad en la jerarquía (0 = raíz)"""
        level = 0
        parent = self.parent
        while parent:
            level += 1
            parent = parent.parent
        return level

    def get_all_children(self):
        """Retorna todas las subáreas recursivamente"""
        children = list(self.children.filter(is_active=True))
        for child in self.children.filter(is_active=True):
            children.extend(child.get_all_children())
        return children

    def clean(self):
        """Validaciones del modelo"""
        from django.core.exceptions import ValidationError

        # Evitar que un área sea su propio padre
        if self.parent and self.parent.id == self.id:
            raise ValidationError({'parent': 'Un área no puede ser su propio padre.'})

        # Evitar ciclos en la jerarquía
        if self.parent:
            parent = self.parent
            while parent:
                if parent.id == self.id:
                    raise ValidationError({'parent': 'Se detectó un ciclo en la jerarquía de áreas.'})
                parent = parent.parent


# =============================================================================
# CATEGORÍA DE DOCUMENTO - Dinámica y configurable
# =============================================================================

class CategoriaDocumento(models.Model):
    """
    Categoría de Documento - Configurable dinámicamente.

    Permite agrupar tipos de documentos en categorías personalizables
    para mejor organización y filtrado en el frontend.
    """

    code = models.CharField(
        max_length=30,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la categoría (ej: FINANCIERO, COMPRAS)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la categoría'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    color = models.CharField(
        max_length=20,
        default='gray',
        verbose_name='Color',
        help_text='Color para badges en el frontend (ej: blue, green, red, gray)'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Icono',
        help_text='Nombre del icono Lucide (ej: FileText, DollarSign, Package)'
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name='Es del sistema',
        help_text='Las categorías del sistema no pueden eliminarse'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado')

    class Meta:
        db_table = 'organizacion_categoria_documento'
        verbose_name = 'Categoría de Documento'
        verbose_name_plural = 'Categorías de Documento'
        unique_together = [['code']]
        ordering = ['order', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
            models.Index(fields=['order']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def puede_eliminar(self):
        """
        Verifica si la categoría puede ser eliminada.

        Returns:
            tuple: (bool, str) - (puede_eliminar, mensaje)
        """
        if self.is_system:
            return (False, 'No se puede eliminar una categoría del sistema.')

        if self.tipos_documento.exists():
            count = self.tipos_documento.count()
            return (
                False,
                f'No se puede eliminar. Tiene {count} tipo(s) de documento asociado(s).'
            )

        return (True, 'Puede eliminarse.')

    @property
    def count_tipos(self):
        """Cuenta el número de tipos de documento asociados"""
        return self.tipos_documento.filter(is_active=True).count()


# =============================================================================
# TIPO DE DOCUMENTO - Configurable por empresa
# =============================================================================

class TipoDocumento(models.Model):
    """
    Tipo de Documento - Configurable por empresa para consecutivos.

    17 tipos universales predefinidos del sistema (is_system=True).
    Las empresas pueden crear tipos custom adicionales.
    """

    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo (ej: FACTURA, ORDEN_COMPRA)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo (ej: Factura de Venta)'
    )
    categoria = models.ForeignKey(
        'CategoriaDocumento',
        on_delete=models.PROTECT,
        related_name='tipos_documento',
        verbose_name='Categoría',
        help_text='Categoría a la que pertenece este tipo de documento'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    prefijo_sugerido = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Prefijo Sugerido',
        help_text='Prefijo sugerido para el consecutivo (ej: FAC, OC, NC)'
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name='Es del sistema',
        help_text='Los tipos del sistema no pueden eliminarse ni editarse (excepto is_active)'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tipos_documento_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'organizacion_tipo_documento'
        verbose_name = 'Tipo de Documento'
        verbose_name_plural = 'Tipos de Documento'
        ordering = ['categoria__order', 'order', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['categoria']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_system']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def puede_eliminar(self):
        """
        Verifica si el tipo de documento puede ser eliminado.

        Returns:
            tuple: (bool, str) - (puede_eliminar, mensaje)
        """
        if self.is_system:
            return (False, 'No se puede eliminar un tipo de documento del sistema.')

        if hasattr(self, 'consecutivo_config'):
            return (False, 'No se puede eliminar. Tiene un consecutivo configurado.')

        return (True, 'Puede eliminarse.')

    @property
    def tiene_consecutivo(self):
        """Verifica si tiene consecutivo configurado"""
        return hasattr(self, 'consecutivo_config')


# =============================================================================
# CONSECUTIVO CONFIG - Numeración automática centralizada
# =============================================================================

class ConsecutivoConfig(models.Model):
    """
    Configuración de Consecutivos - Numeración automática centralizada.

    Formato simplificado: PREFIX-YYYY-00001
    Sin incluir área/proceso (simplificación).
    """

    SEPARATOR_CHOICES = [
        ('-', 'Guión (-)'),
        ('/', 'Diagonal (/)'),
        ('_', 'Guión bajo (_)'),
        ('', 'Sin separador'),
    ]

    tipo_documento = models.OneToOneField(
        TipoDocumento,
        on_delete=models.PROTECT,
        related_name='consecutivo_config',
        verbose_name='Tipo de Documento'
    )
    prefix = models.CharField(
        max_length=10,
        verbose_name='Prefijo',
        help_text='Prefijo del consecutivo (ej: FAC, OC, NC)'
    )
    suffix = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name='Sufijo'
    )
    current_number = models.IntegerField(
        default=0,
        verbose_name='Número Actual'
    )
    padding = models.IntegerField(
        default=5,
        verbose_name='Relleno',
        help_text='Dígitos con ceros (5 = 00001)'
    )
    include_year = models.BooleanField(default=True, verbose_name='Incluir Año')
    include_month = models.BooleanField(default=False, verbose_name='Incluir Mes')
    include_day = models.BooleanField(default=False, verbose_name='Incluir Día')
    separator = models.CharField(
        max_length=1,
        choices=SEPARATOR_CHOICES,
        default='-',
        verbose_name='Separador'
    )
    reset_yearly = models.BooleanField(default=True, verbose_name='Reiniciar Anualmente')
    reset_monthly = models.BooleanField(default=False, verbose_name='Reiniciar Mensualmente')
    last_reset_date = models.DateField(blank=True, null=True, verbose_name='Última Fecha Reinicio')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'organizacion_consecutivo_config'
        verbose_name = 'Configuración de Consecutivo'
        verbose_name_plural = 'Configuraciones de Consecutivos'
        ordering = ['tipo_documento__categoria__order', 'tipo_documento__name']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['tipo_documento']),
        ]

    def __str__(self):
        return f"{self.tipo_documento.name} - {self.prefix}"

    def get_next_number(self):
        """Obtiene el siguiente número consecutivo (thread-safe)."""
        from django.db import transaction

        with transaction.atomic():
            config = ConsecutivoConfig.objects.select_for_update().get(pk=self.pk)
            today = timezone.now().date()
            should_reset = False

            if config.reset_yearly and config.last_reset_date:
                if config.last_reset_date.year < today.year:
                    should_reset = True

            if config.reset_monthly and config.last_reset_date:
                if (config.last_reset_date.year < today.year or
                    config.last_reset_date.month < today.month):
                    should_reset = True

            if should_reset:
                config.current_number = 0
                config.last_reset_date = today

            config.current_number += 1
            config.save(update_fields=['current_number', 'last_reset_date', 'updated_at'])

            return config.current_number

    def format_number(self, number=None, date=None):
        """
        Formatea el número consecutivo según la configuración.

        Formato simplificado: PREFIX-YYYY-00001 (sin área).
        """
        if number is None:
            number = self.current_number
        if date is None:
            date = timezone.now().date()

        sep = self.separator or ''
        parts = [self.prefix]

        # Agregar fecha según configuración
        if self.include_day:
            parts.append(date.strftime('%Y%m%d'))
        elif self.include_month:
            parts.append(f"{date.year}{str(date.month).zfill(2)}")
        elif self.include_year:
            parts.append(str(date.year))

        # Agregar número con padding
        parts.append(str(number).zfill(self.padding))

        result = sep.join(parts)

        if self.suffix:
            result = f"{result}{sep}{self.suffix}"

        return result

    def get_ejemplo_formato(self):
        """Retorna un ejemplo del formato del consecutivo con el siguiente número."""
        return self.format_number(number=self.current_number + 1)

    def generate_next(self):
        """Genera el siguiente consecutivo completo."""
        next_number = self.get_next_number()
        return self.format_number(next_number)

    @classmethod
    def obtener_siguiente_consecutivo(cls, tipo_documento_code):
        """
        Servicio centralizado para obtener el siguiente consecutivo.

        Args:
            tipo_documento_code: Código del tipo de documento

        Returns:
            str: Consecutivo formateado completo

        Raises:
            DoesNotExist: Si no existe configuración para el tipo
            ValueError: Si el consecutivo está inactivo
        """
        try:
            config = cls.objects.select_related('tipo_documento').get(
                tipo_documento__code=tipo_documento_code
            )
        except cls.DoesNotExist:
            raise cls.DoesNotExist(
                f"No existe configuración de consecutivo para '{tipo_documento_code}'. "
                f"Debe crear una configuración en Organización > Consecutivos."
            )

        if not config.is_active:
            raise ValueError(f"El consecutivo para '{tipo_documento_code}' está inactivo.")

        return config.generate_next()
