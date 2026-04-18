# Sesión 2026-04-17 — Cierre Sesión 3 Supply Chain (VoucherRecepcion + Liquidacion + TipoAlmacen)

## Commits del día

| Commit | Descripción | CI |
|--------|-------------|----|
| `02b9c4ea` | docs(supply-chain): add ROADMAP with 5-session plan (S3-S5 scope) | ⏳ no pusheado |
| `dcc4e2cd` | feat(supply-chain): S3 models + eliminar RecepcionCompra legacy | ⏳ no pusheado |
| `a702293a` | feat(supply-chain): S3 serializers + viewsets + URLs + cleanup frontend legacy | ⏳ no pusheado |
| `3c3bebd6` | feat(supply-chain): S3 frontend features Recepcion + Liquidaciones + TipoAlmacen | ⏳ no pusheado |

Total: **58 archivos tocados, +5308/-619 líneas**. 4 commits ahead de `origin/main`.

## Estado del producto

- **CURRENT_DEPLOY_LEVEL:** 20 (sin cambio — `sc_recepcion` y `liquidaciones` siguen pre-LIVE en `testing.py` solamente).
- **Tests nuevos:** ~30 tests backend escritos (19 `sc_recepcion` + 11 `liquidaciones`). **Ejecución 1 (29 min): 1 error en setup por fixture bug.** Fix aplicado en esta misma sesión (conftest.py), NO re-corrido (nuevo run tardaría ~30 min adicionales con Patrón B). Verificación real se hace al inicio de próxima sesión.
- **Django check:** limpio (0 issues).
- **TypeScript check:** limpio (`npx tsc --noEmit` sin errores).
- **Gate CI bloqueante:** no verificado (no hubo push).
- **Apps LIVE tocadas:** `catalogos/` ampliada con `TipoAlmacen`. `compras/` (pre-LIVE) limpiada de `RecepcionCompra` — afecta código no activado.
- **Sub-apps nuevas (pre-LIVE):** `apps.supply_chain.recepcion` (label `sc_recepcion`) + `apps.supply_chain.liquidaciones`.
- **Frontend:** 2 features nuevas (`RecepcionTab`, `LiquidacionesTab`) + `CatalogosTab` extendido. Design System aplicado en todos (Card, Badge, KpiCard, SectionToolbar, Spinner, EmptyState, ConfirmDialog).

## Decisiones tomadas (no reabrir)

### 1. OC nullable sin validación restrictiva (cambio respecto a plan inicial)
- `VoucherRecepcion.orden_compra` es FK nullable **sin `clean()` que restrinja por `tipo_entidad`**.
- Razón: el negocio puede necesitar OC para MP en el futuro (contratos de suministro a largo plazo). No amarrar la regla a nivel modelo permite que evolucione sin migración.
- El uso típico (MP sin OC / productos-servicios con OC) se gobierna por UI/proceso, no por modelo.
- Ver `docs/03-modulos/supply-chain/ROADMAP.md` sección 2.

### 2. Label `sc_recepcion` (no `recepcion`)
- `apps.supply_chain.recepcion` usa `label = 'sc_recepcion'` para evitar colisión con `apps.production_ops.recepcion` (que usa label auto = `recepcion`).
- Convención: prefijo `sc_` cuando haya potencial de colisión con otro módulo.

### 3. `db_table = 'supply_chain_liquidacion_recepcion'` (no `supply_chain_liquidacion`)
- Colisiona con legacy `programacion_abastecimiento.Liquidacion` (out-of-scope del roadmap actual).
- Agregado el sufijo `_recepcion` para separar semánticamente.

### 4. Principio fundacional "universal vs específico por industria" (reafirmado)
- `TipoAlmacen` (silo/contenedor/pallet/piso) queda como **catálogo universal**.
- Validado contra mejores prácticas WMS (SAP, Odoo): Storage Type es universal en todo ERP de WMS.
- Decisión consistente con `docs/01-arquitectura/modular-tenancy.md` (doctrina creada en S2).

### 5. Precio snapshot inmutable en Voucher (aplicación de decisión S2)
- `VoucherRecepcion.precio_kg_snapshot` es copia inmutable de `PrecioMateriaPrima.precio_kg` al momento de crear el voucher.
- Garantiza que cambios futuros en precio maestro no alteren liquidaciones ya emitidas.
- Validado con test (`TestPrecioSnapshot.test_cambio_precio_maestro_no_afecta_voucher_existente`).

### 6. `modalidad_entrega` TextChoices (no null semántico)
- `DIRECTO / TRANSPORTE_INTERNO / RECOLECCION` explícitos.
- Modalidad `RECOLECCION` **sí** exige `uneg_transportista` en `clean()` (única validación de negocio en el modelo).

### 7. `RecepcionCompra` legacy eliminada en bloque (backend + frontend)
- Backend: 6 archivos limpiados (models, serializers, views, urls, admin, tests).
- Frontend: 5 archivos limpiados (types, api, hooks, index, ComprasTab sección).
- Migración `compras/0001_initial.py` regenerada limpia sin RecepcionCompra.
- Acción `registrar_recepcion` en `OrdenCompraViewSet` eliminada.
- Razón: diseño incompatible (exigía OC obligatoria, no aplica a scale-based).

### 8. Frontend route-based respeta arquitectura existente
- Nuevas rutas `/supply-chain/recepcion` y `/supply-chain/liquidaciones` agregadas a `SECTION_MAP` en `SupplyChainPage.tsx`.
- Sidebar será quien controle visibilidad (seed de `SystemModule` se actualiza en S5 activación).

## Deuda consciente activa

### Deuda técnica documentada
- **H-S3-1**: Primera ejecución del pytest de S3 falló en `setup` del fixture `empresa` (error: `EmpresaConfig() got unexpected keyword argument 'nombre'`). Fix aplicado en `recepcion/tests/conftest.py`: (1) `razon_social` en vez de `nombre` en EmpresaConfig; (2) `SedeEmpresa` no tiene FK `empresa` — eliminado del kwargs; (3) agregados `direccion`, `ciudad`, `departamento='CUNDINAMARCA'` que son required en SedeEmpresa. Conftest sintácticamente OK post-fix (`ast.parse` ✅). Verificar con `pytest apps/supply_chain/recepcion/tests apps/supply_chain/liquidaciones/tests` al inicio de próxima sesión (toma ~25-30 min por Patrón B).
- **H-S3-2**: `VoucherFormModal` no implementado — hoy es placeholder con `alert()`. Hay que construir form completo con RHF + Zod + selectores (Proveedor, Producto, Almacén, UNeg transportista). Marcado con `TODO(S3.1)` en el código.
- **H-S3-3**: `Sections.RECEPCION_MP_SC` no existe en `constants/permissions.ts`. Hoy se reusa `Sections.ORDENES_COMPRA` como permiso transversal. Requiere agregar sección nueva + seed RBAC en backend.
- **H-S3-4**: Vitest smoke tests no escritos para los 3 features nuevos (Recepcion, Liquidaciones, TipoAlmacen).
- **H-S3-5**: `signal.py` en `sc_recepcion/` es placeholder. El signal Voucher APROBADO → `MovimientoInventario` se implementa en S4 cuando `almacenamiento/` se reescriba con FK Producto.

### Deuda heredada (no atendida, por diseño roadmap)
- 9 call sites en `production_ops/recepcion` referencian `TipoMateriaPrima` — migración a `Producto` en S4 (hereda de S2).
- `compras/` sub-app reducida: legacy `OrdenCompra`/`Requisicion`/`Cotizacion`/`Contrato` siguen como `models.Model` (no TenantModel). Se reescriben cuando el negocio pida OC real (out-of-scope roadmap actual).
- `programacion_abastecimiento/` queda dormida. Evaluar borrar en S5 o cuando se active MRP.
- `almacenamiento/` continúa con diseño legacy (strings sueltos, sin TenantModel, sin FK Producto). Se reescribe completo en S4.

## Próximo paso claro

**Sesión 4 Supply Chain**: Reescribir `almacenamiento/` limpio + signal Voucher→MovimientoInventario + migrar 9 call sites production_ops.

Antes de arrancar S4:
1. Verificar tests S3 pasan (o arreglar si hay fallas).
2. Completar `VoucherFormModal` con RHF + Zod (H-S3-2).
3. Agregar `Sections.RECEPCION_MP_SC` (H-S3-3).

## Archivos clave tocados

### Backend — Nuevos
- `backend/apps/supply_chain/recepcion/` (8 archivos: apps, models, serializers, views, urls, admin, signals, tests)
- `backend/apps/supply_chain/liquidaciones/` (8 archivos: apps, models, serializers, views, urls, admin, tests)
- `backend/apps/supply_chain/recepcion/migrations/0001_initial.py`
- `backend/apps/supply_chain/liquidaciones/migrations/0001_initial.py`
- `backend/apps/supply_chain/catalogos/migrations/0001_initial.py` (primera migración ever para catalogos)
- `backend/apps/supply_chain/compras/migrations/0001_initial.py` (primera migración ever para compras, sin RecepcionCompra)

### Backend — Modificados
- `backend/apps/supply_chain/catalogos/models.py` — `TipoAlmacen` + FK en `Almacen` + `capacidad_maxima`
- `backend/apps/supply_chain/catalogos/{serializers,views,urls,admin}.py` — CRUD de `TipoAlmacen`
- `backend/apps/supply_chain/compras/{models,serializers,views,urls,admin}.py` — `RecepcionCompra` eliminada
- `backend/apps/supply_chain/compras/tests/test_models.py` — `TestRecepcionCompra` eliminado
- `backend/apps/supply_chain/urls.py` — registra `recepcion/`, `liquidaciones/`, `catalogos/`
- `backend/config/settings/testing.py` — registra `apps.supply_chain.recepcion` + `apps.supply_chain.liquidaciones`

### Frontend — Nuevos
- `frontend/src/features/supply-chain/types/recepcion.types.ts`
- `frontend/src/features/supply-chain/types/liquidaciones.types.ts`
- `frontend/src/features/supply-chain/api/recepcionApi.ts`
- `frontend/src/features/supply-chain/api/liquidacionesApi.ts`
- `frontend/src/features/supply-chain/hooks/useRecepcion.ts`
- `frontend/src/features/supply-chain/hooks/useLiquidaciones.ts`
- `frontend/src/features/supply-chain/hooks/useTiposAlmacen.ts`
- `frontend/src/features/supply-chain/components/RecepcionTab.tsx`
- `frontend/src/features/supply-chain/components/LiquidacionesTab.tsx`

### Frontend — Modificados
- `frontend/src/features/supply-chain/components/CatalogosTab.tsx` — extendido con `TipoAlmacen`
- `frontend/src/features/supply-chain/components/ComprasTab.tsx` — `RecepcionesSection` + tab eliminadas
- `frontend/src/features/supply-chain/hooks/{useCompras,index}.ts` — 6 hooks legacy + keys eliminados
- `frontend/src/features/supply-chain/api/comprasApi.ts` — `recepcionApi` eliminado
- `frontend/src/features/supply-chain/types/{compras.types,index}.ts` — 4 interfaces legacy eliminadas
- `frontend/src/features/supply-chain/pages/SupplyChainPage.tsx` — rutas `recepcion` + `liquidaciones` agregadas

### Documentación
- `docs/03-modulos/supply-chain/ROADMAP.md` — **NUEVO**, plan de 5 sesiones consolidado

## Hallazgos abiertos

Ver sección "Deuda consciente activa" arriba (H-S3-1 a H-S3-5). Severidad:
- **H-S3-1** (tests sin confirmar): MEDIA — bloqueante para CI verde al pushear, no bloqueante para continuar diseño.
- **H-S3-2** (VoucherFormModal placeholder): MEDIA — funcionalidad UI incompleta pero listado funciona.
- **H-S3-3** (sección permissions): BAJA — solo afecta RBAC granular, hoy se reusa otra sección.
- **H-S3-4** (Vitest smoke): BAJA — cobertura FE.
- **H-S3-5** (signal placeholder): BAJA — planeado para S4 por diseño.

Ninguno bloqueante para continuar a S4.
