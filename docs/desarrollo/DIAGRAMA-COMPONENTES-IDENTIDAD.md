# Diagrama de Componentes - Identidad Corporativa

## Arquitectura Visual del Módulo

### 1. Vista de Árbol de Componentes

```
📦 features/gestion-estrategica/
│
├── 📂 components/
│   ├── 📄 IdentidadTab.tsx (ORQUESTADOR) ⭐
│   │   ├── → MisionVisionSection (interno)
│   │   ├── → ValoresSection (interno)
│   │   ├── → PoliticaSection (interno)
│   │   └── → PoliticasSection (interno)
│   │
│   ├── 📄 ValoresDragDrop.tsx (DRAG & DROP)
│   │   ├── → SortableValueItem
│   │   ├── → DragOverlay
│   │   └── → CreateForm (interno)
│   │
│   ├── 📄 PoliticasManager.tsx (WORKFLOW) ⚡
│   │   ├── → PolicyStatusBadge
│   │   ├── → ReviewAlert
│   │   ├── → WorkflowTimeline
│   │   ├── → PolicyCard
│   │   └── → PolicyFormModal
│   │
│   ├── 📄 IdentidadShowcase.tsx (PRESENTACIÓN)
│   │   ├── → ShowcaseHeader
│   │   ├── → MisionSlide
│   │   ├── → VisionSlide
│   │   ├── → ValoresSlide
│   │   ├── → PoliticaSlide
│   │   └── → MetricasSlide
│   │
│   └── 📂 modals/
│       ├── 📄 IdentityFormModal.tsx
│       ├── 📄 ValueFormModal.tsx
│       └── 📄 [otros modales...]
│
├── 📂 hooks/
│   ├── 📄 useStrategic.ts (MONOLITO - 1,257 líneas) ⚠️
│   │   ├── → useActiveIdentity
│   │   ├── → useValues
│   │   ├── → useCreateValue
│   │   ├── → useUpdateValue
│   │   ├── → useDeleteValue
│   │   ├── → useReorderValues
│   │   ├── → usePoliticasIntegrales (12 hooks)
│   │   └── → usePoliticasEspecificas (12 hooks)
│   │
│   ├── 📄 useTenantConfig.ts (MOCK API)
│   │   ├── → useTenantConfig
│   │   ├── → useTenantFeatures
│   │   ├── → useIsFeatureEnabled
│   │   └── → useModuleVisibility
│   │
│   └── 📄 useValoresVividos.ts (BI)
│       ├── → useValoresVividos
│       ├── → useEstadisticasValores
│       ├── → useTendenciaValores
│       └── → useRankingCategorias
│
├── 📂 api/
│   └── 📄 strategicApi.ts
│       ├── → identityApi (7 métodos)
│       ├── → valuesApi (5 métodos)
│       ├── → politicasIntegralesApi (7 métodos)
│       ├── → politicasEspecificasApi (7 métodos)
│       └── → normasISOApi (4 métodos)
│
└── 📂 types/
    └── 📄 strategic.types.ts (200+ líneas)
        ├── → CorporateIdentity
        ├── → CorporateValue
        ├── → PoliticaIntegral
        ├── → PoliticaEspecifica
        └── → [50+ tipos más]
```

---

## 2. Flujo de Datos Detallado

### 2.1 Flujo de Lectura (Query)

```
┌──────────────────────────────────────────────────────────┐
│                    USER ACTION                           │
│               Navega a Identidad Tab                     │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              COMPONENT MOUNT                             │
│                IdentidadTab                              │
│                                                          │
│  useActiveIdentity() ──────────────┐                    │
│  useValues(identityId) ───────────┐│                    │
│  usePoliticasIntegrales() ────────┤│                    │
│  usePoliticasEspecificas() ───────┤││                   │
└──────────────────────────────────┬┴┴┴───────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────┐
│                  REACT QUERY                             │
│                                                          │
│  1. Check Cache (strategicKeys)                         │
│  2. If stale or missing:                                │
│     ├─► identityApi.getActive()                         │
│     ├─► valuesApi.getAll(identityId)                    │
│     ├─► politicasIntegralesApi.getAll()                 │
│     └─► politicasEspecificasApi.getAll()                │
└──────────────────────────────────┬───────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────┐
│                   API LAYER                              │
│                  (axios instance)                        │
│                                                          │
│  GET /api/identidad/identidad/active/                   │
│  GET /api/identidad/valores/?identity=X                 │
│  GET /api/identidad/politicas-integrales/?identity=X    │
│  GET /api/identidad/politicas-especificas/?identity=X   │
└──────────────────────────────────┬───────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────┐
│                 DJANGO BACKEND                           │
│                                                          │
│  IdentityViewSet.active()                               │
│  CorporateValueViewSet.list()                           │
│  PoliticaIntegralViewSet.list()                         │
│  PoliticaEspecificaViewSet.list()                       │
└──────────────────────────────────┬───────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────┐
│                 DATABASE (PostgreSQL)                    │
│                                                          │
│  SELECT * FROM identidad_corporateidentity              │
│  SELECT * FROM identidad_corporatevalue                 │
│  SELECT * FROM identidad_politicaintegral               │
│  SELECT * FROM identidad_politicaespecifica             │
└──────────────────────────────────┬───────────────────────┘
                                   │
                                   ▼
                        [Datos retornan por el mismo camino]
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────┐
│                 COMPONENT RE-RENDER                      │
│                                                          │
│  identity = { id: 1, mission: "...", ... }             │
│  values = [{ id: 1, name: "Integridad" }, ...]         │
│  politicas = [{ id: 1, status: "VIGENTE" }, ...]       │
│                                                          │
│  ▼ Renderiza Secciones                                  │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Escritura (Mutation)

```
┌──────────────────────────────────────────────────────────┐
│                  USER ACTION                             │
│          Usuario crea/edita valor corporativo            │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              COMPONENT EVENT                             │
│            ValoresDragDrop.tsx                           │
│                                                          │
│  handleCreate() {                                        │
│    await createValueMutation.mutateAsync({              │
│      identity: identityId,                              │
│      name: "Integridad",                                │
│      description: "...",                                │
│      icon: "Shield",                                    │
│      orden: 1                                           │
│    });                                                  │
│  }                                                      │
└──────────────────────────────────┬───────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────┐
│                 MUTATION HOOK                            │
│             useCreateValue()                             │
│                                                          │
│  mutationFn: (data) => valuesApi.create(data)          │
│  onSuccess: (newValue) => {                             │
│    queryClient.invalidateQueries(['values'])            │
│    toast.success('Valor creado')                        │
│  }                                                      │
└──────────────────────────────────┬───────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────┐
│                   API LAYER                              │
│                                                          │
│  POST /api/identidad/valores/                           │
│  Body: { identity: 1, name: "Integridad", ... }        │
└──────────────────────────────────┬───────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────┐
│                 DJANGO BACKEND                           │
│                                                          │
│  CorporateValueViewSet.create()                         │
│  ├─► Validación (Serializer)                           │
│  ├─► Permisos (IsAuthenticated)                        │
│  ├─► created_by = request.user                         │
│  └─► value.save()                                      │
└──────────────────────────────────┬───────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────┐
│                 DATABASE INSERT                          │
│                                                          │
│  INSERT INTO identidad_corporatevalue                   │
│  (identity_id, name, description, icon, orden, ...)     │
│  VALUES (1, 'Integridad', '...', 'Shield', 1, ...)     │
│  RETURNING id;                                          │
└──────────────────────────────────┬───────────────────────┘
                                   │
                                   ▼
                        [Respuesta retorna]
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────┐
│                MUTATION SUCCESS                          │
│                                                          │
│  1. onSuccess callback ejecuta                          │
│  2. queryClient.invalidateQueries(['values'])           │
│  3. React Query refetch automático                      │
│  4. toast.success('Valor creado')                       │
└──────────────────────────────────┬───────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────┐
│             COMPONENT RE-RENDER                          │
│                                                          │
│  values = [...oldValues, newValue]                      │
│  ▼ Lista actualizada con nuevo valor                    │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Matriz de Responsabilidades

| Componente | Renderizado | Estado Local | Server State | Side Effects | Eventos Usuario |
|------------|-------------|--------------|--------------|--------------|-----------------|
| **IdentidadTab** | ⭐⭐⭐⭐ | ⭐⭐ (modales) | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| **ValoresDragDrop** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ (form) | ⭐⭐⭐ | ⭐⭐ (drag) | ⭐⭐⭐⭐⭐ |
| **PoliticasManager** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ (tabs/filtros) | ⭐⭐⭐⭐⭐ | ⭐⭐ (review) | ⭐⭐⭐⭐ |
| **IdentidadShowcase** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ (slideshow) | ⭐⭐⭐ | ⭐⭐⭐⭐ (timers) | ⭐⭐⭐⭐ (keyboard) |
| **IdentityFormModal** | ⭐⭐⭐ | ⭐⭐⭐⭐ (form) | ⭐⭐ | - | ⭐⭐⭐ |

**Leyenda:** ⭐ (Muy Bajo) → ⭐⭐⭐⭐⭐ (Muy Alto)

---

## 4. Análisis de Acoplamiento

### 4.1 Dependencias entre Componentes

```
IdentidadTab (ALTO ACOPLAMIENTO)
    │
    ├─── depends on → useActiveIdentity (React Query)
    ├─── depends on → useValues (React Query)
    ├─── depends on → usePoliticasIntegrales (React Query)
    ├─── depends on → usePoliticasEspecificas (React Query)
    │
    ├─── renders → MisionVisionSection
    │       └─── depends on → identity (prop)
    │
    ├─── renders → ValoresSection
    │       ├─── depends on → identity (prop)
    │       └─── renders → ValoresDragDrop
    │               ├─── depends on → values (prop)
    │               ├─── depends on → DynamicIcon (Design System)
    │               └─── depends on → IconPicker (Design System)
    │
    ├─── renders → PoliticaSection (Legacy)
    │       └─── depends on → identity (prop)
    │
    └─── renders → PoliticasSection
            ├─── depends on → identity (prop)
            └─── renders → PoliticasManager
                    ├─── depends on → politicas (prop array)
                    ├─── depends on → 10+ callbacks (props)
                    └─── depends on → useNormasISOChoices (React Query)

ValoresDragDrop (MEDIO ACOPLAMIENTO)
    │
    ├─── depends on → @dnd-kit/core
    ├─── depends on → @dnd-kit/sortable
    ├─── depends on → framer-motion
    ├─── depends on → DynamicIcon
    └─── depends on → IconPicker

PoliticasManager (ALTO ACOPLAMIENTO)
    │
    ├─── depends on → date-fns
    ├─── depends on → BaseModal
    ├─── depends on → RichTextEditor
    ├─── depends on → Select (forms)
    └─── depends on → useNormasISOChoices
```

### 4.2 Acoplamiento por Capa

```
┌─────────────────────────────────────────────────────────┐
│               PRESENTATION LAYER                        │
│          (Componentes React - JSX)                      │
│                                                         │
│  Acoplamiento: BAJO ✅                                  │
│  - Componentes puros de presentación                   │
│  - Props bien tipadas                                  │
│  - Sin lógica de negocio                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│               BUSINESS LOGIC LAYER                      │
│          (Custom Hooks - useStrategic)                  │
│                                                         │
│  Acoplamiento: MEDIO-ALTO ⚠️                            │
│  - Hooks acoplados a React Query                       │
│  - Algunos hooks con lógica mezclada                   │
│  - useReorderValues con Promise.all                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   API LAYER                             │
│          (strategicApi.ts - Axios)                      │
│                                                         │
│  Acoplamiento: BAJO ✅                                  │
│  - Funciones puras                                     │
│  - Sin dependencias externas                           │
│  - Fácil de testear                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  NETWORK LAYER                          │
│              (Axios Instance)                           │
│                                                         │
│  Acoplamiento: BAJO ✅                                  │
│  - Interceptors configurados                           │
│  - Manejo de errores centralizado                      │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Puntos de Extensión

### 5.1 Cómo Agregar Nueva Sección a Identidad

```typescript
// 1. Crear componente de sección
// components/identidad/sections/AlcanceSection.tsx
export const AlcanceSection = ({ identity }: { identity: CorporateIdentity }) => {
  const { data: alcances } = useAlcances({ identity: identity.id });

  return (
    <div>
      {/* Renderizar alcances por norma ISO */}
    </div>
  );
};

// 2. Agregar a SECTION_KEYS
// IdentidadTab.tsx
const SECTION_KEYS = {
  MISION_VISION: 'mision_vision',
  VALORES: 'valores',
  POLITICA: 'politica',
  POLITICAS: 'politicas',
  ALCANCE: 'alcance', // 🆕 Nueva sección
} as const;

// 3. Agregar case en renderSection()
switch (activeSection) {
  case SECTION_KEYS.ALCANCE:
    return <AlcanceSection identity={identity} />;
  // ...
}

// 4. Backend: Crear TabSection en BD
INSERT INTO core_tabsection (
  tab_id,
  code,
  name,
  orden
) VALUES (
  (SELECT id FROM core_moduletab WHERE code = 'identidad'),
  'alcance',
  'Alcance del Sistema',
  5
);
```

### 5.2 Cómo Agregar Nuevo Tipo de Política

```typescript
// 1. types/strategic.types.ts
export interface PoliticaOperacional extends PolicyBase {
  departamento: string;
  aplica_a_procesos: string[];
}

export interface CreatePoliticaOperacionalDTO {
  identity: number;
  title: string;
  content: string;
  departamento: string;
  // ...
}

// 2. api/strategicApi.ts
export const politicasOperacionalesApi = {
  getAll: async (filters?: any) => {
    const response = await axiosInstance.get(
      `${IDENTIDAD_URL}/politicas-operacionales/`,
      { params: filters }
    );
    return response.data;
  },
  // ... CRUD methods
};

// 3. hooks/useStrategic.ts
export const usePoliticasOperacionales = (filters?: any) => {
  return useQuery({
    queryKey: ['politicas-operacionales', filters],
    queryFn: () => politicasOperacionalesApi.getAll(filters),
  });
};

// 4. PoliticasManager.tsx
// Agregar nueva tab para Políticas Operacionales
```

---

## 6. Patrones de Testing Recomendados

### 6.1 Testing de Componentes

```typescript
// __tests__/components/IdentidadTab.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IdentidadTab } from '../IdentidadTab';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('IdentidadTab', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('should render empty state when no identity', async () => {
    // Mock API response
    server.use(
      rest.get('/api/identidad/identidad/active/', (req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    render(<IdentidadTab />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/sin identidad corporativa/i)).toBeInTheDocument();
    });
  });

  it('should render sections when activeSection provided', async () => {
    // Mock with data
    server.use(
      rest.get('/api/identidad/identidad/active/', (req, res, ctx) => {
        return res(ctx.json(mockIdentity));
      })
    );

    render(<IdentidadTab activeSection="mision_vision" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/misión/i)).toBeInTheDocument();
      expect(screen.getByText(/visión/i)).toBeInTheDocument();
    });
  });
});
```

### 6.2 Testing de Hooks

```typescript
// __tests__/hooks/useStrategic.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useActiveIdentity } from '../useStrategic';

const queryClient = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('useActiveIdentity', () => {
  it('should return identity data', async () => {
    server.use(
      rest.get('/api/identidad/identidad/active/', (req, res, ctx) => {
        return res(ctx.json(mockIdentity));
      })
    );

    const { result } = renderHook(() => useActiveIdentity(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockIdentity);
  });

  it('should cache data for 30 seconds', async () => {
    const { result, rerender } = renderHook(() => useActiveIdentity(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Rerender should use cached data
    rerender();
    expect(result.current.isFetching).toBe(false);
  });
});
```

---

## 7. Métricas de Calidad

### 7.1 Complejidad Ciclomática

| Archivo | Complejidad | Umbral Recomendado | Estado |
|---------|-------------|-------------------|--------|
| IdentidadTab.tsx | 12 | 10 | ⚠️ Revisar |
| ValoresDragDrop.tsx | 8 | 10 | ✅ OK |
| PoliticasManager.tsx | 18 | 10 | ❌ Refactorizar |
| IdentidadShowcase.tsx | 10 | 10 | ⚠️ Límite |

### 7.2 Análisis de Props

```
Componente                 Props Count   Recomendado   Estado
────────────────────────────────────────────────────────────
IdentidadTab                    2            3          ✅
ValoresDragDrop                 7            6          ⚠️
PoliticasManager               15            8          ❌
IdentityFormModal               3            4          ✅
PolicyCard                      7            6          ⚠️
```

### 7.3 Líneas por Función

```
Función                      Líneas   Recomendado   Estado
────────────────────────────────────────────────────────
handleDragEnd                 15         20         ✅
handleTransition              25         20         ⚠️
renderSection                 40         30         ❌
PolicyFormModal.render       150         80         ❌
```

---

## 8. Roadmap Visual de Refactoring

```
┌─────────────────────────────────────────────────────────────┐
│                     ESTADO ACTUAL                           │
│                                                             │
│  IdentidadTab.tsx (480 líneas)                             │
│  ├─ MisionVisionSection (interno)                          │
│  ├─ ValoresSection (interno)                               │
│  ├─ PoliticaSection (interno)                              │
│  └─ PoliticasSection (interno)                             │
│                                                             │
│  PoliticasManager.tsx (912 líneas)                         │
│  └─ 6 sub-componentes internos                             │
│                                                             │
│  useStrategic.ts (1,257 líneas)                            │
│  └─ 50+ hooks en un archivo                                │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ REFACTORING
                         │ (4 semanas)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     ESTADO OBJETIVO                         │
│                                                             │
│  components/identidad/                                      │
│  ├─ IdentidadTab.tsx (120 líneas) ✅                       │
│  ├─ sections/                                               │
│  │  ├─ MisionVisionSection.tsx (80 líneas)                │
│  │  ├─ ValoresSection.tsx (60 líneas)                     │
│  │  ├─ PoliticaSection.tsx (50 líneas)                    │
│  │  └─ PoliticasSection.tsx (70 líneas)                   │
│  │                                                          │
│  ├─ politicas/                                              │
│  │  ├─ PoliticasManager.tsx (200 líneas) ✅               │
│  │  ├─ PolicyCard.tsx (140 líneas)                        │
│  │  ├─ PolicyFormModal.tsx (180 líneas)                   │
│  │  ├─ WorkflowTimeline.tsx (120 líneas)                  │
│  │  └─ hooks/                                               │
│  │     ├─ usePolicyWorkflow.ts                            │
│  │     └─ usePolicyReview.ts                              │
│  │                                                          │
│  └─ context/                                                │
│     ├─ IdentityContext.tsx                                 │
│     └─ BrandingContext.tsx                                 │
│                                                             │
│  hooks/                                                     │
│  ├─ identity/                                               │
│  │  ├─ useIdentity.ts (150 líneas)                        │
│  │  ├─ useValues.ts (200 líneas)                          │
│  │  └─ usePoliticas.ts (250 líneas)                       │
│  ├─ planeacion/                                             │
│  │  ├─ usePlans.ts                                         │
│  │  └─ useObjectives.ts                                    │
│  └─ keys/                                                   │
│     └─ queryKeys.ts (centralized)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Checklist de Calidad

### Pre-Commit Checklist

```markdown
## Antes de hacer commit en módulo Identidad:

### Componentes
- [ ] Archivo < 500 líneas
- [ ] Props < 8
- [ ] useState < 5 en un componente
- [ ] Complejidad ciclomática < 10
- [ ] React.memo aplicado si recibe objetos como props
- [ ] useCallback en handlers pasados a child components

### Hooks
- [ ] Archivo < 300 líneas
- [ ] Query keys centralizados
- [ ] onSuccess invalida queries correctas
- [ ] Toast messages claros
- [ ] Error handling presente

### Types
- [ ] Sin tipos `any`
- [ ] DTOs separados (Create vs Update)
- [ ] Interfaces exportadas
- [ ] Comentarios en tipos complejos

### Performance
- [ ] useMemo en cálculos pesados
- [ ] useCallback en handlers
- [ ] No hay loops en render
- [ ] Imágenes optimizadas

### Testing
- [ ] Test unitario del hook o componente
- [ ] Coverage > 70%
- [ ] Mock de API presente
```

---

**Fin del Diagrama**

Este documento complementa la auditoría principal con visualizaciones detalladas de la arquitectura del módulo.
