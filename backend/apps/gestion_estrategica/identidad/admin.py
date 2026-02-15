"""
Admin del módulo Identidad Corporativa - Dirección Estratégica
"""
from django.contrib import admin
from .models import CorporateIdentity, CorporateValue, AlcanceSistema


class CorporateValueInline(admin.TabularInline):
    """Inline para valores corporativos"""
    model = CorporateValue
    extra = 1
    fields = ['name', 'description', 'icon', 'orden', 'is_active']


@admin.register(CorporateIdentity)
class CorporateIdentityAdmin(admin.ModelAdmin):
    """Admin para Identidad Corporativa"""

    list_display = [
        'empresa', 'version', 'effective_date', 'is_active',
        'declara_alcance', 'values_count', 'created_at'
    ]
    list_filter = ['is_active', 'declara_alcance', 'effective_date']
    search_fields = ['mission', 'vision', 'alcance_general']
    readonly_fields = ['created_by', 'created_at', 'updated_at']
    inlines = [CorporateValueInline]
    filter_horizontal = ['procesos_cubiertos']

    fieldsets = (
        ('Empresa', {
            'fields': ('empresa',)
        }),
        ('Identidad', {
            'fields': ('mission', 'vision', 'version', 'effective_date', 'is_active')
        }),
        ('Alcance del Sistema Integrado de Gestión', {
            'fields': (
                'declara_alcance', 'alcance_general', 'alcance_geografico',
                'procesos_cubiertos', 'alcance_exclusiones'
            ),
            'classes': ('collapse',),
            'description': 'Configuración del alcance del SIG (solo si declara_alcance=True)'
        }),
        ('Auditoría', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def values_count(self, obj):
        return obj.values.filter(is_active=True).count()
    values_count.short_description = 'Valores'


@admin.register(CorporateValue)
class CorporateValueAdmin(admin.ModelAdmin):
    """Admin para Valores Corporativos"""

    list_display = ['name', 'identity', 'icon', 'orden', 'is_active']
    list_filter = ['identity', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['identity', 'orden', 'name']


@admin.register(AlcanceSistema)
class AlcanceSistemaAdmin(admin.ModelAdmin):
    """Admin para Alcance del Sistema por Norma ISO"""

    list_display = [
        'identity', 'norma_iso', 'is_certified',
        'certification_body', 'expiry_date', 'is_active'
    ]
    list_filter = ['is_certified', 'is_active', 'norma_iso']
    search_fields = ['scope', 'certification_body', 'certificate_number']
    readonly_fields = ['created_by', 'created_at', 'updated_at']

    fieldsets = (
        ('Alcance', {
            'fields': ('identity', 'norma_iso', 'scope', 'is_active')
        }),
        ('Exclusiones', {
            'fields': ('exclusions', 'exclusion_justification'),
            'classes': ('collapse',)
        }),
        ('Certificación', {
            'fields': (
                'is_certified', 'certification_date', 'certification_body',
                'certificate_number', 'expiry_date', 'certificate_file'
            )
        }),
        ('Auditorías', {
            'fields': ('last_audit_date', 'next_audit_date'),
            'classes': ('collapse',)
        }),
        ('Auditoría de Sistema', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
