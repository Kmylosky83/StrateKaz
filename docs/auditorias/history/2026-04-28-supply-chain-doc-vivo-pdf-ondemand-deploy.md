# Sesión 2026-04-28 — Supply Chain doc-vivo + PDF on-demand + browseo correctivo + deploy prod

## Contexto

Sesión de consolidación pos-marathon (siguiente al cierre 2026-04-27).
Arrancó con CI rojo heredado del marathon y el usuario priorizó **producir
flujo crítico funcional en prod** (recibir proveedor directo + liquidación
+ inventario), con browseo manual interactivo. Se descubrieron 8 bugs y
varias decisiones arquitectónicas durante el browseo, todas resueltas y
desplegadas en VPS.

Excepción a "todo CI verde antes de deploy": se aceptó deploy con CI rojo
porque el rojo es deuda de tests legacy preexistente al marathon
(`pg_type_typname_nsp_index mi_equipo_candidato`), no regresión funcional.

---

## Commits del día

| Commit | Descripción | CI |
|--------|-------------|----|
| `aa37b059` | feat(sc): consolidación SC + RBAC instancia ruta + fix CI test infra | ❌ pytest LIVE legacy |
| `b029769b` | feat(sc): documento-vivo en GD + PDF on-demand + almacén por línea + fixes browseo | ❌ pytest LIVE legacy |
| `07f258ec` | fix(sc): liquidaciones FE alineadas a estados H-SC-02 (SUGERIDA/AJUSTADA/CONFIRMADA) | ❌ pytest LIVE legacy |

CI rojo: el step "Run migrated tests (BLOQUEANTE)" pasa ✅ tras el fix de
`BaseTenantTestCase.use_existing_tenant`. El que sigue rojo es "Run LIVE
pytest suite" por `IntegrityError: duplicate key value violates unique
constraint "pg_type_typname_nsp_index" mi_equipo_candidato` — problema de
testing infra (SHARED_APPS/TENANT_APPS colisión al recrear schema), no
afecta runtime.

---

## Estado del producto

- **Deploy**: ✅ `aa37b059` + `b029769b` desplegados en VPS (commit
  `b029769b` build verde tras `npm ci` manual). `07f258ec` queda pendiente
  de deploy (usuario lo ejecuta al iniciar próxima sesión).
- **Local**: backend recargado con HMR todos los cambios, frontend OK.
- **Tests migrados (CI)**: pasan ✅ (6/6).
- **Tests LIVE pytest (CI)**: ❌ `pg_type duplicate mi_equipo_candidato`.
- **Apps LIVE tocadas**: `supply_chain.{recepcion, recoleccion,
  liquidaciones, gestion_proveedores, catalogos}`, `core.tests` (infra),
  `core.management.commands` (seed pipeline + sidebar order),
  `core/seed_estructura_final` (orden sidebar SC).

---

## Decisiones tomadas (no reabrir)

### 1. Documento-vivo en GD (sin PDF storage)

`VoucherRecepcion.archivar_en_gd`, `Liquidacion._archivar_en_gd` y
`archivar_voucher_en_gd` (recolección) ahora crean un `Documento` en GD
con metadata + GenericFK al voucher, **sin PDF físico**. El PDF se
regenera on-demand desde el endpoint cuando el usuario lo solicita.

**Por qué**: estados terminales (`APROBADO`/`LIQUIDADO`/`COMPLETADO`) ya
garantizan inmutabilidad → el PDF regenerado es idéntico al original. Se
evita storage duplicado y se simplifica el modal de recepción.

**Nota**: en GD, el `archivo_pdf` queda null. El frontend de GD aún no
fue actualizado para abrir el detalle del voucher en lugar de descargar
archivo — es deuda Sprint 2 (ver hallazgos abiertos).

### 2. PDF on-demand vs HTML inline

Endpoints `/print-80mm/`, `/pdf-carta/`, `/print-58mm/` ahora retornan
PDF vía `VoucherPDFService`. Antes retornaban HTML inline con
`window.print()` JS — incompatible con `Accept: application/pdf` que
manda el FE (resultaba en 406). Refactor: ~280 líneas de HTML inline en
`VoucherRecepcionViewSet.print_80mm` reemplazadas por una llamada al
servicio. Se introdujo un `PDFRenderer` custom para que DRF acepte el
header sin caer en content negotiation 406.

### 3. Almacén por línea (no por header)

`VoucherLineaMP.almacen_destino` FK nullable. Si null, hereda de
`voucher.almacen_destino`. Signal usa `linea.almacen_destino or
instance.almacen_destino`. **El header del modal ya no tiene select
"Destino"**; cada línea tiene almacén obligatorio con auto-fill desde la
primera línea. `voucher.almacen_destino` queda nullable como tracking
legacy.

**Por qué**: usuario reportó que con almacén único en header, si quería
recibir 2 productos a almacenes distintos, debía crear 2 vouchers → eso
duplica liquidaciones. Ahora 1 voucher → 1 liquidación → N movimientos
en distintos almacenes.

### 4. RBAC por instancia de Ruta (H-SC-RUTA-RBAC-INSTANCIA cerrado)

Implementación variante Opción 2 (ownership por User en lugar de Cargo):
- `RutaRecoleccion.conductor_principal` FK + `conductores_adicionales`
  M2M a `AUTH_USER_MODEL`.
- `RutaRecoleccionViewSet.get_queryset()` filtra por asignación con
  bypass para superuser/staff/cargo elevado.
- `VoucherRecoleccionViewSet.get_queryset()` filtra por
  `ruta__conductor_principal` / `ruta__conductores_adicionales`.
- FE: nueva sección "Conductores asignados" en RutaFormModal.

**Estado en hallazgos-pendientes.md**: ✅ RESUELTO 2026-04-28.

### 5. Liquidaciones FE alineadas a estados H-SC-02

`EstadoLiquidacion` type FE ahora incluye `SUGERIDA`, `AJUSTADA`,
`CONFIRMADA` (legacy `BORRADOR`/`APROBADA` se mantienen para datos
pre-refactor). `LiquidacionesTab` y `LiquidacionDetailModal` muestran
botones editar/confirmar/anular cuando estado en `[SUGERIDA, AJUSTADA,
BORRADOR]` y "Registrar pago" cuando en `[CONFIRMADA, APROBADA]`. Botón
"Aprobar" renombrado a "Confirmar" para alinear con la doctrina H-SC-02.

### 6. Voucher 80mm: 12pt + logo + QC visible

Template `voucher_80mm.html`: fuente `10pt → 12pt` (legible en térmica
real), logo del tenant en header, línea fija "QC: N/A / Pendiente /
Registrado", estado compacto ("APROBADO" en lugar de "Aprobado — listo
para liquidar" que se desbordaba en 80mm).

### 7. Sidebar SC reordenado

Orden narrativo del empresario: **Precios → Rutas → Recolección →
Recepción → Liquidaciones → Almacenamiento → Almacenes → Catálogos**.
Se aplicó vía `seed_estructura_final` re-corrido en todos los tenants.

### 8. Fix CI infra (BaseTenantTestCase)

Override de `use_existing_tenant` para asegurar `Domain.is_primary=True`
cuando `FastTenantTestCase` reusa schema (el test client de
django-tenants caía con `AttributeError: 'NoneType' object has no
attribute 'domain'`). El step "Run migrated tests (BLOQUEANTE)" pasa
ahora en CI.

---

## Bugs descubiertos en browseo y resueltos

1. **Aprobar voucher recepción explotaba con AttributeError** — método
   `archivar_en_gd` no existía en el modelo (commit del marathon era
   incompleto: signal llamaba método inexistente). Agregado.
2. **500 al crear voucher recolección** —
   `VoucherRecoleccion._generate_code` usaba `cls.objects.count()` que
   excluye soft-deleted, generando colisión `VRC-XXX`. Migrado a
   `_base_manager`.
3. **Print 80mm devolvía 406** — endpoint retornaba HTML, FE pedía PDF.
   Refactor a PDF + `PDFRenderer` custom.
4. **Botón imprimir en tabla mostraba `[object Blob]` en `about:blank`**
   — `win.document.write(blob)` en lugar de `URL.createObjectURL`.
   Arreglado en `RecepcionTab` y `VoucherRecoleccionTab`.
5. **Panel "Asignar vouchers de recolección" aparecía en flujo DIRECTO**
   — Card de `VoucherDetailModal` envuelta con
   `voucher.modalidad_entrega === 'RECOLECCION'`.
6. **Conductor en blanco al re-editar Ruta** — modal no refrescaba data.
   Fix defensivo: `useRuta(id)` para fetch del detalle fresco al abrir
   en modo edit (`hydratedRuta = rutaDetail ?? ruta`).
7. **QC aparecía en todas las líneas o ninguna** — flag
   `producto_requiere_qc_recepcion` no viajaba desde
   `PrecioMateriaPrimaSerializer` al FE. Agregado al serializer + types
   FE + lógica de `productosDelProveedor`.
8. **Liquidaciones no permitían cerrar** — FE buscaba estado
   `BORRADOR`/`APROBADA` (legacy) pero el refactor H-SC-02 cambió a
   `SUGERIDA → AJUSTADA → CONFIRMADA → PAGADA`. Conteo de líneas leía
   `lineas_liquidacion?.length` (solo en detail) en lugar de
   `lineas_count` (en list).

---

## Migraciones aplicadas

- `sc_recepcion 0012_alter_voucherlineamp_peso_bruto_kg_and_more` — pesos
  decimal_places 3→1.
- `sc_recepcion 0013_voucherlineamp_almacen_destino` — almacén por línea
  (FK nullable).
- `sc_recepcion 0014_alter_voucherrecepcion_almacen_destino` — header
  nullable.
- `sc_recoleccion 0007_alter_voucherrecoleccion_cantidad` — cantidad
  decimal_places 3→1.
- `sc_catalogos 0012_rutarecoleccion_conductor_principal_and_more` —
  conductor_principal FK + conductores_adicionales M2M.
- `sc_liquidaciones 0009_alter_liquidacionlinea_cantidad` — cantidad
  decimal_places 3→1.

Todas aplicadas en local (35 tenants) y en VPS vía `migrate_schemas` del
deploy.sh.

---

## Deuda consciente activa

- **CI rojo en pytest LIVE** (`IntegrityError pg_type_typname_nsp_index
  mi_equipo_candidato`): preexistente al marathon, no regresión
  funcional. Requiere bucear en `testing.py` + `conftest.py` para
  resolver colisión SHARED_APPS/TENANT_APPS al recrear schema. Estimado:
  30-60 min en sesión dedicada.
- **`Liquidacion.desde_voucher` con modalidad RECOLECCION** queda en $0
  (proveedor=null no matchea `PrecioMateriaPrima`). Workaround: ajuste
  manual de precio en `LiquidacionLinea`. Documentado como
  `H-SC-RUTA-LIQ-PRODUCTORES` en `hallazgos-pendientes.md`.
- **GD frontend abrir detalle voucher en lugar de descargar archivo**
  null: con la doctrina documento-vivo, el archivo no existe. Cuando el
  usuario navegue a un Documento `modulo_origen=supply_chain.*` debería
  redireccionar al detalle del voucher en SC. Sprint 2.
- **Bug modal Ruta conductor en blanco al re-editar**: aplicado fix
  defensivo en `aa37b059` (useRuta detail fresh), pero el usuario lo
  marcó como Sprint 2 — validar más a fondo en próxima sesión.
- **`pdf-carta/` endpoint redundante**: con la doctrina documento-vivo,
  el PDF carta puede regenerarse desde GD click-ver. Deuda menor para
  Sprint 2 — eliminar o mover a "solo desde detail voucher".
- **Voucher recolección N MP por parada**: arquitectónicamente se
  mantuvo "1 parada = 1 producto" del cierre 2026-04-27. UX agregada
  ("Guardar y agregar otro") cubre el caso operativo.
- **Deploy del commit `07f258ec` pendiente** — usuario lo ejecuta en
  próxima sesión arrancando.

---

## Hallazgos abiertos / actualizados

- **H-SC-RUTA-RBAC-INSTANCIA** — ✅ RESUELTO 2026-04-28 (variante Opción
  2: ownership por User principal + adicionales). Ver
  `hallazgos-pendientes.md` para detalle.
- **H-SC-RUTA-CERTIFICADOS-PV** — 🔲 ABIERTO. Documentado para no perder
  contexto: certificados a productores en rutas semi-autónomas.
  Severidad **MEDIA**, sin trigger inmediato.
- **H-SC-RUTA-LIQ-PRODUCTORES** — 🔲 ABIERTO. Factory
  `Liquidacion.desde_voucher` modalidad RECOLECCION queda en $0.
  Workaround: ajuste manual. Severidad **MEDIA**.
- **H-CI-PYTEST-LIVE-PG-TYPE** (nuevo, no creado en hallazgos-pendientes
  todavía) — Tests pytest LIVE rotos por colisión `pg_type` al recrear
  schema. Severidad **MEDIA** (no bloquea runtime ni deploy, sí bloquea
  CI verde). Pendiente investigación dedicada.

---

## Próximo paso claro

**Arrancar próxima sesión con**:
1. Ejecutar deploy del commit `07f258ec` en VPS (`bash scripts/deploy.sh
   --no-backup` — solo build FE, sin migraciones).
2. Browseo real en `app.stratekaz.com/supply-chain/liquidaciones`:
   crear voucher → aprobar → confirmar liquidación → registrar pago →
   verificar inventario.
3. Si flujo completo OK → cerrar Sprint 1 prod 🎉.
4. Si hay nuevos issues → arreglar y deployar.
5. Después: investigar y arreglar CI rojo de pytest LIVE
   (`pg_type_typname_nsp_index mi_equipo_candidato`) o documentarlo
   formalmente como hallazgo.

---

## Archivos clave tocados

### Backend
- `backend/apps/supply_chain/recepcion/models.py` — `archivar_en_gd()` agregado, `peso_*_kg` decimal_places 3→1, `VoucherLineaMP.almacen_destino` FK, `VoucherRecepcion.almacen_destino` nullable.
- `backend/apps/supply_chain/recepcion/services.py` — `_build_contexto` con tenant_logo_url + qc_resumen + estado_compacto.
- `backend/apps/supply_chain/recepcion/views.py` — `print_80mm` refactor a `VoucherPDFService.generar_pdf_80mm`, nuevo `pdf_carta`, `PDFRenderer` custom.
- `backend/apps/supply_chain/recepcion/signals.py` — usa `linea.almacen_destino or instance.almacen_destino`.
- `backend/apps/supply_chain/recepcion/serializers.py` — expone `almacen_destino` y `almacen_destino_nombre` por línea.
- `backend/apps/supply_chain/recepcion/templates/voucher/voucher_80mm.html` — 12pt, logo, QC visible, estado compacto.
- `backend/apps/supply_chain/recoleccion/models.py` — `_generate_code` usa `_base_manager`, cantidad 3→1.
- `backend/apps/supply_chain/recoleccion/services.py` — `archivar_voucher_en_gd` sin PDF (doc-vivo).
- `backend/apps/supply_chain/recoleccion/views.py` — `print_58mm` retorna PDF + `PDFRenderer`.
- `backend/apps/supply_chain/liquidaciones/models.py` — `_archivar_en_gd` sin PDF, `LiquidacionLinea.cantidad` 3→1.
- `backend/apps/supply_chain/catalogos/models.py` — `RutaRecoleccion.conductor_principal` + `conductores_adicionales`.
- `backend/apps/supply_chain/catalogos/views.py` — RBAC instancia en `RutaRecoleccionViewSet`.
- `backend/apps/supply_chain/catalogos/serializers.py` — campos conductor + nombres legibles.
- `backend/apps/supply_chain/gestion_proveedores/serializers.py` — `producto_requiere_qc_recepcion`.
- `backend/apps/supply_chain/gestion_proveedores/management/commands/seed_tipos_documento_sc.py` — movido (antes en `apps/supply_chain/management/`, no se descubría).
- `backend/apps/core/tests/base.py` — fix `use_existing_tenant` con Domain `is_primary=True`.
- `backend/apps/core/management/commands/deploy_seeds_all_tenants.py` — agrega `tipos_documento_sc`.
- `backend/apps/core/management/commands/seed_estructura_final.py` — sidebar SC reordenado (Precios → Rutas → ...).

### Frontend
- `frontend/src/features/supply-chain/components/VoucherFormModal.tsx` — almacén por línea con auto-fill, sin sección Destino del header, RECOLECCION sin proveedor, QC inline.
- `frontend/src/features/supply-chain/components/VoucherDetailModal.tsx` — Card "vouchers recolección" envuelta en `modalidad === RECOLECCION`.
- `frontend/src/features/supply-chain/components/RecepcionTab.tsx` — `handlePrint` usa blob URL.
- `frontend/src/features/supply-chain/components/VoucherRecoleccionTab.tsx` — `handlePrint58mm` con PDF blob.
- `frontend/src/features/supply-chain/components/VoucherRecoleccionFormModal.tsx` — kilos 1 decimal + botón "Guardar y agregar otro".
- `frontend/src/features/supply-chain/components/RutaFormModal.tsx` — sección Conductores asignados, `useRuta(id)` para hydration fresca.
- `frontend/src/features/supply-chain/components/LiquidacionesTab.tsx` — botones por estados nuevos, conteo `lineas_count`.
- `frontend/src/features/supply-chain/components/LiquidacionDetailModal.tsx` — botones Confirmar/Pago por estados nuevos.
- `frontend/src/features/supply-chain/types/liquidaciones.types.ts` — `EstadoLiquidacion` con SUGERIDA/AJUSTADA/CONFIRMADA + `lineas_count?`.
- `frontend/src/features/supply-chain/types/precio.types.ts` — `producto_requiere_qc_recepcion?`.
- `frontend/src/features/supply-chain/types/recepcion.types.ts` — `almacen_destino` por línea + nullable en header.
- `frontend/src/features/supply-chain/types/rutas.types.ts` — `conductor_principal` + `conductores_adicionales`.
- `frontend/src/features/supply-chain/api/voucher-recoleccion.ts` — `getPrint58mm` retorna Blob PDF.

### Documentación
- `docs/01-arquitectura/hallazgos-pendientes.md` — H-SC-RUTA-RBAC-INSTANCIA actualizado a ✅ RESUELTO; agregados H-SC-RUTA-CERTIFICADOS-PV y H-SC-RUTA-LIQ-PRODUCTORES.
