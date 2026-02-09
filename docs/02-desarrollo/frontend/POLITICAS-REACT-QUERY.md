# Políticas de React Query

> **Última Actualización:** 10 Enero 2026
> **Autor:** DOCUMENTATION_EXPERT
> **Versión:** 1.0.0
> **Estado:** Draft

---

## Resumen

Este documento define las políticas y mejores prácticas para el uso de TanStack Query (React Query v5) en StrateKaz. Establece convenciones de staleTime, cacheTime, invalidación de queries, y patrones de uso consistentes en todo el proyecto.

---

## Tabla de Contenidos

1. [StaleTime por Tipo de Dato](#1-staletime-por-tipo-de-dato)
2. [Cache Time y Garbage Collection](#2-cache-time-y-garbage-collection)
3. [Query Keys](#3-query-keys)
4. [Invalidación de Queries](#4-invalidación-de-queries)
5. [Manejo de Errores](#5-manejo-de-errores)
6. [Optimistic Updates](#6-optimistic-updates)
7. [Prefetching](#7-prefetching)
8. [Paginación e Infinite Queries](#8-paginación-e-infinite-queries)
9. [Ejemplos Completos](#9-ejemplos-completos)

---

## 1. StaleTime por Tipo de Dato

### Definiciones

- **staleTime:** Tiempo en que los datos se consideran "frescos" y no se refetchean
- **cacheTime (gcTime en v5):** Tiempo que los datos inactivos permanecen en caché antes de ser eliminados

### Tabla de StaleTime Recomendados

| Tipo de Dato | staleTime | Justificación | Ejemplo |
|--------------|-----------|---------------|---------|
| **Datos Maestros** | 10 minutos | Cambian muy poco, configuración del sistema | Iconos, configuración de empresa, catálogos |
| **Datos de Negocio** | 5 minutos | Balance entre performance y freshness | Áreas, proyectos, proveedores |
| **Datos en Tiempo Real** | 30 segundos | Necesitan estar actualizados frecuentemente | Notificaciones, chat, estados en vivo |
| **Estadísticas/Analytics** | 5-10 minutos | No requieren precisión al segundo | Dashboards, KPIs, reportes |
| **Búsquedas/Filtros** | 2 minutos | Evitar resultados obsoletos en búsquedas activas | Resultados de búsqueda, autocompletados |
| **Datos Estáticos** | Infinity | Nunca cambian durante la sesión | Enums, opciones de configuración |

### Implementación

```typescript
// Datos maestros (iconos, configuración)
const { data: icons } = useQuery({
  queryKey: ['icons'],
  queryFn: fetchIcons,
  staleTime: 10 * 60 * 1000, // 10 minutos
});

// Datos de negocio (áreas, proyectos)
const { data: areas } = useQuery({
  queryKey: ['areas'],
  queryFn: fetchAreas,
  staleTime: 5 * 60 * 1000, // 5 minutos
});

// Datos en tiempo real (notificaciones)
const { data: notifications } = useQuery({
  queryKey: ['notifications', 'unread'],
  queryFn: fetchUnreadNotifications,
  staleTime: 30 * 1000, // 30 segundos
  refetchInterval: 60 * 1000, // Refetch cada minuto
});

// Búsquedas
const { data: searchResults } = useQuery({
  queryKey: ['search', searchTerm],
  queryFn: () => searchAreas(searchTerm),
  staleTime: 2 * 60 * 1000, // 2 minutos
  enabled: searchTerm.length >= 3, // Solo buscar con 3+ caracteres
});

// Datos estáticos
const { data: choices } = useQuery({
  queryKey: ['choices', 'estados-proyecto'],
  queryFn: fetchEstadosProyecto,
  staleTime: Infinity, // Nunca se consideran stale
});
```

---

## 2. Cache Time y Garbage Collection

### Política Default

```typescript
// configuración global en queryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos por defecto
      gcTime: 10 * 60 * 1000,   // 10 minutos (antes cacheTime)
      retry: 1,                  // 1 reintento en caso de error
      refetchOnWindowFocus: false, // No refetch al volver a la ventana
    },
  },
});
```

### Excepciones

```typescript
// Datos que deben persistir más tiempo en cache
const { data: userProfile } = useQuery({
  queryKey: ['user', 'profile'],
  queryFn: fetchUserProfile,
  staleTime: 30 * 60 * 1000,  // 30 minutos
  gcTime: 60 * 60 * 1000,     // 1 hora en cache
});

// Datos que deben eliminarse rápido
const { data: tempData } = useQuery({
  queryKey: ['temp', sessionId],
  queryFn: fetchTempData,
  staleTime: 1 * 60 * 1000,   // 1 minuto
  gcTime: 2 * 60 * 1000,      // 2 minutos en cache
});
```

---

## 3. Query Keys

### Convención de Estructura

```typescript
// Patrón jerárquico:
// [entidad, scope, ...params]

// Ejemplos:
['areas']                           // Lista de todas las áreas
['areas', 'list']                   // Lista explícita
['areas', 'list', { page: 1 }]      // Lista con paginación
['areas', 'detail', id]             // Detalle de un área
['areas', 'stats']                  // Estadísticas de áreas
['areas', 'export', { filters }]    // Export con filtros
```

### Factory Pattern (Recomendado)

```typescript
// hooks/useAreas.ts
export const areasKeys = {
  all: ['areas'] as const,
  lists: () => [...areasKeys.all, 'list'] as const,
  list: (params?: AreasListParams) => [...areasKeys.lists(), params] as const,
  details: () => [...areasKeys.all, 'detail'] as const,
  detail: (id: number) => [...areasKeys.details(), id] as const,
  stats: () => [...areasKeys.all, 'stats'] as const,
};

// Uso:
const { data } = useQuery({
  queryKey: areasKeys.list({ page: 1 }),
  queryFn: () => fetchAreas({ page: 1 }),
});

const { data: area } = useQuery({
  queryKey: areasKeys.detail(areaId),
  queryFn: () => fetchArea(areaId),
  enabled: !!areaId,
});
```

### Invalidación por Jerarquía

```typescript
// Invalidar todas las queries de áreas
queryClient.invalidateQueries({ queryKey: areasKeys.all });

// Invalidar solo listas de áreas
queryClient.invalidateQueries({ queryKey: areasKeys.lists() });

// Invalidar un área específica
queryClient.invalidateQueries({ queryKey: areasKeys.detail(id) });
```

---

## 4. Invalidación de Queries

### Reglas de Invalidación

| Operación | Queries a Invalidar | Razón |
|-----------|---------------------|-------|
| **CREATE** | Listas | Nueva entidad debe aparecer en listas |
| **UPDATE** | Lista + Detalle | Ambas vistas deben reflejar cambios |
| **DELETE** | Listas | Entidad eliminada debe desaparecer |
| **TOGGLE ACTIVE** | Listas | Estado activo/inactivo afecta filtros |

### Implementación en Mutations

```typescript
// CREATE
const createMutation = useMutation({
  mutationFn: (data: AreaCreate) => areasApi.create(data),
  onSuccess: (newArea) => {
    // Invalidar listas
    queryClient.invalidateQueries({ queryKey: areasKeys.lists() });

    // Toast de éxito
    toast.success('Área creada exitosamente');
  },
  onError: (error: AxiosError) => {
    toast.error(error.response?.data?.detail || 'Error al crear área');
  },
});

// UPDATE
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: number; data: Partial<Area> }) =>
    areasApi.update(id, data),
  onSuccess: (updatedArea) => {
    // Invalidar listas
    queryClient.invalidateQueries({ queryKey: areasKeys.lists() });

    // Invalidar detalle específico
    queryClient.invalidateQueries({
      queryKey: areasKeys.detail(updatedArea.id),
    });

    toast.success('Área actualizada exitosamente');
  },
});

// DELETE
const deleteMutation = useMutation({
  mutationFn: (id: number) => areasApi.delete(id),
  onSuccess: () => {
    // Invalidar listas
    queryClient.invalidateQueries({ queryKey: areasKeys.lists() });

    // Opcional: invalidar stats si las afecta
    queryClient.invalidateQueries({ queryKey: areasKeys.stats() });

    toast.success('Área eliminada exitosamente');
  },
});
```

### Invalidación de Relaciones

```typescript
// Al actualizar un proyecto, invalidar también:
const updateProyectoMutation = useMutation({
  mutationFn: updateProyecto,
  onSuccess: (proyecto) => {
    // Queries del proyecto
    queryClient.invalidateQueries({ queryKey: proyectosKeys.lists() });
    queryClient.invalidateQueries({ queryKey: proyectosKeys.detail(proyecto.id) });

    // Queries relacionadas
    queryClient.invalidateQueries({ queryKey: ['portafolios', proyecto.portafolio_id] });
    queryClient.invalidateQueries({ queryKey: ['stats', 'proyectos'] });
  },
});
```

---

## 5. Manejo de Errores

### Configuración Global

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // No reintentar en errores 4xx (client errors)
        if (error.response?.status && error.response.status < 500) {
          return false;
        }
        // Máximo 2 reintentos para errores 5xx
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 0, // No reintentar mutations por defecto
    },
  },
});
```

### Manejo en Queries

```typescript
const { data, error, isError } = useQuery({
  queryKey: areasKeys.list(),
  queryFn: fetchAreas,
  onError: (error: AxiosError) => {
    // Log del error
    console.error('Error fetching areas:', error);

    // Toast solo para errores no esperados
    if (error.response?.status === 500) {
      toast.error('Error del servidor. Por favor, intente más tarde.');
    }
  },
});

// Renderizado con error
if (isError) {
  return (
    <div className="error-state">
      <p>No se pudieron cargar las áreas.</p>
      <button onClick={() => refetch()}>Reintentar</button>
    </div>
  );
}
```

### Manejo en Mutations

```typescript
const createMutation = useMutation({
  mutationFn: createArea,
  onError: (error: AxiosError<{ detail?: string; [key: string]: any }>) => {
    // Errores de validación (400)
    if (error.response?.status === 400) {
      const errors = error.response.data;

      // Si hay errores de campo específicos
      if (typeof errors === 'object' && !errors.detail) {
        // Manejar errores de campo (ej: form validation)
        Object.entries(errors).forEach(([field, messages]) => {
          toast.error(`${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`);
        });
      } else {
        // Error general
        toast.error(errors.detail || 'Error de validación');
      }
      return;
    }

    // Errores de autorización (403)
    if (error.response?.status === 403) {
      toast.error('No tiene permisos para realizar esta acción');
      return;
    }

    // Error genérico
    toast.error(error.response?.data?.detail || 'Error al crear área');
  },
});
```

---

## 6. Optimistic Updates

### Cuándo Usar

- ✅ Operaciones frecuentes (toggle, like, bookmark)
- ✅ Feedback inmediato importante para UX
- ✅ Operaciones con alta probabilidad de éxito

- ❌ Operaciones críticas de negocio
- ❌ Operaciones con validaciones complejas
- ❌ Operaciones que pueden fallar frecuentemente

### Implementación

```typescript
const toggleActiveMutation = useMutation({
  mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
    areasApi.toggleActive(id, isActive),

  // Antes de la mutación
  onMutate: async ({ id, isActive }) => {
    // 1. Cancelar queries en vuelo para evitar sobrescribir optimistic update
    await queryClient.cancelQueries({ queryKey: areasKeys.lists() });
    await queryClient.cancelQueries({ queryKey: areasKeys.detail(id) });

    // 2. Snapshot del estado anterior
    const previousAreas = queryClient.getQueryData(areasKeys.lists());
    const previousArea = queryClient.getQueryData(areasKeys.detail(id));

    // 3. Actualización optimista
    queryClient.setQueryData(areasKeys.lists(), (old: Area[] | undefined) => {
      if (!old) return old;
      return old.map(area =>
        area.id === id ? { ...area, is_active: isActive } : area
      );
    });

    queryClient.setQueryData(areasKeys.detail(id), (old: Area | undefined) => {
      if (!old) return old;
      return { ...old, is_active: isActive };
    });

    // 4. Retornar contexto para rollback
    return { previousAreas, previousArea };
  },

  // Si la mutación falla
  onError: (error, variables, context) => {
    // Rollback a estado anterior
    if (context?.previousAreas) {
      queryClient.setQueryData(areasKeys.lists(), context.previousAreas);
    }
    if (context?.previousArea) {
      queryClient.setQueryData(
        areasKeys.detail(variables.id),
        context.previousArea
      );
    }

    toast.error('Error al cambiar estado del área');
  },

  // Siempre refetch para asegurar sincronización
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: areasKeys.lists() });
  },
});
```

---

## 7. Prefetching

### Cuándo Prefetch

- ✅ Rutas que el usuario probablemente visitará (navegación predictiva)
- ✅ Datos necesarios para modales/drawers antes de abrirlos
- ✅ Tabs que se van a mostrar

### Implementación

```typescript
// Prefetch en hover de botón/link
const prefetchAreaDetail = (areaId: number) => {
  queryClient.prefetchQuery({
    queryKey: areasKeys.detail(areaId),
    queryFn: () => fetchArea(areaId),
    staleTime: 5 * 60 * 1000,
  });
};

// Uso en componente
<Link
  to={`/areas/${area.id}`}
  onMouseEnter={() => prefetchAreaDetail(area.id)}
>
  Ver detalles
</Link>

// Prefetch al cambiar tabs
const [activeTab, setActiveTab] = useState('areas');

useEffect(() => {
  if (activeTab === 'proyectos') {
    queryClient.prefetchQuery({
      queryKey: proyectosKeys.list(),
      queryFn: fetchProyectos,
    });
  }
}, [activeTab]);
```

---

## 8. Paginación e Infinite Queries

### Paginación Normal

```typescript
const [page, setPage] = useState(1);
const pageSize = 10;

const { data, isLoading } = useQuery({
  queryKey: areasKeys.list({ page, page_size: pageSize }),
  queryFn: () => fetchAreas({ page, page_size: pageSize }),
  staleTime: 5 * 60 * 1000,
  keepPreviousData: true, // Mantener datos anteriores durante carga
});

const totalPages = Math.ceil((data?.count || 0) / pageSize);

// Prefetch página siguiente
useEffect(() => {
  if (page < totalPages) {
    queryClient.prefetchQuery({
      queryKey: areasKeys.list({ page: page + 1, page_size: pageSize }),
      queryFn: () => fetchAreas({ page: page + 1, page_size: pageSize }),
    });
  }
}, [page, totalPages]);
```

### Infinite Query (Scroll Infinito)

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: areasKeys.lists(),
  queryFn: ({ pageParam = 1 }) => fetchAreas({ page: pageParam }),
  getNextPageParam: (lastPage, allPages) => {
    return lastPage.next ? allPages.length + 1 : undefined;
  },
  staleTime: 5 * 60 * 1000,
});

// Componente con IntersectionObserver
const loadMoreRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!loadMoreRef.current || !hasNextPage) return;

  const observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    { threshold: 0.5 }
  );

  observer.observe(loadMoreRef.current);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage]);
```

---

## 9. Ejemplos Completos

### Ejemplo 1: Hook CRUD Completo

```typescript
// features/organizacion/hooks/useAreas.ts
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

// Hook principal
export function useAreas(params?: { search?: string; include_inactive?: boolean }) {
  const queryClient = useQueryClient();

  // Query: Lista
  const listQuery = useQuery({
    queryKey: areasKeys.list(params),
    queryFn: () => areasApi.list(params),
    staleTime: 5 * 60 * 1000,
  });

  // Query: Detalle (función helper)
  const useAreaDetail = (id: number | null) => {
    return useQuery({
      queryKey: areasKeys.detail(id!),
      queryFn: () => areasApi.get(id!),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

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
    // Queries
    areas: listQuery.data?.results || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,

    // Mutations
    createArea: createMutation.mutateAsync,
    updateArea: updateMutation.mutateAsync,
    deleteArea: deleteMutation.mutateAsync,

    // Estados de mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Helpers
    useAreaDetail,
    refetch: listQuery.refetch,
  };
}
```

---

## Referencias

- [TanStack Query v5 Documentation](https://tanstack.com/query/latest)
- [React Query Best Practices - TkDodo](https://tkdodo.eu/blog/practical-react-query)
- [CODIGO-REUTILIZABLE.md](./CODIGO-REUTILIZABLE.md)
- [GUIA-CREACION-HOOKS.md](./GUIA-CREACION-HOOKS.md)

---

**Última Revisión:** 10 Enero 2026
**Próxima Revisión:** 10 Abril 2026
