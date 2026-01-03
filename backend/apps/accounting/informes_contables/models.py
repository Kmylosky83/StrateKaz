"""
Modelos para informes_contables - accounting
Sistema de Gestión StrateKaz

Módulo ACTIVABLE de Contabilidad - Informes:
- InformeContable: Definición de informes (Balance, P&G, etc.)
- LineaInforme: Configuración de líneas del informe
- GeneracionInforme: Histórico de informes generados

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from django.db import models
from decimal import Decimal
from apps.core.base_models.base import BaseCompanyModel


# ==============================================================================
# MODELO: INFORME CONTABLE
# ==============================================================================

class InformeContable(BaseCompanyModel):
    """
    Definición de Informe Contable.

    Define la estructura de informes financieros:
    - Balance General
    - Estado de Resultados (P&G)
    - Estado de Flujos de Efectivo
    - Estado de Cambios en el Patrimonio
    - Informes personalizados
    """

    TIPO_INFORME_CHOICES = [
        ('balance_general', 'Balance General'),
        ('estado_resultados', 'Estado de Resultados (P&G)'),
        ('flujo_efectivo', 'Estado de Flujos de Efectivo'),
        ('cambios_patrimonio', 'Estado de Cambios en el Patrimonio'),
        ('auxiliar_cuentas', 'Auxiliar de Cuentas'),
        ('balance_prueba', 'Balance de Prueba'),
        ('personalizado', 'Informe Personalizado'),
    ]

    NIVEL_DETALLE_CHOICES = [
        (1, 'Clase'),
        (2, 'Grupo'),
        (3, 'Cuenta'),
        (4, 'Subcuenta'),
        (5, 'Auxiliar'),
    ]

    codigo = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Informe'
    )

    tipo_informe = models.CharField(
        max_length=30,
        choices=TIPO_INFORME_CHOICES,
        db_index=True,
        verbose_name='Tipo de Informe'
    )

    nivel_detalle = models.IntegerField(
        choices=NIVEL_DETALLE_CHOICES,
        default=3,
        verbose_name='Nivel de Detalle'
    )

    incluye_saldo_cero = models.BooleanField(
        default=False,
        verbose_name='Incluye Saldos en Cero'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    class Meta:
        db_table = 'accounting_informe_contable'
        verbose_name = 'Informe Contable'
        verbose_name_plural = 'Informes Contables'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['tipo_informe']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'codigo'],
                name='unique_informe_por_empresa'
            )
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ==============================================================================
# MODELO: LÍNEA DE INFORME
# ==============================================================================

class LineaInforme(models.Model):
    """
    Línea de Informe Contable.

    Define la estructura de líneas para informes personalizados.
    Permite agrupar y calcular saldos de múltiples cuentas.
    """

    TIPO_LINEA_CHOICES = [
        ('cuenta', 'Cuenta Específica'),
        ('rango', 'Rango de Cuentas'),
        ('formula', 'Fórmula'),
        ('titulo', 'Título (no suma)'),
        ('subtotal', 'Subtotal'),
        ('total', 'Total'),
    ]

    informe = models.ForeignKey(
        InformeContable,
        on_delete=models.CASCADE,
        related_name='lineas',
        verbose_name='Informe',
        db_index=True
    )

    secuencia = models.IntegerField(
        verbose_name='Secuencia'
    )

    codigo_linea = models.CharField(
        max_length=20,
        verbose_name='Código de Línea'
    )
    descripcion = models.CharField(
        max_length=200,
        verbose_name='Descripción'
    )

    tipo_linea = models.CharField(
        max_length=20,
        choices=TIPO_LINEA_CHOICES,
        verbose_name='Tipo de Línea'
    )

    cuenta_desde = models.ForeignKey(
        'config_contable.CuentaContable',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='lineas_informe_desde',
        verbose_name='Cuenta Desde'
    )
    cuenta_hasta = models.ForeignKey(
        'config_contable.CuentaContable',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='lineas_informe_hasta',
        verbose_name='Cuenta Hasta'
    )
    formula = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Fórmula',
        help_text='Fórmula de cálculo (ej: A1 + A2 - A3)'
    )

    nivel_indentacion = models.IntegerField(
        default=0,
        verbose_name='Nivel de Indentación'
    )
    negrita = models.BooleanField(
        default=False,
        verbose_name='Negrita'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounting_linea_informe'
        verbose_name = 'Línea de Informe'
        verbose_name_plural = 'Líneas de Informes'
        ordering = ['informe', 'secuencia']
        indexes = [
            models.Index(fields=['informe', 'secuencia']),
        ]

    def __str__(self):
        return f"{self.informe.codigo} - L{self.secuencia} - {self.descripcion}"


# ==============================================================================
# MODELO: GENERACIÓN DE INFORME
# ==============================================================================

class GeneracionInforme(BaseCompanyModel):
    """
    Histórico de Generación de Informes.

    Registra cada generación para auditoría y caché.
    """

    ESTADO_CHOICES = [
        ('generando', 'Generando'),
        ('completado', 'Completado'),
        ('error', 'Error'),
    ]

    informe = models.ForeignKey(
        InformeContable,
        on_delete=models.CASCADE,
        related_name='generaciones',
        verbose_name='Informe',
        db_index=True
    )

    fecha_desde = models.DateField(
        verbose_name='Fecha Desde',
        db_index=True
    )
    fecha_hasta = models.DateField(
        verbose_name='Fecha Hasta',
        db_index=True
    )

    centro_costo = models.ForeignKey(
        'config_contable.CentroCostoContable',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Centro de Costo'
    )

    resultado_json = models.JSONField(
        default=dict,
        verbose_name='Resultado JSON'
    )

    archivo_pdf = models.FileField(
        upload_to='contabilidad/informes/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Archivo PDF'
    )
    archivo_excel = models.FileField(
        upload_to='contabilidad/informes/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Archivo Excel'
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='generando',
        db_index=True,
        verbose_name='Estado'
    )
    mensaje_error = models.TextField(
        blank=True,
        verbose_name='Mensaje de Error'
    )

    class Meta:
        db_table = 'accounting_generacion_informe'
        verbose_name = 'Generación de Informe'
        verbose_name_plural = 'Generaciones de Informes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa', 'informe', 'created_at']),
            models.Index(fields=['fecha_desde', 'fecha_hasta']),
        ]

    def __str__(self):
        return f"{self.informe.nombre} - {self.fecha_desde} a {self.fecha_hasta}"
