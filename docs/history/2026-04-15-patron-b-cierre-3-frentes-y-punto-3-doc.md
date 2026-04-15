# Sesión 2026-04-15 — Cierre Patrón B (3 frentes) + Punto 3 documental

**Fecha:** 2026-04-15
**Ejecutor:** Claude Code (Opus)
**Alcance:** Tests LIVE (L0-L20) + documentación auth

## Logros principales

- **246 tests rescatados** en 3 commits aislados:
  - audit_system: 195 tests (commit `44c6922e`, CI #883 ✅)
  - ia: 35 tests (commit `9e88c01d`, CI #884 ✅)
  - portal_publico mi_equipo: 16 tests (commit `6762937c`, CI #885 ✅)
- **Punto 3 cerrado al 100%:** deuda documental AUTENTICACION.md (commit `af7a5a2f`, CI #886 ✅)

## Causa raíz Patrón B (sistemática)

DRF `APIClient` envía `Host: testserver` por defecto. `TenantMainMiddleware`
no resuelve a tenant → request cae a schema `public` → tablas TENANT_APPS no
existen → `ProgrammingError: relation does not exist`. Afectaba ~120+ tests
de views en 3 rutas.

**Fix raíz aplicado en root conftest.py:**
- `api_client` fixture setea `HTTP_HOST = tenant.test.com`
- Seed de 11 `SystemModule` LIVE para que `ModuleAccessMiddleware` no devuelva 403
- `admin_client` + `authenticated_client` heredan correctamente

## 5 sub-causas resueltas en audit_system

1. **ModuleAccessMiddleware sin SystemModule rows** — seed de 11 módulos LIVE en conftest.py raíz
2. **GranularActionPermission sin cargo RBAC** — `authenticated_client` → `admin_client` en test_views
3. **DefaultRouter(r'') captura rutas** — reordenar r'' al final en urls.py (tareas_recordatorios + config_alertas)
4. **Fixture other_user sin document_number** — campo unique+required en User model
5. **Payloads empresa_id vs FK empresa** — DRF `fields='__all__'` usa nombre del campo del modelo, no `_id`

## Principio operativo validado en 3 fixes consecutivos

- Menor privilegio: `authenticated_client` (no `admin_client`) donde solo se necesita `IsAuthenticated`
- Fixtures componibles (no tuplas desempaquetadas)
- `APIClient` + `force_authenticate` (no `django.test.Client` + JWT manual)
- Eliminación de fixtures locales, herencia desde root conftest
- DRY en docs: prosa + puntero al código fuente (no snippets duplicados)
- Commits separados por concern, CI verde en cada uno

## Estado actual del checklist 7 críticos

| Punto | Descripción | Estado |
|-------|-------------|--------|
| 1 | Aislamiento multi-tenant | ✅ VERDE |
| 2 | Modelo de datos / migraciones | ✅ VERDE |
| 3 | Auth + permisos | ✅ VERDE (código 2026-04-13 + doc cerrado hoy) |
| 4 | CI/CD | 🟡 AMARILLO (Fases 1+2 cerradas, Fase 3 pendiente) |
| 5 | Onboarding de tenant | ✅ VERDE |
| 6 | Runbook migraciones multi-tenant | 🟡 AMARILLO |
| 7 | Celery fairness | 🟡 AMARILLO |

**4 de 7 verdes.**

## Hallazgos abiertos

- **Runtime CI creciendo:** 56 min (2026-04-13) → 67-77 min (2026-04-15). Refuerza urgencia de paralelización en Fase 3.
- **36 errors residuales en mi_equipo:** causa raíz desconocida, probablemente patrón distinto al wrong-schema.
- **PR #75 dependabot npm picomatch:** pendiente cierre manual.

## Próxima sesión: candidatos

1. **Diagnóstico Punto 4 Fase 3** (brief prearmado abajo).
2. **36 errors residuales mi_equipo** (cierre Patrón B completo).
3. **Punto 6** (runbook migraciones) o **Punto 7** (Celery fairness).

## Brief prearmado — Diagnóstico Punto 4 Fase 3

```markdown
# BRIEF — Diagnóstico Punto 4 Fase 3 (preparación de ataque)

Objetivo: levantar la foto exacta del estado del Punto 4 después del cierre
de Fase 2 + los 246 tests rescatados hoy. NO ejecutar fix, NO modificar
pytest.ini, NO promover rutas. Solo diagnóstico para armar brief de ataque.

## Paso 1: Correr suite completa fresca

docker compose exec backend pytest --tb=no -q 2>&1

Parsear resultados por ruta. Reportar tabla:
| Ruta | Pass | Fail | Errors | Skipped | Estado Fase 2 | Estado hoy | Candidata |

Criterio candidata a promover:
- 0 fallos AND 0 errors → candidata directa
- <5 fallos triviales → candidata con fix previo
- >5 fallos → NO candidata, queda en cola

## Paso 2: Comparar con baseline Fase 2

Fase 2 reportó: 593 passed / 226 failed / 128 skipped.
Sesión 2026-04-15 rescató 246 tests.
Esperado: ~839 passed / ~X failed.
Reportar delta real vs esperado.

## Paso 3: Identificar rutas promovibles

De la tabla del Paso 1, listar rutas que pasaron de 🔴 a 🟢 o 🟡.
Para cada candidata, reportar qué falta (si algo) para llegar a 0 fallos.

## Paso 4: Calcular impacto de promoción

Si se promovieran TODAS las candidatas al gate bloqueante:
- ¿Cuántos tests protegerían contra regresión?
- ¿Cuánto sumaría al runtime del step bloqueante?
- ¿Se necesita paralelizar?

## Stop rules

- Si la suite completa tiene más fallos que el baseline Fase 2 → STOP,
  hay regresión, investigar antes de promover.
- Si alguna ruta verde del gate actual (core, gestion_documental,
  disenador_flujos, ejecucion) tiene fallos → STOP, regresión crítica.
```
