# Sub-bloque 7 — Infraestructura Transversal

**Estado:** CONSOLIDADO (2026-04-07)
**Inventario:** `docs/inventory/L0-07-infraestructura-transversal.md`

---

## Qué hace

Provee la base heredable y los servicios transversales que toda la cascada
L0→L90 consume: modelos abstractos, managers de soft-delete, validadores,
permisos granulares, signals de propagación RBAC/lifecycle, tareas Celery
de mantenimiento, y el sistema de onboarding.

**No es un feature en sí** — es el cimiento sobre el que se construyen todos
los módulos del sistema.

---

## Qué consume

| Dependencia | De dónde | Para qué |
|-------------|----------|----------|
| `EmpresaConfig` | L10 (Configuración) | FK en BaseCompanyModel, `get_tenant_empresa()` |
| `User`, `Cargo` | Sub-bloque 4 (User/Cargo) | Signals del lifecycle, propagación RBAC |
| `CargoSectionAccess`, `TabSection` | Sub-bloque 2 (RBAC) | Signals de propagación de permisos |
| `TenantUser`, `Tenant` | C0 (Tenant) | Signal `auto_create_tenant_user` |
| `VacanteActiva` | L20 (Mi Equipo) | Signal `auto_fill_vacancy` (import dinámico, protegido) |

---

## Qué expone

| Símbolo | Consumidores | Qué hace |
|---------|-------------|----------|
| `BaseCompanyModel` | 57 archivos | Modelo base con timestamps + audit + soft-delete + empresa FK |
| `get_tenant_empresa()` | 68 archivos | Resuelve EmpresaConfig del schema actual |
| `GranularActionPermission` | 29 archivos | Permiso RBAC granular por sección (can_view/create/edit/delete) |
| Validadores (`core.validators`) | 55 archivos | 22 clases de validación (unicidad, formato, colombianos, fechas) |
| `OnboardingService` | onboarding views + tasks | Calcula perfil ponderado + pasos por tipo de usuario |

---

## Componentes principales

| Componente | LOC | Resumen |
|-----------|-----|---------|
| `base_models/` | 608 | 6 abstract models + 4 managers + `get_tenant_empresa()` |
| `serializers_mixins.py` | 1,419 | 22 mixins (**infraestructura adelantada**, 0 consumidores) |
| `signals/` | 959 | 11 signals: propagación RBAC, cache, lifecycle de usuario |
| `tasks.py` | ~1,400 | 12 tareas Celery (6 periódicas + 6 on-demand) |
| `validators.py` | 1,378 | 22 validadores + 8 helpers |
| `cache_utils.py` | 329 | Decoradores Redis (**infraestructura adelantada**, 0 consumidores) |
| `permissions.py` | 908 | 15 clases de permiso + 5 decoradores |
| `onboarding` | 1,626 | Service + views + 2 modelos (UserOnboarding, UserPreferences) |
| `management/commands/` | 7,927 | 26 commands (seeds, migraciones, health check) |

---

## Comportamiento de dominio importante

1. **Signal `propagate_section_to_cargos`:** Al crear una `TabSection`, se
   auto-crean `CargoSectionAccess` para todos los cargos activos con permisos
   según su nivel jerárquico. Este es comportamiento de producción, no un
   efecto secundario. Cualquier test que cree `TabSection` debe esperarlo.

2. **Signal `auto_create_tenant_user`:** Al crear un `User` en un tenant, se
   crea automáticamente `TenantUser` + `TenantUserAccess` en schema public.
   Sin esto, el usuario no puede hacer login.

3. **Signal `auto_create_user_onboarding`:** Al crear un `User`, se crea
   `UserOnboarding` con tipo resuelto según cargo/rol (`_resolve_onboarding_type`).

4. **Signal `propagate_nivel_firma_on_cargo_change`:** Al cambiar
   `nivel_jerarquico` de un Cargo, se propaga `nivel_firma` a todos los
   usuarios de ese cargo (que no tengan `nivel_firma_manual=True`).

5. **`get_tenant_empresa(auto_create=True)`** crea EmpresaConfig si no existe.
   Esto previene errores 400 en tenants nuevos pero puede crear datos
   inesperados en tests si no se controla.

---

## Tests

**Archivo:** `apps/core/tests/test_infraestructura.py` (10 tests)
**Base:** `BaseTenantTestCase` (schema real, datos reales, sin mocks)

| Test | Qué verifica |
|------|-------------|
| `test_returns_empresa_when_exists` | `get_tenant_empresa()` retorna empresa existente |
| `test_auto_creates_when_missing` | `get_tenant_empresa(auto_create=True)` crea empresa |
| `test_returns_none_when_missing_and_no_autocreate` | `get_tenant_empresa(auto_create=False)` retorna None |
| `test_creating_section_propagates_to_existing_cargo` | Signal crea CargoSectionAccess al crear TabSection |
| `test_creating_user_creates_tenant_user` | Signal crea TenantUser en public schema |
| `test_creating_user_creates_onboarding` | Signal crea UserOnboarding con tipo 'empleado' |
| `test_superuser_gets_admin_onboarding_type` | Superuser recibe tipo 'admin' |
| `test_cargo_nivel_change_propagates_to_users` | Cambiar nivel_jerarquico propaga nivel_firma |
| `test_critical_tasks_importable` | Tareas Celery Tier 1 son importables |
| `test_deleted_stubs_not_importable` | Stubs eliminados ya no existen |

---

## Archivos del sub-bloque

```
backend/apps/core/
  base_models/                    # Abstract models + managers + get_tenant_empresa
    __init__.py
    base.py
    managers.py
    mixins.py
  serializers_mixins.py           # 22 mixins (infraestructura adelantada)
  signals/
    __init__.py
    rbac_signals.py               # Propagación de permisos al crear Section/Cargo
    rbac_cache_signals.py         # Invalidación de cache RBAC
    user_lifecycle_signals.py     # Auto-crear TenantUser + llenar vacante + email
  tasks.py                        # 12 tareas Celery
  validators.py                   # 22 validadores + 8 helpers
  cache_utils.py                  # Decoradores Redis (infraestructura adelantada)
  permissions.py                  # 15 clases de permiso + 5 decoradores
  services/onboarding_service.py  # OnboardingService
  views/onboarding_views.py       # 3 endpoints de onboarding
  models/models_onboarding.py     # UserOnboarding + signal auto-create
  models/models_user_preferences.py  # UserPreferences
  management/commands/            # 26 management commands (seeds, migraciones, health)
  tests/test_infraestructura.py   # 10 tests del sub-bloque
```
