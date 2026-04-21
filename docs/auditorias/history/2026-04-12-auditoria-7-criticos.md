# Auditoría de los 7 puntos críticos — StrateKaz

**Fecha:** 2026-04-12
**Ejecutor:** Claude Code
**Alcance:** Módulos LIVE (L0-L20) únicamente

## Resumen ejecutivo

- **Verdes:** 2 (Puntos 1 y 5)
- **Amarillos:** 5 (Puntos 2, 3, 4, 6, 7)
- **Rojos:** 0
- **Bloqueante real:** solo Punto 4 (CI/CD con falsa confianza)

## Resultados por punto

### Punto 1 — Aislamiento de tenants: VERDE

TenantMainMiddleware primero en stack (`base.py:269`). X-Tenant-ID validado
contra JWT + TenantUserAccess en cada request (`authentication.py:184-241`).
Storage y cache segregados por schema (`storage.py:130-201`, `cache.py:9-26`).
Raw SQL usa `psycopg2.sql.Identifier`.

Hardening pendiente menor: superadmins bypass TenantUserAccess (intencional),
admin sin restricción IP. No bloqueante.

### Punto 2 — Modelo de datos base: AMARILLO

Dos cadenas de herencia coexistiendo:
- `TenantModel` (30 modelos LIVE): `is_deleted=True` para borrado
- `BaseCompanyModel` (215 modelos total): `is_active=False` para borrado
- 10 modelos LIVE sin base class (8 en gestion_documental)

**CERRADO para gestion_documental** en commit `addc9ce4`:
8 modelos migrados a BaseCompanyModel, 32/32 tests pasan.

Pendiente: 30 modelos LIVE con TenantModel (27 en workflow_engine) +
2 auxiliares sin base class. Estimado: 2 sesiones.

### Punto 3 — Auth + permisos: AMARILLO

Dos endpoints de login coexistiendo:
- `/api/auth/login/` legacy (203 LOC, `core/views/auth_views.py:36-204`)
- `/api/tenant/auth/login/` moderno (925 LOC, `tenant/auth_views.py:61-165`)

Frontend usa SOLO el moderno (`auth.api.ts:24-26`). RBAC dinámico sólido
(`CargoSectionAccess` como fuente única). Password recovery end-to-end funcional.

Decisión tomada: eliminar endpoint legacy (sin consumidores externos).

### Punto 4 — CI/CD funcional: AMARILLO (BLOQUEANTE)

Solo 2 de 84+ sub-apps bloquean CI (`test_sidebar`, `test_base`). 6 steps con
`continue-on-error: true` esconden fallos reales (pytest, Black, Ruff, pip-audit,
npm-audit, Vitest). CI da falsa confianza.

Deploy script (`scripts/deploy.sh`) es single-command y completo. Rollback manual
via `git reset --hard` + `pg_restore`.

### Punto 5 — Onboarding de tenant: VERDE

Phase A atómica con `transaction.atomic()` + advisory locks PostgreSQL
(`tenant_lifecycle_service.py:108-206`). Phase B con idempotencia H22
(`tenant_lifecycle_service.py:326-338`). Cleanup automático de schemas zombie
cada 30 min (`tasks.py:630-655`). Integridad verificada cada 30 min con reporte
a Sentry (`tasks.py:662-751`). Tests de atomicidad e idempotencia en
`services/tests/`.

### Punto 6 — Migraciones de datos multi-tenant: AMARILLO

No hay estrategia escrita. No hay batch runner custom. No hay canary testing.
No hay runbook de emergencia. Solo 2 RunPython en todo el codebase. Hoy funciona
con 2-3 tenants; bomba de tiempo con 20+ tenants.

### Punto 7 — Background tasks con aislamiento: AMARILLO

10 colas Celery + 17 tareas programadas activas + 14 archivos de tasks (~40+
tareas). Patrón de `schema_context` consistente pero manual (cada dev debe
recordarlo). No hay base task class con tenant automático. No hay fairness
per-tenant. Reintentos preservan contexto (schema_name como argumento).

## Cerrado en esta sesión

| Punto | Módulo | Commit | Resultado |
|-------|--------|--------|-----------|
| 2 | gestion_documental (8 modelos L15) | `addc9ce4` | 32/32 tests pass |

## Pendiente (orden acordado)

1. Punto 2 — workflow_engine (27 modelos, RunSQL por datos reales)
2. Punto 2 — ia + core + auxiliares (sesión chica)
3. Punto 3 — Auth cleanup (eliminar legacy)
4. Punto 4 — CI/CD (expandir test gate, eliminar continue-on-error)
5. Punto 6 — Migraciones multi-tenant (runbook + canary)
6. Punto 7 — Background tasks (fairness per-tenant + base task class)

## Decisiones de producto registradas

- **BaseCompanyModel es el estándar único.** TenantModel queda deprecado.
- **on_delete=PROTECT en created_by** para campos de auditoría (ISO 9001,
  Ley 527/1999, Decreto 1072). Aplicado en gestion_documental.
- **Migraciones proporcionales al riesgo:** RunSQL con datos reales,
  AlterField sin datos reales.
