"""
Admin para Tesorería - Admin Finance
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from .models import (
    Banco, CuentaPorPagar, CuentaPorCobrar,
    FlujoCaja, Pago, Recaudo
)


@admin.register(Banco)
class BancoAdmin(admin.ModelAdmin):
    list_display = ('entidad_bancaria', 'tipo_cuenta', 'numero_cuenta', 'nombre_cuenta',
                    'saldo_actual', 'saldo_disponible', 'estado', 'is_active')
    list_filter = ('estado', 'tipo_cuenta', 'entidad_bancaria', 'is_active')
    search_fields = ('numero_cuenta', 'nombre_cuenta', 'entidad_bancaria')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    fieldsets = (
        ('Información Bancaria', {
            'fields': ('empresa', 'entidad_bancaria', 'tipo_cuenta', 'numero_cuenta',
                      'nombre_cuenta', 'sucursal')
        }),
        ('Saldos', {
            'fields': ('saldo_actual', 'saldo_disponible')
        }),
        ('Estado', {
            'fields': ('estado', 'responsable', 'observaciones', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CuentaPorPagar)
class CuentaPorPagarAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'concepto', 'proveedor', 'monto_total', 'monto_pagado',
                    'fecha_vencimiento', 'estado', 'is_active')
    list_filter = ('estado', 'fecha_vencimiento', 'is_active')
    search_fields = ('codigo', 'concepto', 'proveedor__nombre_comercial')
    readonly_fields = ('codigo', 'created_at', 'updated_at', 'created_by', 'updated_by')
    date_hierarchy = 'fecha_vencimiento'
    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'codigo', 'concepto')
        }),
        ('Origen', {
            'fields': ('proveedor', 'orden_compra', 'liquidacion_nomina')
        }),
        ('Montos', {
            'fields': ('monto_total', 'monto_pagado')
        }),
        ('Fechas', {
            'fields': ('fecha_documento', 'fecha_vencimiento')
        }),
        ('Estado', {
            'fields': ('estado', 'observaciones', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CuentaPorCobrar)
class CuentaPorCobrarAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'concepto', 'cliente', 'monto_total', 'monto_cobrado',
                    'fecha_vencimiento', 'estado', 'is_active')
    list_filter = ('estado', 'fecha_vencimiento', 'is_active')
    search_fields = ('codigo', 'concepto', 'cliente__razon_social')
    readonly_fields = ('codigo', 'created_at', 'updated_at', 'created_by', 'updated_by')
    date_hierarchy = 'fecha_vencimiento'
    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'codigo', 'concepto')
        }),
        ('Origen', {
            'fields': ('cliente', 'factura')
        }),
        ('Montos', {
            'fields': ('monto_total', 'monto_cobrado')
        }),
        ('Fechas', {
            'fields': ('fecha_documento', 'fecha_vencimiento')
        }),
        ('Estado', {
            'fields': ('estado', 'observaciones', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FlujoCaja)
class FlujoCajaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'tipo', 'concepto', 'fecha', 'monto_proyectado',
                    'monto_real', 'is_active')
    list_filter = ('tipo', 'fecha', 'is_active')
    search_fields = ('codigo', 'concepto')
    readonly_fields = ('codigo', 'created_at', 'updated_at', 'created_by', 'updated_by')
    date_hierarchy = 'fecha'
    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'codigo', 'tipo', 'concepto', 'fecha')
        }),
        ('Relaciones', {
            'fields': ('banco', 'cuenta_por_pagar', 'cuenta_por_cobrar')
        }),
        ('Montos', {
            'fields': ('monto_proyectado', 'monto_real')
        }),
        ('Adicional', {
            'fields': ('observaciones', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'cuenta_por_pagar', 'banco', 'fecha_pago', 'monto',
                    'metodo_pago', 'is_active')
    list_filter = ('metodo_pago', 'fecha_pago', 'is_active')
    search_fields = ('codigo', 'referencia')
    readonly_fields = ('codigo', 'created_at', 'updated_at', 'created_by', 'updated_by')
    date_hierarchy = 'fecha_pago'
    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'codigo', 'cuenta_por_pagar', 'banco')
        }),
        ('Detalles del Pago', {
            'fields': ('fecha_pago', 'monto', 'metodo_pago', 'referencia')
        }),
        ('Documentación', {
            'fields': ('comprobante', 'observaciones')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Recaudo)
class RecaudoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'cuenta_por_cobrar', 'banco', 'fecha_recaudo', 'monto',
                    'metodo_pago', 'is_active')
    list_filter = ('metodo_pago', 'fecha_recaudo', 'is_active')
    search_fields = ('codigo', 'referencia')
    readonly_fields = ('codigo', 'created_at', 'updated_at', 'created_by', 'updated_by')
    date_hierarchy = 'fecha_recaudo'
    fieldsets = (
        ('Información General', {
            'fields': ('empresa', 'codigo', 'cuenta_por_cobrar', 'banco')
        }),
        ('Detalles del Recaudo', {
            'fields': ('fecha_recaudo', 'monto', 'metodo_pago', 'referencia')
        }),
        ('Documentación', {
            'fields': ('comprobante', 'observaciones')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
