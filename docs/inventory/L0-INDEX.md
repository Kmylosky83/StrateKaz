# L0 — Core: Índice Estructural

**Fecha:** 2026-04-06
**Alcance:** backend/apps/core/ + backend/apps/ia/ + frontend core-related
**Total LOC:** ~65,000 (backend core: 47,301 + IA: 2,423 + frontend: ~15,400)

---

## Sub-bloques Lógicos (7 identificados)

### 1. Auth / JWT / Session

**Propósito:** Autenticación JWT, login/logout, refresh tokens, setup-password, sesiones activas.

| Aspecto | Detalle |
|---------|---------|
| Archivos principales | `views/auth_views.py` (203), `views/setup_password_views.py` (260), `viewsets_session.py` (254), `serializers_session.py` (122), `models/models_session.py` (298) |
| LOC aprox | ~1,500 |
| Modelos | User (parcial — auth fields), UserSession |
| Endpoints API | 7 (login, refresh, logout, current_user, setup-password, resend-setup, sessions CRUD) |
| Tests | `test_auth.py` — 16 tests, 219 líneas |
| Estado | **LIVE pleno** |

### 2. RBAC Dinámico (Permisos, Roles, Grupos, SectionAccess)

**Propósito:** Sistema 100% dinámico de permisos basado en Cargo → SectionAccess (OR con RolAdicional + Group). Compute en tiempo real, sin permisos hardcodeados.

| Aspecto | Detalle |
|---------|---------|
| Archivos principales | `viewsets_rbac.py` (1,771), `serializers_rbac.py` (1,620), `models/models_rbac_permisos.py` (289), `models/models_rbac_roles.py` (542), `models/models_rbac_adicionales.py` (639), `utils/rbac.py` (148), `services/permission_service.py` (631), `services/permission_cache.py` (367) |
| LOC aprox | ~6,500 |
| Modelos | PermisoModulo, PermisoAccion, PermisoAlcance, Permiso, CargoPermiso, Role, RolePermiso, GrupoTipo, Group, GroupRole, GroupSectionAccess, UserRole, UserGroup, CargoRole, RolAdicional, RolAdicionalPermiso, UserRolAdicional, RolAdicionalSectionAccess, CargoSectionAccess, PermissionTemplate, PermissionTemplateApplication, PermissionChangeLog (22 modelos) |
| Endpoints API | ~30 (roles CRUD, groups CRUD, cargos-rbac CRUD, roles-adicionales CRUD, menus, permissions, rbac-stats, sections API) |
| Tests | `test_rbac.py` (38 tests, 1,160 líneas) + `test_permissions_api.py` (26 tests, 894 líneas) = **64 tests** |
| Estado | **LIVE pleno** — el sub-bloque más grande y más testeado de L0 |

### 3. System Modules / Sidebar / Menu

**Propósito:** Configuración de qué módulos/tabs/secciones están habilitados por tenant. Genera el árbol del sidebar y el dashboard. SSOT para la estructura de navegación.

| Aspecto | Detalle |
|---------|---------|
| Archivos principales | `viewsets_config.py` (939), `serializers_config.py` (348), `models/models_system_modules.py` (461), `models/models_menu.py` (248) |
| LOC aprox | ~2,000 |
| Modelos | SystemModule, ModuleTab, TabSection, MenuItem (4 modelos) |
| Endpoints API | ~8 (system-modules CRUD, module-tabs CRUD, tab-sections CRUD, tree, sidebar) |
| Tests | 0 |
| Estado | **LIVE pleno** — sin tests pero crítico (genera sidebar para todos los usuarios) |

### 4. User Management / Cargo / Datos Maestros

**Propósito:** Modelo User completo (60+ campos), Cargo (puestos de trabajo con 9 secciones), datos maestros (TipoDocumento, Departamento, Ciudad), select-lists transversales.

| Aspecto | Detalle |
|---------|---------|
| Archivos principales | `models/models_user.py` (1,350), `viewsets.py` (912), `serializers.py` (752), `views/select_lists.py` (460), `views/core_views.py` (605), `viewsets_datos_maestros.py` (106) |
| LOC aprox | ~4,500 |
| Modelos | User, Cargo, RiesgoOcupacional, TipoDocumentoIdentidad, Departamento, Ciudad (6 modelos) |
| Endpoints API | ~20 (users CRUD, cargos CRUD, riesgos-ocupacionales CRUD, datos maestros, 14 select-lists, profile-completeness, mi-equipo-jefe) |
| Tests | `test_cargo.py` (32 tests, 1,384 líneas) + `test_fields.py` (13 tests, 169 líneas) = **45 tests** |
| Estado | **LIVE pleno** — User y Cargo son los modelos más referenciados del sistema |

### 5. 2FA / Seguridad

**Propósito:** Two-Factor Authentication (TOTP + email OTP), impersonación con auditoría, middleware de seguridad (CSP, rate limiting, IP blocking).

| Aspecto | Detalle |
|---------|---------|
| Archivos principales | `views/two_factor_views.py` (623), `models/models_two_factor.py` (240), `serializers_2fa.py` (124), `middleware/impersonation_audit.py` (205), `middleware/security.py` (199), `utils/impersonation.py` (136) |
| LOC aprox | ~1,700 |
| Modelos | TwoFactorAuth, EmailOTP (2 modelos) |
| Endpoints API | 8 (2fa/status, setup, enable, disable, verify, regenerate-backup-codes, send-email-otp, user-preferences) |
| Tests | `test_two_factor.py` (16 tests, 327 líneas) + `test_health.py` (10 tests, 77 líneas) = **26 tests** |
| Estado | **LIVE pleno** |

### 6. IA Multi-Provider

**Propósito:** Asistencia de texto (5 acciones) + ayuda contextual por módulo. Multi-provider con fallback automático (Gemini, OpenAI, DeepSeek, Claude). Cuota por tenant.

| Aspecto | Detalle |
|---------|---------|
| Archivos principales | `ia/services/gemini_service.py` (496), `ia/views.py` (376), `ia/services/context_help.py` (277), `ia/services/text_assist.py` (134), `ia/models.py` (166) |
| LOC aprox | ~2,400 (app completa) |
| Modelos | AICallLog, AIQuotaConfig (2 modelos) |
| Endpoints API | 4 (context-help, text-assist, status, usage-stats) |
| Tests | 2 archivos (451 líneas total) |
| Estado | **LIVE pleno** |

### 7. Infraestructura Transversal (Base Models, Middleware, Tasks, Seeds, Onboarding)

**Propósito:** Todo lo que otros módulos consumen pero no es un feature en sí: base models abstractos, middleware stack, tareas Celery de mantenimiento, 26 management commands, smart onboarding, validators, sanitization, cache utils.

| Aspecto | Detalle |
|---------|---------|
| Archivos principales | `base_models/base.py` (336), `tasks.py` (1,588), `validators.py` (1,378), `cache_utils.py` (329), `views/onboarding_views.py` (638), `services/onboarding_service.py` (653), `signals/` (959 total) |
| LOC aprox | ~12,000 (incluye 26 management commands: 7,938 líneas) |
| Modelos | UserOnboarding, UserPreferences (2 modelos) |
| Endpoints API | 6 (onboarding CRUD, org-templates, health, health-deep) |
| Tests | 0 directos (onboarding, tasks, validators no testeados) |
| Estado | **LIVE parcial** — funciona pero es la zona con más deuda invisible (tasks.py = 1,588 LOC, validators.py = 1,378 LOC sin tests) |

---

## Dependencias Internas (entre sub-bloques de L0)

```
Auth/JWT ──→ User (necesita el modelo para login/tokens)
     │
     └──→ 2FA/Seguridad (verify OTP antes de ciertas acciones)

RBAC ──→ User/Cargo (CargoSectionAccess necesita Cargo)
  │
  └──→ System Modules (filtra árbol por permisos del cargo)

System Modules ──→ RBAC (tree endpoint aplica compute_user_rbac)

User/Cargo ──→ Infraestructura (hereda BaseCompanyModel, usa validators)

IA ──→ Auth (IsAuthenticated para endpoints)
  │
  └──→ Infraestructura (TenantModel para modelos, cuota por tenant)

Todo ──→ Infraestructura (base models, middleware, signals)
```

## Dependencias Hacia Afuera (qué consumen L10/L12/L15/L20 de L0)

| Consumidor | Qué importa de L0 | Frecuencia |
|------------|-------------------|------------|
| **Todos los módulos** | `BaseCompanyModel`, `get_tenant_empresa` | 60+ archivos |
| **Todos los ViewSets** | `GranularActionPermission`, `StandardViewSetMixin` | 43+ archivos |
| **L10 (Configuración)** | `User`, `Cargo`, `SystemModule` | Modelos referenciados por FK |
| **L10 (Organización)** | `Cargo` (FK en Area.manager) | FK directa |
| **L12 (Workflow)** | `User`, `Cargo` (firmantes, asignaciones) | FK en FirmaDigital, FlowNode |
| **L12 (Audit System)** | `User` (logs), `get_effective_user` (impersonación) | En todos los ViewSets |
| **L15 (Gestión Documental)** | `User`, `Cargo`, `ContentType`, `GranularActionPermission` | FK en Documento, firmas |
| **L20 (Mi Equipo)** | `User` (OneToOne en Colaborador), `Cargo`, `Area` | FK directas |
| **Frontend** | `usePermissions`, `authStore`, `ProtectedRoute`, `ModuleGuard`, `SectionGuard` | En toda la SPA |

**L0 es el cimiento absoluto.** Cualquier problema aquí se propaga a los 5 niveles superiores.

---

## Resumen Cuantitativo

| Sub-bloque | LOC Backend | Modelos | Endpoints | Tests | Estado |
|------------|-------------|---------|-----------|-------|--------|
| Auth/JWT/Session | 1,500 | 2 | 7 | 16 | LIVE pleno |
| RBAC Dinámico | 6,500 | 22 | 30 | 64 | LIVE pleno |
| System Modules/Sidebar | 2,000 | 4 | 8 | 0 | LIVE pleno (sin tests) |
| User/Cargo/Datos Maestros | 4,500 | 6 | 20 | 45 | LIVE pleno |
| 2FA/Seguridad | 1,700 | 2 | 8 | 26 | LIVE pleno |
| IA Multi-Provider | 2,400 | 2 | 4 | ~20 | LIVE pleno |
| Infraestructura Transversal | 12,000 | 2 | 6 | 0 | LIVE parcial |
| **TOTAL** | **~30,600** | **40** | **~83** | **~171** | — |

Frontend core-related adicional: ~15,400 LOC (stores, hooks, API clients, guards, features/users + perfil + admin-global).
