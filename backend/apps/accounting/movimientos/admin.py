"""
Admin para movimientos - accounting
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import ComprobanteContable, DetalleComprobante, SecuenciaDocumento, AsientoPlantilla


class DetalleComprobanteInline(admin.TabularInline):
    model = DetalleComprobante
    extra = 0
    fields = ['secuencia', 'cuenta', 'descripcion', 'debito', 'credito', 'tercero', 'centro_costo']
    raw_id_fields = ['cuenta', 'tercero', 'centro_costo']


@admin.register(ComprobanteContable)
class ComprobanteContableAdmin(admin.ModelAdmin):
    list_display = ['numero_comprobante', 'tipo_documento', 'periodo', 'fecha_comprobante', 'concepto_corto', 'total_debito_display', 'total_credito_display', 'cuadre_badge', 'estado_badge', 'empresa']
    list_filter = ['tipo_documento', 'estado', 'periodo', 'origen_automatico', 'empresa']
    search_fields = ['numero_comprobante', 'concepto']
    ordering = ['-fecha_comprobante', '-numero_comprobante']
    raw_id_fields = ['tipo_documento', 'aprobado_por', 'anulado_por']
    readonly_fields = ['numero_comprobante', 'fecha_elaboracion', 'total_debito', 'total_credito', 'fecha_aprobacion', 'fecha_anulacion', 'created_at', 'updated_at', 'created_by', 'updated_by']
    inlines = [DetalleComprobanteInline]

    def concepto_corto(self, obj):
        return obj.concepto[:50] + '...' if len(obj.concepto) > 50 else obj.concepto
    concepto_corto.short_description = 'Concepto'

    def total_debito_display(self, obj):
        return format_html('<span style="font-weight: bold;">${:,.2f}</span>', obj.total_debito)
    total_debito_display.short_description = 'Débito'

    def total_credito_display(self, obj):
        return format_html('<span style="font-weight: bold;">${:,.2f}</span>', obj.total_credito)
    total_credito_display.short_description = 'Crédito'

    def cuadre_badge(self, obj):
        if obj.esta_cuadrado:
            return format_html('<span style="background-color: #27ae60; color: white; padding: 3px 8px; border-radius: 3px;">Cuadrado</span>')
        return format_html('<span style="background-color: #e74c3c; color: white; padding: 3px 8px; border-radius: 3px;">Dif: ${:,.2f}</span>', obj.diferencia)
    cuadre_badge.short_description = 'Cuadre'

    def estado_badge(self, obj):
        colores = {'borrador': '#95a5a6', 'pendiente_aprobacion': '#f39c12', 'aprobado': '#3498db', 'contabilizado': '#27ae60', 'anulado': '#e74c3c'}
        color = colores.get(obj.estado, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.get_estado_display())
    estado_badge.short_description = 'Estado'


@admin.register(DetalleComprobante)
class DetalleComprobanteAdmin(admin.ModelAdmin):
    list_display = ['comprobante', 'secuencia', 'cuenta', 'descripcion_corta', 'debito_display', 'credito_display', 'tercero', 'centro_costo']
    list_filter = ['comprobante__tipo_documento', 'cuenta__clase_cuenta']
    search_fields = ['descripcion', 'cuenta__codigo', 'cuenta__nombre', 'comprobante__numero_comprobante']
    ordering = ['comprobante', 'secuencia']
    raw_id_fields = ['comprobante', 'cuenta', 'tercero', 'centro_costo']
    readonly_fields = ['created_at', 'updated_at']

    def descripcion_corta(self, obj):
        return obj.descripcion[:40] + '...' if len(obj.descripcion) > 40 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'

    def debito_display(self, obj):
        if obj.debito > 0:
            return format_html('<span style="color: #27ae60; font-weight: bold;">${:,.2f}</span>', obj.debito)
        return '-'
    debito_display.short_description = 'Débito'

    def credito_display(self, obj):
        if obj.credito > 0:
            return format_html('<span style="color: #e74c3c; font-weight: bold;">${:,.2f}</span>', obj.credito)
        return '-'
    credito_display.short_description = 'Crédito'


@admin.register(SecuenciaDocumento)
class SecuenciaDocumentoAdmin(admin.ModelAdmin):
    list_display = ['tipo_documento', 'periodo', 'consecutivo_actual', 'empresa', 'is_active']
    list_filter = ['tipo_documento', 'periodo', 'empresa']
    search_fields = ['tipo_documento__codigo', 'periodo']
    ordering = ['-periodo', 'tipo_documento']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


@admin.register(AsientoPlantilla)
class AsientoPlantillaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_documento', 'recurrente_badge', 'frecuencia_display', 'is_active', 'empresa']
    list_filter = ['tipo_documento', 'es_recurrente', 'frecuencia', 'empresa']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['codigo']
    raw_id_fields = ['tipo_documento']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def recurrente_badge(self, obj):
        if obj.es_recurrente:
            return format_html('<span style="background-color: #3498db; color: white; padding: 3px 8px; border-radius: 3px;">Recurrente</span>')
        return format_html('<span style="color: #95a5a6;">Manual</span>')
    recurrente_badge.short_description = 'Tipo'

    def frecuencia_display(self, obj):
        if obj.es_recurrente and obj.frecuencia:
            return obj.get_frecuencia_display()
        return '-'
    frecuencia_display.short_description = 'Frecuencia'
