"""
Core Models - StrateKaz

Este paquete contiene los modelos del módulo Core organizados por dominio:
- models_user: User, Cargo, RiesgoOcupacional
- models_rbac_permisos: Permiso, PermisoModulo, PermisoAccion, PermisoAlcance
- models_rbac_roles: Role, Group, UserRole, UserGroup
- models_rbac_adicionales: RolAdicional, UserRolAdicional, CargoSectionAccess
- models_system_modules: SystemModule, ModuleTab, TabSection, BrandingConfig
- models_menu: MenuItem
"""

# =============================================================================
# USER & CARGO
# =============================================================================
from apps.core.models.models_user import (
    Cargo,
    RiesgoOcupacional,
    User,
)

# =============================================================================
# RBAC - PERMISOS
# =============================================================================
from apps.core.models.models_rbac_permisos import (
    PermisoModulo,
    PermisoAccion,
    PermisoAlcance,
    Permiso,
    CargoPermiso,
)

# =============================================================================
# RBAC - ROLES & GROUPS
# =============================================================================
from apps.core.models.models_rbac_roles import (
    Role,
    RolePermiso,
    GrupoTipo,
    Group,
    GroupRole,
    UserRole,
    UserGroup,
    CargoRole,
)

# =============================================================================
# RBAC - ROLES ADICIONALES & SECTION ACCESS
# =============================================================================
from apps.core.models.models_rbac_adicionales import (
    RolAdicional,
    RolAdicionalPermiso,
    UserRolAdicional,
    CargoSectionAccess,
)

# =============================================================================
# SYSTEM MODULES & CONFIG
# =============================================================================
from apps.core.models.models_system_modules import (
    SystemModule,
    ModuleTab,
    TabSection,
    BrandingConfig,
)

# =============================================================================
# MENU
# =============================================================================
from apps.core.models.models_menu import (
    MenuItem,
)

# =============================================================================
# USER SESSIONS (MS-002-A)
# =============================================================================
from apps.core.models.models_session import (
    UserSession,
)

# =============================================================================
# TWO FACTOR AUTHENTICATION (2FA)
# =============================================================================
from apps.core.models.models_two_factor import (
    TwoFactorAuth,
)

# =============================================================================
# USER PREFERENCES (MS-003)
# =============================================================================
from apps.core.models.models_user_preferences import (
    UserPreferences,
)

# =============================================================================
# ADD DYNAMIC RELATIONS (after all models are loaded)
# =============================================================================

# Cargo.permisos M2M
Cargo.add_to_class(
    'permisos',
    __import__('django.db.models', fromlist=['ManyToManyField']).ManyToManyField(
        Permiso,
        through=CargoPermiso,
        related_name='cargos',
        verbose_name='Permisos'
    )
)

# Cargo.default_roles M2M
Cargo.add_to_class(
    'default_roles',
    __import__('django.db.models', fromlist=['ManyToManyField']).ManyToManyField(
        Role,
        through=CargoRole,
        related_name='default_for_cargos',
        verbose_name='Roles por defecto',
        blank=True
    )
)

# =============================================================================
# EXPORTS
# =============================================================================
__all__ = [
    # User & Cargo
    'Cargo',
    'RiesgoOcupacional',
    'User',
    # Permisos
    'PermisoModulo',
    'PermisoAccion',
    'PermisoAlcance',
    'Permiso',
    'CargoPermiso',
    # Roles & Groups
    'Role',
    'RolePermiso',
    'GrupoTipo',
    'Group',
    'GroupRole',
    'UserRole',
    'UserGroup',
    'CargoRole',
    # Roles Adicionales
    'RolAdicional',
    'RolAdicionalPermiso',
    'UserRolAdicional',
    'CargoSectionAccess',
    # System Modules
    'SystemModule',
    'ModuleTab',
    'TabSection',
    'BrandingConfig',
    # Menu
    'MenuItem',
    # User Sessions (MS-002-A)
    'UserSession',
    # Two Factor Authentication (2FA)
    'TwoFactorAuth',
    # User Preferences (MS-003)
    'UserPreferences',
]
