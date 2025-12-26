# Módulo Cumplimiento Legal - Frontend

Sistema de Gestión Grasas y Huesos del Norte

## Estructura del Módulo

```
cumplimiento/
├── api/                          # Clientes API
│   ├── index.ts                  # Barrel export
│   ├── matrizLegalApi.ts         # API Matriz Legal
│   ├── requisitosApi.ts          # API Requisitos Legales
│   ├── partesInteresadasApi.ts   # API Partes Interesadas
│   └── reglamentosApi.ts         # API Reglamentos Internos
│
├── hooks/                        # React Query Hooks
│   ├── index.ts                  # Barrel export
│   ├── useMatrizLegal.ts         # Hooks Matriz Legal
│   ├── useRequisitos.ts          # Hooks Requisitos Legales
│   ├── usePartesInteresadas.ts   # Hooks Partes Interesadas
│   └── useReglamentos.ts         # Hooks Reglamentos Internos
│
├── types/                        # Tipos TypeScript
│   ├── index.ts                  # Barrel export
│   └── cumplimiento.types.ts     # Definiciones de tipos
│
├── pages/                        # Páginas del módulo
│   ├── CumplimientoPage.tsx
│   ├── MatrizLegalPage.tsx
│   ├── RequisitosLegalesPage.tsx
│   ├── PartesInteresadasPage.tsx
│   └── ReglamentosInternosPage.tsx
│
└── components/                   # Componentes específicos
    └── [componentes por submódulo]
```

## Arquitectura

### 1. API Clients (api/)

Cada API client provee funciones para comunicarse con el backend Django:

#### Matriz Legal (`matrizLegalApi.ts`)
- **tiposNormaApi**: CRUD para tipos de norma
- **normasLegalesApi**: CRUD para normas legales + `getBySistema()`
- **empresaNormasApi**: CRUD para asignación empresa-norma + `evaluarCumplimiento()`

#### Requisitos Legales (`requisitosApi.ts`)
- **tiposRequisitoApi**: CRUD para tipos de requisito
- **requisitosLegalesApi**: CRUD para requisitos legales
- **empresaRequisitosApi**: CRUD para requisitos de empresa + `getVencimientos()` + `renovar()`
  - Soporte para archivos con FormData

#### Partes Interesadas (`partesInteresadasApi.ts`)
- **tiposParteInteresadaApi**: CRUD + `reorder()`
- **partesInteresadasApi**: CRUD + `getMatrizInfluenciaInteres()`

#### Reglamentos Internos (`reglamentosApi.ts`)
- **tiposReglamentoApi**: CRUD + `reorder()`
- **reglamentosApi**: CRUD + `aprobar()` + `publicar()` + `marcarObsoleto()` + `reorder()`
  - Soporte para archivos con FormData

### 2. Hooks (hooks/)

Todos los hooks usan **useGenericCRUD** como base, proporcionando:
- ✅ Operaciones CRUD completas
- ✅ Estados de carga individuales (isCreating, isUpdating, isDeleting)
- ✅ Invalidación automática de cache
- ✅ Manejo de errores con toasts
- ✅ Toggle de estado activo/inactivo

#### useMatrizLegal.ts
```typescript
// Query keys
export const matrizLegalKeys = {
  tiposNorma: ['tipos-norma'],
  normas: (filters?) => ['normas-legales', filters],
  empresaNormas: (filters?) => ['empresa-normas', filters],
};

// Hooks principales
useTiposNorma()                    // CRUD tipos de norma
useNormasLegales(filters?)         // CRUD normas legales
useNormasLegalesBySistema(sistema) // Normas por sistema
useEmpresaNormas(filters?)         // CRUD empresa-normas
useEvaluarCumplimiento()           // Evaluar cumplimiento
```

#### useRequisitos.ts
```typescript
// Query keys
export const requisitosKeys = {
  tiposRequisito: ['tipos-requisito'],
  requisitos: (filters?) => ['requisitos-legales', filters],
  empresaRequisitos: (filters?) => ['empresa-requisitos', filters],
  vencimientos: (empresaId, dias?) => ['empresa-requisitos', 'vencimientos', ...],
};

// Hooks principales
useTiposRequisito()                      // CRUD tipos
useRequisitosLegales(filters?)           // CRUD requisitos
useEmpresaRequisitos(filters?)           // CRUD empresa-requisitos
useVencimientos(empresaId, dias?)        // Obtener vencimientos
useRenovarRequisito()                    // Renovar requisito
useCreateEmpresaRequisitoWithFile()      // Crear con archivo
useUpdateEmpresaRequisitoWithFile()      // Actualizar con archivo
```

#### usePartesInteresadas.ts
```typescript
// Query keys
export const partesInteresadasKeys = {
  tipos: ['tipos-parte-interesada'],
  partes: (filters?) => ['partes-interesadas', filters],
  matrizInfluenciaInteres: (empresaId) => [...],
};

// Hooks principales
useTiposParteInteresada()                // CRUD tipos
useReorderTiposParteInteresada()         // Reordenar tipos
usePartesInteresadas(filters?)           // CRUD partes
useMatrizInfluenciaInteres(empresaId)    // Matriz de análisis
```

#### useReglamentos.ts
```typescript
// Query keys
export const reglamentosKeys = {
  tipos: ['tipos-reglamento'],
  reglamentos: (filters?) => ['reglamentos', filters],
};

// Hooks principales
useTiposReglamento()                     // CRUD tipos
useReorderTiposReglamento()              // Reordenar tipos
useReglamentos(filters?)                 // CRUD reglamentos
useCreateReglamentoWithFile()            // Crear con archivo
useUpdateReglamentoWithFile()            // Actualizar con archivo
useAprobarReglamento()                   // Aprobar
usePublicarReglamento()                  // Publicar
useMarcarObsoleto()                      // Marcar obsoleto
useReorderReglamentos()                  // Reordenar
```

### 3. Tipos TypeScript (types/)

Archivo `cumplimiento.types.ts` contiene todas las definiciones:

#### Tipos Base
- `BaseTimestamped`: created_at, updated_at
- `SoftDelete`: is_active, deleted_at
- `Audit`: created_by, updated_by
- `BaseCompany`: empresa + combinación de anteriores

#### Matriz Legal
- `TipoNorma` + DTOs
- `NormaLegal` + DTOs + `NormaLegalFilters`
- `EmpresaNorma` + DTOs + `EmpresaNormaFilters`
- `PorcentajeCumplimiento`: 0 | 25 | 50 | 75 | 100

#### Requisitos Legales
- `TipoRequisito` + DTOs
- `RequisitoLegal` + DTOs + Filters
- `EmpresaRequisito` + DTOs + Filters
- `EstadoRequisito`: 'vigente' | 'proximo_vencer' | 'vencido' | 'en_tramite' | 'no_aplica'

#### Partes Interesadas
- `TipoParteInteresada` + DTOs
- `ParteInteresada` + DTOs + Filters
- `NivelInfluencia`: 'alta' | 'media' | 'baja'
- `NivelInteres`: 'alto' | 'medio' | 'bajo'

#### Reglamentos Internos
- `TipoReglamento` + DTOs
- `Reglamento` + DTOs + Filters
- `EstadoReglamento`: 'borrador' | 'en_revision' | 'aprobado' | 'vigente' | 'obsoleto'

## Uso de useGenericCRUD

Todos los hooks principales del módulo usan `useGenericCRUD` como base:

```typescript
// Ejemplo: useTiposNorma
export const useTiposNorma = () => {
  return useGenericCRUD<TipoNorma>({
    queryKey: matrizLegalKeys.tiposNorma,
    endpoint: '/motor_cumplimiento/matriz-legal/tipos-norma/',
    entityName: 'Tipo de Norma',
    isPaginated: true,
  });
};
```

### Ventajas
✅ Código DRY (Don't Repeat Yourself)
✅ Consistencia en toda la aplicación
✅ Manejo automático de errores
✅ Estados de carga granulares
✅ Invalidación inteligente de cache

### Retorno del Hook
```typescript
const {
  data,              // Array de entidades
  rawData,           // Respuesta completa (con paginación)
  isLoading,         // Cargando inicial
  isFetching,        // Refetch en progreso
  error,             // Error si hay
  pagination,        // Metadata de paginación

  create,            // (data) => Promise<T>
  update,            // ({ id, data }) => Promise<T>
  delete,            // (id) => Promise<void>
  toggleActive,      // (id) => Promise<T>

  isCreating,        // Estado creación
  isUpdating,        // Estado actualización
  isDeleting,        // Estado eliminación
  isToggling,        // Estado toggle

  invalidate,        // () => Promise<void>
} = useTiposNorma();
```

## Endpoints Backend

Base URL: `/motor_cumplimiento/`

### Matriz Legal
- `/matriz-legal/tipos-norma/`
- `/matriz-legal/normas/`
- `/matriz-legal/empresa-normas/`

### Requisitos Legales
- `/requisitos-legales/tipos/`
- `/requisitos-legales/requisitos/`
- `/requisitos-legales/empresa-requisitos/`

### Partes Interesadas
- `/partes-interesadas/tipos/`
- `/partes-interesadas/partes/`

### Reglamentos Internos
- `/reglamentos-internos/tipos/`
- `/reglamentos-internos/reglamentos/`

## Ejemplo de Uso en Componente

```typescript
import { useTiposNorma, useNormasLegales } from '@/features/cumplimiento/hooks';

function MatrizLegalPage() {
  const {
    data: tiposNorma,
    isLoading: loadingTipos,
    create: createTipo,
    isCreating,
  } = useTiposNorma();

  const {
    data: normas,
    isLoading: loadingNormas,
    create: createNorma,
    update: updateNorma,
    delete: deleteNorma,
  } = useNormasLegales({ vigente: true });

  const handleCreateTipo = async (data) => {
    try {
      await createTipo(data);
      // Toast automático + invalidación de cache
    } catch (error) {
      // Error manejado automáticamente
    }
  };

  return (
    <div>
      {/* UI aquí */}
    </div>
  );
}
```

## Notas Importantes

1. **Paginación**: Los endpoints retornan `PaginatedResponse<T>` con:
   - `count`: Total de registros
   - `next`: URL siguiente página
   - `previous`: URL página anterior
   - `results`: Array de resultados

2. **Archivos**: Para upload de archivos:
   - Usar hooks específicos `*WithFile()`
   - El API client maneja automáticamente FormData
   - Ejemplo: `useCreateEmpresaRequisitoWithFile()`

3. **Filtros**: Pasar como parámetros a los hooks:
   ```typescript
   useNormasLegales({ vigente: true, aplica_sst: true })
   ```

4. **Cache**: React Query maneja el cache automáticamente
   - Invalidación automática en mutaciones
   - Query keys optimizadas para granularidad

5. **TypeScript**: Tipos fuertemente tipados
   - Autocompletado completo
   - Validación en tiempo de desarrollo
   - Mapeo 1:1 con modelos Django

## Mantenimiento

Al agregar nuevos endpoints:

1. Actualizar tipos en `types/cumplimiento.types.ts`
2. Agregar funciones al API client correspondiente
3. Crear hook usando `useGenericCRUD` si es CRUD estándar
4. O crear hook custom para operaciones especiales
5. Exportar en archivos `index.ts` correspondientes

## Referencias

- Hook genérico: `frontend/src/hooks/useGenericCRUD.ts`
- Patrón referencia: `frontend/src/features/gestion-estrategica/`
- Modelos backend: `backend/apps/motor_cumplimiento/`
