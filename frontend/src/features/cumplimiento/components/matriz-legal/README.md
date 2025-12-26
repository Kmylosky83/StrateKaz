# Componentes UI - Matriz Legal

## Descripción General

Sistema completo de gestión de normatividad legal aplicable a la empresa, con enfoque en:
- Decretos, Leyes, Resoluciones, Circulares, y Normas Técnicas Colombianas (NTC)
- Filtrado por sistemas de gestión (SST, Ambiental, Calidad, PESV)
- CRUD completo con validaciones
- Exportación a Excel
- Búsqueda inteligente con debouncing

## Arquitectura

```
matriz-legal/
├── MatrizLegalTab.tsx       # Componente principal con subtabs
├── NormasTable.tsx          # Tabla con TanStack Table
├── NormaFormModal.tsx       # Modal de creación/edición
├── NormaFilters.tsx         # Barra de filtros avanzados
└── index.ts                 # Barrel export
```

## Componentes Creados

### 1. MatrizLegalTab.tsx
**Componente principal del tab de Matriz Legal**

**Características:**
- 6 subtabs (Decretos, Leyes, Resoluciones, Circulares, NTC, Web Scraping)
- Dashboard con estadísticas rápidas
- Integración completa con API
- Manejo de estados de carga y error

**Props:**
```typescript
interface MatrizLegalTabProps {
  activeSection?: string; // Código de subsección desde DynamicSections
}
```

**Uso:**
```tsx
import { MatrizLegalTab } from '@/features/cumplimiento/components';

<MatrizLegalTab activeSection="decretos" />
```

---

### 2. NormasTable.tsx
**Tabla de normas con paginación del servidor**

**Características:**
- TanStack Table v8
- Paginación server-side
- Ordenamiento por columnas
- Badges dinámicos para sistemas aplicables
- Acciones de edición y eliminación

**Props:**
```typescript
interface NormasTableProps {
  data: NormaLegalList[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onEdit: (norma: NormaLegalList) => void;
  onDelete: (norma: NormaLegalList) => void;
  isLoading?: boolean;
}
```

**Columnas:**
- Tipo (Badge con color por código)
- Código completo (font-mono)
- Título (con line-clamp-2)
- Sistemas aplicables (múltiples badges)
- Fecha de expedición
- Estado (Vigente/Derogada)
- Acciones (Editar/Eliminar)

---

### 3. NormaFormModal.tsx
**Modal de formulario para CRUD de normas**

**Características:**
- Validación completa del formulario
- Soporte para crear y editar
- Checkboxes para sistemas de gestión
- Estados de vigencia
- Integración con TanStack Query mutations

**Props:**
```typescript
interface NormaFormModalProps {
  norma: NormaLegal | null;  // null = crear, objeto = editar
  isOpen: boolean;
  onClose: () => void;
}
```

**Campos del formulario:**

**Información Básica:**
- Tipo de norma (select)
- Número
- Año
- Título

**Entidad y Fechas:**
- Entidad emisora
- Fecha de expedición
- Fecha de vigencia (opcional)
- URL original (opcional)

**Sistemas Aplicables (checkboxes):**
- SST
- Ambiental
- Calidad
- PESV

**Contenido:**
- Resumen (textarea)
- Contenido completo (textarea)

**Estado:**
- Vigente (checkbox)

**Validaciones:**
- Campos requeridos marcados con *
- Validación de año (1900 - año actual)
- Al menos un sistema debe estar seleccionado
- URLs deben ser válidas

---

### 4. NormaFilters.tsx
**Componente de filtros avanzados**

**Características:**
- Búsqueda con debounce (300ms)
- Filtros rápidos por sistema (siempre visibles)
- Filtros avanzados colapsables
- Contador de filtros activos
- Botón de limpiar filtros

**Props:**
```typescript
interface NormaFiltersProps {
  filters: NormasListParams;
  onFiltersChange: (filters: NormasListParams) => void;
  showAdvancedFilters?: boolean;
}
```

**Filtros disponibles:**

**Filtros rápidos:**
- SST
- Ambiental
- Calidad
- PESV

**Filtros avanzados:**
- Tipo de norma (select)
- Vigencia (Todas/Vigentes/Derogadas)
- Año

**Búsqueda de texto:**
- Búsqueda en número, título, entidad emisora

---

## Hooks Creados

### useNormasLegales.ts

**Queries:**
```typescript
// Listar normas con filtros
const { data, isLoading } = useNormasLegales({
  page: 1,
  page_size: 10,
  search: 'decreto',
  tipo_norma: 1,
  vigente: true,
  aplica_sst: true,
});

// Obtener detalle
const { data: norma } = useNormaLegal(normaId);

// Listar tipos de norma
const { data: tipos } = useTiposNorma();
```

**Mutations:**
```typescript
// Crear norma
const createMutation = useCreateNorma();
await createMutation.mutateAsync(normaData);

// Actualizar norma
const updateMutation = useUpdateNorma();
await updateMutation.mutateAsync({ id: 1, data: normaData });

// Eliminar norma
const deleteMutation = useDeleteNorma();
await deleteMutation.mutateAsync(normaId);

// Exportar a Excel
const exportMutation = useExportNormas();
await exportMutation.mutateAsync(filters);

// Scraping de norma
const scrapeMutation = useScrapeNorma();
await scrapeMutation.mutateAsync({ tipo: 'DEC', numero: '1072', anio: 2015 });
```

---

## API Cliente

### normasApi.ts

**Endpoints:**

```typescript
// GET /api/cumplimiento/normas-legales/
normasApi.list(params)

// GET /api/cumplimiento/normas-legales/{id}/
normasApi.get(id)

// POST /api/cumplimiento/normas-legales/
normasApi.create(data)

// PATCH /api/cumplimiento/normas-legales/{id}/
normasApi.update(id, data)

// DELETE /api/cumplimiento/normas-legales/{id}/
normasApi.delete(id)

// GET /api/cumplimiento/normas-legales/export_excel/
normasApi.exportExcel(params)

// POST /api/cumplimiento/normas-legales/scrape/
normasApi.scrapeNorma(tipo, numero, anio)

// GET /api/cumplimiento/tipos-norma/
tiposNormaApi.list()
```

---

## Tipos TypeScript

Ver `frontend/src/features/cumplimiento/types/matrizLegal.ts`

**Principales:**
- `NormaLegal` - Modelo completo
- `NormaLegalList` - Versión resumida para listados
- `NormaLegalCreateUpdate` - DTO para create/update
- `TipoNorma` - Tipos de norma (Decreto, Ley, etc.)
- `SistemaGestion` - 'SST' | 'Ambiental' | 'Calidad' | 'PESV'

---

## Design System Utilizado

### Componentes Common
- `Button` - Botones con variantes y estados de carga
- `Badge` - Etiquetas de color para tipos y sistemas
- `Card` - Contenedores con sombras y bordes
- `Tabs` - Navegación de subtabs con variante pills
- `EmptyState` - Estados vacíos con iconos y acciones
- `ConfirmDialog` - Diálogos de confirmación

### Componentes Forms
- `Input` - Campos de texto con labels y errores
- `Textarea` - Áreas de texto con resize configurable

### Componentes Modals
- `BaseModal` - Modal base con animaciones Framer Motion

---

## Paleta de Colores por Sistema

```typescript
SST:        orange (bg-orange-100 text-orange-700)
Ambiental:  green  (bg-green-100 text-green-700)
Calidad:    blue   (bg-blue-100 text-blue-700)
PESV:       purple (bg-purple-100 text-purple-700)
```

---

## Flujo de Datos

```
Usuario
  ↓
MatrizLegalTab (estado local + filtros)
  ↓
useNormasLegales (TanStack Query)
  ↓
normasApi (Axios)
  ↓
Backend Django REST
  ↓
PostgreSQL
```

---

## Próximas Funcionalidades (Web Scraping)

1. Búsqueda automática en Función Pública
2. Consulta al Congreso de la República
3. Extracción de contenido oficial
4. Alertas de nuevas normas publicadas
5. Actualización automática de normas derogadas

---

## Testing

**Ejemplo de test (a implementar):**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { MatrizLegalTab } from './MatrizLegalTab';

describe('MatrizLegalTab', () => {
  it('should render subtabs correctly', () => {
    render(<MatrizLegalTab />);
    expect(screen.getByText('Decretos')).toBeInTheDocument();
    expect(screen.getByText('Leyes')).toBeInTheDocument();
  });

  it('should filter by SST system', async () => {
    render(<MatrizLegalTab />);
    const sstButton = screen.getByText('SST');
    fireEvent.click(sstButton);

    await waitFor(() => {
      expect(mockApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ aplica_sst: true })
      );
    });
  });
});
```

---

## Notas de Implementación

1. **Debouncing**: La búsqueda tiene un debounce de 300ms para evitar múltiples llamadas
2. **Paginación**: Se maneja server-side con reset a página 1 al cambiar filtros
3. **Cache**: TanStack Query cachea por 5 minutos (staleTime)
4. **Validación**: El formulario valida antes de enviar al backend
5. **Estados de carga**: Todos los componentes manejan estados loading/error
6. **Dark mode**: Todos los componentes soportan tema oscuro

---

## Mantenimiento

**Archivos clave a modificar:**

- Agregar nuevo filtro → `NormaFilters.tsx`
- Agregar nueva columna → `NormasTable.tsx`
- Agregar nuevo campo → `NormaFormModal.tsx` + `matrizLegal.ts` (tipos)
- Agregar nuevo subtab → `MatrizLegalTab.tsx` (SUBTABS)
- Agregar nuevo endpoint → `normasApi.ts` + `useNormasLegales.ts`
