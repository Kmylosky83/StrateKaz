"""
Admin para Multi-Tenant System (django-tenants)
"""
from django.contrib import admin
from django.utils.html import format_html
from django_tenants.admin import TenantAdminMixin
from .models import Plan, Tenant, Domain, TenantUser, TenantUserAccess


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


class DomainInline(admin.TabularInline):
    """Inline para dominios de un tenant"""
    model = Domain
    extra = 1
    fields = ['domain', 'is_primary', 'is_active', 'ssl_enabled']


class TenantUserAccessInline(admin.TabularInline):
    model = TenantUserAccess
    extra = 0
    fields = ['tenant_user', 'role', 'is_active', 'granted_at']
    readonly_fields = ['granted_at']
    autocomplete_fields = ['tenant_user']


@admin.register(Tenant)
class TenantAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = [
        'name', 'code', 'schema_name', 'plan',
        'is_active', 'is_subscription_valid_display', 'tier', 'created_at'
    ]
    list_filter = ['is_active', 'plan', 'is_trial', 'tier', 'created_at']
    search_fields = ['name', 'code', 'nit', 'schema_name']
    ordering = ['-created_at']
    readonly_fields = ['schema_name', 'created_at', 'updated_at']
    autocomplete_fields = ['plan']
    inlines = [DomainInline, TenantUserAccessInline]

    fieldsets = (
        ('Identificación', {
            'fields': ('code', 'name', 'nit', 'schema_name')
        }),
        ('Plan y Límites', {
            'fields': ('plan', 'max_users', 'max_storage_gb', 'tier', 'enabled_modules')
        }),
        ('Estado y Suscripción', {
            'fields': ('is_active', 'is_trial', 'trial_ends_at', 'subscription_ends_at')
        }),
        ('Branding', {
            'fields': ('logo_url', 'primary_color'),
            'classes': ('collapse',)
        }),
        ('Backups', {
            'fields': ('backup_enabled', 'backup_retention_days'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    def is_subscription_valid_display(self, obj):
        if obj.is_subscription_valid:
            return format_html('<span style="color: green;">✓ Válida</span>')
        return format_html('<span style="color: red;">✗ Vencida</span>')
    is_subscription_valid_display.short_description = 'Suscripción'


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ['domain', 'tenant', 'is_primary', 'is_active', 'ssl_enabled']
    list_filter = ['is_primary', 'is_active', 'ssl_enabled']
    search_fields = ['domain', 'tenant__name']
    autocomplete_fields = ['tenant']


class TenantUserAccessUserInline(admin.TabularInline):
    """Inline para accesos de un usuario a tenants"""
    model = TenantUserAccess
    fk_name = 'tenant_user'  # Especificar FK porque hay dos FKs a TenantUser
    extra = 0
    fields = ['tenant', 'role', 'is_active', 'granted_at']
    readonly_fields = ['granted_at']
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
            'fields': ('email',)
        }),
        ('Datos Personales', {
            'fields': ('first_name', 'last_name')
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
    list_display = ['tenant_user', 'tenant', 'role', 'is_active', 'granted_at']
    list_filter = ['role', 'is_active', 'tenant']
    search_fields = ['tenant_user__email', 'tenant__name']
    autocomplete_fields = ['tenant_user', 'tenant', 'granted_by']
