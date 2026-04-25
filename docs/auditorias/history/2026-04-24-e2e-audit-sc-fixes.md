# Sesión 2026-04-24 (continuación) — Auditoría E2E Supply Chain + 5 fixes

## Contexto
Segunda sesión del día sobre el flujo Supply Chain cerrado en la mañana
(`2026-04-24-supply-chain-qc-liquidacion-voucher-ux.md`). Pre-flight: el
usuario pidió validar el flujo completo en browser ("haz el mejor e2e
siguiendo mejores prácticas"). La auditoría descubrió 7 hallazgos (3
críticos bloqueantes + 4 menores). Se resolvieron los bloqueantes y se
mejoró el voucher 58mm en 3 commits incrementales.

## Commits del día (sesión tarde)
| Commit | Descripción | CI |
|--------|-------------|----|
| `7bf29864` | fix: e2e audit — 5 hallazgos bloqueantes resueltos | ⏳ cancelled (superado por `d9b4df6e`) |
| `d9b4df6e` | fix: voucher 58mm — sin firmas, con cargo del operador | ⏳ pendiente (en progreso al cerrar) |
| `8f4e322f` | fix: voucher 58mm — centrar logo y nombre como el footer | ⏳ pendiente |

## Estado del producto
- CURRENT_DEPLOY_LEVEL: L0-L20 (StrateKaz Core)
- Tests: no corridos en esta sesión (deuda H-SC-12 de tests rotos sigue pendiente)
- Gate CI: en progreso al cerrar
- Apps LIVE tocadas: `supply_chain/recepcion`, `supply_chain/almacenamiento`, `catalogo_productos/proveedores`

## Auditoría E2E — flujo validado en browser

7 capas validadas (Capa 0 precondiciones → Capa 7 trazabilidad), tenant
`stratekaz` (demo). Browseo end-to-end de:
1. Sede (Planta Principal SEDE-0001) + 7 tipos de almacén + 2 almacenes sembrados.
2. 5 productos MP del catálogo CT (2 con `requiere_qc=true`).
3. 6 proveedores; PROV-00002 Grasas del Norte = MATERIA_PRIMA + COMPRA_PUNTO + 5 precios.
4. 1 ParámetroCalidad (Acidez) + 6 RangoCalidad (Tipo A/B/C).
5. 3 Vouchers (#1, #4 APROBADOS, #5 PENDIENTE_QC) — header+líneas + QC inline funciona.
6. 2 Liquidaciones (LIQ-0001 Aprobada $727k 2 líneas; LIQ-0002 Borrador $392k).
7. 3 MovimientoInventario en BE con `origen=VoucherLineaMP` — signal funciona.

## Hallazgos detectados (7 total)

### Bloqueantes resueltos
- **H-SC-E2E-03** — `ConfirmDialog` en ProveedoresTab recibía prop `onCancel` que la API
  no acepta; el handler `onClose` quedaba undefined y HeadlessUI Dialog crasheaba al
  abrir. Fix: renombrar `onCancel` → `onClose`.
- **H-SC-E2E-04** — `window.open(url)` no adjunta el Bearer JWT, el endpoint
  `/print-58mm/` devolvía 401. Fix: descargar HTML vía `apiClient.get()` y abrir
  blob-URL en popup. Estado de carga + toast si popup bloqueado.
- **H-SC-E2E-06** — URLs router del backend usaban nombres redundantes
  (`movimientos-inventario`, `alertas-stock`, `configuracion-stock`,
  `dashboard-inventario/estadisticas`) que no coincidían con el FE. Fix: alinear
  a versiones cortas dentro del namespace `/almacenamiento/` + endpoint dedicado
  `/estadisticas/` para el dashboard.
- **H-SC-E2E-07** — Signal post-save de voucher creaba `MovimientoInventario` +
  `Inventario` pero olvidaba `Kardex`. Fix: añadir creación con `saldo_cantidad`
  tras la entrada + script de backfill ejecutado en tenant_demo (3 registros).

### Mejoras voucher 58mm (commits `7bf29864` + `d9b4df6e` + `8f4e322f`)
1. **QC con clasificación inline**: "Acidez 8.0% (Tipo B)" — antes solo "8.0%".
2. **Estado compactado**: "APROBADO" — antes "Aprobado — listo para liquidar".
3. **Línea MP densa**: producto + B:/N: en una fila, tara solo si > 0.
4. **Sin firmas**: reemplazadas por bloque "REALIZADO POR" centrado con nombre +
   cargo del operador. Para superadmin (sin cargo) usa el label canónico
   "Administrador del Sistema" (CLAUDE.md → Reglas de Identidad).
5. **Ruta condicional**: solo aparece cuando modalidad lo requiere.
6. **`line-height: 1.3`** explícito + `padding: 3mm 4mm` (antes 4mm 5mm).
7. **Header `.brand` semántico** con `img { display:block; margin:0 auto }` para
   centrado robusto sin depender del baseline inline. Mismo criterio tipográfico
   que `.footer`.

### No bloqueantes (documentados, pendientes)
- **H-SC-E2E-01** — Falta UI de CRUD de Almacenes (existen en DB solo via seed).
  Severidad MEDIA. Bloqueante para clientes nuevos.
- **H-SC-E2E-02** — Códigos MP mixtos: legacy verbal (`HARINA_HUESO`) coexisten
  con autocódigo (`MP-00001`). Severidad BAJA, cosmético.
- **H-SC-E2E-05** — Listado de Liquidaciones muestra columna `LÍNEAS = 0` aunque
  el detalle sí trae las líneas. Bug del serializer de listado. Severidad MEDIA.

## Decisiones tomadas (no reabrir)
1. **URLs cortas dentro del módulo `/almacenamiento/`**: `movimientos/`,
   `alertas/`, `configuraciones/`, `estadisticas/`. Evitar nombres redundantes
   tipo `movimientos-inventario/` cuando ya estamos en el namespace.
2. **Voucher 58mm sin firmas**: solo nombre + cargo del operador. Las firmas
   reales se gestionan en otro flujo (firma digital del workflow_engine), no en
   un ticket térmico de báscula.
3. **Centrado tipográfico consistente**: clase `.brand` para header espeja a
   `.footer` para que ambos extremos del ticket queden visualmente alineados.
4. **Fix-by-touch en módulos LIVE**: el bug `onCancel`/`onClose` también existe
   en `EmergenciasPage.tsx` (hseq, módulo NO-LIVE) — se documenta pero no se
   toca hasta activación (CLAUDE.md → solo LIVE).

## Deuda consciente activa
- Tests `sc_recepcion` y `liquidaciones` siguen rotos (deuda heredada de la
  sesión de la mañana, refactor H-SC-12). **ALTA** — siguiente prioridad.
- `EmergenciasPage.tsx` tiene mismo bug `onCancel`/`onClose` que se resolvió en
  ProveedoresTab. Se arregla cuando se active hseq.
- H-SC-E2E-01 (UI Almacenes), H-SC-E2E-05 (col LÍNEAS=0): pueden esperar.

## Próximo paso claro
**Reescribir tests rotos** de `sc_recepcion` y `liquidaciones` para el modelo
header+líneas (cierre formal H-SC-12). Después: implementar UI de CRUD de
Almacenes (H-SC-E2E-01) y arreglar serializer de listado de Liquidaciones
(H-SC-E2E-05).

## Archivos clave tocados
- `backend/apps/supply_chain/recepcion/views.py` — voucher 58mm reescrito (header `.brand`, QC con clasificación, sin firmas, cargo del operador, `line-height: 1.3`).
- `backend/apps/supply_chain/recepcion/signals.py` — añade creación de Kardex en el handler post-save del voucher APROBADO.
- `backend/apps/supply_chain/almacenamiento/urls.py` — URLs router alineadas con el FE (`movimientos`, `alertas`, `configuraciones`, `estadisticas`).
- `frontend/src/features/supply-chain/components/VoucherDetailModal.tsx` — `handlePrint58mm` usa `apiClient` + blob-URL para incluir Bearer JWT.
- `frontend/src/features/catalogo-productos/components/ProveedoresTab.tsx` — `onCancel` → `onClose` en `<ConfirmDialog>`.
