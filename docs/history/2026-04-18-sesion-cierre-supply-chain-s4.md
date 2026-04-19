# Sesión 2026-04-18 — Cierre Supply Chain S4 (reescritura `almacenamiento/` + signal)

## Commits del día

| Commit | Descripción | CI |
|--------|-------------|----|
| `f6772b18` | feat(supply-chain): S4 FASE 1 — almacenamiento reescrito con TenantModel + FK Producto | (encadenado) |
| `d26e219c` | feat(supply-chain): S4 FASE 2 — signal Voucher APROBADO → MovimientoInventario | (encadenado) |
| `87a124db` | feat(supply-chain): S4 FASE 3 — serializers + views con FK Producto (cleanup empresa) | cancelled (superseded) |
| `980f4418` | fix(supply-chain): S4 hot-fix — almacenamiento usa catalogo_productos.UnidadMedida | (encadenado) |
| `a841f5f2` | test(supply-chain): S4 FASE 4+5 — tests almacenamiento + admin configurado (25/25 OK) | CodeQL ✅ / CI cancelled |
| `8046faff` | fix(supply-chain): resuelve conflicto useLiquidaciones en barrel export | cancelled (superseded) |
| `18d1ae03` | fix(celery): desactiva task_routes de revision_direccion (app pre-LIVE) | pending push |

## Estado del producto

- **CURRENT_DEPLOY_LEVEL:** 20 (sin cambio — `almacenamiento`, `sc_recepcion`, `liquidaciones` siguen pre-LIVE).
- **Almacenamiento:** reescrito completo. `0001_initial.py` nuevo (1441 LOC).
- **Tests:** 25/25 pasan con `manage.py test` (catálogos, Inventario, Movimiento, ConfiguracionStock, signal idempotente, viewsets CRUD). Migraciones aplican limpio.
- **Frontend build:** ✅ verificado local en 3m 17s tras fix del conflicto `useLiquidaciones`.
- **Django check:** ✅ limpio.

## Decisiones tomadas (no reabrir)

### 1. `almacenamiento` hereda `TenantModel` (L17 FK `Producto`)

- 8 modelos migrados de `models.Model` a `TenantModel`.
- Campo `empresa` FK eliminado (redundante con schema-per-tenant).
- `producto_codigo`/`producto_nombre` CharField → FK a `catalogo_productos.Producto` en `Inventario`, `MovimientoInventario`, `ConfiguracionStock`.
- `Inventario.producto_tipo` eliminado (redundante con `producto.tipo`).
- Cross-C2 `tipo_epp_id` + `tipo_epp_nombre` preservados (patrón M1 IntegerField → `seguridad_industrial.TipoEPP`).
- `unidad_medida` preservado (puede diferir de `producto.unidad_medida` con factor de conversión).

### 2. Catálogos dinámicos preservados como modelos DB

- `TipoMovimientoInventario`, `EstadoInventario`, `TipoAlerta` siguen siendo modelos (NO convertidos a `TextChoices`).
- Decisión explícita: el docstring de `models.py` declara "100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos".
- El brief original proponía evaluar TextChoices — descartado por contradecir decisión arquitectónica.

### 3. Signal Voucher APROBADO → MovimientoInventario + Inventario

- Método `VoucherRecepcion.aprobar()` añadido como entrada canónica (idempotente, valida transición desde PENDIENTE_QC).
- Signal `post_save` en `apps/supply_chain/recepcion/signals.py` fires al detectar `estado=APROBADO`.
- Idempotencia: filtro `origen_tipo='VoucherRecepcion' + origen_id=voucher.pk`.
- `@transaction.atomic()` como savepoint defensivo.
- Belt-and-suspenders: aunque alguien edite `estado` vía admin/shell, el signal crea el movimiento si no existe.
- Crea o incrementa `Inventario` del almacén destino con costo promedio ponderado.
- Fallo defensivo con `logger.error` si faltan catálogos base (TipoMovimiento ENTRADA, EstadoInventario DISPONIBLE).

### 4. Hot-fix durante FASE 4: `UnidadMedida` redundante

- Hallazgo: **dos modelos `UnidadMedida`** en el codebase.
  - `apps.supply_chain.catalogos.UnidadMedida` — `models.Model` plano (legacy).
  - `apps.catalogo_productos.UnidadMedida` — `TenantModel` (LIVE L17).
- Los docstrings de `catalogo_productos/models.py:8,82` declaran que el nuevo "Reemplaza supply_chain.catalogos.UnidadMedida".
- Type mismatch detectado: signal asignaba `voucher.producto.unidad_medida` (cat_productos) a `MovimientoInventario.unidad_medida` (apuntaba a sc.catalogos) → incompatible.
- Fix: migrado almacenamiento al target correcto. Campos ajustados: `simbolo→abreviatura`, `factor_conversion_kg→factor_conversion`, `codigo/is_active` removidos (no existen en el nuevo modelo).
- Migración `0001_initial` regenerada apuntando a `catalogo_productos.unidadmedida`.

### 5. Frontend: conflicto `useLiquidaciones` en barrel export

- Dos hooks con el mismo nombre exportados desde `hooks/index.ts`:
  - `useProgramacion.ts:763` (legacy `programacion_abastecimiento.liquidacion` API).
  - `useLiquidaciones.ts:21` (S3 dedicado `supply_chain.liquidaciones` API).
- Vite fallaba: `"useLiquidaciones" is not exported by hooks/index.ts` al importar desde `ProgramacionTab.tsx:43`.
- Fix: renombrados 7 hooks legacy en `useProgramacion.ts` con prefijo `Programacion*` para eliminar el conflicto preservando ambos consumers.
- `ProgramacionTab.tsx` actualizado para usar `useProgramacionLiquidaciones`.
- Build verificado local antes del push.

### 6. Tests con patrón `BaseTenantTestCase` + `create_system_module`

- Tests de views fallaban con 403 porque `ModuleAccessMiddleware` bloquea rutas de `supply_chain` si no hay `SystemModule(code='supply_chain', is_enabled=True)` en el tenant.
- Fix: cada test class de viewsets llama `self.create_system_module(code='supply_chain', name='Supply Chain')` en `setUp()`.
- `factories.py` centraliza la cadena completa de dependencias (EmpresaConfig, ConsecutivoConfig, Producto, Proveedor, Almacen, etc.).

### 7. FASE 6 excluida del scope (`TipoMateriaPrima` ≠ `Producto`)

- El brief original tenía FASE 6 para migrar 9 call sites en `production_ops/recepcion` de `TipoMateriaPrima` → `Producto`.
- Análisis reveló que **no son equivalentes**: `TipoMateriaPrima` tiene `acidez_min`, `acidez_max`, método `obtener_por_acidez()` — lógica específica de materia prima con reglas de negocio.
- Decisión: sacar FASE 6 del S4, abrir hallazgo `H-S4-tipomateriaprima-vs-producto` para sesión dedicada.

## Deuda consciente activa

### Deuda técnica creada en S4

- **H-S4-1**: Desactivación del task_routes en `celery.py` (commit `18d1ae03`) no pusheado hasta terminar el CI corriente. Push pendiente.
- **H-S4-views-refactor**: `almacenamiento/views.py` sigue siendo god-file de 903 LOC con 10 ViewSets. Refactor a módulos separados para sesión dedicada.
- **H-S4-tipomateriaprima-vs-producto**: 9 call sites en `production_ops/recepcion` usan `TipoMateriaPrima`. Sesión dedicada para decidir: fusionar, especializar via `CategoriaProducto`, o mantener separado.
- **H-S4-reversal**: No hay política de reversal del signal — si un voucher se rechaza/anula después de APROBADO, el `Inventario` queda incrementado. No bloqueante hoy. Abrir issue cuando se active el módulo.

### Deuda heredada (no atendida en S4)

- Ver `docs/history/2026-04-17-sesion-cierre-supply-chain-s3-1.md` sección "Deuda consciente activa".
- H-S3.1-4 (`VoucherFormModal` placeholder) sigue abierto.
- H-S3-2 y H-S3-5 heredados siguen abiertos.

### Deuda operacional detectada en Sentry

- **PYTHON-DJANGO-2** (157 eventos en 2 meses): `KeyError` en `celery.worker.consumer.on_task_received` para `enviar_recordatorio_revision`. Causa: mensajes zombie en Redis queue `notifications` de cuando el app estaba activo. Task routing parcialmente fixed en `18d1ae03`. Acción operacional restante: `celery -A config purge -Q notifications --force` en VPS.
- **STRATEKAZ-MARKETING-3** (1 evento, 7d): `TypeError: D is not a function` en marketing site. Sin commit específico identificable (no hay cambios de marketing entre 2026-04-10 y 2026-04-13). Requiere stack trace con sourcemap resolvido.
- **STRATEKAZ-P** (2 eventos, 2 semanas): `Failed to fetch dynamically imported module` — stale chunk de PWA tras deploy. Deuda pre-existente, config `vite-plugin-pwa` necesita `cleanupOutdatedCaches: true`.
- **STRATEKAZ-J** (4 eventos, 12 semanas): `WebGL context error` en login. Entorno de cliente, fallback opcional.

## Próximo paso claro

**S5**: Cuando S4 esté consolidado post-push:
1. Ejecutar seed de catálogos base (`TipoMovimientoInventario` con ENTRADA/SALIDA/AJUSTE, `EstadoInventario` con DISPONIBLE/RESERVADO/BLOQUEADO, `TipoAlerta` con STOCK_MINIMO/VENCIMIENTO).
2. Migrar viewsets de `recepcion`/`liquidaciones` a `GranularActionPermission` con `section_code` (H-S3.1-2).
3. Activar módulos `sc_recepcion` + `liquidaciones` + `almacenamiento` en `base.py` (descomentar líneas 181-184).
4. Correr `deploy_seeds_all_tenants` para distribuir seeds a tenants existentes.
5. Incrementar `CURRENT_DEPLOY_LEVEL` a 35.

## Archivos clave tocados

### Backend

- `backend/apps/supply_chain/almacenamiento/models.py` — reescrito (8 modelos TenantModel + FK Producto).
- `backend/apps/supply_chain/almacenamiento/migrations/0001_initial.py` — nuevo (1441 LOC).
- `backend/apps/supply_chain/almacenamiento/serializers.py` — reescrito con FK + retro-compat.
- `backend/apps/supply_chain/almacenamiento/views.py` — cleanup empresa + FK.
- `backend/apps/supply_chain/almacenamiento/admin.py` — configuración con list_display, search_fields, raw_id_fields.
- `backend/apps/supply_chain/almacenamiento/tests/factories.py` — nuevo, cadena completa.
- `backend/apps/supply_chain/almacenamiento/tests/test_models.py` — reescrito con `BaseTenantTestCase`.
- `backend/apps/supply_chain/almacenamiento/tests/test_signal.py` — nuevo, 7 tests del signal.
- `backend/apps/supply_chain/almacenamiento/tests/test_views.py` — reescrito con `create_system_module`.
- `backend/apps/supply_chain/recepcion/models.py` — añadido método `.aprobar()`.
- `backend/apps/supply_chain/recepcion/signals.py` — reemplazado placeholder con implementación real.
- `backend/config/celery.py` — desactivado task_routes zombie.

### Frontend

- `frontend/src/features/supply-chain/hooks/useProgramacion.ts` — 7 hooks renombrados con prefijo `Programacion*`.
- `frontend/src/features/supply-chain/components/ProgramacionTab.tsx` — import actualizado.

## Hallazgos abiertos

Ver "Deuda consciente activa" arriba. Severidad:

- **H-S4-1** (push pendiente): BAJA — commit local, push tras CI verde.
- **H-S4-views-refactor**: MEDIA — god-file 903 LOC, afecta mantenibilidad.
- **H-S4-tipomateriaprima-vs-producto**: MEDIA — requiere decisión arquitectónica.
- **H-S4-reversal**: BAJA — no bloqueante hasta activación del módulo.

Ninguno bloqueante para continuar a S5.
