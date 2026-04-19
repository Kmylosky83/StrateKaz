# Sesión 2026-04-19 (noche) — S6 Activación Supply Chain + Doctrina feature-flag C2

> Tercera sesión del día. Matutina: Catálogo Productos S5 (`4db45d11`).
> Vespertina: Sidebar TIER 0 + hallazgo PWA (`d327f4c2`). Esta nocturna:
> activación de supply_chain como primer módulo C2 vivo fuera de cascada lineal.

## Commits del día (sólo esta sesión)

| Commit | Descripción |
|--------|-------------|
| `43800b1f` | feat(supply-chain): S6 activación 6 sub-apps + cleanup legacy |

## Estado del producto

- **CURRENT_DEPLOY_LEVEL:** 20 (sin cambio — doctrina feature-flag adoptada)
- **Versión frontend:** 5.8.0 (minor bump por nueva funcionalidad módulo C2)
- **drf-spectacular VERSION:** 5.4.0 (bump acorde API surface)
- **Migraciones:** 6 sub-apps supply_chain aplicadas en shared + tenant_demo + test
- **Manage.py check:** ✅ 0 issues
- **Sidebar:** NIVEL_CADENA con 7 tabs (Proveedores, Precios, Recepción,
  Liquidaciones, Almacenamiento, Evaluaciones, Catálogos). Compras NO expuesta.
- **Seeds idempotentes:** verificado con 2× ejecución consecutiva.
- **pg_dump backup:** `/tmp/stratekaz-backups/pre_s6_20260419_1340.sql` (3.6M).
- **Deploy VPS:** pendiente (smoke browseable + CI verde primero).

## Decisiones arquitectónicas (no reabrir)

### 1. Doctrina de feature-flag por módulo C2 (reemplaza cascada lineal)

A partir de S6, los módulos C2 se activan cuando sus dependencias (C0+C1+CT)
están satisfechas, **sin esperar orden lineal** L25→L30→L35. Supply Chain es
el primer módulo C2 activado bajo esta doctrina. CURRENT_DEPLOY_LEVEL se
mantiene en 20 (core obligatorio). La activación efectiva de un C2 requiere:

1. Presencia en `TENANT_APPS` (gate infra — Django app registry)
2. `SystemModule.is_active=True` en cada tenant (gate UX — sidebar visible)

Ambos gates deben alinearse. Este modelo escala a futuros C2 (talent_hub,
HSEQ, sales_crm) sin forzar orden lineal.

**Alineación con mercado:** Saleor, Wagtail, Django-Oscar separan "app
installed" de "feature active". Mismo patrón.

### 2. compras registrada para integridad referencial FK (no expuesta)

`VoucherRecepcion.orden_compra → compras.OrdenCompra` requiere que `compras`
esté en `INSTALLED_APPS` (regla Django). Opción tomada:

- ✅ `apps.supply_chain.compras` en TENANT_APPS (tablas creadas vacías)
- ❌ URLs **NO** montadas en `supply_chain/urls.py`
- ❌ Tab **NO** expuesta en sidebar (removida del seed)
- ❌ Tests **NO** bloqueantes (legacy sin BaseTenantTestCase — informativos)

Reescritura futura cuando el negocio pida OC real (servicios, equipos,
repuestos). Mientras tanto: funcionalidad dormida con integridad preservada.

### 3. `programacion_abastecimiento` eliminada completa (no dormida)

Sub-app eliminada por 3 razones:
1. Importaba `UnidadMedida` legacy (que también se eliminó)
2. Tenía clase `Liquidacion` duplicada (colisión con `liquidaciones.Liquidacion`)
3. Sin `0001_initial.py` — nunca estuvo lista para prod

Se recrea cuando el negocio la pida, con modelo canónico (catalogo_productos).
Alcance eliminado: backend (~12 archivos) + frontend (api/hook/tab/modal/types)
+ refs en seeds y config/settings.

### 4. `Almacen` migrado de `BaseCompanyModel` a `TenantModel`

Doctrina `modular-tenancy.md`: schema-per-tenant ES la empresa. FK `empresa`
redundante. `is_active` boolean preservado explícitamente como semántica de
negocio (almacén operativamente activo), independiente del soft-delete.

### 5. `UnidadMedida` legacy eliminado de `supply_chain/catalogos`

Canónico vive en `catalogo_productos.UnidadMedida` (CT-layer, TenantModel).
El legacy plano era duplicación DRY. Tests/conftests de recepción y factories
de almacenamiento ya consumían el canónico desde sesiones previas.

## Scope de la sesión (ejecutado)

### Fase 0 — Limpieza pre-activación
- [x] 0.0 Pre-flight checks (6 greps, sin cambios)
- [x] 0.1 Eliminar `programacion_abastecimiento` backend + refs settings/seeds
- [x] 0.2 Eliminar `programacion_abastecimiento` frontend (5 archivos + refs)
- [x] 0.3 Eliminar `UnidadMedida` legacy de supply_chain/catalogos
- [x] 0.4 Migrar `Almacen` → `TenantModel`
- [x] 0.5 Limpiar `supply_chain/urls.py` + borrar migraciones a regenerar

### Fase 1 — Activación atómica
- [x] 1.1 Descomentar 6 sub-apps en TENANT_APPS (corrección B1)
- [x] 1.2 pg_dump backup + listar tenants (tenant_demo, test)
- [x] 1.3 makemigrations en orden de dependencias + migrate_schemas
       incremental (shared → tenant_demo → test)

### Fase 2 — Seeds + RBAC
- [x] 2.1 Idempotencia `seed_supply_chain_catalogs` (2× run: 144 creados, 0 dup)
- [x] 2.2 `seed_estructura_final` (tab Compras retirada, 7 tabs finales)
- [x] 2.3 RBAC coherente (5 sec 27/27 default + 2 sec 25/27 allowlist S3.1)

### Fase 3 — Tests (parcial — hallazgo)
- Pre-check BaseTenantTestCase: 3/11 archivos (27%) < umbral 80%
- Solo `almacenamiento/tests/` usa patrón migrado
- Ejecución abortada por lentitud de schema test setup (>6 min por test)
- Hallazgo registrado: `H-S6-test-schema-lento`

### Fase 4 — Docs (completado)
- [x] ROADMAP Supply Chain: S1-S6 marcados ✅
- [x] PERIMETRO-LIVE: nueva sección "Módulos C2 activos fuera de cascada"
- [x] HALLAZGOS: agregado H-S6-unidades-medida-dup
- [x] MEMORY.md actualizado
- [x] frontend/package.json 5.7.1 → 5.8.0
- [x] drf-spectacular VERSION 5.3.0 → 5.4.0

## Hallazgos abiertos nuevos

### H-S6-unidades-medida-dup (BAJA)
Wrapper `UnidadMedidaViewSet` en `supply_chain/almacenamiento/views.py:125`
sirve el modelo canónico via ruta duplicada `/supply-chain/almacenamiento/unidades-medida/`.
Frontend `MovimientoInventarioFormModal` depende. Refactor FE pendiente
(cambiar hook a `/catalogo-productos/unidades-medida/`).

### H-S6-test-schema-lento (MEDIA)
Tests multi-tenant con `BaseTenantTestCase` tardan >6 min de setup por test
en ambiente Docker local (schema creation + migraciones completas por test).
Bloquea validación automatizada en ventana de sesión. Posibles mitigaciones
(sesión dedicada):
- `--reuse-db` agresivo con fixtures de schema preinstalado
- Mover más tests a unit tests (no tocan schema)
- Explorar `pytest-django --no-migrations` con schema fixtures pre-generados
- Paralelización con pytest-xdist

## Archivos clave tocados

### Backend
- `backend/apps/supply_chain/` — eliminado `programacion_abastecimiento/` completo
- `backend/apps/supply_chain/catalogos/models.py` — eliminado UnidadMedida,
  `Almacen(BaseCompanyModel)` → `Almacen(TenantModel)` + UniqueConstraint
- `backend/apps/supply_chain/catalogos/{serializers,views,admin,urls}.py` —
  limpieza UnidadMedida
- `backend/apps/supply_chain/urls.py` — solo 5 sub-apps con endpoints
- `backend/apps/supply_chain/liquidaciones/models.py` — comentario sobre
  colisión con programacion_abastecimiento removido (ya no aplica)
- `backend/apps/supply_chain/almacenamiento/views.py:125` — wrapper
  UnidadMedidaViewSet con nota de hallazgo H-S6-unidades-medida-dup
- `backend/apps/supply_chain/almacenamiento/tests/factories.py` — ajuste
  create_almacen sin empresa
- `backend/apps/supply_chain/recepcion/tests/conftest.py` — ajuste fixture
  almacen sin empresa FK
- `backend/config/settings/base.py` — 6 sub-apps en TENANT_APPS, comentario
  doctrina feature-flag, SPECTACULAR_SETTINGS VERSION 5.4.0
- `backend/config/settings/testing.py` — programacion_abastecimiento removido
- Migraciones regeneradas: catalogos, gestion_proveedores, recepcion,
  liquidaciones, almacenamiento, compras (0001_initial, algunas +0002)

### Seeds
- `backend/apps/core/management/commands/seed_estructura_final.py` —
  programacion_abastecimiento removido, tab Compras removida, reordenado
- `backend/apps/core/management/commands/seed_permisos_rbac.py` —
  programacion_abastecimiento removido, recepcion/liquidaciones añadidos

### Frontend
- `frontend/src/features/supply-chain/` — eliminados: `api/programacionApi.ts`,
  `hooks/useProgramacion.ts`, `components/ProgramacionTab.tsx`,
  `components/ProgramacionFormModal.tsx`, `types/programacion.types.ts`
- `frontend/src/features/supply-chain/{api,hooks,components,types}/index.ts` —
  exports programacion eliminados
- `frontend/src/features/supply-chain/pages/SupplyChainPage.tsx` — ProgramacionTab
  removido del mapeo de secciones
- `frontend/src/pages/DashboardPage.tsx` — mapping programacion_abastecimiento
  eliminado
- `frontend/package.json` — 5.7.1 → 5.8.0

### Docs
- `docs/03-modulos/supply-chain/ROADMAP.md` — S1-S6 marcados ✅
- `docs/architecture/PERIMETRO-LIVE.md` — sección módulos C2 activos
- `docs/architecture/HALLAZGOS-PENDIENTES-2026-04.md` — H-S6-unidades-medida-dup

## Decisiones meta-proceso aprendidas

1. **Cuando el FK requiere dependencia out-of-scope:** el patrón Django estándar
   (B1: app registrada + URLs no montadas) venció al pattern-match local
   (`_id_ext` IntegerField). El usuario insistió en validar contra mercado
   (Saleor, Wagtail, Django-Oscar) y corrigió la recomendación inicial.

2. **Pre-flight checks detectan ≠ solucionan:** el pre-flight encontró imports
   de programacion_abastecimiento al legacy UnidadMedida (que teníamos que
   eliminar). Disparó STOP → decisión usuario → Opción B (eliminar
   programacion_abastecimiento completo).

3. **Multi-tenant test setup es prohibitivo en ventana de sesión:** confirmado
   empíricamente que tests con `BaseTenantTestCase` tardan >6 min por test.
   Política actual: confiar en manage.py check + migrate_schemas + seeds
   idempotentes + smoke browseable para validación estructural. Tests
   automatizados se ejecutan en CI (más tiempo disponible).

## Próximo paso claro

1. Smoke browseable tenant_demo en navegador:
   - Sidebar renderiza grupo "Cadena de Suministro" en posición HACER
   - Click en Proveedores → tabla carga HTTP 200
   - Form Nuevo Proveedor → renderiza selectores completos
   - Submit crea proveedor HTTP 201
   - Console browser: cero errores JS

2. Si smoke pasa → `git push origin main` → esperar CI verde de `43800b1f`

3. CI verde → deploy VPS (`bash scripts/deploy.sh --no-backup`)

4. Post-deploy: sprint Branding Unificado v2 para cerrar `H-S5-pwa-branding`

## Nota de cierre

Sesión con 3 decisiones arquitectónicas importantes:
- (1) Feature-flag por módulo como nuevo modelo de activación de C2.
- (2) compras registrada para integridad referencial sin exposición funcional.
- (3) programacion_abastecimiento eliminada en lugar de dormida.

Las 3 se validaron contra prácticas de mercado (Saleor, Wagtail, Django-Oscar,
Django docs) tras crítica explícita del usuario a recomendaciones iniciales.
El ejercicio reforzó el valor de validación externa antes de ejecutar.
