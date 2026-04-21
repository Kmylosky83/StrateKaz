# Sub-bloque 3 — System Modules / Sidebar

**Estado:** CONSOLIDADO (2026-04-07)
**Inventario:** `docs/inventory/L0-03-system-modules-sidebar.md`

---

## Qué hace

Controla qué módulos, tabs y secciones ve cada usuario en el sidebar de la
aplicación. Es la puerta de entrada visual al sistema RBAC.

**Endpoint principal:** `GET /api/core/system-modules/sidebar/`

**Flujo simplificado:**
1. `get_effective_user(request)` (soporta impersonación)
2. Superuser/superadmin → `_get_full_sidebar()` (todos los módulos habilitados)
3. Usuario normal → `compute_user_rbac(user)` combina 3 fuentes con lógica OR:
   - `CargoSectionAccess` (permisos del cargo)
   - `RolAdicionalSectionAccess` (roles adicionales vigentes)
   - `GroupSectionAccess` (grupos activos)
4. Cadena inversa: section_ids → tab_ids → module_ids → SystemModule.filter(is_enabled=True)
5. Agrupa por `SIDEBAR_LAYERS` (12 capas PHVA)
6. Capa con 1 módulo → render directo. Capa con 2+ → `is_category: True`

**Frontend:** `Sidebar.tsx` renderiza lo que el backend devuelve. No hace
filtrado propio. `usePermissions.ts` usa `permission_codes` para
mostrar/ocultar botones de acción.

---

## Qué consume

| Dependencia | De dónde | Para qué |
|-------------|----------|----------|
| `compute_user_rbac()` | `apps/core/utils/rbac.py` | Obtener section_ids + permission_codes del usuario |
| `get_effective_user()` | `apps/core/utils/impersonation.py` | Soportar impersonación |
| `SIDEBAR_LAYERS` | `apps/core/viewsets_config.py` (constante) | Agrupar módulos en capas PHVA |
| `ModuleAccessMiddleware` | `apps/core/middleware/module_access.py` | Validar módulos habilitados por request |

---

## Qué expone

| Endpoint | Método | Permiso | Descripción |
|----------|--------|---------|-------------|
| `/api/core/system-modules/sidebar/` | GET | IsAuthenticated | Sidebar filtrado por RBAC |
| `/api/core/system-modules/tree/` | GET | IsAuthenticated | Árbol completo (admin) |
| `/api/core/system-modules/{id}/toggle/` | POST | GranularActionPermission | Habilitar/deshabilitar módulo |

---

## Modelos clave

| Modelo | Tabla | Campos clave | Relación |
|--------|-------|-------------|----------|
| `SystemModule` | `core_system_module` | code, name, category, is_enabled, orden | tabs (reverse FK) |
| `ModuleTab` | `core_module_tab` | code, name, is_enabled, orden | module FK, sections (reverse FK) |
| `TabSection` | `core_tab_section` | code, name, is_enabled, orden | tab FK |
| `CargoSectionAccess` | `core_cargo_section_access` | can_view/create/edit/delete | cargo FK, section FK |

**Comportamiento de dominio importante:** al crear una `TabSection`, el
signal `rbac_signals` auto-propaga un `CargoSectionAccess` a los cargos
existentes. Este es comportamiento de producción, no un efecto secundario.
Cualquier test o refactor del RBAC debe respetarlo.

---

## Tests

**Archivo:** `apps/core/tests/test_sidebar.py` (5 tests)
**Base:** `BaseTenantTestCase` (schema real, datos reales, sin mocks)

| Test | Qué verifica |
|------|-------------|
| `test_sidebar_returns_modules_for_cargo` | Cargo con permisos ve módulos correctos |
| `test_sidebar_empty_for_user_without_cargo` | Sin cargo = sidebar vacío |
| `test_sidebar_superuser_sees_all` | Superuser ve todos los módulos habilitados |
| `test_sidebar_hides_disabled_module` | Módulo deshabilitado no aparece |
| `test_middleware_returns_403_for_disabled_module` | Middleware bloquea acceso a módulo deshabilitado |

---

## Archivos del sub-bloque

```
backend/apps/core/
  viewsets_config.py          # SystemModuleViewSet + SIDEBAR_LAYERS
  serializers_config.py       # Serializers del sidebar/tree
  models/models_system_modules.py  # SystemModule, ModuleTab, TabSection
  models/models_rbac_adicionales.py  # CargoSectionAccess (entre otros)
  utils/rbac.py               # compute_user_rbac()
  middleware/module_access.py  # ModuleAccessMiddleware
  tests/test_sidebar.py       # 5 tests del sub-bloque
```
