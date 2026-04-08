# Coding Standards & Patterns — StrateKaz SGI

## 1. Nomenclatura (ver también [naming-conventions.md](naming-conventions.md))

| Contexto | Estilo | Ejemplo |
|----------|--------|---------|
| URLs API | `kebab-case` | `/api/riesgos/riesgos-viales/` |
| Python funciones/variables | `snake_case` | `def cambiar_estado()` |
| Python clases | `PascalCase` | `class RiesgoVialViewSet` |
| Django campos DB | `snake_case` | `fecha_implementacion` |
| DRF @action `url_path` | `kebab-case` | `url_path='cambiar-estado'` |
| TS variables/funciones | `camelCase` | `const cambiarEstado` |
| TS interfaces/types/components | `PascalCase` | `interface RiesgoVial` |
| TS constantes globales | `UPPER_SNAKE_CASE` | `const BASE_URL` |
| Campos JSON API req/res | `snake_case` | `fecha_implementacion` |
| Carpetas features FE | `kebab-case` | `features/talent-hub/` |
| Archivos componentes | `PascalCase.tsx` | `RiesgoFormModal.tsx` |
| Archivos API/hooks | `camelCase.ts` | `riesgosApi.ts` |
| Git branches | `kebab-case` | `feat/risk-matrix` |
| Commits | Conventional | `feat(riesgos): add matrix` |

---

## 2. TypeScript Patterns

### 2.1. Tipos 3-tier (módulos complejos)
```typescript
// List — campos mínimos para listados
interface EntityList { id: number; nombre: string; estado: string; estado_display?: string; }

// Detail — todos los campos + relaciones
interface EntityDetail extends EntityList { descripcion: string; responsable_nombre?: string; created_at?: string; }

// Create — solo campos editables
interface EntityCreate { nombre: string; descripcion?: string; responsable?: number; }

// Update — parcial de Create
type EntityUpdate = Partial<EntityCreate>;

// Filter — params de query
interface EntityFilter { estado?: string; responsable?: number; search?: string; }
```

### 2.2. Enums sincronizados con backend
```typescript
// SIEMPRE copiar valores EXACTOS de CHOICES de models.py
export type EstadoProceso = 'iniciado' | 'en_curso' | 'completado' | 'cancelado';

// Labels y colores para UI
export const ESTADO_PROCESO_LABELS: Record<EstadoProceso, string> = {
  iniciado: 'Iniciado', en_curso: 'En Curso', completado: 'Completado', cancelado: 'Cancelado',
};
export const ESTADO_PROCESO_COLORS: Record<EstadoProceso, string> = {
  iniciado: 'bg-blue-100 text-blue-700', en_curso: 'bg-yellow-100 text-yellow-700', ...
};

// Options para Select
export const estadoProcesoOptions = [
  { value: 'iniciado', label: 'Iniciado' },
  { value: 'en_curso', label: 'En Curso' },
  ...
];
```

### 2.3. Reglas de tipos TS
- **DecimalField = `string`** en TS (DRF serializa como string, NO number)
- **FK = `number`** en types, no el objeto
- **Campos read_only del serializer** = `?` optional en Detail, NO presentes en Create
- **`_display` campos** = solo en List/Detail (serializer method fields)
- **NUNCA inventar campos** — leer serializer antes de escribir tipos

### 2.4. Campos JSON: snake_case
```typescript
// ✅ CORRECTO — coincide con serializer
interface Riesgo { fecha_identificacion: string; tipo_riesgo: number; }

// ❌ MAL — camelCase no coincide con BE
interface Riesgo { fechaIdentificacion: string; tipoRiesgo: number; }
```

---

## 3. React Patterns

### 3.1. Componentes — Design System OBLIGATORIO
ANTES de escribir React, buscar componentes existentes:
- `components/common/` — Button, Badge, Card, Spinner, Alert, EmptyState, SectionHeader (64 archivos)
- `components/forms/` — Input, Select, Textarea, DatePicker, Switch, RichTextEditor (10 inputs)
- `components/layout/` — DataTableCard, FilterCard (6 archivos)
- `components/modals/` — BaseModal, ConfirmDialog (7 archivos)
- `components/data-display/` — KPIGaugeAdvanced, MetricCard (5 archivos)

**NUNCA** usar `<input>`, `<select>`, `<button>`, `<textarea>` crudos.

### 3.2. Forms — react-hook-form + Zod
```typescript
// Inputs de texto: register directo
<Input label="Nombre *" {...register('nombre', { required: 'Requerido' })} error={errors.nombre?.message} />

// Select: register directo
<Select label="Estado *" {...register('estado')} options={estadoOptions} />

// Switch/Checkbox: SIEMPRE Controller (no register)
<Controller name="activo" control={control}
  render={({ field }) => <Switch label="Activo" checked={field.value} onCheckedChange={field.onChange} />}
/>

// FK con valor 0: limpiar antes del submit
const cleanData = { ...data };
if (!cleanData.responsable) delete cleanData.responsable;
```

### 3.3. Modales — BaseModal patterns
```typescript
<BaseModal isOpen={isOpen} onClose={onClose} title="Crear Entidad" size="lg"
  footer={
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button onClick={handleSubmit(onSubmit)} disabled={mutation.isPending}>
        {mutation.isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </div>
  }
>
  <form className="space-y-4">
    {/* Campos del form, SIN botones aquí */}
  </form>
</BaseModal>
```
- **Sizes:** xs, sm, md, lg, xl, 2xl, 3xl, 4xl, full (NO existen 5xl/6xl)
- **Footer sticky:** Botones en `footer` prop, NO inline en body
- **Grid responsive:** `grid-cols-1 sm:grid-cols-2` (SIEMPRE mobile-first)

### 3.4. State Management
- **Server state:** TanStack React Query v5 (cache, refetch, mutations)
- **Client state:** Zustand stores (authStore, themeStore) — mínimo
- **Form state:** react-hook-form (NO useState para forms)
- **NUNCA** duplicar server data en Zustand — usar React Query

### 3.5. Hook Dependencies (exhaustive-deps)
```typescript
// ❌ MAL — crea array nuevo cada render, causa loops en useEffect/useMemo
const items = data?.results || [];
const combined = [...arrayA, ...arrayB];

// ✅ BIEN — referencia estable con useMemo
const items = useMemo(() => data?.results || [], [data]);
const combined = useMemo(() => [...arrayA, ...arrayB], [arrayA, arrayB]);

// ❌ MAL — callback inestable en deps de useEffect
const updatePosition = () => { ... };
useEffect(() => { updatePosition(); }, [isVisible]); // falta updatePosition

// ✅ BIEN — useCallback estabiliza la referencia
const updatePosition = useCallback(() => { ... }, [position]);
useEffect(() => { updatePosition(); }, [isVisible, updatePosition]);

// ❌ MAL — prop callback en deps de debounce useEffect (causa loop infinito)
useEffect(() => { onFiltersChange({ ...filters, search }); }, [search, filters, onFiltersChange]);

// ✅ BIEN — useRef para props inestables en debounce
const filtersRef = useRef(filters);
filtersRef.current = filters;
useEffect(() => { filtersRef.current.onChange(search); }, [search]);
```

### 3.6. Hooks patterns
```typescript
// Hooks Factory — para CRUD simple
const entityHooks = createCrudHooks<Entity>(entityApi, entityKeys, 'Entidad', { isFeminine: true });
export const useEntities = entityHooks.useList;
export const useCreateEntity = entityHooks.useCreate;
// ... etc

// Custom hook — para lógica compleja (@actions, multi-mutation)
export const useCustomAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Payload }) => {
      const { data: response } = await apiClient.post(`${BASE_URL}/${id}/action/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: keys.detail(id) });
      toast.success('Acción completada');
    },
    onError: () => toast.error('Error en la acción'),
  });
};
```

### 3.6. Cross-module dropdowns
```typescript
// SIEMPRE usar hooks de @/hooks/useSelectLists
import { useSelectCargos, useSelectAreas, useSelectColaboradores } from '@/hooks/useSelectLists';

// NUNCA importar hooks de otro feature C2
// ❌ import { useCargos } from '@/features/talent-hub/hooks/useCargos';
```

---

## 4. API Client Patterns

### 4.1. Axios config
```typescript
import apiClient from '@/api/axios-config'; // SIEMPRE default import

// BASE_URL sin /api/ (ya está en baseURL)
const BASE_URL = '/riesgos/riesgos-viales'; // ✅
const BASE_URL = '/api/riesgos/riesgos-viales'; // ❌ doble /api/
```

### 4.2. Respuestas paginadas DRF
```typescript
// DRF puede retornar array directo O { results: [...] }
const { data } = await apiClient.get<T[]>(url, { params });
return Array.isArray(data) ? data : (((data as Record<string, unknown>)?.results as T[]) ?? []);
```

### 4.3. API Factory vs Manual
| Cuándo | Usar |
|--------|------|
| CRUD simple (list, detail, create, update, delete) | `createApiClient` factory |
| Módulo con @actions custom | Manual + factory para CRUD base |
| Sub-APIs por dominio (ej: riesgos con 5 sub-módulos) | Manual con objetos por sub-API |

---

## 5. Barrel Exports (`index.ts`)

### 5.1. Reglas críticas
- **`export *` es peligroso** — Si 2 archivos exportan el mismo nombre, Rollup omite ambos silenciosamente
- **`tsc --noEmit` NO detecta** conflictos de `export *` — solo `vite build`
- **Al reescribir types/hooks:** SIEMPRE actualizar `index.ts` y verificar TODOS los componentes que importan

### 5.2. Diagnóstico de duplicados
```bash
# Encontrar nombres duplicados en types barrel
grep -rh "^export const\|^export type\|^export interface" features/module/types/*.ts | \
  sed 's/export [^ ]* //' | sed 's/ .*//' | sort | uniq -c | sort -rn | head -20
# Cualquier count >1 = potencial conflicto en barrel
```

### 5.3. Prevención
```typescript
// ❌ Peligroso con múltiples archivos que exportan nombres similares
export * from './offBoarding.types';
export * from './nomina.types';

// ✅ Seguro si hay conflictos potenciales: re-export explícito
export type { MetodoPagoLiquidacion } from './offBoarding.types';
export type { MetodoPago } from './nomina.types';
```

---

## 6. Django/DRF Backend Patterns

### 6.1. Modelos
```python
# SIEMPRE heredar de TenantModel para modelos en TENANT_APPS
class MiModelo(TenantModel):
    class Meta:
        db_table = 'modulo_mi_modelo'
        verbose_name = 'Mi Modelo'

# empresa = read_only, auto-assign en ViewSet
# NUNCA exponer empresa como campo requerido al FE
```

### 6.2. Serializers
```python
class MiModeloCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MiModelo
        fields = ['campo1', 'campo2', 'fk_campo']
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at', 'created_by']

# FKs cross-module: SIEMPRE IntegerField
proveedor = serializers.IntegerField(source='proveedor_id', read_only=True, allow_null=True)
# NUNCA PrimaryKeyRelatedField para cross-module
```

### 6.3. ViewSets
```python
class MiModeloViewSet(TenantModelViewSetMixin, viewsets.ModelViewSet):
    queryset = MiModelo.objects.all()

    # @action multi-palabra: SIEMPRE url_path='kebab-case' (ver audit-api-sync.md)
    @action(detail=True, methods=['post'], url_path='cambiar-estado')
    def cambiar_estado(self, request, pk=None):
        ...
```

### 6.4. Base Models disponibles
| Clase | Campos | Uso |
|-------|--------|-----|
| `TenantModel` | TimeStamped + SoftDelete + Audit | **Todos los modelos tenant** |
| `SharedModel` | Solo TimeStamped | Modelos schema public |
| `ActivableModel` | `is_active` | Mixin para activar/desactivar |
| `SoftDeleteModel` | `is_deleted`, `deleted_at` | Solo soft-delete (TenantModel ya lo incluye) |

**NUNCA** mezclar `is_active` (ActivableModel) con `is_deleted` (SoftDeleteModel) en queries.

---

## 7. Optimización & Performance

### 7.1. Code Splitting
- **TODOS** los componentes de ruta: `React.lazy()` + `Suspense`
- **NUNCA** poner paquetes con React hooks en `manualChunks` separados de React

### 7.2. React Query cache
```typescript
// Query keys consistentes con factory
const keys = createQueryKeys('miModulo');
// keys.all = ['miModulo']
// keys.lists() = ['miModulo', 'list']
// keys.detail(id) = ['miModulo', 'detail', id]

// Invalidación correcta post-mutación
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: keys.lists() }); // invalida lista
  queryClient.invalidateQueries({ queryKey: keys.detail(id) }); // invalida detalle
  // Si hay custom keys (ej: keys.resumen), invalidar también
}
```

### 7.3. CRUD Hooks Factory
```typescript
// Elimina ~50 líneas por entidad
const entityHooks = createCrudHooks<Entity>(api, keys, 'Entidad');
// Genera: useList, useDetail, useCreate, useUpdate, useDelete con toast+invalidation

// Override para lógica custom (ej: invalidar keys extras)
export const useCreateEntity = () => {
  const base = entityHooks.useCreate;  // o implementar custom
  // agregar invalidaciones extras
};
```

### 7.4. Factories disponibles
| Factory | Archivo | Genera |
|---------|---------|--------|
| `createApiClient` | `lib/api-factory.ts` | API CRUD client tipado |
| `createCrudHooks` | `lib/crud-hooks-factory.ts` | Hooks React Query con toast |
| `createQueryKeys` | `lib/query-keys.ts` | Keys factory consistente |

---

## 8. Verificación Pre-Deploy

### Checklist
1. [ ] `tsc --noEmit` — sin errores TypeScript
2. [ ] `vite build` — sin errores Rollup (atrapa `export *` conflicts)
3. [ ] Barrel exports actualizados si se reescribieron types/hooks
4. [ ] Componentes verificados si se cambiaron imports
5. [ ] `@action` multi-palabra con `url_path='kebab-case'`
6. [ ] Tipos TS coinciden con serializer (nombre, tipo, nullable)
7. [ ] FKs cross-module: `IntegerField`, no auto-gen
8. [ ] Grids en modales: mobile-first (`grid-cols-1 sm:grid-cols-2`)
9. [ ] Textos user-facing: español colombiano con tildes correctas
10. [ ] No secrets en código (.env para configuración sensible)
