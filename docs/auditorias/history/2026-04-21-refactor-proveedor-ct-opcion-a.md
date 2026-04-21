# Sesión 2026-04-21 — Refactor Proveedor a CT (Opción A) + Precios masivo + RBAC fixes

Sesión intensa de ~8 horas con 10 commits pusheados. Primer deploy de Supply Chain + Catálogo de Productos con Proveedores.

## Commits del día

| Commit | Descripción | CI |
|--------|-------------|----|
| `bc40bec5` | `fix(precios): remove unused useQuery import — CI eslint max-warnings=0` | ⏳ pendiente (acaba de pushearse) |
| `c9f329eb` | `perf(sidebar): evitar re-renders innecesarios en navegacion` | ❌ #24703616192 (ESLint unused import — arreglado en bc40bec5) |
| `1ce0c858` | `feat(precios,pi): historial de cambios + PI lookup sin permiso de gestion` | ❌ (mismo fallo, incluido) |
| `0aa03eef` | `feat(proveedor,precios): UX iteration 3` | ❌ (mismo fallo, incluido) |
| `d7f5e10d` | `refactor(arch): separacion estricta CT/SC - precios salen del modal proveedor` | ❌ (mismo fallo, incluido) |
| `75ef3fd2` | `feat(proveedor): filtrado MP por proveedor + precios inline con trazabilidad` | ❌ (mismo fallo, incluido) |
| `4f44db69` | `fix(rbac): aplicar GranularActionPermission a catalogo_productos` | ✅ previo push |
| `92e0bbca` | `fix(rbac): section_code y adopcion FE de permisos granulares CRUD` | ✅ previo push |
| `cc3bc8f7` | `feat(proveedor): modal multi-select, modalidad logistica, sidebar seed` | ✅ previo push |
| `64916a0a` | `refactor(ct): mover Proveedor a catalogo_productos + cleanup supply_chain` | ✅ previo push |

**Total: 10 commits mios + 5 commits de otra sesión Claude paralela (reorganización docs: `f9059ed3`, `3bc187d8`, `9afc76ea`, `9e4a8885`, `552929a5`).**

## Estado del producto

- **CURRENT_DEPLOY_LEVEL**: L20 (mi_equipo) + L16 (catalogo_productos con Proveedores) + supply_chain activo
- **Tests bloqueantes BE**: 6/6 PASS (test_sidebar + test_base) en run anterior; CI Backend - Django Tests: ✅
- **Gate CI**: CodeQL ✅, CI Continuous Integration con `bc40bec5` por verificar
- **Apps LIVE tocadas**: `catalogo_productos`, `catalogo_productos.proveedores` (nuevo submodulo), `supply_chain.gestion_proveedores`, `supply_chain.recepcion`, `supply_chain.compras`, `core` (serializers, views, select_lists), `production_ops.recepcion`, `talent_hub.services`, `administracion.servicios_generales`

## Decisiones tomadas (no reabrir)

1. **Opción A (separación estricta CT/SC)**: Proveedor vive físicamente en `catalogo_productos` (CT-layer). Precios + modalidad logística viven en `supply_chain`. El modal de Proveedor (CT) gestiona SOLO datos CT — no sabe nada de SC.

2. **`tipo_persona` con 2 opciones únicamente**: Natural / Empresa. Eliminado `con_cedula` que era redundante.

3. **Empresa = NIT es el documento único**: el modal oculta `tipo_documento` + `numero_documento` cuando tipo_persona='empresa' y auto-setea `tipo_documento=NIT` invisible al usuario.

4. **Modelos eliminados completamente** (limpieza total, no deprecación):
   - `FormaPago`, `TipoCuentaBancaria` → fuera de SC (Admin/Compras cuando entren a LIVE)
   - `CondicionComercialProveedor` → fuera de SC
   - `CriterioEvaluacion`, `EvaluacionProveedor`, `DetalleEvaluacion` → fuera de SC

5. **Campos eliminados del modelo `Proveedor`**: bancarios (banco, tipo_cuenta, numero_cuenta, titular_cuenta), formas_pago M2M, dias_plazo_pago, es_independiente, unidad_negocio_id/nombre, tipo_entidad (→ tipo_persona), observaciones.

6. **`PrecioMateriaPrima.modalidad_logistica`**: nueva FK nullable — la modalidad es por (proveedor, MP), no global.

7. **PILookupField sin permiso granular**: vincular una PI a un proveedor usa `/api/core/select-lists/partes-interesadas/` (solo `IsAuthenticated`). La gestión completa sigue requiriendo `fundacion.partes_interesadas`.

8. **PreciosTab escalable**: tabla de proveedores (buscador + badges) como vista principal; click abre modal con tabla editable masiva de sus MPs. Diseñado para 1000+ proveedores.

9. **Historial de precios visible**: botón icono History por fila en `PreciosProveedorModal` → abre sub-modal con tabla append-only de cambios (fecha, usuario, anterior, nuevo, variación %, motivo).

10. **RBAC granular del DS**: `GranularActionPermission` + `section_code` aplicado a los 3 ViewSets de `catalogo_productos` (Producto, Categoria, UnidadMedida) que usaban solo `IsAuthenticated`. FE adoptó `useSectionPermissions` en todos los Tabs.

11. **Endpoint tipos-documento**: devuelve solo `nombre` en `label` (antes `"CC - Nombre"` era ruidoso).

## Deuda consciente activa

- **H-S85-sin-integracion-audit-system** (🟡 MEDIA): los CRUD de Proveedor/Producto/Precio no escriben en `audit_system.LogsSistema`. Trazabilidad doméstica (`HistorialPrecioProveedor` + `created_by/updated_by` de TenantModel) sí funciona. Deuda para certificación ISO 9001.
- **H-S9-primer-proveedor-slow-cold-start** (🟢 BAJA): primer POST a `/catalogo-productos/proveedores/` puede tardar hasta 30s por lazy imports + cold query plan. No reproducible en warm. Si reaparece, investigar locks de `ConsecutivoConfig`.
- **H-S9-portal-proveedor-invitation-en-administracion** (🟡 MEDIA): la creación de acceso al Portal Proveedor se hace en módulo Administración cuando entre a LIVE. Eliminado `CrearAccesoProveedorModal` de SC.
- **Cosmético redundancia códigos/nombres**: el usuario pidió posponer (ya no aplica al tipo_documento post-fix; resta verificar otros selects como tipo_proveedor si tiene código visible).
- **Dependabot alerts**: 45 vulnerabilidades en dependencias (1 critical, 14 high, 26 moderate, 4 low). Deuda pre-existente según MEMORY.md — no bloquea deploy.

## Próximo paso claro

**Deploy VPS**. Ejecutar tras confirmar CI verde del último push:
```bash
ssh root@vps.stratekaz.com
cd /opt/stratekaz && bash scripts/deploy.sh --no-backup
```

Post-deploy: browseo end-to-end en producción como cliente real (Ana García o cargo similar). Validar que no haya errores de migraciones multi-tenant en los schemas existentes.

Luego S8.7 (tests con cargos restringidos) — diferido de S8.5.

## Archivos clave tocados

### Backend

- `backend/apps/catalogo_productos/proveedores/__init__.py` — **nuevo** submodulo CT
- `backend/apps/catalogo_productos/proveedores/models.py` — **nuevo** (Proveedor + TipoProveedor en CT)
- `backend/apps/catalogo_productos/proveedores/serializers.py` — **nuevo**
- `backend/apps/catalogo_productos/proveedores/viewsets.py` — **nuevo** (+ action `asignar-precios` luego eliminado en Opción A)
- `backend/apps/catalogo_productos/proveedores/urls.py` — **nuevo**
- `backend/apps/catalogo_productos/proveedores/admin.py` — **nuevo**
- `backend/apps/catalogo_productos/models.py` — re-export de Proveedor/TipoProveedor
- `backend/apps/catalogo_productos/urls.py` + `admin.py` — registro
- `backend/apps/catalogo_productos/migrations/0007_tipoproveedor_proveedor_and_more.py` — **nuevo** (creación tablas)
- `backend/apps/catalogo_productos/migrations/0008_copy_proveedor_data_from_supply_chain.py` — **nuevo** (RunPython copia datos preservando PKs)
- `backend/apps/catalogo_productos/migrations/0009_alter_proveedor_tipo_persona.py` — **nuevo** (quitar CON_CEDULA)
- `backend/apps/catalogo_productos/views.py` — `GranularActionPermission` + `section_code` en los 3 ViewSets
- `backend/apps/supply_chain/gestion_proveedores/models.py` — cleanup: mantiene sólo ModalidadLogistica, PrecioMateriaPrima, HistorialPrecioProveedor. Agrega `modalidad_logistica` FK a PrecioMateriaPrima.
- `backend/apps/supply_chain/gestion_proveedores/viewsets.py` — cleanup + 2 actions nuevos: `por-proveedor/{id}` y `batch-por-proveedor`
- `backend/apps/supply_chain/gestion_proveedores/serializers.py`, `urls.py`, `filters.py`, `admin.py` — cleanup
- `backend/apps/supply_chain/gestion_proveedores/migrations/0006_remove_criterioevaluacion_aplica_a_tipo_and_more.py` — **nuevo** (cleanup eliminados + alter FKs)
- `backend/apps/supply_chain/gestion_proveedores/migrations/0007_delete_proveedor.py` — **nuevo** (DROP tabla)
- `backend/apps/supply_chain/gestion_proveedores/migrations/0008_preciomateriaprima_modalidad_logistica.py` — **nuevo** (add field)
- `backend/apps/supply_chain/gestion_proveedores/management/commands/seed_supply_chain_catalogs.py` — cleanup seeds eliminados
- `backend/apps/supply_chain/compras/models.py` — 3 FKs repuntadas (Cotizacion, OrdenCompra, Contrato)
- `backend/apps/supply_chain/compras/migrations/0003_alter_contrato_proveedor_alter_cotizacion_proveedor_and_more.py` — **nuevo**
- `backend/apps/supply_chain/compras/serializers.py` — import actualizado
- `backend/apps/supply_chain/recepcion/models.py` — FK VoucherRecepcion repuntada
- `backend/apps/supply_chain/recepcion/migrations/0002_alter_voucherrecepcion_proveedor.py` — **nuevo**
- `backend/apps/supply_chain/recepcion/tests/conftest.py` — import actualizado
- `backend/apps/supply_chain/almacenamiento/tests/factories.py` — import actualizado
- `backend/apps/supply_chain/services.py` — `apps.get_model('catalogo_productos', 'Proveedor')`
- `backend/apps/core/serializers.py`, `views/core_views.py`, `views/select_lists.py` — `apps.get_model` repuntado + endpoint ligero partes-interesadas
- `backend/apps/core/urls.py` — registra `/select-lists/partes-interesadas/`
- `backend/apps/core/management/commands/seed_estructura_final.py` — tab `proveedores` en catalogo_productos + cleanup `supply_chain.proveedores` y `.evaluaciones`
- `backend/apps/production_ops/recepcion/` — 3 `apps.get_model` repuntados
- `backend/apps/administracion/servicios_generales/serializers.py` — `apps.get_model` repuntado
- `backend/apps/talent_hub/services/contratacion_service.py` — `apps.get_model` repuntado
- Tests eliminados en `supply_chain/gestion_proveedores/tests/` (modelos borrados): `conftest_sesion2.py`, `test_models.py`, `test_viewsets.py`, `test_serializers.py`, `test_permissions.py`, `test_sesion2_tenant_model.py`

### Frontend

- `frontend/src/features/catalogo-productos/proveedores/` — nuevo feature completo: components, hooks, api, types
- `frontend/src/features/catalogo-productos/components/ProveedoresTab.tsx` — **nuevo** + RBAC
- `frontend/src/features/catalogo-productos/components/ProveedorFormModal.tsx` — **nuevo** (simplificado: 4 secciones, tipo_persona, empresa→NIT / natural→doc)
- `frontend/src/features/catalogo-productos/api/proveedores.api.ts` — **nuevo**
- `frontend/src/features/catalogo-productos/hooks/useProveedores.ts` — **nuevo**
- `frontend/src/features/catalogo-productos/types/proveedor.types.ts` — **nuevo**
- `frontend/src/features/catalogo-productos/components/{Productos,Categorias,UnidadesMedida}Tab.tsx` — `useSectionPermissions` adoptado
- `frontend/src/features/catalogo-productos/pages/CatalogoProductosPage.tsx` — sección "Proveedores"
- `frontend/src/features/supply-chain/components/PreciosTab.tsx` — reescrito: tabla de proveedores escalable + modal
- `frontend/src/features/supply-chain/components/PreciosProveedorModal.tsx` — **nuevo** (tabla editable masiva + RBAC + historial)
- `frontend/src/features/supply-chain/components/HistorialPrecioDialog.tsx` — **nuevo** (sub-modal audit log)
- `frontend/src/features/supply-chain/api/precios.api.ts` — helpers batch
- `frontend/src/features/supply-chain/hooks/usePrecios.ts` — **nuevo**
- `frontend/src/features/supply-chain/types/precio.types.ts` — **nuevo**
- `frontend/src/features/supply-chain/components/` — ELIMINADOS: ProveedoresTab, ProveedoresTable, ProveedorForm, ImportProveedoresModal, CrearAccesoProveedorModal, EvaluacionesTab, EvaluacionProveedorForm
- `frontend/src/features/supply-chain/components/CatalogosTab.tsx` — usa `useTiposProveedor` de CT, quita tipo-cuenta
- `frontend/src/features/supply-chain/pages/SupplyChainPage.tsx` — sin proveedores ni evaluaciones
- `frontend/src/routes/modules/catalogo-productos.routes.tsx` — ruta `/proveedores`
- `frontend/src/routes/modules/supply-chain.routes.tsx` — redirect legacy + cleanup
- `frontend/src/components/forms/MultiSelectCombobox.tsx` — **nuevo componente DS** (chips + search + a11y)
- `frontend/src/features/gestion-estrategica/components/PILookupField.tsx` — usa `useSelectPartesInteresadas` (lightweight)
- `frontend/src/api/select-lists.api.ts` + `hooks/useSelectLists.ts` — `getPartesInteresadas` + hook
- `frontend/src/constants/permissions.ts` — `CATALOGO_PRODUCTOS` + `GESTION_PRODUCTOS/CATEGORIAS/UNIDADES`
- `frontend/src/layouts/Sidebar.tsx` — **fix perf**: React.memo + prop pathname + useCallback toggleExpanded + useEffect bail-out

## Hallazgos abiertos

- **H-S85-sin-integracion-audit-system** — severidad MEDIA — deuda para ISO
- **H-S9-primer-proveedor-slow-cold-start** — severidad BAJA — no reproducible en warm
- **H-S9-portal-proveedor-invitation-en-administracion** — severidad MEDIA — esperar módulo Administración LIVE

Ninguno bloquea deploy S9.
