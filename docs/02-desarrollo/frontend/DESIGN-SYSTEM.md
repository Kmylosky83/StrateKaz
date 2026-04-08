# Design System - ERP StrateKaz

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

### Paleta Semántica (Estados y Acciones)

| Token | Uso | Light | Dark |
|-------|-----|-------|------|
| `primary` | Acciones principales, enlaces | `#2563eb` (600) | `#3b82f6` (500) |
| `gray` | Textos, fondos, bordes | Escala completa | Escala completa |
| `success` | Estados exitosos | `#16a34a` (600) | `#4ade80` (400) |
| `warning` | Alertas, advertencias | `#d97706` (600) | `#fbbf24` (400) |
| `danger` | Errores, eliminación | `#dc2626` (600) | `#f87171` (400) |
| `info` | Información | `#2563eb` (600) | `#60a5fa` (400) |

### Sistema de Colores por Módulo

El sistema soporta **10 colores base** para identificar módulos y sus componentes relacionados:

| Color | Uso Típico | Ejemplo |
|-------|-----------|---------|
| `purple` | Gestión Estratégica | Módulos de nivel estratégico |
| `blue` | Motores de Gestión | Riesgos, Cumplimiento |
| `green` | Gestión Integral | Calidad, Medio Ambiente |
| `orange` | Procesos Misionales | Producción, Logística |
| `teal` | Procesos de Apoyo | Finanzas, Compras |
| `red` | Alertas y Críticos | Seguridad, Emergencias |
| `yellow` | Pendientes y Avisos | Notificaciones, Tareas |
| `pink` | Recursos Humanos | Talento, Nómina |
| `indigo` | Análisis y BI | Analytics, Reportes |
| `gray` | Configuración y Admin | Ajustes, Usuarios |

#### Mapeo de Colores Extendidos

El sistema mapea automáticamente colores de Tailwind extendidos a los 10 colores base:

```typescript
// Mapeo automático
amber → orange
cyan → teal
rose → pink
violet → purple
emerald → green
lime → green
slate/stone/zinc/neutral → gray
fuchsia → pink
sky → blue
```

Esto permite que el backend use cualquier color de Tailwind y el frontend lo convierta al color más cercano soportado.

#### Herencia de Color en Jerarquía

Los colores fluyen desde el módulo hacia sus componentes hijos:

```
Módulo (purple)
  ├─ ModuleCard → Color purple
  ├─ Sidebar item → Color purple
  ├─ Tab principal → Color purple
  │   ├─ Tab secundario → Hereda purple
  │   ├─ StatsGrid → moduleColor="purple"
  │   └─ DynamicSections → moduleColor="purple"
  └─ PageHeader → Color purple en badges/acciones
```

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

// Colores de módulo
<div className="bg-purple-50 dark:bg-purple-900/20" />
<span className="text-purple-600 dark:text-purple-400" />
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

// Módulos (color dinámico)
const moduleColor = 'purple'; // Viene de la API
```

### Componentes que Usan el Sistema de Colores

Los siguientes componentes reciben y aplican el color del módulo:

1. **ModuleCard** (`color` prop)
   ```tsx
   <ModuleCard
     icon={Building2}
     title="Gestión Estratégica"
     color="purple"
     to="/estrategica"
   />
   ```

2. **Sidebar** (color automático desde API)
   - Items de módulo aplican color correspondiente
   - Tabs heredan color del módulo padre

3. **StatsGrid** (`moduleColor` prop)
   ```tsx
   <StatsGrid
     stats={stats}
     moduleColor="purple"
     columns={4}
   />
   ```

4. **DynamicSections** (`moduleColor` prop)
   ```tsx
   <DynamicSections
     sections={sections}
     activeSection={active}
     onChange={setActive}
     moduleColor="purple"
   />
   ```

5. **PageHeader** (color en badges)
   ```tsx
   <PageHeader
     title="Módulo"
     badges={[
       { label: 'Badge', variant: 'purple' }
     ]}
   />
   ```

---

## Sistema de Colores de Branding

El sistema implementa un modelo de **3 colores configurables por tenant** que permiten personalizar la identidad visual de cada cliente sin modificar código. Los colores se inyectan dinámicamente mediante CSS variables y se integran con Tailwind CSS.

### Los 3 Colores Configurables

| Color | Uso Principal | Elementos Afectados |
|-------|--------------|---------------------|
| **Primary** | Acciones críticas + Identidad principal | Botones Guardar/Crear, Tabs activos, Sidebar activo, Avatar, Focus en formularios, Links principales |
| **Secondary** | Acciones secundarias + Edición | Botones Editar, Cancelar, Links internos, Badges de contadores, Acciones alternativas |
| **Accent** | Feedback + Notificaciones | Badge notificaciones, Highlights, Elementos destacados, Llamados de atención |

### Arquitectura Técnica

#### CSS Variables Dinámicas

El sistema inyecta variables CSS en runtime basadas en la configuración del tenant:

```css
:root {
  /* Primary Color Scale */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;  /* Base */
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;

  /* Secondary Color Scale */
  --color-secondary-50: #f5f3ff;
  --color-secondary-100: #ede9fe;
  /* ... hasta 950 */

  /* Accent Color Scale */
  --color-accent-50: #fdf4ff;
  --color-accent-100: #fae8ff;
  /* ... hasta 950 */
}
```

#### Integración con Tailwind

Las variables se mapean automáticamente a las clases de Tailwind:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        50: 'var(--color-primary-50)',
        100: 'var(--color-primary-100)',
        // ... hasta 950
      },
      secondary: {
        50: 'var(--color-secondary-50)',
        // ...
      },
      accent: {
        50: 'var(--color-accent-50)',
        // ...
      },
    },
  },
}
```

### Variantes de Componentes

#### Button

El componente `Button` soporta las siguientes variantes de branding:

```tsx
import { Button } from '@/components/common';

// Acciones principales (bg-primary-600 hover:bg-primary-700)
<Button variant="primary">Guardar</Button>
<Button variant="primary">Crear</Button>

// Acciones secundarias (bg-secondary-100 text-secondary-700 hover:bg-secondary-200)
<Button variant="secondary">Editar</Button>
<Button variant="secondary">Cancelar</Button>

// Acciones destacadas (bg-accent-500 hover:bg-accent-600)
<Button variant="accent">Destacar</Button>

// Outline alternativas
<Button variant="outline-secondary">Editar</Button>
<Button variant="outline-accent">Acción especial</Button>

// Variantes semánticas (no cambian con branding)
<Button variant="danger">Eliminar</Button>
<Button variant="ghost">Texto</Button>
```

#### Badge

Las variantes de `Badge` se dividen en dos grupos:

**Variantes de Branding** (cambian con configuración del tenant):

```tsx
import { Badge } from '@/components/common';

<Badge variant="primary">Prioridad Alta</Badge>
<Badge variant="secondary">En Proceso</Badge>
<Badge variant="accent">Nuevo</Badge>
```

**Variantes Semánticas** (colores fijos, no cambian):

```tsx
<Badge variant="success">Completado</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="danger">Crítico</Badge>
<Badge variant="info">Información</Badge>
<Badge variant="gray">Neutral</Badge>
```

#### StatsGrid iconColor

El componente `StatsGrid` usa colores semánticos para iconos (NO usa branding):

```tsx
import { StatsGrid } from '@/components/layout';

<StatsGrid
  stats={[
    {
      label: 'Total Registros',
      value: 1250,
      icon: Database,
      iconColor: 'info',      // Azul - Métricas de conteo/totales
    },
    {
      label: 'Completados',
      value: 850,
      icon: CheckCircle,
      iconColor: 'success',   // Verde - Métricas positivas
    },
    {
      label: 'Pendientes',
      value: 300,
      icon: Clock,
      iconColor: 'warning',   // Amarillo - Alertas
    },
    {
      label: 'Críticos',
      value: 100,
      icon: AlertTriangle,
      iconColor: 'danger',    // Rojo - Elementos críticos
    },
    {
      label: 'Archivados',
      value: 50,
      icon: Archive,
      iconColor: 'gray',      // Gris - Elementos neutrales
    },
  ]}
  moduleColor="purple"  // Para bordes/contenedores (opcional)
/>
```

### Elementos del UI que Usan Branding

#### Navegación

```tsx
// Sidebar - Items activos usan primary
<div className="bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300">
  Item Activo
</div>

// Tabs activos
<button className="border-b-2 border-primary-600 text-primary-600">
  Tab Activo
</button>
```

#### Formularios

```tsx
// Focus states usan primary
<input className="focus:border-primary-500 focus:ring-primary-500" />

// Botones de acción
<Button variant="primary">Guardar</Button>
<Button variant="secondary">Cancelar</Button>
```

#### Avatares y Badges de Usuario

```tsx
// Avatar usa primary como color de fondo por defecto
<div className="bg-primary-600 text-white">
  {user.initials}
</div>

// Badge de contador usa secondary
<Badge variant="secondary">5</Badge>
```

#### Notificaciones y Alertas

```tsx
// Notificaciones destacadas usan accent
<div className="bg-accent-50 border-accent-500 text-accent-700">
  Nueva notificación
</div>

// Badge de contador de notificaciones
<span className="bg-accent-500 text-white">3</span>
```

### Cuándo Usar Cada Color

#### Primary (Identidad Principal)

Usar para:
- Botones de acción principal (Guardar, Crear, Confirmar)
- Items de navegación activos (Sidebar, Tabs)
- Links principales de navegación
- Estados de focus en formularios
- Avatares de usuario
- Elementos que refuerzan la identidad del tenant

Evitar para:
- Botones destructivos (usar danger)
- Estados de error (usar danger)
- Métricas y estadísticas (usar iconColor semántico)

#### Secondary (Acciones Secundarias)

Usar para:
- Botones de edición
- Botones de cancelar
- Links internos de menor jerarquía
- Badges de contadores (ej: "5 items")
- Acciones alternativas a la principal

Evitar para:
- Acciones principales (usar primary)
- Notificaciones urgentes (usar accent o danger)

#### Accent (Destacar y Notificar)

Usar para:
- Badges de notificaciones
- Elementos que requieren atención
- Highlights y elementos destacados
- Llamados a la acción secundarios
- Indicadores de "nuevo" o "actualizado"

Evitar para:
- Navegación principal (usar primary)
- Botones de acción principal (usar primary)

### Separación: Branding vs Semántica

Es crucial mantener la separación entre colores de branding (que cambian por tenant) y colores semánticos (que son universales):

#### Colores de Branding (Configurables)

```tsx
// Estos CAMBIAN según el tenant
<Button variant="primary" />     // Color configurable
<Button variant="secondary" />   // Color configurable
<Button variant="accent" />      // Color configurable
<Badge variant="primary" />      // Color configurable
```

#### Colores Semánticos (Fijos)

```tsx
// Estos NO CAMBIAN (siempre verde, rojo, amarillo, etc.)
<Button variant="danger" />          // Siempre rojo
<Badge variant="success" />          // Siempre verde
<Badge variant="warning" />          // Siempre amarillo
<StatsGrid iconColor="success" />    // Siempre verde
```

**Regla de oro**: Si el color comunica un estado o semántica universal (éxito, error, advertencia), usar colores semánticos. Si el color es parte de la identidad visual o jerarquía de acciones, usar branding.

### Configuración por Tenant

Los colores se configuran en la interfaz de administración:

```tsx
// En Configuración Empresa > Branding
{
  primaryColor: '#2563eb',    // Azul - Identidad principal
  secondaryColor: '#7c3aed',  // Púrpura - Acciones secundarias
  accentColor: '#ec4899',     // Rosa - Destacados
}
```

El sistema convierte automáticamente estos colores base en escalas completas (50-950) usando el algoritmo de generación de paletas de Tailwind.

### Modo Oscuro

Los colores de branding se adaptan automáticamente al modo oscuro usando escalas más claras:

```tsx
// Modo claro: usa tonos 600-700
<div className="bg-primary-600 dark:bg-primary-500" />
<div className="text-primary-700 dark:text-primary-300" />

// Los badges ajustan automáticamente
<Badge variant="primary" />
// Light: bg-primary-100 text-primary-700
// Dark: bg-primary-900/20 text-primary-300
```

### Testing de Branding

Para probar diferentes configuraciones de branding:

```tsx
// Herramienta de testing (solo desarrollo)
import { BrandingTester } from '@/components/dev';

<BrandingTester
  presets={[
    { name: 'Azul Corporativo', primary: '#2563eb', secondary: '#7c3aed', accent: '#ec4899' },
    { name: 'Verde Natural', primary: '#16a34a', secondary: '#0891b2', accent: '#f59e0b' },
    { name: 'Rojo Energético', primary: '#dc2626', secondary: '#ea580c', accent: '#8b5cf6' },
  ]}
/>
```

### Migración de Código Existente

Al actualizar componentes existentes para usar el sistema de branding:

**Antes:**

```tsx
<button className="bg-blue-600 hover:bg-blue-700">
  Guardar
</button>
```

**Después:**

```tsx
<Button variant="primary">
  Guardar
</Button>
```

**Antes:**

```tsx
<span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
  Editar
</span>
```

**Después:**

```tsx
<Badge variant="secondary">
  Editar
</Badge>
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

### Variantes de Module Card (Dashboard)

Animaciones especializadas para las tarjetas de módulos en el Dashboard:

| Variante | Uso |
|----------|-----|
| `moduleGridVariants` | Contenedor del grid con entrada staggered |
| `moduleCardVariants` | Entrada escalonada de cada card |
| `moduleCardHoverVariants` | Efecto hover con elevación y escala |
| `moduleIconVariants` | Rotación y escala del icono en hover |
| `moduleChevronVariants` | Desplazamiento de la flecha en hover |
| `moduleBadgeVariants` | Escalado del badge de secciones |

```tsx
import {
  moduleGridVariants,
  moduleCardHoverVariants,
  moduleIconVariants,
  moduleChevronVariants,
  moduleBadgeVariants,
} from '@/lib/animations';

// Grid con entrada escalonada
<motion.div variants={moduleGridVariants} initial="hidden" animate="visible">
  {modules.map(module => (
    <ModuleCard key={module.code} {...module} />
  ))}
</motion.div>

// Card individual con animaciones de hover
<motion.div
  variants={moduleCardHoverVariants}
  initial="rest"
  whileHover="hover"
  whileTap="tap"
>
  <motion.div variants={moduleIconVariants}>
    <Icon />
  </motion.div>
  <motion.span variants={moduleBadgeVariants}>
    {sectionsCount} secciones
  </motion.span>
</motion.div>
```

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

## 6. Iconos - Sistema Dinamico

### Principio: Iconos desde la Base de Datos

Este sistema NO hardcodea iconos. Todos los iconos se gestionan desde la base de datos usando el modelo `IconRegistry`.

Ver documentacion completa: [SISTEMA-ICONOS-DINAMICOS.md](./SISTEMA-ICONOS-DINAMICOS.md)

### Componentes de Iconos

| Componente | Uso | Archivo |
|------------|-----|---------|
| `DynamicIcon` | Renderiza iconos por nombre string | `@/components/common/DynamicIcon` |
| `IconPicker` | Selector visual con busqueda | `@/components/common/IconPicker` |
| `useIcons` | Hook para consumir API de iconos | `@/hooks/useIcons` |

### DynamicIcon - Renderizado Dinamico

```tsx
import { DynamicIcon } from '@/components/common';

// Basico - icono desde BD
<DynamicIcon name="Heart" />

// Con tamano y estilo
<DynamicIcon
  name={valor.icono_nombre}
  size={24}
  className="text-purple-600"
/>

// Con fallback personalizado
<DynamicIcon
  name={item.icon_name}
  fallback={<span>?</span>}
/>
```

### IconPicker - Selector de Iconos

```tsx
import { IconPicker } from '@/components/common';

// Selector basico
<IconPicker
  value={selectedIcon}
  onChange={setSelectedIcon}
/>

// Filtrado por categoria
<IconPicker
  value={valor.icono_nombre}
  onChange={(name) => setValue('icono_nombre', name)}
  category="VALORES"
  label="Icono del Valor"
/>

// Con validacion de formulario
<IconPicker
  value={form.icon_name}
  onChange={(name) => form.setValue('icon_name', name)}
  error={form.errors.icon_name?.message}
  helperText="Selecciona un icono representativo"
/>
```

### Categorias de Iconos Disponibles

| Categoria | Codigo | Iconos | Uso |
|-----------|--------|--------|-----|
| Valores Corporativos | `VALORES` | 18 | Mision, vision, valores |
| Normas y Sistemas | `NORMAS` | 6 | ISO, certificaciones |
| Estados y Status | `ESTADOS` | 6 | Workflows, estados |
| Riesgos y Alertas | `RIESGOS` | 5 | Peligros, emergencias |
| Personas y Equipos | `PERSONAS` | 5 | Usuarios, colaboradores |
| Documentos | `DOCUMENTOS` | 6 | Archivos, carpetas |
| Uso General | `GENERAL` | 10 | Acciones, botones |

Total: 56 iconos del sistema precargados

### API de Iconos

```typescript
import { useIcons, useIconsByCategory } from '@/hooks/useIcons';

// Obtener todos los iconos
const { icons, categories, isLoading } = useIcons();

// Filtrar por categoria
const { icons: valoresIcons } = useIconsByCategory('VALORES');

// Buscar iconos
const results = searchIcons('corazon');

// Obtener icono por nombre
const icon = getIconByName('Heart');
```

### Endpoints Backend

```http
GET /api/configuracion/icons/                      # Lista todos
GET /api/configuracion/icons/categories/           # Categorias con conteo
GET /api/configuracion/icons/by_category/?category=VALORES
GET /api/configuracion/icons/search/?q=corazon
POST /api/configuracion/icons/load_system_icons/   # Cargar sistema
```

### Tamaños Estándar

| Tamaño | Clase | Uso |
|--------|-------|-----|
| Small | `size={16}` o `h-4 w-4` | Botones pequeños, badges |
| Default | `size={20}` o `h-5 w-5` | Botones, menús |
| Large | `size={24}` o `h-6 w-6` | Headers, destacados |
| XLarge | `size={32}` o `h-8 w-8` | Cards, features |

### Migracion de Codigo Legacy

```tsx
// PROHIBIDO - Iconos hardcodeados
import { Heart, Shield, Star } from 'lucide-react';

const ICON_MAP = {
  heart: Heart,
  shield: Shield,
  star: Star,
};

<Select>
  <option value="heart">Corazon</option>
  <option value="shield">Escudo</option>
</Select>

{ICON_MAP[item.icon] && createElement(ICON_MAP[item.icon], props)}

// CORRECTO - Sistema dinamico desde BD
import { DynamicIcon, IconPicker } from '@/components/common';

<IconPicker
  value={item.icon_name}
  onChange={(name) => updateItem({ icon_name: name })}
  category="VALORES"
/>

<DynamicIcon name={item.icon_name} {...props} />
```

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

## 10. Dashboard y ModuleCard

### Componente ModuleCard

El componente `ModuleCard` muestra los módulos del sistema en el Dashboard con animaciones interactivas.

```tsx
import { ModuleCard, ModuleGrid, ModuleCardSkeleton } from '@/components/common';

// Grid de módulos con entrada animada
<ModuleGrid>
  {modules.map(module => (
    <ModuleCard
      key={module.code}
      icon={getIconComponent(module.icon)}
      title={module.name}
      description={module.description}
      color={module.color}           // Color dinámico desde API
      sectionsCount={module.tabs?.filter(t => t.is_enabled).length}
      to={getModuleRoute(module)}
    />
  ))}
</ModuleGrid>

// Skeleton mientras carga
{isLoading && (
  <ModuleGrid>
    {Array.from({ length: 6 }).map((_, i) => (
      <ModuleCardSkeleton key={i} />
    ))}
  </ModuleGrid>
)}
```

### Características de ModuleCard

| Característica | Descripción |
|---------------|-------------|
| **Color dinámico** | Recibe color desde la API con mapeo automático |
| **Animación hover** | Elevación, escala y efectos en icono/badge |
| **Responsive** | Grid adaptativo 1→2→3→4 columnas |
| **Dark mode** | Estilos automáticos para tema oscuro |
| **Badge** | Muestra contador de secciones habilitadas |

### Mapeo de Colores

El sistema mapea automáticamente cualquier color de Tailwind a los 10 soportados:

```typescript
// colorMapping en ModuleCard.tsx
amber → orange
cyan → teal
rose → pink
violet → purple
emerald → green
lime → green
slate/stone/zinc/neutral → gray
fuchsia → pink
sky → blue
```

---

## 11. Hook useModuleColor

Hook para obtener el color de un módulo dinámicamente desde la API.

```tsx
import { useModuleColor } from '@/hooks';

const { color, isLoading, module, rawColor } = useModuleColor('GESTION_ESTRATEGICA');

// Usar el color en componentes
<StatsGrid moduleColor={color} stats={stats} />
<DynamicSections moduleColor={color} sections={sections} />

// Debug: ver color raw vs mapeado
console.log(`Raw: ${rawColor}, Mapped: ${color}`); // Raw: violet, Mapped: purple
```

### Retorno del Hook

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `color` | `ModuleColor` | Color mapeado y listo para usar |
| `isLoading` | `boolean` | Estado de carga |
| `module` | `object` | Datos del módulo (id, code, name, category) |
| `rawColor` | `string \| null` | Color original antes de mapear |

---

## 12. PageTabs Mejorado

### Variantes Disponibles

El componente `PageTabs` soporta 3 variantes de diseño:

| Variante | Descripción | Uso recomendado |
|----------|-------------|-----------------|
| `pills` | Contenedor con glassmorphism, shimmer effects | Default, navegación principal |
| `underline` | Clásico con línea inferior | Cuando hay muchos tabs |
| `segmented` | Estilo iOS con background animado | 2-5 tabs, diseño premium |

### Ejemplo de Uso

```tsx
import { PageTabs } from '@/components/layout';
import { Settings, Users, BarChart } from 'lucide-react';

const tabs = [
  { id: 'config', label: 'Configuración', icon: Settings },
  { id: 'team', label: 'Equipo', icon: Users, badge: 5 },
  { id: 'stats', label: 'Estadísticas', icon: BarChart },
];

// Variante Pills (recomendada)
<PageTabs
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  variant="pills"
  moduleColor="purple"  // Color dinámico del módulo
  size="md"             // sm | md | lg
  centered              // Centrar tabs
/>

// Variante Underline (clásica)
<PageTabs
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  variant="underline"
/>

// Variante Segmented (iOS)
<PageTabs
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  variant="segmented"
  centered
/>
```

### Propiedades

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `tabs` | `TabItem[]` | requerido | Array de tabs |
| `activeTab` | `string` | requerido | ID del tab activo |
| `onTabChange` | `(id: string) => void` | requerido | Callback al cambiar |
| `variant` | `'pills' \| 'underline' \| 'segmented'` | `'pills'` | Estilo visual |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño |
| `moduleColor` | `ModuleColor` | `'blue'` | Color del módulo |
| `centered` | `boolean` | `false` | Centrar horizontalmente |

### Interfaz TabItem

```typescript
interface TabItem {
  id: string;           // Identificador único
  label: string;        // Texto del tab
  icon?: LucideIcon;    // Icono opcional
  badge?: string | number; // Badge/contador
  disabled?: boolean;   // Deshabilitar tab
}
```

### Estructura Visual

```
╭──────────────────────────────────────────────────────────────╮
│  ╭───────────────╮  ╭──────────────╮  ╭──────────────╮      │
│  │ 🏢 Config  ✓ │  │ 👥 Equipo  5 │  │ 📊 Stats     │      │
│  ╰───────────────╯  ╰──────────────╯  ╰──────────────╯      │
╰──────────────────────────────────────────────────────────────╯
```

**Características:**
- Glassmorphism (fondo con blur)
- Shimmer effect en hover
- Animaciones de escala (Framer Motion)
- Colores dinámicos por módulo
- Badges con contador
- Soporte dark mode

---

## 13. Data Display Components

Sistema de componentes para mostrar datos estructurados de forma atractiva.

### Componentes

| Componente | Descripción |
|------------|-------------|
| `DataSection` | Contenedor con título, descripción, icono y acción |
| `DataGrid` | Grid responsive para organizar DataCards |
| `DataCard` | Card con header destacado e icono |
| `DataField` | Campo label/valor con estados vacíos |

### Ejemplo de Uso

```tsx
import { DataSection, DataGrid, DataCard, DataField } from '@/components/data-display';
import { Building2, FileText, Phone, Mail, Globe } from 'lucide-react';

<DataSection
  title="Datos de Empresa"
  description="Información registrada"
  icon={Building2}
  iconVariant="purple"
  action={<Button variant="secondary">Editar</Button>}
>
  <DataGrid columns={3} gap="md">
    {/* Card destacada */}
    <DataCard
      title="Identificación Fiscal"
      icon={FileText}
      variant="purple"
      elevated
      accentBorder
    >
      <DataField label="NIT" value="900123456-7" valueVariant="bold" copyable />
      <DataField label="Razón Social" value="Mi Empresa SAS" />
      <DataField label="Nombre Comercial" value={null} emptyText="No registrado" />
    </DataCard>

    {/* Card con campos inline */}
    <DataCard title="Contacto" icon={Phone} variant="green" accentBorder>
      <DataField label="Teléfono" value="300 123 4567" icon={Phone} inline copyable />
      <DataField label="Email" value="contacto@empresa.com" icon={Mail} inline truncate />
      <DataField
        label="Web"
        value={<a href="https://empresa.com" className="text-purple-600 hover:underline">empresa.com</a>}
        icon={Globe}
        inline
      />
    </DataCard>
  </DataGrid>
</DataSection>
```

### DataCard Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | `string` | requerido | Título de la card |
| `icon` | `LucideIcon` | - | Icono del header |
| `variant` | `DataCardVariant` | `'purple'` | Color (purple, blue, green, orange, teal, gray, red, yellow, pink, indigo) |
| `elevated` | `boolean` | `false` | Sombra elevada |
| `accentBorder` | `boolean` | `false` | Línea superior de color |

### DataField Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `label` | `string` | requerido | Etiqueta del campo |
| `value` | `ReactNode` | - | Valor a mostrar |
| `emptyText` | `string` | `'No configurado'` | Texto cuando está vacío |
| `icon` | `LucideIcon` | - | Icono inline |
| `valueVariant` | `'default' \| 'bold' \| 'highlight' \| 'muted'` | `'default'` | Estilo del valor |
| `inline` | `boolean` | `false` | Layout horizontal |
| `truncate` | `boolean` | `false` | Truncar texto largo |
| `copyable` | `boolean` | `false` | Copiar al hacer clic |

### Características

- Bordes de 2px con hover effects sutiles
- Iconos en backgrounds de color con efecto scale en hover
- 10 variantes de color alineadas con módulos
- Estados vacíos elegantes con icono y texto muted
- Dark mode completo
- Accesibilidad (labels semánticos, contraste WCAG AA)

---

## 14. TimeElapsedDisplay

Componente de contador de tiempo transcurrido en tiempo real.

### Variantes

| Variante | Uso |
|----------|-----|
| `inline` | Texto en línea para headers/descripciones |
| `card` | Card completa para dashboards |
| `badge` | Badge compacto para navbars |
| `hero` | Diseño grande para landing pages |

### Ejemplo de Uso

```tsx
import { TimeElapsedDisplay } from '@/components/common';

// Dashboard - Card de antigüedad
<TimeElapsedDisplay
  startDate={new Date('2020-01-15')}
  variant="card"
  label="Operando desde"
  showIcon
  showBadge
  badgeText="Activo"
  format="long"
  granularities={['years', 'months', 'days']}
/>

// Header - Badge compacto
<TimeElapsedDisplay
  startDate={systemStartDate}
  variant="badge"
  format="compact"
  granularities={['days', 'hours']}
/>

// Inline en texto
<TimeElapsedDisplay
  startDate={foundedDate}
  variant="inline"
  label="Fundada hace"
  showIcon
/>
```

### Hook useTimeElapsed

```tsx
import { useTimeElapsed } from '@/hooks';

const { elapsed, formatted, refresh, isValid } = useTimeElapsed({
  startDate: new Date('2020-01-15'),
  updateInterval: 60000,      // Actualizar cada minuto
  granularities: ['years', 'months', 'days'],
  format: 'long',             // 'long' | 'short' | 'compact'
  showZeros: false,
  separator: ', ',
});

// elapsed = { years: 5, months: 11, days: 17, totalDays: 2177, ... }
// formatted = "5 años, 11 meses, 17 días"
```

### Formatos

| Formato | Ejemplo |
|---------|---------|
| `long` | "5 años, 11 meses, 17 días" |
| `short` | "5a 11m 17d" |
| `compact` | "5a 11m 17d" |

### Granularidades

- `years`, `months`, `days`, `hours`, `minutes`, `seconds`
- Combinar según necesidad: `['years', 'months']`, `['days', 'hours', 'minutes']`

---

## 15. Checklist de Implementación

Al crear un nuevo módulo o página:

- [ ] Usar `PageHeader` con título y descripción
- [ ] Implementar tabs si hay submódulos (`PageTabs` con `moduleColor`)
- [ ] Usar `StatsGrid` con `moduleColor` para métricas principales
- [ ] Usar `iconColor` semántico en StatsGrid (info, success, warning, danger)
- [ ] Implementar filtros con `FilterCard`
- [ ] Usar `DataTableCard` para tablas con paginación
- [ ] Usar `DataCard`/`DataField`/`DataGrid` para mostrar datos estructurados
- [ ] Usar `Button variant="secondary"` para botones de edición
- [ ] Usar `Button variant="primary"` para acciones principales
- [ ] Implementar modales del sistema (`FormModal`, `ConfirmModal`, etc.)
- [ ] Usar iconos de Lucide React
- [ ] Soportar dark mode
- [ ] Añadir animaciones con `AnimatedPage`, `AnimatedList`, etc.
- [ ] Manejar estados de carga con `Skeleton` o `PulseLoader`
- [ ] Implementar estados vacíos con `EmptyState`
- [ ] Usar `useModuleColor` para obtener color dinámico del módulo
- [ ] Usar `TimeElapsedDisplay` para contadores de tiempo real

---

## Estructura Canónica de Página de Módulo

> Contenido promovido desde auto-memory `ui-standards.md` (2026-04-08)

Toda página de módulo sigue esta estructura vertical:

```
┌──────────────────────────────────────────────────────────┐
│  PageHeader                                              │
│    title="Gestión Documental"                            │
│    description={activeSectionData.description}           │
├──────────────────────────────────────────────────────────┤
│  DynamicSections                                         │
│    variant="underline"                                   │
│    moduleColor={moduleColor}    ← useModuleColor()       │
│    sections={sections}          ← usePageSections()      │
│    activeSection / onChange                               │
├──────────────────────────────────────────────────────────┤
│  {activeSection &&                                       │
│    <ModuloTab                                            │
│      activeSection={activeSection}                       │
│      onCreateX / onEditX / onViewX / onFirmar / ...     │
│    />                                                    │
│  }                                                       │
├──────────────────────────────────────────────────────────┤
│  Modales globales (flotan fuera del tab):                │
│    FormModal, DetailModal, SignatureModal, ConfirmDialog  │
└──────────────────────────────────────────────────────────┘
```

**Ejemplo real (GestionDocumentalPage.tsx):**
```tsx
const { sections, activeSection, setActiveSection, activeSectionData } =
  usePageSections({ moduleCode: 'gestion_documental', tabCode: 'gestion_documental' });
const { color: moduleColor } = useModuleColor('gestion_documental');

return (
  <div className="space-y-4">
    <PageHeader title="Gestión Documental" description={activeSectionData.description} />
    <DynamicSections sections={sections} activeSection={activeSection}
      onChange={setActiveSection} variant="underline" moduleColor={moduleColor} />
    {activeSection && <GestionDocumentalTab activeSection={activeSection} ... />}
    {/* Modales globales aquí */}
  </div>
);
```

### Tab Router (patrón switch)

El componente Tab recibe `activeSection` y renderiza la sección correcta:

```tsx
switch (normalizedSection) {
  case 'dashboard':     return <DashboardDocumentalSection ... />;
  case 'repositorio':   return <RepositorioSection ... />;
  case 'en_proceso':    return <EnProcesoSection ... />;
  case 'archivo':       return <ArchivoSection ... />;
  case 'configuracion': return <TiposPlantillasSection ... />;
  default:              return <GenericSectionFallback ... />;
}
```

### 3 Tipos de Sección (dentro de un tab)

**Tipo A — Vista CRUD** (repositorio, configuración)
```
┌─ StatsGrid (moduleColor, variant="compact", columns=4)
├─ [Opcional] Panel especial (CoberturaPanel)
├─ Filtros (Input+Select en grid sm:grid-cols-3)
├─ Toolbar (ViewToggle + botones Ingestar/Crear + ExportButton)
├─ Lista (cards o list según ViewToggle)
└─ Modales al fondo (FormModal, ConfirmDialog, IngestarModal)
```

**Tipo B — Vista workflow** (en_proceso)
```
┌─ PageTabs internas (variant="underline", moduleColor)
│   sub-tabs: Firmas Pendientes | Borradores | En Revisión
├─ Lista filtrada por estado
│   Card con: título, código, estado badge, días pendiente
│   Botones: Ver, Editar, Firmar/Rechazar
└─ Sin StatsGrid (las métricas van en Dashboard)
```

**Tipo C — Vista dashboard** (dashboard)
```
┌─ StatsGrid (6 métricas: total, vigentes, borradores, revisión, score, cobertura)
├─ Urgentes (firmas mi turno, revisiones vencidas)
├─ Score de cumplimiento global
├─ CoberturaPanel
└─ Accesos rápidos ("Ir a Repositorio", "Ver firmas pendientes")
```

### Modales — Patrón

Los modales viven en la **página** (no en la sección), para que cualquier tab pueda abrirlos:

```tsx
// EN LA PÁGINA (GestionDocumentalPage.tsx):
const [documentoFormModal, setDocumentoFormModal] = useState({ isOpen: false, documentoId: undefined });

// SE PASAN COMO CALLBACKS AL TAB:
<GestionDocumentalTab
  onCreateDocumento={() => setDocumentoFormModal({ isOpen: true })}
  onEditDocumento={(id) => setDocumentoFormModal({ isOpen: true, documentoId: id })}
/>

// Y SE RENDERIZAN FUERA DEL TAB:
<DocumentoFormModal isOpen={...} onClose={...} documentoId={...} />
```

### Flujo de Colores (3 capas)

```
CAPA 1 — Branding tenant (CSS vars dinámicas)
  bg-primary-600, text-primary-700, border-primary-300
  → Vienen de useBrandingConfig() → useDynamicTheme() → --color-primary-*

CAPA 2 — Color módulo (prop moduleColor)
  StatsGrid moduleColor="indigo"
  PageTabs moduleColor="indigo"
  → Viene de useModuleColor('gestion_documental') → 'indigo'

CAPA 3 — Estados fijos (Tailwind estáticos, NO cambian por tenant)
  success=verde, warning=amarillo, danger=rojo, info=azul, gray=neutro
  → Se usan SOLO en Badge variant, NO en layouts
```
