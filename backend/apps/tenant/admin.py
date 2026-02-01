"""
Admin para Multi-Tenant System
"""
from django.contrib import admin
from django.utils.html import format_html
from apps.tenant.models import (
    Plan,
    Tenant,
    TenantUser,
    TenantUserAccess,
    TenantDomain,
)


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'code', 'price_monthly', 'max_users',
        'max_storage_gb', 'is_active', 'is_default', 'order'
    ]
    list_filter = ['is_active', 'is_default']
    search_fields = ['name', 'code']
    ordering = ['order', 'price_monthly']
    list_editable = ['order', 'is_active']

    fieldsets = (
        ('Identificación', {
            'fields': ('code', 'name', 'description')
        }),
        ('Límites', {
            'fields': ('max_users', 'max_storage_gb')
        }),
        ('Precios', {
            'fields': ('price_monthly', 'price_yearly')
        }),
        ('Módulos', {
            'fields': ('features',),
            'description': 'Lista de módulos habilitados en formato JSON'
        }),
        ('Estado', {
            'fields': ('is_active', 'is_default', 'order')
        }),
    )


class TenantUserAccessInline(admin.TabularInline):
    model = TenantUserAccess
    extra = 0
    fields = ['tenant_user', 'role', 'is_active', 'created_at']
    readonly_fields = ['created_at']
    autocomplete_fields = ['tenant_user']


class TenantDomainInline(admin.TabularInline):
    model = TenantDomain
    extra = 0
    fields = ['domain', 'is_primary', 'is_active', 'ssl_enabled']


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'code', 'subdomain_link', 'plan',
        'is_active', 'is_subscription_valid_display', 'created_at'
    ]
    list_filter = ['is_active', 'plan', 'is_trial', 'created_at']
    search_fields = ['name', 'code', 'subdomain', 'nit']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'full_domain']
    autocomplete_fields = ['plan']
    inlines = [TenantUserAccessInline, TenantDomainInline]

    fieldsets = (
        ('Identificación', {
            'fields': ('code', 'name', 'nit')
        }),
        ('Acceso', {
            'fields': ('subdomain', 'custom_domain', 'full_domain'),
            'description': 'Configuración de dominio de acceso'
        }),
        ('Base de Datos', {
            'fields': ('db_name', 'db_host', 'db_port'),
            'classes': ('collapse',),
            'description': 'Configuración de conexión a BD del tenant'
        }),
        ('Plan y Suscripción', {
            'fields': (
                'plan', 'max_users_override',
                'is_trial', 'trial_ends_at', 'subscription_ends_at'
            )
        }),
        ('Branding (Login)', {
            'fields': ('logo_url', 'primary_color'),
            'description': 'Branding mínimo para página de login'
        }),
        ('Backups', {
            'fields': ('backup_enabled', 'backup_retention_days'),
            'classes': ('collapse',)
        }),
        ('Estado', {
            'fields': ('is_active', 'notes')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    def subdomain_link(self, obj):
        url = f"https://{obj.full_domain}"
        return format_html(
            '<a href="{}" target="_blank">{}</a>',
            url, obj.subdomain
        )
    subdomain_link.short_description = 'Subdominio'

    def is_subscription_valid_display(self, obj):
        if obj.is_subscription_valid:
            return format_html('<span style="color: green;">✓ Válida</span>')
        return format_html('<span style="color: red;">✗ Vencida</span>')
    is_subscription_valid_display.short_description = 'Suscripción'


class TenantUserAccessUserInline(admin.TabularInline):
    model = TenantUserAccess
    extra = 0
    fields = ['tenant', 'role', 'is_active', 'created_at']
    readonly_fields = ['created_at']
    autocomplete_fields = ['tenant']


@admin.register(TenantUser)
class TenantUserAdmin(admin.ModelAdmin):
    list_display = [
        'email', 'full_name', 'is_active', 'is_superadmin',
        'tenant_count', 'last_login'
    ]
    list_filter = ['is_active', 'is_superadmin', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'last_login']
    inlines = [TenantUserAccessUserInline]

    fieldsets = (
        ('Credenciales', {
            'fields': ('email', 'password')
        }),
        ('Datos Personales', {
            'fields': ('first_name', 'last_name', 'phone')
        }),
        ('Permisos', {
            'fields': ('is_active', 'is_superadmin')
        }),
        ('Acceso', {
            'fields': ('last_login', 'last_tenant'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def tenant_count(self, obj):
        count = obj.tenants.count()
        if obj.is_superadmin:
            return format_html('<span title="Super Admin">∞</span>')
        return count
    tenant_count.short_description = 'Tenants'


@admin.register(TenantUserAccess)
class TenantUserAccessAdmin(admin.ModelAdmin):
    list_display = ['tenant_user', 'tenant', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'tenant']
    search_fields = ['tenant_user__email', 'tenant__name']
    autocomplete_fields = ['tenant_user', 'tenant']


@admin.register(TenantDomain)
class TenantDomainAdmin(admin.ModelAdmin):
    list_display = ['domain', 'tenant', 'is_primary', 'is_active', 'ssl_enabled']
    list_filter = ['is_primary', 'is_active', 'ssl_enabled']
    search_fields = ['domain', 'tenant__name']
    autocomplete_fields = ['tenant']
