"""
Django Admin Configuration - Módulo Core
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    User,
    Cargo,
    PermisoModulo,
    PermisoAccion,
    PermisoAlcance,
    Permiso,
    CargoPermiso,
    GrupoTipo,
    Group,
)


@admin.register(Cargo)
class CargoAdmin(admin.ModelAdmin):
    """Administración de Cargos en Django Admin"""
    
    list_display = [
        'code',
        'name',
        'level_display',
        'parent_cargo',
        'is_active_badge',
        'subordinados_count',
        'created_at',
    ]
    
    list_filter = [
        'level',
        'is_active',
        'created_at',
    ]
    
    search_fields = [
        'code',
        'name',
        'description',
    ]
    
    ordering = ['level', 'name']
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('code', 'name', 'description')
        }),
        ('Jerarquía', {
            'fields': ('level', 'parent_cargo')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def level_display(self, obj):
        """Mostrar nivel con etiqueta"""
        return obj.get_level_display()
    level_display.short_description = 'Nivel'
    
    def is_active_badge(self, obj):
        """Badge para estado activo"""
        if obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">&#10003; Activo</span>'
            )
        return format_html(
            '<span style="color: red; font-weight: bold;">&#10005; Inactivo</span>'
        )
    is_active_badge.short_description = 'Estado'
    
    def subordinados_count(self, obj):
        """Cantidad de subordinados"""
        return obj.subordinados.count()
    subordinados_count.short_description = 'Subordinados'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Administración de Usuarios en Django Admin"""
    
    list_display = [
        'username',
        'email',
        'full_name_display',
        'cargo_display',
        'document_number',
        'is_active_badge',
        'is_staff',
        'date_joined',
    ]
    
    list_filter = [
        'is_active',
        'is_staff',
        'is_superuser',
        'cargo',
        'document_type',
        'date_joined',
    ]
    
    search_fields = [
        'username',
        'email',
        'first_name',
        'last_name',
        'document_number',
    ]
    
    ordering = ['-date_joined']
    
    readonly_fields = [
        'date_joined',
        'last_login',
        'created_at',
        'updated_at',
        'deleted_at',
    ]
    
    fieldsets = (
        ('Credenciales', {
            'fields': ('username', 'password')
        }),
        ('Información Personal', {
            'fields': (
                'first_name',
                'last_name',
                'email',
                'phone',
            )
        }),
        ('Documento', {
            'fields': (
                'document_type',
                'document_number',
            )
        }),
        ('Cargo', {
            'fields': ('cargo',)
        }),
        ('Permisos', {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions',
            ),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'created_by',
                'created_at',
                'updated_at',
                'deleted_at',
                'date_joined',
                'last_login',
            ),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        ('Credenciales', {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2'),
        }),
        ('Información Personal', {
            'fields': (
                'first_name',
                'last_name',
                'email',
                'phone',
            )
        }),
        ('Documento', {
            'fields': (
                'document_type',
                'document_number',
            )
        }),
        ('Cargo', {
            'fields': ('cargo',)
        }),
        ('Permisos', {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
            )
        }),
    )
    
    def full_name_display(self, obj):
        """Mostrar nombre completo"""
        return obj.get_full_name() or '-'
    full_name_display.short_description = 'Nombre Completo'
    
    def cargo_display(self, obj):
        """Mostrar cargo con nivel"""
        if obj.cargo:
            return format_html(
                '{} <span style="color: gray;">(Nivel {})</span>',
                obj.cargo.name,
                obj.cargo.level
            )
        return '-'
    cargo_display.short_description = 'Cargo'
    
    def is_active_badge(self, obj):
        """Badge para estado activo"""
        if obj.is_deleted:
            return format_html(
                '<span style="color: red; font-weight: bold;">Eliminado</span>'
            )
        elif obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">Activo</span>'
            )
        return format_html(
            '<span style="color: orange; font-weight: bold;">Inactivo</span>'
        )
    is_active_badge.short_description = 'Estado'


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    """Administración de Permisos en Django Admin"""

    list_display = [
        'code',
        'name',
        'modulo',
        'accion',
        'alcance',
        'recurso',
        'is_active_badge',
        'created_at',
    ]

    list_filter = [
        'modulo',
        'accion',
        'alcance',
        'is_active',
        'created_at',
    ]

    search_fields = [
        'code',
        'name',
        'description',
        'recurso',
    ]

    ordering = ['modulo__orden', 'accion__orden', 'alcance__nivel']

    readonly_fields = ['created_at', 'updated_at']

    autocomplete_fields = ['modulo', 'accion', 'alcance']

    fieldsets = (
        ('Información Básica', {
            'fields': ('code', 'name', 'description')
        }),
        ('Clasificación Dinámica', {
            'fields': ('modulo', 'accion', 'alcance', 'recurso')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def is_active_badge(self, obj):
        """Badge para estado activo"""
        if obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">&#10003; Activo</span>'
            )
        return format_html(
            '<span style="color: red; font-weight: bold;">&#10005; Inactivo</span>'
        )
    is_active_badge.short_description = 'Estado'


@admin.register(CargoPermiso)
class CargoPermisoAdmin(admin.ModelAdmin):
    """Administración de relación Cargo-Permiso en Django Admin"""
    
    list_display = [
        'cargo',
        'permiso',
        'granted_by_display',
        'granted_at',
    ]
    
    list_filter = [
        'cargo',
        'granted_at',
    ]
    
    search_fields = [
        'cargo__name',
        'cargo__code',
        'permiso__name',
        'permiso__code',
    ]
    
    ordering = ['cargo', 'permiso']
    
    readonly_fields = ['granted_at']
    
    def granted_by_display(self, obj):
        """Mostrar quién otorgó el permiso"""
        if obj.granted_by:
            return obj.granted_by.get_full_name() or obj.granted_by.username
        return '-'
    granted_by_display.short_description = 'Otorgado por'


# ==========================================================================
# ADMINS PARA SISTEMA RBAC DINÁMICO
# ==========================================================================


@admin.register(PermisoModulo)
class PermisoModuloAdmin(admin.ModelAdmin):
    """Admin para Módulos de Permisos - 100% dinámico"""
    list_display = ['code', 'name', 'icon', 'orden', 'is_active']
    list_filter = ['is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_active']


@admin.register(PermisoAccion)
class PermisoAccionAdmin(admin.ModelAdmin):
    """Admin para Acciones de Permisos - 100% dinámico"""
    list_display = ['code', 'name', 'icon', 'orden', 'is_active']
    list_filter = ['is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_active']


@admin.register(PermisoAlcance)
class PermisoAlcanceAdmin(admin.ModelAdmin):
    """Admin para Alcances de Permisos - 100% dinámico"""
    list_display = ['code', 'name', 'nivel', 'is_active']
    list_filter = ['is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['nivel', 'name']
    list_editable = ['nivel', 'is_active']


@admin.register(GrupoTipo)
class GrupoTipoAdmin(admin.ModelAdmin):
    """Admin para Tipos de Grupo - 100% dinámico"""
    list_display = ['code', 'name', 'icon', 'color', 'orden', 'is_active']
    list_filter = ['is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_active']


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    """Admin para Grupos - 100% dinámico"""
    list_display = ['code', 'name', 'tipo', 'is_active', 'created_at']
    list_filter = ['tipo', 'is_active', 'created_at']
    search_fields = ['code', 'name', 'description']
    ordering = ['name']
    autocomplete_fields = ['tipo']
    # Note: roles usa through model, se gestiona via GroupRole admin


# Personalizar el sitio admin
admin.site.site_header = 'StrateKaz - Administración'
admin.site.site_title = 'Admin StrateKaz'
admin.site.index_title = 'Panel de Administración'
