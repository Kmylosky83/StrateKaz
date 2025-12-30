"""
Modelos para movimientos - accounting
Sistema de Gestión Grasas y Huesos del Norte

Módulo ACTIVABLE de Contabilidad - Movimientos:
- ComprobanteContable: Encabezado de asiento contable
- DetalleComprobante: Líneas del asiento (débitos/créditos)
- SecuenciaDocumento: Consecutivos por tipo de documento
- AsientoPlantilla: Plantillas para asientos recurrentes

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from apps.core.base_models.base import BaseCompanyModel


# ==============================================================================
# MODELO: COMPROBANTE CONTABLE
# ==============================================================================

class ComprobanteContable(BaseCompanyModel):
    """
    Comprobante Contable (Encabezado del Asiento).

    Representa el encabezado de un asiento contable.
    Las líneas de débito y crédito están en DetalleComprobante.
    """

    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('pendiente_aprobacion', 'Pendiente Aprobación'),
        ('aprobado', 'Aprobado'),
        ('contabilizado', 'Contabilizado'),
        ('anulado', 'Anulado'),
    ]

    numero_comprobante = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Número de Comprobante'
    )
    tipo_documento = models.ForeignKey(
        'config_contable.TipoDocumentoContable',
        on_delete=models.PROTECT,
        related_name='comprobantes',
        verbose_name='Tipo de Documento',
        db_index=True
    )

    periodo = models.CharField(
        max_length=7,
        db_index=True,
        verbose_name='Período Contable',
        help_text='Formato YYYY-MM'
    )
    fecha_comprobante = models.DateField(
        verbose_name='Fecha del Comprobante',
        db_index=True
    )
    fecha_elaboracion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Elaboración'
    )

    concepto = models.TextField(
        verbose_name='Concepto'
    )

    # Totales denormalizados
    total_debito = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total Débito'
    )
    total_credito = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total Crédito'
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='borrador',
        db_index=True,
        verbose_name='Estado'
    )

    # Aprobación
    requiere_aprobacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Aprobación'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='comprobantes_aprobados',
        verbose_name='Aprobado Por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    # Origen automático
    origen_automatico = models.BooleanField(
        default=False,
        verbose_name='Origen Automático'
    )
    modulo_origen = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Módulo de Origen'
    )
    documento_origen_id = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='ID Documento Origen'
    )

    # Anulación
    fecha_anulacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Anulación'
    )
    motivo_anulacion = models.TextField(
        blank=True,
        verbose_name='Motivo de Anulación'
    )
    anulado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='comprobantes_anulados',
        verbose_name='Anulado Por'
    )

    notas = models.TextField(
        blank=True,
        verbose_name='Notas Adicionales'
    )

    class Meta:
        db_table = 'accounting_comprobante_contable'
        verbose_name = 'Comprobante Contable'
        verbose_name_plural = 'Comprobantes Contables'
        ordering = ['-fecha_comprobante', '-numero_comprobante']
        indexes = [
            models.Index(fields=['empresa', 'estado', 'fecha_comprobante']),
            models.Index(fields=['periodo', 'tipo_documento']),
            models.Index(fields=['numero_comprobante']),
            models.Index(fields=['modulo_origen', 'documento_origen_id']),
        ]

    def __str__(self):
        return f"{self.numero_comprobante} - {self.tipo_documento.codigo} - {self.fecha_comprobante}"

    @property
    def esta_cuadrado(self):
        """Verifica si débitos = créditos."""
        return abs(self.total_debito - self.total_credito) < Decimal('0.01')

    @property
    def diferencia(self):
        """Diferencia entre débitos y créditos."""
        return self.total_debito - self.total_credito

    def calcular_totales(self):
        """Recalcula los totales desde las líneas."""
        from django.db.models import Sum

        totales = self.detalles.aggregate(
            total_debito=Sum('debito'),
            total_credito=Sum('credito')
        )

        self.total_debito = totales['total_debito'] or Decimal('0.00')
        self.total_credito = totales['total_credito'] or Decimal('0.00')
        self.save(update_fields=['total_debito', 'total_credito', 'updated_at'])

    def contabilizar(self, usuario=None):
        """
        Contabiliza el comprobante (afecta saldos de cuentas).
        """
        from django.db import transaction

        if self.estado == 'contabilizado':
            raise ValidationError('El comprobante ya está contabilizado.')

        if self.estado == 'anulado':
            raise ValidationError('No se puede contabilizar un comprobante anulado.')

        if not self.esta_cuadrado:
            raise ValidationError(
                f'El comprobante no está cuadrado. Diferencia: ${self.diferencia}'
            )

        if not self.detalles.exists():
            raise ValidationError('El comprobante no tiene líneas de detalle.')

        with transaction.atomic():
            for detalle in self.detalles.all():
                detalle.cuenta.actualizar_saldo(
                    debito=detalle.debito,
                    credito=detalle.credito
                )

            self.estado = 'contabilizado'
            if usuario:
                self.aprobado_por = usuario
                self.fecha_aprobacion = timezone.now()
            self.save(update_fields=['estado', 'aprobado_por', 'fecha_aprobacion', 'updated_at'])

    def anular(self, motivo, usuario=None):
        """Anula el comprobante y revierte saldos si estaba contabilizado."""
        from django.db import transaction

        if self.estado == 'anulado':
            return

        with transaction.atomic():
            if self.estado == 'contabilizado':
                for detalle in self.detalles.all():
                    detalle.cuenta.actualizar_saldo(
                        debito=-detalle.debito,
                        credito=-detalle.credito
                    )

            self.estado = 'anulado'
            self.motivo_anulacion = motivo
            self.fecha_anulacion = timezone.now()
            if usuario:
                self.anulado_por = usuario
            self.save(update_fields=[
                'estado', 'motivo_anulacion', 'fecha_anulacion',
                'anulado_por', 'updated_at'
            ])


# ==============================================================================
# MODELO: DETALLE COMPROBANTE
# ==============================================================================

class DetalleComprobante(models.Model):
    """
    Detalle del Comprobante Contable (Líneas del Asiento).

    Cada línea tiene débito O crédito (no ambos).
    """

    comprobante = models.ForeignKey(
        ComprobanteContable,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Comprobante',
        db_index=True
    )

    cuenta = models.ForeignKey(
        'config_contable.CuentaContable',
        on_delete=models.PROTECT,
        related_name='movimientos',
        verbose_name='Cuenta Contable',
        db_index=True
    )

    secuencia = models.IntegerField(
        verbose_name='Secuencia'
    )

    descripcion = models.CharField(
        max_length=500,
        verbose_name='Descripción'
    )

    debito = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Débito'
    )
    credito = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Crédito'
    )

    tercero = models.ForeignKey(
        'config_contable.Tercero',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='movimientos',
        verbose_name='Tercero',
        db_index=True
    )

    centro_costo = models.ForeignKey(
        'config_contable.CentroCostoContable',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='movimientos',
        verbose_name='Centro de Costo',
        db_index=True
    )

    base_retencion = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Base Retención'
    )

    tipo_documento_soporte = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Tipo Documento Soporte'
    )
    numero_documento_soporte = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Número Documento Soporte'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounting_detalle_comprobante'
        verbose_name = 'Detalle de Comprobante'
        verbose_name_plural = 'Detalles de Comprobantes'
        ordering = ['comprobante', 'secuencia']
        indexes = [
            models.Index(fields=['comprobante', 'secuencia']),
            models.Index(fields=['cuenta']),
            models.Index(fields=['tercero']),
            models.Index(fields=['centro_costo']),
        ]

    def __str__(self):
        return f"{self.comprobante.numero_comprobante} - L{self.secuencia} - {self.cuenta.codigo}"

    @property
    def monto(self):
        """Retorna el monto (débito o crédito)."""
        return self.debito if self.debito > 0 else self.credito

    def clean(self):
        if self.debito > 0 and self.credito > 0:
            raise ValidationError(
                'Una línea no puede tener débito y crédito simultáneamente.'
            )

        if self.debito == 0 and self.credito == 0:
            raise ValidationError(
                'La línea debe tener débito o crédito.'
            )

        if self.cuenta and not self.cuenta.acepta_movimientos:
            raise ValidationError({
                'cuenta': f'La cuenta {self.cuenta.codigo} no acepta movimientos directos.'
            })

        if self.cuenta and self.cuenta.exige_tercero and not self.tercero:
            raise ValidationError({
                'tercero': f'La cuenta {self.cuenta.codigo} requiere tercero.'
            })

        if self.cuenta and self.cuenta.exige_centro_costo and not self.centro_costo:
            raise ValidationError({
                'centro_costo': f'La cuenta {self.cuenta.codigo} requiere centro de costo.'
            })


# ==============================================================================
# MODELO: SECUENCIA DOCUMENTO
# ==============================================================================

class SecuenciaDocumento(BaseCompanyModel):
    """
    Secuencia de Numeración de Documentos.

    Controla consecutivos por tipo de documento y período.
    """

    tipo_documento = models.ForeignKey(
        'config_contable.TipoDocumentoContable',
        on_delete=models.CASCADE,
        related_name='secuencias',
        verbose_name='Tipo de Documento',
        db_index=True
    )

    periodo = models.CharField(
        max_length=7,
        verbose_name='Período',
        help_text='Formato YYYY-MM',
        db_index=True
    )

    consecutivo_actual = models.IntegerField(
        default=0,
        verbose_name='Consecutivo Actual'
    )

    class Meta:
        db_table = 'accounting_secuencia_documento'
        verbose_name = 'Secuencia de Documento'
        verbose_name_plural = 'Secuencias de Documentos'
        ordering = ['tipo_documento', 'periodo']
        indexes = [
            models.Index(fields=['empresa', 'tipo_documento', 'periodo']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'tipo_documento', 'periodo'],
                name='unique_secuencia_por_periodo'
            )
        ]

    def __str__(self):
        return f"{self.tipo_documento.codigo} - {self.periodo} - {self.consecutivo_actual}"


# ==============================================================================
# MODELO: ASIENTO PLANTILLA
# ==============================================================================

class AsientoPlantilla(BaseCompanyModel):
    """
    Plantilla de Asiento Contable.

    Define plantillas reutilizables para asientos recurrentes:
    - Cierre mensual
    - Nómina
    - Depreciaciones
    """

    FRECUENCIA_CHOICES = [
        ('diaria', 'Diaria'),
        ('semanal', 'Semanal'),
        ('quincenal', 'Quincenal'),
        ('mensual', 'Mensual'),
        ('trimestral', 'Trimestral'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual'),
    ]

    codigo = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Plantilla'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    tipo_documento = models.ForeignKey(
        'config_contable.TipoDocumentoContable',
        on_delete=models.PROTECT,
        related_name='plantillas',
        verbose_name='Tipo de Documento',
        db_index=True
    )

    es_recurrente = models.BooleanField(
        default=False,
        verbose_name='Es Recurrente'
    )
    frecuencia = models.CharField(
        max_length=20,
        choices=FRECUENCIA_CHOICES,
        blank=True,
        verbose_name='Frecuencia'
    )

    estructura_json = models.JSONField(
        default=dict,
        verbose_name='Estructura JSON',
        help_text='Estructura de las líneas del asiento'
    )

    class Meta:
        db_table = 'accounting_asiento_plantilla'
        verbose_name = 'Plantilla de Asiento'
        verbose_name_plural = 'Plantillas de Asientos'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['es_recurrente', 'frecuencia']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'codigo'],
                name='unique_plantilla_por_empresa'
            )
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def generar_comprobante(self, fecha_comprobante, concepto=None):
        """Genera un comprobante a partir de la plantilla (sin guardar)."""
        periodo = fecha_comprobante.strftime('%Y-%m')

        comprobante = ComprobanteContable(
            empresa=self.empresa,
            tipo_documento=self.tipo_documento,
            periodo=periodo,
            fecha_comprobante=fecha_comprobante,
            concepto=concepto or self.descripcion,
            created_by=self.created_by,
        )

        return comprobante
