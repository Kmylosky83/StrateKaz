# Sistema de Componentes de Layout

Este documento describe los componentes de layout reutilizables para estructurar páginas de manera consistente en el sistema.

## Ubicación

```
frontend/src/components/layout/
├── index.ts           # Exportaciones
├── PageHeader.tsx     # Header de página con secciones inline
├── PageTabs.tsx       # Tabs de navegación (legacy)
├── FilterCard.tsx     # Card de filtros
├── StatsGrid.tsx      # Grid de estadísticas
└── DataTableCard.tsx  # Wrapper de tabla con paginación

frontend/src/hooks/
├── usePageSections.ts # Hook para gestión local de secciones

frontend/src/utils/
├── moduleColors.ts    # Design System centralizado de colores
```

## Arquitectura de Layout (v2.4.0)

### Separación Header Principal vs PageHeader

La arquitectura de layout se divide en dos niveles:

```
┌─────────────────────────────────────────────────────────────────┐
│ Header Principal (layouts/Header.tsx) - h-16 fixed             │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ [≡] [Logo] Empresa         [🔍] [🔔] [🌙] │ [Avatar ▼]   │  │
│ └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ Contenido de Página                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PageHeader - Secciones alineadas a la derecha              │ │
│ │ ┌─────────────────────────┬───────────────────────────────┐│ │
│ │ │ Título                  │ ┌─────────────────────────┐   ││ │
│ │ │ Descripción dinámica    │ │ [Sec1] [Sec2] [Sec3]   │   ││ │
│ │ │                         │ └─────────────────────────┘   ││ │
│ │ └─────────────────────────┴───────────────────────────────┘│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Contenido de la sección activa                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Principios de Diseño

1. **Header Principal Simplificado**: Solo marca + acciones globales
   - ZONA A: Menu toggle + Logo + Nombre empresa (sin límite de ancho)
   - ZONA B: Búsqueda global + Notificaciones + Tema + Usuario

2. **PageHeader con Secciones Inline**: Cada página gestiona sus tabs
   - Título y descripción a la izquierda
   - Secciones en contenedor profesional a la derecha
   - Colores desde Design System centralizado (moduleColors.ts)

3. **Gestión de Estado Local**: Cada página maneja sus secciones
   - Hook `usePageSections` para estado local
   - Sin dependencia de HeaderContext para tabs
   - Navegación sin recarga de página

## Estructura Estándar de Página (Nueva)

```
┌─────────────────────────────────────────────────────────────────┐
│ PageHeader                                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Título                                                      │ │
│ │ Descripción (dinámica)      ┌─────────────────────────────┐│ │
│ │                             │ [📊 Sec1] [⚙️ Sec2] [📁 Sec3] ││ │
│ │                             └─────────────────────────────┘│ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ StatsGrid (opcional)                                            │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│ │   Stat 1  │ │   Stat 2  │ │   Stat 3  │ │   Stat 4  │        │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘        │
├─────────────────────────────────────────────────────────────────┤
│ FilterCard                                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [🔍 Buscar...] [Filtros (3)] [X]     (modo colapsable)     │ │
│ │ ─────────────────────────────────────────────────────────── │ │
│ │ [Filtro 1] [Filtro 2] [Filtro 3] [Filtro 4]                │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ DataTableCard                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                         TABLA                               │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ Mostrando 1-10 de 100            [Anterior] [Siguiente]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componentes

### 1. PageHeader (v2.4.0 - Con Secciones Inline)

Header de página con secciones/tabs inline alineadas a la derecha.

```tsx
import { PageHeader } from '@/components/layout';
import { usePageSections } from '@/hooks/usePageSections';

// Hook para gestionar secciones localmente
const { sections, activeSection, setActiveSection, activeSectionData, isLoading } = usePageSections({
  moduleCode: 'gestion_estrategica',
  tabCode: 'configuracion',
});

<PageHeader
  title="Configuración"
  description={activeSectionData?.description || 'Gestión de configuración'}
  sections={sections}
  activeSection={activeSection}
  onSectionChange={setActiveSection}
  moduleColor="purple"  // Del Design System
  actions={<Button onClick={...}>Nueva Acción</Button>}
/>
```

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `title` | `string` | Título principal (requerido) |
| `description` | `string` | Subtítulo/descripción (puede ser dinámico) |
| `sections` | `TabSection[]` | Secciones desde API |
| `activeSection` | `string` | Código de sección activa |
| `onSectionChange` | `(code: string) => void` | Callback de cambio |
| `moduleColor` | `ModuleColor` | Color del módulo (Design System) |
| `actions` | `ReactNode` | Botones de acción |
| `controls` | `ReactNode` | Controles adicionales |
| `tabs` | `ReactNode` | Legacy: tabs como ReactNode |
| `className` | `string` | Clases adicionales |

**Colores de Módulo (moduleColor):**
- `purple` - Gestión Estratégica
- `teal` - Motor de Operaciones
- `orange` - Gestión Integral
- `blue` - Gestión Misional
- `green` - Procesos de Apoyo
- `indigo`, `red`, `yellow`, `pink`, `gray`

---

### 2. usePageSections (Hook)

Hook para gestión local de secciones sin depender de HeaderContext.

```tsx
import { usePageSections } from '@/hooks/usePageSections';

const {
  sections,          // TabSection[] - secciones habilitadas
  activeSection,     // string - código de sección activa
  setActiveSection,  // (code: string) => void - cambiar sección
  activeSectionData, // TabSection | null - datos de sección activa
  isLoading,         // boolean - estado de carga
} = usePageSections({
  moduleCode: 'gestion_estrategica',  // Código del módulo
  tabCode: 'configuracion',           // Código del tab
  initialSection: 'empresa',          // Opcional: sección inicial
});
```

**Opciones:**
| Opción | Tipo | Descripción |
|--------|------|-------------|
| `moduleCode` | `string` | Código del módulo padre |
| `tabCode` | `string` | Código del tab |
| `initialSection` | `string` | Sección inicial (opcional) |

**Ventajas:**
- Estado local: no afecta otros componentes
- Navegación sin recarga de página
- Descripción dinámica según sección activa
- Soporte para módulos dinámicos desde API

---

### 3. PageTabs (Legacy)

> **Nota:** Este componente está deprecated. Usar `sections` prop de PageHeader.

Componente de tabs para navegación dentro de una página.

```tsx
import { PageTabs } from '@/components/layout';

const tabs = [
  { id: 'externos', label: 'Proveedores Externos', icon: Truck },
  { id: 'internos', label: 'Unidades Internas', icon: Factory },
];

<PageTabs
  tabs={tabs}
  activeTab="externos"
  onTabChange={(tabId) => setActiveTab(tabId)}
/>
```

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `tabs` | `TabItem[]` | Array de tabs |
| `activeTab` | `string` | ID del tab activo |
| `onTabChange` | `(tabId: string) => void` | Callback de cambio |

---

### 3. FilterCard

Card de filtros con dos modos: siempre visible o colapsable.

#### Modo Siempre Visible (por defecto)

```tsx
import { FilterCard, FilterGrid } from '@/components/layout';

<FilterCard
  title="Filtros"
  onClearFilters={handleClear}
>
  <FilterGrid columns={4}>
    <Input label="Buscar" ... />
    <Select label="Estado" ... />
    <Select label="Tipo" ... />
    <Input label="Ciudad" ... />
  </FilterGrid>
</FilterCard>
```

#### Modo Colapsable

```tsx
<FilterCard
  collapsible
  defaultExpanded={false}
  searchPlaceholder="Buscar por nombre..."
  searchValue={search}
  onSearchChange={setSearch}
  activeFiltersCount={3}
  hasActiveFilters={true}
  onClearFilters={handleClear}
>
  <FilterGrid columns={3}>
    <Select label="Estado" ... />
    <Select label="Tipo" ... />
    <DatePicker label="Fecha" ... />
  </FilterGrid>
</FilterCard>
```

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `collapsible` | `boolean` | Si es colapsable (default: false) |
| `defaultExpanded` | `boolean` | Expandido inicialmente |
| `searchPlaceholder` | `string` | Placeholder del buscador |
| `searchValue` | `string` | Valor del buscador |
| `onSearchChange` | `(value: string) => void` | Callback de búsqueda |
| `activeFiltersCount` | `number` | Número para badge |
| `hasActiveFilters` | `boolean` | Si mostrar botón limpiar |
| `onClearFilters` | `() => void` | Callback para limpiar |
| `title` | `string` | Título (modo no colapsable) |

---

### 4. StatsGrid

Grid de cards de estadísticas/métricas.

```tsx
import { StatsGrid } from '@/components/layout';
import { Package, Clock, Truck, DollarSign } from 'lucide-react';

<StatsGrid
  columns={4}
  stats={[
    {
      label: 'Total Programaciones',
      value: 150,
      icon: Package,
      iconColor: 'primary',
    },
    {
      label: 'Pendientes',
      value: 25,
      icon: Clock,
      iconColor: 'warning',
      change: '+5',
      changeType: 'negative',
      description: 'vs. ayer',
    },
    {
      label: 'En Ruta',
      value: 12,
      icon: Truck,
      iconColor: 'info',
    },
    {
      label: 'Valor Total',
      value: '$1,250,000',
      icon: DollarSign,
      iconColor: 'success',
      change: '+12%',
      changeType: 'positive',
    },
  ]}
/>
```

**Props de StatItem:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `label` | `string` | Etiqueta de la métrica |
| `value` | `string \| number` | Valor a mostrar |
| `icon` | `LucideIcon` | Icono de Lucide |
| `iconColor` | `string` | Color: primary, success, warning, danger, info, gray |
| `change` | `string` | Cambio (ej: "+12%") |
| `changeType` | `string` | positive, negative, neutral |
| `description` | `string` | Descripción adicional |

**Variantes:**
- `default` - Tamaño completo con icono grande y métricas detalladas
- `compact` - Versión compacta con layout horizontal

**Mejoras Visuales y UX:**

El componente StatsGrid incluye efectos visuales avanzados que mejoran la percepción de calidad y la experiencia del usuario:

1. **Sombra Sutil (shadow-sm)**
   - Proporciona profundidad y jerarquía visual
   - Mejora la separación entre cards y el fondo
   - Compatible con dark mode usando opacidades ajustadas

2. **Efecto Hover Interactivo**
   - Sombra más pronunciada (hover:shadow-md) al pasar el cursor
   - Elevación de 2px (hover:-translate-y-0.5) para reforzar interactividad
   - Transición suave de 200ms (transition-all duration-200)
   - Cursor default para indicar que es informativo, no clickeable

3. **Bordes Sutiles**
   - Border con opacidad reducida (border-gray-200/60)
   - Optimizado para dark mode (dark:border-gray-700/60)
   - Mantiene la definición sin sobrecargar visualmente

4. **Optimización Dark Mode**
   - Contraste de colores ajustado para cumplir WCAG 2.1 AA
   - Sombras adaptadas a fondos oscuros
   - Íconos con colores específicos para dark mode

**Principios UX Aplicados:**
- **Affordance Visual**: Las sombras y hover sugieren que los elementos tienen peso y presencia
- **Feedback Inmediato**: La transición suave comunica que el sistema responde
- **Microinteracciones**: Pequeños detalles que elevan la percepción de calidad
- **Consistencia**: Mismo tratamiento en ambas variantes (default y compact)

**Consideraciones de Rendimiento:**
- Transiciones CSS optimizadas (solo transform y box-shadow)
- No se usa JavaScript para los efectos
- Hardware-accelerated transforms para 60fps

---

### 5. DataTableCard

Wrapper para tablas con paginación integrada.

```tsx
import { DataTableCard } from '@/components/layout';

<DataTableCard
  title="Listado de Proveedores"  // Opcional
  headerActions={<Button>Exportar</Button>}  // Opcional
  pagination={{
    currentPage: 1,
    pageSize: 10,
    totalItems: 150,
    hasPrevious: false,
    hasNext: true,
    onPageChange: (page) => setPage(page),
  }}
  isEmpty={data.length === 0}
  isLoading={isLoading}
  emptyMessage="No se encontraron registros"
>
  <MyTable data={data} onEdit={...} onDelete={...} />
</DataTableCard>
```

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `children` | `ReactNode` | Componente de tabla |
| `title` | `string` | Título opcional |
| `headerActions` | `ReactNode` | Acciones de header |
| `pagination` | `PaginationInfo` | Configuración de paginación |
| `isEmpty` | `boolean` | Si no hay datos |
| `isLoading` | `boolean` | Estado de carga |
| `emptyMessage` | `string` | Mensaje cuando vacío |

---

## Ejemplo Completo

```tsx
import { useState, useMemo } from 'react';
import { UserPlus, Search, Package, Clock, Truck, DollarSign } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import {
  PageHeader,
  PageTabs,
  StatsGrid,
  FilterCard,
  FilterGrid,
  DataTableCard,
} from '@/components/layout';
import { MyTable } from './components/MyTable';
import { useMyData } from './hooks/useMyData';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const { data, isLoading, stats } = useMyData(filters);

  const tabs = [
    { id: 'all', label: 'Todos', badge: stats.total },
    { id: 'pending', label: 'Pendientes', icon: Clock },
    { id: 'completed', label: 'Completados', icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Gestión de Registros"
        description="Administra todos los registros del sistema"
        badges={[
          { label: `${stats.total} registros`, variant: 'primary' },
        ]}
        actions={<Button leftIcon={<UserPlus />}>Nuevo Registro</Button>}
        tabs={
          <PageTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
      />

      {/* ESTADÍSTICAS */}
      <StatsGrid
        stats={[
          { label: 'Total', value: stats.total, icon: Package, iconColor: 'primary' },
          { label: 'Pendientes', value: stats.pending, icon: Clock, iconColor: 'warning' },
          { label: 'En Proceso', value: stats.inProgress, icon: Truck, iconColor: 'info' },
          { label: 'Completados', value: stats.completed, icon: DollarSign, iconColor: 'success' },
        ]}
      />

      {/* FILTROS */}
      <FilterCard
        collapsible
        searchValue={filters.search}
        onSearchChange={(v) => setFilters(f => ({ ...f, search: v }))}
        activeFiltersCount={filters.status ? 1 : 0}
        hasActiveFilters={!!filters.status}
        onClearFilters={() => setFilters({ search: '', status: '', page: 1 })}
      >
        <FilterGrid columns={3}>
          <Select
            label="Estado"
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
            options={[...]}
          />
        </FilterGrid>
      </FilterCard>

      {/* TABLA */}
      <DataTableCard
        pagination={{
          currentPage: filters.page,
          pageSize: 10,
          totalItems: data.count,
          hasNext: !!data.next,
          hasPrevious: !!data.previous,
          onPageChange: (p) => setFilters(f => ({ ...f, page: p })),
        }}
        isEmpty={data.results.length === 0}
        isLoading={isLoading}
      >
        <MyTable data={data.results} />
      </DataTableCard>
    </div>
  );
}
```

---

## Cuándo Usar Cada Modo de Filtros

### Modo Siempre Visible
- Páginas con pocos filtros (4-5 máximo)
- Filtros que se usan frecuentemente
- Cuando el espacio vertical no es crítico

### Modo Colapsable
- Páginas con muchos filtros (6+)
- Cuando el buscador es el filtro principal
- En vistas móviles donde el espacio es limitado
- Cuando los filtros avanzados se usan ocasionalmente

---

## Migración de Páginas Existentes

Para migrar una página existente al nuevo sistema:

1. Importar componentes de `@/components/layout`
2. Reemplazar header hardcodeado por `<PageHeader />`
3. Reemplazar tabs hardcodeados por `<PageTabs />`
4. Reemplazar cards de estadísticas por `<StatsGrid />`
5. Reemplazar filtros por `<FilterCard />` + `<FilterGrid />`
6. Reemplazar wrapper de tabla por `<DataTableCard />`

### Ejemplo de MateriaPrimaPage

Ver [MateriaPrimaPage.tsx](../frontend/src/features/proveedores/pages/MateriaPrimaPage.tsx) como referencia de implementación.

---

## Sistema de Modales

El sistema de modales proporciona una experiencia consistente para diálogos, formularios y acciones que requieren la atención del usuario.

### Ubicación

```
frontend/src/components/common/Modal.tsx     # Componente base
frontend/src/components/users/DeleteConfirmModal.tsx  # Modal de confirmación
```

### Componente Base: Modal

```tsx
import { Modal } from '@/components/common/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Título del Modal"
  size="lg"
>
  {/* Contenido del modal */}
</Modal>
```

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Control de visibilidad |
| `onClose` | `() => void` | - | Callback al cerrar |
| `title` | `string` | - | Título del modal |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | Tamaño del modal |
| `showCloseButton` | `boolean` | `true` | Mostrar botón X |

**Tamaños:**
- `sm` - max-w-sm (384px) - Confirmaciones simples
- `md` - max-w-md (448px) - Formularios pequeños
- `lg` - max-w-lg (512px) - Formularios medianos
- `xl` - max-w-xl (576px) - Formularios con más campos
- `2xl` - max-w-2xl (672px) - Formularios complejos

---

### Tipos de Modales

#### 1. Modal de Formulario

Para crear/editar entidades. Usa el componente Modal base con formularios internos.

```tsx
// Estructura estándar de modal de formulario
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title={selectedItem ? 'Editar Registro' : 'Nuevo Registro'}
  size="lg"
>
  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Campos del formulario */}
    <Input label="Campo 1" {...register('campo1')} error={errors.campo1?.message} />
    <Select label="Campo 2" {...register('campo2')} options={options} />

    {/* Footer con acciones */}
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <Button type="button" variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button type="submit" isLoading={isLoading}>
        {selectedItem ? 'Actualizar' : 'Crear'}
      </Button>
    </div>
  </form>
</Modal>
```

**Patrones de Formulario:**
- Usar React Hook Form + Zod para validación
- Mostrar errores inline debajo de cada campo
- Botón de submit muestra estado de carga
- Footer con borde superior para separación visual

#### 2. Modal de Confirmación

Para acciones destructivas o que requieren confirmación.

```tsx
import { DeleteConfirmModal } from '@/components/users/DeleteConfirmModal';

<DeleteConfirmModal
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleDelete}
  title="Eliminar Registro"
  message="¿Está seguro de eliminar este registro? Esta acción no se puede deshacer."
  isLoading={isDeleting}
/>
```

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `isOpen` | `boolean` | Control de visibilidad |
| `onClose` | `() => void` | Callback al cerrar |
| `onConfirm` | `() => void` | Callback de confirmación |
| `title` | `string` | Título del modal |
| `message` | `string` | Mensaje de confirmación |
| `isLoading` | `boolean` | Estado de carga |

#### 3. Modal de Detalle

Para mostrar información detallada sin edición.

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Detalle del Registro"
  size="xl"
>
  <div className="space-y-4">
    {/* Secciones de información */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Campo</p>
        <p className="font-medium text-gray-900 dark:text-gray-100">{valor}</p>
      </div>
    </div>

    {/* Acciones opcionales */}
    <div className="flex justify-end gap-3 pt-4 border-t">
      <Button variant="outline" onClick={onClose}>Cerrar</Button>
      <Button onClick={handleEdit}>Editar</Button>
    </div>
  </div>
</Modal>
```

#### 4. Modal de Acción Específica

Para acciones puntuales como cambiar precio, asignar, reprogramar, etc.

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Cambiar Precio"
  size="md"
>
  <div className="space-y-4">
    {/* Información contextual */}
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Proveedor: <span className="font-medium">{proveedor.nombre}</span>
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Precio actual: <span className="font-medium">${precioActual}</span>
      </p>
    </div>

    {/* Campo de acción */}
    <Input
      type="number"
      label="Nuevo Precio"
      value={nuevoPrecio}
      onChange={(e) => setNuevoPrecio(e.target.value)}
    />

    {/* Footer */}
    <div className="flex justify-end gap-3 pt-4 border-t">
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button onClick={handleSubmit} isLoading={isLoading}>
        Cambiar Precio
      </Button>
    </div>
  </div>
</Modal>
```

---

### Estilos y UX

**Animaciones:**
- Fade in/out del backdrop (300ms)
- Scale up del panel (95% → 100%)
- Transiciones suaves usando ease-out/ease-in

**Accesibilidad:**
- Focus trap dentro del modal
- Cierre con tecla Escape
- Cierre al click fuera (backdrop)
- Aria labels apropiados

**Colores y Bordes:**
- Fondo: `bg-white dark:bg-gray-800`
- Borde redondeado: `rounded-2xl`
- Sombra: `shadow-xl`
- Backdrop: `bg-black bg-opacity-50`

**Footer de Acciones:**
```css
/* Patrón estándar */
.modal-footer {
  @apply flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700;
}
```

**Orden de Botones:**
1. Cancelar/Cerrar (izquierda, variant="outline")
2. Acción secundaria (si existe)
3. Acción principal (derecha, variant="primary")

---

### Guía de Selección de Tamaño

| Caso de Uso | Tamaño | Ejemplo |
|-------------|--------|---------|
| Confirmación simple | `sm` | DeleteConfirmModal |
| Formulario 2-4 campos | `md` | CambiarPrecioModal |
| Formulario 5-8 campos | `lg` | ProveedorForm básico |
| Formulario complejo | `xl` | ProveedorForm completo |
| Formulario con tabs | `2xl` | Formularios multi-sección |

---

### Convención de Colores para Iconos en StatsGrid

Para mantener consistencia visual en las métricas, seguir este patrón semántico:

| Color | Uso | Ejemplos |
|-------|-----|----------|
| `gray` | Totales, conteos generales | Total Proveedores, Total Registros |
| `success` | Estados positivos | Activos, Completados, Aprobados |
| `warning` | En proceso, atención | En Proceso, Pendientes de revisión |
| `info` | Información secundaria | Pendientes, Con GPS, Ciudades |
| `primary` | Categorías principales | Proveedores Externos, Tipo específico |
| `danger` | Alertas, negativos | Inactivos, Rechazados, Vencidos |

**Ejemplo de Distribución Estándar:**
```tsx
<StatsGrid
  stats={[
    { label: 'Total', value: 100, icon: Users, iconColor: 'gray' },
    { label: 'Categoría A', value: 60, icon: TypeA, iconColor: 'primary' },
    { label: 'Categoría B', value: 40, icon: TypeB, iconColor: 'info' },
    { label: 'Activos', value: 85, icon: CheckCircle, iconColor: 'success' },
  ]}
/>
```

---

## Design System - Colores de Módulos

El archivo `frontend/src/utils/moduleColors.ts` centraliza todos los colores de módulos para evitar hardcoding.

### Uso

```tsx
import { getModuleColorClasses, type ModuleColor } from '@/utils/moduleColors';

const colors = getModuleColorClasses('purple');

// Usar en componentes
<nav className={cn('rounded-lg border', colors.container)}>
  <button className={isActive ? colors.active : colors.inactive}>
    Tab 1
  </button>
</nav>
```

### Clases Disponibles

| Propiedad | Uso | Ejemplo |
|-----------|-----|---------|
| `container` | Contenedor de tabs (fondo + borde) | `bg-purple-50/50 border-purple-200/50` |
| `active` | Tab/botón activo | `bg-purple-100 text-purple-700` |
| `inactive` | Tab/botón inactivo con hover | `text-gray-600 hover:bg-purple-50` |
| `border` | Borde inferior (variante underline) | `border-purple-500 text-purple-600` |
| `badge` | Badge/indicador | `bg-purple-100 text-purple-700` |
| `text` | Texto del color del módulo | `text-purple-600` |
| `icon` | Icono del color del módulo | `text-purple-500` |

### Mapeo Categoría → Color

| Categoría | Color | Código |
|-----------|-------|--------|
| Dirección Estratégica | Purple | `ESTRATEGICO` |
| Motor de Operaciones | Teal | `MOTOR` |
| Gestión Integral | Orange | `INTEGRAL` |
| Gestión Misional | Blue | `MISIONAL` |
| Procesos de Apoyo | Green | `APOYO` |
| Inteligencia de Negocios | Purple | `INTELIGENCIA` |

---

## Ejemplo Completo de Página (v2.4.0)

```tsx
import { useState } from 'react';
import { Settings, Building, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader, StatsGrid, FilterCard, DataTableCard } from '@/components/layout';
import { usePageSections } from '@/hooks/usePageSections';

const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'configuracion';

export default function ConfiguracionPage() {
  // Gestión local de secciones
  const {
    sections,
    activeSection,
    setActiveSection,
    activeSectionData,
    isLoading: sectionsLoading,
  } = usePageSections({
    moduleCode: MODULE_CODE,
    tabCode: TAB_CODE,
  });

  // Renderizar contenido según sección activa
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'empresa':
        return <EmpresaSection />;
      case 'sedes':
        return <SedesSection />;
      case 'documentos':
        return <DocumentosSection />;
      default:
        return <div>Seleccione una sección</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con secciones inline */}
      <PageHeader
        title="Configuración"
        description={activeSectionData?.description || 'Configuración del sistema'}
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        moduleColor="purple"
      />

      {/* Contenido dinámico según sección */}
      {sectionsLoading ? (
        <div className="animate-pulse h-64 bg-gray-100 rounded-lg" />
      ) : (
        renderSectionContent()
      )}
    </div>
  );
}
```

---

## Migración de Páginas Existentes (v2.4.0)

Para migrar una página al nuevo sistema con secciones inline:

1. **Importar hook usePageSections**
   ```tsx
   import { usePageSections } from '@/hooks/usePageSections';
   ```

2. **Reemplazar gestión de tabs por hook**
   ```tsx
   const { sections, activeSection, setActiveSection, activeSectionData } = usePageSections({
     moduleCode: 'mi_modulo',
     tabCode: 'mi_tab',
   });
   ```

3. **Actualizar PageHeader**
   ```tsx
   <PageHeader
     title="Mi Página"
     description={activeSectionData?.description}
     sections={sections}
     activeSection={activeSection}
     onSectionChange={setActiveSection}
     moduleColor="purple"  // Según categoría del módulo
   />
   ```

4. **Eliminar uso de HeaderContext para tabs** (si aplica)

5. **Usar moduleColors para colores consistentes**
   ```tsx
   import { getModuleColorClasses } from '@/utils/moduleColors';
   const colors = getModuleColorClasses('purple');
   ```
