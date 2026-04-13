# Punto 4 — Fase 2: Clasificación de 21 rutas LIVE por estado de fallos

**Fecha:** 2026-04-13
**Sesión:** Punto 4 Fase 2 — Clasificación de fallos por ruta LIVE
**Antecedente:** Commit `aadceb6c` (Fase 1) expandió el step pytest informativo
de 1 a 21 rutas LIVE vía `pytest.ini` como single source of truth.

## Criterio de promoción al gate bloqueante

| Veredicto | Condición | Significado |
|-----------|-----------|-------------|
| 🟢 LISTA | 0 fallos | Puede promoverse a bloqueante |
| 🟡 CERCA | 1-5 fallos | Candidata a promoción con trabajo menor |
| 🔴 LEJOS | 6+ fallos | Requiere sesión dedicada |

Warnings son permitidos y se anotan como deuda separada (no bloquean promoción).

## Metodología

Suite completa ejecutada en una sola corrida (`pytest -v --tb=no`) para evitar
el Patrón B documentado (infra incompleta al correr subsets aislados). Los
resultados se parsearon por prefijo de ruta para clasificar cada test.

**Números globales:** 593 passed / 226 failed / 128 skipped / 8 warnings en
5993s (1h 39m 53s). Suma por ruta = 593/226/128 (coincidencia exacta).

## Tabla consolidada

### 🟢 LISTA (0 fallos) — 7 rutas

| # | Ruta | Passed | Failed | Skipped | Veredicto |
|---|------|--------|--------|---------|-----------|
| 1 | `apps/core` | 23 | 0 | 127 | 🟢 LISTA |
| 2 | `apps/gestion_estrategica/gestion_documental` | 32 | 0 | 0 | 🟢 LISTA |
| 3 | `apps/workflow_engine/disenador_flujos` | 28 | 0 | 0 | 🟢 LISTA |
| 4 | `apps/workflow_engine/ejecucion` | 29 | 0 | 0 | 🟢 LISTA |
| 5 | `apps/gestion_estrategica/identidad` | 0 | 0 | 0 | 🟢 LISTA (*) |
| 6 | `apps/gestion_estrategica/contexto` | 0 | 0 | 0 | 🟢 LISTA (*) |
| 7 | `apps/workflow_engine/monitoreo` | 0 | 0 | 0 | 🟢 LISTA (*) |

(*) Sin archivos de test. Verde técnico (0 fallos) pero sin cobertura real.

### 🟡 CERCA (1-5 fallos) — 1 ruta

| # | Ruta | Passed | Failed | Skipped | Veredicto |
|---|------|--------|--------|---------|-----------|
| 8 | `tests` (raíz) | 6 | 1 | 0 | 🟡 CERCA |

### 🔴 LEJOS (6+ fallos) — 10 rutas

| # | Ruta | Passed | Failed | Skipped | Veredicto |
|---|------|--------|--------|---------|-----------|
| 9 | `apps/tenant` | 84 | 8 | 1 | 🔴 LEJOS |
| 10 | `apps/gestion_estrategica/encuestas` | 30 | 12 | 0 | 🔴 LEJOS |
| 11 | `apps/gestion_estrategica/organizacion` | 16 | 12 | 0 | 🔴 LEJOS |
| 12 | `apps/analytics/config_indicadores` | 25 | 13 | 0 | 🔴 LEJOS |
| 13 | `apps/audit_system/config_alertas` | 24 | 15 | 0 | 🔴 LEJOS |
| 14 | `apps/audit_system/centro_notificaciones` | 26 | 16 | 0 | 🔴 LEJOS |
| 15 | `apps/audit_system/tareas_recordatorios` | 28 | 24 | 0 | 🔴 LEJOS |
| 16 | `apps/gestion_estrategica/configuracion` | 52 | 27 | 0 | 🔴 LEJOS |
| 17 | `apps/ia` | 6 | 29 | 0 | 🔴 LEJOS |
| 18 | `apps/audit_system/logs_sistema` | 30 | 32 | 0 | 🔴 LEJOS |
| 19 | `apps/mi_equipo` | 154 | 37 | 0 | 🔴 LEJOS |

### Rutas sin tests (declaradas en pytest.ini pero sin archivos de test)

| # | Ruta | Archivos test | Nota |
|---|------|---------------|------|
| 20 | `apps/workflow_engine/firma_digital` | 0 | Sin test files |
| 21 | `apps/analytics/exportacion_integracion` | 0 | Sin test files |

`apps/workflow_engine/monitoreo` tiene `tests.py` pero es un stub vacío
(solo `from django.test import TestCase`). Se agrupa con las anteriores.

## Resumen numérico

| Categoría | Rutas | Fallos |
|-----------|-------|--------|
| 🟢 LISTA | 4 reales + 3 sin tests | 0 |
| 🟡 CERCA | 1 | 1 |
| 🔴 LEJOS | 10 | 225 |
| Sin tests | 3 (incluidas en 🟢) | 0 |
| **Total** | **21** | **226** |

Suma de fallos por ruta: 226. Diferencia con CI Fase 1 (225): +1.
Dentro del margen esperado (< 20). El test adicional es
`test_consistent_environment` en tenant que depende del estado del schema
local.

## Hallazgos

1. **127 skipped en `apps/core`:** Son los 127 tests legacy documentados en
   `docs/testing-debt.md`. No son fallos — están skipped con `@pytest.mark.skip`
   deliberadamente. La ruta es 🟢 (0 fallos) pero tiene deuda masiva de
   tests pendientes de migración.

2. **3 rutas sin archivos de test:** `identidad`, `contexto`, `firma_digital`,
   `exportacion_integracion` y `monitoreo` (stub) están declaradas en pytest.ini
   pero no tienen tests reales. Son 🟢 técnicamente pero carecen de cobertura.

3. **`apps/ia` tiene ratio muy desfavorable:** 6 passed vs 29 failed (83% fallo).
   Es la ruta con peor proporción de las 21.

4. **4 sub-apps de `audit_system` acumulan 87 fallos:** logs_sistema (32) +
   tareas_recordatorios (24) + centro_notificaciones (16) + config_alertas (15).
   Probablemente comparten un patrón común de fallo (Patrón B documentado:
   `core_tab_section` missing).

5. **`apps/mi_equipo` tiene el mayor volumen absoluto:** 37 fallos pero también
   154 passing (80% pass rate). Es la ruta más grande.

6. **Discrepancia menor:** 226 fallos locales vs 225 en CI (Fase 1). Diferencia
   de 1 test (`test_consistent_environment`) que depende del estado del entorno.
   No es preocupante.

7. **Tiempo de ejecución:** 1h 39m 53s local (Docker). CI reportó 56m 26s.
   La diferencia se atribuye al entorno Docker en Windows vs runner Ubuntu de CI.

## Próximos pasos sugeridos

Sesiones siguientes: atacar rutas 🟡 en orden de menos a más fallos, luego 🔴.
