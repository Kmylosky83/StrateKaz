# Design System del Proyecto - Guía de Componentes Reutilizables

Este documento describe los componentes disponibles en el Design System del proyecto "StrateKaz" y cómo usarlos en el módulo de Recepción.

---

## 1. COMPONENTES LAYOUT (Estructuras de página)

Ubicación: `c:\Proyectos\StrateKaz\frontend\src\components\layout\`

### 1.1 PageHeader

**Propósito:** Header reutilizable para todas las páginas con título, descripción, badges, acciones y tabs.

**Props:**
```typescript
interface PageHeaderProps {
  title: string;                    // Título principal (requerido)
  description?: string;             // Subtítulo/descripción
  badges?: PageHeaderBadge[];        // Badges informativos
  actions?: ReactNode;              // Botones de acción (crear, exportar, etc.)
  controls?: ReactNode;             // Toggles, vista picker, etc.
  tabs?: ReactNode;                 // Tabs de navegación
  className?: string;               // Clases Tailwind adicionales
}

interface PageHeaderBadge {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}
```

**Estructura Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Título] [Badge] [Badge]              [Controls] [Actions] │
│ Descripción                                                 │
├─────────────────────────────────────────────────────────────┤
│ [Tab 1] [Tab 2] [Tab 3]                                     │
└─────────────────────────────────────────────────────────────┘
```

**Ejemplo para módulo de Recepción:**
```tsx
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/common/Button';
import { Package, Download } from 'lucide-react';

function RecepcionPage() {
  return (
    <PageHeader
      title="Recepción de Materias Primas"
      description="Gestione la recepción, validación y almacenamiento de materias primas"
      badges={[
        { label: '24 Pendientes', variant: 'warning' },
        { label: 'ACTIVO', variant: 'success' }
      ]}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
          >
            Exportar
          </Button>
          <Button
            variant="primary"
            leftIcon={<Package className="h-4 w-4" />}
          >
            Nueva Recepción
          </Button>
        </div>
      }
    />
  );
}
```

---

### 1.2 StatsGrid

**Propósito:** Grid de tarjetas de estadísticas/KPIs con iconos y cambios porcentuales.

**Props:**
```typescript
interface StatsGridProps {
  stats: StatItem[];              // Array de estadísticas
  columns?: 2 | 3 | 4 | 5;        // Columnas en desktop (default: 4)
  variant?: 'default' | 'compact'; // Tamaño de las cards
  macroprocessColor?: MacroprocessColor; // Color del tema automático
  className?: string;
}

interface StatItem {
  label: string;                  // Etiqueta
  value: string | number;         // Valor principal
  icon?: LucideIcon;              // Icono de lucide-react
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  change?: string;                // Cambio porcentual ej: "+12%"
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;           // Descripción adicional
}
```

**Estructura Visual (variant='default'):**
```
┌──────────────────────────────────────┐
│ Label                           🎨   │
│ 1,234                               │
│ +12% vs anterior                    │
└──────────────────────────────────────┘
```

**Estructura Visual (variant='compact'):**
```
┌──────────────────────────────────────┐
│ 🎨 Label                             │
│    1,234                             │
└──────────────────────────────────────┘
```

**Ejemplo para módulo de Recepción:**
```tsx
import { StatsGrid } from '@/components/layout';
import {
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

function RecepcionDashboard() {
  const stats = [
    {
      label: 'Recepción Pendientes',
      value: 24,
      icon: Package,
      iconColor: 'warning',
      change: '+3',
      changeType: 'positive',
      description: 'Esta semana'
    },
    {
      label: 'Recibidas Hoy',
      value: 8,
      icon: CheckCircle2,
      iconColor: 'success',
      change: '+2',
      changeType: 'positive',
      description: 'De 15 esperadas'
    },
    {
      label: 'Con Incidencias',
      value: 3,
      icon: AlertCircle,
      iconColor: 'danger',
      change: '-1',
      changeType: 'negative',
      description: 'Requieren revisión'
    },
    {
      label: 'Tasa Recepción',
      value: '94.2%',
      icon: TrendingUp,
      iconColor: 'primary',
      change: '+2.1%',
      changeType: 'positive',
      description: 'vs mes anterior'
    }
  ];

  return (
    <StatsGrid
      stats={stats}
      columns={4}
      variant="default"
    />
  );
}
```

---

### 1.3 FilterCard

**Propósito:** Card para filtros de búsqueda con buscador principal y filtros avanzados colapsables.

**Modos:**
- **Colapsable**: Buscador + botón "Filtros" que expande/colapsa filtros avanzados
- **Siempre visible**: Filtros siempre mostrados

**Props:**
```typescript
interface FilterCardProps {
  searchPlaceholder?: string;       // Placeholder del buscador
  searchValue?: string;             // Valor del buscador
  onSearchChange?: (value: string) => void;
  collapsible?: boolean;            // ¿Es colapsable? (default: false)
  defaultExpanded?: boolean;        // ¿Expandido por defecto?
  children?: ReactNode;             // Filtros dentro
  activeFiltersCount?: number;      // Badge de filtros activos
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;       // ¿Mostrar botón limpiar?
  title?: string;                   // Título (modo no colapsable)
  className?: string;
}

interface FilterGridProps {
  children: ReactNode;
  columns?: 3 | 4 | 5 | 6;          // Columnas en desktop
  className?: string;
}
```

**Estructura Visual (Colapsable):**
```
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Buscar...]         [Filtros (3)] [X]                   │
├─────────────────────────────────────────────────────────────┤
│ [Filtro 1] [Filtro 2] [Filtro 3] [Filtro 4]                │
└─────────────────────────────────────────────────────────────┘
```

**Estructura Visual (Siempre visible):**
```
┌─────────────────────────────────────────────────────────────┐
│ Filtros                                  [Limpiar Filtros]  │
├─────────────────────────────────────────────────────────────┤
│ [Filtro 1] [Filtro 2] [Filtro 3] [Filtro 4]                │
└─────────────────────────────────────────────────────────────┘
```

**Ejemplo para módulo de Recepción:**
```tsx
import {
  FilterCard,
  FilterGrid
} from '@/components/layout';
import { Input, Select } from '@/components/forms';
import { useState } from 'react';

function RecepcionFilters() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    estado: '',
    proveedor: '',
    materia_prima: '',
    fecha_desde: '',
  });

  const activeFiltersCount = Object.values(filters).filter(v => v).length;
  const hasActiveFilters = activeFiltersCount > 0;

  const handleClearFilters = () => {
    setSearch('');
    setFilters({
      estado: '',
      proveedor: '',
      materia_prima: '',
      fecha_desde: '',
    });
  };

  return (
    <FilterCard
      collapsible
      searchPlaceholder="Buscar por número de recepción, proveedor..."
      searchValue={search}
      onSearchChange={setSearch}
      activeFiltersCount={activeFiltersCount}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
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
          value={filters.proveedor}
          onChange={(e) => setFilters({...filters, proveedor: e.target.value})}
          options={[
            // Cargar dinámicamente
          ]}
        />
        <Select
          label="Materia Prima"
          placeholder="Todas"
          value={filters.materia_prima}
          onChange={(e) => setFilters({...filters, materia_prima: e.target.value})}
          options={[
            // Cargar dinámicamente
          ]}
        />
        <Input
          label="Desde"
          type="date"
          value={filters.fecha_desde}
          onChange={(e) => setFilters({...filters, fecha_desde: e.target.value})}
        />
      </FilterGrid>
    </FilterCard>
  );
}
```

---

### 1.4 DataTableCard

**Propósito:** Wrapper para tablas de datos con paginación integrada.

**Props:**
```typescript
interface DataTableCardProps {
  children: ReactNode;              // Contenido de la tabla
  pagination?: PaginationInfo;      // Información de paginación
  title?: string;                   // Título de la sección
  headerActions?: ReactNode;        // Acciones en header (exportar, etc.)
  isLoading?: boolean;
  emptyMessage?: string;            // Mensaje cuando no hay datos
  isEmpty?: boolean;
  className?: string;
}

interface PaginationInfo {
  currentPage: number;              // Página actual (1-indexed)
  pageSize: number;                 // Tamaño de página
  totalItems: number;               // Total de items
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPageChange: (page: number) => void;
}
```

**Estructura Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│ Título Opcional                         [Header Actions]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        TABLA                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Mostrando 1 - 10 de 100            [Anterior] [Siguiente]  │
└─────────────────────────────────────────────────────────────┘
```

**Ejemplo para módulo de Recepción:**
```tsx
import { DataTableCard } from '@/components/layout';
import { useState } from 'react';

function RecepcionTable({ data, total }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  return (
    <DataTableCard
      title="Recepción de Materias Primas"
      pagination={{
        currentPage: page,
        pageSize: pageSize,
        totalItems: total,
        hasNext: page * pageSize < total,
        hasPrevious: page > 1,
        onPageChange: setPage,
      }}
      headerActions={
        <Button variant="outline" size="sm">
          Exportar CSV
        </Button>
      }
    >
      <table className="w-full">
        {/* Contenido de tabla */}
      </table>
    </DataTableCard>
  );
}
```

---

### 1.5 PageTabs

**Propósito:** Tabs para navegación dentro de una página.

**Props:**
```typescript
interface PageTabsProps {
  tabs: TabItem[];                  // Array de tabs
  activeTab: string;                // ID del tab activo
  onTabChange: (tabId: string) => void;
  className?: string;
}

interface TabItem {
  id: string;                       // Identificador único
  label: string;                    // Etiqueta
  icon?: LucideIcon;                // Icono opcional
  badge?: string | number;          // Badge/contador
}
```

**Estructura Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│ [🏭 Tab 1]  [🚛 Tab 2]  [📦 Tab 3]                         │
└─────────────────────────────────────────────────────────────┘
```

**Ejemplo para módulo de Recepción:**
```tsx
import { PageTabs } from '@/components/layout';
import { Package, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';

function RecepcionWithTabs() {
  const [activeTab, setActiveTab] = useState('pendientes');

  const tabs = [
    { id: 'pendientes', label: 'Pendientes', icon: Clock, badge: 24 },
    { id: 'en_proceso', label: 'En Proceso', icon: Package, badge: 8 },
    { id: 'completadas', label: 'Completadas', icon: CheckCircle2, badge: 156 },
    { id: 'rechazadas', label: 'Rechazadas', icon: AlertCircle, badge: 3 },
  ];

  return (
    <>
      <PageHeader
        title="Recepción de Materias Primas"
        tabs={<PageTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />}
      />

      {activeTab === 'pendientes' && <PendientesContent />}
      {activeTab === 'en_proceso' && <EnProcesoContent />}
      {/* ... */}
    </>
  );
}
```

---

## 2. COMPONENTES COMUNES (Básicos)

Ubicación: `c:\Proyectos\StrateKaz\frontend\src\components\common\`

### 2.1 Button

**Propósito:** Botón reutilizable con variantes, tamaños e iconos.

**Props:**
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;              // Muestra spinner
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Variantes Visuales:**
```
Primary:    [🔧 Acción Principal]     (Azul)
Secondary:  [Acción Secundaria]       (Gris)
Danger:     [Eliminar]                (Rojo)
Ghost:      Texto Plano               (Sin fondo)
Outline:    [Acción Alternativa]      (Borde)
```

**Ejemplos para Recepción:**
```tsx
import { Button } from '@/components/common/Button';
import { Plus, Edit2, Trash2, Download } from 'lucide-react';

// Crear nueva recepción
<Button
  variant="primary"
  size="md"
  leftIcon={<Plus className="h-4 w-4" />}
>
  Nueva Recepción
</Button>

// Editar
<Button
  variant="secondary"
  size="sm"
  leftIcon={<Edit2 className="h-4 w-4" />}
>
  Editar
</Button>

// Eliminar
<Button
  variant="danger"
  size="sm"
  leftIcon={<Trash2 className="h-4 w-4" />}
  onClick={handleDelete}
>
  Eliminar
</Button>

// Loading state
<Button
  variant="primary"
  isLoading={isSubmitting}
>
  Guardando...
</Button>

// Exportar
<Button
  variant="outline"
  rightIcon={<Download className="h-4 w-4" />}
>
  Exportar
</Button>
```

---

### 2.2 Badge

**Propósito:** Badges para estados, categorías y etiquetas.

**Props:**
```typescript
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}
```

**Variantes Visuales:**
```
Primary:    Información general    (Azul)
Success:    Estado completado      (Verde)
Warning:    Advertencia/Pendiente  (Amarillo)
Danger:     Error/Rechazado        (Rojo)
Info:       Informativo            (Celeste)
Gray:       Neutral/Inactivo       (Gris)
```

**Ejemplos para Recepción:**
```tsx
import { Badge } from '@/components/common/Badge';

<Badge variant="warning" size="md">Pendiente</Badge>
<Badge variant="success" size="md">Completada</Badge>
<Badge variant="danger" size="md">Rechazada</Badge>
<Badge variant="primary" size="sm">EN LÍNEA</Badge>
<Badge variant="gray" size="md">Inactivo</Badge>
```

---

### 2.3 Card

**Propósito:** Card/contenedor reutilizable.

**Props:**
```typescript
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
```

**Variantes:**
```
default:  Blanco con sombra ligera
bordered: Blanco con borde
elevated: Blanco con sombra acentuada
```

**Paddings:**
```
none: Sin padding
sm:   p-4 (16px)
md:   p-6 (24px, default)
lg:   p-8 (32px)
```

**Ejemplos para Recepción:**
```tsx
import { Card } from '@/components/common/Card';

// Card simple
<Card>
  <h3 className="font-semibold mb-2">Información de Recepción</h3>
  <p className="text-gray-600">Detalles del lote recibido</p>
</Card>

// Card con borde
<Card variant="bordered" padding="sm">
  <div className="flex items-center justify-between">
    <span>Número de Recepción</span>
    <span className="font-bold">REC-2024-001</span>
  </div>
</Card>

// Card elevada
<Card variant="elevated" padding="lg">
  <h3 className="text-lg font-bold mb-4">Resumen de Recepción</h3>
  {/* Contenido */}
</Card>
```

---

### 2.4 Modal

**Propósito:** Modal/diálogo para formularios y confirmaciones.

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  showCloseButton?: boolean;
}
```

**Tamaños:**
```
sm:   max-width: 384px
md:   max-width: 448px (default)
lg:   max-width: 512px
xl:   max-width: 640px
2xl:  max-width: 768px
3xl:  max-width: 896px
4xl:  max-width: 1024px
```

**Ejemplos para Recepción:**
```tsx
import { Modal } from '@/components/common/Modal';
import { useState } from 'react';

function RecepcionForm() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Nueva Recepción
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Nueva Recepción de Materia Prima"
        size="2xl"
        showCloseButton
      >
        <form className="space-y-4">
          <Input
            label="Número de Recepción"
            placeholder="Auto-generado"
            disabled
          />
          <Select
            label="Proveedor"
            options={proveedores}
            placeholder="Selecciona proveedor"
          />
          <Select
            label="Materia Prima"
            options={materias}
            placeholder="Selecciona materia prima"
          />
          {/* Más campos */}

          <div className="flex gap-2 justify-end mt-6">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Crear Recepción
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
```

---

### 2.5 Spinner

**Propósito:** Indicador de carga.

**Props:**
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Ejemplo:**
```tsx
import { Spinner } from '@/components/common/Spinner';

<div className="flex justify-center p-8">
  <Spinner size="md" />
</div>
```

---

## 3. COMPONENTES DE FORMULARIO

Ubicación: `c:\Proyectos\StrateKaz\frontend\src\components\forms\`

### 3.1 Input

**Propósito:** Input de texto reutilizable.

**Props:**
```typescript
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Ejemplos para Recepción:**
```tsx
import { Input } from '@/components/forms/Input';
import { Calendar, Barcode } from 'lucide-react';

<Input
  label="Número de Recepción"
  placeholder="REC-2024-001"
  disabled
  value={numeroRecepcion}
/>

<Input
  label="Código de Lote"
  placeholder="Escanea o ingresa código"
  leftIcon={<Barcode className="h-4 w-4" />}
  value={codigoLote}
  onChange={(e) => setCodigoLote(e.target.value)}
/>

<Input
  label="Fecha de Recepción"
  type="date"
  value={fecha}
  onChange={(e) => setFecha(e.target.value)}
  error={errors.fecha}
/>

<Input
  label="Cantidad (Kg)"
  type="number"
  placeholder="0.00"
  value={cantidad}
  onChange={(e) => setCantidad(e.target.value)}
  helperText="Peso neto en kilogramos"
  error={errors.cantidad}
/>

// Con error
<Input
  label="Observaciones"
  value={obs}
  onChange={(e) => setObs(e.target.value)}
  error="Las observaciones son requeridas"
/>
```

---

### 3.2 Select

**Propósito:** Select dropdown reutilizable.

**Props:**
```typescript
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

interface SelectOption {
  value: string | number;
  label: string;
}
```

**Ejemplos para Recepción:**
```tsx
import { Select } from '@/components/forms/Select';

<Select
  label="Estado de Recepción"
  value={estado}
  onChange={(e) => setEstado(e.target.value)}
  options={[
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_recepcion', label: 'En Recepción' },
    { value: 'completada', label: 'Completada' },
    { value: 'rechazada', label: 'Rechazada' },
  ]}
  placeholder="Selecciona estado"
/>

<Select
  label="Unidad de Medida"
  value={unidad}
  onChange={(e) => setUnidad(e.target.value)}
  options={[
    { value: 'kg', label: 'Kilogramos' },
    { value: 'lb', label: 'Libras' },
    { value: 'ton', label: 'Toneladas' },
    { value: 'unid', label: 'Unidades' },
  ]}
  error={errors.unidad}
/>

<Select
  label="Calidad"
  value={calidad}
  onChange={(e) => setCalidad(e.target.value)}
  options={[
    { value: 'premium', label: 'Premium' },
    { value: 'standar', label: 'Estándar' },
    { value: 'baja', label: 'Baja' },
  ]}
  helperText="Clasificación de calidad"
/>
```

---

## 4. COMPONENTES ESPECÍFICOS (Reutilizables para Recepción)

Ubicación: `c:\Proyectos\StrateKaz\frontend\src\components\`

### 4.1 ProveedorStatusBadge

Un ejemplo de componente específico que puedes adaptar para Recepción:

```tsx
// c:\Proyectos\StrateKaz\frontend\src\components\proveedores\ProveedorStatusBadge.tsx
import { Badge } from '@/components/common/Badge';

interface ProveedorStatusBadgeProps {
  isActive: boolean;
}

export const ProveedorStatusBadge = ({ isActive }: ProveedorStatusBadgeProps) => {
  return isActive ? (
    <Badge variant="success">Activo</Badge>
  ) : (
    <Badge variant="gray">Inactivo</Badge>
  );
};
```

**Puedes crear componentes similares para Recepción:**

```tsx
// frontend/src/components/recepcion/RecepcionStatusBadge.tsx
import { Badge } from '@/components/common/Badge';

interface RecepcionStatusBadgeProps {
  status: 'pendiente' | 'en_recepcion' | 'completada' | 'rechazada';
}

export const RecepcionStatusBadge = ({ status }: RecepcionStatusBadgeProps) => {
  const variants = {
    pendiente: 'warning',
    en_recepcion: 'primary',
    completada: 'success',
    rechazada: 'danger',
  } as const;

  const labels = {
    pendiente: 'Pendiente',
    en_recepcion: 'En Recepción',
    completada: 'Completada',
    rechazada: 'Rechazada',
  };

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
};
```

---

## 5. ESTRUCTURA COMPLETA DE PÁGINA (Ejemplo Recepción)

**Ubicación:** `frontend/src/features/recepcion/pages/RecepcionPage.tsx`

```tsx
import { useState, useMemo } from 'react';
import { Plus, Download, FileText } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import {
  PageHeader,
  FilterCard,
  FilterGrid,
  StatsGrid,
  DataTableCard,
  PageTabs,
} from '@/components/layout';
import { RecepcionTable } from '../components/RecepcionTable';
import { RecepcionForm } from '../components/RecepcionForm';
import { useRecepcion } from '../hooks/useRecepcion';

export default function RecepcionPage() {
  // Estados de filtros
  const [filters, setFilters] = useState({
    search: '',
    estado: '',
    proveedor: '',
    materia_prima: '',
    fecha_desde: '',
    fecha_hasta: '',
    page: 1,
    page_size: 10,
  });

  const [activeTab, setActiveTab] = useState('todas');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Obtener datos
  const { data: recepcionData, isLoading } = useRecepcion(filters);
  const recepcion = recepcionData?.data || [];
  const total = recepcionData?.meta?.total || 0;

  // Calcular estadísticas
  const stats = useMemo(() => [
    {
      label: 'Pendientes',
      value: recepcion.filter(r => r.estado === 'pendiente').length,
      icon: Package,
      iconColor: 'warning',
      description: 'Por procesar'
    },
    {
      label: 'En Recepción',
      value: recepcion.filter(r => r.estado === 'en_recepcion').length,
      icon: Package,
      iconColor: 'primary',
      description: 'En progreso'
    },
    {
      label: 'Completadas',
      value: recepcion.filter(r => r.estado === 'completada').length,
      icon: CheckCircle2,
      iconColor: 'success',
      description: 'Procesadas'
    },
    {
      label: 'Rechazadas',
      value: recepcion.filter(r => r.estado === 'rechazada').length,
      icon: AlertCircle,
      iconColor: 'danger',
      description: 'Con problemas'
    }
  ], [recepcion]);

  // Tabs
  const tabs = [
    { id: 'todas', label: 'Todas', badge: total },
    { id: 'pendientes', label: 'Pendientes', badge: stats[0].value },
    { id: 'en_proceso', label: 'En Proceso', badge: stats[1].value },
    { id: 'completadas', label: 'Completadas', badge: stats[2].value },
  ];

  // Filtrar datos según tab
  const filteredData = useMemo(() => {
    if (activeTab === 'todas') return recepcion;
    if (activeTab === 'pendientes') return recepcion.filter(r => r.estado === 'pendiente');
    if (activeTab === 'en_proceso') return recepcion.filter(r => r.estado === 'en_recepcion');
    if (activeTab === 'completadas') return recepcion.filter(r => r.estado === 'completada');
    return recepcion;
  }, [activeTab, recepcion]);

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <PageHeader
        title="Recepción de Materias Primas"
        description="Gestione la recepción, validación y almacenamiento de materias primas"
        badges={[
          { label: `${total} Total`, variant: 'primary' },
          { label: 'ACTIVO', variant: 'success' }
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Download className="h-4 w-4" />}
            >
              Exportar
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsFormOpen(true)}
            >
              Nueva Recepción
            </Button>
          </div>
        }
        tabs={
          <PageTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
      />

      {/* Estadísticas */}
      <StatsGrid
        stats={stats}
        columns={4}
        variant="default"
      />

      {/* Filtros */}
      <FilterCard
        collapsible
        searchPlaceholder="Buscar por número, proveedor..."
        searchValue={filters.search}
        onSearchChange={(value) => setFilters({...filters, search: value, page: 1})}
        activeFiltersCount={[
          filters.estado,
          filters.proveedor,
          filters.materia_prima,
          filters.fecha_desde,
        ].filter(Boolean).length}
        hasActiveFilters={[filters.estado, filters.proveedor, filters.materia_prima, filters.fecha_desde].some(Boolean)}
        onClearFilters={() => setFilters({
          search: '',
          estado: '',
          proveedor: '',
          materia_prima: '',
          fecha_desde: '',
          fecha_hasta: '',
          page: 1,
          page_size: 10,
        })}
      >
        <FilterGrid columns={4}>
          <Select
            label="Estado"
            placeholder="Todos"
            value={filters.estado}
            onChange={(e) => setFilters({...filters, estado: e.target.value, page: 1})}
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
            value={filters.proveedor}
            onChange={(e) => setFilters({...filters, proveedor: e.target.value, page: 1})}
            options={[
              // Cargar desde API
            ]}
          />
          <Select
            label="Materia Prima"
            placeholder="Todas"
            value={filters.materia_prima}
            onChange={(e) => setFilters({...filters, materia_prima: e.target.value, page: 1})}
            options={[
              // Cargar desde API
            ]}
          />
          <Input
            label="Desde"
            type="date"
            value={filters.fecha_desde}
            onChange={(e) => setFilters({...filters, fecha_desde: e.target.value, page: 1})}
          />
        </FilterGrid>
      </FilterCard>

      {/* Tabla de datos */}
      <DataTableCard
        title="Recepciones"
        pagination={{
          currentPage: filters.page,
          pageSize: filters.page_size,
          totalItems: total,
          hasNext: filters.page * filters.page_size < total,
          hasPrevious: filters.page > 1,
          onPageChange: (page) => setFilters({...filters, page}),
        }}
        isLoading={isLoading}
        isEmpty={filteredData.length === 0}
        emptyMessage="No hay recepciones para mostrar"
        headerActions={
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
        }
      >
        <RecepcionTable data={filteredData} isLoading={isLoading} />
      </DataTableCard>

      {/* Modal de formulario */}
      <RecepcionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}
```

---

## 6. PATRONES DE IMPORTACIÓN

**Forma correcta de importar componentes:**

```tsx
// Layout components
import {
  PageHeader,
  FilterCard,
  FilterGrid,
  StatsGrid,
  DataTableCard,
  PageTabs,
} from '@/components/layout';

// Common components
import {
  Button,
  Badge,
  Card,
  Modal,
  Spinner,
} from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';

// Form components
import {
  Input,
  Select,
} from '@/components/forms';

// Specific components
import { RecepcionStatusBadge } from '@/components/recepcion';
```

---

## 7. COLORES Y VARIANTES

### Colors System
```typescript
primary:  Azul (Principal/Acción)
secondary: Gris (Secundaria)
success:  Verde (Completado/Éxito)
warning:  Amarillo (Advertencia/Pendiente)
danger:   Rojo (Error/Peligro)
info:     Celeste (Información)
gray:     Gris (Neutral)
```

### Dark Mode
Todos los componentes soportan automáticamente dark mode a través de Tailwind.

---

## 8. RESPONSIVE DESIGN

Los componentes están optimizados para ser responsive:

```
Mobile:  1 columna
Tablet:  2 columnas
Desktop: 3-4 columnas
```

**Ejemplo en StatsGrid:**
```tsx
<StatsGrid
  stats={stats}
  columns={4}  // En desktop mostrará 4 columnas
                // En tablet mostrará 2
                // En mobile mostrará 1
/>
```

---

## 9. CHECKLIST PARA MÓDULO DE RECEPCIÓN

Para crear el módulo de Recepción usando este design system, necesitarás:

- [ ] PageHeader con título y acciones (Nueva Recepción, Exportar)
- [ ] StatsGrid con KPIs (Pendientes, En Proceso, Completadas, Rechazadas)
- [ ] FilterCard colapsable con filtros (Estado, Proveedor, Materia Prima, Fecha)
- [ ] PageTabs para diferentes vistas/estados
- [ ] DataTableCard con tabla de recepciones
- [ ] Modal para crear/editar recepciones
- [ ] Modal para confirmaciones (¿Rechazar recepción?)
- [ ] Componente RecepcionStatusBadge (Status badge específico)
- [ ] Componente RecepcionTable (Tabla de recepciones)
- [ ] Componente RecepcionForm (Formulario de recepción)
- [ ] Componente RecepcionDetailModal (Detalles de recepción)

---

## 10. REFERENCIAS Y EJEMPLOS

- **ProveedoresPage:** `frontend/src/features/proveedores/pages/ProveedoresPage.tsx`
- **Layout Components:** `frontend/src/components/layout/index.ts`
- **Common Components:** `frontend/src/components/common/`
- **Form Components:** `frontend/src/components/forms/`

Consulta estas carpetas para ver implementaciones reales y patrones establecidos.
