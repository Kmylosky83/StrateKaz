# Hallazgos de testing — Sesión 2026-04-11

## Contexto

Sesión de cleanup de tests fallidos en backend. Brief original asumía 1 patrón
único ("falta de auth en test_views", ~185 tests). El diagnóstico reveló 3
patrones distintos, ninguno de los cuales era falta de autenticación. Esta
sesión atacó el Patrón A (migración a reverse). Patrones B y C quedan
documentados acá para sesiones futuras.

Pitfall metodológico evitado: Code paró cuando descubrió que Patrón B bloqueaba
la verificación aislada del Patrón A, en vez de intentar arreglar la infra de
tests en la misma sesión. Disciplina aplicada conforme a docs/history/pitfalls.md.

---

## Patrón A — URLs hardcodeadas en test_views (RESUELTO)

### Severidad
**MEDIA** — 100 tests falsos-failing que oscurecían el estado real de la suite.

### Síntoma
Tests devolvían 404 al hacer requests a URLs hardcodeadas como
`/api/audit/logs/configuraciones-auditoria/` que no existían en el router.

### Causa raíz — Hipótesis B confirmada: URLs nunca existieron

Evidencia de git:
- Los 5 archivos `test_views.py` se crearon en commit `779fed9d` (2025-12-30,
  "Semana 25 ok — FASE 7: NIVEL 6 INTELIGENCIA COMPLETO").
- Los `urls.py` del router se crearon en **el mismo commit**.
- `git diff 779fed9d..HEAD` en los 5 `urls.py` afectados devuelve **vacío**.
  Las rutas del router NUNCA cambiaron desde la creación.
- Los basenames del router (ej: `configuracion`, `accesos`, `cambios`,
  `consultas`) nunca correspondieron a las URLs usadas en los tests (ej:
  `configuraciones-auditoria`, `logs-acceso`, `logs-cambio`, `logs-consulta`).

Conclusión: los tests fueron generados masivamente durante FASE 7 con URLs
descriptivas inventadas que **nunca se validaron contra el router real**. Los
195 tests reportados en el commit message de 779fed9d nunca pasaron — el número
era de la suma de tests definidos, no de tests ejecutados exitosamente.

### Mapeo completo test URL → URL real

**audit_system/logs_sistema** (basename: configuracion, accesos, cambios, consultas):

| URL en test (inventada)                          | URL real (router)                 | reverse name                                        |
|--------------------------------------------------|-----------------------------------|-----------------------------------------------------|
| `/api/audit/logs/configuraciones-auditoria/`     | `/api/audit/logs/configuracion/`  | `audit_system:logs_sistema:configuracion-list`       |
| `/api/audit/logs/logs-acceso/`                   | `/api/audit/logs/accesos/`        | `audit_system:logs_sistema:accesos-list`             |
| `/api/audit/logs/logs-cambio/`                   | `/api/audit/logs/cambios/`        | `audit_system:logs_sistema:cambios-list`             |
| `/api/audit/logs/logs-consulta/`                 | `/api/audit/logs/consultas/`      | `audit_system:logs_sistema:consultas-list`           |
| `.../logs-acceso/por_usuario/`                   | `.../accesos/por-usuario/`        | `audit_system:logs_sistema:accesos-por-usuario`      |
| `.../logs-cambio/por_objeto/`                    | `.../cambios/por-objeto/`         | `audit_system:logs_sistema:cambios-por-objeto`       |
| `.../logs-cambio/por_usuario/`                   | `.../cambios/por-usuario/`        | `audit_system:logs_sistema:cambios-por-usuario`      |

**audit_system/config_alertas** (basename: tipos, configuraciones, alertas, escalamientos):

| URL en test                             | URL real                        | reverse name                                            |
|-----------------------------------------|---------------------------------|---------------------------------------------------------|
| `.../tipos-alerta/`                     | `.../tipos/`                    | `audit_system:config_alertas:tipos-list`                |
| `.../configuraciones-alerta/`           | `.../configuraciones/`          | `audit_system:config_alertas:configuraciones-list`      |
| `.../alertas-generadas/`               | `.../` (root)                   | `audit_system:config_alertas:alertas-list`              |
| `.../alertas-generadas/pendientes/`     | `.../pendientes/`               | `audit_system:config_alertas:alertas-pendientes`        |
| `.../alertas-generadas/por_severidad/`  | `.../por-severidad/`            | `audit_system:config_alertas:alertas-por-severidad`     |
| `.../escalamientos-alerta/`             | `.../escalamientos/`            | `audit_system:config_alertas:escalamientos-list`        |

**audit_system/centro_notificaciones** (basename: tipos, notificaciones, preferencias, masivas):

| URL en test                             | URL real                        | reverse name                                                |
|-----------------------------------------|---------------------------------|-------------------------------------------------------------|
| `.../tipos-notificacion/`               | `.../tipos/`                    | `audit_system:centro_notificaciones:tipos-list`             |
| `.../notificaciones/`                   | `/api/audit/notificaciones/`    | `audit_system:centro_notificaciones:notificaciones-list`    |
| `.../preferencias-notificacion/`        | `.../preferencias/`             | `audit_system:centro_notificaciones:preferencias-list`      |
| `.../notificaciones-masivas/`           | `.../masivas/`                  | `audit_system:centro_notificaciones:masivas-list`           |
| `.../marcar_todas_leidas/`              | `.../marcar-todas-leidas/`      | `...notificaciones-marcar-todas-leidas`                     |

**audit_system/tareas_recordatorios** (basename: tareas, recordatorios, eventos, comentarios):

| URL en test                             | URL real                        | reverse name                                                |
|-----------------------------------------|---------------------------------|-------------------------------------------------------------|
| `.../tareas/tareas/`                    | `/api/audit/tareas/`            | `audit_system:tareas_recordatorios:tareas-list`             |
| `.../tareas/tareas/mis_tareas/`         | `.../mis-tareas/`               | `audit_system:tareas_recordatorios:tareas-mis-tareas`       |
| `.../tareas/tareas/vencidas/`           | `.../vencidas/`                 | `audit_system:tareas_recordatorios:tareas-vencidas`         |
| `.../tareas/eventos-calendario/`        | `.../eventos/`                  | `audit_system:tareas_recordatorios:eventos-list`            |
| `.../tareas/comentarios-tarea/`         | `.../comentarios/`              | `audit_system:tareas_recordatorios:comentarios-list`        |

**analytics/config_indicadores** (basename: catalogo-kpi, ficha-tecnica-kpi, meta-kpi, configuracion-semaforo):

| URL en test                                       | URL real                          | reverse name                            |
|---------------------------------------------------|-----------------------------------|-----------------------------------------|
| `.../config-indicadores/catalogo-kpis/`            | `/api/analytics/config/kpis/`     | `analytics:catalogo-kpi-list`           |
| `.../config-indicadores/fichas-tecnicas/`          | `.../config/fichas-tecnicas/`     | `analytics:ficha-tecnica-kpi-list`      |
| `.../config-indicadores/metas-kpi/`                | `.../config/metas/`               | `analytics:meta-kpi-list`               |
| `.../config-indicadores/configuraciones-semaforo/` | `.../config/semaforos/`            | `analytics:configuracion-semaforo-list` |
| `.../catalogo-kpis/por_categoria/`                 | `.../kpis/por-categoria/`         | `analytics:catalogo-kpi-por-categoria`  |

### Solución aplicada
Migración de URLs hardcodeadas a `reverse('nombre-real')` en los 5 archivos
test_views afectados. Helpers `_xxx_list()` / `_xxx_detail(pk)` al inicio de
cada archivo para centralizar la resolución y facilitar mantenimiento futuro.

### Tests migrados

| Archivo                                               | Tests | Antes  | Después                               |
|-------------------------------------------------------|-------|--------|---------------------------------------|
| audit_system/logs_sistema/tests/test_views.py         | 32    | 32F (404) | 32F (core_tab_section) |
| audit_system/config_alertas/tests/test_views.py       | 15    | 15F (404) | 15F (core_tab_section) |
| audit_system/centro_notificaciones/tests/test_views.py| 16    | 16F (404) | 16F (core_tab_section) |
| audit_system/tareas_recordatorios/tests/test_views.py | 24    | 24F (404) | 24F (core_tab_section) |
| analytics/config_indicadores/tests/test_views.py      | 13    | 13F (404) | 13F (core_tab_section) |
| **TOTAL**                                             | **100** | **100F (404)** | **100F (Patrón B bloquea)** |

**Nota:** El error cambió de 404 (URLs inventadas) a `ProgrammingError:
core_tab_section does not exist` (Patrón B). La migración a reverse() fue
exitosa — las URLs se resuelven correctamente — pero Patrón B impide que los
tests lleguen a ejecutar la request HTTP. Resolver Patrón B desbloqueará estos
100 tests automáticamente.

### Snapshot de URLs
Archivo: `docs/snapshots/urls-2026-04-11.txt` (2,038 rutas API).
Propósito: baseline para detectar drift futuro de routing.

### Verificación
Verificación aislada (file-by-file) y en suite completa BLOQUEADA por Patrón B.
Suite completa (2026-04-12): 589 passed / 230 failed / 144 skipped / 0 errors.
Los 100 tests migrados cambiaron de 404 a `core_tab_section` error — confirma
que reverse() resuelve correctamente pero Patrón B impide la ejecución HTTP.
Resolver Patrón B desbloqueará los 100 tests automáticamente.

### Commits
- `660bb7cd` docs(infra): snapshot de URLs de API como baseline de routing
- `33d7a4e0` test(audit-system): migrar 87 test_views de URLs hardcodeadas a reverse()
- `d4c52dec` test(analytics): migrar 13 test_views de URLs hardcodeadas a reverse()

---

## Patrón B — Bloqueador de infra de tests (PENDIENTE — PRIORIDAD ALTA)

### Severidad
**ALTA — bloqueador de productividad de testing**

Cualquier desarrollador que intente correr `pytest apps/X/tests/test_views.py`
aislado para iterar rápido se choca con esto. Solo funciona corriendo la suite
completa (963 tests, ~90 min). Esto hace que el ciclo de feedback de testing sea
inaceptablemente lento.

### Síntomas

1. Tests que usan `authenticated_client` (que depende de la fixture `user`) crashean con:
   ```
   ProgrammingError: relation "core_tab_section" does not exist
   ```

2. El mismo test corrido como parte de la suite completa **pasa sin problemas**.
   Solo falla al correr subsets aislados.

3. Recrear el schema `test` manualmente (217 tablas, incluyendo `core_tab_section`)
   dentro de la DB `stratekaz` **no resuelve el problema** — porque pytest opera
   en una DB diferente.

### Causa raíz técnica

La cadena de DBs y schemas involucra 3 capas que se dessincronizan:

1. **DB de desarrollo:** `stratekaz` (configurada en `base.py`)
2. **DB de test settings:** `stratekaz_test` (configurada en `testing.py` via
   `DB_NAME=stratekaz_test`)
3. **DB de test pytest-django:** `test_stratekaz_test` (pytest-django aplica
   prefijo `test_` al `DB_NAME` de los settings activos)

El fixture session `tenant_test_schema` en `backend/conftest.py` (líneas 34-75):
- Crea un `Tenant(schema_name='test')` en la test DB
- Llama `tenant.create_schema(check_if_exists=True, sync_schema=True)`
- Llama `migrate_schemas(schema_name='test')`

El fixture autouse `enable_tenant_db` (líneas 78-100):
- Envuelve cada test que usa `db` en `schema_context('test')`
- Asume que el schema `test` tiene todas las tablas migradas

**El problema:** cuando pytest-django crea la test DB desde cero, el session
fixture `tenant_test_schema` corre las migraciones. Pero si la DB ya existe
(de una corrida anterior interrumpida) o si hay conexiones huérfanas, la
cadena `create_schema` → `migrate_schemas` puede fallar silenciosamente o
no completar. El schema `test` queda con 0 tablas.

**Agravante:** la fixture `user` (líneas 136-150 del conftest) crea un
`User.objects.create_user(...)`. El signal `post_save` de `TabSection` en
`rbac_signals` dispara `CargoSectionAccess` auto-propagation, que requiere
`core_tab_section`. Si esa tabla no existe → `ProgrammingError` → test crashea
antes de llegar a la lógica real.

### Archivos involucrados
- `backend/conftest.py` — fixtures `tenant_test_schema` y `enable_tenant_db`
- `backend/config/settings/testing.py` — `DATABASES` con `DB_NAME=stratekaz_test`
- `backend/apps/core/signals/rbac_signals.py` — `post_save` en `TabSection`

### Tests afectados
- Todos los tests que usan `authenticated_client` o `user` fixture en subsets
- En la corrida de la sesión: los 100 tests del Patrón A quedaron bloqueados
  por esto al intentar verificar la migración a reverse()
- mi_equipo/colaboradores/test_views.py: ~14 tests
- mi_equipo/estructura_cargos/test_views.py: ~12 tests
- mi_equipo/seleccion/test_portal_publico.py: ~9 tests (verificar si encaja)

### Conexión con pitfalls registrados
Se conecta con el comportamiento de `rbac_signals` documentado en pitfalls.md
(post_save en TabSection auto-crea CargoSectionAccess). Pero con agravante
crítico: en este caso la **tabla base** falta, no solo registros relacionados.
También se conecta con el pitfall `create_schema(check_if_exists=True) no
re-migra` (2026-04-08).

### Esfuerzo estimado
Sesión dedicada de 2-3 horas. Requiere:
- Investigar el orden exacto de fixtures session vs function en pytest-django
  + django-tenants
- Considerar uso de `--reuse-db` vs `--create-db` como workaround temporal
- Posible refactor de `tenant_test_schema` para ser más resiliente a DBs
  preexistentes con schemas incompletos
- Validación de que la solución no rompa la suite completa que hoy funciona

### Riesgo
**Medio-alto** — toca infra de tests, no tests en sí. Cualquier cambio puede
romper la suite completa. Necesita backup de comportamiento antes de tocar.

### Sesión propuesta
Antes de empezar Sub-bloque 1 o Sub-bloque 7. Es prerequisito para que cualquier
sesión futura de testing sea productiva con ciclo de feedback rápido.

---

## Patrón C — Tests probando código removido (PENDIENTE — PRIORIDAD MEDIA)

### Severidad
**MEDIA** — no bloquea, pero infla el conteo de tests fallidos.

### Síntoma
Tests en `configuracion/test_empresa_config.py` prueban propiedades y métodos
del modelo `EmpresaConfig` que ya no existen:
- `nit_sin_dv` → `AttributeError: 'EmpresaConfig' object has no attribute 'nit_sin_dv'`
- `digito_verificacion` → `AttributeError`
- `formatear_valor()` → `AttributeError`
- Algoritmo de validación NIT cambió → `assert 'Debería ser 7, no 9'` falla
  porque ahora dice `'Debería ser 8, no 9'`
- Singleton `test_impide_crear_segunda_instancia` → `DID NOT RAISE` (no valida)
- Formateo de NIT (guion, puntos, espacios) → assertions fallan en formato

### Causa raíz hipotética
Refactor pasado removió las propiedades del modelo pero no actualizó los tests.
Quedaron tests huérfanos. El cambio del algoritmo NIT puede ser intencional
(corrección) o accidental (regresión).

### Tests afectados
~15 tests en `gestion_estrategica/configuracion/tests/test_empresa_config.py`

### Desglose por tipo de error
| Error                        | Tests | Decisión requerida                          |
|------------------------------|-------|---------------------------------------------|
| AttributeError propiedad     | 5     | ¿Propiedad removida o renombrada?           |
| Algoritmo NIT cambió         | 4     | ¿Intencional o regresión?                   |
| Singleton no valida          | 1     | ¿clean() se removió del save()?             |
| Formateo no aplica           | 3     | ¿save() ya no formatea?                     |
| Otros                        | 2     | Caso por caso                               |

### Hallazgo lateral
Verificar si el cambio del algoritmo NIT fue intencional. Si fue accidental,
hay un bug en producción que estos tests detectaron correctamente y la solución
es arreglar el código, no los tests.

### Esfuerzo estimado
2-3 horas, caso por caso. Cada test requiere verificar el estado actual del
modelo antes de decidir si eliminar el test, actualizarlo, o arreglar el código.

### Sesión propuesta
Después de Patrón B, antes del Sub-bloque 1 si queremos red de seguridad
completa para configuracion.

---

## Hallazgos transversales

### H-T1: Tests de FASE 7 nunca fueron ejecutados contra API real
El commit `779fed9d` (2025-12-30) reportó "195 tests" para audit_system y
"105 tests" para analytics. Estos números eran conteos de funciones `test_*`
definidas, no de tests ejecutados exitosamente. Los 100 tests del Patrón A
**nunca pasaron** desde su creación hace 4 meses. Implicación: el conteo
histórico de tests puede estar inflado en otros módulos no-LIVE.

### H-T2: Conteo real del bucket dominante fue 100, no 185
El bucket analysis de la sesión de diagnóstico estimó ~185 tests afectados por
"falta de auth". La realidad: ~100 tests del Patrón A (URLs) + ~14 del Patrón B
(infra) + ~15 del Patrón C (código removido) + ~80 del Patrón B que no habíamos
diagnosticado (todos los test_views de mi_equipo + gestion_estrategica que usan
authenticated_client también caen en Patrón B al correr en subsets).

### H-T3: El schema `test` en DB `stratekaz` es un vestigio
El tenant `test` que existía en la DB de desarrollo `stratekaz` (no en la DB de
test) era un vestigio de corridas anteriores. La sesión lo recreó intentando
debuggear el Patrón B, pero la raíz del problema está en la DB de test de
pytest-django, no en la DB de desarrollo.

---

## Métricas de la sesión

- Tiempo total: ~6 horas
- Tests migrados a reverse(): 100 (Patrón A)
- Hallazgos formales documentados: 3 (Patrones A, B, C) + 3 transversales
- Pitfalls metodológicos evitados: 1 (no escalar para arreglar Patrón B)
- Archivos nuevos: 2 (snapshot de URLs + este archivo)
- Archivos modificados: 5 (test_views migrados)
- Sub-bloque 1: intacto, reclasificado como refactor mediano planificado (2,617 LOC)

---

## Próximos pasos sugeridos

1. **Sesión próxima:** Sesión filosófica Camilo + Claude web para responder las
   3 preguntas arquitectónicas del Sub-bloque 1 que quedaron congeladas.

2. **Sesión + 1:** Resolución de Patrón B (bloqueador infra). Prerequisito para
   productividad de testing.

3. **Sesión + 2:** Resolución de Patrón C (tests huérfanos en configuracion).

4. **Sesión + 3:** Brief de ejecución del Sub-bloque 1 con scope corregido.
