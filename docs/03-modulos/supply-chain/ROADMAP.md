# Supply Chain — Roadmap de Activación

## 1. Modelo de negocio

Scale-based Procurement / Acopio con báscula. El tenant recibe materia prima de proveedores (directos o vía unidades internas de recolección), pesa, opcionalmente aplica QC, emite voucher (documento primario), ingresa a inventario y liquida según precio negociado.

**Flujo MP (hoy):** proveedor llega → pesaje → voucher recepción (sin OC) → liquidación (kg × precio snapshot) → ingreso inventario (silo/contenedor/bodega) → datos a BI C3.

**Regla de negocio OC (estado actual, NO enforced a nivel modelo):**
- **MP (materia prima)** → hoy típicamente SIN OC. **Puede cambiar a futuro** si el negocio requiere OC para MP (ej: contratos de suministro a largo plazo).
- **Productos / Servicios** (equipos, repuestos, servicios tercerizados) → típicamente CON OC — reescritura de `compras/` fuera de alcance esta iteración.

**Decisión técnica:** el campo `orden_compra` es FK nullable **sin validación restrictiva** a nivel modelo. El uso se gobierna por UI / proceso de negocio, permitiendo que la regla evolucione sin migraciones.

**`modalidad_entrega`** en `VoucherRecepcion`: `DIRECTO` / `TRANSPORTE_INTERNO` / `RECOLECCION` (TextChoices, no null semántico).

**`tipo_entidad`** en `Proveedor` (S2): `proveedor_mp` / `proveedor_servicio` / `unidad_interna`.

Portal proveedor = fase 2. Pago real = L70-L72 (Tesorería / Accounting).

---

## 2. Decisiones tomadas (no reabrir)

### Cuadro universal vs tenant

| Concepto | Clasificación | Ubicación / Resolución |
|---|---|---|
| Tipo de Proveedor (MP / Servicios / Interno) | Universal | `Proveedor.tipo_entidad` (cerrado S2) |
| UNeg como Operación / Recolección / Autónoma | Universal (patrón) + Tenant (config) | Flags existentes `SedeEmpresa.es_proveedor_interno`, `es_centro_acopio`. NO crear entidades nuevas. |
| Materia Prima / Producto (catálogo maestro) | Universal | `catalogo_productos.Producto` (CT-layer, S1) |
| Flujo recepción sin OC (MP) | Universal | `VoucherRecepcion` nuevo — S3 |
| Flujo recepción con OC (servicios / equipos) | Universal | Campo `orden_compra` nullable en Voucher. Fuera de alcance esta iteración. |
| QC opcional en recepción | Plantilla universal (S2) + Resultado tenant (nuevo) | `ProductoEspecCalidad` (S2) + `RecepcionCalidad` nuevo (S3) |
| Ubicación física (silo / contenedor / pallet) | Universal (catálogo tipo) | `TipoAlmacen` nuevo — S3 |
| Liquidación (kg × precio) | Universal | `Liquidacion` nuevo, sub-app propia — S3 |
| Precio | Universal | `PrecioMateriaPrima` cerrado S2, sin cambios |

### Respuestas a preguntas planteadas

- **Q1 — Roles proveedor:** se mantienen tal cual. `tipo_entidad` no se toca.
- **Q2 — Precio:** depende solo de Proveedor → Producto. No existe tabla "cliente final". `PrecioMateriaPrima` queda intacto.
- **Q3 — Ubicación física:** solo catálogo `TipoAlmacen` (silo / contenedor / pallet / piso). Sin bins específicos.
- **Q4 — `RecepcionCompra` legacy:** se elimina. No está LIVE, diseño incompatible (exige OC obligatoria).
- **Q5 — Modalidad entrega:** TextChoices (`DIRECTO` / `TRANSPORTE_INTERNO` / `RECOLECCION`). No se infiere del null.
- **Regla negocio OC:** hoy típicamente productos/servicios usan OC y MP no, pero **NO se restringe a nivel modelo**. El campo `orden_compra` es nullable sin validación rígida. El negocio puede cambiar la regla sin migración.
- **`Liquidacion`** vive en sub-app propia `supply_chain/liquidaciones/` (separación semántica de `compras/`).
- **Concepto "viaje / ruta"** NO se modela como entidad. Campos `fecha_viaje` + `uneg_transportista` en Voucher son suficientes.
- **Sub-apps legacy (`compras/`, `almacenamiento/`, `programacion_abastecimiento/`):** no se activan tal cual. `almacenamiento/` se reescribe en S4. `compras/` y `programacion_abastecimiento/` quedan out-of-scope.

### Validación contra mejores prácticas del mercado

- **SAP MM:** `MIGO` mov. 101 (con PO) + mov. 501 (sin PO) — mismo módulo, OC es flag.
- **Odoo:** `stock.picking.purchase_id` nullable — un solo módulo, OC opcional.
- **Oracle Fusion:** Receipt "against PO" o "misc receipt" — mismo módulo Receipt Management.
- **APICS / ASCM:** Scale-based Procurement es patrón estándar (3 actores cuando hay intermediación: buyer / settler / payer).
- **ISO 22005:** trazabilidad agroalimentaria exige identificación + pesaje + QC opcional + registro inventario con ubicación física.
- **Resolución DIAN 000042/2020:** tiquete de báscula = soporte válido de causación (fuera de alcance actual).

---

## 3. Huecos identificados (post-decisiones)

| # | Pieza | Estado | Sesión |
|---|---|---|---|
| 1 | `TipoAlmacen` catálogo + FK en `Almacen` | Nuevo | S3 |
| 2 | ~~Precio cadena 3-puntas~~ | **CANCELADO** — Q2: precio es proveedor→producto | — |
| 3 | `VoucherRecepcion` (documento primario) | Nuevo | S3 |
| 4 | `RecepcionCalidad` (resultado QC opcional) | Nuevo | S3 |
| 5 | `Liquidacion` | Nuevo | S3 |
| 6 | Signal Voucher APROBADO → `MovimientoInventario` | Lógica | S4 |
| 7 | Reescribir `almacenamiento/` (TenantModel + FK Producto) | Refactor grande | S4 |
| 8 | Eliminar `RecepcionCompra` legacy (11 archivos) | Limpieza | S3 |

---

## 4. Sesiones

### S1 — Catálogo Productos CT-layer ✅

- Commit: `824feaa5`
- 29 tests verdes
- `catalogo_productos` promovido a CT-layer L15
- Detalle: `docs/history/2026-04-17-sesion-cierre-supply-chain-s1.md`

### S2 — TenantModel + Extensiones ✅

- Commits: `76a8b094` + `1933e196`
- 41 tests nuevos, CI #894 bloqueantes verdes
- 4 modelos de `gestion_proveedores` migrados a `TenantModel`
- `ProductoEspecCalidad` creado en `extensiones/` (OneToOne a `Producto`)
- Doctrina `docs/01-arquitectura/modular-tenancy.md` creada (12 secciones)
- Detalle: `docs/history/2026-04-17-sesion-cierre-supply-chain-s2.md`

### S3 — VoucherRecepcion + Liquidacion + TipoAlmacen 🔲

#### Backend

1. **Nueva sub-app** `supply_chain/recepcion/`
   - `VoucherRecepcion` (hereda `TenantModel`):
     - FK `proveedor` (Proveedor), FK `producto` (catalogo_productos.Producto)
     - `modalidad_entrega` TextChoices (DIRECTO / TRANSPORTE_INTERNO / RECOLECCION)
     - `uneg_transportista` FK `SedeEmpresa` nullable
     - `fecha_viaje` DateField
     - `orden_compra` FK `OrdenCompra` nullable — **sin validación restrictiva**, uso gobernado por UI
     - `peso_bruto_kg`, `peso_tara_kg`, `peso_neto_kg` (calculado en `save()`)
     - `precio_kg_snapshot` Decimal (inmutable, copia de `PrecioMateriaPrima` al crear)
     - `almacen_destino` FK `Almacen`
     - `operador_bascula` FK User
     - `estado` TextChoices (PENDIENTE_QC / APROBADO / RECHAZADO / LIQUIDADO)
   - `RecepcionCalidad` (OneToOne a VoucherRecepcion, nullable):
     - `parametros_medidos` JSON (snapshot de `ProductoEspecCalidad`)
     - `resultado` TextChoices (APROBADO / CONDICIONAL / RECHAZADO)
     - `analista` FK User
     - `fecha_analisis`

2. **Nueva sub-app** `supply_chain/liquidaciones/`
   - `Liquidacion` (OneToOne a VoucherRecepcion, hereda `TenantModel`):
     - `precio_kg_aplicado`, `peso_neto_kg`, `subtotal`
     - `ajustes_calidad` (% descuento si QC condicional)
     - `total_liquidado`
     - `estado` TextChoices (PENDIENTE / APROBADA / PAGADA)

3. **Ampliar** `supply_chain/catalogos/`
   - `TipoAlmacen` catálogo (silo / contenedor / pallet / piso)
   - FK `Almacen.tipo_almacen` nullable (backward compat)

4. **Eliminar `RecepcionCompra` legacy** (11 archivos)
   - Backend (6): `compras/models.py` (clase), `serializers.py`, `views.py`, `urls.py`, `admin.py`, `tests/test_models.py`
   - Frontend (4): `supply-chain/api/comprasApi.ts`, `hooks/useCompras.ts`, `types/compras.types.ts`, `types/index.ts`
   - Doc (1): actualizar mención en `docs/history/2026-04-17-sesion-cierre-supply-chain-s1.md`

5. **Migraciones** (`0001_initial` en recepcion/, liquidaciones/; `0002` en catalogos/)

6. **Serializers + ViewSets + URLs** para los 4 modelos nuevos (factory pattern)

7. **Tests** (~30-35 tests)
   - Modelos: creación, validaciones, snapshots
   - Viewsets: CRUD + permisos
   - Integración: voucher → liquidación (OneToOne correcto)

#### Frontend

1. **Nueva feature** `frontend/src/features/supply-chain/recepcion/`
   - Página `/supply-chain/recepcion` con PageTabs (Vouchers / Calidad)
   - `VoucherRecepcionForm` (FormModal factory): selector Proveedor, Producto, modalidad, pesos, almacén
   - `VoucherRecepcionTable` (TanStack Table) con filtros por estado/fecha
   - `RecepcionCalidadForm` (condicional: solo si producto tiene `espec_calidad`)
   - Hooks CRUD vía `crud-hooks-factory`
   - Types TS sincronizados con DRF

2. **Nueva feature** `frontend/src/features/supply-chain/liquidaciones/`
   - Página `/supply-chain/liquidaciones` con tabla y acciones
   - Vista detalle con cálculo desglosado (peso neto × precio snapshot)
   - Acción "Aprobar liquidación" con confirm modal

3. **Ampliar** `frontend/src/features/supply-chain/catalogos/`
   - CRUD simple de `TipoAlmacen`
   - Selector `TipoAlmacen` en formulario de `Almacen`

4. **Routes** en `features/supply-chain/supplyChainRoutes.tsx`

5. **Eliminar** referencias frontend a `RecepcionCompra` (4 archivos listados arriba)

6. **Tests Vitest** (happy path + validaciones críticas)

#### Fuera de S3
OC completo (compras/), inventario conectado, signal recepción→movimiento (eso entra en S4).

### S4 — Inventario limpio 🔲

#### Backend

1. **Reescribir** `supply_chain/almacenamiento/` — no migrar (los modelos legacy tienen diseño incompatible: strings sueltos, sin TenantModel, `empresa` FK redundante)
   - `Inventario` con FK `catalogo_productos.Producto` (reemplaza `producto_codigo` / `producto_nombre` / `producto_tipo` strings)
   - `MovimientoInventario` con FK Producto + hereda `TenantModel`
   - Eliminar `empresa` FK (redundante con schema del tenant)
   - `SoftDeleteManager` estándar (reemplaza `deleted_at` a mano)
   - `Kardex`, `AlertaStock`, `ConfiguracionStock` al nuevo estándar

2. **Signal:** `VoucherRecepcion.estado=APROBADO` → crea `MovimientoInventario(tipo=ENTRADA, origen_tipo=VOUCHER, origen_id=voucher.pk)` + actualiza `Inventario`

3. **Migrar 9 call sites** de `production_ops/recepcion` (`TipoMateriaPrima` → `Producto`, deuda heredada de S2)

4. **Tests de integración** flujo completo Voucher → Movimiento → Inventario (~20 tests)

#### Frontend

1. **Reescribir** `frontend/src/features/supply-chain/almacenamiento/`
   - Página `/supply-chain/almacenamiento/inventario` (listing con filtros Almacén + Producto)
   - Página `/supply-chain/almacenamiento/movimientos` (audit trail de movimientos)
   - Página `/supply-chain/almacenamiento/kardex` (consulta histórica por producto)
   - Selector `Producto` (consume catalogo_productos via `useSelect*` hook)
   - Dashboard card: stock total por almacén

2. **Tests Vitest** (listados, filtros, selectores)

### S5 — Activación + Deploy 🔲

#### Backend + Infra

1. Descomentar en `base.py` TENANT_APPS:
   - `apps.supply_chain.catalogos` (ampliada con TipoAlmacen)
   - `apps.supply_chain.gestion_proveedores` (S2)
   - `apps.supply_chain.recepcion` (S3)
   - `apps.supply_chain.liquidaciones` (S3)
   - `apps.supply_chain.almacenamiento` (S4 reescrito)

2. **NO activar:** `apps.supply_chain.compras`, `apps.supply_chain.programacion_abastecimiento` (out-of-scope)

3. Migraciones en orden (`migrate_schemas`)

4. Seed sidebar `NIVEL_CADENA` (`seed_estructura_final.py`) con nuevos módulos (recepcion, liquidaciones, inventario)

5. **Decisión pendiente (ejecutar en esta sesión):** reubicar `catalogo_productos` de L15 a L17 + `NIVEL_INFRAESTRUCTURA` (Opción B previamente discutida — limpia redundancia con `gestion_documental`)

#### Frontend

1. Actualizar sidebar config para nuevos códigos de módulo
2. Route guards (`ModuleGuard` + `SectionGuard`) en rutas nuevas
3. Menú lateral: verificar íconos y orden

#### QA + Deploy

1. QA browseable en tenant `grasas_y_huesos` (flujo end-to-end: proveedor → voucher → calidad → liquidación → inventario)
2. Smoke tests: crear voucher con modalidad RECOLECCION, verificar signal, verificar liquidación
3. Deploy VPS con `scripts/deploy.sh`
4. Post-deploy: verificar `systemctl status stratekaz-{gunicorn,celery,celerybeat}`

---

## 5. Out of scope (revisar post-S5)

- **Compras corporativas con OC** — reescribir `supply_chain/compras/` cuando el negocio pida OC real (servicios, equipos, repuestos). Hoy `RecepcionCompra` se elimina; `OrdenCompra`/`Requisicion`/`Cotizacion`/`Contrato` quedan dormidas en código legacy hasta que se reescriba.
- **`programacion_abastecimiento/`** — MRP tradicional, no aplica a scale-based. Evaluar borrar o dejar dormido.
- **Tiquete de báscula PDF** para DIAN (Resolución 000042/2020)
- **Integración hardware báscula** (RS-232/TCP/USB) — MVP es entrada manual del peso
- **Período de liquidación configurable** (semanal / quincenal / mensual por proveedor) en `CondicionComercialProveedor`
- **Retenciones DIAN** en liquidación (ReteFuente, ReteIVA, ReteICA)
- **Portal proveedor** (fase 2 — `User.proveedor_id_ext` ya está preparado)
- **Pago real** — L70-L72 (Tesorería / Accounting)
- **Bins / ubicaciones específicas** (WMS fase 2)
- **Concepto viaje/ruta** como entidad — hoy es campo en Voucher

---

## 6. Dependencias cross-module

- **`production_ops/recepcion/`** — 9 call sites a migrar de `TipoMateriaPrima` a `Producto` (S4). Deuda heredada de S2.
- **`accounting/`** — cuentas por pagar desde liquidaciones (L70-L72, fuera de alcance)
- **BI C3 (`analytics/`)** — datos de recepción / inventario / liquidación (futuro)
- **`gestion_estrategica.configuracion.SedeEmpresa`** — flags `es_proveedor_interno`, `es_centro_acopio` ya existentes; se consumen desde `VoucherRecepcion.uneg_transportista` y `.almacen_destino`
- **`catalogo_productos.Producto`** — FK en VoucherRecepcion, Inventario, MovimientoInventario (CT-layer, S1)
- **`gestion_proveedores.Proveedor`** — FK en VoucherRecepcion, Liquidacion
- **`gestion_proveedores.PrecioMateriaPrima`** — source del `precio_kg_snapshot` al crear Voucher (inmutable post-snapshot)
- **`gestion_proveedores.ProductoEspecCalidad`** (S2 extensión) — plantilla consumida por `RecepcionCalidad.parametros_medidos`

---

> **Trazabilidad de decisiones:** este roadmap consolida las decisiones de la conversación del 2026-04-17 posterior al cierre de S2. Las decisiones en sección 2 no se reabren — si surge nueva evidencia que las contradiga, se documenta como hallazgo (H-S3-x) y se evalúa al inicio de la sesión siguiente.
