# Admin Global - Panel de Superusuarios

> **Version:** 1.0.0 | **Fecha:** 2026-02-06

## 1. Overview

El **Admin Global** es el panel de administracion de la plataforma StrateKaz, accesible unicamente por superusuarios (`TenantUser.is_superadmin = true`). Permite gestionar:

- **Empresas (Tenants)**: Crear, configurar y monitorear empresas clientes
- **Planes de Suscripcion**: Definir niveles de servicio con limites y precios
- **Usuarios Globales**: Administrar usuarios que pueden acceder a multiples empresas

```
/admin-global
├── Tab: Empresas (TenantsSection)
│   ├── Lista con estadisticas
│   ├── TenantFormModal (7 tabs de configuracion)
│   └── TenantCreationProgress (progreso asincrono)
│
├── Tab: Planes (PlansSection)
│   ├── Lista con tarjetas
│   └── PlanFormModal
│
└── Tab: Usuarios (UsersGlobalSection)
    ├── Lista con estadisticas
    ├── TenantUserFormModal
    └── Asignacion de tenants
```

---

## 2. Estructura del Frontend

### 2.1 Ruta y Proteccion

```typescript
// Ruta: /admin-global
// Proteccion: Solo usuarios con is_superadmin = true
// Archivo: frontend/src/routes/
```

### 2.2 Arbol de Componentes

```
features/admin-global/
├── pages/
│   └── AdminGlobalPage.tsx          # Pagina principal con 3 tabs
├── components/
│   ├── TenantsSection.tsx           # Lista y gestion de empresas
│   ├── PlansSection.tsx             # Lista y gestion de planes
│   ├── UsersGlobalSection.tsx       # Lista y gestion de usuarios
│   ├── TenantFormModal.tsx          # Modal crear/editar empresa (7 tabs)
│   ├── PlanFormModal.tsx            # Modal crear/editar plan
│   ├── TenantUserFormModal.tsx      # Modal crear/editar usuario
│   └── TenantCreationProgress.tsx   # Modal de progreso de creacion
├── hooks/
│   └── useAdminGlobal.ts           # React Query hooks (CRUD)
├── api/
│   └── adminGlobal.api.ts          # Funciones de API (axios)
└── types/
    └── index.ts                     # Tipos TypeScript
```

---

## 3. Seccion Empresas (TenantsSection)

### 3.1 Estadisticas

Muestra cards con metricas en tiempo real:

| Metrica | Descripcion |
|---------|-------------|
| Total | Numero total de empresas |
| Activas | Empresas con `is_active=true` |
| Inactivas | Empresas con `is_active=false` |
| Trial | Empresas en periodo de prueba |
| Por expirar | Suscripciones que vencen pronto |
| Expiradas | Suscripciones vencidas |
| Por Plan | Distribucion de empresas por plan |

### 3.2 Lista de Empresas

- Busqueda por nombre, codigo o NIT
- Filtros por estado (activa/inactiva), plan, trial
- Columnas: nombre, codigo, plan, tier, estado, schema_status, usuarios, fecha creacion
- Acciones: editar, ver detalle, eliminar

### 3.3 TenantFormModal (7 Tabs)

Modal completo para crear o editar una empresa:

#### Tab 1: Identificacion
| Campo | Requerido | Descripcion |
|-------|-----------|-------------|
| Codigo | Si (solo crear) | Codigo unico, genera schema_name. Regex: `^[a-z][a-z0-9_]*$` |
| Nombre | Si | Nombre de la empresa |
| NIT | No | Numero de identificacion tributaria |
| Subdominio | Si (crear) | Subdominio para acceso |

#### Tab 2: Plan y Limites
| Campo | Descripcion |
|-------|-------------|
| Plan | Seleccionar plan de suscripcion |
| Max Usuarios | Override (0=usar plan) |
| Max Almacenamiento | Override en GB |
| Tier | starter, small, medium, large, enterprise |
| Modulos | Checkboxes de 15 modulos disponibles |

#### Tab 3: Estado
| Campo | Descripcion |
|-------|-------------|
| Activo | Si la empresa puede operar |
| Trial | En periodo de prueba |
| Fin de Trial | Fecha limite del trial |
| Fin de Suscripcion | Fecha de vencimiento |

#### Tab 4: Datos Fiscales
| Campo | Descripcion |
|-------|-------------|
| Razon Social | Nombre legal completo |
| Nombre Comercial | Nombre de fantasia |
| Representante Legal | Nombre del representante |
| Cedula Representante | Documento del representante |
| Tipo de Sociedad | SAS, SA, LTDA, ESAL, etc. |
| Actividad Economica | Codigo CIIU |
| Regimen Tributario | COMUN, SIMPLE, NO_RESPONSABLE, etc. |

#### Tab 5: Contacto
| Campo | Descripcion |
|-------|-------------|
| Direccion Fiscal | Direccion oficial |
| Ciudad | Ciudad |
| Departamento | 32 departamentos de Colombia |
| Pais | Default: Colombia |
| Codigo Postal | Codigo postal |
| Telefono Principal | Telefono de contacto |
| Email Corporativo | Email oficial |
| Sitio Web | URL del sitio web |

#### Tab 6: Branding
| Campo | Descripcion |
|-------|-------------|
| Slogan | Slogan de la empresa |
| Logo Principal | ImageField |
| Logo Blanco | Para fondos oscuros |
| Logo Modo Oscuro | Variante dark |
| Favicon | Icono de pestana |
| Fondo Login | Imagen de fondo |
| Color Primario | HEX (default: #ec268f) |
| Color Secundario | HEX (default: #000000) |
| Color Acento | HEX (default: #f4ec25) |
| Color Sidebar | HEX (default: #1E293B) |
| Gradientes | Mission, Vision, Policy, Values |
| PWA | Nombre, icono 192, icono 512, colores |

#### Tab 7: Notas
| Campo | Descripcion |
|-------|-------------|
| Notas | Texto libre para observaciones internas |

### 3.4 TenantCreationProgress

Modal que muestra el progreso de creacion asincrona del schema:

- **Barra de progreso** animada (0-100%)
- **Fase actual** con etiqueta descriptiva
- **Deteccion de estancamiento**: Si el progreso no avanza en 5 minutos, muestra warning
- **Boton Reintentar**: Disponible si falla o se estanca
- **Auto-cierre**: Se cierra automaticamente 2 segundos despues de completar
- **Polling**: Consulta estado cada 3 segundos via `useTenantCreationStatus`

Fases mostradas:
```
En cola de procesamiento → Inicializando → Creando schema →
Aplicando estructura de datos → Finalizando → Completado
```

---

## 4. Seccion Planes (PlansSection)

### 4.1 Lista de Planes

Muestra planes como tarjetas con:
- Nombre y codigo
- Precio mensual y anual
- Limites (usuarios, almacenamiento)
- Numero de tenants asociados
- Estado (activo/inactivo, por defecto)

### 4.2 PlanFormModal

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| Nombre | text | Si | Nombre del plan |
| Codigo | text | Si (crear) | Codigo unico, auto-generado desde nombre |
| Descripcion | textarea | No | Descripcion del plan |
| Precio Mensual | number | No | USD |
| Precio Anual | number | No | USD |
| Max Usuarios | number | No | 0=ilimitado |
| Almacenamiento GB | number | No | GB de storage |
| Modulos | checkboxes | No | 15 modulos disponibles |
| Activo | checkbox | No | Si el plan esta disponible |
| Plan por Defecto | checkbox | No | Asignado a nuevos tenants |

### 4.3 Modulos Disponibles

Los 15 modulos del sistema, organizados por categoria:

| Categoria | Modulos |
|-----------|---------|
| ESTRATEGICO | Direccion Estrategica, Sistema de Gestion |
| CUMPLIMIENTO | Cumplimiento Normativo, Motor de Riesgos, Flujos de Trabajo |
| INTEGRAL | Gestion Integral HSEQ |
| OPERATIVO | Cadena de Suministro, Base de Operaciones, Logistica y Flota, Ventas y CRM |
| SOPORTE | Centro de Talento, Administracion, Contabilidad |
| INTELIGENCIA | Inteligencia de Negocios, Sistema de Auditorias |

**Fuente de verdad:** `frontend/src/constants/modules.ts` - Compartida entre PlanFormModal y TenantFormModal.

**Modulos por defecto** para nuevos tenants:
- `gestion_estrategica`
- `sistema_gestion`
- `motor_cumplimiento`
- `hseq_management`

---

## 5. Seccion Usuarios (UsersGlobalSection)

### 5.1 Estadisticas

| Metrica | Descripcion |
|---------|-------------|
| Total | Usuarios globales totales |
| Activos | Con `is_active=true` |
| Inactivos | Con `is_active=false` |
| Superadmins | Con `is_superadmin=true` |
| Multi-tenant | Con acceso a mas de 1 empresa |

### 5.2 Lista de Usuarios

- Busqueda por nombre, email
- Filtros por estado, superadmin
- Columnas: nombre, email, activo, superadmin, tenants, ultimo login

### 5.3 TenantUserFormModal

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| Email | email | Si | Email unico |
| Password | password | Si (crear) | Contrasena |
| Nombre | text | Si | Primer nombre |
| Apellido | text | Si | Apellido |
| Telefono | text | No | Telefono de contacto |
| Activo | checkbox | No | Estado del usuario |
| Superadmin | checkbox | No | Acceso total a la plataforma |

### 5.4 Asignacion de Tenants

Desde el detalle de un usuario se pueden:
- **Asignar acceso** a una empresa (grant-access)
- **Revocar acceso** a una empresa (revoke-access)
- **Ver lista** de empresas accesibles con fecha de asignacion

---

## 6. Hooks y API Layer

### 6.1 React Query Hooks (`useAdminGlobal.ts`)

**Plans (6 hooks):**

| Hook | Tipo | Descripcion |
|------|------|-------------|
| `usePlans` | Query | Lista de planes |
| `usePlan` | Query | Detalle de un plan por ID |
| `usePlansStats` | Query | Estadisticas de planes |
| `useCreatePlan` | Mutation | Crear plan |
| `useUpdatePlan` | Mutation | Actualizar plan |
| `useDeletePlan` | Mutation | Eliminar plan |

**Tenants (10 hooks):**

| Hook | Tipo | Descripcion |
|------|------|-------------|
| `useTenantsList` | Query | Lista de tenants con filtros (is_active, is_trial, plan, tier, search) |
| `useTenant` | Query | Detalle de un tenant por ID |
| `useTenantsStats` | Query | Estadisticas de tenants |
| `useTenantUsers` | Query | Usuarios de un tenant especifico |
| `useCreateTenant` | Mutation | Crear tenant (trigger creacion asincrona) |
| `useTenantCreationStatus` | Query | Polling de estado de creacion (refetch 3s) |
| `useRetryTenantCreation` | Mutation | Reintentar creacion fallida |
| `useUpdateTenant` | Mutation | Actualizar tenant (soporta FormData) |
| `useDeleteTenant` | Mutation | Eliminar tenant |
| `useToggleTenantActive` | Mutation | Activar/desactivar tenant |

**Usuarios Globales (8 hooks):**

| Hook | Tipo | Descripcion |
|------|------|-------------|
| `useTenantUsersList` | Query | Lista de usuarios globales con filtros |
| `useTenantUser` | Query | Detalle de un usuario por ID |
| `useTenantUsersStats` | Query | Estadisticas de usuarios |
| `useCreateTenantUser` | Mutation | Crear usuario global |
| `useUpdateTenantUser` | Mutation | Actualizar usuario |
| `useDeleteTenantUser` | Mutation | Eliminar usuario |
| `useAssignTenantToUser` | Mutation | Asignar acceso a tenant |
| `useRemoveTenantFromUser` | Mutation | Revocar acceso a tenant |

> **Total: 24 hooks** (6 Plans + 10 Tenants + 8 Users)

### 6.2 Query Keys (`adminGlobalKeys`)

```typescript
export const adminGlobalKeys = {
  // Plans
  plans: ['admin-global', 'plans'],
  plansList: () => [...adminGlobalKeys.plans, 'list'],
  plansDetail: (id: number) => [...adminGlobalKeys.plans, 'detail', id],
  plansStats: () => [...adminGlobalKeys.plans, 'stats'],

  // Tenants
  tenants: ['admin-global', 'tenants'],
  tenantsList: (filters?) => [...adminGlobalKeys.tenants, 'list', filters],
  tenantsDetail: (id: number) => [...adminGlobalKeys.tenants, 'detail', id],
  tenantsStats: () => [...adminGlobalKeys.tenants, 'stats'],
  tenantsUsers: (id: number) => [...adminGlobalKeys.tenants, 'users', id],
  tenantsCreationStatus: (id: number) => [...adminGlobalKeys.tenants, 'creation-status', id],

  // Tenant Users
  tenantUsers: ['admin-global', 'tenant-users'],
  tenantUsersList: (filters?) => [...adminGlobalKeys.tenantUsers, 'list', filters],
  tenantUsersDetail: (id: number) => [...adminGlobalKeys.tenantUsers, 'detail', id],
  tenantUsersStats: () => [...adminGlobalKeys.tenantUsers, 'stats'],
};
```

### 6.3 API Layer (`adminGlobal.api.ts`)

Funciones que llaman al backend via axios:

```typescript
// BASE_URL = '/tenant'

// tenantsApi
tenantsApi.getAll(params?)           → GET  /tenant/tenants/
tenantsApi.getById(id)               → GET  /tenant/tenants/{id}/
tenantsApi.getStats()                → GET  /tenant/tenants/stats/
tenantsApi.create(data)              → POST /tenant/tenants/
tenantsApi.update(id, data|FormData) → PATCH /tenant/tenants/{id}/
tenantsApi.delete(id)                → DELETE /tenant/tenants/{id}/
tenantsApi.toggleActive(id)          → POST /tenant/tenants/{id}/toggle_active/
tenantsApi.getUsers(id)              → GET  /tenant/tenants/{id}/users/
tenantsApi.getCreationStatus(id)     → GET  /tenant/tenants/{id}/creation-status/
tenantsApi.retryCreation(id)         → POST /tenant/tenants/{id}/retry-creation/

// plansApi
plansApi.getAll()                    → GET  /tenant/plans/
plansApi.getById(id)                 → GET  /tenant/plans/{id}/
plansApi.getStats()                  → GET  /tenant/plans/stats/
plansApi.create(data)                → POST /tenant/plans/
plansApi.update(id, data)            → PATCH /tenant/plans/{id}/
plansApi.delete(id)                  → DELETE /tenant/plans/{id}/

// tenantUsersApi
tenantUsersApi.getAll(params?)       → GET  /tenant/users/
tenantUsersApi.getById(id)           → GET  /tenant/users/{id}/
tenantUsersApi.getStats()            → GET  /tenant/users/stats/
tenantUsersApi.create(data)          → POST /tenant/users/
tenantUsersApi.update(id, data)      → PATCH /tenant/users/{id}/
tenantUsersApi.delete(id)            → DELETE /tenant/users/{id}/
tenantUsersApi.assignTenant(userId, data)         → POST /tenant/users/{id}/assign_tenant/
tenantUsersApi.removeTenant(userId, tenantId)      → POST /tenant/users/{id}/remove_tenant/
tenantUsersApi.getMe()               → GET  /tenant/users/me/
tenantUsersApi.getMyTenants()        → GET  /tenant/users/tenants/
```

---

## 7. Tipos TypeScript

### 7.1 Tipos Principales (`types/index.ts`)

```typescript
// Plan de suscripcion
interface Plan {
  id: number; code: string; name: string; description?: string;
  max_users: number; max_storage_gb: number;
  price_monthly: string; price_yearly: string;
  features: string[]; is_active: boolean; is_default: boolean;
  tenant_count?: number;
}

// Tenant completo
interface Tenant {
  id: number; code: string; name: string; nit?: string;
  subdomain: string; primary_domain?: string;
  plan?: number; plan_name?: string; tier: TenantTier;
  max_users: number; max_storage_gb: number;
  enabled_modules: string[]; is_active: boolean; is_trial: boolean;
  schema_status?: SchemaStatus;
  // + datos fiscales, contacto, branding, PWA, backup, auditoria
}

// Usuario global
interface TenantUser {
  id: number; email: string; first_name: string; last_name: string;
  is_active: boolean; is_superadmin: boolean;
  accesses: TenantUserAccess[]; tenant_count: number;
}

// Estadisticas
interface TenantStats {
  total: number; active: number; inactive: number;
  trial: number; expiring_soon: number; expired: number;
  by_plan: Array<{ plan__name: string; count: number }>;
}
```

### 7.2 Tipos de Referencia

| Tipo | Descripcion |
|------|-------------|
| `TenantTier` | 'starter' \| 'small' \| 'medium' \| 'large' \| 'enterprise' |
| `SchemaStatus` | 'pending' \| 'creating' \| 'ready' \| 'failed' |
| `TipoSociedad` | 'SAS' \| 'SA' \| 'LTDA' \| ... |
| `RegimenTributario` | 'COMUN' \| 'SIMPLE' \| 'NO_RESPONSABLE' \| ... |
| `FormatoFecha` | 'DD/MM/YYYY' \| 'MM/DD/YYYY' \| ... |
| `Moneda` | 'COP' \| 'USD' \| 'EUR' |
| `ZonaHoraria` | 'America/Bogota' \| 'America/New_York' \| ... |

---

## 8. Constantes Compartidas

**Archivo:** `frontend/src/constants/modules.ts`

```typescript
export const AVAILABLE_MODULES: SystemModule[] = [
  // 15 modulos del sistema organizados por categoria
];

export const DEFAULT_ENABLED_MODULES = [
  'gestion_estrategica', 'sistema_gestion',
  'motor_cumplimiento', 'hseq_management',
];
```

Exportadas desde `frontend/src/constants/index.ts` para uso global.

---

## 9. Componentes Relacionados

### 9.1 TenantSwitcher

**Archivo:** `frontend/src/components/common/TenantSwitcher.tsx`

Componente del sidebar que permite al usuario cambiar entre empresas:
- Muestra lista de tenants accesibles (filtrados por `code !== 'public'`)
- Muestra logo, nombre y color de cada tenant
- Al seleccionar, llama a `POST /api/tenant/auth/select-tenant/`
- Actualiza el header `X-Tenant-ID` para requests subsiguientes

---

## 10. Archivos del Modulo

| Archivo | Descripcion |
|---------|-------------|
| `features/admin-global/pages/AdminGlobalPage.tsx` | Pagina principal con tabs |
| `features/admin-global/components/TenantsSection.tsx` | Gestion de empresas |
| `features/admin-global/components/PlansSection.tsx` | Gestion de planes |
| `features/admin-global/components/UsersGlobalSection.tsx` | Gestion de usuarios |
| `features/admin-global/components/TenantFormModal.tsx` | Formulario de empresa (7 tabs) |
| `features/admin-global/components/PlanFormModal.tsx` | Formulario de plan |
| `features/admin-global/components/TenantUserFormModal.tsx` | Formulario de usuario |
| `features/admin-global/components/TenantCreationProgress.tsx` | Progreso de creacion |
| `features/admin-global/hooks/useAdminGlobal.ts` | Hooks de React Query |
| `features/admin-global/api/adminGlobal.api.ts` | Funciones de API |
| `features/admin-global/types/index.ts` | Tipos TypeScript |
| `constants/modules.ts` | Modulos disponibles (compartido) |
| `components/common/TenantSwitcher.tsx` | Selector de tenant en sidebar |

---

## 11. Relacion con Backend

| Frontend | Backend API | ViewSet |
|----------|-------------|---------|
| TenantsSection | `/api/tenant/tenants/` | TenantViewSet |
| PlansSection | `/api/tenant/plans/` | PlanViewSet |
| UsersGlobalSection | `/api/tenant/users/` | TenantUserViewSet |
| TenantCreationProgress | `/api/tenant/tenants/{id}/creation-status/` | TenantViewSet.creation_status |
| TenantSwitcher | `/api/tenant/auth/select-tenant/` | TenantSelectView |

Para documentacion completa del backend, ver [MULTI-TENANT.md](./MULTI-TENANT.md).

---

## 12. Superadmin dentro del Tenant

### 12.1 Identidad del Superadmin

Cuando un superadmin (`TenantUser.is_superadmin=true`) entra a un tenant, el sistema auto-crea un `User` en ese schema con `is_superuser=True`. **NO se crea Colaborador.**

| Aspecto | Comportamiento |
|---------|----------------|
| Label en UI | "Administrador del Sistema" (UserMenu, PerfilPage, AdminPortalView) |
| Cargo interno | `ADMIN_GENERAL` (auto-creado, solo para permisos internos) |
| Firma digital | No requerida — superadmin no participa en workflows documentales |
| Profile completion | Simplificado: foto (25%), nombre (25%), documento (25%), firma (25%) |
| Mi Portal | Muestra `AdminPortalView` con stats y acciones rapidas |
| Colaborador | NUNCA se crea para superadmin puro |

### 12.2 Perfil del Superadmin

El superadmin puede editar su perfil desde el avatar (EditProfileModal):

| Campo | Editable | Notas |
|-------|:--------:|-------|
| first_name | SI | Nombre |
| last_name | SI | Apellido |
| email | SI | Email corporativo |
| phone | SI | Telefono |
| document_type | SI | CC, CE, NIT, PA, TI (solo superadmin) |
| document_number | SI | Reemplaza TEMP-xxx generado automaticamente |
| photo | SI | Upload via endpoint separado |

Endpoint: `PUT /api/core/users/update_profile/` — campos `document_type` y `document_number` solo permitidos para `is_superuser=True`.

### 12.3 Impersonacion con 2FA

El superadmin puede "ver como" otro usuario mediante impersonacion. Requiere verificacion 2FA obligatoria.

**Flujo:**
1. Superadmin va a `/usuarios` y hace clic en icono de ojo
2. Se abre `ImpersonateVerifyModal` — pide codigo TOTP de la app de autenticacion
3. Frontend envia `POST /api/core/users/{id}/impersonate-verify/` con `{ totp_code: "123456" }`
4. Backend verifica 2FA via `TwoFactorAuth.verify_token()` y registra audit log
5. Si pasa, frontend llama `GET /api/core/users/{id}/impersonate-profile/`
6. Se carga el perfil del usuario target con header `X-Impersonated-User-ID`

**Endpoints:**

| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/api/core/users/{id}/impersonate-verify/` | POST | Verifica 2FA antes de impersonar |
| `/api/core/users/{id}/impersonate-profile/` | GET | Carga perfil del usuario impersonado |

**Seguridad:**
- Solo `is_superuser=True` puede impersonar
- 2FA obligatorio (sin 2FA habilitado, no puede impersonar)
- Audit log: `impersonated_by`, `target_user_id`, `2fa_verified_at`
- `get_effective_user()` resuelve el usuario real vs impersonado

**NOTA:** `get_effective_user()` NO usa `select_related('proveedor', 'cliente')` — `proveedor_id_ext` y `cliente_id_ext` son `IntegerField`, no FK.

### 12.4 AdminPortalView

Cuando el superadmin accede a Mi Portal, ve un dashboard con:

- **Hero:** Saludo personalizado + badge "Administrador del Sistema" + nombre del tenant
- **Stats Grid:** Total usuarios, usuarios activos, pendientes setup, modulos habilitados
- **Acciones rapidas:** Crear usuario, ver usuarios, ir a dashboard
- **Guia colapsable:** Como impersonar un usuario (instrucciones paso a paso)

Datos consumidos de `GET /api/core/users/stats/`.
