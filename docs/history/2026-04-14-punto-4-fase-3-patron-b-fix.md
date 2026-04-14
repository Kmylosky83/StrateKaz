# Punto 4 Fase 3 — Fix Patrón B (pytest settings override)

**Fecha:** 2026-04-14
**Sesión:** Consolidación CI/CD — fix causa raíz tests locales Docker

---

## Hipótesis inicial (refutada)

El brief asumía que ~141 fallos de Patrón B se debían a que
`migrate_schemas` no completaba al correr subsets de pytest. La tabla
faltante variaba: `core_tab_section` (audit_system), `core_user` (ia).

**Diagnóstico real:** el error nunca llegaba a `migrate_schemas`.
Todos los subsets fallaban con:

```
psycopg2.errors.DuplicateDatabase: database "test_stratekaz" already exists
```

## Causa raíz real

**Cadena de 3 problemas:**

1. **Docker env var sobreescribe pytest.ini** — `docker-compose.yml`
   (líneas 78/121/164) define `DJANGO_SETTINGS_MODULE=config.settings.development`.
   pytest-django respeta la precedencia: env var > pytest.ini. Por tanto,
   pytest usaba development settings localmente.

2. **testing.py lee DB_NAME del env** — `config('DB_NAME', default='stratekaz_test')`
   resuelve a `stratekaz` (del `.env`), haciendo que el test DB sea
   `test_stratekaz` (mismo nombre que produciría development settings).

3. **DB stale con conexión zombie** — Una ejecución anterior de pytest
   crasheó dejando `test_stratekaz` con una conexión `idle in transaction`
   (creando índice en `mi_equipo_ejecucion_integral`). Esto impedía tanto
   CREATE como DROP de la DB.

**¿Por qué CI no tenía este problema?** CI crea su propio `.env` con
`DJANGO_SETTINGS_MODULE=config.settings.testing` y `DB_NAME=test_db`.
No hay Docker, no hay env var en conflicto.

## Fix aplicado

**1 archivo, 1 línea:**

```ini
# pytest.ini — addopts
addopts =
    --ds=config.settings.testing    # ← NUEVO: máxima prioridad en pytest-django
    --verbose
    --strict-markers
    --tb=short
```

`--ds` tiene la prioridad más alta en pytest-django (por encima de env vars
y de `DJANGO_SETTINGS_MODULE` en pytest.ini). Esto garantiza que pytest
siempre use testing settings, sin importar qué configure Docker.

**Cleanup one-time:** se eliminó la DB stale `test_stratekaz` y la conexión
zombie manualmente con `pg_terminate_backend` + `DROP DATABASE`.

## Resultados antes/después

### Rutas afectadas (subsets aislados con Docker local)

| Ruta | Antes (p/f/e) | Después (p/f/e) | Δ passed |
|------|--------------|-----------------|----------|
| audit_system | 0 / 0 / 195 | 108 / 87 / 0 | **+108** |
| mi_equipo | 0 / 0 / 191 | 118 / 37 / 36 | **+118** |
| ia | 0 / 0 / 35 | 6 / 29 / 0 | **+6** |
| **Subtotal** | **0 / 0 / 421** | **232 / 153 / 36** | **+232** |

### Gate bloqueante (no regresión)

| Ruta | Antes | Después |
|------|-------|---------|
| core + gestion_documental + disenador_flujos + ejecucion | 112p / 127s | 112p / 127s |

**Cero regresiones.**

## Fallos residuales (fuera de esta sesión)

Los 153 failed + 36 errors restantes son fallos reales de tests (no infra):
- **audit_system (87 failed):** Todos en `test_views.py` — probablemente
  URLs hardcodeadas o fixtures incompletas (Patrón A residual).
- **mi_equipo (37 failed + 36 errors):** Incluye 12 residuales conocidos
  (11 de portal 404 + 1 de modelo). Los errors probablemente son fixtures
  faltantes.
- **ia (29 failed):** Tests legacy que asumen estado no creado por fixtures.

Estos se atacan en sesiones posteriores (triage por patrón).

## Hallazgos nuevos

**H23 — testing.py lee DB_NAME del env (baja prioridad)**
`testing.py` línea 28: `config('DB_NAME', default='stratekaz_test')` lee
del env, que tiene `DB_NAME=stratekaz`. Esto hace que el test DB en Docker
local sea `test_stratekaz` (idéntico al que development generaría). No es
un bug ahora (el fix `--ds` resuelve el síntoma), pero es una configuración
frágil. Considerar hardcodear a `stratekaz_test` o usar `TEST_DB_NAME`
como env var separada. Severidad: BAJA.

## Archivos tocados

- `backend/pytest.ini` — 1 línea agregada (`--ds=config.settings.testing`)
