# Resumen Rápido - Design System Disponible

## Componentes Listos para el Módulo de Recepción

### LAYOUT (Estructuras de Página)
Ubicación: `c:\Proyectos\Grasas y Huesos del Norte\frontend\src\components\layout\`

| Componente | Uso | Ejemplo |
|-----------|-----|---------|
| **PageHeader** | Header de página con título, badges, acciones y tabs | Encabezado principal de Recepción |
| **StatsGrid** | Grid de tarjetas KPI con iconos y cambios | Mostrar: Pendientes, En Proceso, Completadas, Rechazadas |
| **FilterCard** | Filtros colapsables con buscador | Filtrar por estado, proveedor, materia prima |
| **DataTableCard** | Wrapper para tablas con paginación integrada | Listado de recepciones |
| **PageTabs** | Tabs para navegación dentro página | Tabs: Todas, Pendientes, En Proceso, Completadas |

---

### COMPONENTES COMUNES (Básicos)
Ubicación: `c:\Proyectos\Grasas y Huesos del Norte\frontend\src\components\common\`

| Componente | Props Principales | Variantes |
|-----------|-------------------|----------|
| **Button** | variant, size, isLoading, leftIcon, rightIcon | primary, secondary, danger, ghost, outline |
| **Badge** | variant, size | primary, success, warning, danger, info, gray |
| **Card** | variant, padding | default, bordered, elevated |
| **Modal** | isOpen, onClose, title, size | sm, md, lg, xl, 2xl, 3xl, 4xl |
| **Spinner** | size | sm, md, lg |

---

### FORMULARIOS
Ubicación: `c:\Proyectos\Grasas y Huesos del Norte\frontend\src\components\forms\`

| Componente | Uso |
|-----------|-----|
| **Input** | Campos de texto, números, fechas |
| **Select** | Dropdowns (Estado, Proveedor, Materia Prima) |

---

## Ejemplo de Estructura Completa para Recepción

```tsx
<PageHeader
  title="Recepción de Materias Primas"
  badges={[...]}
  actions={<Button>Nueva Recepción</Button>}
  tabs={<PageTabs tabs={[...]} />}
/>

<StatsGrid stats={[
  { label: 'Pendientes', value: 24, icon: Clock },
  { label: 'Completadas', value: 156, icon: CheckCircle2 }
]} />

<FilterCard collapsible>
  <FilterGrid>
    <Select label="Estado" />
    <Select label="Proveedor" />
  </FilterGrid>
</FilterCard>

<DataTableCard pagination={...}>
  <RecepcionTable data={data} />
</DataTableCard>
```

---

## Componentes por Crear para Recepción

- ✅ **RecepcionStatusBadge** - Badge de estado (Pendiente, En Recepción, Completada, Rechazada)
- ✅ **RecepcionTable** - Tabla con acciones (ver, editar, eliminar, rechazar)
- ✅ **RecepcionForm** - Modal formulario crear/editar
- ✅ **RecepcionDetailModal** - Modal detalles
- ✅ **useRecepcion** - Hooks para API

---

## Colores y Variantes Predefinidos

```
Primary:   Azul    (Acciones principales)
Secondary: Gris    (Secundarias)
Success:   Verde   (Completado/Éxito)
Warning:   Amarillo (Advertencia/Pendiente)
Danger:    Rojo    (Error/Rechazo)
Info:      Celeste (Información)
```

---

## Responsive Breakpoints

```
Mobile:   1 columna
Tablet:   2 columnas  (md)
Desktop:  3-4 columnas (lg)
```

---

## Importaciones Típicas

```tsx
// Layout
import {
  PageHeader,
  FilterCard,
  FilterGrid,
  StatsGrid,
  DataTableCard,
  PageTabs,
} from '@/components/layout';

// Common
import {
  Button,
  Badge,
  Card,
  Modal,
  Spinner,
} from '@/components/common/Button'; // o sus imports individuales

// Forms
import { Input, Select } from '@/components/forms';

// Iconos (lucide-react)
import {
  Plus,
  Download,
  Edit2,
  Trash2,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
```

---

## Documentación Completa

Consulta estos archivos:

1. **`docs/COMPONENTES-DESIGN-SYSTEM.md`** - Documentación detallada de cada componente
2. **`docs/EJEMPLO-IMPLEMENTACION-RECEPCION.md`** - Código completo listo para usar

---

## Checklist para Comenzar Recepción

- [ ] Crear carpeta `features/recepcion/`
- [ ] Crear tipos en `recepcion.types.ts`
- [ ] Crear `RecepcionStatusBadge.tsx`
- [ ] Crear `RecepcionTable.tsx`
- [ ] Crear `RecepcionForm.tsx`
- [ ] Crear `useRecepcion.ts` hook
- [ ] Crear `RecepcionPage.tsx` principal
- [ ] Agregar rutas en `routes/index.tsx`
- [ ] Agregar enlace en `Sidebar.tsx`
- [ ] Conectar con API backend

---

## Patrones a Seguir

Consulta estas implementaciones como referencia:

- `frontend/src/features/proveedores/pages/ProveedoresPage.tsx` - Página con todas las características
- `frontend/src/features/proveedores/components/ProveedoresTable.tsx` - Tabla con acciones
- `frontend/src/features/users/pages/UsersPage.tsx` - Otra implementación completa
