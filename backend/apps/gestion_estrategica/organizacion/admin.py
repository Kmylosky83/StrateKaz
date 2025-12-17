"""
Admin para el módulo de Organización
"""
from django.contrib import admin
from .models import Area


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'parent', 'cost_center', 'manager', 'is_active', 'order']
    list_filter = ['is_active', 'parent']
    search_fields = ['code', 'name', 'description', 'cost_center']
    ordering = ['order', 'name']
    list_editable = ['order', 'is_active']
    raw_id_fields = ['parent', 'manager', 'created_by']

    fieldsets = (
        ('Información Básica', {
            'fields': ('code', 'name', 'description')
        }),
        ('Jerarquía', {
            'fields': ('parent', 'order')
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
