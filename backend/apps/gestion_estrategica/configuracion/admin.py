"""
Admin para el módulo de Configuración Empresarial

NOTA: UnidadMedida y ConsecutivoConfig fueron migrados a organizacion.
"""
from django.contrib import admin
from .models import (
    SedeEmpresa, IntegracionExterna,
    TipoSede, TipoServicioIntegracion, ProveedorIntegracion, NormaISO, TipoCambio,
    TipoContrato, UnidadNegocio,
)


@admin.register(SedeEmpresa)
class SedeEmpresaAdmin(admin.ModelAdmin):
    """Admin para sedes de la empresa"""
    list_display = ['codigo', 'nombre', 'tipo_sede', 'ciudad', 'es_sede_principal', 'is_active']
    list_filter = ['tipo_sede', 'departamento', 'is_active', 'es_sede_principal']
    search_fields = ['codigo', 'nombre', 'direccion', 'ciudad']
    ordering = ['-es_sede_principal', 'nombre']
    list_editable = ['is_active']
    raw_id_fields = ['responsable', 'created_by', 'updated_by']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'nombre', 'tipo_sede', 'descripcion', 'es_sede_principal')
        }),
        ('Ubicación', {
            'fields': ('direccion', 'ciudad', 'departamento', 'codigo_postal',
                      'latitud', 'longitud')
        }),
        ('Administración', {
            'fields': ('responsable', 'telefono', 'email')
        }),
        ('Operación', {
            'fields': ('fecha_apertura', 'fecha_cierre', 'capacidad_almacenamiento',
                      'unidad_capacidad', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(IntegracionExterna)
class IntegracionExternaAdmin(admin.ModelAdmin):
    """Admin para integraciones externas"""
    list_display = ['nombre', 'tipo_servicio', 'proveedor', 'ambiente', 'is_active', 'status_indicator']
    list_filter = ['tipo_servicio', 'proveedor', 'ambiente', 'is_active']
    search_fields = ['nombre', 'descripcion']
    ordering = ['tipo_servicio', 'nombre']
    list_editable = ['is_active']
    raw_id_fields = ['created_by', 'updated_by']
    readonly_fields = ['created_at', 'updated_at', 'ultima_conexion_exitosa', 'ultima_falla',
                       'contador_llamadas', 'status_indicator', 'deleted_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('nombre', 'tipo_servicio', 'proveedor', 'descripcion')
        }),
        ('Configuración Técnica', {
            'fields': ('endpoint_url', 'metodo_autenticacion', 'ambiente')
        }),
        ('Configuración Adicional', {
            'fields': ('configuracion_adicional',),
            'classes': ('collapse',)
        }),
        ('Límites y Alertas', {
            'fields': ('limite_llamadas_dia', 'alerta_porcentaje_limite')
        }),
        ('Monitoreo', {
            'fields': ('is_active', 'status_indicator', 'ultima_conexion_exitosa',
                      'ultima_falla', 'contador_llamadas'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )


# ==============================================================================
# ADMINS PARA MODELOS DINÁMICOS DE CONFIGURACIÓN
# ==============================================================================
# NOTA: UnidadMedidaAdmin fue movido a organizacion/admin.py

@admin.register(NormaISO)
class NormaISOAdmin(admin.ModelAdmin):
    """Admin para normas ISO y sistemas de gestión (100% dinámico)"""
    list_display = ['code', 'short_name', 'name', 'category', 'version', 'icon', 'color', 'es_sistema', 'is_active', 'orden']
    list_filter = ['category', 'es_sistema', 'is_active']
    search_fields = ['code', 'name', 'short_name', 'description']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_active', 'color']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('code', 'name', 'short_name', 'category', 'version', 'description')
        }),
        ('Apariencia', {
            'fields': ('icon', 'color', 'orden')
        }),
        ('Control', {
            'fields': ('es_sistema', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )

    def has_delete_permission(self, request, obj=None):
        # No permitir eliminar normas del sistema
        if obj and obj.es_sistema:
            return False
        return super().has_delete_permission(request, obj)


@admin.register(TipoCambio)
class TipoCambioAdmin(admin.ModelAdmin):
    """Admin para tipos de cambio organizacional (100% dinámico)"""
    list_display = ['code', 'name', 'icon', 'color', 'es_sistema', 'is_active', 'orden']
    list_filter = ['es_sistema', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_active', 'color']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('code', 'name', 'description')
        }),
        ('Apariencia', {
            'fields': ('icon', 'color', 'orden')
        }),
        ('Control', {
            'fields': ('es_sistema', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )

    def has_delete_permission(self, request, obj=None):
        if obj and obj.es_sistema:
            return False
        return super().has_delete_permission(request, obj)


@admin.register(TipoContrato)
class TipoContratoAdmin(admin.ModelAdmin):
    """Admin para tipos de contrato laboral"""
    list_display = ['nombre', 'tipo', 'duracion_default_dias', 'periodo_prueba_dias', 'requiere_poliza', 'is_active', 'orden']
    list_filter = ['tipo', 'requiere_poliza', 'is_active']
    search_fields = ['nombre', 'descripcion']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']
    raw_id_fields = ['empresa', 'created_by', 'updated_by']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('empresa', 'nombre', 'tipo', 'descripcion')
        }),
        ('Configuración', {
            'fields': ('duracion_default_dias', 'periodo_prueba_dias', 'requiere_poliza',
                      'clausulas_principales', 'notas_legales')
        }),
        ('Documento', {
            'fields': ('plantilla_documento',),
            'classes': ('collapse',)
        }),
        ('Control', {
            'fields': ('orden', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TipoSede)
class TipoSedeAdmin(admin.ModelAdmin):
    """Admin para tipos de sede (100% dinámico)"""
    list_display = ['code', 'name', 'icon', 'color', 'es_sistema', 'is_active', 'orden']
    list_filter = ['es_sistema', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_active', 'color']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('code', 'name', 'description')
        }),
        ('Apariencia', {
            'fields': ('icon', 'color', 'orden')
        }),
        ('Control', {
            'fields': ('es_sistema', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )

    def has_delete_permission(self, request, obj=None):
        # No permitir eliminar tipos del sistema
        if obj and obj.es_sistema:
            return False
        return super().has_delete_permission(request, obj)


@admin.register(TipoServicioIntegracion)
class TipoServicioIntegracionAdmin(admin.ModelAdmin):
    """Admin para tipos de servicio de integración (100% dinámico)"""
    list_display = ['code', 'name', 'category', 'icon', 'es_sistema', 'is_active', 'orden']
    list_filter = ['category', 'es_sistema', 'is_active']
    search_fields = ['code', 'name', 'description', 'category']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_active']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('code', 'name', 'category', 'description')
        }),
        ('Apariencia', {
            'fields': ('icon', 'orden')
        }),
        ('Control', {
            'fields': ('es_sistema', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )

    def has_delete_permission(self, request, obj=None):
        if obj and obj.es_sistema:
            return False
        return super().has_delete_permission(request, obj)


@admin.register(ProveedorIntegracion)
class ProveedorIntegracionAdmin(admin.ModelAdmin):
    """Admin para proveedores de integración (100% dinámico)"""
    list_display = ['code', 'name', 'tipo_servicio', 'pais_origen', 'es_sistema', 'is_active', 'orden']
    list_filter = ['tipo_servicio', 'pais_origen', 'es_sistema', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_active']
    raw_id_fields = ['tipo_servicio']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']

    fieldsets = (
        ('Identificación', {
            'fields': ('code', 'name', 'tipo_servicio', 'description')
        }),
        ('Información', {
            'fields': ('website', 'documentation_url', 'logo', 'pais_origen')
        }),
        ('Configuración', {
            'fields': ('orden', 'es_sistema', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )

    def has_delete_permission(self, request, obj=None):
        if obj and obj.es_sistema:
            return False
        return super().has_delete_permission(request, obj)


@admin.register(UnidadNegocio)
class UnidadNegocioAdmin(admin.ModelAdmin):
    """Admin para Unidades de Negocio — Fundación."""
    list_display = ['codigo', 'nombre', 'tipo_unidad', 'ciudad', 'is_active']
    list_filter = ['tipo_unidad', 'is_active', 'departamento']
    search_fields = ['codigo', 'nombre', 'ciudad']
    ordering = ['codigo']
    raw_id_fields = ['responsable']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']
    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'tipo_unidad', 'responsable')
        }),
        ('Ubicación', {
            'fields': ('direccion', 'ciudad', 'departamento')
        }),
        ('Estado', {
            'fields': ('is_active', 'deleted_at')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
