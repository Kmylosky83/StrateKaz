"""
Admin del módulo Identidad Corporativa - Dirección Estratégica
"""
from django.contrib import admin
from .models import CorporateIdentity, CorporateValue


class CorporateValueInline(admin.TabularInline):
    """Inline para valores corporativos"""
    model = CorporateValue
    extra = 1
    fields = ['name', 'description', 'icon', 'orden', 'is_active']


@admin.register(CorporateIdentity)
class CorporateIdentityAdmin(admin.ModelAdmin):
    """Admin para Identidad Corporativa"""

    list_display = [
        'version', 'effective_date', 'is_active',
        'is_signed', 'created_by', 'created_at'
    ]
    list_filter = ['is_active', 'effective_date']
    search_fields = ['mission', 'vision', 'integral_policy']
    readonly_fields = [
        'policy_signed_by', 'policy_signed_at',
        'policy_signature_hash', 'created_by',
        'created_at', 'updated_at'
    ]
    inlines = [CorporateValueInline]

    fieldsets = (
        ('Identidad', {
            'fields': ('mission', 'vision', 'version', 'effective_date', 'is_active')
        }),
        ('Política Integral', {
            'fields': ('integral_policy',)
        }),
        ('Firma Digital', {
            'fields': (
                'policy_signed_by', 'policy_signed_at',
                'policy_signature_hash'
            ),
            'classes': ('collapse',)
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

    def is_signed(self, obj):
        return obj.is_signed
    is_signed.boolean = True
    is_signed.short_description = 'Firmada'


@admin.register(CorporateValue)
class CorporateValueAdmin(admin.ModelAdmin):
    """Admin para Valores Corporativos"""

    list_display = ['name', 'identity', 'icon', 'orden', 'is_active']
    list_filter = ['identity', 'is_active']
    search_fields = ['name', 'description']
    ordening = ['identity', 'orden', 'name']
