# L0 — Core: Índice Estructural

**Fecha:** 2026-04-06
**Alcance:** backend/apps/core/ + backend/apps/ia/ + frontend core-related
**Total LOC medido:** 42,528 (apps/core sin migrations) + 2,128 (apps/ia sin migrations) + ~15,400 (frontend)

---

## Validación Cruzada (2026-04-06)

### Pregunta 1 — Alcance del conteo

El número original "~65,000 LOC" incluía estimaciones. Los números reales medidos con `wc -l`:

| Ubicación | LOC totales | LOC producción | LOC tests | LOC migrations | LOC mgmt commands |
|-----------|-------------|---------------|-----------|---------------|-------------------|
| `apps/core/` | 42,528 | **31,686** | 4,231 | (excluidos) | 7,927 (incluidos en producción) |
| `apps/ia/` | 2,128 | **1,677** | 451 | (excluidos) | 0 |
| `backend/utils/` | 1,543 | **1,543** | 0 | N/A | N/A |
| Frontend core-related | ~15,400 | ~15,400 | ~356 | N/A | N/A |

**`backend/utils/` (1,543 LOC)** es infraestructura compartida que NO es exclusiva de L0:
- `models.py` (339 LOC): TenantModel, SharedModel — importado por **15+ archivos** de L10-L90
- `storage.py` (394 LOC): TenantFileStorage — importado por 3 módulos
- `encryption.py` (89 LOC): Fernet — importado por 2 módulos
- `event_bus.py` (95 LOC): EventBus — importado por 2 módulos
- Resto (logging, constants, consecutivos, cache, validators, tasks): ~626 LOC

**Decisión:** `backend/utils/` NO se cuenta como L0. Es infraestructura compartida que se inventaría aparte si es necesario. Los LOC de L0 son exclusivamente `apps/core/` + `apps/ia/`.

### Pregunta 2 — Desglose del Sub-bloque 7

Los 12,000 LOC originales eran una estimación. El número real medido es **13,928 LOC** (producción, sin tests). Esto es el 44% de L0.

**Top 10 archivos del sub-bloque 7:**

| Archivo | LOC | Qué hace |
|---------|-----|----------|
| `management/commands/seed_estructura_final.py` | 1,398 | Seed de SystemModule/Tab/Section (ejecuta 1 vez) |
| `tasks.py` | 1,588 | 16 tareas Celery (email, backup, health, cleanup) |
| `serializers_mixins.py` | 1,419 | 18 mixins para serializers (reutilizados por todos los módulos) |
| `validators.py` | 1,378 | Validadores colombianos (NIT, cédula, teléfono, email) |
| `permissions.py` | 908 | GranularActionPermission + helpers |
| `management/commands/seed_riesgos_ocupacionales.py` | 872 | Seed de riesgos SST (ejecuta 1 vez) |
| `services/onboarding_service.py` | 653 | Smart onboarding lógica |
| `views/onboarding_views.py` | 638 | Endpoints de onboarding |
| `management/commands/seed_permisos_rbac.py` | 505 | Seed RBAC (ejecuta 1 vez) |
| `management/commands/seed_cargos_base.py` | 463 | Seed de cargos base (ejecuta 1 vez) |

**`tasks.py` y `validators.py` están dentro de `apps/core/`**, no en `backend/utils/`.

**¿Debería ser un nivel aparte?** Conceptualmente, el sub-bloque 7 mezcla 3 tipos de código:
1. **Infraestructura heredable** (base_models, mixins, permissions, signals): 4,700 LOC — toda la cascada hereda esto
2. **Seeds/commands** (management/commands): 7,927 LOC — se ejecutan 1 vez, no es "producción corriendo"
3. **Features propias** (onboarding, validators, tasks, cache): 4,800 LOC — features reales de L0

Los seeds (7,927 LOC) inflan el número artificialmente. Son código de configuración inicial, no lógica que corre en producción. Si los separamos:
- **Sub-bloque 7 producción activa:** 13,928 - 7,927 = **6,001 LOC**
- **Seeds (ejecución única):** 7,927 LOC

### Pregunta 3 — Tests separados de producción

| Sub-bloque | LOC producción | LOC tests | Ratio |
|------------|---------------|-----------|-------|
| 1. Auth/JWT/Session | **1,137** | 219 | 19% |
| 2. RBAC Dinámico | **6,865** | 2,054 | 30% |
| 3. System Modules/Sidebar | **1,996** | 0 | 0% |
| 4. User/Cargo/Datos Maestros | **4,336** | 1,553 | 36% |
| 5. 2FA/Seguridad | **1,747** | 404 | 23% |
| 6. IA Multi-Provider | **1,677** | 451 | 27% |
| 7. Infraestructura Transversal | **13,928** (de los cuales 7,927 son seeds) | 0 | 0% |
| **TOTAL apps/core** | **31,686** | **4,231** | **13%** |
| **TOTAL apps/ia** | **1,677** | **451** | **27%** |

**Hallazgo clave:** "12,000 LOC sin tests" en realidad es "6,001 LOC de producción activa sin tests + 7,927 LOC de seeds sin tests". Los seeds son menos críticos (se corren 1 vez y se validan visualmente). La producción activa sin tests (6,001 LOC) es el gap real.

### Discrepancia con Bloque 7

El diagnóstico del Bloque 7 reportó "core | 7 test files | ~5,000 LOC | Razonable". Esa cifra era una estimación rápida del código "feature" de core, sin contar infraestructura compartida, seeds, ni serializers/mixins. El número real es 6x más grande porque L0 no es solo "auth + users" — es la plataforma entera sobre la que todo se construye.

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

## Resumen Cuantitativo (Validado)

| Sub-bloque | LOC Producción | LOC Tests | Modelos | Endpoints | Tests func | Estado |
|------------|---------------|-----------|---------|-----------|-----------|--------|
| 1. Auth/JWT/Session | 1,137 | 219 | 2 | 7 | 16 | LIVE pleno |
| 2. RBAC Dinámico | 6,865 | 2,054 | 22 | ~30 | 64 | LIVE pleno |
| 3. System Modules/Sidebar | 1,996 | 0 | 4 | ~8 | 0 | LIVE pleno (0 tests) |
| 4. User/Cargo/Datos Maestros | 4,336 | 1,553 | 6 | ~20 | 45 | LIVE pleno |
| 5. 2FA/Seguridad | 1,747 | 404 | 2 | 8 | 26 | LIVE pleno |
| 6. IA Multi-Provider | 1,677 | 451 | 2 | 4 | ~20 | LIVE pleno |
| 7. Infraestructura Transversal | 6,001 + 7,927 seeds | 0 | 2 | 6 | 0 | LIVE parcial |
| **TOTAL** | **23,759 + 7,927 seeds** | **4,681** | **40** | **~83** | **~171** | — |

Frontend core-related adicional: ~15,400 LOC (stores, hooks, API clients, guards, features/users + perfil + admin-global).
`backend/utils/` (1,543 LOC): infraestructura compartida, NO contada como L0.

---

## Orden de Inventario Profundo Aprobado

Orden definido por el usuario (2026-04-06). Principio: gaps primero, monstruo segundo, victorias después, sensible al final.

| Orden | Sub-bloque | LOC prod | Tests | Razón |
|-------|-----------|----------|-------|-------|
| 1ro | **3 — System Modules / Sidebar** | 1,996 | 0 | Sidebar = primera cosa que ve el usuario. Si está roto, nada existe. Tamaño manejable para calibrar el proceso. |
| 2do | **7 — Infraestructura Transversal** | 6,001 + 7,927 seeds | 0 | El monstruo. Lo atacamos segundo con experiencia del primero. Si esperamos al final, llegaremos agotados. |
| 3ro | **1 — Auth / JWT / Session** | 1,137 | 16 | Corto y pleno. Victoria rápida después del monstruo. |
| 4to | **5 — 2FA / Seguridad** | 1,747 | 26 | Similar a Auth, complementa el bloque de seguridad. |
| 5to | **6 — IA Multi-Provider** | 1,677 | ~20 | Mediano, moderno, relativamente limpio. |
| 6to | **4 — User / Cargo / Datos Maestros** | 4,336 | 45 | Mediano-grande, complejidad de modelos. Llegamos con experiencia. |
| 7mo | **2 — RBAC Dinámico** | 6,865 | 64 | El más grande con tests. Lo dejamos al final porque toca permisos (lo más sensible) y queremos llegar con máxima experiencia. |

**Regla:** No se avanza al siguiente sub-bloque sin aprobación explícita del usuario.
