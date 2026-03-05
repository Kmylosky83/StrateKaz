# Plan de Remediacion Integral — Modulo Cadena de Suministro

## Resumen

Refactorizar el modulo Supply Chain (5 sub-apps, ~50 modelos backend, ~40 archivos frontend) para cumplir con los gold standards del proyecto. Se ejecuta en **10 fases secuenciales** backend-first.

**Gold standards de referencia:**
- Backend modelos: `core/base_models/base.py` → `BaseCompanyModel` (usado por motor_riesgos)
- Backend views: `core/mixins.py` → `StandardViewSetMixin` (usado por motor_riesgos)
- Frontend API: `lib/api-factory.ts` → `createApiClient`
- Frontend hooks: `lib/crud-hooks-factory.ts` → `createCrudHooks` + `lib/query-keys.ts`
- Frontend modals: `components/modals/FormModal.tsx` + RHF + Zod
- Frontend tablas: TanStack React Table + `components/layout/DataTableCard.tsx`

---

## FASE 1: Backend Models — Migrar a BaseCompanyModel

**Archivos:** 5 models.py (~4,000 lineas)

### 1.1 Catalogos (catalogos/models.py)
- `UnidadMedida`: migrar de `models.Model` → `TimestampedModel, SoftDeleteModel, OrderedModel`
- `Almacen`: ya usa `BaseCompanyModel` — sin cambios

### 1.2 Compras (compras/models.py ~800 lineas)
- 8 catalogos → `TimestampedModel, SoftDeleteModel, OrderedModel`
  - Eliminar campos manuales duplicados (is_active, created_at, updated_at, orden)
  - `is_active` → viene de `SoftDeleteModel`
  - `orden` → viene de `OrderedModel`
  - `created_at/updated_at` → viene de `TimestampedModel`
- 7 entidades (`Requisicion`, `Cotizacion`, etc.) → `BaseCompanyModel`
  - Eliminar campos manuales: `empresa`, `created_by`, `created_at`, `updated_at`, `deleted_at`
  - Se gana `updated_by` automaticamente
  - Reemplazar `unique_together` → `UniqueConstraint`

### 1.3 Almacenamiento (almacenamiento/models.py ~957 lineas)
- 3 catalogos → `TimestampedModel, SoftDeleteModel, OrderedModel`
- 5 entidades → `BaseCompanyModel`
  - `MovimientoInventario.registrado_por` → renombrar a `created_by`
  - `ConfiguracionStock.activo` → eliminar (usar `is_active` de SoftDeleteModel)

### 1.4 Programacion (programacion_abastecimiento/models.py ~850 lineas)
- 4 catalogos → `TimestampedModel, SoftDeleteModel, OrderedModel`
- 4 entidades → `BaseCompanyModel`
  - `AsignacionRecurso.asignado_por` → renombrar a `created_by`
  - `Programacion`: eliminar soft_delete/restore manuales

### 1.5 Gestion Proveedores (gestion_proveedores/models.py ~982 lineas)
- 6 catalogos → `TimestampedModel, SoftDeleteModel, OrderedModel`
- 8 entidades → `BaseCompanyModel`
  - `Proveedor`: mantener soft_delete override especial (DEL-{id}- prefix para unique fields)
  - `UnidadNegocio`: eliminar soft_delete/restore manuales

### 1.6 Migraciones
- `SeparateDatabaseAndState` para campos que ya existen en DB
- Campos nuevos (`updated_by`) como nullable
- `RenameField` para registrado_por → created_by, asignado_por → created_by

---

## FASE 2: Backend Serializers — Corregir y deduplicar

### 2.1 Deduplicar UnidadMedidaSerializer
- UNA SOLA version canonica en `catalogos/serializers.py`
- Eliminar las 3 copias en almacenamiento, programacion, gestion_proveedores

### 2.2 Estandarizar List serializers
- Cambiar List serializers para retornar objetos nested (`estado_data`, `tipo_data`) en vez de campos flat. Alinea con frontend types existentes.

### 2.3 Corregir bugs
- `hasattr(value, 'ejecucion')` → `.objects.filter().exists()`
- `hasattr(value, 'liquidacion')` → `.objects.filter().exists()`
- Eliminar imports muertos en compras/serializers.py
- `fields = '__all__'` → lista explicita

### 2.4 Corregir PrimaryKeyRelatedField
- `RegistrarMovimientoSerializer` y `AjustarInventarioSerializer` → `IntegerField` + validate manual

---

## FASE 3: Backend Views — Migrar a StandardViewSetMixin

### 3.1 Crear supply_chain/base_views.py
- `CatalogoBaseViewSet(StandardViewSetMixin, ModelViewSet)` compartido

### 3.2 Migrar ~20 catalog ViewSets → CatalogoBaseViewSet
- Ganan: toggle-active, bulk actions, audit, inactive filtering

### 3.3 Migrar ~15 entity ViewSets → StandardViewSetMixin
- Eliminar filtrado manual `deleted_at__isnull=True`
- Agregar `protected_relations` para delete seguro
- Agregar `select_related_fields`/`prefetch_related_fields`

### 3.4 Corregir N+1 queries
- `_filter_bajo_stock()` → subquery/annotation
- `DashboardInventarioViewSet` → DB aggregation
- `ConfiguracionStockSerializer.get_inventario_actual` → select_related en viewset

### 3.5 Agregar url_path='kebab-case' en @action multi-palabra

### 3.6 Eliminar triple registro de UnidadMedidaViewSet
- Solo en catalogos/urls.py

---

## FASE 4: Backend URLs — Alinear

### 4.1 Montar catalogos/urls.py en supply_chain/urls.py
### 4.2 Corregir 16 URL mismatches (agregar url_path a @action)
### 4.3 Implementar endpoints faltantes (estadisticas, export_excel) o limpiar frontend

---

## FASE 5: Frontend API — Migrar a createApiClient

### 5.1 Migrar 6 API files a usar `createApiClient` de `@/lib/api-factory`
### 5.2 Estandarizar imports → `@/lib/api-client`
### 5.3 Eliminar `Record<string, any>` → `Record<string, unknown>`

---

## FASE 6: Frontend Hooks — Migrar a createCrudHooks

### 6.1 Migrar 6 hooks files
- `createQueryKeys('sc-{entity}')` reemplaza query keys manuales
- `createCrudHooks(api, keys, 'Nombre')` reemplaza CRUD hooks manuales
- Mantener hooks custom de negocio como manuales
- Eliminar placeholders vacios

### 6.2 Eliminar `any` → `unknown`

---

## FASE 7: Frontend Types — Alinear con backend

### 7.1 Deduplicar UnidadMedida → unica definicion en catalogos.types.ts
### 7.2 Alinear DTOs con serializers reales
### 7.3 Eliminar `Record<string, any>`

---

## FASE 8: Frontend Modals — Migrar a FormModal + RHF + Zod

5 modals a migrar (ProveedorForm.tsx ya es gold standard):
1. `MovimientoInventarioFormModal.tsx` → FormModal + RHF + Zod
2. `ProgramacionFormModal.tsx` → FormModal + RHF + Zod
3. `RequisicionFormModal.tsx` → FormModal + RHF + Zod
4. `EvaluacionProveedorForm.tsx` → FormModal + RHF + Zod + useSelectProveedores
5. `CrearAccesoProveedorModal.tsx` → agregar RHF + Zod (ya usa BaseModal)

Para cada uno: definir Zod schema, eliminar useState manuales, eliminar FK=0.

---

## FASE 9: Frontend Tables — TanStack Table + DataTableCard

8 tabs a migrar (~4,200 lineas):
1. `ProveedoresTable.tsx` → TanStack + FilterCard + DataTableCard
2. `CatalogosTab.tsx` → TanStack + ConfirmDialog (eliminar window.confirm)
3. `ComprasTab.tsx` → TanStack (5 secciones)
4. `AlmacenamientoTab.tsx` → TanStack (5 secciones)
5. `ProgramacionTab.tsx` → TanStack (5 secciones)
6. `EvaluacionesTab.tsx` → TanStack + ConfirmDialog
7. `PreciosTab.tsx` → TanStack + fix bug motivo_cambio
8. `UnidadesNegocioTab.tsx` → TanStack + ConfirmDialog

Patron por tabla: `useReactTable` + `ColumnDef[]` + `DataTableCard` + `Badge` para estados.

---

## FASE 10: Frontend Cleanup

### 10.1 SupplyChainPage.tsx: `Tabs` → `PageTabs`
### 10.2 Inline forms en tabs → modales dedicados con RHF
### 10.3 Completar permissions.ts con secciones COMPRAS, ALMACENAMIENTO, PROGRAMACION, CATALOGOS
### 10.4 Eliminar todos los `any` restantes

---

## Orden de ejecucion

```
FASE 1 (Backend Models)      ← Fundacional
  ↓
FASE 2 (Backend Serializers)  ← Depende de modelos
  ↓
FASE 3 (Backend Views)        ← Depende de modelos + serializers
  ↓
FASE 4 (Backend URLs)         ← Depende de views
  ↓
FASE 5 (Frontend API)         ← Depende de URLs alineadas
  ↓
FASE 6 (Frontend Hooks)       ← Depende de API migrada
  ↓
FASE 7 (Frontend Types)       ← Depende de serializers alineados
  ↓
FASE 8 (Frontend Modals)      ← Depende de hooks + types
  ↓
FASE 9 (Frontend Tables)      ← Depende de hooks + types
  ↓
FASE 10 (Frontend Cleanup)    ← Final polish
```

## Riesgos y mitigacion

| Riesgo | Mitigacion |
|--------|-----------|
| Migraciones rompen DB | `SeparateDatabaseAndState`, campos nuevos nullable |
| Rename de campos | `RenameField` + actualizar serializers en mismo commit |
| Frontend se rompe | Commits atomicos por sub-app (backend+frontend juntos) |
| Volumen enorme | Ejecutar por sub-app, no por fase global |

## Estimacion

| Fase | Complejidad | Archivos |
|------|------------|----------|
| F1 Models | Alta | 5 models.py + 5 migrations |
| F2 Serializers | Media | 5 serializers.py |
| F3 Views | Alta | 5 views.py + 1 nuevo |
| F4 URLs | Baja | 3 urls.py |
| F5 FE API | Media | 6 api files |
| F6 FE Hooks | Media | 6 hooks files |
| F7 FE Types | Baja | 7 type files |
| F8 FE Modals | Alta | 5 modals |
| F9 FE Tables | Muy Alta | 8 tabs (~4200 lineas) |
| F10 Cleanup | Baja | ~5 files |
