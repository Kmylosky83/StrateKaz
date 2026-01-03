"""
Modelos para config_contable - accounting
Sistema de Gestión StrateKaz

Módulo ACTIVABLE de Contabilidad - Configuración:
- PlanCuentas: Plan de cuentas PUC colombiano
- CuentaContable: Cuentas con naturaleza débito/crédito
- TipoDocumentoContable: Tipos de comprobantes
- Tercero: Terceros contables (clientes, proveedores, empleados)
- CentroCostoContable: Centros de costo para distribución
- ConfiguracionModulo: Configuración general del módulo

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from decimal import Decimal
from apps.core.base_models.base import BaseCompanyModel


# ==============================================================================
# MODELO: PLAN DE CUENTAS
# ==============================================================================

class PlanCuentas(BaseCompanyModel):
    """
    Plan de Cuentas PUC Colombiano.

    Estructura jerárquica del plan único de cuentas para Colombia.
    Soporta diferentes versiones: Comercial, NIIF PYMES, NIIF Plenas.
    """

    TIPO_PLAN_CHOICES = [
        ('comercial', 'PUC Comercial'),
        ('niif_pymes', 'NIIF para PYMES'),
        ('niif_plenas', 'NIIF Plenas'),
        ('simplificado', 'Régimen Simplificado'),
    ]

    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Plan',
        help_text='Nombre del plan de cuentas (ej: PUC NIIF PYMES 2025)'
    )
    version = models.CharField(
        max_length=50,
        verbose_name='Versión'
    )
    tipo_plan = models.CharField(
        max_length=30,
        choices=TIPO_PLAN_CHOICES,
        default='niif_pymes',
        db_index=True,
        verbose_name='Tipo de Plan'
    )

    fecha_inicio_vigencia = models.DateField(
        verbose_name='Fecha Inicio Vigencia',
        db_index=True
    )
    fecha_fin_vigencia = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Fin Vigencia'
    )

    es_activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Plan Activo'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    class Meta:
        db_table = 'accounting_plan_cuentas'
        verbose_name = 'Plan de Cuentas'
        verbose_name_plural = 'Planes de Cuentas'
        ordering = ['-fecha_inicio_vigencia']
        indexes = [
            models.Index(fields=['empresa', 'es_activo']),
            models.Index(fields=['tipo_plan', 'fecha_inicio_vigencia']),
        ]

    def __str__(self):
        return f"{self.nombre} - {self.get_tipo_plan_display()}"

    def clean(self):
        if self.fecha_fin_vigencia and self.fecha_fin_vigencia < self.fecha_inicio_vigencia:
            raise ValidationError({
                'fecha_fin_vigencia': 'La fecha de fin debe ser posterior a la fecha de inicio.'
            })


# ==============================================================================
# MODELO: CUENTA CONTABLE
# ==============================================================================

class CuentaContable(BaseCompanyModel):
    """
    Cuenta Contable del PUC Colombiano.

    Estructura jerárquica multinivel:
    - Clase (1 dígito): 1-Activo, 2-Pasivo, 3-Patrimonio, etc.
    - Grupo (2 dígitos): 11-Disponible, 12-Inversiones, etc.
    - Cuenta (4 dígitos): 1105-Caja, 1110-Bancos, etc.
    - Subcuenta (6 dígitos): 110505-Caja General, etc.
    - Auxiliar (8+ dígitos): 11050501-Caja Menor Administración
    """

    NIVEL_CHOICES = [
        (1, 'Clase (1 dígito)'),
        (2, 'Grupo (2 dígitos)'),
        (3, 'Cuenta (4 dígitos)'),
        (4, 'Subcuenta (6 dígitos)'),
        (5, 'Auxiliar (8+ dígitos)'),
    ]

    NATURALEZA_CHOICES = [
        ('debito', 'Débito'),
        ('credito', 'Crédito'),
    ]

    TIPO_CUENTA_CHOICES = [
        ('detalle', 'Cuenta de Detalle'),
        ('titulo', 'Cuenta Título'),
    ]

    CLASE_CUENTA_CHOICES = [
        ('activo', 'Activo'),
        ('pasivo', 'Pasivo'),
        ('patrimonio', 'Patrimonio'),
        ('ingreso', 'Ingreso'),
        ('gasto', 'Gasto'),
        ('costo', 'Costo de Venta'),
        ('orden', 'Cuentas de Orden'),
    ]

    plan_cuentas = models.ForeignKey(
        PlanCuentas,
        on_delete=models.CASCADE,
        related_name='cuentas',
        verbose_name='Plan de Cuentas',
        db_index=True
    )

    codigo = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código PUC'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Cuenta'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    cuenta_padre = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcuentas',
        verbose_name='Cuenta Padre'
    )

    nivel = models.IntegerField(
        choices=NIVEL_CHOICES,
        verbose_name='Nivel de la Cuenta',
        db_index=True
    )

    naturaleza = models.CharField(
        max_length=10,
        choices=NATURALEZA_CHOICES,
        verbose_name='Naturaleza',
        db_index=True
    )

    tipo_cuenta = models.CharField(
        max_length=20,
        choices=TIPO_CUENTA_CHOICES,
        default='detalle',
        verbose_name='Tipo de Cuenta',
        db_index=True
    )

    clase_cuenta = models.CharField(
        max_length=20,
        choices=CLASE_CUENTA_CHOICES,
        db_index=True,
        verbose_name='Clase de Cuenta'
    )

    # Configuración de uso
    exige_tercero = models.BooleanField(
        default=False,
        verbose_name='Exige Tercero'
    )
    exige_centro_costo = models.BooleanField(
        default=False,
        verbose_name='Exige Centro de Costo'
    )
    exige_base_retencion = models.BooleanField(
        default=False,
        verbose_name='Exige Base Retención'
    )
    permite_saldo_negativo = models.BooleanField(
        default=False,
        verbose_name='Permite Saldo Negativo'
    )

    # Saldos denormalizados
    saldo_debito = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Saldo Débito'
    )
    saldo_credito = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Saldo Crédito'
    )

    acepta_movimientos = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Acepta Movimientos'
    )

    modulo_origen = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Módulo de Origen'
    )

    class Meta:
        db_table = 'accounting_cuenta_contable'
        verbose_name = 'Cuenta Contable'
        verbose_name_plural = 'Cuentas Contables'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['plan_cuentas', 'codigo']),
            models.Index(fields=['clase_cuenta', 'nivel']),
            models.Index(fields=['naturaleza', 'tipo_cuenta']),
            models.Index(fields=['acepta_movimientos', 'tipo_cuenta']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['plan_cuentas', 'codigo'],
                name='unique_codigo_por_plan'
            )
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def saldo_final(self):
        """Calcula el saldo final según naturaleza de la cuenta."""
        if self.naturaleza == 'debito':
            return self.saldo_debito - self.saldo_credito
        return self.saldo_credito - self.saldo_debito

    @property
    def es_cuenta_titulo(self):
        """Verifica si es cuenta título."""
        return self.tipo_cuenta == 'titulo'

    def actualizar_saldo(self, debito=Decimal('0.00'), credito=Decimal('0.00')):
        """Actualiza los saldos de la cuenta."""
        self.saldo_debito += debito
        self.saldo_credito += credito
        self.save(update_fields=['saldo_debito', 'saldo_credito', 'updated_at'])

    def clean(self):
        if self.tipo_cuenta == 'titulo' and self.acepta_movimientos:
            raise ValidationError({
                'acepta_movimientos': 'Las cuentas título no pueden aceptar movimientos directos.'
            })


# ==============================================================================
# MODELO: TIPO DOCUMENTO CONTABLE
# ==============================================================================

class TipoDocumentoContable(BaseCompanyModel):
    """
    Tipo de Documento Contable.

    Define los tipos de comprobantes contables:
    - CD: Comprobante de Diario
    - CE: Comprobante de Egreso
    - CI: Comprobante de Ingreso
    - CA: Comprobante de Ajuste
    - CC: Comprobante de Cierre
    - NC: Nota Contable
    """

    CLASE_DOCUMENTO_CHOICES = [
        ('diario', 'Comprobante de Diario'),
        ('egreso', 'Comprobante de Egreso'),
        ('ingreso', 'Comprobante de Ingreso'),
        ('ajuste', 'Comprobante de Ajuste'),
        ('cierre', 'Comprobante de Cierre'),
        ('apertura', 'Comprobante de Apertura'),
        ('nota', 'Nota Contable'),
    ]

    codigo = models.CharField(
        max_length=10,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )

    clase_documento = models.CharField(
        max_length=20,
        choices=CLASE_DOCUMENTO_CHOICES,
        db_index=True,
        verbose_name='Clase de Documento'
    )

    prefijo = models.CharField(
        max_length=10,
        verbose_name='Prefijo'
    )
    consecutivo_actual = models.IntegerField(
        default=0,
        verbose_name='Consecutivo Actual'
    )
    usa_periodo_numeracion = models.BooleanField(
        default=True,
        verbose_name='Usa Período en Numeración'
    )

    requiere_aprobacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Aprobación'
    )
    afecta_contabilidad = models.BooleanField(
        default=True,
        verbose_name='Afecta Contabilidad'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    class Meta:
        db_table = 'accounting_tipo_documento_contable'
        verbose_name = 'Tipo de Documento Contable'
        verbose_name_plural = 'Tipos de Documentos Contables'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['clase_documento']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'codigo'],
                name='unique_tipo_doc_por_empresa'
            )
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def obtener_siguiente_consecutivo(self, periodo=None):
        """Obtiene el siguiente número consecutivo."""
        from django.db import transaction

        with transaction.atomic():
            self.consecutivo_actual += 1
            self.save(update_fields=['consecutivo_actual', 'updated_at'])

            if self.usa_periodo_numeracion and periodo:
                return f"{self.prefijo}{periodo}-{self.consecutivo_actual:04d}"
            return f"{self.prefijo}{self.consecutivo_actual:06d}"


# ==============================================================================
# MODELO: TERCERO CONTABLE
# ==============================================================================

class Tercero(BaseCompanyModel):
    """
    Tercero Contable.

    Integración con entidades externas:
    - Clientes (sales_crm)
    - Proveedores (supply_chain)
    - Empleados (talent_hub)
    - Otros terceros
    """

    TIPO_IDENTIFICACION_CHOICES = [
        ('nit', 'NIT'),
        ('cc', 'Cédula de Ciudadanía'),
        ('ce', 'Cédula de Extranjería'),
        ('pasaporte', 'Pasaporte'),
        ('rut', 'RUT'),
        ('otro', 'Otro'),
    ]

    TIPO_TERCERO_CHOICES = [
        ('cliente', 'Cliente'),
        ('proveedor', 'Proveedor'),
        ('empleado', 'Empleado'),
        ('accionista', 'Accionista'),
        ('gobierno', 'Entidad Gubernamental'),
        ('otro', 'Otro'),
    ]

    TIPO_PERSONA_CHOICES = [
        ('juridica', 'Persona Jurídica'),
        ('natural', 'Persona Natural'),
    ]

    REGIMEN_CHOICES = [
        ('comun', 'Régimen Común'),
        ('simplificado', 'Régimen Simplificado'),
        ('especial', 'Régimen Especial'),
        ('no_responsable', 'No Responsable'),
    ]

    tipo_identificacion = models.CharField(
        max_length=20,
        choices=TIPO_IDENTIFICACION_CHOICES,
        verbose_name='Tipo de Identificación',
        db_index=True
    )
    numero_identificacion = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Número de Identificación'
    )
    digito_verificacion = models.CharField(
        max_length=1,
        blank=True,
        verbose_name='Dígito de Verificación'
    )

    razon_social = models.CharField(
        max_length=200,
        verbose_name='Razón Social / Nombre Completo'
    )
    nombre_comercial = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nombre Comercial'
    )

    tipo_tercero = models.CharField(
        max_length=20,
        choices=TIPO_TERCERO_CHOICES,
        db_index=True,
        verbose_name='Tipo de Tercero'
    )

    tipo_persona = models.CharField(
        max_length=20,
        choices=TIPO_PERSONA_CHOICES,
        verbose_name='Tipo de Persona',
        db_index=True
    )

    # Información tributaria
    responsable_iva = models.BooleanField(
        default=False,
        verbose_name='Responsable de IVA'
    )
    regimen = models.CharField(
        max_length=20,
        choices=REGIMEN_CHOICES,
        verbose_name='Régimen Tributario',
        db_index=True
    )
    gran_contribuyente = models.BooleanField(
        default=False,
        verbose_name='Gran Contribuyente'
    )
    autoretenedor = models.BooleanField(
        default=False,
        verbose_name='Autoretenedor'
    )

    # Contacto
    direccion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Dirección'
    )
    ciudad = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Ciudad'
    )
    telefono = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Teléfono'
    )
    email = models.EmailField(
        blank=True,
        verbose_name='Email'
    )

    class Meta:
        db_table = 'accounting_tercero'
        verbose_name = 'Tercero Contable'
        verbose_name_plural = 'Terceros Contables'
        ordering = ['razon_social']
        indexes = [
            models.Index(fields=['empresa', 'tipo_tercero']),
            models.Index(fields=['numero_identificacion']),
            models.Index(fields=['tipo_identificacion', 'numero_identificacion']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'tipo_identificacion', 'numero_identificacion'],
                name='unique_tercero_identificacion'
            )
        ]

    def __str__(self):
        return f"{self.numero_identificacion} - {self.razon_social}"

    @property
    def identificacion_completa(self):
        """Retorna la identificación completa con DV."""
        if self.digito_verificacion:
            return f"{self.numero_identificacion}-{self.digito_verificacion}"
        return self.numero_identificacion


# ==============================================================================
# MODELO: CENTRO DE COSTO CONTABLE
# ==============================================================================

class CentroCostoContable(BaseCompanyModel):
    """
    Centro de Costo Contable.

    DIFERENTE del centro de costo presupuestal.
    Estructura jerárquica para distribución de costos.
    """

    TIPO_CENTRO_CHOICES = [
        ('produccion', 'Centro de Producción'),
        ('servicio', 'Centro de Servicio'),
        ('administrativo', 'Centro Administrativo'),
        ('ventas', 'Centro de Ventas'),
    ]

    codigo = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Centro de Costo'
    )

    centro_padre = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcentros',
        verbose_name='Centro Padre'
    )

    tipo_centro = models.CharField(
        max_length=20,
        choices=TIPO_CENTRO_CHOICES,
        db_index=True,
        verbose_name='Tipo de Centro de Costo'
    )

    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='accounting_centros_costo_responsable',
        verbose_name='Responsable'
    )

    presupuesto_anual = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Presupuesto Anual'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    class Meta:
        db_table = 'accounting_centro_costo'
        verbose_name = 'Centro de Costo Contable'
        verbose_name_plural = 'Centros de Costo Contables'
        ordering = ['codigo']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['tipo_centro']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['empresa', 'codigo'],
                name='unique_centro_costo_contable_por_empresa'
            )
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ==============================================================================
# MODELO: CONFIGURACIÓN DEL MÓDULO
# ==============================================================================

class ConfiguracionModulo(BaseCompanyModel):
    """
    Configuración del Módulo Contable.

    Un solo registro activo por empresa.
    """

    plan_cuentas_activo = models.ForeignKey(
        PlanCuentas,
        on_delete=models.PROTECT,
        related_name='configuraciones_activas',
        verbose_name='Plan de Cuentas Activo'
    )

    # Período contable
    periodo_actual = models.CharField(
        max_length=7,
        verbose_name='Período Actual',
        help_text='Formato YYYY-MM'
    )
    fecha_inicio_ejercicio = models.DateField(
        verbose_name='Inicio Ejercicio Fiscal'
    )
    fecha_fin_ejercicio = models.DateField(
        verbose_name='Fin Ejercicio Fiscal'
    )

    ultimo_periodo_cerrado = models.CharField(
        max_length=7,
        blank=True,
        verbose_name='Último Período Cerrado'
    )
    permite_modificar_periodos_cerrados = models.BooleanField(
        default=False,
        verbose_name='Permite Modificar Períodos Cerrados'
    )

    # Cuentas especiales
    cuenta_utilidad_ejercicio = models.ForeignKey(
        CuentaContable,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='config_utilidad_ejercicio',
        verbose_name='Cuenta Utilidad del Ejercicio'
    )
    cuenta_perdida_ejercicio = models.ForeignKey(
        CuentaContable,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='config_perdida_ejercicio',
        verbose_name='Cuenta Pérdida del Ejercicio'
    )
    cuenta_ganancias_retenidas = models.ForeignKey(
        CuentaContable,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='config_ganancias_retenidas',
        verbose_name='Cuenta Ganancias Retenidas'
    )

    # Integración automática
    contabiliza_automatico_pagos = models.BooleanField(
        default=True,
        verbose_name='Contabilizar Automático Pagos'
    )
    contabiliza_automatico_recaudos = models.BooleanField(
        default=True,
        verbose_name='Contabilizar Automático Recaudos'
    )
    contabiliza_automatico_nomina = models.BooleanField(
        default=True,
        verbose_name='Contabilizar Automático Nómina'
    )
    contabiliza_automatico_inventarios = models.BooleanField(
        default=True,
        verbose_name='Contabilizar Automático Inventarios'
    )

    # Validaciones
    decimales_moneda = models.IntegerField(
        default=2,
        choices=[(0, '0'), (2, '2'), (4, '4')],
        verbose_name='Decimales para Moneda'
    )
    exige_cuadre_comprobantes = models.BooleanField(
        default=True,
        verbose_name='Exige Cuadre en Comprobantes'
    )
    exige_centro_costo_gastos = models.BooleanField(
        default=True,
        verbose_name='Exige Centro Costo en Gastos'
    )

    class Meta:
        db_table = 'accounting_configuracion_modulo'
        verbose_name = 'Configuración Módulo Contable'
        verbose_name_plural = 'Configuraciones Módulo Contable'
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"Configuración Contable - {self.empresa}"

    @property
    def ejercicio_abierto(self):
        """Verifica si el ejercicio fiscal está abierto."""
        from django.utils import timezone
        hoy = timezone.now().date()
        return self.fecha_inicio_ejercicio <= hoy <= self.fecha_fin_ejercicio
