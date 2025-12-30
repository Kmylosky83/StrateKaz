"""
Admin para informes_contables - accounting
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import InformeContable, LineaInforme, GeneracionInforme


class LineaInformeInline(admin.TabularInline):
    model = LineaInforme
    extra = 0
    fields = ['secuencia', 'codigo_linea', 'descripcion', 'tipo_linea', 'cuenta_desde', 'cuenta_hasta', 'formula', 'nivel_indentacion', 'negrita']
    raw_id_fields = ['cuenta_desde', 'cuenta_hasta']


@admin.register(InformeContable)
class InformeContableAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_informe_badge', 'nivel_detalle_badge', 'incluye_saldo_cero', 'total_lineas', 'is_active', 'empresa']
    list_filter = ['tipo_informe', 'nivel_detalle', 'incluye_saldo_cero', 'empresa']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['codigo']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    inlines = [LineaInformeInline]

    def tipo_informe_badge(self, obj):
        colores = {'balance_general': '#3498db', 'estado_resultados': '#27ae60', 'flujo_efectivo': '#9b59b6', 'cambios_patrimonio': '#f39c12', 'auxiliar_cuentas': '#1abc9c', 'balance_prueba': '#e74c3c', 'personalizado': '#95a5a6'}
        color = colores.get(obj.tipo_informe, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.get_tipo_informe_display())
    tipo_informe_badge.short_description = 'Tipo'

    def nivel_detalle_badge(self, obj):
        return format_html('<span style="font-weight: bold;">Nivel {}</span>', obj.nivel_detalle)
    nivel_detalle_badge.short_description = 'Detalle'

    def total_lineas(self, obj):
        return format_html('<strong>{}</strong>', obj.lineas.count())
    total_lineas.short_description = 'Líneas'


@admin.register(LineaInforme)
class LineaInformeAdmin(admin.ModelAdmin):
    list_display = ['informe', 'secuencia', 'codigo_linea', 'descripcion_corta', 'tipo_linea_badge', 'cuenta_desde', 'cuenta_hasta', 'negrita']
    list_filter = ['informe', 'tipo_linea', 'negrita']
    search_fields = ['codigo_linea', 'descripcion', 'informe__codigo', 'informe__nombre']
    ordering = ['informe', 'secuencia']
    raw_id_fields = ['informe', 'cuenta_desde', 'cuenta_hasta']
    readonly_fields = ['created_at', 'updated_at']

    def descripcion_corta(self, obj):
        return obj.descripcion[:40] + '...' if len(obj.descripcion) > 40 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'

    def tipo_linea_badge(self, obj):
        colores = {'cuenta': '#3498db', 'rango': '#9b59b6', 'formula': '#f39c12', 'titulo': '#95a5a6', 'subtotal': '#2ecc71', 'total': '#27ae60'}
        color = colores.get(obj.tipo_linea, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px;">{}</span>', color, obj.get_tipo_linea_display())
    tipo_linea_badge.short_description = 'Tipo'


@admin.register(GeneracionInforme)
class GeneracionInformeAdmin(admin.ModelAdmin):
    list_display = ['informe', 'fecha_desde', 'fecha_hasta', 'centro_costo', 'estado_badge', 'archivos_badge', 'created_at', 'empresa']
    list_filter = ['informe', 'estado', 'empresa']
    search_fields = ['informe__codigo', 'informe__nombre']
    ordering = ['-created_at']
    raw_id_fields = ['informe', 'centro_costo']
    readonly_fields = ['resultado_json', 'archivo_pdf', 'archivo_excel', 'mensaje_error', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def estado_badge(self, obj):
        colores = {'generando': '#f39c12', 'completado': '#27ae60', 'error': '#e74c3c'}
        color = colores.get(obj.estado, '#95a5a6')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>', color, obj.get_estado_display())
    estado_badge.short_description = 'Estado'

    def archivos_badge(self, obj):
        archivos = []
        if obj.archivo_pdf:
            archivos.append('PDF')
        if obj.archivo_excel:
            archivos.append('Excel')
        if archivos:
            return format_html('<span style="color: #27ae60;">{}</span>', ', '.join(archivos))
        return format_html('<span style="color: #95a5a6;">-</span>')
    archivos_badge.short_description = 'Archivos'
