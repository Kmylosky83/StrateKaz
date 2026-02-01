# Guía: ¿Cuándo y Cómo Crear Hooks?

> **Última Actualización:** 10 Enero 2026
> **Autor:** DOCUMENTATION_EXPERT
> **Versión:** 1.0.0
> **Estado:** Draft

---

## Resumen

Esta guía define cuándo crear hooks personalizados en StrateKaz, convenciones de nomenclatura, patrones de implementación y ubicación en el proyecto. Ayuda a mantener consistencia y evitar duplicación de lógica.

---

## Tabla de Contenidos

1. [Checklist de Decisión](#1-checklist-de-decisión)
2. [Tipos de Hooks](#2-tipos-de-hooks)
3. [Convenciones de Nomenclatura](#3-convenciones-de-nomenclatura)
4. [Ubicación de Hooks](#4-ubicación-de-hooks)
5. [Patrones de Implementación](#5-patrones-de-implementación)
6. [Hooks Existentes en el Proyecto](#6-hooks-existentes-en-el-proyecto)
7. [Ejemplos Paso a Paso](#7-ejemplos-paso-a-paso)
8. [Anti-Patrones](#8-anti-patrones)

---

## 1. Checklist de Decisión

### ¿Debo Crear un Hook?

Use este checklist antes de crear un nuevo hook:

#### ✅ Crear Hook SI:

- [ ] Lógica de estado se repite en 3+ componentes
- [ ] Interacción con API específica (entidad de negocio)
- [ ] Side effects complejos (WebSocket, polling, timers)
- [ ] Transformación de datos reutilizable
- [ ] Integración con librerías externas (localStorage, IndexedDB)
- [ ] Lógica de subscripción/cleanup compleja
- [ ] Combinación de múltiples hooks nativos con lógica

#### ❌ NO Crear Hook SI:

- [ ] Lógica trivial (< 5 líneas de código)
- [ ] Usado en un solo lugar (componente único)
- [ ] Ya existe hook genérico (ej: `useGenericCRUD`)
- [ ] Es solo una función de utilidad (crear en `utils/`)
- [ ] No tiene estado ni side effects (crear función pura)

### Flujo de Decisión

```
┌─────────────────────────────┐
│ ¿Necesito lógica reutilizable? │
└────────────┬────────────────┘
             │
             v
     ┌───────┴────────┐
     │  ¿Tiene estado  │
     │  o side effects?│
     └───────┬────────┘
             │
        ┌────┴────┐
        │   SÍ    │   NO
        v         v
    CREAR      CREAR
     HOOK      FUNCIÓN
              (utils/)
```

---

## 2. Tipos de Hooks

### 2.1 Hooks de Estado Global

**Propósito:** Compartir estado entre componentes sin prop drilling

**Cuándo:**
- Estado de autenticación
- Preferencias de usuario
- Tema/branding dinámico
- Estado de UI global (sidebar abierto/cerrado)

**Ejemplo:**
```typescript
// src/hooks/useAuth.ts
export function useAuth() {
  const user = useAuthStore(state => state.user);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);

  return { user, isAuthenticated: !!user, login, logout };
}
```

### 2.2 Hooks de Datos (API)

**Propósito:** Interactuar con el backend (CRUD, queries)

**Cuándo:**
- Cada entidad de negocio (Áreas, Proyectos, etc.)
- Operaciones específicas de API

**Ejemplo:**
```typescript
// src/features/organizacion/hooks/useAreas.ts
export function useAreas(params?: AreasParams) {
  // useQuery + mutations para CRUD completo
}
```

### 2.3 Hooks de UI/UX

**Propósito:** Manejar estado y comportamiento de UI

**Cuándo:**
- Modales/Drawers
- Tooltips/Popovers
- Drag and drop
- Infinite scroll
- Validación de formularios

**Ejemplo:**
```typescript
// src/hooks/useFormModal.ts
export function useFormModal<T>() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [data, setData] = useState<T | null>(null);

  // ...
}
```

### 2.4 Hooks de Side Effects

**Propósito:** Encapsular efectos complejos

**Cuándo:**
- Polling/Auto-refresh
- WebSocket connections
- Event listeners (resize, scroll, keyboard)
- Timers/Intervals
- LocalStorage sync

**Ejemplo:**
```typescript
// src/hooks/useInterval.ts
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

### 2.5 Hooks de Transformación de Datos

**Propósito:** Procesar/formatear datos de forma reutilizable

**Cuándo:**
- Filtrado/búsqueda compleja
- Agrupación de datos
- Cálculos derivados
- Formateo con lógica de negocio

**Ejemplo:**
```typescript
// src/hooks/useFilteredAreas.ts
export function useFilteredAreas(areas: Area[], filters: Filters) {
  return useMemo(() => {
    let result = areas;

    if (filters.search) {
      result = result.filter(a =>
        a.nombre.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.onlyActive) {
      result = result.filter(a => a.is_active);
    }

    return result;
  }, [areas, filters]);
}
```

---

## 3. Convenciones de Nomenclatura

### Regla General

**Formato:** `use[Funcionalidad]` en camelCase

### Por Tipo de Hook

| Tipo | Patrón | Ejemplos |
|------|--------|----------|
| **Global/Contexto** | `use[Contexto]` | `useAuth`, `useTheme`, `usePermissions` |
| **Entidad de negocio** | `use[Entidad]` (plural) | `useAreas`, `useProyectos`, `useUsuarios` |
| **Acción específica** | `use[Verbo][Objeto]` | `useExportExcel`, `useUploadFile` |
| **Estado de UI** | `use[Elemento]Modal/Drawer` | `useFormModal`, `useConfirmDrawer` |
| **Side effect** | `use[Efecto]` | `useInterval`, `useDebounce`, `useLocalStorage` |

### Ejemplos Correctos vs Incorrectos

```typescript
// ✅ CORRECTO
useAreas()          // Entidad plural
useAuth()           // Contexto claro
useFormModal()      // UI específico
useDebounce()       // Side effect claro

// ❌ INCORRECTO
useArea()           // Singular (confuso)
useAuthentication() // Demasiado largo
useModal()          // Muy genérico
useDeb()            // Abreviación
use_areas()         // snake_case
UseAreas()          // PascalCase
```

---

## 4. Ubicación de Hooks

### Estructura de Carpetas

```
src/
├── hooks/                    # Hooks globales/reutilizables
│   ├── index.ts             # Barrel export
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   ├── useFormModal.ts
│   ├── useConfirmModal.ts
│   ├── useGenericCRUD.ts
│   └── useDebounce.ts
│
└── features/
    └── [modulo]/
        ├── hooks/            # Hooks específicos del módulo
        │   ├── index.ts
        │   ├── useAreas.ts
        │   └── useAreasStats.ts
        └── ...
```

### Regla de Ubicación

| Scope | Ubicación | Ejemplo |
|-------|-----------|---------|
| **Global** - Usado en 3+ módulos | `src/hooks/` | `useAuth`, `useFormModal` |
| **Feature** - Específico de módulo | `src/features/[modulo]/hooks/` | `useAreas`, `useProyectos` |
| **Component** - Solo un componente | Inline en componente (no crear hook) | - |

### Barrel Exports

Siempre crear `index.ts` para exports centralizados:

```typescript
// src/hooks/index.ts
export { useAuth } from './useAuth';
export { usePermissions } from './usePermissions';
export { useFormModal } from './useFormModal';
export { useGenericCRUD } from './useGenericCRUD';

// src/features/organizacion/hooks/index.ts
export { useAreas } from './useAreas';
export { useAreasStats } from './useAreasStats';
```

---

## 5. Patrones de Implementación

### 5.1 Estructura de un Hook

```typescript
/**
 * [Descripción breve del hook]
 *
 * @param params - Descripción de parámetros
 * @returns Descripción del retorno
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAreas({ search: 'test' });
 * ```
 */
export function useCustomHook(params: Params): ReturnType {
  // 1. Estado interno
  const [state, setState] = useState(initialState);

  // 2. Refs (si necesario)
  const ref = useRef(null);

  // 3. Context/Stores (si necesario)
  const contextValue = useContext(MyContext);

  // 4. Otros hooks
  const query = useQuery({ ... });

  // 5. Callbacks
  const handleAction = useCallback(() => {
    // lógica
  }, [dependencies]);

  // 6. Effects
  useEffect(() => {
    // side effects
    return () => {
      // cleanup
    };
  }, [dependencies]);

  // 7. Return (objeto o array)
  return {
    data: query.data,
    isLoading: query.isLoading,
    handleAction,
  };
}
```

### 5.2 Return Types

#### Objeto (Recomendado para hooks complejos)

```typescript
export function useAreas() {
  return {
    areas: data,
    isLoading,
    error,
    createArea,
    updateArea,
    deleteArea,
  };
}

// Uso destructurado
const { areas, createArea } = useAreas();
```

#### Array (Solo para hooks simples con 2-3 valores)

```typescript
export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);

  return [value, toggle] as const;
}

// Uso con nombres personalizados
const [isOpen, toggleOpen] = useToggle();
```

### 5.3 TypeScript

```typescript
// Tipos de parámetros
interface UseAreasParams {
  search?: string;
  filters?: Filters;
  enabled?: boolean;
}

// Tipo de retorno explícito
interface UseAreasReturn {
  areas: Area[];
  isLoading: boolean;
  error: Error | null;
  createArea: (data: AreaCreate) => Promise<Area>;
  updateArea: (id: number, data: Partial<Area>) => Promise<Area>;
}

export function useAreas(params?: UseAreasParams): UseAreasReturn {
  // implementación
}
```

### 5.4 Manejo de Dependencias

```typescript
// ✅ CORRECTO: Dependencies claras
useEffect(() => {
  fetchData(userId);
}, [userId]); // Solo re-ejecutar cuando userId cambie

// ❌ INCORRECTO: Dependencias faltantes
useEffect(() => {
  fetchData(userId);
}, []); // userId puede cambiar y no refetch

// ✅ CORRECTO: useCallback para funciones estables
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);

// ❌ INCORRECTO: Nueva función en cada render
const handleClick = () => {
  doSomething(value);
};
```

---

## 6. Hooks Existentes en el Proyecto

### Hooks Globales (`src/hooks/`)

| Hook | Propósito | Cuándo Usar |
|------|-----------|-------------|
| `useGenericCRUD` | CRUD completo con React Query | Entidades con operaciones CRUD estándar |
| `useFormModal` | Estado de modales de formulario | Crear/Editar entidades en modal |
| `useConfirmModal` | Modales de confirmación | Confirmar acciones destructivas |
| `usePermissions` | Verificar permisos RBAC | Mostrar/ocultar UI según permisos |
| `useBrandingConfig` | Configuración de branding | Colores/logos dinámicos |
| `useIcons` | Iconos dinámicos desde BD | Selección de iconos Lucide |
| `useSignature` | Firma manuscrita digital | Workflow de firmas |

### Hooks de Features

| Módulo | Hook | Propósito |
|--------|------|-----------|
| `gestion-estrategica` | `useValoresVividos` | Valores corporativos vinculados |
| `gestion-estrategica` | `useWorkflowFirmas` | Workflow de aprobación de políticas |
| `gestion-estrategica` | `useCargoSectionAccess` | Control de acceso a secciones |
| `users` | `useUsers` | CRUD de usuarios |
| `audit-system` | `useNotificaciones` | Notificaciones del sistema |

### Antes de Crear un Hook Nuevo

1. Revisar `src/hooks/index.ts`
2. Revisar `src/features/*/hooks/index.ts` del módulo
3. Verificar si `useGenericCRUD` puede resolver el caso
4. Buscar hooks similares en otros módulos

---

## 7. Ejemplos Paso a Paso

### Ejemplo 1: Hook Simple (Side Effect)

**Requisito:** Debounce de inputs de búsqueda

```typescript
// src/hooks/useDebounce.ts

import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 *
 * @param value - Valor a hacer debounce
 * @param delay - Delay en milisegundos (default: 500ms)
 * @returns Valor con debounce aplicado
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 *
 * useEffect(() => {
 *   // API call con debouncedSearch
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Uso:**

```typescript
function SearchComponent() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data } = useQuery({
    queryKey: ['areas', debouncedSearch],
    queryFn: () => fetchAreas({ search: debouncedSearch }),
    enabled: debouncedSearch.length >= 3,
  });

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Buscar..."
    />
  );
}
```

### Ejemplo 2: Hook de UI (Modal)

**Requisito:** Manejo de estado de modal de confirmación

```typescript
// src/hooks/useConfirmModal.ts

import { useState, useCallback } from 'react';

interface UseConfirmModalOptions<T> {
  onConfirm?: (data: T) => void;
}

interface UseConfirmModalReturn<T> {
  isOpen: boolean;
  data: T | null;
  open: (data: T, onConfirm: () => void) => void;
  close: () => void;
  confirm: () => void;
}

/**
 * Hook para manejar modales de confirmación
 *
 * @example
 * ```tsx
 * const confirm = useConfirmModal<Area>();
 *
 * const handleDelete = (area: Area) => {
 *   confirm.open(area, async () => {
 *     await deleteArea(area.id);
 *   });
 * };
 *
 * return (
 *   <ConfirmModal
 *     isOpen={confirm.isOpen}
 *     title="Eliminar Área"
 *     message={`¿Eliminar "${confirm.data?.nombre}"?`}
 *     onConfirm={confirm.confirm}
 *     onCancel={confirm.close}
 *   />
 * );
 * ```
 */
export function useConfirmModal<T = unknown>(): UseConfirmModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  const open = useCallback((itemData: T, callback: () => void) => {
    setData(itemData);
    setOnConfirmCallback(() => callback);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
    setOnConfirmCallback(null);
  }, []);

  const confirm = useCallback(() => {
    if (onConfirmCallback) {
      onConfirmCallback();
    }
    close();
  }, [onConfirmCallback, close]);

  return {
    isOpen,
    data,
    open,
    close,
    confirm,
  };
}
```

### Ejemplo 3: Hook de Datos (API)

**Requisito:** CRUD de entidad con estadísticas

```typescript
// src/features/organizacion/hooks/useAreas.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { areasApi } from '../api';
import type { Area, AreaCreate } from '../types';

// Query keys factory
export const areasKeys = {
  all: ['areas'] as const,
  lists: () => [...areasKeys.all, 'list'] as const,
  list: (params?: any) => [...areasKeys.lists(), params] as const,
  details: () => [...areasKeys.all, 'detail'] as const,
  detail: (id: number) => [...areasKeys.details(), id] as const,
  stats: () => [...areasKeys.all, 'stats'] as const,
};

interface UseAreasParams {
  search?: string;
  include_inactive?: boolean;
}

interface UseAreasReturn {
  // Data
  areas: Area[];
  isLoading: boolean;
  error: Error | null;

  // Mutations
  createArea: (data: AreaCreate) => Promise<Area>;
  updateArea: (id: number, data: Partial<Area>) => Promise<Area>;
  deleteArea: (id: number) => Promise<void>;

  // Estados
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Helpers
  refetch: () => void;
}

/**
 * Hook para gestión completa de Áreas
 *
 * @param params - Parámetros de filtrado y búsqueda
 * @returns Operaciones CRUD y estado de áreas
 *
 * @example
 * ```tsx
 * const { areas, isLoading, createArea } = useAreas({ search: 'test' });
 *
 * const handleCreate = async (data: AreaCreate) => {
 *   await createArea(data);
 * };
 * ```
 */
export function useAreas(params?: UseAreasParams): UseAreasReturn {
  const queryClient = useQueryClient();

  // Query: Lista
  const listQuery = useQuery({
    queryKey: areasKeys.list(params),
    queryFn: () => areasApi.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation: Create
  const createMutation = useMutation({
    mutationFn: (data: AreaCreate) => areasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areasKeys.lists() });
      toast.success('Área creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear área');
    },
  });

  // Mutation: Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Area> }) =>
      areasApi.update(id, data),
    onSuccess: (area) => {
      queryClient.invalidateQueries({ queryKey: areasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: areasKeys.detail(area.id) });
      toast.success('Área actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar área');
    },
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: (id: number) => areasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areasKeys.lists() });
      toast.success('Área eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al eliminar área');
    },
  });

  return {
    // Data
    areas: listQuery.data?.results || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,

    // Mutations
    createArea: createMutation.mutateAsync,
    updateArea: (id, data) => updateMutation.mutateAsync({ id, data }),
    deleteArea: deleteMutation.mutateAsync,

    // Estados
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Helpers
    refetch: listQuery.refetch,
  };
}
```

---

## 8. Anti-Patrones

### ❌ Anti-Patrón 1: Hook Demasiado Genérico

```typescript
// MAL: Hook que hace todo
export function useData(endpoint: string) {
  const { data } = useQuery({
    queryKey: [endpoint],
    queryFn: () => fetch(endpoint).then(r => r.json()),
  });
  return data;
}

// BIEN: Hook específico con tipado
export function useAreas(params?: AreasParams) {
  const { data } = useQuery({
    queryKey: areasKeys.list(params),
    queryFn: () => areasApi.list(params),
  });
  return { areas: data?.results || [], ... };
}
```

### ❌ Anti-Patrón 2: Hook que Viola Reglas de Hooks

```typescript
// MAL: Hook condicional
export function useMaybeData(shouldFetch: boolean) {
  if (shouldFetch) {
    return useQuery({ ... }); // ❌ Hook condicional
  }
  return null;
}

// BIEN: enabled option
export function useData(shouldFetch: boolean) {
  return useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    enabled: shouldFetch, // ✅ Siempre llama al hook
  });
}
```

### ❌ Anti-Patrón 3: Hook sin Cleanup

```typescript
// MAL: Event listener sin cleanup
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    // ❌ Falta cleanup
  }, []);

  return size;
}

// BIEN: Con cleanup
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize(); // Llamar inmediatamente
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize); // ✅ Cleanup
    };
  }, []);

  return size;
}
```

### ❌ Anti-Patrón 4: Duplicar useGenericCRUD

```typescript
// MAL: Reimplementar CRUD genérico
export function useAreas() {
  const queryClient = useQueryClient();

  const { data } = useQuery({ ... });
  const createMutation = useMutation({ ... });
  const updateMutation = useMutation({ ... });
  // ... reimplementar todo el CRUD
}

// BIEN: Extender useGenericCRUD
export function useAreas(params?: AreasParams) {
  const crud = useGenericCRUD<Area>({
    queryKey: ['areas'],
    endpoint: '/api/areas/',
    entityName: 'Área',
    isPaginated: true,
  });

  // Agregar solo lógica adicional específica
  const { data: stats } = useQuery({
    queryKey: ['areas', 'stats'],
    queryFn: areasApi.getStats,
  });

  return {
    ...crud,
    stats,
  };
}
```

---

## Referencias

- [React Hooks Documentation](https://react.dev/reference/react)
- [CODIGO-REUTILIZABLE.md](./CODIGO-REUTILIZABLE.md)
- [POLITICAS-REACT-QUERY.md](./POLITICAS-REACT-QUERY.md)
- [TanStack Query Hooks](https://tanstack.com/query/latest/docs/react/guides/queries)

---

**Última Revisión:** 10 Enero 2026
**Próxima Revisión:** 10 Abril 2026
