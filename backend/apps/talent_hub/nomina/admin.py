"""
Admin de Nómina - Talent Hub

Configuración del panel de administración de Django para nómina.
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    ConfiguracionNomina,
    ConceptoNomina,
    PeriodoNomina,
    LiquidacionNomina,
    DetalleLiquidacion,
    Prestacion,
    PagoNomina
)


# =============================================================================
# CONFIGURACIÓN DE NÓMINA
# =============================================================================

@admin.register(ConfiguracionNomina)
class ConfiguracionNominaAdmin(admin.ModelAdmin):
    """Admin para ConfiguracionNomina."""

    list_display = [
        'anio', 'empresa', 'salario_minimo', 'auxilio_transporte',
        'total_seguridad_social_empleado', 'total_parafiscales', 'is_active'
    ]
    list_filter = ['anio', 'empresa', 'is_active']
    search_fields = ['anio', 'empresa__razon_social']
    ordering = ['-anio']
    readonly_fields = [
        'total_seguridad_social_empleado',
        'total_seguridad_social_empresa',
        'total_parafiscales',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]

    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'anio', 'observaciones')
        }),
        ('Salarios Legales', {
            'fields': ('salario_minimo', 'auxilio_transporte')
        }),
        ('Seguridad Social - Empleado', {
            'fields': (
                'porcentaje_salud_empleado',
                'porcentaje_pension_empleado',
                'total_seguridad_social_empleado'
            )
        }),
        ('Seguridad Social - Empleador', {
            'fields': (
                'porcentaje_salud_empresa',
                'porcentaje_pension_empresa',
                'porcentaje_arl',
                'total_seguridad_social_empresa'
            )
        }),
        ('Parafiscales', {
            'fields': (
                'porcentaje_caja_compensacion',
                'porcentaje_icbf',
                'porcentaje_sena',
                'total_parafiscales'
            )
        }),
        ('Prestaciones Sociales', {
            'fields': (
                'dias_base_cesantias',
                'porcentaje_intereses_cesantias',
                'dias_base_prima',
                'dias_vacaciones_por_anio'
            )
        }),
        ('Fondo de Solidaridad', {
            'fields': (
                'salario_base_solidaridad',
                'porcentaje_solidaridad_empleado'
            )
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )


# =============================================================================
# CONCEPTO DE NÓMINA
# =============================================================================

@admin.register(ConceptoNomina)
class ConceptoNominaAdmin(admin.ModelAdmin):
    """Admin para ConceptoNomina."""

    list_display = [
        'codigo', 'nombre', 'tipo', 'categoria', 'es_fijo',
        'es_base_seguridad_social', 'orden', 'is_active'
    ]
    list_filter = ['tipo', 'categoria', 'es_fijo', 'empresa', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['tipo', 'orden', 'nombre']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'codigo', 'nombre', 'descripcion', 'orden')
        }),
        ('Clasificación', {
            'fields': ('tipo', 'categoria')
        }),
        ('Propiedades', {
            'fields': (
                'es_fijo',
                'es_base_seguridad_social',
                'es_base_parafiscales',
                'es_base_prestaciones'
            )
        }),
        ('Fórmula (Opcional)', {
            'fields': ('formula',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )


# =============================================================================
# PERIODO DE NÓMINA
# =============================================================================

@admin.register(PeriodoNomina)
class PeriodoNominaAdmin(admin.ModelAdmin):
    """Admin para PeriodoNomina."""

    list_display = [
        'nombre_periodo', 'empresa', 'fecha_inicio', 'fecha_fin',
        'estado_badge', 'numero_colaboradores', 'total_neto', 'is_active'
    ]
    list_filter = ['anio', 'mes', 'tipo', 'estado', 'empresa', 'is_active']
    search_fields = ['empresa__razon_social']
    ordering = ['-anio', '-mes', 'tipo']
    readonly_fields = [
        'nombre_periodo',
        'total_devengados', 'total_deducciones', 'total_neto',
        'numero_colaboradores', 'cerrado_por', 'fecha_cierre',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]

    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'anio', 'mes', 'tipo', 'nombre_periodo')
        }),
        ('Fechas', {
            'fields': ('fecha_inicio', 'fecha_fin', 'fecha_pago')
        }),
        ('Estado', {
            'fields': ('estado', 'cerrado_por', 'fecha_cierre')
        }),
        ('Totales', {
            'fields': (
                'total_devengados', 'total_deducciones', 'total_neto',
                'numero_colaboradores'
            )
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        """Badge con color según estado."""
        colors = {
            'abierto': '#28a745',
            'preliquidado': '#17a2b8',
            'liquidado': '#ffc107',
            'pagado': '#007bff',
            'cerrado': '#6c757d'
        }
        color = colors.get(obj.estado, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


# =============================================================================
# LIQUIDACIÓN DE NÓMINA
# =============================================================================

class DetalleLiquidacionInline(admin.TabularInline):
    """Inline para detalles de liquidación."""
    model = DetalleLiquidacion
    extra = 0
    readonly_fields = ['valor_total', 'es_devengado']
    fields = ['concepto', 'cantidad', 'valor_unitario', 'valor_total', 'es_devengado']


@admin.register(LiquidacionNomina)
class LiquidacionNominaAdmin(admin.ModelAdmin):
    """Admin para LiquidacionNomina."""

    list_display = [
        'colaborador', 'periodo', 'salario_base', 'neto_pagar',
        'estado_badge', 'esta_aprobada', 'is_active'
    ]
    list_filter = ['estado', 'periodo__anio', 'empresa', 'is_active']
    search_fields = [
        'colaborador__primer_nombre',
        'colaborador__primer_apellido',
        'colaborador__numero_identificacion'
    ]
    ordering = ['-periodo__anio', '-periodo__mes', 'colaborador__primer_apellido']
    readonly_fields = [
        'total_devengados', 'total_deducciones', 'neto_pagar',
        'aprobado_por', 'fecha_aprobacion',
        'created_at', 'updated_at', 'created_by', 'updated_by'
    ]
    inlines = [DetalleLiquidacionInline]

    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'periodo', 'colaborador')
        }),
        ('Datos Base', {
            'fields': ('salario_base', 'dias_trabajados')
        }),
        ('Totales', {
            'fields': ('total_devengados', 'total_deducciones', 'neto_pagar')
        }),
        ('Estado', {
            'fields': ('estado', 'aprobado_por', 'fecha_aprobacion')
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        """Badge con color según estado."""
        colors = {
            'borrador': '#6c757d',
            'preliquidado': '#17a2b8',
            'aprobado': '#28a745',
            'pagado': '#007bff',
            'anulado': '#dc3545'
        }
        color = colors.get(obj.estado, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


# =============================================================================
# DETALLE DE LIQUIDACIÓN
# =============================================================================

@admin.register(DetalleLiquidacion)
class DetalleLiquidacionAdmin(admin.ModelAdmin):
    """Admin para DetalleLiquidacion."""

    list_display = [
        'liquidacion', 'concepto', 'cantidad', 'valor_unitario',
        'valor_total', 'tipo_badge', 'is_active'
    ]
    list_filter = ['es_devengado', 'concepto__tipo', 'empresa', 'is_active']
    search_fields = ['liquidacion__colaborador__primer_apellido', 'concepto__nombre']
    ordering = ['liquidacion', '-es_devengado', 'concepto__orden']
    readonly_fields = ['valor_total', 'es_devengado', 'created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'liquidacion', 'concepto')
        }),
        ('Valores', {
            'fields': ('cantidad', 'valor_unitario', 'valor_total')
        }),
        ('Tipo', {
            'fields': ('es_devengado',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def tipo_badge(self, obj):
        """Badge con color según tipo."""
        color = '#28a745' if obj.es_devengado else '#dc3545'
        texto = 'Devengado' if obj.es_devengado else 'Deducción'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px;">{}</span>',
            color,
            texto
        )
    tipo_badge.short_description = 'Tipo'


# =============================================================================
# PRESTACIÓN SOCIAL
# =============================================================================

@admin.register(Prestacion)
class PrestacionAdmin(admin.ModelAdmin):
    """Admin para Prestacion."""

    list_display = [
        'colaborador', 'anio', 'tipo', 'valor_provisionado',
        'valor_pagado', 'saldo_pendiente', 'estado', 'is_active'
    ]
    list_filter = ['tipo', 'estado', 'anio', 'empresa', 'is_active']
    search_fields = [
        'colaborador__primer_nombre',
        'colaborador__primer_apellido',
        'colaborador__numero_identificacion'
    ]
    ordering = ['-anio', 'colaborador', 'tipo']
    readonly_fields = ['saldo_pendiente', 'created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'colaborador', 'anio', 'tipo')
        }),
        ('Valores', {
            'fields': (
                'valor_base', 'dias_causados',
                'valor_provisionado', 'valor_pagado', 'saldo_pendiente'
            )
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Fechas', {
            'fields': ('fecha_inicio', 'fecha_fin', 'fecha_pago')
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )


# =============================================================================
# PAGO DE NÓMINA
# =============================================================================

@admin.register(PagoNomina)
class PagoNominaAdmin(admin.ModelAdmin):
    """Admin para PagoNomina."""

    list_display = [
        'liquidacion', 'fecha_pago', 'metodo_pago',
        'valor_pagado', 'referencia_pago', 'is_active'
    ]
    list_filter = ['metodo_pago', 'fecha_pago', 'empresa', 'is_active']
    search_fields = [
        'liquidacion__colaborador__primer_apellido',
        'referencia_pago', 'banco'
    ]
    ordering = ['-fecha_pago']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'liquidacion', 'fecha_pago')
        }),
        ('Método de Pago', {
            'fields': ('metodo_pago', 'banco', 'numero_cuenta', 'referencia_pago')
        }),
        ('Valor', {
            'fields': ('valor_pagado',)
        }),
        ('Comprobante', {
            'fields': ('comprobante',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active',
                'created_at', 'updated_at',
                'created_by', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )
