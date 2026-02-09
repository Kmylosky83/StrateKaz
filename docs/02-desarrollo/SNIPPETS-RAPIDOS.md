# Snippets Rápidos - Copy & Paste

Colección de snippets listos para copiar y pegar.

---

## Imports Esenciales

```typescript
// Layout Components
import {
  PageHeader,
  FilterCard,
  FilterGrid,
  StatsGrid,
  DataTableCard,
  PageTabs,
} from '@/components/layout';

// Common Components
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';

// Form Components
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';

// Icons
import {
  Plus,
  Download,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  FileText,
  Filter,
  Search,
} from 'lucide-react';

// Others
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
```

---

## PageHeader Básico

```typescript
<PageHeader
  title="Recepción de Materias Primas"
  description="Gestione la recepción y almacenamiento"
  badges={[
    { label: '24 Total', variant: 'primary' },
    { label: 'ACTIVO', variant: 'success' }
  ]}
  actions={
    <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
      Nueva Recepción
    </Button>
  }
/>
```

---

## StatsGrid Completo

```typescript
const stats = [
  {
    label: 'Pendientes',
    value: 24,
    icon: Clock,
    iconColor: 'warning',
    change: '+3',
    changeType: 'positive',
    description: 'Esta semana'
  },
  {
    label: 'En Recepción',
    value: 8,
    icon: Package,
    iconColor: 'primary',
    description: 'En progreso'
  },
  {
    label: 'Completadas',
    value: 156,
    icon: CheckCircle2,
    iconColor: 'success',
    change: '+10',
    changeType: 'positive',
    description: 'vs mes anterior'
  },
  {
    label: 'Rechazadas',
    value: 2,
    icon: AlertCircle,
    iconColor: 'danger',
    description: 'Requieren revisión'
  },
];

<StatsGrid stats={stats} columns={4} variant="default" />
```

---

## FilterCard Colapsable

```typescript
const [search, setSearch] = useState('');
const [filters, setFilters] = useState({
  estado: '',
  proveedor_id: '',
  materia_prima_id: '',
  fecha_desde: '',
});

const activeFiltersCount = Object.values(filters).filter(v => v).length;

<FilterCard
  collapsible
  searchPlaceholder="Buscar por número, proveedor..."
  searchValue={search}
  onSearchChange={(value) => setSearch(value)}
  activeFiltersCount={activeFiltersCount}
  hasActiveFilters={activeFiltersCount > 0}
  onClearFilters={() => {
    setSearch('');
    setFilters({ estado: '', proveedor_id: '', materia_prima_id: '', fecha_desde: '' });
  }}
>
  <FilterGrid columns={4}>
    <Select
      label="Estado"
      placeholder="Todos"
      value={filters.estado}
      onChange={(e) => setFilters({...filters, estado: e.target.value})}
      options={[
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'en_recepcion', label: 'En Recepción' },
        { value: 'completada', label: 'Completada' },
        { value: 'rechazada', label: 'Rechazada' },
      ]}
    />
    <Select
      label="Proveedor"
      placeholder="Todos"
      value={filters.proveedor_id}
      onChange={(e) => setFilters({...filters, proveedor_id: e.target.value})}
      options={proveedoresOptions}
    />
    <Select
      label="Materia Prima"
      placeholder="Todas"
      value={filters.materia_prima_id}
      onChange={(e) => setFilters({...filters, materia_prima_id: e.target.value})}
      options={materiasPrimasOptions}
    />
    <Input
      label="Desde"
      type="date"
      value={filters.fecha_desde}
      onChange={(e) => setFilters({...filters, fecha_desde: e.target.value})}
    />
  </FilterGrid>
</FilterCard>
```

---

## Tabla Simple

```typescript
<DataTableCard
  title="Recepciones"
  pagination={{
    currentPage: page,
    pageSize: 10,
    totalItems: total,
    hasNext: page * 10 < total,
    hasPrevious: page > 1,
    onPageChange: setPage,
  }}
  isEmpty={data.length === 0}
>
  <table className="w-full text-sm">
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th className="px-6 py-3 text-left font-semibold">N°</th>
        <th className="px-6 py-3 text-left font-semibold">Proveedor</th>
        <th className="px-6 py-3 text-left font-semibold">Cantidad</th>
        <th className="px-6 py-3 text-left font-semibold">Estado</th>
        <th className="px-6 py-3 text-right font-semibold">Acciones</th>
      </tr>
    </thead>
    <tbody className="divide-y">
      {data.map((item) => (
        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
          <td className="px-6 py-4">{item.numero}</td>
          <td className="px-6 py-4">{item.proveedor_nombre}</td>
          <td className="px-6 py-4">{item.cantidad}</td>
          <td className="px-6 py-4">
            <Badge variant="warning">Pendiente</Badge>
          </td>
          <td className="px-6 py-4 text-right">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</DataTableCard>
```

---

## Modal Formulario

```typescript
const [isOpen, setIsOpen] = useState(false);
const [isLoading, setIsLoading] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Nueva Recepción"
  size="2xl"
>
  <form className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Código de Lote *"
        placeholder="LOTE-2024-001"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
      />
      <Input
        label="Cantidad (Kg) *"
        type="number"
        step="0.01"
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
      />
    </div>

    <Select
      label="Estado"
      options={[
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'completada', label: 'Completada' },
      ]}
      value={estado}
      onChange={(e) => setEstado(e.target.value)}
    />

    <div className="flex gap-3 justify-end pt-4 border-t">
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancelar
      </Button>
      <Button variant="primary" isLoading={isLoading} type="submit">
        Guardar
      </Button>
    </div>
  </form>
</Modal>
```

---

## Modal de Confirmación

```typescript
const [isDeleteOpen, setIsDeleteOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

<Modal
  isOpen={isDeleteOpen}
  onClose={() => setIsDeleteOpen(false)}
  title="Eliminar Recepción"
  size="sm"
>
  <div className="space-y-4">
    <p className="text-gray-600">
      ¿Está seguro de eliminar <strong>{selectedItem?.numero}</strong>?
    </p>
    <p className="text-sm text-gray-500">
      Esta acción no se puede deshacer.
    </p>

    <div className="flex gap-3 justify-end pt-4">
      <Button
        variant="ghost"
        onClick={() => setIsDeleteOpen(false)}
      >
        Cancelar
      </Button>
      <Button
        variant="danger"
        onClick={handleDelete}
        isLoading={isDeleting}
      >
        Eliminar
      </Button>
    </div>
  </div>
</Modal>
```

---

## PageTabs

```typescript
const [activeTab, setActiveTab] = useState('todas');

const tabs = [
  { id: 'todas', label: 'Todas', badge: 24 },
  { id: 'pendientes', label: 'Pendientes', badge: 12 },
  { id: 'completadas', label: 'Completadas', badge: 156 },
  { id: 'rechazadas', label: 'Rechazadas', badge: 2 },
];

<PageHeader
  title="Recepción"
  tabs={
    <PageTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  }
/>

{/* Contenido dinámico */}
{activeTab === 'todas' && <TodasContent />}
{activeTab === 'pendientes' && <PendientesContent />}
{/* ... */}
```

---

## Hook - Fetch Data

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// GET
const { data, isLoading } = useQuery({
  queryKey: ['recepciones', filters],
  queryFn: async () => {
    const response = await api.get('/api/recepcion', { params: filters });
    return response.data;
  },
});

// POST
const createMutation = useMutation({
  mutationFn: async (data) => {
    const response = await api.post('/api/recepcion', data);
    return response.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['recepciones'] });
  },
});

// Uso
await createMutation.mutateAsync(newData);
```

---

## Badge Estados

```typescript
// Individual
<Badge variant="warning">Pendiente</Badge>
<Badge variant="primary">En Recepción</Badge>
<Badge variant="success">Completada</Badge>
<Badge variant="danger">Rechazada</Badge>

// Condicional
<Badge variant={status === 'pendiente' ? 'warning' : 'success'}>
  {status}
</Badge>

// Componente reutilizable
function RecepcionStatusBadge({ status }) {
  const variants = {
    pendiente: 'warning',
    en_recepcion: 'primary',
    completada: 'success',
    rechazada: 'danger',
  };

  return <Badge variant={variants[status]}>{status}</Badge>;
}
```

---

## Buttons Comunes

```typescript
// Crear
<Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
  Nueva Recepción
</Button>

// Editar
<Button variant="secondary" leftIcon={<Edit2 className="h-4 w-4" />}>
  Editar
</Button>

// Eliminar
<Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>
  Eliminar
</Button>

// Ver
<Button variant="ghost" leftIcon={<Eye className="h-4 w-4" />}>
  Ver
</Button>

// Exportar
<Button variant="outline" rightIcon={<Download className="h-4 w-4" />}>
  Exportar
</Button>

// Loading
<Button variant="primary" isLoading={isLoading}>
  Guardando...
</Button>

// Deshabilitado
<Button variant="primary" disabled>
  Deshabilitado
</Button>
```

---

## Validación de Formulario

```typescript
const [errors, setErrors] = useState({});

const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({});

  // Validación local
  const newErrors = {};
  if (!codigo) newErrors.codigo = 'Requerido';
  if (cantidad <= 0) newErrors.cantidad = 'Debe ser mayor a 0';

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  // Submit
  try {
    await submitMutation.mutateAsync(data);
  } catch (error) {
    setErrors(error.response?.data?.errors || {});
  }
};

// Mostrar errores
<Input
  label="Código *"
  value={codigo}
  onChange={(e) => setCodigo(e.target.value)}
  error={errors.codigo}
/>
```

---

## Formato de Fechas

```typescript
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Mostrar fecha
const fecha = new Date('2024-12-04');
<span>{format(fecha, 'dd MMM yyyy', { locale: es })}</span>
// Output: 04 dic 2024

<span>{format(fecha, 'PPP', { locale: es })}</span>
// Output: miércoles, 4 de diciembre de 2024

<span>{format(fecha, 'dd/MM/yyyy')}</span>
// Output: 04/12/2024
```

---

## Tipado TypeScript

```typescript
// Types
export interface Recepcion {
  id: string;
  numero_recepcion: string;
  proveedor_id: string;
  proveedor_nombre: string;
  cantidad: number;
  estado: 'pendiente' | 'en_recepcion' | 'completada' | 'rechazada';
  created_at: string;
}

export interface CreateRecepcionDTO {
  proveedor_id: string;
  cantidad: number;
  observaciones?: string;
}

// Uso en componentes
interface RecepcionTableProps {
  data: Recepcion[];
  onEdit?: (item: Recepcion) => void;
  isLoading?: boolean;
}

export function RecepcionTable({
  data,
  onEdit,
  isLoading,
}: RecepcionTableProps) {
  // ...
}
```

---

## Layout Básico

```typescript
export default function RecepcionPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['recepciones', page],
    queryFn: () => api.get('/api/recepcion', { params: { page } }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Recepción"
        actions={<Button>Nueva</Button>}
      />

      {/* Stats */}
      <StatsGrid stats={stats} />

      {/* Filters */}
      <FilterCard collapsible>
        <FilterGrid>
          <Select ... />
        </FilterGrid>
      </FilterCard>

      {/* Table */}
      <DataTableCard pagination={...}>
        <RecepcionTable data={data?.data || []} />
      </DataTableCard>
    </div>
  );
}
```

---

## Dark Mode

```typescript
// Todos los componentes incluyen dark mode automático
// Tailwind se encarga automáticamente

// Para componentes personalizados:
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Contenido
</div>

// En componentes:
<div className="space-y-6 dark:space-y-6">
  {/* El dark mode es automático */}
</div>
```

---

## Estados de Carga

```typescript
// Spinner
<Spinner size="md" />

// Table loading
<DataTableCard isLoading={isLoading}>
  <RecepcionTable data={data} isLoading={isLoading} />
</DataTableCard>

// Button loading
<Button isLoading={isSubmitting}>
  Guardando...
</Button>

// Skeleton
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded" />
</div>
```

---

## Grid Responsivo

```typescript
// 1 columna en mobile, 2 en tablet, 4 en desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>

// O usar StatsGrid directamente
<StatsGrid stats={stats} columns={4} />
```

---

## Exportar Componentes

```typescript
// src/features/recepcion/index.ts

export { RecepcionStatusBadge } from './components/RecepcionStatusBadge';
export { RecepcionTable } from './components/RecepcionTable';
export { RecepcionForm } from './components/RecepcionForm';

export {
  useRecepcion,
  useCreateRecepcion,
  useUpdateRecepcion,
  useDeleteRecepcion,
} from './hooks/useRecepcion';

export type {
  Recepcion,
  CreateRecepcionDTO,
  RecepcionStatus,
} from './types/recepcion.types';
```

---

## Usar Componentes Exportados

```typescript
// En otras partes del proyecto
import {
  RecepcionStatusBadge,
  RecepcionTable,
  useRecepcion,
  type Recepcion,
} from '@/features/recepcion';

function OtherComponent() {
  const { data: recepciones } = useRecepcion();

  return (
    <div>
      {recepciones?.map(rec => (
        <RecepcionStatusBadge key={rec.id} status={rec.estado} />
      ))}
    </div>
  );
}
```

---

## Buscar y Reemplazar

### En VS Code:
```
Find:    className="\{.*\}"
Replace: className="... space-y-6 ..."

Pattern: Usar Regex para encontrar clases Tailwind específicas
```

---

## Next Steps

1. Copia los snippets que necesites
2. Adapta al contexto de tu componente
3. Ajusta valores y estilos
4. Consulta documentación si necesitas más info

**¡Listo para desarrollo rápido!**
