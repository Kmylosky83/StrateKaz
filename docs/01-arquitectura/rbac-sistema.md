# Sistema RBAC - Control de Acceso de 4 Capas

> **Version:** 2.0.0 | **Fecha:** 2026-02-06 | **Estado:** Actualizado post-intervencion

## 1. Overview

StrateKaz implementa un sistema RBAC de **4 capas** que combina permisos con logica **OR**. Si un usuario tiene acceso por **cualquiera** de las 4 capas, el acceso se concede.

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIO                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Capa 1: CARGO (principal)                                   │
│  └─ CargoSectionAccess: can_view, can_create, can_edit,     │
│     can_delete por cada TabSection                           │
│                                                               │
│  Capa 2: ROL ADICIONAL                                       │
│  └─ RolAdicionalPermiso: permisos extras sobre el cargo      │
│                                                               │
│  Capa 3: GROUP (Django groups)                               │
│  └─ GroupRole → RolePermiso                                  │
│                                                               │
│  Capa 4: USER ROLE (directo)                                 │
│  └─ UserRole → RolePermiso                                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │        CombinedPermissionService (OR Logic)          │     │
│  │  Si CUALQUIER capa concede acceso → PERMITIDO       │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Jerarquia de Modulos

Los permisos se organizan en una jerarquia de 3 niveles:

```
SystemModule (15 modulos)
└── ModuleTab (~80 tabs)
    └── TabSection (~52 secciones)
        └── Permisos: can_view, can_create, can_edit, can_delete
```

### 2.1 SystemModule

Modulo del sistema (nivel superior). Corresponde a los 15 modulos de StrateKaz.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `code` | CharField unique | Codigo del modulo (ej: `gestion_estrategica`) |
| `name` | CharField | Nombre visible |
| `description` | TextField | Descripcion |
| `icon` | CharField | Icono Lucide |
| `category` | CharField | ESTRATEGICO, MOTOR, INTEGRAL, MISIONAL, APOYO, INTELIGENCIA |
| `color` | CharField | Color del modulo para UI |
| `route` | CharField | Ruta del frontend |
| `is_core` | BooleanField | Modulos core no pueden desactivarse |
| `is_enabled` | BooleanField | Si esta habilitado |
| `orden` | IntegerField | Orden de visualizacion |

### 2.2 ModuleTab

Pestaña dentro de un modulo. Agrupa secciones relacionadas.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `module` | FK(SystemModule) | Modulo padre |
| `code` | CharField | Codigo de la tab |
| `name` | CharField | Nombre visible |
| `icon` | CharField | Icono |
| `route` | CharField | Ruta frontend relativa |
| `orden` | PositiveIntegerField | Orden |
| `is_enabled` | BooleanField | Si esta habilitado |

### 2.3 TabSection

Seccion dentro de una tab. Es la unidad minima de permisos.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `tab` | FK(ModuleTab) | Tab padre |
| `code` | CharField | Codigo de la seccion |
| `name` | CharField | Nombre visible |
| `description` | TextField | Descripcion |
| `icon` | CharField | Icono Lucide |
| `orden` | PositiveIntegerField | Orden |
| `is_enabled` | BooleanField | Si esta habilitada |
| `supported_actions` | JSONField | Acciones extra soportadas (ej: `["enviar", "aprobar"]`) |

---

## 3. Capa 1: Cargo (Principal)

El **Cargo** es la capa principal de permisos. Cada usuario tiene un cargo asignado (`User.cargo`).

### 3.1 Modelo Cargo

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `code` | CharField unique | Codigo (ej: `gerente_general`) |
| `name` | CharField | Nombre del cargo |
| `nivel_jerarquico` | CharField | ESTRATEGICO, TACTICO, OPERATIVO, APOYO, EXTERNO |
| `area` | FK(Area) nullable | Area organizacional |
| `reporta_a` | FK(self) nullable | Cargo superior |

### 3.2 CargoSectionAccess

Tabla pivote que define los permisos del cargo por seccion:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `cargo` | FK(Cargo) | Cargo |
| `section` | FK(TabSection) | Seccion |
| `can_view` | BooleanField | Puede ver |
| `can_create` | BooleanField | Puede crear |
| `can_edit` | BooleanField | Puede editar |
| `can_delete` | BooleanField | Puede eliminar |
| `custom_actions` | JSONField | Acciones personalizadas (ej: `{"enviar": true}`) |

### 3.3 Defaults por Nivel

Cuando se crea una nueva `TabSection`, los signals automaticamente crean `CargoSectionAccess` para todos los cargos existentes con defaults basados en el nivel:

| Nivel | can_view | can_create | can_edit | can_delete |
|-------|----------|------------|----------|------------|
| **ESTRATEGICO** | true | true | true | true |
| **TACTICO** | true | true | true | false |
| **OPERATIVO** | true | false | false | false |

---

## 4. Capa 2: Rol Adicional

Permisos adicionales que se apilan sobre el cargo base.

### 4.1 Modelo RolAdicional

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `code` | CharField unique | Codigo del rol |
| `nombre` | CharField | Nombre |
| `descripcion` | TextField | Descripcion |

### 4.2 RolAdicionalPermiso (Legacy)

Conecta roles adicionales con permisos del sistema legacy (`Permiso`):

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `rol_adicional` | FK(RolAdicional) | Rol adicional |
| `permiso` | FK(Permiso) | Permiso legacy del sistema |

> **NOTA:** Los roles adicionales actualmente usan permisos legacy (`Permiso`), NO `CargoSectionAccess`. La integracion con secciones via `RolAdicionalSectionAccess` esta planeada como mejora futura en `CombinedPermissionService`.

Un usuario puede tener multiples roles adicionales. Los permisos se combinan con OR.

---

## 5. Capa 3: Group (Django Groups)

Grupos de Django con roles asignados.

### 5.1 GroupRole

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `group` | FK(Group) | Grupo Django |
| `role` | FK(Role) | Rol del sistema |

### 5.2 RolePermiso (Legacy)

Conecta roles con permisos del sistema legacy (`Permiso`):

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `role` | FK(Role) | Rol |
| `permiso` | FK(Permiso) | Permiso legacy del sistema |

> **NOTA:** Similar a `RolAdicionalPermiso`, los grupos usan permisos legacy. La integracion con `CargoSectionAccess` via `GroupSectionAccess` esta planeada como mejora futura.

---

## 6. Capa 4: UserRole (Directo)

Roles asignados directamente al usuario.

### 6.1 UserRole

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `user` | FK(User) | Usuario |
| `role` | FK(Role) | Rol |

Comparte el mismo `RolePermiso` que la Capa 3 (Groups).

---

## 7. CombinedPermissionService

Servicio central que evalua las 4 capas con logica OR.

```python
class CombinedPermissionService:
    """
    Verifica permisos combinando las 4 capas con OR.
    Si CUALQUIER capa concede el permiso, se permite.
    """

    @classmethod
    def check_section_permission(cls, user, section_code=None, section_id=None, required_permission='can_view'):
        """
        Verifica si el usuario tiene permiso sobre una seccion.

        Args:
            user: User del tenant
            section_code: Codigo de la TabSection (ej: 'empresa')
            section_id: ID de la seccion (alternativa a section_code)
            required_permission: 'can_view', 'can_create', 'can_edit', 'can_delete'
                                 o codigo de accion personalizada

        Returns:
            bool
        """
        # 1. Superusuario → acceso total
        # 2. Cargo → CargoSectionAccess
        # 3. Roles Adicionales → (permisos legacy, integracion futura)
        # 4. Groups → (permisos legacy, integracion futura)
        # Resultado: OR de todas las capas
```

### 7.1 Cache de Permisos

Los permisos se cachean para evitar queries repetitivas:
- Cache por usuario + seccion
- Invalidacion al cambiar cargo, roles o grupos
- TTL configurable

---

## 8. Signals Automaticos (`rbac_signals.py`)

### 8.1 post_save TabSection

Cuando se crea una nueva seccion (`TabSection`), automaticamente:
1. Recorre todos los `Cargo` existentes
2. Crea `CargoSectionAccess` con defaults basados en el nivel del cargo
3. ESTRATEGICO → full access, TACTICO → no delete, OPERATIVO → view-only

### 8.2 post_save Cargo

Cuando se crea un nuevo cargo:
1. Recorre todas las `TabSection` existentes
2. Crea `CargoSectionAccess` con defaults basados en el nivel

### 8.3 Otros Signals

- Al eliminar un cargo, se eliminan sus `CargoSectionAccess` en cascade
- Al cambiar el nivel de un cargo, se pueden regenerar los defaults

---

## 9. Seeds del Sistema RBAC

Al crear un nuevo tenant, se ejecutan 3 seeds que inicializan el sistema completo:

### 9.1 seed_estructura_final

Crea la jerarquia completa de modulos:

| Entidad | Cantidad | Ejemplo |
|---------|----------|---------|
| SystemModule | 15 | gestion_estrategica, motor_riesgos, hseq_management, ... |
| ModuleTab | ~80 | Configuracion, Organizacion, Identidad, Planeacion, ... |
| TabSection | 52 | configuracion_empresa, areas, cargos, proyectos, ... |

### 9.2 seed_permisos_rbac

Crea los permisos base del sistema:

| Dato | Valor |
|------|-------|
| Total permisos | 335 |
| Tipo | can_view, can_create, can_edit, can_delete por seccion |
| Cobertura | Todas las 52 secciones |

### 9.3 seed_admin_cargo

Crea el cargo de administrador:

| Dato | Valor |
|------|-------|
| Codigo | ADMIN |
| Nombre | Administrador |
| Nivel | ESTRATEGICO |
| Acceso | Full (can_view, can_create, can_edit, can_delete) en TODAS las secciones |

---

## 10. 15 Modulos del Sistema

| # | Codigo | Nombre | Categoria (BD) |
|---|--------|--------|----------------|
| 1 | `gestion_estrategica` | Direccion Estrategica | ESTRATEGICO |
| 2 | `sistema_gestion` | Sistema de Gestion | ESTRATEGICO |
| 3 | `motor_cumplimiento` | Cumplimiento Normativo | MOTOR |
| 4 | `motor_riesgos` | Motor de Riesgos | MOTOR |
| 5 | `workflow_engine` | Flujos de Trabajo | MOTOR |
| 6 | `hseq_management` | Gestion Integral HSEQ | INTEGRAL |
| 7 | `supply_chain` | Cadena de Suministro | MISIONAL |
| 8 | `production_ops` | Base de Operaciones | MISIONAL |
| 9 | `logistics_fleet` | Logistica y Flota | MISIONAL |
| 10 | `sales_crm` | Ventas y CRM | MISIONAL |
| 11 | `talent_hub` | Centro de Talento | APOYO |
| 12 | `admin_finance` | Administracion | APOYO |
| 13 | `accounting` | Contabilidad | APOYO |
| 14 | `analytics` | Inteligencia de Negocios | INTELIGENCIA |
| 15 | `audit_system` | Sistema de Auditorias | INTELIGENCIA |

> **Categorias en BD:** ESTRATEGICO, MOTOR, INTEGRAL, MISIONAL, APOYO, INTELIGENCIA (definidas en `SystemModule.CATEGORY_CHOICES`)

---

## 11. Uso en Codigo

### 11.1 Backend - Verificar Permiso

```python
from apps.core.services.permission_service import CombinedPermissionService

# En un ViewSet
def has_permission(self, request, view):
    return CombinedPermissionService.check_section_permission(
        user=request.user,
        section_code='proyectos',
        required_permission='can_create'
    )
```

### 11.2 Frontend - Hook usePermissions

```typescript
const { hasPermission } = usePermissions();

// Verificar acceso a una seccion
if (hasPermission('proyectos', 'create')) {
  // Mostrar boton crear
}
```

### 11.3 Buenas Practicas

| Hacer | Evitar |
|-------|--------|
| Verificar permisos por seccion/accion | Hardcodear nombres de cargos |
| Usar CombinedPermissionService | Consultar CargoSectionAccess directamente |
| Cachear permisos del usuario | Consultar permisos en cada request |
| Verificar en backend siempre | Confiar solo en verificacion frontend |
| Usar signals para propagacion | Crear CargoSectionAccess manualmente |

---

## 12. Relacion con Multi-Tenant

- Los modelos RBAC viven en el **schema del tenant** (no en public)
- Cada tenant tiene su propia estructura de cargos, roles y permisos
- Los seeds crean la estructura base al crear el tenant
- El cargo ADMIN se crea automaticamente en cada tenant nuevo
- El `TenantUserAccess.role` esta **DEPRECATED** - los permisos se manejan via `User.cargo`

Para mas detalles del sistema multi-tenant, ver [MULTI-TENANT.md](./MULTI-TENANT.md).

---

## 13. Archivos del Sistema

### Backend

| Archivo | Descripcion |
|---------|-------------|
| `apps/core/models/models_user.py` | Cargo, User |
| `apps/core/models/models_system_modules.py` | SystemModule, ModuleTab, TabSection |
| `apps/core/models/models_rbac_roles.py` | Role, RolePermiso, Group, GroupRole, UserRole, UserGroup, CargoRole |
| `apps/core/models/models_rbac_permisos.py` | Permiso, PermisoModulo, PermisoAccion, PermisoAlcance, CargoPermiso |
| `apps/core/models/models_rbac_adicionales.py` | RolAdicional, RolAdicionalPermiso, UserRolAdicional, CargoSectionAccess |
| `apps/core/services/permission_service.py` | CombinedPermissionService |
| `apps/core/services/permission_cache.py` | PermissionCacheService (cache Redis) |
| `apps/core/signals/rbac_signals.py` | Signals para propagacion automatica |
| `apps/core/management/commands/seed_estructura_final.py` | Seed de modulos/tabs/secciones |
| `apps/core/management/commands/seed_permisos_rbac.py` | Seed de permisos |
| `apps/core/management/commands/seed_admin_cargo.py` | Seed del cargo ADMIN |

### Frontend

| Archivo | Descripcion |
|---------|-------------|
| `src/hooks/usePermissions.ts` | Hook de verificacion de permisos |
| `src/constants/modules.ts` | Lista de 15 modulos disponibles |
| `src/constants/permissions.ts` | Constantes de permisos |

---

## 14. Changelog

| Version | Fecha | Cambios |
|---------|-------|---------|
| 2.0.1 | 2026-02-06 | Fix: rutas de archivos backend, RolAdicionalPermiso/RolePermiso usan Permiso legacy (no section), method name check_section_permission |
| 2.0.0 | 2026-02-06 | Reescritura: 4 capas, seeds, signals, jerarquia modulos |
| 1.0.0 | 2025-01-31 | Documento inicial RBAC |

---

## 15. Evolución futura — RBAC v5

Este documento describe **RBAC v4.1** (estado actual en producción).

El diseño propuesto para **RBAC v5** (Permission flat + PermissionTemplate + Nav Separation)
está documentado en [`rbac-v5-roadmap.md`](rbac-v5-roadmap.md).

v5 se activa cuando se incorporen módulos C2 de mayor volumen (Production Ops, HSEQ, Sales CRM)
donde el modelo de permisos por cargo se vuelve insuficiente para la granularidad requerida.
