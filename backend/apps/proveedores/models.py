"""
Modelos del módulo Proveedores - Sistema de Gestión StrateKaz

Define:
- UnidadNegocio: Unidades internas de la organización
- Proveedor: Tres tipos (MATERIA_PRIMA_EXTERNO, UNIDAD_NEGOCIO, PRODUCTO_SERVICIO)
- HistorialPrecioProveedor: Auditoría de cambios de precio
- CondicionComercialProveedor: Condiciones comerciales para productos/servicios
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from .constants import (
    TIPO_CUENTA_CHOICES,
    DEPARTAMENTOS_COLOMBIA,
    TIPO_MATERIA_PRIMA_CHOICES,
    CODIGO_MATERIA_PRIMA_CHOICES,
    CODIGOS_MATERIA_PRIMA_VALIDOS,
    CODIGO_A_TIPO_PRINCIPAL,
    SUBTIPO_MATERIA_LEGACY_CHOICES,
    NEW_TO_LEGACY_MAPPING,
)


class UnidadNegocio(models.Model):
    """
    Modelo de Unidad de Negocio - Unidades internas de la organización

    Ejemplos: Plantas de producción, Sucursales, Sedes administrativas
    Estas unidades pueden ser proveedoras de materia prima para StrateKaz
    """

    TIPO_UNIDAD_CHOICES = [
        ('SEDE', 'Sede Administrativa'),
        ('SUCURSAL', 'Sucursal'),
        ('PLANTA', 'Planta de Producción'),
        ('CENTRO_ACOPIO', 'Centro de Acopio'),
        ('ALMACEN', 'Almacén'),
        ('OTRO', 'Otro'),
    ]

    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la unidad de negocio (ej: PLANTA_BOG_01)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre de la unidad de negocio'
    )
    tipo_unidad = models.CharField(
        max_length=20,
        choices=TIPO_UNIDAD_CHOICES,
        verbose_name='Tipo de unidad',
        help_text='Tipo de unidad de negocio'
    )
    direccion = models.TextField(
        verbose_name='Dirección',
        help_text='Dirección completa de la unidad'
    )
    ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad'
    )
    departamento = models.CharField(
        max_length=100,
        choices=DEPARTAMENTOS_COLOMBIA,
        verbose_name='Departamento',
        help_text='Departamento de Colombia'
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='unidades_negocio_responsable',
        null=True,
        blank=True,
        verbose_name='Responsable',
        help_text='Usuario responsable de la unidad de negocio'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si la unidad de negocio está activa'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de eliminación',
        help_text='Fecha de eliminación lógica (soft delete)'
    )

    class Meta:
        db_table = 'proveedores_unidad_negocio'
        verbose_name = 'Unidad de Negocio'
        verbose_name_plural = 'Unidades de Negocio'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active', 'tipo_unidad']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

    @property
    def is_deleted(self):
        """Verifica si la unidad está eliminada lógicamente"""
        return self.deleted_at is not None

    def soft_delete(self):
        """Eliminación lógica de la unidad de negocio"""
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def restore(self):
        """Restaura una unidad de negocio eliminada lógicamente"""
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])


class Proveedor(models.Model):
    """
    Modelo de Proveedor - Tres tipos de proveedores

    1. MATERIA_PRIMA_EXTERNO: Proveedores externos de sebo, hueso o ACU
    2. UNIDAD_NEGOCIO: Unidades internas que proveen materia prima
    3. PRODUCTO_SERVICIO: Proveedores de insumos/servicios (NO materias primas)
    """

    TIPO_PROVEEDOR_CHOICES = [
        ('MATERIA_PRIMA_EXTERNO', 'Proveedor Externo de Materia Prima'),
        ('UNIDAD_NEGOCIO', 'Unidad de Negocio Interna'),
        ('PRODUCTO_SERVICIO', 'Proveedor de Productos/Servicios'),
    ]

    # Tipos principales de materia prima que maneja el proveedor
    # Usado para filtros y agrupaciones de alto nivel
    TIPO_MATERIA_CHOICES = TIPO_MATERIA_PRIMA_CHOICES

    # LEGACY: Mantener para compatibilidad con datos existentes
    # Los nuevos proveedores usarán tipos_materia_prima (JSONField con códigos completos)
    SUBTIPO_MATERIA_CHOICES = SUBTIPO_MATERIA_LEGACY_CHOICES

    MODALIDAD_LOGISTICA_CHOICES = [
        ('ENTREGA_PLANTA', 'Entrega en Planta'),
        ('COMPRA_EN_PUNTO', 'Compra en Punto de Recolección'),
    ]

    TIPO_DOCUMENTO_CHOICES = [
        ('CC', 'Cédula de Ciudadanía'),
        ('CE', 'Cédula de Extranjería'),
        ('NIT', 'NIT'),
        ('PASSPORT', 'Pasaporte'),
    ]

    FORMA_PAGO_CHOICES = [
        ('CONTADO', 'Contado'),
        ('CHEQUE', 'Cheque'),
        ('TRANSFERENCIA', 'Transferencia Bancaria'),
        ('CREDITO', 'Crédito'),
        ('OTRO', 'Otro'),
    ]

    # Código interno autogenerado
    codigo_interno = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código interno',
        help_text='Código único autogenerado (MP-0001 para materia prima, PS-0001 para productos/servicios)'
    )

    # Identificación del tipo de proveedor
    tipo_proveedor = models.CharField(
        max_length=30,
        choices=TIPO_PROVEEDOR_CHOICES,
        db_index=True,
        verbose_name='Tipo de proveedor',
        help_text='Tipo de proveedor según su naturaleza'
    )

    # Campos específicos para proveedores de materia prima
    subtipo_materia = models.JSONField(
        default=list,
        null=True,
        blank=True,
        verbose_name='Tipos de materia prima',
        help_text='Lista de tipos de materia prima (SEBO, HUESO, ACU). Solo para proveedores de materia prima externos'
    )

    # Campo específico para proveedores externos de materia prima
    modalidad_logistica = models.CharField(
        max_length=20,
        choices=MODALIDAD_LOGISTICA_CHOICES,
        null=True,
        blank=True,
        verbose_name='Modalidad logística',
        help_text='Solo para proveedores externos de materia prima'
    )

    # Información básica
    nombre_comercial = models.CharField(
        max_length=200,
        db_index=True,
        verbose_name='Nombre comercial',
        help_text='Nombre comercial del proveedor'
    )
    razon_social = models.CharField(
        max_length=200,
        verbose_name='Razón social',
        help_text='Razón social del proveedor (nombre legal)'
    )
    tipo_documento = models.CharField(
        max_length=10,
        choices=TIPO_DOCUMENTO_CHOICES,
        default='NIT',
        verbose_name='Tipo de documento'
    )
    numero_documento = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Número de documento',
        help_text='Número de identificación único'
    )
    nit = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='NIT',
        help_text='Número de Identificación Tributaria (si aplica)'
    )

    # Contacto
    telefono = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='Teléfono'
    )
    email = models.EmailField(
        null=True,
        blank=True,
        verbose_name='Email'
    )
    direccion = models.TextField(
        verbose_name='Dirección'
    )
    ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad'
    )
    departamento = models.CharField(
        max_length=100,
        choices=DEPARTAMENTOS_COLOMBIA,
        verbose_name='Departamento',
        help_text='Departamento de Colombia'
    )

    # Relación con Unidad de Negocio (solo para tipo UNIDAD_NEGOCIO)
    unidad_negocio = models.ForeignKey(
        UnidadNegocio,
        on_delete=models.PROTECT,
        related_name='proveedores',
        null=True,
        blank=True,
        verbose_name='Unidad de negocio',
        help_text='Solo para proveedores tipo Unidad de Negocio'
    )

    # NOTA: Los precios por kg ahora se manejan en la tabla relacionada PrecioMateriaPrima
    # Cada tipo de materia prima (SEBO, HUESO, ACU) tiene su propio precio independiente

    # Información financiera (principalmente para PRODUCTO_SERVICIO)
    formas_pago = models.JSONField(
        default=list,
        null=True,
        blank=True,
        verbose_name='Formas de pago',
        help_text='Lista de formas de pago acordadas (CONTADO, CREDITO_15, CREDITO_30, etc.)'
    )
    dias_plazo_pago = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Días plazo de pago',
        help_text='Días de plazo para pago (si aplica crédito)'
    )

    # Información bancaria
    banco = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='Banco'
    )
    tipo_cuenta = models.CharField(
        max_length=20,
        choices=TIPO_CUENTA_CHOICES,
        null=True,
        blank=True,
        verbose_name='Tipo de cuenta',
        help_text='Tipo de cuenta bancaria'
    )
    numero_cuenta = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        verbose_name='Número de cuenta'
    )
    titular_cuenta = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name='Titular de cuenta',
        help_text='Nombre del titular de la cuenta bancaria'
    )

    # Metadatos
    observaciones = models.TextField(
        null=True,
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones adicionales sobre el proveedor'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si el proveedor está activo'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='proveedores_creados',
        null=True,
        blank=True,
        verbose_name='Creado por',
        help_text='Usuario que creó el proveedor'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de eliminación',
        help_text='Fecha de eliminación lógica (soft delete)'
    )

    class Meta:
        db_table = 'proveedores_proveedor'
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['nombre_comercial']
        indexes = [
            models.Index(fields=['tipo_proveedor', 'is_active']),
            models.Index(fields=['numero_documento']),
            models.Index(fields=['nombre_comercial']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.nombre_comercial} ({self.get_tipo_proveedor_display()})"

    @staticmethod
    def generar_codigo_interno(tipo_proveedor):
        """
        Genera el siguiente código interno único para un proveedor según su tipo.

        Usa el sistema centralizado de consecutivos (ConsecutivoConfig).

        Prefijos:
        - MP: Materia Prima (MATERIA_PRIMA_EXTERNO y UNIDAD_NEGOCIO) -> PROVEEDOR_MP
        - PS: Productos y Servicios (PRODUCTO_SERVICIO) -> PROVEEDOR_PS

        Formato: MP-0001, PS-0001, etc.
        """
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

        # Determinar tipo de documento según tipo de proveedor
        if tipo_proveedor == 'PRODUCTO_SERVICIO':
            document_type = 'PROVEEDOR_PS'
        else:
            # MATERIA_PRIMA_EXTERNO y UNIDAD_NEGOCIO usan PROVEEDOR_MP
            document_type = 'PROVEEDOR_MP'

        try:
            return ConsecutivoConfig.obtener_siguiente_consecutivo(document_type)
        except ConsecutivoConfig.DoesNotExist:
            # Fallback al método legacy si no existe configuración
            # Esto permite que el sistema funcione durante la migración
            if tipo_proveedor == 'PRODUCTO_SERVICIO':
                prefijo = 'PS'
            else:
                prefijo = 'MP'

            ultimo = Proveedor.objects.filter(
                codigo_interno__startswith=f'{prefijo}-'
            ).order_by('-codigo_interno').first()

            if ultimo and ultimo.codigo_interno:
                try:
                    numero = int(ultimo.codigo_interno.split('-')[1]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1

            return f'{prefijo}-{numero:04d}'

    @property
    def is_deleted(self):
        """Verifica si el proveedor está eliminado lógicamente"""
        return self.deleted_at is not None

    @property
    def es_proveedor_materia_prima(self):
        """Verifica si es proveedor de materia prima (externo o unidad de negocio)"""
        return self.tipo_proveedor in ['MATERIA_PRIMA_EXTERNO', 'UNIDAD_NEGOCIO']

    def soft_delete(self):
        """Eliminación lógica del proveedor"""
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def restore(self):
        """Restaura un proveedor eliminado lógicamente"""
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    @property
    def subtipo_materia_display(self):
        """Retorna los subtipos/códigos de materia prima en formato legible"""
        if not self.subtipo_materia or not isinstance(self.subtipo_materia, list):
            return None

        # Combinar diccionarios legacy y nuevos códigos
        from .constants import CODIGO_MATERIA_PRIMA_DICT
        display_map = dict(self.SUBTIPO_MATERIA_CHOICES)
        display_map.update(CODIGO_MATERIA_PRIMA_DICT)

        return [display_map.get(codigo, codigo) for codigo in self.subtipo_materia]

    @property
    def formas_pago_display(self):
        """Retorna las formas de pago en formato legible"""
        if not self.formas_pago or not isinstance(self.formas_pago, list):
            return None

        display_map = dict(self.FORMA_PAGO_CHOICES)
        return [display_map.get(forma, forma) for forma in self.formas_pago]

    def save(self, *args, **kwargs):
        """
        Sobrescribe save para generar código interno automáticamente
        """
        # Generar código interno si es nuevo registro
        if not self.pk and not self.codigo_interno:
            self.codigo_interno = self.generar_codigo_interno(self.tipo_proveedor)

        super().save(*args, **kwargs)

    def clean(self):
        """
        Validaciones personalizadas según tipo de proveedor

        Reglas de negocio:
        - MATERIA_PRIMA_EXTERNO: Debe tener subtipo_materia (array), modalidad_logistica. Precios por materia en tabla PrecioMateriaPrima
        - UNIDAD_NEGOCIO: Puede tener subtipo_materia (NO unidad_negocio, NO modalidad_logistica). Precios por materia en tabla PrecioMateriaPrima
        - PRODUCTO_SERVICIO: NO puede tener subtipo_materia. NO tiene precios por kg
        """
        super().clean()

        # Validaciones para MATERIA_PRIMA_EXTERNO
        if self.tipo_proveedor == 'MATERIA_PRIMA_EXTERNO':
            # Validar subtipo_materia (debe ser lista no vacía)
            if not self.subtipo_materia or not isinstance(self.subtipo_materia, list) or len(self.subtipo_materia) == 0:
                raise ValidationError({
                    'subtipo_materia': 'Debe especificar al menos un tipo de materia prima'
                })

            # Validar que todos los códigos sean válidos (aceptar tanto códigos nuevos como legacy)
            valid_codigos = CODIGOS_MATERIA_PRIMA_VALIDOS
            valid_legacy = [choice[0] for choice in self.SUBTIPO_MATERIA_CHOICES]
            for codigo in self.subtipo_materia:
                if codigo not in valid_codigos and codigo not in valid_legacy:
                    raise ValidationError({
                        'subtipo_materia': f'Código "{codigo}" no es válido'
                    })

            if not self.modalidad_logistica:
                raise ValidationError({
                    'modalidad_logistica': 'Debe especificar la modalidad logística (ENTREGA_PLANTA o COMPRA_EN_PUNTO)'
                })

            # NOTA: Los precios por kg ahora se manejan en la tabla PrecioMateriaPrima
            # Cada tipo de materia prima tiene su propio precio

            if self.unidad_negocio is not None:
                raise ValidationError({
                    'unidad_negocio': 'Proveedor externo no puede tener unidad de negocio asociada'
                })

        # Validaciones para UNIDAD_NEGOCIO
        elif self.tipo_proveedor == 'UNIDAD_NEGOCIO':
            # NOTA: UNIDAD_NEGOCIO es un TIPO/IDENTIFICADOR que indica que el proveedor
            # es una unidad semi-independiente de la empresa (tiene estructura interna propia)
            # - SÍ puede tener subtipo_materia (SEBO, HUESO, ACU)
            # - NO necesita vincular a unidad_negocio (el proveedor mismo ES la unidad)
            # - Cada tipo de materia prima tiene su propio precio (tabla PrecioMateriaPrima)
            # - NO debe tener modalidad_logistica

            # NOTA: Los precios por kg ahora se manejan en la tabla PrecioMateriaPrima
            # Cada tipo de materia prima tiene su propio precio de transferencia interno

            if self.modalidad_logistica is not None:
                raise ValidationError({
                    'modalidad_logistica': 'Unidad de negocio no requiere modalidad logística'
                })

        # Validaciones para PRODUCTO_SERVICIO
        elif self.tipo_proveedor == 'PRODUCTO_SERVICIO':
            if self.subtipo_materia is not None and self.subtipo_materia != []:
                raise ValidationError({
                    'subtipo_materia': 'Proveedor de productos/servicios no debe tener tipo de materia prima'
                })

            if self.modalidad_logistica is not None:
                raise ValidationError({
                    'modalidad_logistica': 'Proveedor de productos/servicios no requiere modalidad logística'
                })

            if self.unidad_negocio is not None:
                raise ValidationError({
                    'unidad_negocio': 'Proveedor de productos/servicios no puede tener unidad de negocio'
                })


class PrecioMateriaPrima(models.Model):
    """
    Modelo de Precio por Tipo de Materia Prima

    Permite que un proveedor tenga múltiples precios, uno por cada código de materia prima.
    Los códigos incluyen toda la jerarquía:
    - HUESO_BLANDO, HUESO_DURO, HUESO_MIXTO
    - SEBO_CRUDO, SEBO_PROCESADO_A, SEBO_PROCESADO_B, SEBO_PROCESADO_B1, etc.
    - CABEZAS
    - ACU

    Solo el Gerente puede modificar estos precios.
    """

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='precios_materia_prima',
        verbose_name='Proveedor',
        help_text='Proveedor al que pertenece este precio'
    )
    tipo_materia = models.CharField(
        max_length=25,  # Aumentado para soportar códigos más largos como SEBO_CRUDO_CARNICERIA
        choices=CODIGO_MATERIA_PRIMA_CHOICES,
        verbose_name='Código de materia prima',
        help_text='Código específico de materia prima (ej: HUESO_CRUDO, SEBO_PROCESADO_A)'
    )
    precio_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio por kg',
        help_text='Precio de compra por kilogramo'
    )
    modificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='precios_materia_modificados',
        verbose_name='Modificado por',
        help_text='Usuario (Gerente) que modificó el precio'
    )
    modificado_fecha = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de modificación',
        help_text='Fecha de la última modificación del precio'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'proveedores_precio_materia_prima'
        verbose_name = 'Precio de Materia Prima'
        verbose_name_plural = 'Precios de Materias Primas'
        ordering = ['proveedor', 'tipo_materia']
        unique_together = [['proveedor', 'tipo_materia']]  # Un solo precio por tipo de materia por proveedor
        indexes = [
            models.Index(fields=['proveedor', 'tipo_materia']),
            models.Index(fields=['tipo_materia']),
        ]

    def __str__(self):
        return f"{self.proveedor.nombre_comercial} - {self.get_tipo_materia_display()}: ${self.precio_kg}/kg"

    @property
    def tipo_principal(self):
        """Retorna el tipo principal de materia prima (HUESO, SEBO, CABEZAS, ACU)"""
        return CODIGO_A_TIPO_PRINCIPAL.get(self.tipo_materia, self.tipo_materia)

    @property
    def tipo_legacy(self):
        """Retorna el tipo legacy de materia prima para validación con subtipo_materia del proveedor"""
        return NEW_TO_LEGACY_MAPPING.get(self.tipo_materia, self.tipo_materia)

    def clean(self):
        """Validaciones personalizadas"""
        super().clean()

        # Validar que el precio sea positivo
        if self.precio_kg is not None and self.precio_kg < 0:
            raise ValidationError({
                'precio_kg': 'El precio no puede ser negativo'
            })

        # Validar que el código de materia prima sea válido
        if self.tipo_materia and self.tipo_materia not in CODIGOS_MATERIA_PRIMA_VALIDOS:
            raise ValidationError({
                'tipo_materia': f'Código de materia prima "{self.tipo_materia}" no es válido'
            })

        # Validar que el código esté en la lista del proveedor
        # Los proveedores almacenan tipos legacy (SEBO, HUESO, etc.)
        # pero los códigos de precio son específicos (HUESO_CRUDO, SEBO_CRUDO_CARNICERIA, etc.)
        if self.proveedor and self.proveedor.subtipo_materia:
            # Verificar si el código está directamente en la lista del proveedor
            if self.tipo_materia not in self.proveedor.subtipo_materia:
                # Si no está, verificar si el proveedor tiene el tipo legacy correspondiente
                tipo_legacy = self.tipo_legacy
                if tipo_legacy not in self.proveedor.subtipo_materia:
                    raise ValidationError({
                        'tipo_materia': f'El proveedor no maneja {self.tipo_materia}'
                    })


class HistorialPrecioProveedor(models.Model):
    """
    Modelo de Historial de Precios de Proveedores

    Auditoría de todos los cambios de precio de proveedores de materia prima
    Permite rastrear quién modificó precios, cuándo y por qué
    """

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='historial_precios',
        verbose_name='Proveedor'
    )
    tipo_materia = models.CharField(
        max_length=25,  # Aumentado para soportar códigos más largos como SEBO_CRUDO_CARNICERIA
        choices=CODIGO_MATERIA_PRIMA_CHOICES,
        null=True,
        blank=True,
        verbose_name='Código de materia prima',
        help_text='Código específico de materia prima (ej: HUESO_CRUDO, SEBO_PROCESADO_A)'
    )
    precio_anterior = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio anterior',
        help_text='Precio anterior por kg (null si es el primer precio)'
    )
    precio_nuevo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio nuevo',
        help_text='Nuevo precio por kg'
    )
    modificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='historiales_precio_proveedor',
        verbose_name='Modificado por',
        help_text='Usuario que realizó el cambio de precio'
    )
    motivo = models.TextField(
        verbose_name='Motivo del cambio',
        help_text='Justificación del cambio de precio'
    )
    fecha_modificacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de modificación',
        help_text='Fecha y hora del cambio de precio'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    class Meta:
        db_table = 'proveedores_historial_precio'
        verbose_name = 'Historial de Precio'
        verbose_name_plural = 'Historiales de Precios'
        ordering = ['-fecha_modificacion']
        indexes = [
            models.Index(fields=['proveedor', '-fecha_modificacion']),
            models.Index(fields=['modificado_por']),
        ]

    def __str__(self):
        return f"{self.proveedor.nombre_comercial} - {self.get_tipo_materia_display()}: {self.precio_anterior} -> {self.precio_nuevo}"

    @property
    def variacion_precio(self):
        """Calcula la variación porcentual del precio"""
        if self.precio_anterior is None or self.precio_anterior == 0:
            return None

        variacion = ((self.precio_nuevo - self.precio_anterior) / self.precio_anterior) * 100
        return round(variacion, 2)

    @property
    def tipo_cambio(self):
        """Retorna si fue aumento, reducción o sin cambio"""
        if self.precio_anterior is None:
            return 'INICIAL'
        elif self.precio_nuevo > self.precio_anterior:
            return 'AUMENTO'
        elif self.precio_nuevo < self.precio_anterior:
            return 'REDUCCION'
        else:
            return 'SIN_CAMBIO'


class CondicionComercialProveedor(models.Model):
    """
    Modelo de Condiciones Comerciales de Proveedores

    Para proveedores de PRODUCTO_SERVICIO, se registran condiciones comerciales
    específicas en lugar de precio por kg
    """

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='condiciones_comerciales',
        verbose_name='Proveedor'
    )
    descripcion = models.CharField(
        max_length=200,
        verbose_name='Descripción',
        help_text='Descripción de la condición comercial (ej: Descuento por volumen)'
    )
    valor_acordado = models.TextField(
        verbose_name='Valor acordado',
        help_text='Detalle del valor o descuento acordado'
    )
    forma_pago = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='Forma de pago',
        help_text='Forma de pago específica para esta condición'
    )
    plazo_entrega = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='Plazo de entrega',
        help_text='Plazo de entrega acordado'
    )
    garantias = models.TextField(
        null=True,
        blank=True,
        verbose_name='Garantías',
        help_text='Garantías ofrecidas por el proveedor'
    )
    vigencia_desde = models.DateField(
        verbose_name='Vigencia desde',
        help_text='Fecha desde la cual es válida la condición'
    )
    vigencia_hasta = models.DateField(
        null=True,
        blank=True,
        verbose_name='Vigencia hasta',
        help_text='Fecha hasta la cual es válida la condición (null = indefinida)'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='condiciones_comerciales_creadas',
        null=True,
        blank=True,
        verbose_name='Creado por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'proveedores_condicion_comercial'
        verbose_name = 'Condición Comercial'
        verbose_name_plural = 'Condiciones Comerciales'
        ordering = ['-vigencia_desde']
        indexes = [
            models.Index(fields=['proveedor', '-vigencia_desde']),
            models.Index(fields=['vigencia_desde', 'vigencia_hasta']),
        ]

    def __str__(self):
        return f"{self.proveedor.nombre_comercial} - {self.descripcion}"

    @property
    def esta_vigente(self):
        """Verifica si la condición comercial está vigente"""
        from datetime import date

        hoy = date.today()

        if self.vigencia_hasta is None:
            return hoy >= self.vigencia_desde

        return self.vigencia_desde <= hoy <= self.vigencia_hasta

    def clean(self):
        """Validaciones personalizadas"""
        super().clean()

        # Validar que solo proveedores de PRODUCTO_SERVICIO tengan condiciones comerciales
        if self.proveedor and self.proveedor.tipo_proveedor != 'PRODUCTO_SERVICIO':
            raise ValidationError({
                'proveedor': 'Solo proveedores de tipo PRODUCTO_SERVICIO pueden tener condiciones comerciales'
            })

        # Validar fechas
        if self.vigencia_hasta and self.vigencia_desde > self.vigencia_hasta:
            raise ValidationError({
                'vigencia_hasta': 'La fecha de fin de vigencia debe ser posterior a la fecha de inicio'
            })


def prueba_acidez_upload_path(instance, filename):
    """Genera la ruta de subida para fotos de pruebas de acidez"""
    import os
    from datetime import date
    ext = filename.split('.')[-1]
    today = date.today()
    # Formato: pruebas_acidez/2024/11/PROV_123/foto_20241126_001.jpg
    new_filename = f"foto_{today.strftime('%Y%m%d')}_{instance.proveedor_id or 'temp'}.{ext}"
    return os.path.join('pruebas_acidez', str(today.year), str(today.month).zfill(2), new_filename)


class PruebaAcidez(models.Model):
    """
    Modelo de Prueba de Acidez - Para determinar calidad del sebo procesado

    Cuando un proveedor llega con sebo procesado, se realiza una prueba de acidez
    para determinar su calidad (A, B, B1, B2, B4, C) según el nivel de acidez.

    La prueba incluye:
    - Foto de la prueba realizada
    - Valor de acidez medido (%)
    - Calidad resultante (determinada automáticamente)
    - Observaciones del operario
    """

    CALIDAD_SEBO_CHOICES = [
        ('A', 'Calidad A (Acidez < 3%)'),
        ('B', 'Calidad B (Acidez 3-5%)'),
        ('B1', 'Calidad B1 (Acidez 5-8%)'),
        ('B2', 'Calidad B2 (Acidez 8-12%)'),
        ('B4', 'Calidad B4 (Acidez 12-15%)'),
        ('C', 'Calidad C (Acidez > 15%)'),
    ]

    # Rangos de acidez para cada calidad (límite inferior, límite superior)
    RANGOS_ACIDEZ = {
        'A': (0, 3),
        'B': (3, 5),
        'B1': (5, 8),
        'B2': (8, 12),
        'B4': (12, 15),
        'C': (15, 100),  # Sin límite superior real
    }

    # ============ RELACIONES ============
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE,
        related_name='pruebas_acidez',
        verbose_name='Proveedor',
        help_text='Proveedor del sebo procesado'
    )

    # ============ DATOS DE LA PRUEBA ============
    fecha_prueba = models.DateTimeField(
        verbose_name='Fecha de prueba',
        help_text='Fecha y hora en que se realizó la prueba'
    )
    valor_acidez = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Valor de acidez (%)',
        help_text='Porcentaje de acidez medido en la prueba'
    )
    calidad_resultante = models.CharField(
        max_length=2,
        choices=CALIDAD_SEBO_CHOICES,
        verbose_name='Calidad resultante',
        help_text='Calidad del sebo según el nivel de acidez (calculada automáticamente)'
    )
    codigo_materia = models.CharField(
        max_length=20,
        verbose_name='Código de materia prima',
        help_text='Código completo de materia prima resultante (ej: SEBO_PROCESADO_A)',
        editable=False  # Se calcula automáticamente
    )

    # ============ EVIDENCIA FOTOGRÁFICA ============
    foto_prueba = models.ImageField(
        upload_to=prueba_acidez_upload_path,
        verbose_name='Foto de la prueba',
        help_text='Fotografía de la prueba de acidez realizada'
    )

    # ============ DATOS DE LA RECEPCIÓN ============
    cantidad_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Cantidad (kg)',
        help_text='Cantidad de sebo procesado recibido en kg'
    )
    precio_kg_aplicado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio por kg aplicado',
        help_text='Precio por kg aplicado según la calidad determinada'
    )
    valor_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Valor total',
        help_text='Valor total a pagar (cantidad_kg * precio_kg_aplicado)'
    )

    # ============ INFORMACIÓN ADICIONAL ============
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Notas adicionales sobre la prueba o el producto'
    )
    lote_numero = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número de lote',
        help_text='Número de lote asignado a este producto (opcional)'
    )

    # ============ CÓDIGO DE VOUCHER ============
    codigo_voucher = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Código de voucher',
        help_text='Código único del voucher generado (formato: ACID-YYYYMMDD-XXXX)'
    )

    # ============ AUDITORÍA ============
    realizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pruebas_acidez_realizadas',
        verbose_name='Realizado por',
        help_text='Usuario que realizó la prueba'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de registro'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    # ============ SOFT DELETE ============
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de eliminación',
        help_text='Fecha de eliminación lógica (soft delete)'
    )

    class Meta:
        db_table = 'proveedores_prueba_acidez'
        verbose_name = 'Prueba de Acidez'
        verbose_name_plural = 'Pruebas de Acidez'
        ordering = ['-fecha_prueba', '-created_at']
        indexes = [
            models.Index(fields=['proveedor', '-fecha_prueba']),
            models.Index(fields=['calidad_resultante', '-fecha_prueba']),
            models.Index(fields=['codigo_voucher']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"Prueba {self.codigo_voucher} - {self.proveedor.nombre_comercial} ({self.valor_acidez}% → {self.calidad_resultante})"

    @property
    def is_deleted(self):
        """Verifica si la prueba está eliminada lógicamente"""
        return self.deleted_at is not None

    @classmethod
    def determinar_calidad(cls, valor_acidez):
        """
        Determina la calidad del sebo según el valor de acidez

        Args:
            valor_acidez: Porcentaje de acidez medido

        Returns:
            Tupla (calidad, codigo_materia)
        """
        from decimal import Decimal
        acidez = Decimal(str(valor_acidez))

        for calidad, (min_val, max_val) in cls.RANGOS_ACIDEZ.items():
            if Decimal(str(min_val)) <= acidez < Decimal(str(max_val)):
                codigo = f"SEBO_PROCESADO_{calidad}"
                return calidad, codigo

        # Default a calidad C si es muy alta
        return 'C', 'SEBO_PROCESADO_C'

    @classmethod
    def generar_codigo_voucher(cls):
        """
        Genera un código único para el voucher de prueba de acidez.

        Usa el sistema centralizado de consecutivos (ConsecutivoConfig).
        Formato: ACID-YYYYMMDD-XXXX (ej: ACID-20241125-0001)
        """
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

        try:
            return ConsecutivoConfig.obtener_siguiente_consecutivo('PRUEBA_ACIDEZ')
        except ConsecutivoConfig.DoesNotExist:
            # Fallback al método legacy si no existe configuración
            from datetime import date
            hoy = date.today()
            prefijo = f"ACID-{hoy.strftime('%Y%m%d')}-"

            ultimo = cls.objects.filter(
                codigo_voucher__startswith=prefijo
            ).order_by('-codigo_voucher').first()

            if ultimo:
                try:
                    numero = int(ultimo.codigo_voucher.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1

            return f"{prefijo}{numero:04d}"

    def obtener_precio_por_calidad(self):
        """
        Obtiene el precio por kg según la calidad determinada

        Busca en PrecioMateriaPrima del proveedor el precio para
        el código de materia resultante (ej: SEBO_PROCESADO_A)
        """
        if not self.codigo_materia:
            return None

        precio = self.proveedor.precios_materia_prima.filter(
            tipo_materia=self.codigo_materia
        ).first()

        return precio.precio_kg if precio else None

    def calcular_valor_total(self):
        """Calcula el valor total basado en cantidad y precio"""
        if self.cantidad_kg and self.precio_kg_aplicado:
            from decimal import Decimal
            return Decimal(str(self.cantidad_kg)) * Decimal(str(self.precio_kg_aplicado))
        return None

    def clean(self):
        """Validaciones personalizadas"""
        super().clean()

        # Validar que el proveedor maneje SEBO
        if self.proveedor:
            if not self.proveedor.subtipo_materia or 'SEBO' not in self.proveedor.subtipo_materia:
                raise ValidationError({
                    'proveedor': 'Solo se pueden registrar pruebas de acidez para proveedores de SEBO'
                })

        # Validar valor de acidez
        if self.valor_acidez is not None:
            from decimal import Decimal
            if self.valor_acidez < 0:
                raise ValidationError({
                    'valor_acidez': 'El valor de acidez no puede ser negativo'
                })
            if self.valor_acidez > Decimal('100'):
                raise ValidationError({
                    'valor_acidez': 'El valor de acidez no puede ser mayor a 100%'
                })

        # Validar cantidad
        if self.cantidad_kg is not None and self.cantidad_kg <= 0:
            raise ValidationError({
                'cantidad_kg': 'La cantidad debe ser mayor a 0'
            })

    def soft_delete(self):
        """Eliminación lógica de la prueba"""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        """Restaura una prueba eliminada lógicamente"""
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def save(self, *args, **kwargs):
        # Determinar calidad y código de materia automáticamente
        if self.valor_acidez is not None:
            calidad, codigo = self.determinar_calidad(self.valor_acidez)
            self.calidad_resultante = calidad
            self.codigo_materia = codigo

        # Generar código de voucher si no existe
        if not self.codigo_voucher:
            self.codigo_voucher = self.generar_codigo_voucher()

        # Obtener precio si no está establecido
        if not self.precio_kg_aplicado and self.codigo_materia and self.proveedor_id:
            self.precio_kg_aplicado = self.obtener_precio_por_calidad()

        # Calcular valor total
        if self.cantidad_kg and self.precio_kg_aplicado:
            self.valor_total = self.calcular_valor_total()

        # Ejecutar validaciones solo si es nuevo registro
        if not self.pk:
            self.full_clean()

        super().save(*args, **kwargs)
