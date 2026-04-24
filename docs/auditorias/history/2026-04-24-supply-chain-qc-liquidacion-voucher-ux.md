# Sesión 2026-04-24 — Supply Chain: QC configurable + Liquidación header+líneas + UX voucher

## Contexto
Sesión maratónica de consolidación Supply Chain. Arrancó como pre-flight
diagnóstico del signal de inventario, pivotó a 3 fases paralelas (QC
configurable por línea + dashboard analítico almacén + liquidación
refactorizada + pagos minimal), luego polish UX exhaustivo del voucher de
recepción y tabla resumen. 13 commits, H-SC-11 → H-SC-14.5.

## Commits del día
| Commit | Descripción | CI |
|--------|-------------|----|
| `e96eff34` | feat: QC configurable por línea + dashboard almacén analítico (H-SC-11) | ⏳ no verificado |
| `e60bd45e` | feat: Liquidación header+líneas + Pagos minimal (H-SC-12) | ⏳ no verificado |
| `ca5b074a` | feat: branding 58mm + sidebar reorder + VoucherDetailModal (H-SC-13) | ⏳ no verificado |
| `4ea1cdbe` | fix: endpoints QC + pagos en root del módulo SC | ⏳ no verificado |
| `b27c0178` | fix: alinear mapping FE QC a convención código inglés | ⏳ no verificado |
| `14f4e58c` | fix: resumen-general expone detalle por almacén + alinear nombres FE | ⏳ no verificado |
| `fd3edd50` | feat: VoucherFormModal XL + SearchableSelect de proveedor | ⏳ no verificado |
| `23ed1bbc` | fix: voucher UX — QC dinámico + valor medido + operador con cargo (H-SC-14) | ⏳ no verificado |
| `fb8dba4d` | fix: tabla voucher — QC sin recuadro + estado conciso | ⏳ no verificado |
| `8ee55f82` | fix: fecha timezone + QC en impresión 58mm + 1 decimal detail | ⏳ no verificado |
| `2e92dda9` | refactor: eliminar flujo legacy RegistrarQCModal | ⏳ no verificado |
| `cc175ec1` | fix: voucher 58mm UX final + tabla N/A + KpiCard DS | ⏳ no verificado |
| `35d24186` | fix: voucher 58mm centrado + proveedor con código | ⏳ no verificado |

## Estado del producto
- CURRENT_DEPLOY_LEVEL: L0-L20 (StrateKaz Core)
- Tests: no re-corridos en esta sesión (SC tiene tests rotos por refactor H-SC-12; se arreglan al cerrar H-SC-12 formalmente)
- Gate CI: no verificado
- Apps LIVE tocadas: `supply_chain/recepcion`, `supply_chain/catalogos`, `supply_chain/liquidaciones`, `supply_chain/almacenamiento`, `gestion_estrategica/configuracion`

## Decisiones tomadas (no reabrir)

### Arquitectura QC (H-SC-11)
1. **QC por línea MP**, no por voucher entero. Nuevo modelo `MedicionCalidad(voucher_line, parameter, measured_value)` con auto-clasificación en `save()` contra rangos del parámetro.
2. **Parámetros de calidad configurables por tenant**: `ParametroCalidad` + `RangoCalidad`. Cada tenant define sus propios parámetros (Acidez, Humedad, pH...) y rangos clasificatorios (Tipo A/B/C/...).
3. **Seeds por tenant via management command** (`seed_acidez_demo`), NO en migración — opt-in por tenant.
4. **`RecepcionCalidad` legacy preservado** por compat con data vieja. Nueva deuda H-SC-12 para eliminación futura.
5. **Flujo inline en VoucherFormModal**: si producto `requiere_qc_recepcion=true`, se toma la medición al crear el voucher. Eliminado el modal legacy `RegistrarQCModal` — código muerto.
6. **`tiene_qc` amplio**: ahora considera legacy OR mediciones nuevas. `tiene_qc_legacy` separado para el check de `RECHAZADO` que solo aplica al flujo antiguo.

### Liquidación header+líneas (H-SC-12)
1. **1 Liquidación = 1 VoucherRecepcion** (OneToOne). Antes fragmentaba 1:1 con línea MP. Refactor con migración `0005_liquidacion_header_lineas` (atomic=False por PG pending triggers).
2. **`LiquidacionLinea`** de detalle con `cantidad`, `precio_unitario`, `monto_base`, `ajuste_calidad_pct`, `monto_final`. Factory `Liquidacion.desde_voucher()` idempotente.
3. **`PagoLiquidacion`** minimal tesorería: OneToOne a Liquidacion. Al crearse valida `monto_pagado == total` y cambia estado a PAGADA. Sin módulo tesorería completo (L30+).
4. Consolidación destructiva de liquidaciones legacy (1 por voucher con N líneas).

### UX Voucher (H-SC-13/14)
1. **`VoucherFormModal` tamaño 4xl** (896px) con **SearchableSelect** para proveedor (typeahead con código + nombre + ciudad).
2. **`VoucherDetailModal`** — vista read-only con header + info + tabla líneas con mediciones QC + botón imprimir.
3. **Sidebar Supply Chain**: Rutas primero (pre-requisito del flujo), luego Precios/Recepción/Liquidaciones/Almacenamiento/Catálogos.
4. **Voucher impreso 58mm**: logo tenant + nombre comercial + NIT en header centrado; líneas con QC inline; total; estado; footer "Powered by StrateKaz + stratekaz.com | Consultoría 4.0" centrado.
5. **Label "GENERADO POR"** (no "Operador de báscula" — suena a cargo, era confuso). Backend expone `operador_cargo` adicional.
6. **Decimales uniformes**: 1 decimal en pesos, mediciones y totales (antes inconsistente 2/3).
7. **"N/A"** cuando QC no aplica (tabla + voucher + detail). "Pendiente" cuando sí aplica pero no registrado. "Registrado" cuando sí tiene mediciones.
8. **KpiCard DS correcto**: props `label`/`color`/`columns` (antes usaba `title`/`variant`/`cols` que no existen — cards salían sin etiqueta).
9. **Fecha timezone fix**: `parseLocalDate()` divide YYYY-MM-DD en componentes locales. `new Date('2026-04-24')` en UTC-5 mostraba día anterior.
10. **Voucher 58mm centrado**: `@page margin: 0` + `body width: 58mm` + `padding: 4mm 5mm` → contenido centrado uniformemente en papel físico (antes alineado al top-left del área imprimible).

### Routing endpoints
- QC (`parametros-calidad/`, `rangos-calidad/`, `mediciones-calidad/`) expuesto en **root** del SC vía `urls_qc_root.py` (el FE asume root-level, no `recepcion/`).
- `pagos-liquidacion/` también en root vía `urls_pagos.py`.
- `liquidaciones/urls.py` solo expone LiquidacionViewSet con prefijo vacío (el wiring ya trae `liquidaciones/`).

### Mapping FE/BE alineado a convención
- `ParametroCalidad`, `RangoCalidad`, `MedicionCalidad` tipos FE migrados a inglés (`code`, `name`, `unit`, `parameter`, `color_hex`) alineado con modelo backend. Antes FE usaba español (`codigo`, `nombre`, `unidad`), causaba nombre/unidad "undefined".
- `ResumenGeneralSC` alineado: `total_productos_stock`, `total_cantidad_global`, `alertas_pendientes`.

## Deuda consciente activa
- **H-SC-12 (cleanup)**: modelo `RecepcionCalidad` legacy sigue vivo. Eliminar cuando se confirme 0 data legacy en prod. Tests de `sc_recepcion` y `liquidaciones` rotos por el refactor — reescribir con el modelo nuevo.
- **Movimientos inventario**: signal funciona OK tras seed de catálogos. Falta verificar flujo completo post-multi-MP en algunos edge cases.
- **KpiCardGrid de `AlmacenamientoTab`**: aún usa el nombre viejo `total_productos` — no bloqueante porque la tab no está expuesta en sidebar.
- **Footer 58mm**: "Powered by StrateKaz" es opcional — tenant con branding white-label podría querer ocultarlo. No se modela aún.

## Próximo paso claro
Validar flujo completo end-to-end desde browser: crear voucher con modalidad RECOLECCION (requiere crear ruta primero), registrar QC en voucher multi-MP, aprobar, imprimir, registrar pago, ver inventario + kardex actualizado. Luego reescribir tests rotos de `sc_recepcion`/`liquidaciones` para el modelo nuevo.

## Archivos clave tocados

### Backend
- `backend/apps/supply_chain/recepcion/models.py` — 3 nuevos: `ParametroCalidad`, `RangoCalidad`, `MedicionCalidad`; `VoucherRecepcion.tiene_qc` ahora considera mediciones; property `tiene_qc_legacy` separada
- `backend/apps/supply_chain/recepcion/serializers.py` — `ParametroCalidadSerializer` + `RangoCalidadSerializer` + `MedicionCalidadSerializer` + `MedicionCalidadBulkCreateSerializer`; `operador_cargo` en list y detail
- `backend/apps/supply_chain/recepcion/views.py` — ViewSets QC + endpoint bulk mediciones + `print_58mm` reescrito (logo + nombre + NIT tenant, líneas con QC, footer centrado)
- `backend/apps/supply_chain/recepcion/urls_qc_root.py` — nuevo, QC expuesto en root del SC
- `backend/apps/supply_chain/recepcion/management/commands/seed_acidez_demo.py` — nuevo
- `backend/apps/supply_chain/recepcion/migrations/0006_qc_configurable.py` — nuevo
- `backend/apps/supply_chain/recepcion/signals.py` — `crear_liquidacion_al_aprobar` → `Liquidacion.desde_voucher()` (1 liquidación por voucher)
- `backend/apps/supply_chain/liquidaciones/models.py` — refactor completo header+líneas + `PagoLiquidacion`
- `backend/apps/supply_chain/liquidaciones/urls_pagos.py` — nuevo, pagos en root
- `backend/apps/supply_chain/liquidaciones/migrations/0005_liquidacion_header_lineas.py` — nuevo (atomic=False)
- `backend/apps/supply_chain/catalogos/views.py` — `AlmacenViewSet` gana 3 `@action`: `dashboard`, `kardex`, `resumen-general` (con `almacenes[]` + stats por almacén)
- `backend/apps/supply_chain/catalogos/serializers.py` — 9 serializers nuevos para dashboard/kardex/resumen
- `backend/apps/supply_chain/urls.py` — wiring de `urls_qc_root` + `urls_pagos`

### Frontend
- `frontend/src/components/forms/SearchableSelect.tsx` — nuevo, typeahead single-select reutilizable
- `frontend/src/features/supply-chain/types/calidad.types.ts` — tipos QC (code/name/unit/parameter alineados con backend)
- `frontend/src/features/supply-chain/types/inventario.types.ts` — ResumenGeneralSC, AlmacenResumenItem, KardexEntry
- `frontend/src/features/supply-chain/api/calidad.ts` + `inventario.ts` — nuevos
- `frontend/src/features/supply-chain/hooks/useParametrosCalidad.ts`, `useRangosCalidad.ts`, `useMedicionesCalidad.ts`, `useInventario.ts`, `usePagosLiquidacion.ts` — nuevos
- `frontend/src/features/supply-chain/components/ParametroCalidadFormModal.tsx`, `RangoCalidadFormModal.tsx`, `ParametrosCalidadTab.tsx`, `QcLineaSection.tsx`, `InventarioTab.tsx`, `AlmacenDashboardModal.tsx` — nuevos
- `frontend/src/features/supply-chain/components/VoucherFormModal.tsx` — size 4xl + SearchableSelect proveedor + QcLineaSection inline condicional
- `frontend/src/features/supply-chain/components/VoucherDetailModal.tsx` — nuevo, detail read-only con mediciones
- `frontend/src/features/supply-chain/components/LiquidacionDetailModal.tsx`, `LiquidacionAjustesModal.tsx`, `PagoLiquidacionFormModal.tsx` — nuevos
- `frontend/src/features/supply-chain/components/LiquidacionesTab.tsx` — rehecho con header+líneas + modales
- `frontend/src/features/supply-chain/components/RecepcionTab.tsx` — KpiCard DS correcto, tabla QC con valor medido + 1 decimal, fecha timezone-safe, eliminado botón legacy QC y botón editar huérfano
- `frontend/src/features/supply-chain/components/RegistrarQCModal.tsx` — **eliminado** (flujo legacy)
- `frontend/src/features/supply-chain/pages/SupplyChainPage.tsx` — StatGrid resumen general + rutas nuevas
- `frontend/src/routes/modules/supply-chain.routes.tsx` — rutas `/parametros-calidad`, `/inventario`
- `frontend/src/features/supply-chain/types/liquidaciones.types.ts` — tipos refactorizados header+líneas

### Seed
- `backend/apps/core/management/commands/seed_estructura_final.py` — Rutas de Recolección orden=1 en sidebar SC

## Hallazgos abiertos
- **H-SC-12 (cleanup)** — eliminar `RecepcionCalidad` legacy + reescribir tests rotos. Severidad **MEDIA**.
- **H-SC-15** (nuevo) — validar flujo completo browser modalidad=RECOLECCION (crear ruta → voucher con ruta → aprobar → inventario). Severidad **BAJA**.
- Tests backend `sc_recepcion` y `liquidaciones` rotos — no corrieron en CI, reescribir con modelo nuevo. Severidad **ALTA** (blocker para release).
