"""
Admin para el módulo de Organización
"""
from django.contrib import admin
from .models import Area


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'parent', 'cost_center', 'manager', 'is_active', 'orden']
    list_filter = ['is_active', 'parent']
    search_fields = ['code', 'name', 'description', 'cost_center']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_active']
    raw_id_fields = ['parent', 'manager', 'created_by']

    fieldsets = (
        ('Información Básica', {
            'fields': ('code', 'name', 'description')
        }),
        ('Jerarquía', {
            'fields': ('parent', 'orden')
        }),
        ('Apariencia', {
            'fields': ('icon', 'color')
        }),
        ('Gestión', {
            'fields': ('cost_center', 'manager', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
