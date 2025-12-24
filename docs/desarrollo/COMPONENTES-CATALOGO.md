# Catálogo de Componentes - Design System

Documentación de componentes reutilizables del proyecto. Todos los componentes soportan dark mode y son completamente tipados con TypeScript.

## Índice

- [Common Components](#common-components)
- [Form Components](#form-components)
- [Layout Components](#layout-components)
- [Modal Components](#modal-components)
- [Security Components](#security-components)

---

## Common Components

### Button

Botón con múltiples variantes, tamaños y estados de carga.

**Props:**
```typescript
variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
size?: 'sm' | 'md' | 'lg'
isLoading?: boolean
leftIcon?: React.ReactNode
rightIcon?: React.ReactNode
disabled?: boolean
```

**Ejemplo:**
```tsx
import { Button } from '@/components/common/Button';
import { Plus } from 'lucide-react';

<Button variant="primary" size="md" leftIcon={<Plus />}>
  Crear Nuevo
</Button>

<Button variant="danger" isLoading onClick={handleDelete}>
  Eliminar
</Button>
```

---

### Card

Contenedor con variantes de estilo y opciones de padding.

**Props:**
```typescript
variant?: 'default' | 'bordered' | 'elevated'
padding?: 'none' | 'sm' | 'md' | 'lg'
```

**Ejemplo:**
```tsx
import { Card } from '@/components/common/Card';

<Card variant="elevated" padding="lg">
  <h3>Título</h3>
  <p>Contenido de la tarjeta</p>
</Card>
```

---

### Badge

Etiqueta para estados, categorías o contadores.

**Props:**
```typescript
variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
size?: 'sm' | 'md' | 'lg'
```

**Ejemplo:**
```tsx
import { Badge } from '@/components/common/Badge';

<Badge variant="success" size="md">Activo</Badge>
<Badge variant="warning">Pendiente</Badge>
```

---

### Spinner

Indicador de carga animado.

**Props:**
```typescript
size?: 'sm' | 'md' | 'lg'
className?: string
```

**Ejemplo:**
```tsx
import { Spinner } from '@/components/common/Spinner';

{isLoading && <Spinner size="lg" />}
```

---

### Modal

Modal con overlay, animaciones y control de cierre.

**Props:**
```typescript
isOpen: boolean
onClose: () => void
title: string
size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
showCloseButton?: boolean
children: ReactNode
```

**Ejemplo:**
```tsx
import { Modal } from '@/components/common/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Crear Usuario"
  size="lg"
>
  <form>...</form>
</Modal>
```

---

### Alert

Mensajes de alerta con iconos y variantes de color.

**Props:**
```typescript
variant?: 'success' | 'warning' | 'error' | 'info'
title?: string
message: string
onClose?: () => void
closable?: boolean
```

**Ejemplo:**
```tsx
import { Alert } from '@/components/common/Alert';

<Alert
  variant="success"
  title="Éxito"
  message="Usuario creado correctamente"
  closable
  onClose={handleClose}
/>
```

---

### EmptyState

Estado vacío con acción opcional.

**Props:**
```typescript
icon?: ReactNode
title: string
description?: string
action?: {
  label: string
  onClick: () => void
  icon?: ReactNode
}
className?: string
```

**Ejemplo:**
```tsx
import { EmptyState } from '@/components/common/EmptyState';
import { Users } from 'lucide-react';

<EmptyState
  icon={<Users className="h-12 w-12" />}
  title="No hay usuarios"
  description="Comienza creando tu primer usuario"
  action={{
    label: "Crear Usuario",
    onClick: () => setModalOpen(true),
    icon: <Plus />
  }}
/>
```

---

### Tooltip

Tooltip posicionable con delay configurable.

**Props:**
```typescript
content: string | ReactNode
position?: 'top' | 'bottom' | 'left' | 'right'
delay?: number
children: ReactNode
```

**Ejemplo:**
```tsx
import { Tooltip } from '@/components/common/Tooltip';

<Tooltip content="Editar usuario" position="top">
  <Button variant="ghost"><Edit /></Button>
</Tooltip>
```

---

### Dropdown

Menú desplegable con items y variantes.

**Props:**
```typescript
trigger?: ReactNode
items: DropdownItem[]
align?: 'left' | 'right'

// DropdownItem:
{
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
  divider?: boolean
}
```

**Ejemplo:**
```tsx
import { Dropdown } from '@/components/common/Dropdown';
import { Edit, Trash } from 'lucide-react';

<Dropdown
  align="right"
  items={[
    { label: 'Editar', icon: <Edit />, onClick: handleEdit },
    { divider: true },
    { label: 'Eliminar', icon: <Trash />, onClick: handleDelete, variant: 'danger' }
  ]}
/>
```

---

### Avatar

Avatar con imagen, iniciales o icono por defecto.

**Props:**
```typescript
src?: string
alt?: string
name?: string
size?: 'sm' | 'md' | 'lg' | 'xl'
className?: string
```

**Ejemplo:**
```tsx
import { Avatar } from '@/components/common/Avatar';

<Avatar src="/avatar.jpg" alt="Juan Pérez" size="md" />
<Avatar name="Juan Pérez" size="lg" />
```

---

### Tabs

Tabs con variantes underline y pills.

**Props:**
```typescript
tabs: Tab[]
activeTab: string
onChange: (tabId: string) => void
variant?: 'underline' | 'pills'

// Tab:
{
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
}
```

**Ejemplo:**
```tsx
import { Tabs } from '@/components/common/Tabs';
import { Users, Settings } from 'lucide-react';

<Tabs
  variant="pills"
  activeTab={activeTab}
  onChange={setActiveTab}
  tabs={[
    { id: 'users', label: 'Usuarios', icon: <Users /> },
    { id: 'settings', label: 'Configuración', icon: <Settings /> }
  ]}
/>
```

---

### SelectionCard

Tarjeta de selección con efectos 3D, parallax y múltiples variantes.

**Props:**
```typescript
icon: LucideIcon
title: string
subtitle?: string
href?: string
onClick?: () => void
variant?: 'default' | 'gradient' | 'glass' | 'glow'
color?: 'purple' | 'blue' | 'green' | 'orange'
disabled?: boolean
```

**Ejemplo:**
```tsx
import { SelectionCard, SelectionCardGrid } from '@/components/common/SelectionCard';
import { Package, Users } from 'lucide-react';

<SelectionCardGrid columns={2}>
  <SelectionCard
    icon={Package}
    title="Proveedores"
    subtitle="Gestión de proveedores y materias primas"
    href="/proveedores"
    variant="gradient"
    color="blue"
  />
  <SelectionCard
    icon={Users}
    title="Usuarios"
    subtitle="Administración de usuarios del sistema"
    onClick={() => navigate('/users')}
    variant="glow"
    color="purple"
  />
</SelectionCardGrid>
```

---

### ConfirmDialog

Diálogo de confirmación con variantes visuales.

**Props:**
```typescript
isOpen: boolean
onClose: () => void
onConfirm: () => void
title: string
message: string
confirmText?: string
cancelText?: string
variant?: 'danger' | 'warning' | 'info'
isLoading?: boolean
```

**Ejemplo:**
```tsx
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Confirmar eliminación"
  message="¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer."
  variant="danger"
  confirmText="Eliminar"
  isLoading={isDeleting}
/>
```

---

### Typography

Sistema de tipografía con variantes, colores y pesos.

**Props:**
```typescript
variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'bodyLarge' | 'bodySmall' | 'label' | 'caption' | 'overline'
color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted'
weight?: 'normal' | 'medium' | 'semibold' | 'bold'
align?: 'left' | 'center' | 'right'
as?: ElementType
```

**Ejemplo:**
```tsx
import { Typography, Heading1, BodyText } from '@/components/common/Typography';

<Typography variant="h1" color="primary">Título Principal</Typography>
<Heading2 color="secondary">Subtítulo</Heading2>
<BodyText color="muted">Texto descriptivo</BodyText>
```

---

## Form Components

### Input

Campo de texto con label, iconos y validación.

**Props:**
```typescript
label?: string
error?: string
helperText?: string
leftIcon?: React.ReactNode
rightIcon?: React.ReactNode
// + todas las props de HTMLInputElement
```

**Ejemplo:**
```tsx
import { Input } from '@/components/forms/Input';
import { Search, Mail } from 'lucide-react';

<Input
  label="Correo electrónico"
  type="email"
  placeholder="usuario@ejemplo.com"
  leftIcon={<Mail />}
  error={errors.email}
  helperText="Ingresa un correo válido"
/>

<Input
  placeholder="Buscar..."
  leftIcon={<Search />}
/>
```

---

### Select

Selector con opciones y validación.

**Props:**
```typescript
label?: string
error?: string
helperText?: string
options: SelectOption[]
placeholder?: string

// SelectOption:
{
  value: string | number
  label: string
}
```

**Ejemplo:**
```tsx
import { Select } from '@/components/forms/Select';

<Select
  label="Estado"
  placeholder="Selecciona un estado"
  options={[
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' }
  ]}
  error={errors.estado}
/>
```

---

### Textarea

Área de texto con opciones de redimensionamiento.

**Props:**
```typescript
label?: string
error?: string
helperText?: string
resize?: 'none' | 'both' | 'horizontal' | 'vertical'
rows?: number
```

**Ejemplo:**
```tsx
import { Textarea } from '@/components/forms/Textarea';

<Textarea
  label="Observaciones"
  rows={5}
  resize="vertical"
  placeholder="Escribe tus observaciones..."
  error={errors.observaciones}
/>
```

---

### Checkbox

Checkbox con label y validación.

**Props:**
```typescript
label?: string
error?: string
helperText?: string
checked?: boolean
```

**Ejemplo:**
```tsx
import { Checkbox } from '@/components/forms/Checkbox';

<Checkbox
  label="Acepto los términos y condiciones"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
  error={errors.terms}
/>
```

---

### Switch

Toggle switch con label y descripción.

**Props:**
```typescript
label?: string
description?: string
size?: 'sm' | 'md' | 'lg'
checked?: boolean
onCheckedChange?: (checked: boolean) => void
```

**Ejemplo:**
```tsx
import { Switch } from '@/components/forms/Switch';

<Switch
  label="Notificaciones"
  description="Recibir alertas por correo electrónico"
  checked={notifications}
  onCheckedChange={setNotifications}
  size="md"
/>
```

---

### DatePicker

Selector de fecha nativo con icono.

**Props:**
```typescript
label?: string
error?: string
helperText?: string
showIcon?: boolean
```

**Ejemplo:**
```tsx
import { DatePicker } from '@/components/forms/DatePicker';

<DatePicker
  label="Fecha de nacimiento"
  showIcon
  error={errors.fecha}
/>
```

---

## Layout Components

### PageHeader

Encabezado de página con título, descripción, acciones y tabs.

**Props:**
```typescript
title: string
description?: string
actions?: ReactNode
controls?: ReactNode
tabs?: ReactNode
className?: string
```

**Ejemplo:**
```tsx
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/common/Button';
import { Plus } from 'lucide-react';

<PageHeader
  title="Usuarios"
  description="Gestión de usuarios del sistema"
  actions={
    <Button variant="primary" leftIcon={<Plus />}>
      Crear Usuario
    </Button>
  }
/>
```

---

### FilterCard

Card de filtros con búsqueda y filtros colapsables.

**Props:**
```typescript
searchPlaceholder?: string
searchValue?: string
onSearchChange?: (value: string) => void
collapsible?: boolean
defaultExpanded?: boolean
children?: ReactNode
activeFiltersCount?: number
onClearFilters?: () => void
hasActiveFilters?: boolean
title?: string
```

**Ejemplo:**
```tsx
import { FilterCard, FilterGrid } from '@/components/layout/FilterCard';
import { Select } from '@/components/forms/Select';

<FilterCard
  searchPlaceholder="Buscar usuarios..."
  searchValue={search}
  onSearchChange={setSearch}
  collapsible
  activeFiltersCount={2}
  onClearFilters={handleClear}
  hasActiveFilters
>
  <FilterGrid columns={4}>
    <Select label="Estado" options={estadoOptions} />
    <Select label="Rol" options={rolOptions} />
  </FilterGrid>
</FilterCard>
```

---

### DataTableCard

Wrapper para tablas con paginación integrada.

**Props:**
```typescript
children: ReactNode
pagination?: PaginationInfo
title?: string
headerActions?: ReactNode
isLoading?: boolean
emptyMessage?: string
isEmpty?: boolean

// PaginationInfo:
{
  currentPage: number
  pageSize: number
  totalItems: number
  hasPrevious?: boolean
  hasNext?: boolean
  onPageChange: (page: number) => void
}
```

**Ejemplo:**
```tsx
import { DataTableCard } from '@/components/layout/DataTableCard';

<DataTableCard
  title="Lista de Usuarios"
  pagination={{
    currentPage: page,
    pageSize: 10,
    totalItems: 100,
    onPageChange: setPage
  }}
  isEmpty={users.length === 0}
  isLoading={isLoading}
>
  <table>...</table>
</DataTableCard>
```

---

### PageTabs

Tabs de navegación para páginas.

**Props:**
```typescript
tabs: TabItem[]
activeTab: string
onTabChange: (tabId: string) => void

// TabItem:
{
  id: string
  label: string
  icon?: LucideIcon
  badge?: string | number
}
```

**Ejemplo:**
```tsx
import { PageTabs } from '@/components/layout/PageTabs';
import { Users, Shield } from 'lucide-react';

<PageTabs
  activeTab={activeTab}
  onTabChange={setActiveTab}
  tabs={[
    { id: 'all', label: 'Todos', icon: Users, badge: 45 },
    { id: 'admins', label: 'Administradores', icon: Shield, badge: 5 }
  ]}
/>
```

---

### StatsGrid

Grid de tarjetas de estadísticas con soporte para macroprocesos.

**Props:**
```typescript
stats: StatItem[]
columns?: 2 | 3 | 4 | 5
variant?: 'default' | 'compact'
macroprocessColor?: MacroprocessColor

// StatItem:
{
  label: string
  value: string | number
  icon?: LucideIcon
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  description?: string
}
```

**Ejemplo:**
```tsx
import { StatsGrid } from '@/components/layout/StatsGrid';
import { Users, Package, TrendingUp } from 'lucide-react';

<StatsGrid
  columns={4}
  stats={[
    {
      label: 'Total Usuarios',
      value: '1,234',
      icon: Users,
      iconColor: 'primary',
      change: '+12%',
      changeType: 'positive',
      description: 'vs mes anterior'
    },
    {
      label: 'Proveedores Activos',
      value: 156,
      icon: Package,
      iconColor: 'success'
    }
  ]}
/>
```

---

## Modal Components

### BaseModal

Modal base con animaciones Framer Motion y accesibilidad completa.

**Props:**
```typescript
isOpen: boolean
onClose: () => void
title: string
subtitle?: string
children: ReactNode
size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full'
showCloseButton?: boolean
closeOnBackdrop?: boolean
closeOnEscape?: boolean
footer?: ReactNode
id?: string
```

**Ejemplo:**
```tsx
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';

<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Crear Usuario"
  subtitle="Completa el formulario para crear un nuevo usuario"
  size="lg"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        Guardar
      </Button>
    </>
  }
>
  <form>...</form>
</BaseModal>
```

---

## Security Components

### ProtectedAction

Componente para control de acceso basado en permisos.

**Props:**
```typescript
children: ReactNode
fallback?: ReactNode
permission?: PermissionCode
permissions?: PermissionCode[]
cargos?: CargoCode[]
minLevel?: CargoLevel
roles?: RoleCode[]
superAdminOnly?: boolean
invert?: boolean
```

**Ejemplo:**
```tsx
import { ProtectedAction } from '@/components/common/ProtectedAction';
import { PermissionCodes } from '@/constants/permissions';

<ProtectedAction permission={PermissionCodes.USERS.CREATE}>
  <Button onClick={openCreateModal}>Crear Usuario</Button>
</ProtectedAction>

<ProtectedAction
  minLevel={CargoLevels.COORDINACION}
  fallback={<p>No tienes permisos</p>}
>
  <AdminPanel />
</ProtectedAction>
```

---

## Utilidades

### cn (classnames utility)

Función para combinar clases de Tailwind CSS con soporte para condicionales.

```tsx
import { cn } from '@/utils/cn';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  variant === 'primary' && 'primary-class',
  className
)}>
  ...
</div>
```

---

## Convenciones

1. **Importaciones**: Usar rutas absolutas con alias `@/`
2. **Dark Mode**: Todos los componentes soportan dark mode usando `dark:` prefix
3. **TypeScript**: Todos los componentes están completamente tipados
4. **Accesibilidad**: ARIA labels y roles donde sea necesario
5. **Responsividad**: Mobile-first con breakpoints `sm:`, `md:`, `lg:`, `xl:`
6. **Iconos**: Usar Lucide React para iconografía consistente

---

## Paleta de Colores

Los componentes utilizan las siguientes variables de color:

- **primary**: Azul principal del sistema
- **success**: Verde para estados exitosos
- **warning**: Amarillo para advertencias
- **danger**: Rojo para errores y acciones destructivas
- **info**: Azul claro para información
- **gray**: Escala de grises para UI neutral

Cada color tiene variantes del 50 al 900 y soporte dark mode.

---

## Próximos Pasos

Para crear nuevos componentes:

1. Seguir la estructura de carpetas existente
2. Exportar tipos e interfaces
3. Documentar props con JSDoc
4. Agregar ejemplo de uso
5. Actualizar este catálogo

Para más información, consulta:
- `docs/CLAUDE.md` - Guía para desarrollo con Claude
- `docs/RBAC-SYSTEM.md` - Sistema de permisos
- `frontend/src/utils/constants.ts` - Constantes del sistema
