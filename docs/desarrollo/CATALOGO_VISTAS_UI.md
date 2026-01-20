# Catálogo de Vistas UI - StrateKaz

**Versión:** 1.0
**Fecha:** 2026-01-20
**Autor:** Equipo de Desarrollo

---

## Introducción

Este documento define los tipos de vista estándar del sistema StrateKaz. Cada vista tiene una estructura predefinida que garantiza consistencia visual y de experiencia de usuario en toda la aplicación.

### Principios de Diseño

1. **Consistencia:** Todas las páginas deben seguir uno de los tipos de vista definidos
2. **Jerarquía visual:** La información se organiza de arriba hacia abajo por importancia
3. **Espaciado:** Usar `space-y-6` entre secciones principales
4. **Componentes:** Usar exclusivamente componentes del Design System

---

## Vista 1: Cards de Información (Entity Detail View)

### Propósito

Mostrar información detallada de una **entidad única** o **configuración singleton**. Ideal para páginas de visualización donde el usuario necesita ver y potencialmente editar datos agrupados por categoría.

### Cuándo Usar

- Detalle de configuración de empresa
- Perfil de usuario
- Configuración de una sede específica
- Cualquier entidad que se muestra individualmente (no en lista)

### Ejemplos en el Sistema

- `ConfiguracionPage > Empresa` - Datos de la empresa
- `ConfiguracionPage > Branding` - Identidad visual
- `PerfilPage` - Información del usuario

---

### Estructura Visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PAGE HEADER                                                              │
│ ┌─────────────────────────────┐              ┌────────────────────────────┐ │
│ │ Título de la Página         │              │ [Sec1] [Sec2] [Sec3] [Sec4]│ │
│ │ Subtítulo/Descripción       │              └────────────────────────────┘ │
│ └─────────────────────────────┘              (Contenedor con secciones)     │
│                                                                             │
│ (Por fuera de cualquier contenedor)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. STATS GRID (Opcional - Solo si aporta valor)                             │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐             │
│ │ Estado           │ │ Antigüedad       │ │ Completitud      │             │
│ │ Configurada  [✓] │ │ Reciente    [📅] │ │ 12/12       [📄] │             │
│ │                  │ │                  │ │ 100% campos req. │             │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. SECTION HEADER (Por fuera de cualquier contenedor)                       │
│                                                                             │
│ [📄] Título de la Sección                                   [✏️ Editar]    │
│      Descripción de la sección                                              │
│                                                                             │
│ (Izquierda: Icono + Título + Subtítulo)  (Derecha: Botones de acción)      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. CONTENT CARDS (Información agrupada en cards)                            │
│                                                                             │
│ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐    │
│ │ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ │ │ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ │ │ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ │    │
│ │ [📋] GRUPO 1        │ │ [👤] GRUPO 2        │ │ [📞] GRUPO 3        │    │
│ │ ─────────────────── │ │ ─────────────────── │ │ ─────────────────── │    │
│ │ Campo 1: Valor      │ │ Campo 1: Valor      │ │ Campo 1: Valor      │    │
│ │ Campo 2: Valor      │ │ Campo 2: Valor      │ │ Campo 2: Valor      │    │
│ │ Campo 3: Valor      │ │ Campo 3: Valor      │ │ Campo 3: Valor      │    │
│ │ Campo 4: Valor      │ │ Campo 4: Valor      │ │ Campo 4: Valor      │    │
│ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘    │
│                                                                             │
│ (Cards con borde superior de color, icono en header, campos label:valor)    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. FOOTER INFO (Alineado a la derecha)                                      │
│                                                                             │
│                                    Última actualización: 19/01/2026 11:30   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Componentes Utilizados

| # | Zona | Componente | Ubicación | Props Principales |
|---|------|------------|-----------|-------------------|
| 1 | Page Header | `PageHeader` | `@/components/layout` | `title`, `description`, `sections`, `activeSection`, `onSectionChange`, `moduleColor` |
| 2 | Stats Grid | `StatsGrid` | `@/components/layout` | `stats`, `columns`, `moduleColor` |
| 3 | Section Header | `DataSection` | `@/components/data-display` | `icon`, `title`, `description`, `iconVariant`, `action` |
| 4 | Content Grid | `DataGrid` | `@/components/data-display` | `columns`, `gap`, `children` |
| 5 | Content Cards | `DataCard` | `@/components/data-display` | `title`, `icon`, `variant`, `elevated`, `accentBorder` |
| 6 | Card Fields | `DataField` | `@/components/data-display` | `label`, `value`, `icon`, `inline`, `copyable`, `emptyText` |
| 7 | Footer Info | Inline JSX | N/A | `updated_at`, `updated_by_name` (formato libre) |

---

### Anatomía Detallada

#### 1. Page Header

```tsx
<PageHeader
  title="Configuración"
  description="Información general de la empresa"
  sections={sections}           // Desde usePageSections()
  activeSection={activeSection}
  onSectionChange={setActiveSection}
  moduleColor="purple"
/>
```

**Reglas:**
- Título: Nombre de la página/módulo
- Descripción: Cambia según la sección activa
- Secciones: Siempre en contenedor visual a la derecha
- Sin acciones en este nivel (van en Section Header)

---

#### 2. Stats Grid (Opcional)

```tsx
<StatsGrid
  stats={[
    {
      label: 'Estado',
      value: 'Configurada',
      icon: CheckCircle,
      iconColor: 'success'
    },
    {
      label: 'Antigüedad',
      value: 'Reciente',
      icon: Calendar,
      iconColor: 'info'
    },
    {
      label: 'Completitud',
      value: '12/12',
      icon: FileText,
      iconColor: 'primary',
      description: '100% de campos requeridos'
    },
  ]}
  columns={3}
  moduleColor="purple"
/>
```

**Reglas:**
- **Solo incluir si aporta valor real** a la comprensión de la entidad
- Máximo 4 stats
- Usar iconos significativos
- Incluir `description` cuando el valor necesita contexto

**Cuándo incluir Stats:**
- ✅ Estado de configuración (completo/incompleto)
- ✅ Métricas de progreso
- ✅ Información temporal relevante
- ❌ Datos que ya están en los cards
- ❌ Información redundante

---

#### 3. Section Header

```tsx
<SectionHeader
  icon={FileText}
  title="Datos Fiscales y Legales"
  subtitle="Información registrada de la empresa"
  actions={
    <Button variant="outline" onClick={handleEdit}>
      <Pencil className="h-4 w-4 mr-2" />
      Editar
    </Button>
  }
/>
```

**Estructura visual:**
```
[📄] Datos Fiscales y Legales                              [✏️ Editar]
     Información registrada de la empresa
```

**Reglas:**
- **Por fuera de cualquier Card** (no encapsulado)
- Icono a la izquierda del título
- Subtítulo en texto secundario
- Botones de acción a la derecha
- Usar `space-y-6` antes del siguiente elemento

---

#### 4. Content Cards (Info Cards)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <InfoCard
    title="IDENTIFICACIÓN FISCAL"
    icon={FileText}
    color="purple"  // Color del borde superior
    fields={[
      { label: 'NIT', value: '801416200-9' },
      { label: 'Razón Social', value: 'Palmicultores del Norte S.A.S' },
      { label: 'Nombre Comercial', value: 'Palnorte' },
      { label: 'Tipo de Sociedad', value: 'Sociedad por Acciones Simplificada (S.A.S.)' },
    ]}
  />

  <InfoCard
    title="REPRESENTANTE LEGAL"
    icon={User}
    color="blue"
    fields={[
      { label: 'Nombre Completo', value: 'Mauricio' },
      { label: 'Cédula', value: '80234568' },
      { label: 'Actividad Económica (CIIU)', value: '1011' },
    ]}
  />

  <InfoCard
    title="INFORMACIÓN DE CONTACTO"
    icon={Phone}
    color="green"
    fields={[
      { label: 'Teléfono Principal', value: '3114567856', icon: Phone },
      { label: 'Teléfono Secundario', value: 'No configurado', isEmpty: true },
      { label: 'Email Corporativo', value: 'info@palnorte.com', icon: Mail },
      { label: 'Sitio Web', value: 'https://www.stratekaz.com', icon: Globe, isLink: true },
    ]}
  />
</div>
```

**Anatomía de InfoCard:**
```
┌─────────────────────────────────────┐
│ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ │  ← Borde superior de color
│ [📋] TÍTULO DEL GRUPO               │  ← Icono + Título en mayúsculas
│ ─────────────────────────────────── │  ← Separador
│ LABEL 1                             │
│ Valor del campo 1                   │
│                                     │
│ LABEL 2                             │
│ Valor del campo 2                   │
│                                     │
│ LABEL 3                      [📞]   │  ← Campo con icono de acción
│ valor@ejemplo.com                   │
└─────────────────────────────────────┘
```

**Reglas:**
- Grid de 1-3 columnas según breakpoint
- Borde superior con color del grupo
- Título en mayúsculas
- Labels en texto secundario pequeño (uppercase)
- Valores en texto principal
- Campos vacíos: mostrar "No configurado" en gris claro
- Links: color primario con icono

---

#### 5. Footer Info

```tsx
<div className="flex justify-end">
  <UpdateInfo
    timestamp="2026-01-19T11:30:00Z"
    label="Última actualización"
  />
</div>
```

**Reglas:**
- Siempre alineado a la derecha
- Formato de fecha localizado
- Opcional: mostrar usuario que actualizó

---

### Código de Ejemplo Completo

```tsx
// EmpresaSection.tsx - Vista 1: Cards de Información

import { DataSection, DataGrid, DataCard, DataField } from '@/components/data-display';
import { FileText, User, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/common';

export function EmpresaSection() {
  const { empresa } = useEmpresaConfig();

  return (
    <DataSection
      title="Datos Fiscales y Legales"
      description="Información registrada de la empresa"
      icon={Building2}
      iconVariant="purple"
      action={
        <Button variant="secondary" size="sm" onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      }
    >
      <DataGrid columns={3} gap="md">
        {/* Card 1: Identificación Fiscal */}
        <DataCard
          title="Identificación Fiscal"
          icon={FileText}
          variant="purple"
          elevated
          accentBorder
        >
          <DataField label="NIT" value={empresa.nit} valueVariant="bold" copyable />
          <DataField label="Razón Social" value={empresa.razon_social} valueVariant="bold" />
          <DataField label="Nombre Comercial" value={empresa.nombre_comercial} emptyText="No registrado" />
          <DataField label="Tipo de Sociedad" value={empresa.tipo_sociedad_display} />
        </DataCard>

        {/* Card 2: Representante Legal */}
        <DataCard title="Representante Legal" icon={User} variant="blue" accentBorder>
          <DataField label="Nombre Completo" value={empresa.representante_legal} valueVariant="bold" />
          <DataField label="Cédula" value={empresa.cedula_representante} copyable />
          <DataField label="Actividad Económica (CIIU)" value={empresa.actividad_economica} />
        </DataCard>

        {/* Card 3: Información de Contacto */}
        <DataCard title="Información de Contacto" icon={Phone} variant="green" accentBorder>
          <DataField label="Teléfono Principal" value={empresa.telefono_principal} icon={Phone} inline copyable />
          <DataField label="Email Corporativo" value={empresa.email_corporativo} icon={Mail} inline copyable />
          <DataField
            label="Sitio Web"
            value={
              empresa.sitio_web ? (
                <a href={empresa.sitio_web} target="_blank" rel="noopener noreferrer"
                   className="text-purple-600 dark:text-purple-400 hover:underline">
                  {empresa.sitio_web}
                </a>
              ) : null
            }
            icon={Globe}
            inline
          />
        </DataCard>
      </DataGrid>

      {/* Footer: Última actualización */}
      {empresa.updated_at && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-right pt-4">
          Última actualización: {new Date(empresa.updated_at).toLocaleString('es-CO')}
          {empresa.updated_by_name && ` por ${empresa.updated_by_name}`}
        </div>
      )}
    </DataSection>
  );
}
```

---

### Variaciones

#### Variación 1A: Sin Stats Grid

Cuando los stats no aportan valor, se omiten completamente:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION HEADER                                              [Editar]        │
├─────────────────────────────────────────────────────────────────────────────┤
│ CONTENT CARDS                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER INFO                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Variación 1B: Múltiples Secciones de Cards

Cuando hay múltiples grupos de información:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ STATS GRID                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION HEADER 1: Datos Fiscales                            [Editar]        │
├─────────────────────────────────────────────────────────────────────────────┤
│ CONTENT CARDS (Grupo 1)                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION HEADER 2: Configuración Regional                    [Editar]        │
├─────────────────────────────────────────────────────────────────────────────┤
│ CONTENT CARDS (Grupo 2)                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER INFO                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Checklist de Implementación

- [ ] Page Header con título y descripción
- [ ] Secciones en contenedor (si aplica)
- [ ] Stats Grid solo si aporta valor
- [ ] Section Header por fuera de cards
- [ ] Botón de acción en Section Header
- [ ] Cards en grid responsivo (1-3 columnas)
- [ ] Cada card con borde de color
- [ ] Labels en uppercase
- [ ] Valores vacíos manejados
- [ ] Footer con última actualización
- [ ] Espaciado `space-y-6` entre secciones

---

## Vista 2: Lista CRUD (Table View)

### Propósito

Mostrar una **lista de entidades** con capacidad de crear, editar y eliminar. Ideal para gestionar colecciones de datos como sedes, usuarios, productos, etc.

### Cuándo Usar

- Listado de sedes/ubicaciones
- Gestión de usuarios/empleados
- Catálogos (unidades de medida, consecutivos)
- Cualquier entidad que se gestiona en formato tabla

### Ejemplos en el Sistema

- `ConfiguracionPage > Sedes` - Lista de sedes de la empresa
- `OrganizacionTab > Áreas` - Áreas organizacionales
- `OrganizacionTab > Consecutivos` - Configuración de consecutivos

---

### Estructura Visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PAGE HEADER                                                              │
│ ┌─────────────────────────────┐              ┌────────────────────────────┐ │
│ │ Título de la Página         │              │ [Sec1] [Sec2] [Sec3] [Sec4]│ │
│ │ Subtítulo/Descripción       │              └────────────────────────────┘ │
│ └─────────────────────────────┘              (Contenedor con secciones)     │
│                                                                             │
│ (Por fuera de cualquier contenedor)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. STATS GRID (Opcional - Solo si aporta valor)                             │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐             │
│ │ Total            │ │ Activas          │ │ Inactivas        │             │
│ │ 5 sedes     [📍] │ │ 4          [✓]   │ │ 1           [○]  │             │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. SECTION HEADER (Por fuera de cualquier contenedor)                       │
│                                                                             │
│ [📍] Sedes y Ubicaciones                               [+ Agregar Sede]    │
│      5 sedes configuradas                                                   │
│                                                                             │
│ (Izquierda: Icono + Título + Contador)  (Derecha: Botón de crear)          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. DATA TABLE (Tabla con datos y acciones)                                  │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Sede          │ Tipo      │ Ubicación       │ Estado   │ Acciones    │  │
│ ├───────────────┼───────────┼─────────────────┼──────────┼─────────────┤  │
│ │ [🏢] Nombre   │ Principal │ Ciudad, Depto   │ [Activa] │ [✏️] [🗑️]  │  │
│ │      Código   │           │                 │          │             │  │
│ ├───────────────┼───────────┼─────────────────┼──────────┼─────────────┤  │
│ │ [🏢] Nombre 2 │ Sucursal  │ Ciudad, Depto   │ [Activa] │ [✏️] [🗑️]  │  │
│ │      Código   │           │                 │          │             │  │
│ └───────────────┴───────────┴─────────────────┴──────────┴─────────────┘  │
│                                                                             │
│ (Tabla con hover, headers en gris, acciones alineadas a la derecha)        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. EMPTY STATE (Cuando no hay datos)                                        │
│                                                                             │
│                          [🏢]                                               │
│                   No hay sedes configuradas                                 │
│              Agregue la primera sede para comenzar.                         │
│                     [+ Agregar Primera Sede]                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Componentes Utilizados

| # | Zona | Componente | Ubicación | Props Principales |
|---|------|------------|-----------|-------------------|
| 1 | Page Header | `PageHeader` | `@/components/layout` | `title`, `description`, `sections`, `moduleColor` |
| 2 | Stats Grid | `StatsGrid` | `@/components/layout` | `stats`, `columns`, `moduleColor` |
| 3 | Section Header | Inline JSX o `DataSection` | N/A | Icono + Título + Subtítulo + Botón |
| 4 | Data Table | `DataTableCard` o tabla nativa | `@/components/layout` | `pagination`, `children` |
| 5 | Acciones | `ActionButtons` | `@/components/common` | `module`, `section`, `onEdit`, `onDelete` |
| 6 | Empty State | Inline JSX | N/A | Icono centrado + mensaje + botón CTA |
| 7 | Modal | `BaseModal` / Custom Modal | `@/components/modals` | `isOpen`, `onClose`, `title` |
| 8 | Confirmación | `ConfirmDialog` | `@/components/common` | `isOpen`, `onConfirm`, `title`, `message` |

---

### Anatomía Detallada

#### 1. Section Header con Acción

```tsx
<div className="flex items-center justify-between mb-6">
  {/* Izquierda: Icono + Título + Contador */}
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
      <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Sedes y Ubicaciones
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {sedes.length} sede{sedes.length !== 1 ? 's' : ''} configurada{sedes.length !== 1 ? 's' : ''}
      </p>
    </div>
  </div>

  {/* Derecha: Botón de crear */}
  {canDo(Modules.MODULE, Sections.SECTION, 'create') && (
    <Button variant="primary" size="sm" onClick={handleAdd}>
      <Plus className="h-4 w-4 mr-2" />
      Agregar Sede
    </Button>
  )}
</div>
```

**Reglas:**
- Icono en contenedor con fondo de color del módulo
- Título en `font-semibold`
- Subtítulo como contador de items
- Botón primario para crear, con icono `Plus`
- Verificar permisos antes de mostrar botón

---

#### 2. Data Table

```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-gray-200 dark:border-gray-700">
        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
          Columna 1
        </th>
        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
          Columna 2
        </th>
        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
          Acciones
        </th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr
          key={item.id}
          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <td className="py-3 px-4">
            {/* Contenido con icono opcional */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {item.nombre}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 block">
                  {item.codigo}
                </span>
              </div>
            </div>
          </td>
          <td className="py-3 px-4">
            <Badge variant="gray" size="sm">{item.tipo}</Badge>
          </td>
          <td className="py-3 px-4 text-right">
            <ActionButtons
              module={Modules.MODULE}
              section={Sections.SECTION}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
              size="sm"
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Reglas de la Tabla:**
- Headers en `text-gray-500` con `font-medium`
- Filas con `hover:bg-gray-50`
- Bordes sutiles entre filas
- Columna de acciones alineada a la derecha
- Primera columna puede tener icono + texto principal + subtexto
- Usar `Badge` para estados y tipos

---

#### 3. Empty State

```tsx
{items.length === 0 && (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
      <Building2 className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      No hay sedes configuradas
    </h3>
    <p className="text-gray-500 dark:text-gray-400 mb-4">
      Agregue la primera sede de su empresa para comenzar.
    </p>
    {canDo(Modules.MODULE, Sections.SECTION, 'create') && (
      <Button variant="primary" onClick={handleAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar Primera Sede
      </Button>
    )}
  </div>
)}
```

**Reglas:**
- Icono grande centrado en círculo gris
- Título descriptivo
- Mensaje de ayuda
- Botón CTA para crear el primero
- Verificar permisos

---

#### 4. Acciones y Modales

```tsx
{/* Modal de formulario */}
<FormModal
  item={selectedItem}
  isOpen={showModal}
  onClose={() => {
    setShowModal(false);
    setSelectedItem(null);
  }}
/>

{/* Diálogo de confirmación */}
<ConfirmDialog
  isOpen={showDeleteDialog}
  onClose={() => setShowDeleteDialog(false)}
  onConfirm={handleConfirmDelete}
  title="Eliminar Item"
  message={`¿Está seguro de eliminar "${itemToDelete?.nombre}"?`}
  confirmText="Eliminar"
  confirmVariant="danger"
  isLoading={deleteMutation.isPending}
/>
```

---

### Código de Ejemplo Completo

```tsx
// SedesSection.tsx - Vista 2: Lista CRUD

import { useState } from 'react';
import { Plus, MapPin, Building2 } from 'lucide-react';
import { Card, Badge, Button } from '@/components/common';
import { ActionButtons } from '@/components/common/ActionButtons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

export function SedesSection() {
  const { canDo } = usePermissions();
  const { data: sedesData, isLoading } = useSedes();
  const deleteMutation = useDeleteSede();

  const [showModal, setShowModal] = useState(false);
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sedeToDelete, setSedeToDelete] = useState<Sede | null>(null);

  const sedes = sedesData?.results || [];

  const handleEdit = (sede: Sede) => {
    setSelectedSede(sede);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedSede(null);
    setShowModal(true);
  };

  const handleDeleteClick = (sede: Sede) => {
    setSedeToDelete(sede);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <Card>
        <div className="p-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Sedes y Ubicaciones
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {sedes.length} sede{sedes.length !== 1 ? 's' : ''} configurada{sedes.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {canDo(Modules.GESTION_ESTRATEGICA, Sections.SEDES, 'create') && (
              <Button variant="primary" size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Sede
              </Button>
            )}
          </div>

          {/* Data Table o Empty State */}
          {sedes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Sede</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ubicación</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Estado</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sedes.map((sede) => (
                    <tr key={sede.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100">
                            <Building2 className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <span className="font-medium">{sede.nombre}</span>
                            <span className="text-sm text-gray-500 block">{sede.codigo}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="gray" size="sm">{sede.tipo_display}</Badge>
                      </td>
                      <td className="py-3 px-4">{sede.ciudad}, {sede.departamento}</td>
                      <td className="py-3 px-4">
                        <Badge variant={sede.is_active ? 'success' : 'gray'} size="sm">
                          {sede.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ActionButtons
                          module={Modules.GESTION_ESTRATEGICA}
                          section={Sections.SEDES}
                          onEdit={() => handleEdit(sede)}
                          onDelete={() => handleDeleteClick(sede)}
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No hay sedes configuradas</h3>
              <p className="text-gray-500 mb-4">Agregue la primera sede para comenzar.</p>
              <Button variant="primary" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Sede
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Modales */}
      <SedeFormModal isOpen={showModal} sede={selectedSede} onClose={() => setShowModal(false)} />
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Sede"
        message={`¿Eliminar "${sedeToDelete?.nombre}"?`}
        confirmVariant="danger"
      />
    </>
  );
}
```

---

### Variaciones

#### Variación 2A: Con Filtros

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILTER CARD                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [🔍 Buscar...]  [Estado ▼]  [Tipo ▼]  [Fecha ▼]     [Limpiar filtros]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION HEADER                                             [+ Crear]        │
├─────────────────────────────────────────────────────────────────────────────┤
│ DATA TABLE                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ PAGINATION                                                                  │
│                                    [< Anterior]  Página 1 de 5  [Siguiente >]│
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Variación 2B: Con Paginación

Usar `DataTableCard` con prop `pagination`:

```tsx
<DataTableCard
  pagination={{
    currentPage: page,
    pageSize: 10,
    totalItems: total,
    hasNext: hasNextPage,
    hasPrevious: hasPreviousPage,
    onPageChange: setPage,
  }}
>
  <table>...</table>
</DataTableCard>
```

---

### Checklist de Implementación

- [ ] Page Header con título y secciones
- [ ] Stats Grid solo si aporta valor
- [ ] Section Header con icono, título, contador
- [ ] Botón de crear verificando permisos
- [ ] Tabla con headers en gris
- [ ] Filas con hover effect
- [ ] Primera columna con icono + nombre + código
- [ ] Badges para estados y tipos
- [ ] ActionButtons con permisos
- [ ] Empty state con icono, mensaje y CTA
- [ ] Modal de formulario (crear/editar)
- [ ] ConfirmDialog para eliminar
- [ ] Loading skeleton
- [ ] Espaciado `space-y-6` entre secciones

## Vista 3: Panel de Activación (Toggle Grid)

### Propósito

Mostrar una **lista de entidades activables/desactivables** organizadas por categorías. Ideal para gestión de módulos, features, permisos o configuraciones que pueden habilitarse/deshabilitarse.

### Cuándo Usar

- Gestión de módulos del sistema
- Configuración de features por tenant
- Permisos y roles (activar/desactivar capacidades)
- Configuraciones de interfaz (UI Settings)
- Cualquier lista de items con estado on/off

### Ejemplos en el Sistema

- `ConfiguracionPage > Módulos` - Activación de módulos del sistema
- `ConfiguracionPage > Módulos > UI Settings` - Configuraciones de interfaz

---

### Estructura Visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PAGE HEADER                                                              │
│ ┌─────────────────────────────────┐            ┌────────────────────────┐   │
│ │ Título de la Página             │            │ [Sec1] [Sec2] [Sec3]   │   │
│ │ Subtítulo/Descripción           │            └────────────────────────┘   │
│ └─────────────────────────────────┘            (Contenedor con secciones)   │
│                                                                             │
│ (Por fuera de cualquier contenedor)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. ALERT INFORMATIVA (Opcional)                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ℹ️ Los módulos controlan qué funcionalidades están disponibles...       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. CATEGORY CARD (Repetir por cada categoría)                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [📦] Categoría Principal                                                │ │
│ │      3 módulos disponibles                                              │ │
│ │ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐      │ │
│ │ │ [🏢] Módulo 1     │ │ [📋] Módulo 2     │ │ [⚙️] Módulo 3     │      │ │
│ │ │ Descripción...    │ │ Descripción...    │ │ Descripción... 🔒 │      │ │
│ │ │            [🔘]   │ │            [🔘]   │ │            [🔘]   │      │ │
│ │ └───────────────────┘ └───────────────────┘ └───────────────────┘      │ │
│ │                                                                         │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │ [⚙️] Tabs de Módulo 1                                            [2/3] │ │
│ │      ┌──────────────────────────────────────────────────────────────┐  │ │
│ │      │ [📄] Tab 1              Descripción del tab           [🔘]  │  │ │
│ │      └──────────────────────────────────────────────────────────────┘  │ │
│ │          ┌──────────────────────────────────────────────────────────┐  │ │
│ │          │ [📌] Sección 1.1    Descripción de sección        [🔘]  │  │ │
│ │          └──────────────────────────────────────────────────────────┘  │ │
│ │          ┌──────────────────────────────────────────────────────────┐  │ │
│ │          │ [📌] Sección 1.2    Descripción de sección        [🔘]  │  │ │
│ │          └──────────────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. UI SETTINGS CARD (Opcional - Configuraciones adicionales)                │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [🖥️] Configuración de Interfaz                                          │ │
│ │      Preferencias de visualización                                      │ │
│ │ ┌──────────────────────────────────────────────────────────────────┐   │ │
│ │ │ [📋] Sidebar Colapsado    Iniciar con sidebar colapsado   [🔘]  │   │ │
│ │ └──────────────────────────────────────────────────────────────────┘   │ │
│ │ ┌──────────────────────────────────────────────────────────────────┐   │ │
│ │ │ [🌙] Modo Oscuro          Habilitar modo oscuro           [🔘]  │   │ │
│ │ └──────────────────────────────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Componentes Utilizados

| # | Zona | Componente | Ubicación | Props Principales |
|---|------|------------|-----------|-------------------|
| 1 | Page Header | `PageHeader` | `@/components/layout` | `title`, `description`, `sections`, `moduleColor` |
| 2 | Alert | `Alert` | `@/components/common` | `variant="info"`, `message` |
| 3 | Category Card | `Card` | `@/components/common` | Contenedor con `p-6` |
| 4 | Category Header | Inline JSX | N/A | Icono + Título + Contador |
| 5 | Toggle Grid | `FeatureToggleGrid` | `@/components/common` | `columns` (1-3) |
| 6 | Toggle Card | `FeatureToggleCard` | `@/components/common` | `icon`, `title`, `description`, `checked`, `onChange`, `color`, `layout` |
| 7 | Sub-items | `FeatureToggleCard` | `@/components/common` | `layout="row"` para tabs/secciones |
| 8 | Badge | `Badge` | `@/components/common` | Para indicadores (Core, contadores) |
| 9 | Confirm Dialog | `ConfirmDialog` | `@/components/common` | Para confirmación de desactivación |

---

### Anatomía Detallada

#### 1. Category Card Header

```tsx
<Card>
  <div className="p-6">
    {/* Header de categoría */}
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2 rounded-lg ${categoryBgColor}`}>
        <Package className={`h-5 w-5 ${categoryTextColor}`} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {categoryLabel}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {modules.length} módulo{modules.length !== 1 ? 's' : ''} disponible{modules.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>

    {/* Grid de módulos */}
    <FeatureToggleGrid columns={3}>
      {/* FeatureToggleCards */}
    </FeatureToggleGrid>
  </div>
</Card>
```

**Reglas:**
- Header dentro del Card (no fuera como en Vista 2)
- Icono con color de la categoría
- Contador de elementos en el subtítulo
- Separación `mb-6` entre header y grid

---

#### 2. FeatureToggleCard (Layout Card)

```tsx
<FeatureToggleCard
  icon={IconComponent}
  title={
    <span className="flex items-center gap-2">
      {module.name}
      {module.is_core && (
        <Badge variant="gray" size="sm">
          <Lock className="h-3 w-3" />
          Core
        </Badge>
      )}
    </span>
  }
  description={module.description || `Módulo ${module.name}`}
  checked={module.is_enabled}
  onChange={() => handleToggle(module)}
  color={module.color}
  disabled={!canEdit || module.is_core || isPending}
/>
```

**Reglas:**
- Layout `card` para grids de módulos (por defecto)
- Badge "Core" para módulos que no pueden desactivarse
- Color dinámico según el módulo/categoría
- Deshabilitado si es core, sin permisos o hay operación pendiente

---

#### 3. Sub-items (Tabs y Secciones)

```tsx
{/* Separador y header de tabs */}
<div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
  <div className="flex items-center gap-2 mb-4">
    <Settings2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
      Tabs de {module.name}
    </h4>
    <Badge variant="gray" size="sm">
      {module.enabled_tabs_count}/{module.total_tabs_count}
    </Badge>
  </div>

  {/* Lista de tabs con layout row */}
  <div className="space-y-3 ml-6">
    {module.tabs.map((tab) => (
      <div key={tab.id} className="space-y-2">
        <FeatureToggleCard
          layout="row"
          icon={TabIcon}
          title={tab.name}
          description={tab.description}
          checked={tab.is_enabled}
          onChange={() => toggleTab(tab)}
          color={module.color}
          disabled={!canEdit || !module.is_enabled}
        />

        {/* Secciones anidadas */}
        {tab.sections.length > 0 && (
          <div className="ml-8 space-y-2">
            {tab.sections.map((section) => (
              <FeatureToggleCard
                key={section.id}
                layout="row"
                icon={SectionIcon}
                title={section.name}
                description={section.description}
                checked={section.is_enabled}
                onChange={() => toggleSection(section)}
                color={module.color}
                disabled={!canEdit || !tab.is_enabled}
              />
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
</div>
```

**Reglas:**
- Layout `row` para elementos anidados (más compacto)
- Indentación progresiva: `ml-6` para tabs, `ml-8` para secciones
- Badge con contador `enabled/total`
- Deshabilitado si el padre está desactivado

---

#### 4. Confirmación de Desactivación

```tsx
<ConfirmDialog
  isOpen={!!moduleToDisable}
  onClose={() => setModuleToDisable(null)}
  onConfirm={confirmDisable}
  title={`Desactivar ${moduleToDisable?.name}`}
  message={
    <div className="space-y-3">
      <p className="text-amber-600 dark:text-amber-400 font-medium">
        {dependentsInfo.warning_message}
      </p>
      {dependentsInfo.children.tabs.enabled > 0 && (
        <p className="text-sm text-gray-600">
          • {dependentsInfo.children.tabs.enabled} tab(s) serán desactivados
        </p>
      )}
      {dependentsInfo.dependents.enabled.length > 0 && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
          <p className="text-sm font-medium text-red-700">
            Módulos dependientes afectados:
          </p>
          <ul className="list-disc list-inside text-sm text-red-600">
            {dependentsInfo.dependents.enabled.map((dep) => (
              <li key={dep.id}>{dep.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  }
  confirmText="Desactivar"
  confirmVariant="destructive"
  isLoading={isPending}
/>
```

**Reglas:**
- Mostrar confirmación solo al desactivar (activar es directo)
- Mostrar dependencias afectadas
- Usar `confirmVariant="destructive"` para acciones destructivas

---

### Código de Ejemplo Completo

```tsx
// ModulosSection.tsx - Vista 3: Panel de Activación

import { useState, useMemo } from 'react';
import { Package, Settings2, Lock } from 'lucide-react';
import { Card, Badge, Alert, FeatureToggleCard, FeatureToggleGrid, ConfirmDialog } from '@/components/common';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

export function ModulosSection() {
  const { canDo } = usePermissions();
  const { data: tree, isLoading } = useModulesTree();
  const toggleModule = useToggleModule();

  const [moduleToDisable, setModuleToDisable] = useState(null);
  const canEdit = canDo(Modules.GESTION_ESTRATEGICA, Sections.MODULOS, 'edit');

  // Agrupar por categoría
  const modulesByCategory = useMemo(() => {
    if (!tree) return {};
    return tree.modules.reduce((acc, module) => {
      const cat = module.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(module);
      return acc;
    }, {});
  }, [tree]);

  const handleToggle = (module) => {
    if (module.is_enabled) {
      setModuleToDisable(module); // Confirmar desactivación
    } else {
      toggleModule.mutate({ id: module.id, isEnabled: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert informativa */}
      <Alert
        variant="info"
        message="Los módulos controlan qué funcionalidades están disponibles. Los cambios se aplican inmediatamente."
      />

      {/* Cards por categoría */}
      {Object.entries(modulesByCategory).map(([category, modules]) => (
        <Card key={category}>
          <div className="p-6">
            {/* Header de categoría */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {CATEGORY_LABELS[category]}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {modules.length} módulo{modules.length !== 1 ? 's' : ''} disponible{modules.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Grid de módulos */}
            <FeatureToggleGrid columns={3}>
              {modules.map((module) => (
                <FeatureToggleCard
                  key={module.id}
                  icon={getIcon(module.icon)}
                  title={
                    <span className="flex items-center gap-2">
                      {module.name}
                      {module.is_core && (
                        <Badge variant="gray" size="sm">
                          <Lock className="h-3 w-3" /> Core
                        </Badge>
                      )}
                    </span>
                  }
                  description={module.description}
                  checked={module.is_enabled}
                  onChange={() => handleToggle(module)}
                  color={module.color}
                  disabled={!canEdit || module.is_core}
                />
              ))}
            </FeatureToggleGrid>

            {/* Sub-items: Tabs y Secciones */}
            {modules.map((module) => (
              module.tabs.length > 0 && (
                <div key={`tabs-${module.id}`} className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings2 className="h-4 w-4 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-700">Tabs de {module.name}</h4>
                    <Badge variant="gray" size="sm">
                      {module.enabled_tabs_count}/{module.total_tabs_count}
                    </Badge>
                  </div>
                  <div className="space-y-3 ml-6">
                    {module.tabs.map((tab) => (
                      <FeatureToggleCard
                        key={tab.id}
                        layout="row"
                        icon={getIcon(tab.icon)}
                        title={tab.name}
                        description={tab.description}
                        checked={tab.is_enabled}
                        onChange={() => toggleTab(tab)}
                        color={module.color}
                        disabled={!canEdit || !module.is_enabled}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </Card>
      ))}

      {/* Confirmación de desactivación */}
      <ConfirmDialog
        isOpen={!!moduleToDisable}
        onClose={() => setModuleToDisable(null)}
        onConfirm={() => {
          toggleModule.mutate({ id: moduleToDisable.id, isEnabled: false });
          setModuleToDisable(null);
        }}
        title={`Desactivar ${moduleToDisable?.name}`}
        message="¿Está seguro? Los elementos dependientes también serán desactivados."
        confirmText="Desactivar"
        confirmVariant="destructive"
      />
    </div>
  );
}
```

---

### Variaciones

#### Variación 3A: Sin Sub-items (Solo Grid)

Para configuraciones simples sin jerarquía:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [🖥️] Configuración de Interfaz                                              │
│      Preferencias de visualización para todos los usuarios                  │
│ ┌──────────────────────────────────────────────────────────────────┐       │
│ │ [📋] Sidebar Colapsado    Iniciar con sidebar colapsado   [🔘]  │       │
│ └──────────────────────────────────────────────────────────────────┘       │
│ ┌──────────────────────────────────────────────────────────────────┐       │
│ │ [🌙] Modo Oscuro          Habilitar modo oscuro           [🔘]  │       │
│ └──────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

Usar `layout="row"` para todos los items cuando no hay grid:

```tsx
<Card>
  <div className="p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
        <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Configuración de Interfaz</h3>
        <p className="text-sm text-gray-500">Preferencias de visualización</p>
      </div>
    </div>

    <div className="space-y-4">
      {settings.map((setting) => (
        <FeatureToggleCard
          key={setting.key}
          layout="row"
          icon={setting.icon}
          title={setting.name}
          description={setting.description}
          checked={values[setting.key]}
          onChange={() => handleToggle(setting.key)}
          color="gray"
        />
      ))}
    </div>
  </div>
</Card>
```

#### Variación 3B: Múltiples Categorías con Colores

Cada categoría con su propio color:

```tsx
const CATEGORY_COLORS = {
  CORE: 'purple',
  OPERACIONES: 'blue',
  NORMATIVO: 'orange',
  ADMINISTRACION: 'green',
};
```

---

### Checklist de Implementación

- [ ] Alert informativa al inicio (opcional)
- [ ] Card por cada categoría
- [ ] Header de categoría con icono, título y contador
- [ ] Grid de módulos con `FeatureToggleGrid`
- [ ] `FeatureToggleCard` con layout `card` para módulos
- [ ] Badge "Core" para items no desactivables
- [ ] Verificación de permisos (`canDo`)
- [ ] Estados deshabilitados cuando corresponde
- [ ] Sub-items con layout `row` y indentación
- [ ] Contador de tabs activos (`enabled/total`)
- [ ] `ConfirmDialog` para desactivación
- [ ] Mostrar dependencias afectadas
- [ ] Loading skeleton para estado de carga
- [ ] Espaciado `space-y-6` entre cards

---

## Vista 4: Perfil de Usuario (Profile View)

### Propósito

Mostrar **información de una entidad única** con avatar/foto prominente y datos organizados en secciones. Ideal para perfiles de usuario, fichas de empleado, o detalle de entidades individuales.

### Cuándo Usar

- Perfil de usuario
- Ficha de empleado
- Detalle de proveedor/cliente
- Cualquier entidad individual con foto/avatar

### Ejemplos en el Sistema

- `PerfilPage` - Perfil del usuario autenticado
- Futuro: Ficha de empleado, detalle de proveedor

---

### Estructura Visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PAGE HEADER                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Mi Perfil                                                               │ │
│ │ Información personal y datos de tu cuenta                               │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ (Por fuera de cualquier contenedor)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. PROFILE CARD (Card principal con todo el contenido)                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  ┌──────────┐                                                           │ │
│ │  │          │  Juan Pérez García                                        │ │
│ │  │    JG    │  Gerente de Operaciones                                   │ │
│ │  │          │  juan.perez@empresa.com                                   │ │
│ │  └──────────┘                                                           │ │
│ │                                                                         │ │
│ │  ─────────────────────────────────────────────────────────────────────  │ │
│ │                                                                         │ │
│ │  3. INFO SECTIONS (Grid de 2 columnas)                                  │ │
│ │  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │ │
│ │  │ [👤] Información Personal   │  │ [💼] Información Laboral    │      │ │
│ │  │                             │  │                             │      │ │
│ │  │ [👤] Nombre completo        │  │ [🏢] Empresa                │      │ │
│ │  │     Juan Pérez García       │  │     StrateKaz S.A.S.        │      │ │
│ │  │                             │  │                             │      │ │
│ │  │ [✉️] Correo electrónico     │  │ [💼] Área                   │      │ │
│ │  │     juan@empresa.com        │  │     Operaciones             │      │ │
│ │  │                             │  │                             │      │ │
│ │  │ [📞] Teléfono               │  │ [👤] Cargo                  │      │ │
│ │  │     +57 311 234 5678        │  │     Gerente de Operaciones  │      │ │
│ │  │                             │  │                             │      │ │
│ │  │ [🪪] Documento              │  │ [📅] Fecha de ingreso       │      │ │
│ │  │     CC 12345678             │  │     15 de enero de 2024     │      │ │
│ │  └─────────────────────────────┘  └─────────────────────────────┘      │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Componentes Utilizados

| # | Zona | Componente | Ubicación | Props Principales |
|---|------|------------|-----------|-------------------|
| 1 | Page Header | `PageHeader` | `@/components/layout` | `title`, `description` |
| 2 | Profile Card | `Card` | `@/components/common` | Contenedor principal |
| 3 | Avatar | Inline JSX | N/A | Iniciales o imagen |
| 4 | Info Sections | Grid + Inline JSX | N/A | Secciones con iconos |
| 5 | Info Items | Custom `InfoItem` | Local | `icon`, `label`, `value` |

---

### Anatomía Detallada

#### 1. Page Header

```tsx
<PageHeader
  title="Mi Perfil"
  description="Información personal y datos de tu cuenta"
/>
```

**Reglas:**
- Siempre fuera de cualquier Card
- Sin secciones/tabs (es vista de detalle único)
- Descripción breve del contenido

---

#### 2. Profile Header (Avatar + Info Principal)

```tsx
<Card className="p-6 md:p-8">
  {/* Header del perfil con avatar */}
  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
    {/* Avatar con iniciales */}
    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
      {initials}
    </div>

    {/* Información principal */}
    <div className="text-center sm:text-left">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        {displayName}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mt-1">
        {cargo}
      </p>
      <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
        {email}
      </p>
    </div>
  </div>

  {/* ... resto del contenido */}
</Card>
```

**Reglas del Avatar:**
- Tamaño: `h-24 w-24` (96px)
- Forma: `rounded-full`
- Fondo: gradiente del color primario `from-primary-500 to-primary-600`
- Texto: iniciales en `text-3xl font-bold text-white`
- Sombra: `shadow-lg`
- Si hay imagen: usar `<img>` con `object-cover`

**Reglas del Info Principal:**
- Nombre: `text-2xl font-bold`
- Cargo: `text-gray-600` (secundario)
- Email: `text-sm text-gray-500` (terciario)
- Responsive: centrado en móvil, alineado izquierda en desktop

---

#### 3. Secciones de Información

```tsx
<div className="grid gap-8 md:grid-cols-2">
  {/* Sección 1 */}
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <User className="h-5 w-5 text-primary-500" />
      Información Personal
    </h3>
    <div className="space-y-3 pl-7">
      <InfoItem icon={User} label="Nombre completo" value={name} />
      <InfoItem icon={Mail} label="Correo electrónico" value={email} />
      <InfoItem icon={Phone} label="Teléfono" value={phone} />
      <InfoItem icon={IdCard} label="Documento" value={document} />
    </div>
  </div>

  {/* Sección 2 */}
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <Briefcase className="h-5 w-5 text-primary-500" />
      Información Laboral
    </h3>
    <div className="space-y-3 pl-7">
      <InfoItem icon={Building2} label="Empresa" value={empresa} />
      <InfoItem icon={Briefcase} label="Área" value={area} />
      <InfoItem icon={User} label="Cargo" value={cargo} />
      <InfoItem icon={Calendar} label="Fecha de ingreso" value={dateJoined} />
    </div>
  </div>
</div>
```

**Reglas:**
- Grid de 2 columnas en desktop, 1 en móvil
- Título de sección: `text-lg font-semibold` con icono en `text-primary-500`
- Items indentados con `pl-7` para alinear bajo el título
- Espaciado: `space-y-4` entre secciones, `space-y-3` entre items

---

#### 4. Componente InfoItem

```tsx
interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

const InfoItem = ({ icon: Icon, label, value }: InfoItemProps) => (
  <div className="flex items-start gap-3">
    <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
    <div>
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-gray-900 dark:text-white">{value}</dd>
    </div>
  </div>
);
```

**Reglas:**
- Icono: `h-4 w-4 text-gray-400` (neutral, no compite con valor)
- Label: `text-sm text-gray-500` (secundario)
- Value: `text-gray-900` (principal)
- Usa `<dt>/<dd>` semánticos o divs equivalentes

---

### Código de Ejemplo Completo

```tsx
// PerfilPage.tsx - Vista 4: Perfil de Usuario

import { User, Building2, Briefcase, Mail, Phone, IdCard, Calendar } from 'lucide-react';
import { Card } from '@/components/common';
import { PageHeader } from '@/components/layout';
import { useAuthStore } from '@/store/authStore';

export const PerfilPage = () => {
  const { user } = useAuthStore();

  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'Usuario';

  const initials = user?.first_name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Mi Perfil"
        description="Información personal y datos de tu cuenta"
      />

      {/* Profile Card */}
      <Card className="p-6 md:p-8">
        {/* Avatar Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
            {initials}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {displayName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {user?.cargo?.name || 'Sin cargo'}
            </p>
            <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="h-5 w-5 text-primary-500" />
              Información Personal
            </h3>
            <div className="space-y-3 pl-7">
              <InfoItem icon={User} label="Nombre completo" value={displayName} />
              <InfoItem icon={Mail} label="Correo" value={user?.email || '-'} />
              <InfoItem icon={Phone} label="Teléfono" value={user?.phone || '-'} />
            </div>
          </div>

          {/* Laboral */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary-500" />
              Información Laboral
            </h3>
            <div className="space-y-3 pl-7">
              <InfoItem icon={Building2} label="Empresa" value={user?.empresa_nombre || '-'} />
              <InfoItem icon={Briefcase} label="Área" value={user?.area_nombre || '-'} />
              <InfoItem icon={Calendar} label="Ingreso" value={formatDate(user?.date_joined)} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Componente auxiliar
const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
    <div>
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-gray-900 dark:text-white">{value}</dd>
    </div>
  </div>
);
```

---

### Variaciones

#### Variación 4A: Con Imagen de Avatar

```tsx
{/* Avatar con imagen */}
<div className="h-24 w-24 rounded-full overflow-hidden shadow-lg flex-shrink-0">
  {user?.avatar ? (
    <img
      src={user.avatar}
      alt={displayName}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
      {initials}
    </div>
  )}
</div>
```

#### Variación 4B: Con Botón de Editar

```tsx
<div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-6 border-b">
  {/* Avatar */}
  <div className="relative">
    <div className="h-24 w-24 rounded-full ...">
      {initials}
    </div>
    {canEdit && (
      <button className="absolute bottom-0 right-0 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50">
        <Camera className="h-4 w-4 text-gray-600" />
      </button>
    )}
  </div>

  {/* Info + Botón editar */}
  <div className="flex-1">
    <div className="flex items-start justify-between">
      <div>
        <h2>...</h2>
        <p>...</p>
      </div>
      {canEdit && (
        <Button variant="secondary" size="sm" onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Perfil
        </Button>
      )}
    </div>
  </div>
</div>
```

#### Variación 4C: Con Badges de Estado

```tsx
<div className="text-center sm:text-left">
  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
    <h2 className="text-2xl font-bold">{displayName}</h2>
    <Badge variant="success" size="sm">Activo</Badge>
    {user?.is_admin && <Badge variant="purple" size="sm">Admin</Badge>}
  </div>
  <p className="text-gray-600 mt-1">{cargo}</p>
</div>
```

---

### Checklist de Implementación

- [ ] PageHeader con título y descripción (fuera de Card)
- [ ] Card principal con padding `p-6 md:p-8`
- [ ] Avatar circular con gradiente o imagen
- [ ] Iniciales calculadas del nombre
- [ ] Info principal: nombre, cargo, email
- [ ] Separador `border-b` después del avatar header
- [ ] Grid de 2 columnas para secciones
- [ ] Títulos de sección con icono en `text-primary-500`
- [ ] InfoItems con icono gris, label secundario, valor principal
- [ ] Indentación `pl-7` para items bajo título
- [ ] Responsive: centrado en móvil, izquierda en desktop
- [ ] Dark mode soportado

---

## Vista 5: Formulario de Acción (Action Form View)

### Propósito

Mostrar un **formulario de acción única** para ejecutar una operación específica. Es la vista más simple: un Section Header seguido de un Card con el formulario. Ideal para acciones puntuales como envío masivo, importación de datos, o configuraciones simples.

### Cuándo Usar

- Envío de notificaciones/emails masivos
- Importación de archivos
- Generación de reportes
- Acciones administrativas puntuales
- Cualquier formulario de "hacer algo" (no CRUD)

### Ejemplos en el Sistema

- `NotificacionesPage > Masivas` - Envío de notificaciones masivas
- Futuro: Importación de datos, generación de reportes

---

### Estructura Visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SECTION HEADER (Por fuera del Card)                                      │
│                                                                             │
│ [📤] Envío de Notificación Masiva                                           │
│      Envía notificaciones a múltiples usuarios de la organización           │
│                                                                             │
│ (Izquierda: Icono + Título + Descripción)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. FORM CARD (Card único con el formulario)                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ CONTENIDO DEL MENSAJE                                                   │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │ Título de la notificación                                               │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Ej: Actualización importante del sistema                            │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ Mensaje                                                                 │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │                                                                     │ │ │
│ │ │ Escribe el contenido de la notificación...                          │ │ │
│ │ │                                                                     │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │ Máximo 500 caracteres.                                                  │ │
│ │                                                                         │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │                                                                         │ │
│ │ CONFIGURACIÓN DE ENVÍO                                                  │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │ ┌─────────────────────┐  ┌─────────────────────┐                       │ │
│ │ │ Prioridad        ▼  │  │ Destinatarios    ▼  │                       │ │
│ │ └─────────────────────┘  └─────────────────────┘                       │ │
│ │                                                                         │ │
│ │ Canales de envío                                                        │ │
│ │ ┌───────────┐ ┌───────────┐ ┌───────────┐                              │ │
│ │ │ ☑ Email   │ │ ☑ Push    │ │ ☐ SMS     │                              │ │
│ │ └───────────┘ └───────────┘ └───────────┘                              │ │
│ │                                                                         │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │                                                                         │ │
│ │ Se enviará a todos los usuarios          [Vista Previa] [Enviar ▶]     │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Componentes Utilizados

| # | Zona | Componente | Ubicación | Props Principales |
|---|------|------------|-----------|-------------------|
| 1 | Section Header | Inline JSX | N/A | Icono + Título + Descripción |
| 2 | Form Card | `Card` | `@/components/common` | Contenedor principal |
| 3 | Section Title | `h4` | N/A | `text-sm font-semibold uppercase` |
| 4 | Form Fields | Inputs nativos | N/A | Estilos consistentes |
| 5 | Checkboxes | `label` + `input` | N/A | En cards interactivos |
| 6 | Action Buttons | `Button` | `@/components/common` | `variant`, `size` |

---

### Anatomía Detallada

#### 1. Section Header

```tsx
<div className="flex items-center gap-3">
  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
    <Send className="h-5 w-5 text-green-600 dark:text-green-400" />
  </div>
  <div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
      Envío de Notificación Masiva
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Envía notificaciones a múltiples usuarios de la organización
    </p>
  </div>
</div>
```

**Reglas:**
- Siempre fuera del Card del formulario
- Icono en contenedor con color relacionado a la acción
- Título descriptivo de la acción
- Subtítulo explicando qué hace

---

#### 2. Form Card con Secciones

```tsx
<Card>
  <form className="p-6 space-y-6">
    {/* Sección 1 */}
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Contenido del Mensaje
      </h4>
      {/* Campos de la sección */}
    </div>

    {/* Separador */}
    <div className="border-t border-gray-200 dark:border-gray-700" />

    {/* Sección 2 */}
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Configuración de Envío
      </h4>
      {/* Campos de la sección */}
    </div>

    {/* Separador */}
    <div className="border-t border-gray-200 dark:border-gray-700" />

    {/* Acciones */}
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">Resumen de la acción</p>
      <div className="flex gap-3">
        <Button variant="outline">Secundaria</Button>
        <Button variant="primary">Acción Principal</Button>
      </div>
    </div>
  </form>
</Card>
```

**Reglas:**
- Card único para todo el formulario
- Padding `p-6` y espaciado `space-y-6`
- Secciones separadas por `border-t`
- Títulos de sección en `uppercase tracking-wide`
- Acciones al final con resumen a la izquierda

---

#### 3. Campos de Formulario

```tsx
{/* Input de texto */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Título de la notificación
  </label>
  <input
    type="text"
    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    placeholder="Ej: Actualización importante"
  />
</div>

{/* Textarea */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Mensaje
  </label>
  <textarea
    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 ..."
    rows={4}
    placeholder="Escribe el contenido..."
  />
  <p className="mt-1 text-xs text-gray-500">Nota de ayuda</p>
</div>

{/* Select */}
<div>
  <label className="...">Prioridad</label>
  <select className="w-full border ... rounded-lg px-4 py-2.5 ...">
    <option>Normal</option>
  </select>
</div>
```

**Reglas de Estilos:**
- Labels: `text-sm font-medium` con `mb-2`
- Inputs: `rounded-lg px-4 py-2.5`
- Focus: `focus:ring-2 focus:ring-primary-500`
- Notas de ayuda: `text-xs text-gray-500 mt-1`

---

#### 4. Checkboxes en Cards

```tsx
<div className="flex flex-wrap gap-4">
  <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 cursor-pointer transition-colors">
    <input
      type="checkbox"
      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      defaultChecked
    />
    <Mail className="w-4 h-4 text-gray-500" />
    <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
  </label>
  {/* Más opciones... */}
</div>
```

**Reglas:**
- Checkboxes dentro de cards interactivos
- Hover con cambio de borde
- Icono + texto para claridad
- Espaciado `gap-4` entre opciones

---

### Código de Ejemplo Completo

```tsx
// MasivasTab.tsx - Vista 5: Formulario de Acción

import { Send, Mail, Bell, MessageSquare, Eye } from 'lucide-react';
import { Card, Button } from '@/components/common';

function MasivasTab() {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
          <Send className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Envío de Notificación Masiva
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Envía notificaciones a múltiples usuarios
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <form className="p-6 space-y-6">
          {/* Sección: Contenido */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Contenido del Mensaje
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 ..."
                placeholder="Título de la notificación"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 ..."
                rows={4}
                placeholder="Contenido del mensaje..."
              />
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Sección: Configuración */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Configuración de Envío
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Prioridad</label>
                <select>...</select>
              </div>
              <div>
                <label>Destinatarios</label>
                <select>...</select>
              </div>
            </div>
            <div>
              <label>Canales</label>
              <div className="flex gap-4">
                {/* Checkbox cards */}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Acciones */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Se enviará a <span className="font-medium">todos los usuarios</span>
            </p>
            <div className="flex gap-3">
              <Button variant="outline">Vista Previa</Button>
              <Button variant="primary">
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
```

---

### Variaciones

#### Variación 5A: Con Alert Informativa

Para acciones que requieren contexto adicional:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SECTION HEADER                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ ALERT                                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ℹ️ Las notificaciones masivas requieren aprobación del administrador.   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ FORM CARD                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Variación 5B: Con Preview Panel

Para formularios que generan output visible:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SECTION HEADER                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌──────────────────────────────┐  ┌──────────────────────────────┐         │
│ │ FORM CARD                    │  │ PREVIEW CARD                 │         │
│ │                              │  │                              │         │
│ │ Campos del formulario...     │  │ Vista previa en tiempo real  │         │
│ │                              │  │                              │         │
│ └──────────────────────────────┘  └──────────────────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Checklist de Implementación

- [ ] Section Header fuera del Card con icono, título y descripción
- [ ] Card único para el formulario con `p-6 space-y-6`
- [ ] Secciones separadas con títulos uppercase
- [ ] Separadores `border-t` entre secciones
- [ ] Inputs con estilos consistentes (`rounded-lg px-4 py-2.5`)
- [ ] Labels con `text-sm font-medium mb-2`
- [ ] Checkboxes en cards interactivos (si aplica)
- [ ] Resumen de acción a la izquierda del footer
- [ ] Botón secundario + botón primario con icono
- [ ] Notas de ayuda en `text-xs text-gray-500`
- [ ] Dark mode soportado en todos los elementos

---

## Vista 6: Panel de Configuración con Acciones (Settings Panel)

### Propósito

Mostrar un **panel de configuración** donde cada sección es un Card independiente con una funcionalidad específica. Cada card tiene un icono, título, descripción y una acción (botón, toggle, o contenido expandible). Ideal para páginas de configuración de cuenta, seguridad, o preferencias del usuario.

### Cuándo Usar

- Páginas de configuración de cuenta/perfil
- Páginas de seguridad (cambio contraseña, 2FA, sesiones)
- Preferencias de usuario
- Configuraciones con múltiples secciones independientes
- Cuando cada sección tiene su propia acción

### Ejemplos en el Sistema

- `SeguridadPage` - Cambio de contraseña, sesiones activas, 2FA
- `PreferenciasPage` - Configuraciones de usuario
- Futuro: Configuración de cuenta, privacidad

---

### Estructura Visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PAGE HEADER (Título de la página)                                        │
│                                                                             │
│ [🔒] Seguridad                                                              │
│      Gestiona la seguridad de tu cuenta                                     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. ACTION CARDS (Cards independientes con acciones)                         │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [🔑] Cambiar Contraseña                                                 │ │
│ │      Actualiza tu contraseña regularmente para mantener tu cuenta       │ │
│ │      segura.                                                            │ │
│ │                                                  [Cambiar Contraseña]   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [💻] Sesiones Activas                                       [🔄]        │ │
│ │      Gestiona los dispositivos donde tienes sesiones iniciadas.         │ │
│ │                                                                         │ │
│ │      ┌───────────────────────────────────────────────────────────────┐  │ │
│ │      │ 🖥️ Chrome en Windows • 192.168.1.1        [Actual]            │  │ │
│ │      │    Bogotá, Colombia • Hace 2 horas                            │  │ │
│ │      └───────────────────────────────────────────────────────────────┘  │ │
│ │      ┌───────────────────────────────────────────────────────────────┐  │ │
│ │      │ 📱 Safari en iPhone • 192.168.1.2                    [✕]      │  │ │
│ │      │    Medellín, Colombia • Hace 1 día                            │  │ │
│ │      └───────────────────────────────────────────────────────────────┘  │ │
│ │                                                                         │ │
│ │      [Cerrar otras sesiones (1)]                                        │ │
│ │      2 sesiones activas                                                 │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [📱] Autenticación de Dos Factores                                      │ │
│ │      Añade una capa extra de seguridad a tu cuenta.                     │ │
│ │                                                                         │ │
│ │      🔒 Próximamente disponible                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Componentes Utilizados

| # | Zona | Componente | Ubicación | Props Principales |
|---|------|------------|-----------|-------------------|
| 1 | Page Header | `PageHeader` | `@/components/layout` | `title`, `description`, `icon` |
| 2 | Action Card | `Card` | `@/components/common` | Contenedor con padding |
| 3 | Card Header | Inline JSX | N/A | Icono + Título + Descripción |
| 4 | Card Action | `Button` | `@/components/common` | `variant`, `size`, `onClick` |
| 5 | Nested List | Componente específico | Variable | Lista de items dentro del card |

---

### Anatomía Detallada

#### 1. Page Header

```tsx
<PageHeader
  title="Seguridad"
  description="Gestiona la seguridad de tu cuenta"
  icon={<Shield className="h-6 w-6" />}
/>
```

**Reglas:**
- Usar `PageHeader` para consistencia con el resto de la app
- Icono representativo de la sección
- Descripción breve de lo que puede hacer el usuario

---

#### 2. Action Card Simple (con botón)

```tsx
<Card className="p-6">
  <div className="flex items-start gap-4">
    {/* Icono */}
    <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
      <Key className="h-6 w-6 text-primary-600 dark:text-primary-400" />
    </div>

    {/* Contenido */}
    <div className="flex-1">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Cambiar Contraseña
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mt-1">
        Actualiza tu contraseña regularmente para mantener tu cuenta segura.
      </p>

      {/* Acción */}
      <Button variant="outline" size="sm" className="mt-4" onClick={handleAction}>
        Cambiar Contraseña
      </Button>
    </div>
  </div>
</Card>
```

**Reglas:**
- Icono en contenedor con fondo de color (`p-3 rounded-lg`)
- Colores del icono según la funcionalidad:
  - Primary (azul): acciones principales
  - Purple: seguridad avanzada (2FA)
  - Blue: información/sesiones
  - Green: acciones completadas
  - Orange: advertencias
- Título en `text-lg font-semibold`
- Descripción en `text-gray-600`
- Botón con `mt-4` para separación

---

#### 3. Action Card con Lista (sesiones activas)

```tsx
<Card className="p-6">
  <div className="flex items-start gap-4">
    {/* Icono */}
    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
      <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
    </div>

    {/* Contenido */}
    <div className="flex-1 min-w-0">
      {/* Header con acción secundaria */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sesiones Activas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona los dispositivos donde tienes sesiones iniciadas.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={refetch} title="Actualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista de items */}
      <div className="mt-4 space-y-3">
        {sessions.map((session) => (
          <SessionItem key={session.id} session={session} />
        ))}
      </div>

      {/* Acción secundaria */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" size="sm" className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar otras sesiones ({count})
        </Button>
      </div>

      {/* Contador */}
      <p className="mt-3 text-xs text-gray-500">
        {count} sesiones activas
      </p>
    </div>
  </div>
</Card>
```

**Reglas:**
- Header puede tener botón de acción secundaria (refresh, etc.)
- Lista de items con `space-y-3`
- Acciones peligrosas con `text-red-600` y separador `border-t`
- Contador informativo en `text-xs text-gray-500`

---

#### 4. Action Card Deshabilitado (próximamente)

```tsx
<Card className="p-6">
  <div className="flex items-start gap-4">
    {/* Icono */}
    <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
      <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
    </div>

    {/* Contenido */}
    <div className="flex-1">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Autenticación de Dos Factores
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mt-1">
        Añade una capa extra de seguridad a tu cuenta.
      </p>

      {/* Estado: Próximamente */}
      <div className="mt-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Próximamente disponible
        </span>
      </div>
    </div>
  </div>
</Card>
```

**Reglas:**
- Mismo layout que card activo
- En lugar de botón, mostrar estado con icono + texto
- Texto en `text-gray-500` para indicar inactividad

---

#### 5. Session Item (componente interno)

```tsx
<div
  className={cn(
    'p-4 rounded-lg border transition-colors',
    session.is_current
      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
  )}
>
  <div className="flex items-start gap-3">
    <DeviceIcon type={session.device_type} />
    <div className="flex-1 min-w-0">
      {/* Nombre + Badge */}
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {session.device_display}
        </p>
        {session.is_current && (
          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
            Actual
          </span>
        )}
      </div>

      {/* Info secundaria */}
      <div className="mt-1 text-xs text-gray-500 space-y-1">
        <span>{session.device_os} | {session.device_browser}</span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {session.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Iniciada {session.time_elapsed}
        </span>
      </div>
    </div>

    {/* Botón cerrar (solo otras sesiones) */}
    {!session.is_current && (
      <Button variant="ghost" size="sm" onClick={onClose} className="text-red-600">
        <X className="h-4 w-4" />
      </Button>
    )}
  </div>
</div>
```

**Reglas:**
- Sesión actual con fondo destacado (`bg-primary-50`)
- Badge "Actual" en verde
- Info en `text-xs text-gray-500`
- Botón cerrar solo en otras sesiones

---

### Código de Ejemplo Completo

```tsx
// SeguridadPage.tsx - Vista 6: Panel de Configuración con Acciones

import { useState } from 'react';
import { Shield, Key, Monitor, Smartphone } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, Button } from '@/components/common';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { ActiveSessionsCard } from '../components/ActiveSessionsCard';

export const SeguridadPage = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Seguridad"
        description="Gestiona la seguridad de tu cuenta"
        icon={<Shield className="h-6 w-6" />}
      />

      {/* Action Card: Cambiar Contraseña */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <Key className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cambiar Contraseña
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Actualiza tu contraseña regularmente para mantener tu cuenta segura.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowPasswordModal(true)}
            >
              Cambiar Contraseña
            </Button>
          </div>
        </div>
      </Card>

      {/* Action Card: Sesiones Activas */}
      <ActiveSessionsCard />

      {/* Action Card: 2FA (próximamente) */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Autenticación de Dos Factores
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Añade una capa extra de seguridad a tu cuenta.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Próximamente disponible</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};
```

---

### Variaciones

#### Variación 6A: Con Toggle en lugar de Botón

Para configuraciones que se activan/desactivan:

```tsx
<Card className="p-6">
  <div className="flex items-start gap-4">
    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
      <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Notificaciones por Email</h2>
          <p className="text-gray-600 mt-1">Recibir resúmenes semanales</p>
        </div>
        <Toggle checked={enabled} onChange={setEnabled} />
      </div>
    </div>
  </div>
</Card>
```

#### Variación 6B: Con Secciones Agrupadas

Para cuando hay múltiples cards relacionados:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION HEADER: "Autenticación"                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Card: Cambiar Contraseña                                                │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Card: 2FA                                                               │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ SECTION HEADER: "Dispositivos"                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Card: Sesiones Activas                                                  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Paleta de Colores por Funcionalidad

| Funcionalidad | Color Icono | Clases |
|---------------|-------------|--------|
| Contraseña/Auth | Primary | `bg-primary-100 text-primary-600` |
| Sesiones/Dispositivos | Blue | `bg-blue-100 text-blue-600` |
| 2FA/Seguridad Avanzada | Purple | `bg-purple-100 text-purple-600` |
| Privacidad | Green | `bg-green-100 text-green-600` |
| Alertas/Peligro | Red | `bg-red-100 text-red-600` |
| Deshabilitado | Gray | `bg-gray-100 text-gray-400` |

---

### Checklist de Implementación

- [ ] PageHeader con título, descripción e icono
- [ ] Cards con `p-6` y `space-y-6` entre ellos
- [ ] Cada card tiene icono en contenedor con color (`p-3 rounded-lg`)
- [ ] Layout flex con `items-start gap-4`
- [ ] Título en `text-lg font-semibold`
- [ ] Descripción en `text-gray-600 mt-1`
- [ ] Acción con `mt-4` (botón, toggle, o estado)
- [ ] Cards con listas tienen `space-y-3` para items
- [ ] Acciones peligrosas en rojo con separador `border-t`
- [ ] Estados deshabilitados con `text-gray-500`
- [ ] Dark mode soportado en todos los elementos

---

## Componentes Disponibles para Vista 1

Todos los componentes necesarios para Vista 1 ya existen:

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| `DataSection` | `@/components/data-display` | ✅ Header de sección con icono, título, descripción y acciones |
| `DataGrid` | `@/components/data-display` | ✅ Grid responsivo para cards (1-4 columnas) |
| `DataCard` | `@/components/data-display` | ✅ Card con borde de color, icono y campos |
| `DataField` | `@/components/data-display` | ✅ Campo label:valor con iconos, copy, links |
| `SectionHeader` | `@/components/layout` | ✅ Alternativa standalone (fuera de DataSection) |

**Nota:** `EmpresaSection` ya implementa correctamente Vista 1 usando estos componentes.

---

## Componentes Compartidos

Esta sección documenta componentes que se usan en múltiples vistas y sus configuraciones de color/estilo.

---

### StatsGrid - Grid de Estadísticas

**Ubicación:** `@/components/layout/StatsGrid`

Grid de cards para mostrar métricas/estadísticas con iconos y valores.

#### Props Principales

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `stats` | `StatItem[]` | - | Array de estadísticas |
| `columns` | `2 \| 3 \| 4 \| 5` | `4` | Columnas en pantalla grande |
| `moduleColor` | `ModuleColor` | `'blue'` | Color del hover de las cards |
| `variant` | `'default' \| 'compact'` | `'default'` | Estilo de las cards |

#### Colores de Iconos (`iconColor`)

Cada `StatItem` puede definir su color de icono individualmente:

| iconColor | Clase Tailwind | Uso Recomendado |
|-----------|----------------|-----------------|
| `primary` | `text-primary-500` | Totales, métricas principales |
| `success` | `text-green-500` | Activos, completados, positivos |
| `warning` | `text-yellow-500` | Pendientes, alertas leves |
| `danger` | `text-red-500` | Errores, inactivos, críticos |
| `info` | `text-blue-500` | Información general |
| `gray` | `text-gray-400` | Default, neutro |

#### Color del Módulo (`moduleColor`)

El `moduleColor` afecta el **hover de las cards**, no los iconos:

```tsx
moduleColor?: 'purple' | 'blue' | 'green' | 'orange' | 'teal' | 'gray' | 'red' | 'yellow' | 'pink' | 'indigo';
```

Aplica clases de `hover:shadow-{color}` y `hover:border-{color}` a cada card.

#### Ejemplo de Uso

```tsx
import { StatsGrid } from '@/components/layout';
import { MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';

<StatsGrid
  moduleColor="purple"  // Hover púrpura en todas las cards
  columns={4}
  stats={[
    {
      label: "Total Sedes",
      value: 5,
      icon: MapPin,
      iconColor: "primary",  // Icono en color primario
    },
    {
      label: "Activas",
      value: 4,
      icon: CheckCircle,
      iconColor: "success",  // Icono verde
      change: "+1",
      changeType: "positive",
    },
    {
      label: "Inactivas",
      value: 1,
      icon: XCircle,
      iconColor: "danger",   // Icono rojo
    },
    {
      label: "Pendientes",
      value: 2,
      icon: Clock,
      iconColor: "warning",  // Icono amarillo
    },
  ]}
/>
```

---

### Button - Variantes de Botón

**Ubicación:** `@/components/common/Button`

Componente base para todos los botones del sistema.

#### Variantes Disponibles

| Variante | Estilo | Uso Principal |
|----------|--------|---------------|
| `primary` | Fondo primario, texto blanco | Acción principal (Guardar, Crear) |
| `secondary` | Fondo gris claro, texto oscuro | Acciones secundarias (Cancelar) |
| `accent` | Fondo accent, texto blanco | Acciones destacadas |
| `danger` | Fondo rojo, texto blanco | Acciones destructivas (Eliminar) |
| `ghost` | Sin fondo, texto gris | Acciones sutiles, iconos |
| `outline` | Borde primario, texto primario | Alternativa a primary |
| `outline-secondary` | Borde gris, texto gris | Alternativa a secondary |
| `outline-accent` | Borde accent, texto accent | Alternativa a accent |

#### Tamaños

| Size | Padding | Uso |
|------|---------|-----|
| `sm` | Compacto | En tablas, inline |
| `md` | Normal | Default, formularios |
| `lg` | Grande | CTAs destacados |

#### Botones en Section Header

Para acciones en el header de sección:

```tsx
// Acción de crear (botón primario)
<Button variant="primary" size="sm" onClick={handleAdd}>
  <Plus className="h-4 w-4 mr-2" />
  Agregar Item
</Button>

// Acción de editar (botón secundario)
<Button variant="secondary" size="sm" onClick={handleEdit}>
  <Edit className="h-4 w-4 mr-2" />
  Editar
</Button>
```

**Reglas de Color para Section Header:**
- **Crear nuevo:** `variant="primary"` - Siempre usa el color primario del tema
- **Editar existente:** `variant="secondary"` - Gris neutro
- **Exportar/Descargar:** `variant="outline"` - Borde primario
- **Acciones destructivas:** `variant="danger"` - Nunca en header, solo en confirmación

---

### ActionButtons - Acciones en Tabla

**Ubicación:** `@/components/common/ActionButtons`

Componente estandarizado para botones de acción en filas de tabla con verificación RBAC automática.

#### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `module` | `string` | Módulo para verificar permisos (usar `Modules.XXX`) |
| `section` | `string` | Sección para verificar permisos (usar `Sections.XXX`) |
| `onView` | `() => void` | Handler para ver detalle |
| `onEdit` | `() => void` | Handler para editar |
| `onDelete` | `() => void` | Handler para eliminar |
| `customActions` | `CustomAction[]` | Acciones personalizadas |
| `size` | `'sm' \| 'md'` | Tamaño de iconos |

#### Acciones Estándar y sus Colores

| Acción | Icono | Color Hover | Permiso Requerido |
|--------|-------|-------------|-------------------|
| **Ver** | `Eye` | `text-blue-600`, `bg-blue-50` | `view` |
| **Editar** | `Pencil` | `text-orange-600`, `bg-orange-50` | `edit` |
| **Eliminar** | `Trash2` | `text-red-600`, `bg-red-50` | `delete` |

#### Orden de Renderizado

Los botones se renderizan en este orden (si el usuario tiene permiso):
1. Ver (Eye) - azul
2. Editar (Pencil) - naranja
3. Acciones personalizadas
4. Eliminar (Trash2) - rojo (siempre al final)

#### Ejemplo de Uso

```tsx
import { ActionButtons } from '@/components/common/ActionButtons';
import { Modules, Sections } from '@/constants/permissions';

// En una fila de tabla
<td className="py-3 px-4 text-right">
  <ActionButtons
    module={Modules.GESTION_ESTRATEGICA}
    section={Sections.SEDES}
    onView={() => handleView(item)}
    onEdit={() => handleEdit(item)}
    onDelete={() => handleDeleteClick(item)}
    size="sm"
  />
</td>
```

#### Acciones Personalizadas

```tsx
<ActionButtons
  module={Modules.SUPPLY_CHAIN}
  section={Sections.PROVEEDORES}
  onEdit={() => handleEdit(item)}
  onDelete={() => handleDelete(item)}
  customActions={[
    {
      key: 'download',
      label: 'Descargar PDF',
      icon: <Download size={14} />,
      onClick: () => handleDownload(item),
      variant: 'ghost',
    },
    {
      key: 'duplicate',
      label: 'Duplicar',
      icon: <Copy size={14} />,
      onClick: () => handleDuplicate(item),
      disabled: !canDuplicate,
    },
  ]}
  size="sm"
/>
```

#### Estructura Visual

```
┌─────────────────────────────────────────┐
│ Acciones                                │
├─────────────────────────────────────────┤
│  [👁️]  [✏️]  [📥]  [🗑️]                │
│   Ver  Edit  Custom Delete              │
│  azul  naranja       rojo               │
└─────────────────────────────────────────┘
```

**Reglas:**
- Siempre verificar permisos antes de mostrar
- `onDelete` siempre genera botón rojo al final
- Los botones son circulares (`rounded-full`) con hover coloreado
- Usar `size="sm"` en tablas para compactar

---

### Resumen de Colores por Contexto

| Contexto | Componente | Cómo definir color |
|----------|------------|-------------------|
| StatsGrid - Iconos | `StatItem.iconColor` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'gray'` |
| StatsGrid - Hover | `StatsGrid.moduleColor` | `ModuleColor` (purple, blue, green, etc.) |
| Section Header - Botón | `Button.variant` | `'primary'` para crear, `'secondary'` para editar |
| Tabla - Acciones | `ActionButtons` | Colores fijos: Ver=azul, Edit=naranja, Delete=rojo |
| Cards - Borde | `DataCard.variant` | `'purple' \| 'blue' \| 'green' \| 'orange'` etc. |
| Toggle Cards | `FeatureToggleCard.color` | `FeatureToggleColor` (10 colores disponibles) |

---

## Historial de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2026-01-20 | 1.0 | Documentación inicial - Vista 1 |
| 2026-01-20 | 1.1 | Actualizado para usar componentes existentes (DataSection, DataCard, etc.) |
| 2026-01-20 | 1.2 | Documentación Vista 2: Lista CRUD (Table View) |
| 2026-01-20 | 1.3 | Documentación Vista 3: Panel de Activación (Toggle Grid) |
| 2026-01-20 | 1.4 | Sección Componentes Compartidos: StatsGrid, Button, ActionButtons |
| 2026-01-20 | 1.5 | Documentación Vista 4: Perfil de Usuario (Profile View) |
| 2026-01-20 | 1.6 | Documentación Vista 5: Formulario de Acción (Action Form View) |
| 2026-01-20 | 1.7 | Documentación Vista 6: Panel de Configuración con Acciones (Settings Panel) |
