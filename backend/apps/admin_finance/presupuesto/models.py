"""
Modelos para Presupuesto - Admin Finance
Sistema de Gestión StrateKaz

Gestiona:
- Centros de costo
- Rubros presupuestales (ingresos/egresos)
- Presupuesto anual por área
- Aprobaciones de presupuesto
- Ejecución presupuestal

100% DINÁMICO: Integrado con Organización y Finanzas.

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

from apps.core.base_models.base import BaseCompanyModel


# ==============================================================================
# OPCIONES Y CONSTANTES
# ==============================================================================

TIPO_RUBRO_CHOICES = [
    ('ingreso', 'Ingreso'),
    ('egreso', 'Egreso'),
]

CATEGORIA_RUBRO_CHOICES = [
    ('operacional', 'Operacional'),
    ('administrativo', 'Administrativo'),
    ('ventas', 'Ventas'),
    ('inversion', 'Inversión'),
    ('financiero', 'Financiero'),
    ('otros', 'Otros'),
]

ESTADO_PRESUPUESTO_CHOICES = [
    ('borrador', 'Borrador'),
    ('pendiente_aprobacion', 'Pendiente de Aprobación'),
    ('aprobado', 'Aprobado'),
    ('vigente', 'Vigente'),
    ('cerrado', 'Cerrado'),
    ('rechazado', 'Rechazado'),
]

NIVEL_APROBACION_CHOICES = [
    ('supervisor', 'Supervisor de Área'),
    ('gerencia', 'Gerencia'),
    ('direccion', 'Dirección General'),
]

ESTADO_APROBACION_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('aprobado', 'Aprobado'),
    ('rechazado', 'Rechazado'),
]

ESTADO_EJECUCION_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('ejecutado', 'Ejecutado'),
    ('anulado', 'Anulado'),
]


# ==============================================================================
# MODELO: CENTRO DE COSTO
# ==============================================================================

class CentroCosto(BaseCompanyModel):
    """
    Centro de Costo - Unidades organizacionales para control presupuestal.

    Representa los centros de costo de la empresa para asignar y
    controlar presupuestos.
    """

    # Información básica
    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del centro de costo (ej: CC-001)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre del centro de costo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del centro de costo'
    )

    # Relación con área organizacional
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='centros_costo',
        verbose_name='Área',
        help_text='Área organizacional asociada'
    )

    # Responsable
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='presupuesto_centros_costo_responsable',
        verbose_name='Responsable',
        help_text='Usuario responsable del centro de costo'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('activo', 'Activo'),
            ('inactivo', 'Inactivo'),
        ],
        default='activo',
        verbose_name='Estado',
        db_index=True
    )

    class Meta:
        db_table = 'admin_finance_centro_costo'
        verbose_name = 'Centro de Costo'
        verbose_name_plural = 'Centros de Costo'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ==============================================================================
# MODELO: RUBRO
# ==============================================================================

class Rubro(BaseCompanyModel):
    """
    Rubro - Categorías presupuestales de ingresos y egresos.

    Define las categorías bajo las cuales se asigna y ejecuta el presupuesto.
    """

    # Información básica
    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del rubro (auto-generado: RUB-###)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre del rubro presupuestal'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_RUBRO_CHOICES,
        verbose_name='Tipo',
        help_text='Tipo de rubro (Ingreso o Egreso)',
        db_index=True
    )
    categoria = models.CharField(
        max_length=30,
        choices=CATEGORIA_RUBRO_CHOICES,
        verbose_name='Categoría',
        help_text='Categoría del rubro'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Jerarquía (opcional)
    rubro_padre = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subrubros',
        verbose_name='Rubro Padre',
        help_text='Rubro padre para jerarquía'
    )

    class Meta:
        db_table = 'admin_finance_rubro'
        verbose_name = 'Rubro Presupuestal'
        verbose_name_plural = 'Rubros Presupuestales'
        ordering = ['tipo', 'codigo']
        indexes = [
            models.Index(fields=['empresa', 'tipo']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.get_tipo_display()})"

    def save(self, *args, **kwargs):
        """Override para generación de código automático."""
        if not self.codigo:
            self.codigo = self._generar_codigo()
        super().save(*args, **kwargs)

    def _generar_codigo(self):
        """Genera código único: RUB-###"""
        ultimo = Rubro.objects.filter(
            empresa=self.empresa,
            codigo__startswith='RUB-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"RUB-{numero:03d}"


# ==============================================================================
# MODELO: PRESUPUESTO POR ÁREA
# ==============================================================================

class PresupuestoPorArea(BaseCompanyModel):
    """
    Presupuesto Por Área - Asignación presupuestal anual por área.

    Registra el presupuesto asignado a cada área/centro de costo
    por rubro para un año fiscal específico.
    """

    # Información básica
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del presupuesto (auto-generado: PRE-YYYY-####)'
    )

    # Relaciones
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='presupuestos',
        verbose_name='Área',
        help_text='Área a la que se asigna el presupuesto'
    )
    centro_costo = models.ForeignKey(
        CentroCosto,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='presupuestos',
        verbose_name='Centro de Costo',
        help_text='Centro de costo asociado'
    )
    rubro = models.ForeignKey(
        Rubro,
        on_delete=models.PROTECT,
        related_name='presupuestos',
        verbose_name='Rubro',
        help_text='Rubro presupuestal'
    )

    # Período
    anio = models.IntegerField(
        validators=[MinValueValidator(2020), MaxValueValidator(2100)],
        verbose_name='Año',
        help_text='Año fiscal del presupuesto',
        db_index=True
    )

    # Montos
    monto_asignado = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Monto Asignado',
        help_text='Monto total asignado para el año'
    )
    monto_ejecutado = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='Monto Ejecutado',
        help_text='Monto total ejecutado'
    )

    # Estado
    estado = models.CharField(
        max_length=30,
        choices=ESTADO_PRESUPUESTO_CHOICES,
        default='borrador',
        verbose_name='Estado',
        db_index=True
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_presupuesto_por_area'
        verbose_name = 'Presupuesto Por Área'
        verbose_name_plural = 'Presupuestos Por Área'
        ordering = ['-anio', 'area', 'rubro']
        indexes = [
            models.Index(fields=['empresa', 'anio', 'estado']),
            models.Index(fields=['codigo']),
            models.Index(fields=['area', 'anio']),
            models.Index(fields=['centro_costo', 'anio']),
        ]
        unique_together = [['empresa', 'area', 'centro_costo', 'rubro', 'anio']]

    def __str__(self):
        area_nombre = self.area.name if self.area else self.centro_costo.nombre
        return f"{self.codigo} - {area_nombre} - {self.rubro.nombre} - {self.anio}"

    @property
    def saldo_disponible(self):
        """Calcula el saldo disponible (asignado - ejecutado)."""
        return self.monto_asignado - self.monto_ejecutado

    @property
    def porcentaje_ejecucion(self):
        """Calcula el porcentaje de ejecución presupuestal."""
        if self.monto_asignado == 0:
            return Decimal('0.00')
        return (self.monto_ejecutado / self.monto_asignado) * Decimal('100.00')

    def save(self, *args, **kwargs):
        """Override para generación de código automático y validaciones."""
        if not self.codigo:
            self.codigo = self._generar_codigo()

        # Validar que al menos área o centro de costo esté presente
        if not self.area and not self.centro_costo:
            raise ValidationError('Debe especificar al menos un área o centro de costo.')

        super().save(*args, **kwargs)

    def _generar_codigo(self):
        """Genera código único: PRE-YYYY-####"""
        year = self.anio or timezone.now().year
        ultimo = PresupuestoPorArea.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'PRE-{year}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"PRE-{year}-{numero:04d}"

    def clean(self):
        """Validaciones del modelo."""
        # Validar que monto ejecutado no exceda asignado
        if self.monto_ejecutado > self.monto_asignado:
            raise ValidationError({
                'monto_ejecutado': 'El monto ejecutado no puede ser mayor al monto asignado.'
            })

        # Validar coherencia de tipo de rubro
        if self.rubro and self.rubro.tipo == 'ingreso' and self.monto_asignado < 0:
            raise ValidationError({
                'monto_asignado': 'Los ingresos no pueden tener montos negativos.'
            })


# ==============================================================================
# MODELO: APROBACIÓN
# ==============================================================================

class Aprobacion(BaseCompanyModel):
    """
    Aprobación - Control de aprobaciones de presupuesto.

    Registra el flujo de aprobaciones multinivel para presupuestos.
    """

    # Relaciones
    presupuesto = models.ForeignKey(
        PresupuestoPorArea,
        on_delete=models.CASCADE,
        related_name='aprobaciones',
        verbose_name='Presupuesto',
        help_text='Presupuesto a aprobar'
    )

    # Nivel de aprobación
    nivel_aprobacion = models.CharField(
        max_length=20,
        choices=NIVEL_APROBACION_CHOICES,
        verbose_name='Nivel de Aprobación',
        help_text='Nivel jerárquico de aprobación'
    )
    orden = models.PositiveIntegerField(
        default=1,
        verbose_name='Orden',
        help_text='Orden de aprobación (1=primero)'
    )

    # Aprobador
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='aprobaciones_presupuesto',
        verbose_name='Aprobado Por',
        help_text='Usuario que aprueba/rechaza'
    )

    # Fechas
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación',
        help_text='Fecha en que se aprueba o rechaza'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_APROBACION_CHOICES,
        default='pendiente',
        verbose_name='Estado',
        db_index=True
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Comentarios del aprobador'
    )

    class Meta:
        db_table = 'admin_finance_aprobacion'
        verbose_name = 'Aprobación de Presupuesto'
        verbose_name_plural = 'Aprobaciones de Presupuesto'
        ordering = ['presupuesto', 'orden']
        indexes = [
            models.Index(fields=['presupuesto', 'estado']),
            models.Index(fields=['aprobado_por', 'estado']),
        ]
        unique_together = [['presupuesto', 'nivel_aprobacion', 'orden']]

    def __str__(self):
        return f"{self.presupuesto.codigo} - {self.get_nivel_aprobacion_display()} - {self.get_estado_display()}"

    def aprobar(self, usuario):
        """Aprobar presupuesto."""
        self.estado = 'aprobado'
        self.aprobado_por = usuario
        self.fecha_aprobacion = timezone.now()
        self.save()

        # Verificar si todas las aprobaciones están completas
        self._verificar_aprobaciones_completas()

    def rechazar(self, usuario, observaciones=''):
        """Rechazar presupuesto."""
        self.estado = 'rechazado'
        self.aprobado_por = usuario
        self.fecha_aprobacion = timezone.now()
        self.observaciones = observaciones
        self.save()

        # Cambiar estado del presupuesto
        self.presupuesto.estado = 'rechazado'
        self.presupuesto.save(update_fields=['estado', 'updated_at'])

    def _verificar_aprobaciones_completas(self):
        """Verifica si todas las aprobaciones están completas."""
        aprobaciones_pendientes = Aprobacion.objects.filter(
            presupuesto=self.presupuesto,
            estado='pendiente'
        ).exists()

        if not aprobaciones_pendientes:
            # Todas aprobadas, cambiar estado del presupuesto
            self.presupuesto.estado = 'aprobado'
            self.presupuesto.save(update_fields=['estado', 'updated_at'])


# ==============================================================================
# MODELO: EJECUCIÓN
# ==============================================================================

class Ejecucion(BaseCompanyModel):
    """
    Ejecución - Ejecución presupuestal.

    Registra la ejecución de presupuesto (ingresos o egresos reales).
    """

    # Relaciones
    presupuesto = models.ForeignKey(
        PresupuestoPorArea,
        on_delete=models.PROTECT,
        related_name='ejecuciones',
        verbose_name='Presupuesto',
        help_text='Presupuesto al que se imputa'
    )

    # Información de la ejecución
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la ejecución (auto-generado: EJE-YYYY-####)'
    )
    fecha = models.DateField(
        verbose_name='Fecha',
        help_text='Fecha de la ejecución',
        db_index=True
    )
    monto = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Monto',
        help_text='Monto ejecutado'
    )
    concepto = models.CharField(
        max_length=255,
        verbose_name='Concepto',
        help_text='Descripción del concepto ejecutado'
    )

    # Documento soporte
    documento_soporte = models.FileField(
        upload_to='presupuesto/ejecuciones/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Documento Soporte',
        help_text='Archivo PDF del documento soporte (factura, recibo, etc.)'
    )
    numero_documento = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de Documento',
        help_text='Número del documento soporte'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_EJECUCION_CHOICES,
        default='ejecutado',
        verbose_name='Estado',
        db_index=True
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'admin_finance_ejecucion'
        verbose_name = 'Ejecución Presupuestal'
        verbose_name_plural = 'Ejecuciones Presupuestales'
        ordering = ['-fecha', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'fecha']),
            models.Index(fields=['codigo']),
            models.Index(fields=['presupuesto', 'estado']),
            models.Index(fields=['fecha']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.concepto} - ${self.monto}"

    def save(self, *args, **kwargs):
        """Override para generación de código y actualización de presupuesto."""
        es_nuevo = not self.pk

        if not self.codigo:
            self.codigo = self._generar_codigo()

        super().save(*args, **kwargs)

        # Solo actualizar presupuesto si es nueva ejecución y está ejecutada
        if es_nuevo and self.estado == 'ejecutado':
            self.presupuesto.monto_ejecutado += self.monto
            self.presupuesto.save(update_fields=['monto_ejecutado', 'updated_at'])

    def _generar_codigo(self):
        """Genera código único: EJE-YYYY-####"""
        year = self.fecha.year if self.fecha else timezone.now().year
        ultimo = Ejecucion.objects.filter(
            empresa=self.empresa,
            codigo__startswith=f'EJE-{year}-'
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo.split('-')[-1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"EJE-{year}-{numero:04d}"

    def clean(self):
        """Validaciones del modelo."""
        # Validar que no exceda el saldo disponible (solo para presupuestos aprobados)
        if self.presupuesto and self.presupuesto.estado == 'aprobado':
            saldo_disponible = self.presupuesto.saldo_disponible
            if self.estado == 'ejecutado' and self.monto > saldo_disponible:
                raise ValidationError({
                    'monto': f'El monto ({self.monto}) excede el saldo disponible del presupuesto ({saldo_disponible})'
                })

        # Validar que el presupuesto esté aprobado
        if self.estado == 'ejecutado' and self.presupuesto.estado not in ['aprobado', 'vigente']:
            raise ValidationError({
                'presupuesto': 'No se puede ejecutar sobre un presupuesto que no está aprobado o vigente.'
            })

    def anular(self):
        """Anula la ejecución y revierte el monto."""
        if self.estado == 'anulado':
            return

        # Revertir monto del presupuesto
        self.presupuesto.monto_ejecutado -= self.monto
        self.presupuesto.save(update_fields=['monto_ejecutado', 'updated_at'])

        # Cambiar estado
        self.estado = 'anulado'
        self.save(update_fields=['estado', 'updated_at'])
