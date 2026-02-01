"""
Django Admin Configuration - Módulo Core
Sistema de Gestión StrateKaz

Actualizado: 2025-01-12 - Sincronizado con modelos actuales
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
    RiesgoOcupacional,
    Role,
    RolePermiso,
    GroupRole,
    UserRole,
    UserGroup,
    MenuItem,
    CargoRole,
    SystemModule,
    ModuleTab,
    TabSection,
    BrandingConfig,
    RolAdicional,
    RolAdicionalPermiso,
    UserRolAdicional,
    CargoSectionAccess,
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


# ==========================================================================
# ADMINS ADICIONALES - MODELOS CORE
# ==========================================================================


@admin.register(RiesgoOcupacional)
class RiesgoOcupacionalAdmin(admin.ModelAdmin):
    """Admin para Riesgos Ocupacionales"""
    # Campos correctos del modelo: code, name, clasificacion
    list_display = ['code', 'name', 'clasificacion', 'is_active']
    list_filter = ['clasificacion', 'is_active']
    search_fields = ['code', 'name', 'descripcion']
    ordering = ['clasificacion', 'name']


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """Admin para Roles"""
    # El modelo Role NO tiene campo 'level'
    list_display = ['code', 'name', 'is_system', 'is_active', 'created_at']
    list_filter = ['is_system', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['name']


@admin.register(RolePermiso)
class RolePermisoAdmin(admin.ModelAdmin):
    """Admin para Role-Permiso"""
    list_display = ['role', 'permiso', 'granted_at']
    list_filter = ['role', 'granted_at']
    search_fields = ['role__name', 'permiso__name']
    ordering = ['role', 'permiso']


@admin.register(GroupRole)
class GroupRoleAdmin(admin.ModelAdmin):
    """Admin para Group-Role"""
    list_display = ['group', 'role', 'assigned_at']
    list_filter = ['group', 'role']
    search_fields = ['group__name', 'role__name']
    ordering = ['group', 'role']


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    """Admin para User-Role"""
    # UserRole NO tiene campo 'is_active'
    list_display = ['user', 'role', 'assigned_at', 'expires_at']
    list_filter = ['role', 'assigned_at']
    search_fields = ['user__username', 'user__email', 'role__name']
    ordering = ['-assigned_at']


@admin.register(UserGroup)
class UserGroupAdmin(admin.ModelAdmin):
    """Admin para User-Group"""
    # UserGroup tiene 'assigned_at' no 'joined_at'
    list_display = ['user', 'group', 'assigned_at', 'is_leader']
    list_filter = ['group', 'is_leader', 'assigned_at']
    search_fields = ['user__username', 'group__name']
    ordering = ['group', 'user']


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    """Admin para Items de Menú"""
    list_display = ['name', 'code', 'parent', 'orden', 'is_active']
    list_filter = ['is_active', 'parent']
    search_fields = ['name', 'code', 'path']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_active']


@admin.register(CargoRole)
class CargoRoleAdmin(admin.ModelAdmin):
    """Admin para Cargo-Role"""
    list_display = ['cargo', 'role', 'assigned_at']
    list_filter = ['cargo', 'role']
    search_fields = ['cargo__name', 'role__name']
    ordering = ['cargo', 'role']


@admin.register(SystemModule)
class SystemModuleAdmin(admin.ModelAdmin):
    """Admin para Módulos del Sistema"""
    # SystemModule tiene 'is_enabled' no 'is_active'
    list_display = ['code', 'name', 'icon', 'orden', 'is_enabled']
    list_filter = ['is_enabled', 'category']
    search_fields = ['code', 'name', 'description']
    ordering = ['orden', 'name']
    list_editable = ['orden', 'is_enabled']


@admin.register(ModuleTab)
class ModuleTabAdmin(admin.ModelAdmin):
    """Admin para Tabs de Módulo"""
    # ModuleTab tiene 'is_enabled' no 'is_active'
    list_display = ['code', 'name', 'module', 'orden', 'is_enabled']
    list_filter = ['module', 'is_enabled']
    search_fields = ['code', 'name']
    ordering = ['module', 'orden']
    list_editable = ['orden', 'is_enabled']


@admin.register(TabSection)
class TabSectionAdmin(admin.ModelAdmin):
    """Admin para Secciones de Tab"""
    # TabSection tiene 'is_enabled' no 'is_active'
    list_display = ['code', 'name', 'tab', 'orden', 'is_enabled']
    list_filter = ['tab__module', 'tab', 'is_enabled']
    search_fields = ['code', 'name']
    ordering = ['tab', 'orden']
    list_editable = ['orden', 'is_enabled']


@admin.register(BrandingConfig)
class BrandingConfigAdmin(admin.ModelAdmin):
    """Admin para Configuración de Marca"""
    # BrandingConfig tiene 'company_name' no 'empresa_nombre'
    list_display = ['company_name', 'primary_color', 'is_active']
    list_filter = ['is_active']
    search_fields = ['company_name']


@admin.register(RolAdicional)
class RolAdicionalAdmin(admin.ModelAdmin):
    """Admin para Roles Adicionales"""
    # RolAdicional tiene 'nombre' no 'name'
    list_display = ['code', 'nombre', 'tipo', 'is_active', 'created_at']
    list_filter = ['tipo', 'is_active', 'created_at']
    search_fields = ['code', 'nombre', 'descripcion']
    ordering = ['nombre']


@admin.register(RolAdicionalPermiso)
class RolAdicionalPermisoAdmin(admin.ModelAdmin):
    """Admin para RolAdicional-Permiso"""
    list_display = ['rol_adicional', 'permiso', 'granted_at']
    list_filter = ['rol_adicional']
    search_fields = ['rol_adicional__nombre', 'permiso__name']


@admin.register(UserRolAdicional)
class UserRolAdicionalAdmin(admin.ModelAdmin):
    """Admin para User-RolAdicional"""
    list_display = ['user', 'rol_adicional', 'assigned_at', 'expires_at', 'is_active']
    list_filter = ['rol_adicional', 'is_active']
    search_fields = ['user__username', 'rol_adicional__nombre']
    ordering = ['-assigned_at']


@admin.register(CargoSectionAccess)
class CargoSectionAccessAdmin(admin.ModelAdmin):
    """Admin para acceso de Cargo a Secciones"""
    # CargoSectionAccess solo tiene cargo, section, granted_at, granted_by
    list_display = ['cargo', 'section', 'granted_at', 'granted_by']
    list_filter = ['cargo', 'section__tab__module']
    search_fields = ['cargo__name', 'section__name']
    ordering = ['cargo', 'section']


# Personalizar el sitio admin
admin.site.site_header = 'StrateKaz - Administración'
admin.site.site_title = 'Admin StrateKaz'
admin.site.index_title = 'Panel de Administración'
