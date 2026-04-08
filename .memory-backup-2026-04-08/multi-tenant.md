# Multi-Tenant Architecture

## Bases de Datos y Schemas por Entorno

### Producción (VPS Hostinger)
| Elemento | Valor |
|----------|-------|
| **DB name** | `stratekaz` |
| **Schema public** | SHARED_APPS (tenant_tenant, tenant_user, celery_beat, etc.) |
| **Schema `tenant_stratekaz`** | Tenant demo principal (StrateKaz Demo) |
| **Schema `tenant_grasas_y_huesos_del_`** | Tenant cliente (Grasas y Huesos) |

### Desarrollo (Docker local)
| Elemento | Valor |
|----------|-------|
| **DB name** | `stratekaz` (servicio `db` en docker-compose) |
| **Schema public** | SHARED_APPS (~20 tablas) |
| **Schema `tenant_demo`** | Único tenant dev (StrateKaz Demo, ~246 tablas) |

### Regla: `manage.py shell` requiere `schema_context`
```python
from django_tenants.utils import schema_context
# Dev:
with schema_context('tenant_demo'):
    ...
# Prod:
with schema_context('tenant_stratekaz'):
    ...
```

## Schema Architecture
```
public schema (SHARED_APPS only):
  tenant_tenant, tenant_domain, tenant_user, tenant_user_access, tenant_plan
  django_migrations, django_content_type, django_session
  django_celery_beat_*, django_celery_results_*

tenant_xxx schemas (TENANT_APPS):
  core_user, core_cargo, core_system_module, core_module_tab, core_tab_section
  200+ tables from all TENANT_APPS
```

## Critical Rules
1. **NEVER** create Tenant with `schema_name='public'` — always `tenant_{code}`
2. `migrate_schemas --shared` = only SHARED_APPS in public
3. `migrate_schemas --schema=tenant_xxx` = TENANT_APPS in that schema
4. Phantom migrations: if records exist in `django_migrations` but tables don't → DELETE records first
5. `auto_create_schema = False` on Tenant model (async via Celery) — `bootstrap_production` handles manually

## Three-Tier User Hierarchy
```
TenantUser (public schema)  →  User (tenant schema)  →  Colaborador (tenant HR record)
       ↓ login JWT                  ↓ system access           ↓ optional usuario FK
  email + password             cargo + permisos RBAC      datos laborales + hoja de vida
```

### TenantUser (public schema)
- Custom model — NOT AbstractBaseUser, NOT AbstractUser
- Own `password` CharField(max_length=128)
- Own `set_password()` using Django's `make_password()`
- Own `check_password()` using Django's `django_check_password()`
- Fields: email (unique), password, first_name, last_name, is_active, is_superadmin
- Password reset: `password_reset_token` (UUID hex) + `password_reset_expires` (1h)
- M:N with Tenant via TenantUserAccess

### User (tenant schema — core.User)
- Lives in tenant schema, created per-tenant
- Has cargo → RBAC permissions via CargoSectionAccess
- Auto-created from TenantUser on first tenant access (HybridJWTAuthentication)
- Password setup: `password_setup_token` + `password_setup_expires` (72h)

### Colaborador (tenant schema — talent_hub)
- HR record with employment data
- Optional `usuario` FK to User (OneToOneField, null=True)
- Can exist WITHOUT system access (no User linked)

## Authentication Flow
```
1. POST /api/tenant/auth/login/ → TenantLoginView (public schema)
   Returns JWT (tenant_user_id, email, is_superadmin) + accessible tenants list

2. POST /api/tenant/auth/select-tenant/ → Sets X-Tenant-ID
   Frontend stores tenant_id for subsequent requests

3. Any tenant API → HybridJWTAuthentication
   Extracts email from JWT → finds core.User in tenant schema
   If not found: auto-creates from TenantUser data + assigns ADMIN cargo
   ⚠️ ALL auto-created users start with ADMIN cargo (full section access)
   Returns core.User as request.user
```

## RBAC Structure (3 levels)
```
SystemModule (code: gestion_estrategica, motor_riesgos, etc.)
  └── ModuleTab (code: configuracion, organizacion, planeacion, etc.)
       └── TabSection (code: empresa_config, branding, areas, etc.)
            └── CargoSectionAccess (cargo_id, can_view, can_create, can_edit, can_delete)
```
- Sidebar API: `GET /api/core/system-modules/sidebar/` → filtered by CargoSectionAccess for user's cargo
- Superadmins: bypass → full sidebar
- Permission codes: `"module.section.action"` format (e.g., `"gestion_estrategica.planeacion.view"`)

## Frontend Route Protection (3 layers)
```
ProtectedRoute (isAuthenticated + currentTenantId)
  → ModuleGuard (SystemModule.is_enabled)
    → SectionGuard (canDo via usePermissions — RBAC check)
```
- `SectionGuard` at: `routes/SectionGuard.tsx`
- Applied to: `/admin-global` (requireSuperadmin), `/usuarios` (core.users_management)
- `usePermissions` hook: `canDo(module, section, action)`, `hasSectionAccess(sectionId)`, isSuperAdmin bypass

## Password Flows

### Forgot Password (existing users)
```
1. POST /api/tenant/auth/forgot-password/ {email}
2. ForgotPasswordView → generates UUID token (1h expiry) on TenantUser
3. Email sent with link: {FRONTEND_URL}/reset-password?token=xxx&email=user@example.com
4. POST /api/tenant/auth/reset-password/ {email, token, new_password}
5. ResetPasswordView → TenantUser.set_password() + save(update_fields=['password',...])
```

### Setup Password (new employees from Talent Hub)
```
1. Admin creates Colaborador with "Crear Acceso" option
2. Backend creates User + TenantUser + TenantUserAccess atomically
3. Email sent with link: {FRONTEND_URL}/setup-password?token=xxx&email=user@example.com
4. POST /api/core/setup-password/ {email, token, new_password, new_password_confirm}
5. SetupPasswordView → TenantUser.set_password() + User.set_password() + save
```

## Unified Colaborador + User Creation (Sprint 26-TH)
```
ColaboradorFormModal (4 steps for create, 3 for edit):
  Step 1: Datos Personales
  Step 2: Asignación (area, cargo)
  Step 3: Contratación
  Step 4: Acceso al Sistema (create only, optional toggle)
    → If enabled: creates User + TenantUser + TenantUserAccess + sends setup email

For existing Colaboradores without User:
  → "Crear Acceso" button (Shield icon) in ColaboradoresSection
  → CrearAccesoModal with email + username (auto-suggested from name)
  → POST /talent-hub/empleados/colaboradores/{id}/crear-acceso/
```

## Two Login Endpoints
| Endpoint | Model | Schema | Usage |
|----------|-------|--------|-------|
| `/api/tenant/auth/login/` | TenantUser | public | Primary (frontend uses this) |
| `/api/auth/login/` | core.User | tenant | Internal/secondary |

## Branding
- `Tenant.get_branding_dict()`: 30+ fields (colors, logos, PWA config)
- Public endpoint: `GET /api/tenant/public-tenant/branding/?domain=...` (no auth)

## Bootstrap Production
`python manage.py bootstrap_production`:
1. Creates TenantUser superadmin (public) → Plan → Tenant with schema
2. Creates PostgreSQL schema + cleans phantom migrations
3. Runs migrations + seeds (modules, RBAC, admin cargo)
4. Creates core.User + domain + TenantUserAccess

## Portal User Architecture (FASE 8)

### 3 Perfiles de Usuario Proveedor
| Perfil | Detección | Layout | Ve |
|--------|-----------|--------|-----|
| **Portal Puro** (MP, PS, UN, TR, representante firma) | `cargo.code === 'PROVEEDOR_PORTAL'` | `PortalLayout` | Solo su portal |
| **Profesional Colocado** (coord SST de firma) | `user.proveedor` + cargo real (`is_externo=true`) | `DashboardLayout` | Módulos RBAC |
| **Empleado Interno** | Sin `proveedor` | `DashboardLayout` | Todo normal |

### AdaptiveLayout (routing decisión)
```
AdaptiveLayout.tsx (reemplaza DashboardLayout como wrapper de rutas):
  1. Cargar user profile
  2. isPortalOnlyUser(user) → true?
     → Si pathname !== '/proveedor-portal' → Navigate('/proveedor-portal')
     → Renderizar <PortalLayout />
  3. Si NO portal-only → <DashboardLayout />
```

### isPortalOnlyUser() — Señal autoritativa
```typescript
// utils/portalUtils.ts
export function isPortalOnlyUser(user): boolean {
  if (user?.cargo?.code === 'PROVEEDOR_PORTAL') return true;  // Primaria
  if (user?.proveedor && !user.cargo) return true;              // Fallback
  return false;
}
```
**REGLA:** Usar `cargo.code` como check primario. `user.proveedor` puede ser `undefined` si el serializer no lo declara explícitamente (ver pitfalls: cross-module FK).

### Serializer patrón para FK cross-module
```python
# core/serializers.py — UserDetailSerializer
proveedor = serializers.IntegerField(source='proveedor_id', read_only=True, allow_null=True)
```

## Tenant Management Commands (FASE 8)
- `reset_tenant --tenant X` — C2-C6 + users no-admin + public schema cleanup
- `clean_tenant_modules --tenant X` — Solo C2-C6 (preserva users)
- `delete_tenant --schema X` — Eliminación total con DROP SCHEMA CASCADE
Ver [deploy.md](deploy.md) sección 10 para comandos completos.

## Production DB State
- Schema `public`: ~8 tables (shared only)
- Schema `tenant_stratekaz`: 200+ tables (production tenant)
- Domain: app.stratekaz.com → tenant_stratekaz

## Email Configuration
- **FRONTEND_URL**: Defined in `base.py` (localhost:3010) and `production.py` (app.stratekaz.com)
- **ALWAYS** use `getattr(settings, 'FRONTEND_URL', default)` — never direct access
- **DEFAULT_FROM_EMAIL**: May already contain `"Name <email>"` format — check before wrapping
- **EmailService**: Uses IntegracionExterna config first, falls back to Django settings
