"""
Modelos del módulo Ecoaliados - Proveedores ACU de Unidades de Negocio
"""
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.core.models import User
from apps.proveedores.models import Proveedor


class Ecoaliado(models.Model):
    """
    Modelo Ecoaliado - Proveedores pequeños de ACU vinculados a Unidades de Negocio

    Los ecoaliados son proveedores (restaurantes, cafeterías, etc.) que venden
    Aceite Comestible Usado (ACU) a las Unidades de Negocio.
    """

    DOCUMENT_TYPE_CHOICES = [
        ('CC', 'Cédula de Ciudadanía'),
        ('CE', 'Cédula de Extranjería'),
        ('NIT', 'NIT'),
        ('PASAPORTE', 'Pasaporte'),
    ]

    # ============ IDENTIFICACIÓN ============
    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del ecoaliado (ej: ECO-0001)'
    )
    razon_social = models.CharField(
        max_length=200,
        verbose_name='Razón Social',
        help_text='Nombre o razón social del ecoaliado'
    )
    documento_tipo = models.CharField(
        max_length=20,
        choices=DOCUMENT_TYPE_CHOICES,
        default='CC',
        verbose_name='Tipo de documento'
    )
    documento_numero = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Número de documento',
        help_text='Número de identificación único'
    )

    # ============ RELACIÓN CON UNIDAD DE NEGOCIO ============
    unidad_negocio = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name='ecoaliados',
        limit_choices_to={
            'tipo_proveedor': 'UNIDAD_NEGOCIO',
            'is_active': True
        },
        verbose_name='Unidad de Negocio',
        help_text='Unidad de negocio a la que pertenece este ecoaliado'
    )

    # ============ CONTACTO ============
    telefono = models.CharField(
        max_length=20,
        verbose_name='Teléfono',
        help_text='Número de teléfono de contacto'
    )
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name='Email',
        help_text='Correo electrónico de contacto'
    )
    direccion = models.TextField(
        verbose_name='Dirección',
        help_text='Dirección física del ecoaliado'
    )
    ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad',
        help_text='Ciudad donde se ubica el ecoaliado'
    )
    departamento = models.CharField(
        max_length=100,
        verbose_name='Departamento',
        help_text='Departamento donde se ubica el ecoaliado'
    )

    # ============ GEOLOCALIZACIÓN ============
    latitud = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name='Latitud',
        help_text='Coordenada de latitud GPS'
    )
    longitud = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name='Longitud',
        help_text='Coordenada de longitud GPS'
    )

    # ============ PRECIO ============
    precio_compra_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio de compra por kg',
        help_text='Precio pactado con el comercial para compra de ACU (COP/kg)'
    )

    # ============ ASIGNACIÓN ============
    comercial_asignado = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='ecoaliados_asignados',
        limit_choices_to={
            'cargo__code__in': ['lider_com_econorte', 'comercial_econorte'],
            'is_active': True
        },
        verbose_name='Comercial asignado',
        help_text='Comercial responsable de este ecoaliado'
    )

    # ============ INFORMACIÓN ADICIONAL ============
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Notas adicionales sobre el ecoaliado'
    )

    # ============ AUDITORÍA ============
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ecoaliados_creados',
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
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si el ecoaliado está activo en el sistema'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de eliminación',
        help_text='Fecha de eliminación lógica (soft delete)'
    )

    class Meta:
        db_table = 'ecoaliados_ecoaliado'
        verbose_name = 'Ecoaliado'
        verbose_name_plural = 'Ecoaliados'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['documento_numero']),
            models.Index(fields=['unidad_negocio', 'is_active']),
            models.Index(fields=['comercial_asignado', 'is_active']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.razon_social}"

    @property
    def is_deleted(self):
        """Verifica si el ecoaliado está eliminado lógicamente"""
        return self.deleted_at is not None

    @property
    def tiene_geolocalizacion(self):
        """Verifica si el ecoaliado tiene coordenadas GPS"""
        return self.latitud is not None and self.longitud is not None

    def soft_delete(self):
        """Eliminación lógica del ecoaliado"""
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def restore(self):
        """Restaura un ecoaliado eliminado lógicamente"""
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def clean(self):
        """Validaciones personalizadas"""
        # Validar que la unidad de negocio maneje ACU
        if self.unidad_negocio:
            if self.unidad_negocio.tipo_proveedor != 'UNIDAD_NEGOCIO':
                raise ValidationError({
                    'unidad_negocio': 'Debe seleccionar una Unidad de Negocio válida'
                })

            # Verificar que la unidad de negocio maneje ACU
            subtipo_materia = self.unidad_negocio.subtipo_materia
            if isinstance(subtipo_materia, list):
                if 'ACU' not in subtipo_materia:
                    raise ValidationError({
                        'unidad_negocio': 'La Unidad de Negocio debe manejar ACU'
                    })
            elif subtipo_materia != 'ACU':
                raise ValidationError({
                    'unidad_negocio': 'La Unidad de Negocio debe manejar ACU'
                })

        # Validar precio
        if self.precio_compra_kg and self.precio_compra_kg < 0:
            raise ValidationError({
                'precio_compra_kg': 'El precio no puede ser negativo'
            })

        # Validar coordenadas GPS
        if self.latitud is not None:
            if not (-90 <= self.latitud <= 90):
                raise ValidationError({
                    'latitud': 'La latitud debe estar entre -90 y 90 grados'
                })

        if self.longitud is not None:
            if not (-180 <= self.longitud <= 180):
                raise ValidationError({
                    'longitud': 'La longitud debe estar entre -180 y 180 grados'
                })

    def save(self, *args, **kwargs):
        # Generar código automático si no existe
        if not self.codigo:
            # Obtener el último código
            ultimo = Ecoaliado.objects.filter(
                codigo__startswith='ECO-'
            ).order_by('-codigo').first()

            if ultimo:
                try:
                    ultimo_numero = int(ultimo.codigo.split('-')[1])
                    nuevo_numero = ultimo_numero + 1
                except (IndexError, ValueError):
                    nuevo_numero = 1
            else:
                nuevo_numero = 1

            self.codigo = f'ECO-{nuevo_numero:04d}'

        self.full_clean()
        super().save(*args, **kwargs)


class HistorialPrecioEcoaliado(models.Model):
    """
    Historial de cambios de precio de un ecoaliado
    """

    TIPO_CAMBIO_CHOICES = [
        ('CREACION', 'Creación'),
        ('AUMENTO', 'Aumento'),
        ('DISMINUCION', 'Disminución'),
        ('AJUSTE', 'Ajuste'),
    ]

    ecoaliado = models.ForeignKey(
        Ecoaliado,
        on_delete=models.CASCADE,
        related_name='historial_precios',
        verbose_name='Ecoaliado'
    )
    precio_anterior = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio anterior (COP/kg)',
        help_text='Precio anterior por kilogramo'
    )
    precio_nuevo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio nuevo (COP/kg)',
        help_text='Nuevo precio por kilogramo'
    )
    tipo_cambio = models.CharField(
        max_length=20,
        choices=TIPO_CAMBIO_CHOICES,
        verbose_name='Tipo de cambio'
    )
    justificacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Justificación',
        help_text='Razón del cambio de precio'
    )
    modificado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cambios_precio_ecoaliados',
        verbose_name='Modificado por'
    )
    fecha_modificacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de modificación'
    )

    class Meta:
        db_table = 'ecoaliados_historial_precio'
        verbose_name = 'Historial de Precio Ecoaliado'
        verbose_name_plural = 'Historial de Precios Ecoaliados'
        ordering = ['-fecha_modificacion']
        indexes = [
            models.Index(fields=['ecoaliado', '-fecha_modificacion']),
        ]

    def __str__(self):
        return f"{self.ecoaliado.codigo} - {self.fecha_modificacion.strftime('%Y-%m-%d %H:%M')}"

    @property
    def diferencia_precio(self):
        """Calcula la diferencia de precio"""
        if self.precio_anterior:
            return self.precio_nuevo - self.precio_anterior
        return None

    @property
    def porcentaje_cambio(self):
        """Calcula el porcentaje de cambio"""
        if self.precio_anterior and self.precio_anterior > 0:
            return ((self.precio_nuevo - self.precio_anterior) / self.precio_anterior) * 100
        return None
