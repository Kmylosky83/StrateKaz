# Testing Debt — apps/core/tests/

Triage realizado: 2026-04-07
Contexto: Refundación de testing backend (ver `docs/refundacion-testing-backend.md`)

Todos los archivos listados abajo están marcados con `pytestmark = pytest.mark.skip()`
a nivel de módulo (excepto test_health.py que tiene skip solo en 1 test).
La migración se hace sub-bloque por sub-bloque a medida que avancen los inventarios L0-L20.

---

## test_health.py

**Categoría:** LÓGICA_ROTA (parcial)
**Síntoma:** `test_deep_health_check_accessible` falla porque `/api/health/deep/` requiere Redis activo
**Tests totales:** 10 | **Pasando:** 9 | **Fallando:** 1 (skip individual)
**Causa raíz:** el deep health check consulta servicios externos (Redis, Celery) que no están disponibles en el entorno de test de pytest. Los otros 9 tests pasan porque solo verifican el endpoint básico `/api/health/`.
**Migración recomendada:** no necesita migración a BaseTenantTestCase (no toca TENANT_APPS). Solo arreglar el test del deep health para que tolere Redis ausente.
**Prioridad:** baja
**Acción:** skip solo en `test_deep_health_check_accessible`, resto activo

---

## test_fields.py

**Categoría:** LÓGICA_ROTA
**Síntoma:** `test_datetime_object` falla — `NaiveDateField` cambió su comportamiento
**Tests totales:** 2 | **Pasando:** 1 | **Fallando:** 1
**Causa raíz:** el test asume que `NaiveDateField` acepta objetos `datetime` y los convierte a `date`, pero el field actual rechaza o procesa distinto. El test no se actualizó cuando se modificó el field.
**Migración recomendada:** no necesita BaseTenantTestCase (son tests unitarios puros). Actualizar las aserciones del test para reflejar el comportamiento actual del field.
**Prioridad:** baja (2 tests)

---

## test_auth.py

**Categoría:** LÓGICA_ROTA
**Síntoma:** 5 tests fallan por asserts incorrectos (ej: `assert 400 == 401`)
**Tests totales:** 16 | **Pasando:** 11 | **Fallando:** 5
**Causa raíz:** los tests esperan status codes que no coinciden con la implementación actual del endpoint de login/refresh. Probable cambio en HybridJWTAuthentication que ahora retorna 400 en vez de 401 para credenciales inválidas. Los 11 tests que pasan son los de validación de formato (campos faltantes, JSON inválido, etc).
**Migración recomendada:** corregir los 5 asserts de status code. No necesita BaseTenantTestCase porque los tests de auth crean usuarios en public schema via `db` fixture de pytest-django y el endpoint `/api/auth/login/` funciona en public.
**Prioridad:** media (auth es crítico)

---

## test_cargo.py

**Categoría:** TENANT_SCHEMA
**Síntoma:** `relation "organizacion_area" does not exist` en todas las fixtures
**Tests totales:** 32 | **Pasando:** 0 | **Errores:** 32
**Causa raíz:** las fixtures crean Area/Cargo usando la `db` fixture de pytest-django que opera en schema `public`. Las tablas `organizacion_area` y `core_cargo` son TENANT_APPS y solo existen en schemas de tenant.
**Migración recomendada:** reescribir con BaseTenantTestCase. Los helpers `create_cargo` y `create_module_with_section` ya cubren los casos más comunes.
**Prioridad:** alta (32 tests, modelo Cargo es central)

---

## test_rbac.py

**Categoría:** TENANT_SCHEMA + API_OBSOLETA
**Síntoma:** `TypeError: Permiso() got unexpected keyword arguments` + relation errors
**Tests totales:** 38 | **Pasando:** 0 | **Errores:** 38
**Causa raíz:** doble problema: (1) las fixtures crean objetos en schema public donde las tablas no existen, y (2) las fixtures usan kwargs del modelo `Permiso` que fueron renombrados o eliminados en el refactor RBAC v4.0 (se migró de `Permiso` legacy a `CargoSectionAccess`).
**Migración recomendada:** reescribir desde cero con BaseTenantTestCase. La mayoría de estos tests verifican el sistema RBAC legacy que ya no existe — reemplazar por tests del nuevo sistema basado en `CargoSectionAccess` + `compute_user_rbac()`.
**Prioridad:** alta (38 tests, RBAC es infraestructura crítica)

---

## test_permissions_api.py

**Categoría:** TENANT_SCHEMA
**Síntoma:** relation errors en fixtures que crean User/Cargo/Permiso
**Tests totales:** 27 | **Pasando:** 2 | **Fallando:** 1 | **Errores:** 24
**Causa raíz:** fixtures crean objetos de TENANT_APPS en schema public. Los 2 tests que pasan son los que solo verifican que un endpoint retorna 401 sin autenticación (no tocan la DB de tenant).
**Migración recomendada:** reescribir con BaseTenantTestCase + `authenticate_as()`.
**Prioridad:** media (27 tests, pero muchos son variaciones del mismo patrón)

---

## test_two_factor.py

**Categoría:** TENANT_SCHEMA
**Síntoma:** relation errors al crear User en schema public
**Tests totales:** 15 | **Pasando:** 0 | **Errores:** 15
**Causa raíz:** fixtures crean `User.objects.create_user()` sin setup de tenant. La tabla `core_user` es TENANT_APP y no existe en public.
**Migración recomendada:** reescribir con BaseTenantTestCase + `create_user()` + `authenticate_as()`.
**Prioridad:** media (15 tests, 2FA es feature de seguridad)

---

## Resumen de migración

| Archivo | Tests | Categoría | Esfuerzo estimado | Prioridad |
|---------|-------|-----------|-------------------|-----------|
| test_health.py | 10 | LÓGICA_ROTA (1 test) | 0.5h | Baja |
| test_fields.py | 2 | LÓGICA_ROTA | 0.5h | Baja |
| test_auth.py | 16 | LÓGICA_ROTA | 1h | Media |
| test_cargo.py | 32 | TENANT_SCHEMA | 3h | Alta |
| test_rbac.py | 38 | TENANT_SCHEMA + API_OBSOLETA | 4h | Alta |
| test_permissions_api.py | 27 | TENANT_SCHEMA | 2h | Media |
| test_two_factor.py | 15 | TENANT_SCHEMA | 2h | Media |
| **Total** | **140** | | **~13h** | |

Orden de migración recomendado: test_cargo → test_rbac → test_auth → test_two_factor → test_permissions_api → test_fields → test_health
