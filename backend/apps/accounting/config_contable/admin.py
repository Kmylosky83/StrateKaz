"""
Admin para config_contable - accounting
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    PlanCuentas, CuentaContable, TipoDocumentoContable,
    Tercero, CentroCostoContable, ConfiguracionModulo
)


@admin.register(PlanCuentas)
class PlanCuentasAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo_plan_badge', 'version', 'fecha_inicio_vigencia', 'activo_badge', 'total_cuentas', 'empresa']
    list_filter = ['tipo_plan', 'es_activo', 'empresa']
    search_fields = ['nombre', 'version']
    ordering = ['-fecha_inicio_vigencia']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def tipo_plan_badge(self, obj):
        colores = {'comercial': '#3498db', 'niif_pymes': '#2ecc71', 'niif_plenas': '#9b59b6', 'simplificado': '#f39c12'}
        color = colores.get(obj.tipo_plan, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.get_tipo_plan_display())
    tipo_plan_badge.short_description = 'Tipo Plan'

    def activo_badge(self, obj):
        if obj.es_activo:
            return format_html('<span style="background-color: #27ae60; color: white; padding: 3px 8px; border-radius: 3px;">Activo</span>')
        return format_html('<span style="background-color: #95a5a6; color: white; padding: 3px 8px; border-radius: 3px;">Inactivo</span>')
    activo_badge.short_description = 'Estado'

    def total_cuentas(self, obj):
        return format_html('<strong>{}</strong>', obj.cuentas.count())
    total_cuentas.short_description = 'Cuentas'


@admin.register(CuentaContable)
class CuentaContableAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'nivel_badge', 'naturaleza_badge', 'clase_cuenta', 'tipo_cuenta', 'acepta_movimientos', 'saldo_display', 'is_active']
    list_filter = ['plan_cuentas', 'nivel', 'naturaleza', 'clase_cuenta', 'tipo_cuenta', 'acepta_movimientos', 'empresa']
    search_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    raw_id_fields = ['cuenta_padre', 'plan_cuentas']
    readonly_fields = ['saldo_debito', 'saldo_credito', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def nivel_badge(self, obj):
        colores = {1: '#e74c3c', 2: '#f39c12', 3: '#3498db', 4: '#2ecc71', 5: '#9b59b6'}
        color = colores.get(obj.nivel, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px;">{}</span>', color, obj.get_nivel_display())
    nivel_badge.short_description = 'Nivel'

    def naturaleza_badge(self, obj):
        color = '#27ae60' if obj.naturaleza == 'debito' else '#e74c3c'
        simbolo = 'D' if obj.naturaleza == 'debito' else 'C'
        return format_html('<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-weight: bold;">{}</span>', color, simbolo)
    naturaleza_badge.short_description = 'Nat.'

    def saldo_display(self, obj):
        saldo = obj.saldo_final
        color = '#27ae60' if saldo >= 0 else '#e74c3c'
        return format_html('<span style="color: {}; font-weight: bold;">${:,.2f}</span>', color, saldo)
    saldo_display.short_description = 'Saldo'


@admin.register(TipoDocumentoContable)
class TipoDocumentoContableAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'clase_documento_badge', 'prefijo', 'consecutivo_actual', 'requiere_aprobacion', 'afecta_contabilidad', 'is_active', 'empresa']
    list_filter = ['clase_documento', 'requiere_aprobacion', 'afecta_contabilidad', 'empresa']
    search_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def clase_documento_badge(self, obj):
        colores = {'diario': '#3498db', 'egreso': '#e74c3c', 'ingreso': '#27ae60', 'ajuste': '#f39c12', 'cierre': '#9b59b6', 'apertura': '#1abc9c', 'nota': '#95a5a6'}
        color = colores.get(obj.clase_documento, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.get_clase_documento_display())
    clase_documento_badge.short_description = 'Clase'


@admin.register(Tercero)
class TerceroAdmin(admin.ModelAdmin):
    list_display = ['identificacion_display', 'razon_social', 'tipo_tercero_badge', 'tipo_persona', 'regimen', 'ciudad', 'responsable_iva', 'is_active', 'empresa']
    list_filter = ['tipo_identificacion', 'tipo_tercero', 'tipo_persona', 'regimen', 'responsable_iva', 'empresa']
    search_fields = ['numero_identificacion', 'razon_social', 'nombre_comercial', 'ciudad']
    ordering = ['razon_social']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def identificacion_display(self, obj):
        return format_html('<strong>{}</strong>', obj.identificacion_completa)
    identificacion_display.short_description = 'Identificación'

    def tipo_tercero_badge(self, obj):
        colores = {'cliente': '#27ae60', 'proveedor': '#3498db', 'empleado': '#9b59b6', 'accionista': '#f39c12', 'gobierno': '#e74c3c', 'otro': '#95a5a6'}
        color = colores.get(obj.tipo_tercero, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.get_tipo_tercero_display())
    tipo_tercero_badge.short_description = 'Tipo'


@admin.register(CentroCostoContable)
class CentroCostoContableAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_centro_badge', 'centro_padre', 'responsable', 'presupuesto_display', 'is_active', 'empresa']
    list_filter = ['tipo_centro', 'empresa']
    search_fields = ['codigo', 'nombre']
    ordering = ['codigo']
    raw_id_fields = ['centro_padre', 'responsable']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def tipo_centro_badge(self, obj):
        colores = {'produccion': '#e74c3c', 'servicio': '#3498db', 'administrativo': '#9b59b6', 'ventas': '#27ae60'}
        color = colores.get(obj.tipo_centro, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.get_tipo_centro_display())
    tipo_centro_badge.short_description = 'Tipo'

    def presupuesto_display(self, obj):
        return format_html('<span style="font-weight: bold;">${:,.0f}</span>', obj.presupuesto_anual)
    presupuesto_display.short_description = 'Presupuesto'


@admin.register(ConfiguracionModulo)
class ConfiguracionModuloAdmin(admin.ModelAdmin):
    list_display = ['empresa', 'plan_cuentas_activo', 'periodo_actual', 'ultimo_periodo_cerrado', 'ejercicio_badge', 'is_active']
    list_filter = ['empresa', 'is_active']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    raw_id_fields = ['plan_cuentas_activo', 'cuenta_utilidad_ejercicio', 'cuenta_perdida_ejercicio', 'cuenta_ganancias_retenidas']

    def ejercicio_badge(self, obj):
        if obj.ejercicio_abierto:
            return format_html('<span style="background-color: #27ae60; color: white; padding: 3px 8px; border-radius: 3px;">Abierto</span>')
        return format_html('<span style="background-color: #e74c3c; color: white; padding: 3px 8px; border-radius: 3px;">Cerrado</span>')
    ejercicio_badge.short_description = 'Ejercicio'
