# Sesión 2026-04-19 (S7) — Consolidación CT: UnidadMedida + MateriaPrima + RBAC fixes

> Sesión maratónica post-cierre S6. Doctrina Camilo: *"catalogo_productos
> es la única fuente de verdad. En supply_chain no pueden existir
> catálogos. Eliminar, no deprecar."* Aplicada en 2 refactors arquitectónicos
> grandes (UnidadMedida + MateriaPrima) + fixes colaterales de RBAC y cargos.

## Commits del día (15 commits, todos post `94212c5f`)

| # | Commit | Descripción | CI |
|---|--------|-------------|----|
| 1 | `128402b3` | fix(supply-chain): Subquery usuarios_vinculados + rutas FE + canCreate | ⏳ superseded |
| 2 | `416073ac` | feat(catalogo-productos): autocódigo en CategoriaProducto | ⏳ superseded |
| 3 | `a1f7d911` | refactor(sidebar): retirar FormaPago + TipoDocumento de SC | ⏳ superseded |
| 4 | `6b259ce0` | feat(supply-chain): seed CategoriaMP + TipoMP + TipoAlmacen | ⏳ superseded |
| 5 | `6f7e517a` | feat(catalogo-productos): fortalecer UnidadMedida con campos legacy | ⏳ superseded |
| 6 | `fadb241b` | refactor(unidad-medida): migrar datos legacy + FK SedeEmpresa | ⏳ superseded |
| 7 | `79596df8` | refactor(configuracion): reescribir 9 consumidores UnidadMedida | ⏳ superseded |
| 8 | `27217b21` | refactor(organizacion): eliminar UnidadMedida legacy + RemoveModel | ⏳ superseded |
| 9 | `ba05fef2` | chore: bump 5.9.0 + docs consolidación S7 UnidadMedida | ⏳ superseded |
| 10 | `d7219e65` | chore(seeds): retirar cargos del pipeline auto + fix bug `update(is_system)` | ⏳ superseded |
| 11 | `4b47c24d` | feat(rbac): cargo delete físico en vez de soft-delete | ⏳ superseded |
| 12 | `7d81d63f` | fix(rbac): enriquecer permission_codes con tab-level view | ⏳ superseded |
| 13 | `4b585204` | docs(rbac): roadmap v5 + hallazgo refactor escalable | ⏳ superseded |
| 14 | `9b7ce86a` | refactor(seeds): sacar CategoriaMP/TipoMP del seed universal | ⏳ superseded |
| 15 | `79a516ae` | **refactor(supply-chain): unificar MateriaPrima en catalogo_productos (CT)** | ⏳ in_progress al cierre (CodeQL #944 ✅) |

**Nota CI:** GitHub Actions canceló runs intermedios al push siguiente (comportamiento estándar). El CI del cabeza `79a516ae` (#928) está en marcha. CodeQL (#944) ya pasó ✅.

## Estado del producto

- **CURRENT_DEPLOY_LEVEL:** 20 (sin cambio — refactor CT, no activación de módulo)
- **Versión frontend:** 5.9.0 (bump por refactor arquitectónico CT consolidación UnidadMedida)
- **Versión frontend al final:** sin bump adicional tras MateriaPrima (pendiente decisión: ¿5.9.1 o 5.10.0 post-deploy?)
- **Migraciones aplicadas** (public + tenant_demo + test):
  - `catalogo_productos.0005` (+7 campos UnidadMedida)
  - `catalogo_productos.0006` (data migration UnidadMedida legacy → canónico)
  - `gestion_estrategica.configuracion.0004` (AlterField `SedeEmpresa.unidad_capacidad` → canónico)
  - `gestion_estrategica.organizacion.0004` (RemoveModel UnidadMedida legacy)
  - `gestion_proveedores.0002` (+M2M `Proveedor.productos_suministrados`)
  - `gestion_proveedores.0003` (data migration 12 TipoMP → 13 Productos + 6 Cats)
  - `gestion_proveedores.0004` (RemoveField + RemoveModel TipoMateriaPrima/CategoriaMateriaPrima)
- **Manage.py check:** ✅ 0 issues (development + testing settings)
- **TypeScript:** ✅ clean
- **Test R7 cascade delete:** ✅ PASSED (22 min — confirma `H-S6-test-schema-lento`)
- **Cleanup DB manual** aplicado en tenant_demo + test:
  - `DROP COLUMN tipo_materia_id` en `supply_chain_precio_materia_prima` y `_historial_precio`
  - `DROP TABLE` `supply_chain_tipo_materia_prima`, `_categoria_materia_prima`, `_proveedor_tipos_materia_prima`
  - `CREATE UNIQUE INDEX uq_precio_proveedor_producto_active`
- **Backup pre-consolidación UnidadMedida:** `/tmp/stratekaz-backups/pre_unidad_medida_consolidation_20260419_2009.sql` (4.1M)
- **Apps LIVE tocadas:** `catalogo_productos`, `supply_chain.gestion_proveedores`, `gestion_estrategica.organizacion`, `gestion_estrategica.configuracion`, `core` (rbac utils). Guards defensivos en `production_ops` (no-LIVE).

## Decisiones arquitectónicas (no reabrir)

### 1. CT-layer es source-of-truth único para dato maestro
*"catalogo_productos es la única fuente de verdad. En supply_chain no pueden existir catálogos."* (Camilo, 2026-04-19).

Aplica a **todos los módulos C2 actuales y futuros**:
- Unidades de medida → `catalogo_productos.UnidadMedida`
- Productos (incl. materias primas) → `catalogo_productos.Producto` con `tipo ∈ {MATERIA_PRIMA, INSUMO, PRODUCTO_TERMINADO, SERVICIO}`
- Categorías de producto → `catalogo_productos.CategoriaProducto` (jerárquica)

Módulos C2 se conectan vía M2M: `Proveedor.productos_suministrados`, `VoucherRecepcion.producto`, etc. Nunca un C2 crea su propio catálogo. Patrón SAP MM / Odoo product.product / NetSuite Inventory Item.

### 2. Nivel jerárquico del cargo NO decide RBAC
*"El nivel del cargo no debería solapar el control RBAC, eso es innecesario y confuso."* (Camilo, 2026-04-19).

Hoy el signal `_create_default_accesses` asigna permisos por nivel (ESTRATEGICO → todo, TACTICO → view/edit, OPERATIVO → view). Esto está **documentado como deuda** (`H-S7-rbac-v5-refactor`) pero NO se refactorizó en esta sesión porque es trabajo de 4-5 días.

`nivel_jerarquico` debe quedar como metadata pura (organigrama, reporting, nómina). RBAC debe ser capability-flat + PermissionTemplate reutilizable. Ver `docs/architecture/RBAC-V5-ROADMAP.md`.

### 3. Seeds de data de negocio fuera del pipeline automático
Tres decisiones consistentes:

- **Cargos**: `seed_cargos_base` fuera de `deploy_seeds_all_tenants`. Corre 1 vez en creación de tenant; deploys a VPS NO lo ejecutan.
- **MP específica de industria**: eliminada del seed universal `seed_supply_chain_catalogs`. El canónico `seed_catalogo_productos_base` solo tiene 12 unidades de medida estándar (kg, L, m, und, etc.).
- **Seed demo industria**: concepto deprecated. Eliminado `seed_supply_chain_demo_data` (que creé por error mezclando demo con universal). Clientes específicos configuran sus productos desde UI `/catalogo-productos/productos`.

### 4. Hard delete de cargos (no soft) + seed off pipeline
`CargoViewSet.perform_destroy` ahora hace `instance.delete()` físico. Consistente con la doctrina: si el admin elimina, el seed no lo recrea automáticamente (porque no se ejecuta en deploys). Integridad FK preservada: bloqueo si hay usuarios asignados.

### 5. Tab-level permission codes (fix táctico RBAC)
`compute_user_rbac` ahora agrega `modulo.tab_code.view` a `permission_codes` si el user tiene al menos 1 sub-sección del tab con `can_view=True`. Desbloquea rutas FE que pasaban `tab_code` como `sectionCode` a `withFullGuard`.

Este es un **fix táctico** (+25 LOC). La solución definitiva vive en el refactor v5 (Hybrid RBAC + Navigation separado de Permissions).

### 6. `tipos_materia_prima` → `productos_suministrados` (eliminar no deprecar)
Refactor destructivo con migración de datos:
- **Paso 1**: Crear 6 `CategoriaProducto` equivalentes a `CategoriaMateriaPrima` (match por nombre)
- **Paso 2**: Crear 12 `Producto` con `tipo=MATERIA_PRIMA` equivalentes a `TipoMateriaPrima`
- **Paso 3**: Poblar `Proveedor.productos_suministrados` M2M usando mapping
- **Paso 4**: Poblar `PrecioMateriaPrima.producto` FK desde `tipo_materia`
- **Paso 5**: Poblar `HistorialPrecioProveedor.producto` FK
- **Paso 6**: RemoveField + RemoveConstraint + RemoveModel (con RunSQL defensivo para resolver FieldError en condition de constraint)

production_ops (no-LIVE) refactorizado: `ConsumoMateriaPrima.tipo_materia_prima` → `.producto` FK al canónico. Guards `try/except LookupError` en `recepcion/models.py` para `cumple_acidez` property.

## Deuda consciente activa

### Hallazgos registrados (ver `HALLAZGOS-PENDIENTES-2026-04.md`)

- **`H-S7-rbac-v5-refactor`** (MEDIA-ALTA) — refactor completo del RBAC a arquitectura Hybrid (PermissionTemplate + capability-flat + Navigation separado). **Trigger crítico:** antes del Sprint S8 (Production Ops). Plan completo en `docs/architecture/RBAC-V5-ROADMAP.md`.
- **`H-S7-seed-industrias-templates`** (BAJA) — wizard UI de plantillas por industria (rendering, manufactura, servicios, retail, farmacéutica). Mitigación parcial ya aplicada (data específica fuera del seed universal).
- **`H-S7-geo-catalog-location`** (BAJA) — evaluar mover Departamentos/Ciudades a Configuración → Catálogos.
- **`H-S7-unidad-base-conflicto`** (BAJA) — inconsistencia jerárquica VOLUMEN post-merge (Litro apunta a Metro cúbico con factor=1.0).
- **`H-S7-supply-chain-tabla-unidad-medida-huerfana`** (BAJA) — tabla `supply_chain_unidad_medida` huérfana de S6.
- **`H-S6-unidades-medida-dup`** → ⚠️ PARCIAL (duplicación grande ELIMINADA; queda wrapper menor en `supply_chain/almacenamiento/views.py`).

### Deuda específica del refactor MateriaPrima (commit `79a516ae`)

No registrada como hallazgo formal pero documentada en el commit:
- Hooks legacy en `frontend/src/features/supply-chain/hooks/useCatalogos.ts`:
  `useCategoriasMateriaPrima`, `useCreateCategoriaMateriaPrima`, `useUpdateCategoriaMateriaPrima`, `useDeleteCategoriaMateriaPrima`, `useCreateTipoMateriaPrima`, `useUpdateTipoMateriaPrima`, `useDeleteTipoMateriaPrima` — siguen en el código pero apuntan a endpoints BE que ya no existen. Fetch dará 404 silencioso si alguien los invoca. Tsc no falla (tipos existen). Limpiar en próxima sesión.
- API clients en `supply-chain/api/catalogos.api.ts`: `categoriaMateriaPrimaApi`, `tipoMateriaPrimaApi` + sus DTOs. Idem.
- Types legacy en `supply-chain/types/catalogos.types.ts`: `CategoriaMateriaPrima`, `TipoMateriaPrima`, `CreateCategoriaMateriaPrimaDTO`, `UpdateTipoMateriaPrimaDTO`, etc. No se usan activamente (el hook principal apunta al canónico Producto).
- Entries `categorias-mp` y `tipos-mp` en `supply-chain/components/CatalogosTab.tsx`: parcialmente retirados en commit `a1f7d911` (que retiró FormaPago/TipoDocumento). Los de MP aún muestran selectores en el selector de catálogos, pero al cargar datos dan 404. Completar limpieza en próxima sesión.

### Deploy VPS pendiente
CI del commit cabeza `79a516ae` estaba **in_progress al cierre de sesión**. Deploy VPS NO ejecutado todavía. Requiere:
1. CI verde completo
2. Backup VPS pre-deploy
3. `bash scripts/deploy.sh --no-backup` (o con backup si Camilo prefiere)
4. Post-deploy:
   - `python manage.py migrate_schemas` en VPS (aplicar 0003/0004 de gestion_proveedores)
   - Si migración destructiva falla en VPS por constraint residual: aplicar cleanup SQL manual equivalente al aplicado en tenant_demo/test
   - `deploy_seeds_all_tenants --only supply_chain catalogo_productos consecutivos`
5. Smoke browseable en `stratekaz.com`:
   - `/supply-chain/proveedores` → crear proveedor MP con selector de Productos canónicos
   - `/catalogo-productos/unidades-medida` → ver las 19 unidades consolidadas
   - `/mi-equipo/cargos` → eliminar físicamente un cargo y verificar que no se recrea en próximo deploy

## Próximo paso claro

1. **Verificar CI verde** de `79a516ae` en GitHub Actions.
2. **Si CI verde** → deploy VPS con backup + migrate_schemas + smoke en prod.
3. **Si CI rojo** → fix + re-push antes de deploy.
4. **Post-deploy** → cleanup FE de hooks/types/api legacy de TipoMateriaPrima (1-2h, 1 commit).

## Archivos clave tocados (por orden de importancia)

### Backend core
- `backend/apps/catalogo_productos/models.py` — UnidadMedida fortalecido (+7 campos, +5 métodos)
- `backend/apps/catalogo_productos/migrations/0005` + `0006` — schema + data migration UnidadMedida
- `backend/apps/supply_chain/gestion_proveedores/models.py` — eliminados `TipoMateriaPrima` + `CategoriaMateriaPrima`; agregado `Proveedor.productos_suministrados` M2M
- `backend/apps/supply_chain/gestion_proveedores/migrations/0002` + `0003` + `0004` — schema + data + remove destructivo MateriaPrima
- `backend/apps/supply_chain/gestion_proveedores/{serializers,viewsets,urls,admin,filters}.py` — limpios de MateriaPrima legacy
- `backend/apps/gestion_estrategica/organizacion/models.py` + `models_unidades.py` (eliminado) — UnidadMedida legacy borrado
- `backend/apps/gestion_estrategica/configuracion/{utils_unidades,serializers,models,stats_views}.py` — reapuntados al canónico
- `backend/apps/core/utils/rbac.py` — tab-level permission codes enrichment
- `backend/apps/core/viewsets_rbac.py` — hard delete Cargo
- `backend/apps/core/management/commands/{deploy_seeds_all_tenants,seed_cargos_base}.py` — cargos fuera del pipeline

### Backend production_ops (no-LIVE, guards)
- `backend/apps/production_ops/procesamiento/models.py` + `admin.py` — `ConsumoMateriaPrima.producto`
- `backend/apps/production_ops/recepcion/models.py` — guards `try/except LookupError`

### Frontend
- `frontend/src/features/supply-chain/components/ProveedorForm.tsx` — `productos_suministrados`
- `frontend/src/features/supply-chain/hooks/useCatalogos.ts` — `useTiposMateriaPrima` ahora consume canónico
- `frontend/src/features/configuracion-admin/components/catalogs/CatalogGeneralTab.tsx` — UnidadMedida pill retirada
- `frontend/src/features/configuracion-admin/hooks/useConfigAdmin.ts` — apunta a canónico
- `frontend/src/features/supply-chain/components/AlmacenamientoTab.tsx` — fix `canCreate` en 4 sub-componentes
- `frontend/src/routes/modules/supply-chain.routes.tsx` — rutas recepcion/liquidaciones agregadas, programacion eliminada
- `frontend/package.json` — 5.8.0 → 5.9.0

### Docs
- `docs/history/2026-04-19-consolidacion-catalogos-unidad-medida.md` — cierre UnidadMedida
- `docs/architecture/RBAC-V5-ROADMAP.md` — roadmap refactor escalable (394 LOC)
- `docs/architecture/HALLAZGOS-PENDIENTES-2026-04.md` — 5 hallazgos nuevos registrados

### Seeds
- `backend/apps/supply_chain/gestion_proveedores/management/commands/seed_supply_chain_catalogs.py` — solo universal (sin data industria)
- Eliminado: `seed_supply_chain_demo_data.py`
- Eliminados: `cargar_unidades_sistema.py`, `migrar_capacidades_kg.py` (legacy post-UnidadMedida consolidación)

## Decisiones meta-proceso aprendidas

1. **Seeds como diagnóstico de doctrina:** cada vez que Camilo vio data específica de industria en un tenant, detectó un anti-pattern arquitectónico. Seeds deben ser **estructura universal**, nunca data de negocio.

2. **"Eliminar, no deprecar" requiere planificación de migración de datos ANTES:** el refactor de MateriaPrima tomó 8+ horas porque había que escribir migraciones RunPython con mapping explícito + defensas contra FieldError en constraint conditions.

3. **Patrón RunSQL defensivo para constraints con Q condition:** cuando Django genera RemoveConstraint con condition que referencia el campo que se va a eliminar, hay que usar `migrations.RunSQL(DROP CONSTRAINT IF EXISTS..., state_operations=[RemoveConstraint])`. Alternativa: reordenar operations (primero RemoveConstraint, luego RemoveField).

4. **Aplicación parcial de migración destructiva multi-tenant:** si la migración falla en un tenant pero se marca como aplicada en public (state-only), hay que hacer cleanup SQL manual en cada tenant afectado. Precaución importante para deploys a VPS con múltiples tenants reales.

5. **Guards cross-C2 con `apps.get_model` ya estaban bien diseñados:** production_ops usaba lookup dinámico (no FK directo) para `TipoMateriaPrima`. Solo hubo que envolver con `try/except LookupError` para que el código no crashee tras la eliminación.

## Nota de cierre

Sesión de **~8-10 horas netas** con 15 commits, ~1900 LOC neto eliminado (delta positivo). 2 refactors arquitectónicos mayores (UnidadMedida + MateriaPrima) más 1 plan documentado (RBAC v5). Fix colateral de 5 bugs críticos (500 proveedores, 404 rutas FE, canCreate almacenamiento, seeds cargos, tab-level RBAC).

La sesión valida la tesis: **consolidar CT-layer ANTES de activar Production Ops es crítico**. Cada módulo C2 nuevo bajo el modelo viejo (TipoMateriaPrima, UnidadMedida legacy) habría multiplicado la deuda. Con esta sesión supply_chain LIVE queda arquitectónicamente profesional y sirve de referencia para los próximos C2.

Deploy VPS queda **pendiente** al cierre (CI in_progress). Próxima sesión debe arrancar verificando CI verde y ejecutando deploy con backup.
