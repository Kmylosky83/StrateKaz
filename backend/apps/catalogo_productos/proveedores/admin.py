"""Admin de Proveedores (CT)."""
from django.contrib import admin

from .models import Proveedor, TipoProveedor


@admin.register(TipoProveedor)
class TipoProveedorAdmin(admin.ModelAdmin):
    list_display = [
        'codigo', 'nombre',
        'requiere_materia_prima', 'requiere_modalidad_logistica',
        'orden', 'is_active',
    ]
    list_filter = ['is_active', 'requiere_materia_prima', 'requiere_modalidad_logistica']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_interno', 'nombre_comercial', 'razon_social',
        'tipo_persona', 'tipo_proveedor',
        'numero_documento', 'nit',
        'is_active', 'is_deleted',
    ]
    list_filter = ['tipo_persona', 'tipo_proveedor', 'is_active', 'is_deleted']
    search_fields = [
        'codigo_interno', 'nombre_comercial', 'razon_social',
        'numero_documento', 'nit',
    ]
    ordering = ['nombre_comercial']
    raw_id_fields = ['tipo_proveedor', 'tipo_documento', 'departamento']
    filter_horizontal = ['productos_suministrados']
    readonly_fields = ['codigo_interno', 'created_at', 'updated_at']

    fieldsets = (
        ('Identificación', {
            'fields': (
                'codigo_interno',
                'tipo_persona', 'tipo_proveedor',
                'razon_social', 'nombre_comercial',
                'tipo_documento', 'numero_documento', 'nit',
            ),
        }),
        ('Contacto', {
            'fields': ('telefono', 'email', 'departamento', 'ciudad', 'direccion'),
        }),
        ('Productos', {
            'fields': ('productos_suministrados',),
        }),
        ('Parte Interesada', {
            'fields': ('parte_interesada_id', 'parte_interesada_nombre'),
            'classes': ('collapse',),
        }),
        ('Estado', {
            'fields': ('is_active', 'is_deleted'),
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
