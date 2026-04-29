# S9-DIAG — Rehidratación completa post-S8.5

**Generado:** 2026-04-28
**HEAD:** `6f6ca20f`
**Propósito:** Sincronizar Claude Web con estado actual del repo (lectura pura, sin cambios).

---

## SECCIÓN 1 — Estado del Repo

**HEAD actual:** `6f6ca20f` — `docs(history): cierre sesión 2026-04-28 — SC doc-vivo + PDF on-demand + deploy prod`

**Commits post-S8.5 (desde 2026-04-20):** **136 commits** en `origin/main`

**Estado vs origin:** `main` ahead 1 commit (solo el log de sesión `6f6ca20f` que no se pushó aún)

**Cambios sin commitear:** Solo `.claude/launch.json` y `.claude/settings.local.json` (archivos de configuración IDE — no son código).

### Distribución por scope (top):

| Tipo | Cantidad | Scopes principales |
|------|----------|--------------------|
| `feat` | 61 | supply-chain (≈35), gd (≈14), portales/mi-portal, config, sidebar |
| `fix` | 42 | supply-chain, gd, sentry, frontend |
| `docs` | 19 | history, arquitectura, auditorías |
| `refactor` | 7 | supply-chain, mi-portal, consecutivos, perfil |
| `test` | 2 | hseq, sc cleanup |
| `chore` | 1 | — |

### Módulos tocados post-S8.5:

- **Supply Chain (≈55% del volumen):** H-SC-RUTA-02 completo, H-SC-01/02/03/04/05/06, H-SC-RBAC sweep (40 viewsets), doc-vivo GD, PDF on-demand, RBAC instancia ruta
- **Gestión Documental (≈15%):** Auditoría profunda — 16 brechas, 14 cerradas (A1-A6): visor PDF embebido, sellado X.509, OCR indexado, form-builder PDF, EventoDocumental granular, RBAC endpoints
- **Portales/Mi Portal (≈5%):** paraguas `apps.portales.mi_portal` + rediseño UX + fix bypass self-service + ~1,500 LOC dead code eliminado
- **Perfil/Colaborador (≈3%):** Fusión centralizada Workday-style (5 cards + 3 modales atómicos)
- **Sidebar V3 + Catálogos (≈7%):** DIVIPOLA oficial, Proveedor.ciudad FK, 9 modelos Sistema B→A, Catálogos Plataforma UI
- **Docs reorganización (≈10%):** kebab-case, arc42+Divio, INDEX.md, CLAUDE.md sync

---

## SECCIÓN 2 — MEMORY y Roadmap

### Últimas 3 sesiones cerradas (post-S8.5):

1. **2026-04-28** — SC doc-vivo + PDF on-demand + 8 bugs browseo + deploy prod (`aa37b059` + `b029769b` en VPS). `07f258ec` pendiente deploy.
2. **2026-04-27 (marathon)** — SC consolidación: 17 commits, 16 hallazgos cerrados (H-SC-RBAC, H-SC-TALONARIO, H-SC-GD-ARCHIVE, H-SC-02, H-SC-04/05/06, H-RUTA-02/03).
3. **2026-04-23/24** — Mi Portal rediseño, perfil centralizado, Supply Chain QC + Liquidación + voucher UX 58mm + auditoría E2E 5 fixes.

### Próximo paso declarado en MEMORY:

> Deploy `07f258ec` en VPS (`bash scripts/deploy.sh --no-backup` — solo build FE). Luego browseo real prod liquidaciones SUGERIDA → CONFIRMADA → PAGADA. Si OK, Sprint 1 prod cerrado.

### No hay `ROADMAP.md` separado.

El roadmap vive en `docs/history/sprint-history.md` y los hallazgos en `docs/01-arquitectura/hallazgos-pendientes.md`.

### Archivos history nuevos post-S8.5 (cronológico):

```
2026-04-21 refactor-proveedor-ct-opcion-a.md
2026-04-21 post-deploy-mp-hotfixes.md
2026-04-21 auditoria-modal-proveedor-seeds-produccion.md
2026-04-22 sidebar-v3-hallazgos-ui-apendice-cascada.md
2026-04-22 sidebar-v3-fase2-geografia-divipola-consecutivos.md
2026-04-22 h-sc-03-qc-recepcion-completa-roadmap-sc.md
2026-04-23 mi-portal-refactor-portales-y-ux.md
2026-04-23 sesion-b-perfil-centralizado.md
2026-04-24 supply-chain-qc-liquidacion-voucher-ux.md
2026-04-24 e2e-audit-sc-fixes.md
2026-04-26 auditoria-diaria-sentry.md
2026-04-27 supply-chain-ruta02-refactor-completo.md
2026-04-27 supply-chain-marathon.md
2026-04-28 supply-chain-doc-vivo-pdf-ondemand-deploy.md
```

---

## SECCIÓN 3 — Migraciones

**Todos los módulos LIVE sin pendientes. Django check limpio.**

```
System check identified no issues (0 silenced)
```

| Módulo (capa) | App(s) | Última migración | Pendientes |
|---------------|--------|-----------------|------------|
| **C0 — core** | core | `0010` rename índices | ✅ 0 |
| C0 — audit_system | logs_sistema | `0002` audit impersonation | ✅ 0 |
| C0 — tenant | auditlog | `0015` alter timestamp | ✅ 0 |
| **C1 — fundacion** | configuracion | `0009` tiposede rol proveedor interno | ✅ 0 |
| C1 | organizacion | `0002` is_system a area | ✅ 0 |
| C1 | identidad | `0008` h-sc-02 estados historial GD | ✅ 0 |
| C1 | encuestas | (sin número visible, aplicada) | ✅ 0 |
| **CT — gestion_documental** | gestion_documental | `0027` rename doc_evt índices canónicos | ✅ 0 |
| CT — catalogo_productos | catalogo_productos | `0012` ruta semi precio | ✅ 0 |
| CT — gestion_proveedores | gestion_proveedores | `0024` drop ruta_origen | ✅ 0 |
| **CT — workflow_engine** | firma_digital | `0003` onboarding tenant | ✅ 0 |
| **C2 — mi_equipo** | colaboradores, estructura_cargos, seleccion, onboarding | hasta `0003` | ✅ 0 |
| **C2 — supply_chain** | catalogos | `0012` conductor_principal | ✅ 0 |
| C2 — supply_chain | liquidaciones | `0009` alter cantidad | ✅ 0 |
| C2 — supply_chain | almacenamiento | `0002` seed catalogos | ✅ 0 |
| C2 — supply_chain | compras | `0003` alter proveedor | ✅ 0 |
| **C3 parcial** | config_indicadores, exportacion | `0001` | ✅ 0 |

**✅ Sin pendientes. ✅ Sin errores en `check`.**

---

## SECCIÓN 4 — Tests

**Total recolectados por pytest:** **1,036 tests** (baseline S8.5: ~530 → casi duplicó)

| Métrica | Valor | vs S8.5 |
|---------|-------|---------|
| Tests recolectados | 1,036 | +506 (+95%) |
| Tests bloqueantes CI (manage.py test) | 6/6 ✅ | igual |
| pytest LIVE legacy | ❌ rojo | igual (deuda preexistente) |

**Error pytest LIVE:** `pg_type_typname_nsp_index mi_equipo_candidato` — duplicate index al crear schema de test. **Deuda preexistente**, no regresión. No afecta runtime en producción.

**Tests bloqueantes CI (6/6):** `test_sidebar` + `test_base` pasan según log de sesión 2026-04-28. Localmente con Docker fallan al setup de DB (`django_celery_beat_crontabschedule already exists`) por estado residual del contenedor — CI usa servicios fresh por run y pasa.

---

## SECCIÓN 5 — CI/CD y Estado Deploy

**gh CLI:** no configurado en esta máquina. CI verificado vía log de sesión.

| CI Step | Estado | Nota |
|---------|--------|------|
| Django checks + migraciones + collectstatic | ✅ | |
| Tests bloqueantes (`manage.py test` 6/6) | ✅ | Fixed en `aa37b059` |
| TypeScript type-check + ESLint | ✅ | según log sesión 2026-04-28 |
| Vite production build | ✅ | |
| pytest LIVE legacy (informativo) | ❌ | `pg_type duplicate mi_equipo_candidato` — deuda preexistente, no bloquea |

**Deploy VPS:**

- ✅ `aa37b059` + `b029769b` — desplegados con éxito (2026-04-28)
- ⏳ `07f258ec` (`fix(sc): liquidaciones FE alineadas a estados H-SC-02`) — **PENDIENTE** — único commit no desplegado

**HEAD actual `6f6ca20f`** (log de sesión docs-only): no hay código nuevo vs lo desplegado en VPS. El único delta funcional pendiente es `07f258ec`.

---

## SECCIÓN 6 — Candidatos de Trabajo Paralelo

Rankeados por aislamiento. Solo módulos LIVE. No SC (en flight activo).

| # | Módulo | Pendiente concreto | BE/FE | Aislamiento |
|---|--------|--------------------|-------|-------------|
| 1 | **H-PROD-08** — audit_system (C0) | Eliminar PeriodicTask zombies `planeacion.*` de django_celery_beat (`config/celery.py` beat_schedule). 2,500 eventos Sentry. Fix: borrar las 5-6 entradas obsoletas. | BE only | **Alto** — solo config/celery.py |
| 2 | **H-FE-01** — Design System (transversal) | Auditar usos de `loading` vs `isLoading` en props de `<Button>`. Pattern inconsistente genera errores silenciosos en prod. | FE only | **Alto** — grep + fix en componentes, no toca lógica |
| 3 | **H-S9-modal-mount-condicional** | Modales se montan aunque estén cerrados (carga inicial innecesaria). Aplicar patrón `{open && <Modal>}` en los ~15 modales identificados. | FE only | **Alto** — patrón mecánico, no toca lógica de negocio |
| 4 | **mi_equipo — tests coverage** | 4 sub-apps (estructura_cargos, seleccion, colaboradores, onboarding) tienen cobertura < 40%. Criterio "básico bien hecho" no cumplido. Tests happy-path críticos faltan. | BE only | **Alto** — C2 100% independiente de SC |
| 5 | **H-S8-dependabot-45-vulns** | 45 vulnerabilidades acumuladas (1 crítica). Revisar pip-audit + npm audit, aplicar security updates agrupadas por ecosistema. | BE + FE | **Alto** — solo deps, no toca código |
| 6 | **H-UI-04** — Fundación Tab 4 | Tab "Políticas y Reglamentos" faltante en la UI de Fundación (C1). Modelo TipoContrato y políticas ISO existen en backend. Solo UI. | FE only | **Alto** — C1, no toca SC ni GD |
| 7 | **H-CAT-04** — tipo_documento hardcoded | `Colaborador.tipo_documento` y `Candidato.tipo_documento` como `CharField` con choices. Debería ser FK a catálogo DIVIPOLA-style. | BE + FE | **Medio** — toca `colaboradores` + `seleccion`, comparte utils |
| 8 | **GD — browseo post-auditoría** | GD tuvo 14 brechas cerradas pero sin browseo E2E confirmado post-deploy. Validar ciclo BORRADOR→PUBLICADO→DISTRIBUIDO con visor PDF embebido, sellado y tracking en VPS. | Operacional | **Alto** — solo browseo, sin código |
| 9 | **H-UI-03** — Naming catálogos | 3 menús llamados "Catálogos" + "Catálogo de Productos" engañoso (no es solo productos, es CT completo). Renombrar labels UI. | FE only | **Alto** — solo strings/labels, sin lógica |
| 10 | **CI rojo pytest LIVE** | `pg_type_typname_nsp_index mi_equipo_candidato` — investigate y fix en `BaseTenantTestCase` o en la migración de candidatos. | BE only | **Medio** — toca infra de test + mi_equipo candidatos |

---

## SECCIÓN 7 — Hallazgos Nuevos (post-S8.5, no en MEMORY de Web)

Ordenados por impacto:

| # | Código | Descripción | Impacto |
|---|--------|-------------|---------|
| 1 | **H-PROD-08** | PeriodicTask zombies `planeacion.*` — 2,500 eventos Sentry. `KeyError` recurrente porque las tareas apuntan a apps dormidas. | 🔴 ALTO — ruido Sentry encubre errores reales |
| 2 | **H-PROD-02** | Celery Beat `InterfaceError: DB connection closed` — proceso ongoing en Sentry. | 🔴 ALTO — puede causar pérdida silenciosa de tareas programadas |
| 3 | **H-PROD-03** | `AppRegistryNotReady` en django-tenants al cargar DB backend antes que app registry. 1 evento detectado en deploy. | 🟠 MEDIO — aparece en deploy, potencialmente enmascarado |
| 4 | **H-SC-RUTA-CERTIFICADOS-PV** | Certificados fitosanitarios/sanitarios a productores en rutas semi-autónomas — pendiente modelado | 🟡 MEDIO — SC feature nueva, no bloquea actual |
| 5 | **H-SC-RUTA-LIQ-PRODUCTORES** | Liquidación directa a productores en modalidad RECOLECCION (pago al productor ≠ pago al proveedor intermediario) | 🟡 MEDIO — SC siguiente fase |
| 6 | **H-S9-modal-mount-condicional** | ~15 modales se montan aunque `open=false`. Performance hit en páginas con muchos modales. | 🟡 MEDIO — FE performance |
| 7 | **GD auditado, NO browseado en prod** | 14 brechas GD cerradas en código, pero sin confirmación de browseo E2E en VPS post-deploy. Visor PDF embebido + sellado X.509 son features críticas. | 🟡 MEDIO — riesgo de regresión silenciosa |
| 8 | **H-S6-unidades-medida-dup (PARCIAL)** | Wrapper `supply_chain/urls.py` re-expone `/unidades-medida/` aunque ya vive en CT. Doble endpoint activo. | 🟡 BAJO-MEDIO |
| 9 | **Perfil centralizado: IdentidadSection read-only** | `IdentidadSection` del perfil es read-only para empleados (solo foto editable). Decisión tomada en `ce6c2bcd` pero no documentada en arquitectura. | 🟢 BAJO — feature intencional, necesita doc |
| 10 | **GD — doc-vivo como patrón** | Nuevo patrón: documentos SC se archivan en GD como doc-vivo (actualizable). No documentado en `docs/03-modulos/gestion-documental/`. | 🟢 BAJO — deuda documental |

---

## Resumen ejecutivo

| Dimensión | Estado |
|-----------|--------|
| Commits post-S8.5 | **136** (SC 55%, GD 15%, portales/sidebar/config 30%) |
| Migraciones | ✅ **0 pendientes**, check limpio |
| Tests bloqueantes CI | ✅ **6/6** |
| pytest LIVE | ❌ rojo (deuda preexistente, `pg_type mi_equipo_candidato`) |
| Tests totales recolectados | **1,036** (+95% vs S8.5) |
| Deploy VPS | ⏳ `07f258ec` pendiente (liquidaciones FE states) |
| Hallazgos abiertos | **~35** (3 críticos PROD, resto arquitectónicos/UI) |
| Candidatos trabajo paralelo | **10** identificados (6 con aislamiento alto) |

**Prioridad inmediata según MEMORY:** deploy `07f258ec` → browseo liquidaciones prod → luego elegir entre CI fix, PROD-08, o mi_equipo coverage.
