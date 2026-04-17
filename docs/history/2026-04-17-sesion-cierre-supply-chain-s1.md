# Sesión 2026-04-17 — Cierre: Supply Chain S1/4 + Mi Portal + CI promotion

**Fecha:** 2026-04-17
**Ejecutor:** Claude Code (Opus)
**Alcance:** CI/CD + Mi Portal refactor + Supply Chain Sesión 1/4

---

## Commits del día (3 en main)

| Commit | Descripción | CI |
|--------|-------------|----|
| `a02859c3` | CI: 5 rutas al gate bloqueante (112→342 tests) | ✅ #889 |
| `b8b57b28` | Mi Portal: extraído de talent_hub como app LIVE | ✅ #905 |
| `824feaa5` | Supply Chain S1/4: apps/catalogo_productos/ CT-layer | ✅ #891 #907 |

---

## Estado del producto al cierre

- App LIVE con usuarios reales. Doctrina: mínimo viable por módulo.
- `CURRENT_DEPLOY_LEVEL = 20` (L0-L20 activos + Mi Portal + catalogo_productos en L15)
- Tests: **715 passed / 97 failed / 128 skipped / 0 errors**
- Gate CI bloqueante: **9 rutas, 342 tests** (antes 4 rutas / 112 tests)

---

## Trabajo 1 — CI promotion (a02859c3)

5 rutas promovidas del step informativo al bloqueante:
- `apps/audit_system/logs_sistema` (62 tests)
- `apps/audit_system/config_alertas` (39 tests)
- `apps/audit_system/centro_notificaciones` (42 tests)
- `apps/audit_system/tareas_recordatorios` (52 tests)
- `apps/ia` (35 tests)

Gate pasa de 4→9 rutas, 112→342 tests. Cobertura de regresión +205%.

---

## Trabajo 2 — Mi Portal extraction (b8b57b28)

**Problema:** Mi Portal (LIVE) vivía embebido en `apps/talent_hub/api/` (L60 NO LIVE). Violación arquitectónica: código LIVE no puede vivir dentro de módulos no-LIVE.

**Solución:**
- App nueva `apps/mi_portal/` con views, serializers, urls propios
- URL cambia de `/api/talent-hub/mi-portal/` a `/api/mi-portal/`
- talent_hub desacoplado: solo se monta si sus apps L60 están instaladas
- Frontend: BASE_URL actualizado, 7 componentes stub L60 eliminados, tabs simplificados a 5 LIVE
- Tests actualizados, `ModuleAccessMiddleware` exclusion actualizada

**Net:** +310 / -944 líneas. 0 regresiones verificadas (mi_equipo 165/26, gestion_documental 32/0, encuestas 30/12 — todos coinciden con baseline).

---

## Trabajo 3 — Catálogo de Productos (824feaa5) — Supply Chain Sesión 1/4

**Contexto:** Supply Chain (L50) no tiene modelo maestro de Producto. El inventario usa CharFields, no FKs. Primera de 4 sesiones para activar Supply Chain con modelo "Scale-based Procurement".

### Backend
- App `apps/catalogo_productos/` como CT-layer (transversal, junto a gestion_documental)
- 3 modelos (TenantModel):
  - `CategoriaProducto` — jerárquica con parent FK self
  - `UnidadMedida` — reemplaza la de supply_chain.catalogos (cambia herencia a TenantModel)
  - `Producto` — con tipo choices (MATERIA_PRIMA, INSUMO, PRODUCTO_TERMINADO, SERVICIO)
- 3 ModelViewSets con CRUD + acción `estadisticas`
- URL: `/api/catalogo-productos/{productos,categorias,unidades-medida}/` con guard `is_app_installed`
- Migración 0001 aplicada a todos los schemas

### Sidebar + RBAC
- Agregado a `NIVEL_CADENA` en `viewsets_config.py`
- `deployLevel: 15` en `modules.ts` (CT-layer visible desde ya, no L50)
- Seed en `seed_estructura_final.py`: SystemModule + 3 tabs + 3 sections, `is_enabled: True`

### Tests
- 29 tests (17 model + 12 view) con fixtures pytest
- Ruta agregada a `pytest.ini`

### 6 correcciones al brief original aplicadas
1. URLs con `is_app_installed()` guard (no "sin condicional")
2. Tests con fixtures pytest + root conftest (no Factory Boy)
3. `deployLevel: 15` para que sea visible con `CURRENT_DEPLOY_LEVEL=20`
4. Agregado a viewsets_config.py + modules.ts + seed_estructura_final.py
5. Documentado cambio de herencia de UnidadMedida (models.Model → TenantModel)
6. `unique=True` en campo `codigo`, no `unique_together`

---

## Supply Chain — Roadmap activo (sesiones 2-4)

### Sesión 2 — Proveedor adaptado (SIGUIENTE)

- Agregar campo `tipo_entidad` a `Proveedor` (choices: materia_prima, producto_servicio, unidad_interna)
- Adaptar `PrecioMateriaPrima`: FK `TipoMateriaPrima` → FK `Producto` (apps/catalogo_productos/models.py)
- Agregar `cargo_solicitante`, `cargo_receptor` (FK a Cargo) en modelos que hoy usan FK a User directamente
- Actualizar 3 call sites defensivos en core que hacen `apps.get_model('gestion_proveedores', 'Proveedor')`:
  - `core/serializers.py` líneas 272 y 390
  - `core/views/core_views.py` línea 234
- Seeds de datos base: UnidadMedida (kg, L, und, m, m²) + CategoriaProducto (Materias Primas, Insumos, Productos Terminados, Servicios)
- Migraciones + tests + CI verde

### Sesión 3 — Recepción + Voucher + Inventario

- `RecepcionCompra` (apps/supply_chain/compras/) es el modelo canónico de recepción
- Extraer `VoucherMixin` de `PruebaAcidez` (production_ops/recepcion):
  - `generar_codigo_voucher()`, numeración consecutiva mensual
- Agregar signal: `RecepcionCompra` confirmada → `MovimientoInventario` automático
- Nuevo modelo `Liquidacion`: acumula kg × precio por proveedor por período
- `Recepcion` de production_ops queda dormida
- Migraciones + tests + CI verde

### Sesión 4 — Activación integral + Deploy

- Descomentar en `base.py` TENANT_APPS:
  - `supply_chain`: catalogos, gestion_proveedores, compras, almacenamiento
  - `programacion_abastecimiento` queda comentada — sobre-construcción
  - `production_ops`: NO activar (recepcion específica de planta)
- `python manage.py migrate_schemas`
- Correr `seed_supply_chain_catalogs` por tenant
- Crear seeds RBAC: SystemModule + ModuleTab + TabSection para Supply Chain
- Frontend: cambiar `deployLevel` en `constants/modules.ts`
- Validación end-to-end: crear proveedor → crear producto → recibir → voucher generado → inventario actualizado → liquidación acumulada
- Deploy VPS (incluye Mi Portal pendiente desde `b8b57b28`)
- CI verde confirmado antes de deploy

---

## Decisiones de producto tomadas (no reabrir)

1. **Supply Chain modelo:** Scale-based Procurement / Acopio con báscula
2. **Voucher es el documento primario** (no la OC)
3. **Proveedor NO se renombra** a EntidadComercial — se agrega `tipo_entidad`
4. **apps/catalogo_productos/** vive en sidebar Grupo 7 Cadena de Valor (`deployLevel: 15`)
5. **Ubicaciones:** CharFields para MVP (sin jerarquía django-mptt)
6. **OC, Requisición, Cotización, Contratos:** dormidos en mínimo viable
7. **Evaluación proveedores, Programación abastecimiento:** dormidos
8. **PruebaAcidez** (production_ops): dormida — específica de Grasas y Huesos del Llano
9. **Portal del proveedor:** fase 2, no mínimo
10. **Pago al proveedor:** es L70-L72 Admin Finance, fuera de Supply Chain

---

## Estado del checklist 7 críticos

| Punto | Descripción | Estado |
|-------|-------------|--------|
| 1 | Aislamiento multi-tenant | ✅ VERDE |
| 2 | Modelo de datos / migraciones | ✅ VERDE |
| 3 | Auth + permisos | ✅ VERDE |
| 4 | CI/CD | 🟢 Mejor (9 rutas gate, +205% cobertura) |
| 5 | Onboarding tenant | ✅ VERDE |
| 6 | Runbook migraciones multi-tenant | 🟡 Pendiente |
| 7 | Celery fairness | 🟡 Pendiente |

---

## Deuda consciente activa

- **97 fails residuales:**
  - `gestion_estrategica/configuracion` (27)
  - `mi_equipo` (26)
  - `analytics/config_indicadores` (13)
  - `gestion_estrategica/encuestas` (12)
  - `gestion_estrategica/organizacion` (12)
  - `tenant` (7)
  - → Mapear a flujos usuario antes de fixear. Solo arreglar bloqueantes reales.
- **Mi Portal sin tests propios** (deuda inmediata)
- **Frontend `catalogo_productos` pendiente** (se construye en Sesión 4)
- **Seeds datos base `catalogo_productos` pendiente** (se hace inicio Sesión 2)
- **SSL Hostinger:** renovar en panel (no-código, pendiente Camilo)
- **Dependabot:** 43 vulnerabilidades (1 high). Fuera de cola inmediata.
- **Puntos 6 y 7** del checklist: deuda consciente, no bugs bloqueantes

---

## Archivos tocados

### Commit 1 — CI promotion
- `.github/workflows/ci.yml`

### Commit 2 — Mi Portal
- **Nuevo:** `backend/apps/mi_portal/` (5 archivos)
- **Modificado:** `backend/config/urls.py`, `backend/apps/talent_hub/urls.py`, `backend/apps/core/middleware/module_access.py`
- **Frontend:** `frontend/src/features/mi-portal/` (8 modificados, 7 eliminados)
- **Tests:** `frontend/src/__tests__/features/mi-portal/MiPortalPage.test.tsx`

### Commit 3 — Catálogo Productos
- **Nuevo:** `backend/apps/catalogo_productos/` (14 archivos: models, serializers, views, urls, admin, filters, apps, migrations, tests)
- **Modificado:** `backend/config/settings/base.py`, `backend/config/urls.py`, `backend/pytest.ini`, `backend/apps/core/viewsets_config.py`, `backend/apps/core/management/commands/seed_estructura_final.py`, `frontend/src/constants/modules.ts`

---

## Próxima sesión: arrancar con Supply Chain Sesión 2

Primer paso: seeds de datos base de `catalogo_productos` (UnidadMedida + CategoriaProducto iniciales). Después: refactor de `Proveedor` con `tipo_entidad` + migración de `PrecioMateriaPrima` para apuntar a `Producto` maestro.

Stop rule: mantener doctrina de mínimo viable. No reabrir decisiones cerradas.
