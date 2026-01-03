"""
Modelos para integracion - accounting
Sistema de Gestión StrateKaz

Módulo ACTIVABLE de Contabilidad - Integración:
- ParametrosIntegracion: Mapeo de cuentas por módulo
- LogIntegracion: Registro de movimientos automáticos
- ColaContabilizacion: Cola de documentos pendientes

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from django.db import models
from django.conf import settings
from decimal import Decimal
from apps.core.base_models.base import BaseCompanyModel


# ==============================================================================
# MODELO: PARÁMETROS DE INTEGRACIÓN
# ==============================================================================

class ParametrosIntegracion(BaseCompanyModel):
    """
    Parámetros de Integración con Otros Módulos.

    Define el mapeo de cuentas contables para cada módulo integrado:
    - Tesorería: Bancos, Cuentas por pagar/cobrar
    - Nómina: Gastos de personal, retenciones, seguridad social
    - Inventarios: Inventarios, costo de ventas
    - Activos Fijos: Activos, depreciaciones
    """

    MODULO_CHOICES = [
        ('tesoreria', 'Tesorería'),
        ('nomina', 'Nómina'),
        ('inventarios', 'Inventarios'),
        ('activos_fijos', 'Activos Fijos'),
        ('ventas', 'Ventas'),
        ('compras', 'Compras'),
    ]

    modulo = models.CharField(
        max_length=50,
        choices=MODULO_CHOICES,
        db_index=True,
        verbose_name='Módulo'
    )

    clave = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name='Clave de Mapeo',
        help_text='Identificador del parámetro (ej: cuenta_banco, cuenta_caja)'
    )
    descripcion = models.CharField(
        max_length=200,
        verbose_name='Descripción'
    )

    cuenta_contable = models.ForeignKey(
        'config_contable.CuentaContable',
        on_delete=models.PROTECT,
        related_name='parametros_integracion',
        verbose_name='Cuenta Contable'
    )

    configuracion_json = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Configuración JSON'
    )

    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )

    class Meta:
        db_table = 'accounting_parametros_integracion'
        verbose_name = 'Parámetros de Integración'
        verbose_name_plural = 'Parámetros de Integración'
        ordering = ['modulo', 'clave']
        indexes = [
            models.Index(fields=['empresa', 'modulo', 'clave']),
            models.Index(fields=['activo']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'modulo', 'clave'],
                name='unique_parametro_por_modulo'
            )
        ]

    def __str__(self):
        return f"{self.get_modulo_display()} - {self.clave}"


# ==============================================================================
# MODELO: LOG DE INTEGRACIÓN
# ==============================================================================

class LogIntegracion(models.Model):
    """
    Log de Integración Contable.

    Registra movimientos contables generados automáticamente
    desde otros módulos para auditoría y trazabilidad.
    """

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('procesando', 'Procesando'),
        ('exitoso', 'Exitoso'),
        ('error', 'Error'),
        ('revertido', 'Revertido'),
    ]

    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='logs_integracion_contable',
        verbose_name='Empresa',
        db_index=True
    )
    modulo_origen = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Módulo de Origen'
    )
    documento_origen_tipo = models.CharField(
        max_length=50,
        verbose_name='Tipo Documento Origen'
    )
    documento_origen_id = models.IntegerField(
        verbose_name='ID Documento Origen',
        db_index=True
    )

    comprobante = models.ForeignKey(
        'movimientos.ComprobanteContable',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='logs_integracion',
        verbose_name='Comprobante Generado'
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        db_index=True,
        verbose_name='Estado'
    )

    descripcion = models.TextField(
        verbose_name='Descripción'
    )
    datos_json = models.JSONField(
        default=dict,
        verbose_name='Datos JSON'
    )

    mensaje_error = models.TextField(
        blank=True,
        verbose_name='Mensaje de Error'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha de Creación'
    )
    procesado_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Procesamiento'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='logs_integracion_creados',
        verbose_name='Creado Por'
    )

    class Meta:
        db_table = 'accounting_log_integracion'
        verbose_name = 'Log de Integración'
        verbose_name_plural = 'Logs de Integración'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa', 'estado', 'created_at']),
            models.Index(fields=['modulo_origen', 'documento_origen_id']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.modulo_origen} - {self.documento_origen_tipo} #{self.documento_origen_id} - {self.get_estado_display()}"


# ==============================================================================
# MODELO: COLA DE CONTABILIZACIÓN
# ==============================================================================

class ColaContabilizacion(models.Model):
    """
    Cola de Contabilización.

    Cola de documentos pendientes de contabilizar.
    Permite procesar contabilizaciones de forma asíncrona.
    """

    PRIORIDAD_CHOICES = [
        (1, 'Muy Alta'),
        (3, 'Alta'),
        (5, 'Normal'),
        (7, 'Baja'),
        (9, 'Muy Baja'),
    ]

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('procesando', 'Procesando'),
        ('completado', 'Completado'),
        ('error', 'Error'),
    ]

    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='cola_contabilizacion',
        verbose_name='Empresa',
        db_index=True
    )
    modulo_origen = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Módulo de Origen'
    )
    documento_origen_tipo = models.CharField(
        max_length=50,
        verbose_name='Tipo Documento Origen'
    )
    documento_origen_id = models.IntegerField(
        verbose_name='ID Documento Origen',
        db_index=True
    )

    prioridad = models.IntegerField(
        default=5,
        choices=PRIORIDAD_CHOICES,
        db_index=True,
        verbose_name='Prioridad'
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        db_index=True,
        verbose_name='Estado'
    )

    datos_json = models.JSONField(
        default=dict,
        verbose_name='Datos JSON'
    )

    comprobante_generado = models.ForeignKey(
        'movimientos.ComprobanteContable',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cola_generaciones',
        verbose_name='Comprobante Generado'
    )
    mensaje_error = models.TextField(
        blank=True,
        verbose_name='Mensaje de Error'
    )

    intentos = models.IntegerField(
        default=0,
        verbose_name='Intentos'
    )
    max_intentos = models.IntegerField(
        default=3,
        verbose_name='Máximo de Intentos'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha de Creación'
    )
    procesado_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Procesamiento'
    )
    proximo_intento_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='Próximo Intento'
    )

    class Meta:
        db_table = 'accounting_cola_contabilizacion'
        verbose_name = 'Cola de Contabilización'
        verbose_name_plural = 'Colas de Contabilización'
        ordering = ['prioridad', 'created_at']
        indexes = [
            models.Index(fields=['empresa', 'estado', 'prioridad']),
            models.Index(fields=['modulo_origen', 'documento_origen_id']),
            models.Index(fields=['estado', 'proximo_intento_at']),
        ]

    def __str__(self):
        return f"{self.modulo_origen} - {self.documento_origen_tipo} #{self.documento_origen_id} - {self.get_estado_display()}"

    def puede_reintentar(self):
        """Verifica si puede reintentar el procesamiento."""
        return self.intentos < self.max_intentos
