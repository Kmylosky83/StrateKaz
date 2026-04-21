# 2026-04-13 — Punto 4 Fase 1: CI/CD test gate (visibilidad)

**Commit:** `aadceb6c` pusheado a `main` (CI #877 + CodeQL #893 disparados).

**Objetivo:** Expandir el step informativo de pytest en CI de 1 ruta hardcodeada
(`apps/core/tests/`) a las 21 rutas LIVE definidas en `pytest.ini`. Fase 1 =
solo visibilidad, sin cambiar ningun gate bloqueante.

## Hipotesis inicial vs realidad

**Hipotesis:** El CI tiene 6 `continue-on-error` que esconden fallos. Solo hay
que destaparlos y decidir cuales promover a bloqueante.

**Realidad:** El problema era mas profundo. El CI solo testeaba `apps/core/tests/`
(1 de 21 rutas LIVE). El 95% del perimetro LIVE no tenia ningun gate de test.
Los 6 `continue-on-error` eran una capa de opacidad, pero la capa fundamental
era que las 20 rutas restantes ni siquiera se ejecutaban.

## Decision de metodo: Camino C (triage primero)

Se consideraron 3 caminos:

- **Camino A (gate inmediato):** Promover pytest a bloqueante directamente.
  Rechazado: rompe el pipeline con 225 fallos conocidos, bloquea todos los
  deployments. Irresponsable sin triage previo.
- **Camino B (fix masivo):** Arreglar los 225 fallos primero. Rechazado:
  sesion enorme sin garantia de que todos los fallos son arreglables hoy.
- **Camino C (triage primero):** Expandir cobertura como informativo, medir
  numeros reales en CI, LUEGO clasificar y promover progresivamente.
  Aprobado por ser el mas profesional y seguro.

Camilo corrigio en vivo la recomendacion inicial de Claude Web (que tendia
hacia Camino A) con una sola pregunta: "cual es la accion mas profesional
y segura". Validacion del principio de que el dueno de producto define la
estrategia, Code ejecuta la tactica.

## Diff aplicado

```diff
-      - name: Run legacy pytest suite (informativo, no bloquea)
+      - name: Run LIVE pytest suite (informativo, 21 rutas via pytest.ini)
         working-directory: ./backend
         continue-on-error: true
         run: |
-          pytest apps/core/tests/ --ignore=...test_sidebar.py --ignore=...test_base.py --no-cov --tb=no -q 2>&1 || true
+          pytest --ignore=apps/core/tests/test_sidebar.py --ignore=apps/core/tests/test_base.py --no-cov --tb=no -q
```

Cambios:
1. Eliminado el path hardcodeado `apps/core/tests/` — pytest auto-descubre
   las 21 rutas desde `pytest.ini` (single source of truth)
2. Eliminado `2>&1 || true` — doble-enmascaramiento redundante con
   `continue-on-error`. Saboteaba el objetivo de visibilidad al hacer que
   el step apareciera verde en vez de amarillo warning
3. `continue-on-error: true` explícito sin cambio

## Resultados CI #877

| Job | Estado | Tiempo |
|-----|--------|--------|
| Frontend - Build & Type Check | ✅ Verde | 1m 57s |
| Backend - Django Tests | ✅ Verde | 1h 6m |
| Quality Summary | ✅ Verde | 4s |
| **Total pipeline** | **✅ Verde** | **1h 7m 7s** |

### Steps del Backend job

| Step | Tiempo | Estado |
|------|--------|--------|
| Run migrated tests (BLOQUEANTE) | 5m 6s | ✅ Passed |
| Run LIVE pytest suite (informativo, 21 rutas) | 56m 26s | ⚠️ Exit 1 (continue-on-error) |
| Black | 1m 10s | ⚠️ Exit 1 (continue-on-error) |
| Ruff | 0s | ⚠️ Exit 1 (continue-on-error) |
| pip-audit | 4s | ⚠️ Exit 1 (continue-on-error) |

### Resultados pytest LIVE

```
588 passed / 225 failed / 128 skipped / 67 warnings in 3380.25s (56:20)
```

## Validacion entorno CI vs local

| Metrica | Local Docker (2026-04-12) | CI GitHub Actions | Delta |
|---------|--------------------------|-------------------|-------|
| Passed | 589 | 588 | -1 |
| Failed | 230 | 225 | -5 |
| Skipped | 144 | 128 | -16 |
| Runtime | ~90 min | 56 min | CI mas rapido |

Las diferencias menores confirman que los entornos son fieles y la suite
es estable (no flaky). Los 225 fallos son reales y reproducibles.

## Hallazgos

### H-CI-1: Runtime caro (56 min por push)
56 minutos de pytest LIVE por push es caro en minutos de GitHub Actions.
Para Fase 2, considerar paralelizacion (matrix por grupo de rutas) antes
de promover rutas a bloqueante. Alternativa: cache de DB test schema.

### H-CI-2: UI GitHub Actions fragil para leer logs
Scrappear la UI de GitHub Actions con Chrome extension es fragil: logs
truncados, scroll roto en pages largas, steps que no renderizan. Las
proximas sesiones que necesiten leer logs de CI deben usar la API REST
de GitHub Actions (`/repos/{owner}/{repo}/actions/jobs/{job_id}/logs`)
o instalar `gh` CLI en el entorno Windows.

### H-CI-3: Dependabot 42 vulnerabilidades pre-existentes
Al pushear, GitHub reporto 42 vulnerabilidades (3 critical, 13 high,
22 moderate, 4 low). Confirmado pre-existente, fuera del scope del
Punto 4. Ya estaba en el backlog de pendientes fuera de cola tecnica.

### H-CI-4: Node.js 20 deprecation en GitHub Actions
Las actions `checkout@v4`, `cache@v4`, `setup-python@v5`,
`setup-node@v4`, `upload-artifact@v4` usan Node 20. Sera forzado a
Node 24 el 2026-06-02 y removido el 2026-09-16. Actualizar antes
de junio.

## Diagnostico previo (inventario empirico completo)

Antes de aplicar el cambio, se hizo un inventario completo de los
3 workflows de CI. Resultados clave del diagnostico local:

| Herramienta | Fallos totales | En codigo LIVE | En codigo no-LIVE |
|-------------|----------------|----------------|-------------------|
| Ruff | 863 | 436 (50.5%) | 427 |
| Black | 1029 archivos | 526 (51.1%) | 503 |
| Vitest | 2 tests | 0 | 2 (hseq no-LIVE) |

Estos NO se tocaron en esta sesion — son scope de sesiones futuras.

## Proximos pasos (Fase 2)

1. Clasificar los 225 fallos por ruta LIVE (de las 21) para identificar:
   - Rutas 100% verdes → candidatas a promover a bloqueante inmediato
   - Rutas con fallos arreglables (Patron B) → arreglar y promover
   - Rutas con deuda profunda → quedan informativas hasta sesion dedicada
2. Evaluar paralelizacion del step pytest (matrix) para reducir runtime
3. Evaluar lint incremental (Ruff/Black solo en archivos cambiados)

## Lecciones registradas

### Leccion 1: Dueno de producto como corrector de estrategia
Camilo corrigio en vivo una recomendacion apresurada de Claude Web
(Camino A = gate inmediato) con una sola pregunta: "cual es la accion
mas profesional y segura". Esto redirigio la sesion hacia Camino C
(triage primero), que resulto ser el correcto. Validacion del principio:
el dueno de producto define la estrategia, Code ejecuta la tactica.

### Leccion 2: Guardian tecnico, no ejecutor ciego
Code propuso eliminar el `|| true` adyacente al cambio principal. Lo
nombro como hallazgo, explico que saboteaba directamente el objetivo de
visibilidad (enmascaraba el exit code real), y lo elimino como parte del
diff aprobado. Buen ejemplo de "guardian tecnico" — identifica lo que
afecta la mision y actua, pero siempre explica y espera aprobacion.
