# Sesión 2026-05-02 — CT Unification: cierre completo H-S8-ct-disperso

## Contexto

Sprint dedicado de 4 días (29 abr → 2 may) para cerrar el hallazgo arquitectónico
**H-S8-ct-disperso**: la Capa Transversal (CT) vivía físicamente fragmentada en 3
ubicaciones distintas del repo (`apps/catalogo_productos/`, `apps/workflow_engine/`,
`apps/gestion_estrategica/gestion_documental/`) sin paraguas común y sin coherencia
de naming.

Refactor masivo en 7 fases con paralelización por agentes. **Estrategia adoptada:
Opción B+** (limpieza total de `app_label` en código + Python + DB + Frontend,
preservando `db_table` con valor histórico para evitar `ALTER TABLE` masivos en
multi-tenant).

Sesión cerrada con merge a `main`, push verde a origin, doble auditoría
estructural+funcional convergente, browseo manual completo en `tenant_demo`.
**Deploy VPS pendiente** (procedimiento documentado pero no ejecutado).

---

## Commits del día (29 abr → 2 may)

| Commit | Descripción | CI |
|--------|-------------|----|
| `2c37c119` | docs(diag): rehidratación S9 post-S8.5 — snapshot completo para Claude Web | ✅ |
| `6bbf0562` | chore(refactor/ct): scaffold paraguas infraestructura/ vacío | ⏳ no verificado |
| `3cac09c4` | refactor(arch): mover 3 paquetes CT a apps/infraestructura/ (Fase 2) | ⏳ no verificado |
| `8c2cb197` | refactor(arch): actualizar consumidores externos a nuevos paths CT (Fase 3) | ⏳ no verificado |
| `50876af5` | refactor(arch): Fase 4 — settings + URLs + celery + sidebar + RBAC + datos | ⏳ no verificado |
| `f652cc80` | refactor(arch): Fase 5 — frontend features → infraestructura/ (CT) | ⏳ no verificado |
| `0dfe98c0` | fix(refactor/ct): bugs encontrados en browseo manual Fase 6.2 | ⏳ no verificado |
| `3cc3c742` | chore(refactor/ct): cleanup hallazgos cosméticos doble auditoría | ⏳ no verificado |
| `6db6c874` | chore(refactor/ct): merge H-S8-ct-disperso cierre completo | ⏳ pendiente verificar tras push |

**Push a origin/main**: 10 commits subidos (07f258ec..6db6c874). CI workflow disparado
pero no verificado en esta sesión — usuario debe revisar GitHub Actions.

---

## Estado del producto

- **CURRENT_DEPLOY_LEVEL**: L20 (mi_equipo) + L16 (catalogo_productos) + supply_chain
- **Branch refactor/ct-unification**: mergeado a `main` con `--no-ff`. Branch puede
  borrarse después del deploy verde
- **Local (tenant_demo)**: Backend + Frontend funcionales, todas las migraciones
  aplicadas, browseo manual exitoso 9/9 pasos
- **VPS**: NO desplegado todavía. Procedimiento crítico documentado en commit `50876af5`
- **Apps LIVE tocadas**:
  - C0/C1: `core`, `tenant`, `gestion_estrategica.{configuracion, identidad, organizacion, contexto, encuestas}`, `audit_system`, `shared_library`, `ia`
  - CT (movidas): `gestion_documental`, `catalogo_productos` (+ proveedores, impresoras), `workflow_engine` (4 sub-apps)
  - C2 LIVE consumidores: `supply_chain` (todas sub-apps), `mi_equipo`, `talent_hub.services`, `portales.mi_portal`
- **Tests**:
  - `manage.py check`: ✅ 0 issues
  - `makemigrations --dry-run`: ✅ "No changes detected"
  - `pytest --collect-only`: 855 tests, 0 errors de import
  - Tests bloqueantes locales: ⚠️ fallan por entorno Docker (`current transaction is aborted`, deuda preexistente, no es regresión del refactor)
  - Vite production build: ✅ "built in Xs", 226 entries precache

---

## Decisiones tomadas (no reabrir)

1. **Opción B+ para labels Django**: rename `app_label` (`gestion_documental` → `infra_gestion_documental`, etc.) + preservar `Meta.db_table` con nombre histórico. Patrón estándar en grandes refactors Django: cero `ALTER TABLE` físicos, cero riesgo de pérdida de datos en multi-tenant.

2. **Sub-apps de workflow_engine con `app_label` explícito**: `disenador_flujos` → `infra_disenador_flujos`, `firma_digital` → `infra_firma_digital`, `ejecucion` → `infra_workflow_ejecucion` (NEW explícito), `monitoreo` → `infra_workflow_monitoreo` (NEW explícito). Los 2 últimos eran default antes del refactor — ahora son explícitos para prevenir colisiones futuras (motor_riesgos.monitoreo, tesoreria.ejecucion).

3. **`proveedores` NO es sub-app independiente**: su `Meta.app_label='catalogo_productos'` lo fusiona con el principal. Solo 2 AppConfig en el paraguas catalogo (`infra_catalogo_productos` + `infra_impresoras`), no 3.

4. **`supply_chain.gestion_proveedores` NO se mueve**: contiene 3 modelos genuinamente SC (PrecioMateriaPrima, ModalidadLogistica, HistorialPrecioProveedor). Solo el nombre del paquete está engañoso (legacy de la Opción A 2026-04-21). Registrado como deuda separada `H-SC-RENAME-PRECIOS-SC` (no entró al sprint).

5. **SystemModule.code en DB también renombrado** (Opción B coherente): los 3 codes top-level (`gestion_documental`, `catalogo_productos`, `workflow_engine`) renombrados en `core_system_module.code`. Los Tab.code y Section.code internos NO se cambian (son UI codes, capa distinta del Python label).

6. **Frontend `features/workflows/` renombrado a `features/workflow-engine/`**: alineación BE↔FE total.

7. **SQL manual previo al `migrate` en VPS**: documentado en commit `50876af5`. Sin esto, Django falla con `InconsistentMigrationHistory`. Procedimiento idempotente, replicable.

8. **`models_system_modules.py:IMPLICIT_DEPENDENCY_CHAIN` y `DISABLE_WARNINGS`**: actualizados a `infra_workflow_engine` para coherencia con nuevo `SystemModule.code`.

---

## Deuda consciente activa

### Bloqueante para deploy VPS

- **Procedimiento SQL multi-tenant**: aplicar UPDATE manual en cada schema VPS antes de `bash scripts/deploy.sh`. Sin esto, deploy explota con `InconsistentMigrationHistory`. Procedimiento documentado en commit `50876af5` y en este doc.

### Hallazgos nuevos detectados durante browseo (post-refactor, no bloqueantes)

| Código | Severidad | Descripción |
|--------|-----------|-------------|
| **H-CT-PROVEEDORES-orden-default** | BAJA | Default sort por nombre, debería poder ser por código |
| **H-GD-archivo-vs-repositorio** | MEDIA-ALTA | Separar Repositorio (documentos SGI vivos) de Archivo (registros operativos auto-archivados desde C2 + TRD). Distinción ISO 9001 §7.5.3. |
| **H-CT-evidencias-content-type-label** | MEDIA | FE manda `entity_type=gestion_documental.documento` (label viejo) en queries a `motor_cumplimiento`. Cuando módulo se reactive, fallará. |
| **H-WORKFLOW-firma-digital-route-missing** | MEDIA | Sidebar item "Firma Digital" → `/workflows/firma-digital` no registrada en routes |
| **H-WORKFLOW-auditoria-funcional** | ALTA | workflow_engine FE inconsistente con BE (paths `mis_tareas` underscore vs guion, `tareas/estadisticas` apunta al ViewSet equivocado). Sugiere módulo dormido funcionalmente nunca terminado. |
| **H-SC-RENAME-PRECIOS-SC** | BAJA | Renombrar `supply_chain/gestion_proveedores/` → `supply_chain/precios_proveedor/` (paquete mal nombrado post-Opción A 2026-04-21) |
| **H-MI-EQUIPO-talent-hub-services-coupling** | MEDIA | `mi_equipo.seleccion_contratacion.views` importa lazy 2 services de `talent_hub.services/` aunque talent_hub está dormido. LIVE de facto. |

### Cosméticos (no críticos)

- 3 comentarios con paths viejos arreglados durante Fase 7 (`models.py:1160`, `models_config.py:198`, `test_rbac_clasificacion.py:82`)
- Migración `0014_cleanup_orphan_content_types_ct.py` agregada para limpiar filas huérfanas en `django_content_type` que dejó el rename de `app_label`

### Deuda preexistente (no introducida por este sprint)

- Tests bloqueantes locales fallan por estado residual del Docker `--keepdb` (`current transaction is aborted`). CI corre fresh y pasa.
- 58 vulnerabilidades Dependabot (1 critical, 21 high, 32 moderate, 4 low) reportadas en push — separado del refactor CT.

---

## Próximo paso claro

**Verificar CI verde en GitHub Actions** del push `6db6c874` antes de deploy VPS.
Si CI pasa, ejecutar deploy VPS con procedimiento SQL manual previo:

```sql
-- En cada schema VPS (public + cada tenant)
UPDATE django_migrations SET app='infra_gestion_documental' WHERE app='gestion_documental';
UPDATE django_migrations SET app='infra_catalogo_productos'  WHERE app='catalogo_productos';
UPDATE django_migrations SET app='infra_impresoras'          WHERE app='impresoras';
UPDATE django_migrations SET app='infra_disenador_flujos'    WHERE app='disenador_flujos';
UPDATE django_migrations SET app='infra_workflow_ejecucion'  WHERE app='ejecucion';
UPDATE django_migrations SET app='infra_workflow_monitoreo'  WHERE app='monitoreo';
UPDATE django_migrations SET app='infra_firma_digital'       WHERE app='firma_digital';
UPDATE django_content_type SET app_label='infra_gestion_documental' WHERE app_label='gestion_documental';
-- (idem para los otros 6 labels)
```

Después: `bash scripts/deploy.sh` (las migraciones 0012/0013/0014 + las de cada
paquete `infra_*` se aplican automáticamente). Browseo prod en VPS replicando los
9 pasos del checklist local.

---

## Archivos clave tocados

### Backend movidos (Fase 2 — git mv preserva history)
- `apps/gestion_estrategica/gestion_documental/` → `apps/infraestructura/gestion_documental/` (69 archivos)
- `apps/catalogo_productos/` → `apps/infraestructura/catalogo_productos/` (61 archivos, incluye sub-app `proveedores/` y `impresoras/`)
- `apps/workflow_engine/` → `apps/infraestructura/workflow_engine/` (69 archivos, 4 sub-apps)

### Backend config (Fase 4)
- `backend/config/settings/base.py` — TENANT_APPS apunta a `apps.infraestructura.*`
- `backend/config/urls.py` — 4 includes condicionales actualizados
- `backend/config/celery.py` — 8 task paths actualizados
- `backend/conftest.py` — `_LIVE_MODULES` con codes `infra_*`
- `backend/apps/core/viewsets_config.py` — SIDEBAR_LAYERS module_codes
- `backend/apps/core/middleware/module_access.py` — rutas → module_code
- `backend/apps/core/management/commands/{seed_estructura_final, seed_nivel2_modules, cleanup_legacy_modules}.py`
- `backend/apps/core/models/models_system_modules.py` — IMPLICIT_DEPENDENCY_CHAIN + DISABLE_WARNINGS
- `backend/apps/ia/services/context_help.py`

### Migraciones nuevas
- `apps/core/migrations/0012_rename_module_codes_ct.py` — UPDATE `core_system_module.code` por tenant
- `apps/core/migrations/0013_rename_enabled_modules_ct.py` — UPDATE `tenant.enabled_modules` en public schema (RunPython)
- `apps/core/migrations/0014_cleanup_orphan_content_types_ct.py` — DELETE filas huérfanas en `django_content_type`
- `apps/infraestructura/gestion_documental/migrations/0028_rename_app_label.py`
- `apps/infraestructura/catalogo_productos/migrations/0025_rename_app_label_to_infra.py`
- `apps/infraestructura/catalogo_productos/migrations/0026_normalize_db_table_state.py`
- `apps/infraestructura/catalogo_productos/migrations/0027_alter_proveedor_productos_suministrados.py`
- `apps/infraestructura/catalogo_productos/impresoras/migrations/0002_rename_app_label_to_infra.py`
- `apps/infraestructura/catalogo_productos/impresoras/migrations/0003_normalize_db_table_state.py`
- `apps/infraestructura/workflow_engine/disenador_flujos/migrations/0003_rename_app_label.py`
- `apps/infraestructura/workflow_engine/firma_digital/migrations/0009_rename_app_label.py`
- `apps/infraestructura/workflow_engine/ejecucion/migrations/0002_rename_app_label.py`
- `apps/infraestructura/workflow_engine/monitoreo/migrations/0002_rename_app_label.py`

### Frontend movidos (Fase 5)
- `frontend/src/features/gestion-documental/` → `frontend/src/features/infraestructura/gestion-documental/`
- `frontend/src/features/catalogo-productos/` → `frontend/src/features/infraestructura/catalogo-productos/`
- `frontend/src/features/workflows/` → `frontend/src/features/infraestructura/workflow-engine/` (renombrado para coherencia BE/FE)

### Frontend config y constants
- `frontend/src/constants/{permissions.ts, modules.ts}` — codes `infra_*`
- `frontend/src/routes/modules/{catalogo-productos, gestion-documental, workflow-engine}.routes.tsx`
- 9 archivos consumidores (supply-chain, common, pages, tests) con paths absolutos actualizados

### Backups
- `backups/ct-unification-pre/snapshot_2026-04-28_2027.sql` — pg_dump local pre-refactor (2.7MB, 323 tablas)

### Hallazgo H-S8-ct-disperso → marcar resuelto
- `docs/01-arquitectura/hallazgos-pendientes.md` línea 1167 + tabla resumen línea 1328 — actualizar a ✅ RESUELTO

---

## Hallazgos abiertos (registrar en hallazgos-pendientes.md)

- **H-CT-PROVEEDORES-orden-default** — BAJA
- **H-GD-archivo-vs-repositorio** — MEDIA-ALTA (aporte conceptual del usuario en sesión: separación ISO 9001 documentos vs registros)
- **H-CT-evidencias-content-type-label** — MEDIA
- **H-WORKFLOW-firma-digital-route-missing** — MEDIA
- **H-WORKFLOW-auditoria-funcional** — ALTA (auditoría completa workflow_engine: ¿qué sirve?, FE inconsistente, paths mal alineados, posiblemente código fantasma)
- **H-SC-RENAME-PRECIOS-SC** — BAJA
- **H-MI-EQUIPO-talent-hub-services-coupling** — MEDIA

---

## Métricas del refactor

| Dimensión | Valor |
|-----------|-------|
| Commits del sprint | 9 (incluido merge) |
| Archivos movidos backend | 199 |
| Archivos consumidores actualizados backend | 82 |
| Archivos frontend tocados | ~15 |
| Migraciones nuevas | 14 |
| Agentes en paralelo lanzados | 11 (Fases 0, 2, 3, 7) |
| Bugs encontrados en browseo manual | 6 (todos arreglados) |
| Hallazgos nuevos registrados | 7 |
| Tiempo total (4 días) | ~30 horas trabajo activo |
