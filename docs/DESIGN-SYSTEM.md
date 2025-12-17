# Design System - ERP Grasas y Huesos del Norte

## Resumen

Este documento define el sistema de diseño del ERP, estableciendo estándares para tipografía, colores, animaciones, componentes y patrones de UI.

---

## 1. Tipografía

### Fuentes

| Fuente | Uso | Pesos |
|--------|-----|-------|
| **Montserrat** | Títulos y encabezados | 600, 700 |
| **Inter** | Cuerpo de texto, labels, UI | 400, 500, 600 |

### Clases de Tailwind

```tsx
// Encabezados - Montserrat
<h1 className="font-heading text-4xl font-bold">H1 Title</h1>
<h2 className="font-heading text-3xl font-bold">H2 Title</h2>
<h3 className="font-heading text-2xl font-semibold">H3 Title</h3>
<h4 className="font-heading text-xl font-semibold">H4 Title</h4>
<h5 className="font-heading text-lg font-semibold">H5 Title</h5>
<h6 className="font-heading text-base font-semibold">H6 Title</h6>

// Cuerpo - Inter
<p className="font-body text-base">Párrafo normal</p>
<p className="font-body text-sm">Texto pequeño</p>
<label className="font-body text-sm font-medium">Label</label>
<small className="font-body text-sm text-gray-600">Caption</small>
```

### Componentes de Tipografía

```tsx
import { Heading1, Heading2, BodyText, Label, Caption } from '@/components/common';

<Heading1>Título Principal</Heading1>
<Heading2>Subtítulo</Heading2>
<BodyText>Contenido del párrafo</BodyText>
<Label>Etiqueta de campo</Label>
<Caption>Texto auxiliar</Caption>
```

---

## 2. Colores

### Paleta Principal

| Token | Uso | Light | Dark |
|-------|-----|-------|------|
| `primary` | Acciones principales, enlaces | `#2563eb` (600) | `#3b82f6` (500) |
| `gray` | Textos, fondos, bordes | Escala completa | Escala completa |
| `success` | Estados exitosos | `#16a34a` (600) | `#4ade80` (400) |
| `warning` | Alertas, advertencias | `#d97706` (600) | `#fbbf24` (400) |
| `danger` | Errores, eliminación | `#dc2626` (600) | `#f87171` (400) |
| `info` | Información | `#2563eb` (600) | `#60a5fa` (400) |

### Uso en Tailwind

```tsx
// Backgrounds
<div className="bg-primary-600 dark:bg-primary-500" />
<div className="bg-gray-100 dark:bg-gray-800" />

// Text
<span className="text-gray-900 dark:text-gray-100" />
<span className="text-primary-600 dark:text-primary-400" />

// Borders
<div className="border border-gray-200 dark:border-gray-700" />
```

### Semántica de Colores

```tsx
// Estados
const statusColors = {
  activo: 'bg-success-100 text-success-800',
  pendiente: 'bg-warning-100 text-warning-800',
  cancelado: 'bg-danger-100 text-danger-800',
  info: 'bg-info-100 text-info-800',
};
```

---

## 3. Animaciones (Framer Motion)

### Configuración

Las animaciones están centralizadas en `frontend/src/lib/animations.ts`.

### Variantes Disponibles

| Variante | Uso |
|----------|-----|
| `pageVariants` | Entrada/salida de páginas |
| `modalVariants` | Animación de modales |
| `backdropVariants` | Overlay de modales |
| `cardHoverVariants` | Hover en cards |
| `listContainerVariants` | Contenedor de listas con stagger |
| `listItemVariants` | Items de lista |
| `toastVariants` | Notificaciones |
| `dropdownVariants` | Menús desplegables |
| `collapseVariants` | Contenido colapsable |
| `sidebarVariants` | Sidebar colapsable |

### Uso Básico

```tsx
import { motion } from 'framer-motion';
import { pageVariants, cardHoverVariants } from '@/lib/animations';

// Página con animación
<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
>
  {children}
</motion.div>

// Card con hover
<motion.div
  variants={cardHoverVariants}
  whileHover="hover"
  whileTap="tap"
>
  {content}
</motion.div>
```

### Componentes Animados Pre-configurados

```tsx
import {
  AnimatedPage,
  AnimatedCard,
  AnimatedList,
  AnimatedListItem,
  FadeIn,
  Skeleton,
  PulseLoader,
} from '@/components/common';

// Página animada
<AnimatedPage>
  <Content />
</AnimatedPage>

// Card con animación
<AnimatedCard hover enter>
  <CardContent />
</AnimatedCard>

// Lista con stagger
<AnimatedList>
  {items.map(item => (
    <AnimatedListItem key={item.id}>
      {item.content}
    </AnimatedListItem>
  ))}
</AnimatedList>

// Skeleton loader
<Skeleton width={200} height={20} rounded="md" />
```

### Accesibilidad

```tsx
import { shouldReduceMotion, respectMotionPreference } from '@/lib/animations';

// Verificar preferencia del usuario
if (shouldReduceMotion()) {
  // Usar animaciones reducidas o ninguna
}

// Aplicar automáticamente
const variants = respectMotionPreference(myVariants);
```

---

## 4. Sistema de Modales

### Tipos de Modales

| Modal | Uso |
|-------|-----|
| `BaseModal` | Modal base para casos personalizados |
| `FormModal` | Formularios con React Hook Form |
| `ConfirmModal` | Confirmaciones de acciones |
| `DetailModal` | Visualización de detalles |
| `WizardModal` | Flujos multi-paso |
| `AlertModal` | Notificaciones importantes |

### Importación

```tsx
import {
  BaseModal,
  FormModal,
  ConfirmModal,
  DetailModal,
  WizardModal,
  AlertModal,
  useModal,
  useConfirm,
} from '@/components/modals';
```

### Ejemplos de Uso

#### FormModal con React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { FormModal } from '@/components/modals';

const form = useForm<UserFormData>();

<FormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Crear Usuario"
  form={form}
  isLoading={isLoading}
>
  <Input {...form.register('name')} label="Nombre" />
  <Input {...form.register('email')} label="Email" />
</FormModal>
```

#### ConfirmModal

```tsx
<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Eliminar Usuario"
  message="¿Estás seguro de eliminar este usuario?"
  variant="danger"
  confirmLabel="Eliminar"
/>
```

#### DetailModal

```tsx
import { DetailModal, DetailSection, DetailField, DetailGrid } from '@/components/modals';

<DetailModal
  isOpen={isOpen}
  onClose={onClose}
  title={user.name}
  onEdit={handleEdit}
  onDelete={handleDelete}
>
  <DetailSection title="Información Personal">
    <DetailGrid columns={2}>
      <DetailField label="Nombre" value={user.name} />
      <DetailField label="Email" value={user.email} />
      <DetailField label="Teléfono" value={user.phone} emptyText="No registrado" />
    </DetailGrid>
  </DetailSection>
</DetailModal>
```

#### WizardModal

```tsx
const steps: WizardStep[] = [
  {
    id: 'step1',
    title: 'Información Básica',
    content: <Step1Form />,
    validate: () => form.trigger(['name', 'email']),
  },
  {
    id: 'step2',
    title: 'Configuración',
    content: <Step2Form />,
    optional: true,
  },
  {
    id: 'step3',
    title: 'Confirmación',
    content: <Step3Review />,
  },
];

<WizardModal
  isOpen={isOpen}
  onClose={onClose}
  onComplete={handleComplete}
  title="Crear Nuevo Registro"
  steps={steps}
/>
```

### Hooks para Modales

#### useModal

```tsx
const modal = useModal<User>();

// Abrir sin datos
modal.open();

// Abrir con datos
modal.open(selectedUser);

// En JSX
<Modal isOpen={modal.isOpen} onClose={modal.close} data={modal.data} />
```

#### useConfirm

```tsx
const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Eliminar',
    message: '¿Estás seguro?',
    variant: 'danger',
  });

  if (confirmed) {
    await deleteItem();
  }
};
```

---

## 5. Estructura de Páginas

### Templates Disponibles

| Template | Uso |
|----------|-----|
| `ModulePage` | Página principal con tabs |
| `ListPage` | CRUD con filtros y tabla |
| `SelectionPage` | Dashboard con tarjetas |
| `DetailPage` | Vista detallada |

### Estructura de Carpetas por Módulo

```
frontend/src/features/[modulo]/
├── api/
│   ├── [entidad]Api.ts
│   └── use[Entidad].ts
├── components/
│   ├── [Entidad]Table.tsx
│   ├── [Entidad]Form.tsx
│   └── [Entidad]DetailModal.tsx
├── pages/
│   ├── [Modulo]Page.tsx
│   └── [Entidad]Page.tsx
├── types/
│   └── [entidad].types.ts
└── index.ts
```

### Componentes de Layout

```tsx
import {
  PageHeader,
  PageTabs,
  StatsGrid,
  FilterCard,
  FilterGrid,
  DataTableCard,
} from '@/components/layout';

// Header de página
<PageHeader
  title="Módulo"
  description="Descripción"
  actions={<Button>Acción</Button>}
  tabs={<PageTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />}
/>

// Grid de estadísticas
<StatsGrid
  stats={[
    { label: 'Total', value: 100, icon: Package, iconColor: 'primary' },
    { label: 'Activos', value: 80, icon: CheckCircle, iconColor: 'success' },
  ]}
/>

// Filtros
<FilterCard
  searchValue={search}
  onSearchChange={setSearch}
  collapsible
>
  <FilterGrid columns={4}>
    <Select ... />
    <Input ... />
  </FilterGrid>
</FilterCard>

// Tabla con paginación
<DataTableCard
  pagination={{
    currentPage: page,
    pageSize: 20,
    totalItems: total,
    onPageChange: setPage,
  }}
>
  <Table ... />
</DataTableCard>
```

---

## 6. Iconos

### Librería: Lucide React

```tsx
import { Plus, Edit, Trash2, Search, X, Check } from 'lucide-react';

<Plus className="h-5 w-5" />
<Edit className="h-4 w-4 text-primary-600" />
```

### Tamaños Estándar

| Tamaño | Clase | Uso |
|--------|-------|-----|
| Small | `h-4 w-4` | Botones pequeños, badges |
| Default | `h-5 w-5` | Botones, menús |
| Large | `h-6 w-6` | Headers, destacados |

---

## 7. Componentes Comunes

### Botones

```tsx
import { Button } from '@/components/common';

<Button variant="primary">Guardar</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="danger">Eliminar</Button>
<Button variant="ghost">Enlace</Button>
<Button variant="primary" isLoading>Procesando...</Button>
```

### Badges

```tsx
import { Badge } from '@/components/common';

<Badge variant="success">Activo</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="danger">Error</Badge>
```

### Cards

```tsx
import { Card, AnimatedCard } from '@/components/common';

<Card className="p-6">
  <h3>Título</h3>
  <p>Contenido</p>
</Card>

<AnimatedCard hover enter>
  <CardContent />
</AnimatedCard>
```

### Formularios

```tsx
import { Input, Select, Textarea, DatePicker } from '@/components/forms';

<Input label="Nombre" error={errors.name?.message} {...register('name')} />
<Select label="Estado" options={options} {...register('status')} />
<Textarea label="Descripción" {...register('description')} />
<DatePicker label="Fecha" selected={date} onChange={setDate} />
```

---

## 8. Dark Mode

El sistema soporta modo oscuro automáticamente usando las clases de Tailwind:

```tsx
<div className="bg-white dark:bg-gray-800">
  <h1 className="text-gray-900 dark:text-gray-100">Título</h1>
  <p className="text-gray-600 dark:text-gray-400">Contenido</p>
</div>
```

---

## 9. Convenciones de Código

### Nombres de Archivos

- Componentes: `PascalCase.tsx` (ej: `UserTable.tsx`)
- Hooks: `camelCase.ts` con prefijo `use` (ej: `useUsers.ts`)
- Tipos: `camelCase.types.ts` (ej: `user.types.ts`)
- API: `camelCase.ts` con sufijo `Api` (ej: `usersApi.ts`)

### Imports

```tsx
// 1. React/Third-party
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

// 2. Componentes del proyecto
import { Button, Card } from '@/components/common';
import { Input, Select } from '@/components/forms';
import { PageHeader } from '@/components/layout';

// 3. Features/Hooks/Utils
import { useUsers } from '../api/useUsers';
import { formatDate } from '@/utils/formatters';

// 4. Tipos
import type { User } from '../types/user.types';
```

---

## 10. Checklist de Implementación

Al crear un nuevo módulo o página:

- [ ] Usar `PageHeader` con título y descripción
- [ ] Implementar tabs si hay submódulos (`PageTabs`)
- [ ] Usar `StatsGrid` para métricas principales
- [ ] Implementar filtros con `FilterCard`
- [ ] Usar `DataTableCard` para tablas con paginación
- [ ] Implementar modales del sistema (`FormModal`, `ConfirmModal`, etc.)
- [ ] Usar iconos de Lucide React
- [ ] Soportar dark mode
- [ ] Añadir animaciones con `AnimatedPage`, `AnimatedList`, etc.
- [ ] Manejar estados de carga con `Skeleton` o `PulseLoader`
- [ ] Implementar estados vacíos con `EmptyState`
