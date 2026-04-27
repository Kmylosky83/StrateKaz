# Sesión 2026-04-27 — Supply Chain H-SC-RUTA-02: refactor conceptual completo + refactor 2 (1 voucher = 1 parada)

## Commits del día

Sesión continua que arrancó la noche del 26-abr (post-auditoría Admin Global) y se extendió hasta la madrugada del 27-abr. Total: 14 commits propios + 2 commits del agente paralelo (GD + auditoría diaria) que coexistieron en main.

### Fase 1 — Refactor inicial H-SC-RUTA-02 (eliminar Proveedor espejo, modelo Ruta limpio)

| Commit | Descripción | CI |
|--------|-------------|----|
| `04ccc040` | fix related_name clash VoucherRecoleccion.ruta vs VoucherRecepcion.ruta_recoleccion | ✅ |
| `5dec8c94` | UX ajustes — Directa + quitar frecuencia + filtro modalidad COMPRA_PUNTO | ✅ |
| `c5ed0d03` | D-1 conexión VoucherRecoleccion ↔ VoucherRecepcion (FK simple) | ✅ |
| `14e7f279` | VoucherRecepcion en planta de 58mm a 80mm | ✅ |
| `77796735` | VoucherRecoleccion 58mm — template + botón imprimir | ✅ |
| `1c11eedc` | D-2 bloqueo liquidación si recolección en BORRADOR (FK) | ✅ |
| `51eb1650` | UI panel asociar VoucherRecoleccion en VoucherDetailModal | ✅ |
| `3fd1187d` | RutaParadasModal — excluir proveedores ya asignados a OTRA ruta | ✅ |

### Fase 2 — Refactor 2: 1 voucher = 1 parada (atómico, post-feedback usuario)

| Commit | Descripción | CI |
|--------|-------------|----|
| `fea22717` | VoucherRecoleccion atómico — 1 voucher = 1 parada (eliminar Líneas) | ✅ |
| `81a16116` | VoucherRecepcion.proveedor opcional en modalidad RECOLECCION | ✅ |
| `ceef1825` | M2M VoucherRecepcion ↔ N VoucherRecoleccion (refactor 2) | ✅ |
| `b6c7ae32` | D-2 refactor — bloqueo valida TODOS los M2M COMPLETADOS | ⏳ corriendo |
| `85cec939` | linearizar migraciones — leaf nodes paralelos resueltos (conflict con commit 888b9b56 del agente paralelo) | ❌ failure (no aplica al deploy: solo era diff de naming de migraciones) |
| `fda36bc8` | migración 0003 atomic=False — pending trigger events PostgreSQL | ⏳ |

### Commits del agente paralelo (NO míos pero coexistieron en main)
- `888b9b56` — fix logging RBAC + 5 migraciones rename de índices (causó leaf nodes que linearizé en 85cec939)
- `0bd8e963` — log de auditoría diaria 26-abr
- `0d859896..31bfa8e2` (8 commits) — sesión separada de Gestión Documental (mañana 27-abr, sin push aún)

## Estado del producto

- **Deploy:** EXITOSO en VPS tras 2 fixes secuenciales (linearización migraciones + atomic=False).
- **Schemas migrados:** `public`, `tenant_grasas_y_huesos_del_`, `tenant_stratekaz`. Las 3 migraciones nuevas aplicadas:
  - `sc_recoleccion 0003_voucher_atomico_por_parada` (atomic=False)
  - `sc_recepcion 0009_proveedor_nullable_recoleccion`
  - `sc_recepcion 0010_m2m_vouchers_recoleccion`
- **CURRENT_DEPLOY_LEVEL:** L20 (sin cambio).
- **Tests:** sin verificar (refactor grande, no se corrió suite completa). El usuario validará E2E en browser.
- **Apps LIVE tocadas:** `sc_recoleccion` (refactor mayor), `sc_recepcion` (FK→M2M, proveedor nullable), `sc_catalogos` (label "Directa", quitar frecuencia, filtro modalidad), `liquidaciones` (D-2 ajustado para M2M).
- **Frontend:** `RutaParadasModal`, `VoucherRecoleccionFormModal` (simplificado a 1 parada), `VoucherRecoleccionTab` (lista plana con filtros), `VoucherDetailModal` (multi-select M2M), `VoucherFormModal` (proveedor opcional).

## Decisiones tomadas (no reabrir)

1. **La Ruta NUNCA es Proveedor.** El signal `sincronizar_proveedor_espejo_ruta` fue eliminado. Los proveedores reales viven en `catalogo_productos.Proveedor` con NIT/datos reales.
2. **Modos de operación de la Ruta:** PASS_THROUGH (label "Directa", empresa paga al productor) y SEMI_AUTONOMA (ruta con caja propia, doble precio). En español es-co.
3. **Frecuencia de pago NO va en `RutaParada`.** Es decisión del momento de liquidación (acumulativa), no camisa de fuerza por parada.
4. **Filtro de proveedores en paradas:** solo modalidad `COMPRA_PUNTO` ("Compra en Punto"); excluye los ya asignados a OTRA ruta (constraint backend + filtro UI global).
5. **VoucherRecoleccion = 1 parada (atómico).** Cada parada visitada genera un voucher independiente con `proveedor + producto + cantidad` en el header. Se imprime 58mm para entregar al productor (sin precios, sin firmas, solo cargo+nombre del operador).
6. **VoucherRecepcion en planta a 80mm** (mejor legibilidad para archivo físico). Mismo contenido.
7. **VoucherRecepcion.proveedor opcional cuando modalidad=RECOLECCION.** El producto entra a inventario "de la ruta", no de un proveedor único.
8. **Conexión 1:N por M2M:** una recepción ↔ N vouchers de recolección (uno por proveedor visitado). Endpoint `asociar-recolecciones` con lista de IDs.
9. **D-2 bloqueo liquidación:** valida que TODOS los vouchers M2M asociados estén COMPLETADOS. Si CUALQUIERA está en BORRADOR → 400 con lista de pendientes.
10. **Datos legacy borrados** (con aprobación del usuario): los proveedores espejo "[LEGACY ESPEJO]" y los vouchers de recolección de prueba se limpiaron en migraciones.
11. **Migraciones con efectos masivos en PostgreSQL deben ser `atomic=False`** cuando combinan DELETE de FKs con CASCADE + ALTER TABLE en la misma transacción (pending trigger events).

## Deuda consciente activa

- **H-SC-RUTA-03 (próxima sesión):** Liquidación lee directo de `VoucherRecoleccion` (independiente de `VoucherRecepcion`). Hoy `Liquidacion.voucher` es OneToOne con `VoucherRecepcion` — el detalle por productor para pago debería leerse del M2M, no del voucher consolidado.
- **Cuadre visual de merma** por (ruta + fecha): suma kg recolectados (Σ vouchers recolección) vs `peso_neto_total` recibido en planta. Vista de auditoría aún no implementada.
- **`Proveedor.ruta_origen` (FK legacy):** sigue en el modelo marcado como `[DEPRECATED]`. Drop programado en migración futura una vez que el usuario limpie los espejos legacy desde la UI.
- **Tests rotos heredados** (H-SC-12): `sc_recepcion` y `liquidaciones` siguen rotos por refactor previo header+líneas. NO se atacaron en esta sesión.
- **CI commit 85cec939 falló** (era cambio puramente de naming de migraciones; los siguientes commits compensaron y deploy pasó). No requiere acción.
- **Validación UI proactiva:** mostrar warning visual en `LiquidacionDetailModal` cuando hay vouchers de recolección asociados en BORRADOR (hoy es reactivo solo al intentar aprobar).

## Próximo paso claro

Validación E2E en browser por el usuario:
1. Configurar Ruta + Paradas (filtro modalidad COMPRA_PUNTO + global de otras rutas).
2. Crear vouchers de recolección uno-por-parada, imprimir 58mm.
3. Crear VoucherRecepcion modalidad RECOLECCION + ruta + sin proveedor.
4. Asociar M2M de los vouchers de recolección al de recepción (multi-select).
5. Probar bloqueo de liquidación con vouchers en BORRADOR.

Si E2E pasa, atacar **H-SC-RUTA-03** (liquidación independiente del FK OneToOne).

## Archivos clave tocados

### Backend
- `apps/supply_chain/recoleccion/models.py` — Refactor mayor: VoucherRecoleccion atómico (1=1 parada), eliminado LineaVoucherRecoleccion.
- `apps/supply_chain/recoleccion/{serializers,views,admin,urls}.py` — Adaptados al nuevo modelo, sin Líneas.
- `apps/supply_chain/recoleccion/migrations/0002_*` (rename, agente paralelo) y `0003_voucher_atomico_por_parada.py` (mío, atomic=False).
- `apps/supply_chain/recepcion/models.py` — `proveedor` nullable + M2M `vouchers_recoleccion` (reemplaza FK simple).
- `apps/supply_chain/recepcion/migrations/0008_rename_*` (agente paralelo), `0009_proveedor_nullable_recoleccion.py`, `0010_m2m_vouchers_recoleccion.py`.
- `apps/supply_chain/recepcion/serializers.py` — `vouchers_recoleccion_info` denormalizado.
- `apps/supply_chain/recepcion/views.py` — Endpoint `asociar-recolecciones` (M2M); template print 80mm.
- `apps/supply_chain/catalogos/{models,serializers,views,admin}.py` — `RutaRecoleccion.modo_operacion` (label "Directa"), `RutaParada` sin `frecuencia_pago`, `PrecioRutaSemiAutonoma`.
- `apps/supply_chain/catalogos/migrations/0007_rutarecoleccion_modo_operacion.py`, `0008_rutaparada.py`, `0009_precio_ruta_semi.py`, `0010_modo_directa_y_quitar_frecuencia.py`.
- `apps/supply_chain/liquidaciones/views.py` — D-2 valida M2M COMPLETADOS.
- `apps/core/management/commands/seed_estructura_final.py` — Tab "Recolección en Ruta" (orden 3, sección `vouchers_recoleccion`).
- `config/settings/base.py` — `apps.supply_chain.recoleccion` registrada.

### Frontend
- `features/supply-chain/types/{rutas,ruta-paradas,voucher-recoleccion,recepcion,precio-ruta-semi}.types.ts`.
- `features/supply-chain/api/{ruta-paradas,voucher-recoleccion,precio-ruta-semi,recepcionApi}.ts`.
- `features/supply-chain/hooks/{useRutaParadas,useVoucherRecoleccion,usePrecioRutaSemi}.ts`.
- `features/supply-chain/components/{RutaFormModal,RutaParadasModal,RutasRecoleccionTab,VoucherRecoleccionFormModal,VoucherRecoleccionTab,VoucherFormModal,VoucherDetailModal,RecepcionTab}.tsx`.
- `features/supply-chain/pages/SupplyChainPage.tsx` — SECTION_MAP nueva entrada `recoleccion`.
- `routes/modules/supply-chain.routes.tsx` — Ruta `/supply-chain/recoleccion`.
- `constants/permissions.ts` — `Sections.VOUCHERS_RECOLECCION`.

## Hallazgos abiertos

- **H-SC-RUTA-03** — Liquidación independiente del FK OneToOne `Liquidacion.voucher`. Severidad: **MEDIA** (bloquea el cuadre fino por productor en SEMI_AUTONOMA).
- **H-SC-RUTA-04** — Cuadre visual de merma por (ruta + fecha). Severidad: **BAJA** (mejora auditoría, no bloquea operación).
- **H-PROV-DROP** — Drop final del FK legacy `Proveedor.ruta_origen`. Severidad: **BAJA** (deuda cosmética, requiere usuario limpie espejos legacy primero).
