"""
Admin para Gestión de Flota - Logistics Fleet Management
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    TipoVehiculo, EstadoVehiculo, Vehiculo, DocumentoVehiculo,
    HojaVidaVehiculo, MantenimientoVehiculo, CostoOperacion,
    VerificacionTercero
)


# ==============================================================================
# ADMIN CATÁLOGOS
# ==============================================================================

@admin.register(TipoVehiculo)
class TipoVehiculoAdmin(admin.ModelAdmin):
    """Admin para Tipo de Vehículo."""
    list_display = [
        'codigo', 'nombre', 'capacidad_kg', 'capacidad_m3',
        'requiere_refrigeracion', 'categoria_licencia',
        'orden', 'is_active'
    ]
    list_filter = ['is_active', 'requiere_refrigeracion', 'requiere_licencia_especial']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'orden')
        }),
        ('Capacidades', {
            'fields': ('capacidad_kg', 'capacidad_m3')
        }),
        ('Requisitos', {
            'fields': (
                'requiere_refrigeracion',
                'requiere_licencia_especial',
                'categoria_licencia'
            )
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
    )


@admin.register(EstadoVehiculo)
class EstadoVehiculoAdmin(admin.ModelAdmin):
    """Admin para Estado de Vehículo."""
    list_display = [
        'codigo', 'nombre', 'color_badge', 'disponible_para_ruta',
        'requiere_mantenimiento', 'orden', 'is_active'
    ]
    list_filter = ['is_active', 'disponible_para_ruta', 'requiere_mantenimiento']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']

    def color_badge(self, obj):
        if obj.color:
            return format_html(
                '<span style="background-color: {}; padding: 3px 10px; color: white; border-radius: 3px;">{}</span>',
                obj.color,
                obj.nombre
            )
        return obj.nombre
    color_badge.short_description = 'Color'


# ==============================================================================
# ADMIN PRINCIPAL - VEHÍCULOS
# ==============================================================================

@admin.register(Vehiculo)
class VehiculoAdmin(admin.ModelAdmin):
    """Admin para Vehículo."""
    list_display = [
        'placa', 'marca', 'modelo', 'anio', 'tipo_vehiculo',
        'estado_badge', 'km_actual', 'documentos_status',
        'es_propio', 'is_active'
    ]
    list_filter = [
        'is_active', 'tipo_vehiculo', 'estado', 'es_propio',
        'es_contratado', 'gps_instalado', 'empresa'
    ]
    search_fields = ['placa', 'marca', 'modelo', 'numero_motor', 'numero_chasis', 'vin']
    ordering = ['placa']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    fieldsets = (
        ('Empresa', {
            'fields': ('empresa',)
        }),
        ('Identificación', {
            'fields': ('placa', 'tipo_vehiculo', 'estado')
        }),
        ('Información Básica', {
            'fields': ('marca', 'modelo', 'anio', 'color')
        }),
        ('Identificación Técnica', {
            'fields': ('numero_motor', 'numero_chasis', 'vin'),
            'classes': ('collapse',)
        }),
        ('Capacidad Operativa', {
            'fields': ('capacidad_kg', 'km_actual')
        }),
        ('Documentos Legales', {
            'fields': ('fecha_matricula', 'fecha_soat', 'fecha_tecnomecanica')
        }),
        ('Propiedad', {
            'fields': (
                'propietario_nombre', 'propietario_documento',
                'es_propio', 'es_contratado'
            )
        }),
        ('Tecnología GPS', {
            'fields': ('gps_instalado', 'numero_gps'),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
        ('Auditoría', {
            'fields': (
                'is_active', 'deleted_at',
                'created_at', 'created_by',
                'updated_at', 'updated_by'
            ),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        color = obj.estado.color or '#6c757d'
        return format_html(
            '<span style="background-color: {}; padding: 3px 10px; color: white; border-radius: 3px;">{}</span>',
            color,
            obj.estado.nombre
        )
    estado_badge.short_description = 'Estado'

    def documentos_status(self, obj):
        if obj.documentos_al_dia:
            return format_html('<span style="color: green;">✓ Al día</span>')
        else:
            return format_html('<span style="color: red;">✗ Vencidos</span>')
    documentos_status.short_description = 'Documentos'


# ==============================================================================
# ADMIN DOCUMENTOS
# ==============================================================================

@admin.register(DocumentoVehiculo)
class DocumentoVehiculoAdmin(admin.ModelAdmin):
    """Admin para Documento de Vehículo."""
    list_display = [
        'vehiculo', 'tipo_documento', 'numero_documento',
        'fecha_vencimiento', 'estado_vencimiento', 'is_active'
    ]
    list_filter = ['tipo_documento', 'is_active', 'empresa']
    search_fields = ['vehiculo__placa', 'numero_documento', 'entidad_emisora']
    ordering = ['-fecha_vencimiento']
    date_hierarchy = 'fecha_vencimiento'
    readonly_fields = ['created_at', 'updated_at', 'created_by']

    def estado_vencimiento(self, obj):
        if obj.esta_vencido:
            return format_html('<span style="color: red;">✗ Vencido</span>')
        elif obj.proximo_a_vencer:
            return format_html('<span style="color: orange;">⚠ Por vencer</span>')
        else:
            return format_html('<span style="color: green;">✓ Vigente</span>')
    estado_vencimiento.short_description = 'Estado'


@admin.register(HojaVidaVehiculo)
class HojaVidaVehiculoAdmin(admin.ModelAdmin):
    """Admin para Hoja de Vida de Vehículo."""
    list_display = [
        'vehiculo', 'fecha', 'tipo_evento', 'km_evento',
        'costo', 'registrado_por', 'is_active'
    ]
    list_filter = ['tipo_evento', 'is_active', 'empresa', 'fecha']
    search_fields = ['vehiculo__placa', 'descripcion', 'proveedor']
    ordering = ['-fecha', '-created_at']
    date_hierarchy = 'fecha'
    readonly_fields = ['created_at', 'updated_at', 'created_by']


# ==============================================================================
# ADMIN MANTENIMIENTO
# ==============================================================================

@admin.register(MantenimientoVehiculo)
class MantenimientoVehiculoAdmin(admin.ModelAdmin):
    """Admin para Mantenimiento de Vehículo."""
    list_display = [
        'vehiculo', 'tipo', 'fecha_programada', 'fecha_ejecucion',
        'estado_badge', 'costo_total', 'responsable', 'is_active'
    ]
    list_filter = ['tipo', 'estado', 'is_active', 'empresa']
    search_fields = ['vehiculo__placa', 'descripcion', 'proveedor_nombre']
    ordering = ['-fecha_programada']
    date_hierarchy = 'fecha_programada'
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by', 'costo_total']

    fieldsets = (
        ('Empresa', {
            'fields': ('empresa',)
        }),
        ('Vehículo y Tipo', {
            'fields': ('vehiculo', 'tipo', 'descripcion')
        }),
        ('Fechas', {
            'fields': ('fecha_programada', 'fecha_ejecucion')
        }),
        ('Kilometraje', {
            'fields': ('km_mantenimiento', 'km_proximo_mantenimiento')
        }),
        ('Costos', {
            'fields': ('costo_mano_obra', 'costo_repuestos', 'costo_total')
        }),
        ('Proveedor', {
            'fields': ('proveedor_nombre', 'factura_numero')
        }),
        ('Responsable y Estado', {
            'fields': ('responsable', 'estado')
        }),
        ('Auditoría', {
            'fields': ('is_active', 'created_at', 'created_by', 'updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        colors = {
            'PROGRAMADO': '#007bff',
            'EN_EJECUCION': '#ffc107',
            'COMPLETADO': '#28a745',
            'CANCELADO': '#6c757d'
        }
        color = colors.get(obj.estado, '#6c757d')
        return format_html(
            '<span style="background-color: {}; padding: 3px 10px; color: white; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


# ==============================================================================
# ADMIN COSTOS
# ==============================================================================

@admin.register(CostoOperacion)
class CostoOperacionAdmin(admin.ModelAdmin):
    """Admin para Costo de Operación."""
    list_display = [
        'vehiculo', 'fecha', 'tipo_costo', 'valor',
        'km_recorridos', 'consumo_km_litro', 'registrado_por', 'is_active'
    ]
    list_filter = ['tipo_costo', 'is_active', 'empresa', 'fecha']
    search_fields = ['vehiculo__placa', 'factura_numero', 'observaciones']
    ordering = ['-fecha']
    date_hierarchy = 'fecha'
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'consumo_km_litro']


# ==============================================================================
# ADMIN PESV - VERIFICACIONES
# ==============================================================================

@admin.register(VerificacionTercero)
class VerificacionTerceroAdmin(admin.ModelAdmin):
    """Admin para Verificación de Tercero (PESV)."""
    list_display = [
        'vehiculo', 'fecha', 'tipo', 'resultado_badge',
        'porcentaje_cumplimiento', 'inspector_info', 'is_active'
    ]
    list_filter = ['tipo', 'resultado', 'is_active', 'empresa']
    search_fields = ['vehiculo__placa', 'inspector_externo', 'observaciones_generales']
    ordering = ['-fecha']
    date_hierarchy = 'fecha'
    readonly_fields = ['created_at', 'updated_at', 'created_by']

    fieldsets = (
        ('Empresa', {
            'fields': ('empresa',)
        }),
        ('Vehículo y Verificación', {
            'fields': ('vehiculo', 'fecha', 'tipo')
        }),
        ('Inspector', {
            'fields': ('inspector', 'inspector_externo')
        }),
        ('Checklist', {
            'fields': ('checklist_items',)
        }),
        ('Resultado', {
            'fields': ('resultado', 'kilometraje', 'nivel_combustible')
        }),
        ('Observaciones y Acciones', {
            'fields': ('observaciones_generales', 'firma_inspector_url', 'acciones_correctivas')
        }),
        ('Auditoría', {
            'fields': ('is_active', 'created_at', 'created_by', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def resultado_badge(self, obj):
        colors = {
            'APROBADO': '#28a745',
            'APROBADO_CON_OBSERVACIONES': '#ffc107',
            'RECHAZADO': '#dc3545'
        }
        color = colors.get(obj.resultado, '#6c757d')
        return format_html(
            '<span style="background-color: {}; padding: 3px 10px; color: white; border-radius: 3px;">{}</span>',
            color,
            obj.get_resultado_display()
        )
    resultado_badge.short_description = 'Resultado'

    def inspector_info(self, obj):
        if obj.inspector:
            return obj.inspector.get_full_name()
        return obj.inspector_externo or 'N/A'
    inspector_info.short_description = 'Inspector'

    def porcentaje_cumplimiento(self, obj):
        porcentaje = obj.porcentaje_cumplimiento
        if porcentaje is not None:
            if porcentaje >= 90:
                color = 'green'
            elif porcentaje >= 70:
                color = 'orange'
            else:
                color = 'red'
            return format_html(
                '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
                color,
                porcentaje
            )
        return 'N/A'
    porcentaje_cumplimiento.short_description = '% Cumplimiento'
