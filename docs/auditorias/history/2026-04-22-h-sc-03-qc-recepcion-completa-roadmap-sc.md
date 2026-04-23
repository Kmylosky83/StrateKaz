# Sesión 2026-04-22 — H-SC-03 QC obligatorio + refinamientos catálogo + roadmap Supply Chain

Tercera sesión del día (tras la sesión "Sidebar V3 Fase 2 + DIVIPOLA"). Se
cerró **H-SC-03 completo** (QC obligatorio por producto en recepción MP) y
se produjo el **roadmap documentado de los 5 hallazgos** para completar el
ciclo operativo de recepción MP end-to-end. Además se aplicaron varios fixes
post-deploy detectados durante smoke manual (Ciudad, sidebar, tests hseq,
useMemo deps) y una serie de refinamientos de UX en el catálogo de productos
y proveedores.

## Commits del día

| Commit | Descripción | CI |
|--------|-------------|----|
| `465f4a66` | `fix(catalogos-plataforma): useCallback en openEdit handlers para exhaustive-deps` | ✅ verde |
| `15ba7488` | `test(hseq): actualizar asserts useDocumentos con ordering='-created_at'` | ✅ verde |
| `5fff1c62` | `fix(proveedores): columna Ciudad usa ciudad_nombre tras migración FK` | ✅ verde |
| `c0059493` | `fix(sidebar): categorías antes de productos en catalogo_productos` | ✅ verde |
| `6c2228f8` | `feat(recepcion): QC obligatorio por producto en Recepción MP (H-SC-03)` | ✅ verde |
| `ba86adda` | `feat(recepcion): VoucherFormModal para crear vouchers (H-SC-03 smoke)` | ✅ verde |
| `34e6df73` | `feat(catalogo-productos): refinamientos catálogo + modalidad proveedor (H-SC-03)` | ✅ verde |
| `687d84a3` | `docs(hallazgos): roadmap Supply Chain — recepción MP end-to-end` | ⏳ en progreso |

## Estado del producto

- **CURRENT_DEPLOY_LEVEL:** L20 + L16 + supply_chain (sin cambios estructurales — H-SC-03 es extensión de modelos LIVE).
- **Tests:** Django check ✅. TypeScript tsc --noEmit ✅. Tests nuevos en `test_qc_bloqueante.py` (5 tests con BaseTenantTestCase). El setup de FastTenantTestCase es lento (>10 min) en local — validación real en CI GitHub.
- **Migraciones aplicadas en local:** 0012 (requiere_qc_recepcion), 0013 (ProductoEspecCalidadParametro), 0014 (backfill acidez), 0015 (tipos_productos_permitidos), 0016 (Proveedor.modalidad_logistica), 0017 (backfill modalidad desde precios).
- **Apps LIVE tocadas:** `catalogo_productos` (Producto, TipoProveedor, Proveedor, ProductoEspecCalidadParametro nuevo), `supply_chain.recepcion` (VoucherRecepcion.aprobar + endpoints QC), `supply_chain.gestion_proveedores` (seed), `core` (sin cambios de modelo).
- **VPS:** sin intervención en esta sesión.

## Decisiones tomadas (no reabrir)

### 1. QC obligatorio por producto — flag universal en Producto
Campo `Producto.requiere_qc_recepcion: bool` (default=False) controla el flujo. Si True, `VoucherRecepcion.aprobar()` bloquea con ValidationError hasta que exista un RecepcionCalidad. Si QC fue RECHAZADO, también bloquea. Universal en el modelo, flexible en el dato (cada tenant marca sus MPs sensibles).

### 2. Parámetros de calidad genéricos (no solo acidez)
Nuevo modelo `ProductoEspecCalidadParametro` (tabla hija de ProductoEspecCalidad) con campos `nombre_parametro`, `unidad`, `valor_min`, `valor_max`, `es_critico`. Backfill en migración 0014 migra el campo hardcoded `acidez_min/max` al nuevo modelo como `nombre_parametro='acidez'`. Los campos legacy se deprecan pero se conservan por compatibilidad.

### 3. Tipo de Proveedor → tipos de productos permitidos (configuración dinámica)
Nuevo campo `TipoProveedor.tipos_productos_permitidos: JSONField(list)`. Valores válidos: `['MATERIA_PRIMA', 'INSUMO', 'PRODUCTO_TERMINADO', 'SERVICIO']`. ProveedorFormModal filtra productos suministrables dinámicamente según el tipo seleccionado. Seed actualizado con defaults coherentes (Transportista→SERVICIO, Consultor→SERVICIO, Distribuidor→PT+INSUMO, etc.).

### 4. Producto unificado — un solo modelo con discriminador `tipo`
No se crearon modelos separados para Servicio / PT / Insumo. Mismo modelo `Producto` con campo `tipo`. Auto-código con prefijo por tipo (MP-, INS-, PT-, SV-) ya existente. SKU auto-generado desde código interno si no se provee. UI con `PageTabs` para filtrar por tipo en el listado.

### 5. Modalidad logística = atributo del Proveedor (no del Precio)
Refactor importante de Fase 1: `Proveedor.modalidad_logistica: FK(ModalidadLogistica, null=True)`. Eliminado selector de modalidad del PreciosProveedorModal (precio único por proveedor×producto). Backfill automático en migración 0017 copia la modalidad más frecuente desde PrecioMateriaPrima. Columna `PrecioMateriaPrima.modalidad_logistica` queda deprecated (preservada por compat). PreciosTab muestra columna "Modalidad" como contexto read-only por proveedor.

### 6. VoucherFormModal en supply-chain/recepcion
Modal de creación funcional (antes era un `window.alert` "pendiente"). Usa hook `useProveedores` de `catalogo_productos` (no el legacy de supply-chain). Auto-llena `precio_kg_snapshot` desde PrecioMP vigente del proveedor seleccionado. Filtra productos por proveedor. Cálculo en vivo de peso neto y valor estimado.

### 7. Race condition en reset de modales al editar — fix global
Encontrado y corregido en ProveedorFormModal (al editar no mantenía PI ni productos). Causa: `useUpdate*` invalidaba solo `.lists()`, no el `.detail()`. **Fix global en `crud-hooks-factory.ts`**: `onSuccess: (_, { id })` ahora invalida también `keys.detail(id)`. Además en ProveedorFormModal se fuerza `staleTime:0 + refetchOnMount:'always'`. Beneficia a todos los modales del proyecto que usen el factory.

### 8. Roadmap Supply Chain documentado (próximos 5 hallazgos)
Documentación completa en `docs/01-arquitectura/hallazgos-pendientes.md` de los 5 hallazgos para cerrar el ciclo recepción MP:
- **H-SC-05** (next): Sincronización Fundación ↔ Proveedores (SedeEmpresa.es_proveedor_interno → Proveedor espejo automático)
- **H-SC-02**: Liquidación sugerida individual + ajuste trazado (al aprobar voucher → Liquidacion SUGERIDA)
- **H-SC-04**: Voucher consolidado de recolección con merma (flujo real del acopio: pesaje total + sub-recibos por proveedor de punto, merma absorbida por planta)
- **H-SC-06**: Liquidación periódica (SEMANAL/QUINCENAL/MENSUAL por proveedor, Celery beat genera borradores)
- **H-SC-01**: PDF + GD + impresora térmica 58mm (independiente, puede ir en paralelo)

Orden acordado: H-SC-05 → H-SC-02 → H-SC-04 → H-SC-06 → H-SC-01.

### 9. Opción A unificación producto/servicio + configuración dinámica
Discusión arquitectónica: no separar en modelos distintos Producto vs Servicio. Mantener `Producto` con `tipo` como discriminador. Catálogo unificado con tabs visuales. Tipos de proveedor condicionan dinámicamente qué pueden suministrar. Confirmado que es la mejor práctica del mercado (evita duplicación de FK, catálogos, inventarios).

## Deuda consciente activa

- **CI del commit `687d84a3`** (roadmap docs): ⏳ en progreso al cierre. No bloqueante — es solo .md en docs/. Verificar al arranque próxima sesión.
- **PrecioMateriaPrima.modalidad_logistica deprecated**: columna preservada por compatibilidad con endpoint batch. Cleanup posterior en sesión futura (migración DROP COLUMN + limpieza FE del `BatchPrecioItem.modalidad_logistica`).
- **Tests locales de BaseTenantTestCase muy lentos**: el setup con `--keepdb` aún tarda 10+ min aplicando migraciones. Validación real se delega a CI GitHub Actions (donde corre en 3-4 min). No bloquea, pero es deuda de performance de tests.
- **Tabla de precios (PreciosTab)**: pendiente mejora UX — timeline visual de cambios de precio, diff visual (H-UI-13 documentado en hallazgos). No crítico.
- **Configuración de ModalidadLogistica sin UI de administración tenant**: hoy solo se inicializa por seed. Si un tenant quiere agregar modalidades propias (ej: "Consignación"), debe hacerlo vía admin Django. Deuda menor.
- **ProveedorFormModal — campos de identidad editables cuando es UNeg** (H-SC-05 va a cerrar esto): hoy el modelo no distingue si es proveedor interno, todos sus campos son editables. Cuando H-SC-05 aterrice, los UNegs tendrán `sede_empresa_origen` y el modal debe deshabilitar campos de identidad (gestión en Fundación).

## Próximo paso claro

**H-SC-05 — Sincronización Fundación ↔ Proveedores**. Es el "unblocker" del resto del roadmap. Estimado: 4-5h. Desbloquea H-SC-04 (necesita el recolector como Proveedor interno válido). Plan técnico ya documentado en `hallazgos-pendientes.md`. Arrancar con sesión fresca de contexto limpio aprovechando el roadmap documentado.

## Archivos clave tocados

### Backend
- `backend/apps/catalogo_productos/models.py` — Producto: campo `requiere_qc_recepcion`, auto-SKU en `save()`, registro de extensión `ProductoEspecCalidadParametro`.
- `backend/apps/catalogo_productos/extensiones/espec_calidad_parametro.py` — **nuevo** (parámetros de calidad genéricos con `cumple()`).
- `backend/apps/catalogo_productos/migrations/0012_producto_requiere_qc_recepcion.py` — **nuevo**.
- `backend/apps/catalogo_productos/migrations/0013_productoespeccalidadparametro.py` — **nuevo**.
- `backend/apps/catalogo_productos/migrations/0014_backfill_parametro_acidez.py` — **nuevo** (RunPython idempotente).
- `backend/apps/catalogo_productos/migrations/0015_tipo_proveedor_tipos_productos_permitidos.py` — **nuevo**.
- `backend/apps/catalogo_productos/migrations/0016_proveedor_modalidad_logistica.py` — **nuevo**.
- `backend/apps/catalogo_productos/migrations/0017_backfill_proveedor_modalidad_desde_precios.py` — **nuevo** (RunPython backfill).
- `backend/apps/catalogo_productos/proveedores/models.py` — TipoProveedor: `tipos_productos_permitidos`. Proveedor: `modalidad_logistica`.
- `backend/apps/catalogo_productos/proveedores/serializers.py` — expone nuevos campos + validator de tipos permitidos.
- `backend/apps/catalogo_productos/serializers.py` — ProductoSerializer expone `requiere_qc_recepcion`.
- `backend/apps/supply_chain/recepcion/models.py` — VoucherRecepcion: properties `requiere_qc`/`tiene_qc` + validación bloqueante en `aprobar()`.
- `backend/apps/supply_chain/recepcion/serializers.py` — flags QC + `RegistrarQCSerializer` con validación de parámetros críticos.
- `backend/apps/supply_chain/recepcion/views.py` — nuevos @action `aprobar`, `rechazar`, `registrar-qc`.
- `backend/apps/supply_chain/recepcion/tests/test_qc_bloqueante.py` — **nuevo** (5 tests BaseTenantTestCase).
- `backend/apps/supply_chain/gestion_proveedores/management/commands/seed_supply_chain_catalogs.py` — defaults `tipos_productos_permitidos` por tipo.

### Frontend
- `frontend/src/features/catalogo-productos/components/ProductosTab.tsx` — tabs por tipo, columna SKU, Switch DS para QC, sin precio/SKU en form.
- `frontend/src/features/catalogo-productos/components/ProveedorFormModal.tsx` — fetch detail con staleTime:0, filtro dinámico por tipo, select modalidad logística, fix race condition.
- `frontend/src/features/catalogo-productos/components/TiposProveedorTab.tsx` — MultiSelect de tipos permitidos.
- `frontend/src/features/catalogo-productos/types/catalogoProductos.types.ts` — `requiere_qc_recepcion`, `ProductoEspecCalidadParametro`.
- `frontend/src/features/catalogo-productos/types/proveedor.types.ts` — `TipoProductoPermitido`, `tipos_productos_permitidos`, `modalidad_logistica`.
- `frontend/src/features/supply-chain/components/RegistrarQCModal.tsx` — **nuevo** (BaseModal con inputs por parámetro, validación en vivo).
- `frontend/src/features/supply-chain/components/VoucherFormModal.tsx` — **nuevo** (formulario completo con auto-fill de precio).
- `frontend/src/features/supply-chain/components/RecepcionTab.tsx` — botones "Aprobar" / "Registrar QC" + integración modales.
- `frontend/src/features/supply-chain/components/PreciosProveedorModal.tsx` — eliminado selector de modalidad (precio único).
- `frontend/src/features/supply-chain/components/PreciosTab.tsx` — columna "Modalidad" como contexto.
- `frontend/src/features/supply-chain/api/recepcionApi.ts` — `aprobar`, `rechazar`, `registrarQC`.
- `frontend/src/features/supply-chain/hooks/useRecepcion.ts` — hooks nuevos para transiciones.
- `frontend/src/features/supply-chain/types/recepcion.types.ts` — `requiere_qc`, `tiene_qc`, `RegistrarQCDTO`, `cumplimiento_specs`.
- `frontend/src/lib/crud-hooks-factory.ts` — **fix global**: `useUpdate` invalida también `keys.detail(id)`.

### Docs
- `docs/01-arquitectura/hallazgos-pendientes.md` — 5 hallazgos nuevos de roadmap Supply Chain (+244 líneas).

## Hallazgos abiertos

- **H-SC-05** — Sincronización Fundación ↔ Proveedores: severidad **ALTA**. Next. Bloquea H-SC-04.
- **H-SC-02** — Liquidación sugerida individual + ajuste trazado: severidad **ALTA**. Después de H-SC-05.
- **H-SC-04** — Voucher consolidado de recolección con merma: severidad **ALTA**. Corazón operativo. Depende de H-SC-05 y H-SC-02.
- **H-SC-06** — Liquidación periódica por proveedor: severidad **ALTA**. Cierra ciclo de pago. Depende de H-SC-02 y H-SC-04.
- **H-SC-01** — PDF + GD + impresora térmica 58mm: severidad **MEDIA**. Independiente, puede ir en paralelo.
- **H-UI-13** — Timeline visual cambios de precio en PreciosTab: severidad **MEDIA**. Deferido.
- **H-SEED-01** (de auditoría anterior): seeds con `update_or_create` vs create-only. Deferido sin impacto en deploy actual.

---

## Datos clave

- **Commits de la sesión**: 8.
- **Migraciones aplicadas en local**: 6 (0012 → 0017) — 2 con RunPython idempotente.
- **Tests nuevos**: 5 en `test_qc_bloqueante.py` (BaseTenantTestCase).
- **Modelos tocados**: Producto (+1 campo), TipoProveedor (+1 campo), Proveedor (+1 FK), VoucherRecepcion (+2 properties + método aprobar() con validación).
- **Modelos nuevos**: 1 (ProductoEspecCalidadParametro).
- **Archivos FE nuevos**: 2 (RegistrarQCModal, VoucherFormModal).
- **Fix de factory global**: 1 línea agregada en crud-hooks-factory → beneficia ~15 features.
- **Hallazgos documentados para próximas sesiones**: 5 (H-SC-01/02/04/05/06).
