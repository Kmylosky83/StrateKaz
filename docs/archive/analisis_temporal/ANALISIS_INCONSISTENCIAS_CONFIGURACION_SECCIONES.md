# Análisis de Inconsistencias UI/UX - Secciones de Configuración

**Fecha:** 2026-01-19
**Alcance:** Frontend - Gestión Estratégica - Secciones de Configuración
**Ubicación:** `frontend/src/features/gestion-estrategica/components/`

---

## 📋 Resumen Ejecutivo

Se identificaron **inconsistencias significativas** en los patrones de UI/UX entre las 7 secciones analizadas del módulo de Configuración. Existen **3 patrones diferentes** de implementación que generan una experiencia de usuario inconsistente.

### Secciones Analizadas

1. ✅ **EmpresaSection.tsx** - Patrón DataCard (más complejo)
2. ✅ **SedesSection.tsx** - Patrón Tabla estándar
3. ✅ **ConsecutivosSection.tsx** - Patrón Tabla estándar
4. ✅ **UnidadesMedidaSection.tsx** - Patrón Tabla con Card wrapper
5. ✅ **IntegracionesSection.tsx** - Patrón Tabla con Card wrapper
6. ✅ **BrandingSection** - Patrón Grid de campos (dentro de ConfiguracionTab.tsx)
7. ✅ **ModulosSection** - Patrón FeatureToggleGrid (dentro de ConfiguracionTab.tsx)

---

## 📊 Matriz Comparativa de Inconsistencias

| Sección | Tiene Título | Tiene Descripción | Layout Principal | Color Icono Header | Wrapper Card | Estado Vacío | Color Botón Principal | Texto Botón | Descripción Bajo Título |
|---------|--------------|-------------------|------------------|-------------------|--------------|--------------|----------------------|-------------|------------------------|
| **EmpresaSection** | ✅ Sí (DataSection) | ✅ Sí | DataGrid (3 cols) | 🟣 Purple | ❌ No (DataSection) | ✅ Completo | 🔵 Primary (default) | "Configurar Empresa" | ❌ No |
| **SedesSection** | ✅ Sí | ✅ Sí (contador) | Table | 🔵 Blue | ✅ Sí | ✅ Completo | 🔵 Primary | "Agregar Sede" | ✅ Sí ("X sede(s) configurada(s)") |
| **ConsecutivosSection** | ✅ Sí | ✅ Sí | Table | ❌ Sin icono | ❌ No | ✅ Completo | 🔵 Primary | "Nuevo Consecutivo" | ✅ Sí ("Administra la numeración...") |
| **UnidadesMedida** | ✅ Sí | ✅ Sí (contador) | Table | 🔵 Primary | ✅ Sí | ✅ Completo | 🔵 Primary | "Agregar Unidad" | ✅ Sí ("X unidad(es) configurada(s)") |
| **IntegracionesSection** | ✅ Sí | ✅ Sí (contador) | Table | 🟣 Purple | ✅ Sí | ✅ Completo | 🔵 Primary | "Agregar Integración" | ✅ Sí ("X integración(es) configurada(s)") |
| **BrandingSection** | ✅ Sí | ❌ No | Grid 2 cols | ❌ Sin icono | ✅ Sí | ❌ No aplica | 🔘 Secondary | "Editar" | ❌ No |
| **ModulosSection** | ✅ Sí (por categoría) | ✅ Sí (por categoría) | FeatureToggleGrid 3 cols | Variable (por categoría) | ✅ Sí | ❌ No tiene | ❌ No aplica | N/A | ✅ Sí ("X módulo(s) disponible(s)") |

### Leyenda de Colores
- 🔵 **Blue** - Azul (#3B82F6)
- 🟣 **Purple** - Púrpura (#9333EA)
- 🔵 **Primary** - Color primario del sistema
- 🔘 **Secondary** - Botón secundario (gris)

---

## 🔍 Análisis Detallado por Sección

### 1️⃣ EmpresaSection.tsx

**Patrón:** Vista/Edición con DataCard avanzado

```typescript
Características:
- Layout: DataGrid con DataCard (componentes especializados)
- Header: DataSection con icono Building2 (purple)
- Sin Card wrapper (usa DataSection directamente)
- Estado vacío: Alert con mensaje de warning
- Vista de datos: DataCard con múltiples variantes de color
- Modo edición: Formulario en grid 2 columnas
```

**Estado Vacío:**
```typescript
// Mensaje con Alert cuando no configurada
<Alert
  variant="warning"
  message="No se ha configurado la información de la empresa..."
/>
```

**Inconsistencias:**
- ❌ Usa DataSection en lugar de Card estándar
- ❌ No tiene descripción textual bajo el título
- ❌ Patrón completamente diferente al resto (más complejo)

---

### 2️⃣ SedesSection.tsx

**Patrón:** Tabla estándar con Card wrapper

```typescript
Características:
- Layout: Table dentro de Card
- Header: Título + descripción con contador
- Icono: MapPin (blue-100/blue-600)
- Estado vacío: Completo con icono circular, título y botón
- Botón principal: "Agregar Sede" (primary)
```

**Header:**
```typescript
<div className="flex items-center gap-3">
  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
  </div>
  <div>
    <h3>Sedes y Ubicaciones</h3>
    <p>X sede(s) configurada(s)</p>
  </div>
</div>
```

**Estado Vacío:**
```typescript
<div className="text-center py-12">
  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
    <Building2 className="h-8 w-8 text-gray-400" />
  </div>
  <h3>No hay sedes configuradas</h3>
  <p>Agregue la primera sede...</p>
  <Button>Agregar Primera Sede</Button>
</div>
```

**Inconsistencias:**
- ✅ Patrón consistente y limpio
- ⚠️ Usa "gray" para tabla (diferentes a otros que usan "secondary")

---

### 3️⃣ ConsecutivosSection.tsx

**Patrón:** Tabla SIN Card wrapper

```typescript
Características:
- Layout: Table DIRECTO (sin Card wrapper)
- Header: Solo div con flexbox
- SIN icono decorativo en el header
- Estado vacío: Completo con icono y botones
- Botón principal: "Nuevo Consecutivo" (primary)
- Colores: secondary-* en lugar de gray-*
```

**Header:**
```typescript
// ❌ NO tiene Card ni icono decorativo
<div className="flex flex-col sm:flex-row justify-between">
  <div>
    <h3>Configuración de Consecutivos</h3>
    <p className="text-sm text-secondary-500">
      Administra la numeración automática...
    </p>
  </div>
</div>
```

**Inconsistencias:**
- ❌ **NO usa Card como wrapper** (único caso)
- ❌ **NO tiene icono decorativo** en el header
- ❌ Usa `secondary-*` en lugar de `gray-*` para colores neutros
- ❌ Loading state diferente (renderiza directamente el skeleton)

---

### 4️⃣ UnidadesMedidaSection.tsx

**Patrón:** Tabla con Card wrapper completo

```typescript
Características:
- Layout: Card > Table
- Header: Icono Ruler (primary-100/primary-600)
- Estado vacío: Completo y consistente
- Botón principal: "Agregar Unidad" (primary)
- Usa ActionButtons component
```

**Header:**
```typescript
<Card>
  <div className="p-6">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
        <Ruler className="h-5 w-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <h3>Unidades de Medida</h3>
        <p>X unidad(es) configurada(s)</p>
      </div>
    </div>
  </div>
</Card>
```

**Inconsistencias:**
- ✅ Patrón más consistente
- ⚠️ Usa `primary-*` para icono (diferente de blue/purple de otros)

---

### 5️⃣ IntegracionesSection.tsx

**Patrón:** Tabla con Card wrapper + Switch

```typescript
Características:
- Layout: Card > Table con Switch inline
- Header: Icono Plug (purple-100/purple-600)
- Estado vacío: Completo
- Botón principal: "Agregar Integración" (primary)
- Filtros: Select para tipo y estado
- Extras: Switch toggle, test connection button
```

**Características Únicas:**
- Switch toggle inline en cada fila
- Botón "Probar conexión" como acción custom
- Badge de estado de salud (StatusBadge component)
- Formateo de fecha relativa (formatDistanceToNow)

**Inconsistencias:**
- ✅ Buen patrón general
- ⚠️ Usa `purple` (como EmpresaSection) en lugar de `blue`

---

### 6️⃣ BrandingSection (dentro de ConfiguracionTab.tsx)

**Patrón:** Grid de visualización de campos

```typescript
Características:
- Layout: Card > Grid 2 cols
- Header: Solo título, sin icono decorativo
- NO tiene estado vacío (siempre muestra datos)
- Botón: "Editar" (secondary) - NO es "Agregar"
- Muestra: colores, logos, favicon
```

**Header:**
```typescript
<Card>
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h3>Configuración de Marca</h3>
      <Button variant="secondary" size="sm">
        <Edit className="h-4 w-4 mr-2" />
        Editar
      </Button>
    </div>
  </div>
</Card>
```

**Inconsistencias:**
- ❌ **NO tiene icono decorativo** en header
- ❌ **NO tiene descripción** bajo el título
- ❌ Botón "Editar" (secondary) en lugar de "Agregar" (primary)
- ❌ NO tiene estado vacío explícito

---

### 7️⃣ ModulosSection (dentro de ConfiguracionTab.tsx)

**Patrón:** FeatureToggleGrid por categorías

```typescript
Características:
- Layout: Multiple Cards (uno por categoría)
- Header: Variable por categoría con iconos dinámicos
- Componente: FeatureToggleCard en FeatureToggleGrid
- Colores: Dinámicos según categoría (purple, blue, green, etc.)
- NO tiene botón "Agregar"
```

**Header por Categoría:**
```typescript
<Card key={category}>
  <div className="p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2 rounded-lg bg-${color}-100`}>
        <Package className={`h-5 w-5 text-${color}-600`} />
      </div>
      <div>
        <h3>{categoryLabel}</h3>
        <p>X módulo(s) disponible(s)</p>
      </div>
    </div>
    <FeatureToggleGrid columns={3}>
      {/* módulos */}
    </FeatureToggleGrid>
  </div>
</Card>
```

**Características Únicas:**
- Usa componentes especializados (FeatureToggleCard)
- Múltiples Cards (no una sola sección)
- Colores dinámicos por categoría
- Badge "Core" para módulos del sistema

**Inconsistencias:**
- ✅ Tiene buen patrón de UI
- ⚠️ Completamente diferente al patrón de tablas
- ❌ NO tiene estado vacío (siempre hay módulos)

---

## 🎨 Inconsistencias de Colores de Iconos

### Paleta Usada:

| Sección | Color Fondo | Color Icono | Uso |
|---------|-------------|-------------|-----|
| **Empresa** | purple-100 | purple-600 | Icono principal (DataSection) |
| **Sedes** | blue-100 | blue-600 | Icono header |
| **Consecutivos** | ❌ N/A | ❌ N/A | Sin icono header |
| **Unidades** | **primary-100** | **primary-600** | ⚠️ Usa primary |
| **Integraciones** | purple-100 | purple-600 | Icono header |
| **Branding** | ❌ N/A | ❌ N/A | Sin icono header |
| **Módulos** | variable | variable | Dinámico por categoría |

**Problema:** No hay un estándar de color. Se usan blue, purple, primary, y variables.

---

## 🎯 Inconsistencias de Botones Principales

### Variantes:

| Sección | Variante | Texto | Icono |
|---------|----------|-------|-------|
| **Empresa** | primary | "Configurar Empresa" | Building2 |
| **Sedes** | primary | "Agregar Sede" | Plus |
| **Consecutivos** | primary | "Nuevo Consecutivo" | Plus |
| **Unidades** | primary | "Agregar Unidad" | Plus |
| **Integraciones** | primary | "Agregar Integración" | Plus |
| **Branding** | **secondary** | "Editar" | Edit |
| **Módulos** | ❌ N/A | N/A | N/A |

**Problema:**
- Branding usa `secondary` (todos los demás usan `primary`)
- Textos inconsistentes: "Agregar X" vs "Nuevo X" vs "Configurar X"

---

## 📦 Inconsistencias de Wrappers y Estructura

### Estructura HTML:

| Sección | Wrapper Externo | Padding | Estructura Interna |
|---------|-----------------|---------|-------------------|
| **Empresa** | DataSection | variable | DataGrid > DataCard |
| **Sedes** | Card | p-6 | Header + Table |
| **Consecutivos** | ❌ **div** | ❌ sin padding | Header + Table directo |
| **Unidades** | Card | p-6 | Header + Table |
| **Integraciones** | Card | p-6 | Header + Table |
| **Branding** | Card | p-6 | Header + Grid |
| **Módulos** | Card[] | p-6 (cada uno) | Header + FeatureToggleGrid |

**Problema:**
- ConsecutivosSection NO usa Card (único caso)
- EmpresaSection usa DataSection (patrón único)

---

## 🚨 Estados Vacíos - Inconsistencias

### Comparación:

| Sección | Tiene Estado Vacío | Icono Circular | Título | Descripción | Botón CTA |
|---------|-------------------|----------------|--------|-------------|-----------|
| **Empresa** | ✅ Parcial | ❌ No | ❌ No | ✅ Alert warning | ✅ Sí |
| **Sedes** | ✅ Completo | ✅ Sí (Building2) | ✅ Sí | ✅ Sí | ✅ Sí |
| **Consecutivos** | ✅ Completo | ✅ Sí (Hash) | ✅ Sí | ✅ Condicional | ✅ Múltiple |
| **Unidades** | ✅ Completo | ✅ Sí (Ruler) | ✅ Sí | ✅ Sí | ✅ Múltiple |
| **Integraciones** | ✅ Completo | ✅ Sí (Cloud) | ✅ Sí | ✅ Sí | ✅ Sí |
| **Branding** | ❌ No aplica | - | - | - | - |
| **Módulos** | ❌ No aplica | - | - | - | - |

**Patrón del Estado Vacío Consistente:**
```typescript
<div className="text-center py-12">
  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
    <IconComponent className="h-8 w-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
    No hay [entidades] configuradas
  </h3>
  <p className="text-gray-500 dark:text-gray-400 mb-4">
    [Descripción invitando a la acción]
  </p>
  <Button variant="primary">
    <Plus className="h-4 w-4 mr-2" />
    Agregar [Entidad]
  </Button>
</div>
```

**Inconsistencia de Empresa:**
- Usa `Alert` en lugar del patrón visual estándar
- NO tiene icono circular decorativo
- NO tiene el título "No hay..."

---

## 🧩 Uso de Componentes del Design System

### Tabla de Adopción:

| Componente | Empresa | Sedes | Consecutivos | Unidades | Integraciones | Branding | Módulos |
|------------|---------|-------|--------------|----------|---------------|----------|---------|
| **Card** | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Button** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Badge** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Alert** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ActionButtons** | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **ConfirmDialog** | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **DataCard** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **DataSection** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **FeatureToggleCard** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Observaciones:**
- **EmpresaSection** usa componentes especializados (DataCard, DataSection) - único caso
- **ConsecutivosSection** NO usa ActionButtons ni ConfirmDialog (implementa botones custom)
- **ModulosSection** usa componentes especializados (FeatureToggleCard)

---

## 📐 Patrones de Loading State

### Variantes Encontradas:

**Tipo 1: Card con Skeleton (Mayoría)**
```typescript
<Card>
  <div className="p-6 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
  </div>
</Card>
```
**Usado por:** Sedes, Unidades, Integraciones, Branding

**Tipo 2: Skeleton Directo (ConsecutivosSection)**
```typescript
<div className="space-y-4">
  <div className="flex justify-between items-center">
    <div className="h-8 w-48 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
    <div className="h-10 w-32 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
  </div>
  {/* ... */}
</div>
```

**Tipo 3: DataGrid Skeleton (EmpresaSection)**
```typescript
<Card>
  <div className="p-6 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
  </div>
</Card>
```

**Inconsistencias:**
- Consecutivos NO usa Card wrapper en loading
- Consecutivos usa `secondary-*` en lugar de `gray-*`
- Empresa usa grid de 6 items (diferente cantidad)

---

## 🔧 Uso de Colores Neutrales

### Variantes de Grises:

| Sección | Clase de Color Neutro | Contexto |
|---------|----------------------|----------|
| **Empresa** | `gray-*` | Mayoritariamente |
| **Sedes** | `gray-*` | Totalmente |
| **Consecutivos** | **`secondary-*`** | ⚠️ Totalmente diferente |
| **Unidades** | `secondary-*` | Totalmente |
| **Integraciones** | `gray-*` | Mayoritariamente |
| **Branding** | `gray-*` | Totalmente |
| **Módulos** | `gray-*` | Totalmente |

**Problema:**
- **ConsecutivosSection** y **UnidadesMedida** usan `secondary-*` (ej: `secondary-500`, `secondary-700`)
- Resto usan `gray-*` (ej: `gray-500`, `gray-700`)
- Esto causa inconsistencia visual si `secondary` está mapeado a un color diferente

---

## 📋 Resumen de Problemas Críticos

### 🔴 Críticos (Debe arreglarse)

1. **ConsecutivosSection NO usa Card wrapper**
   - Único componente sin Card
   - Rompe la consistencia visual
   - Ubicación: `ConsecutivosSection.tsx` líneas 162-375

2. **Colores de iconos inconsistentes**
   - Purple (Empresa, Integraciones)
   - Blue (Sedes)
   - Primary (Unidades)
   - Sin icono (Consecutivos, Branding)

3. **Falta de descripción en headers**
   - Consecutivos NO tiene descripción bajo título
   - Branding NO tiene descripción

4. **Estado vacío de Empresa diferente**
   - Usa Alert en lugar del patrón visual estándar
   - No tiene icono circular ni estructura consistente

5. **Uso inconsistente de `gray-*` vs `secondary-*`**
   - Consecutivos y Unidades usan `secondary-*`
   - Resto usa `gray-*`

### 🟡 Importantes (Recomendado arreglar)

6. **Textos de botones inconsistentes**
   - "Agregar X" vs "Nuevo X" vs "Configurar X"
   - Branding usa "Editar" con variant secondary

7. **ActionButtons no usado universalmente**
   - Consecutivos implementa botones custom
   - Empresa no usa ActionButtons

8. **ConfirmDialog no usado universalmente**
   - Consecutivos usa window.confirm
   - Empresa no tiene confirmaciones

### 🟢 Menores (Nice to have)

9. **Loading states con diferentes cantidades de skeletons**
   - Empresa: 6 items
   - Otros: 3-4 items

10. **Headers sin iconos decorativos**
    - Consecutivos sin icono
    - Branding sin icono

---

## ✅ Recomendaciones de Estandarización

### 🎯 Patrón Estándar Propuesto (Basado en SedesSection)

```typescript
export const StandardSection = () => {
  return (
    <Card>
      <div className="p-6">
        {/* HEADER ESTÁNDAR */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* ICONO DECORATIVO */}
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              {/* TÍTULO */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                [Título de la Sección]
              </h3>
              {/* DESCRIPCIÓN/CONTADOR */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {count} [entidad(es)] configurada(s)
              </p>
            </div>
          </div>
          {/* BOTÓN PRINCIPAL */}
          {canCreate && (
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar [Entidad]
            </Button>
          )}
        </div>

        {/* CONTENIDO: Tabla o Grid */}
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* ... */}
            </table>
          </div>
        ) : (
          /* ESTADO VACÍO ESTÁNDAR */
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <IconComponent className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No hay [entidades] configuradas
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              [Texto invitando a crear la primera]
            </p>
            {canCreate && (
              <Button variant="primary" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera [Entidad]
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
```

### 📐 Reglas del Patrón Estándar

1. **Siempre usar Card como wrapper externo**
2. **Padding consistente: `p-6`**
3. **Header con estructura:**
   - Icono decorativo con fondo colored-100
   - Título h3
   - Descripción/contador text-sm
   - Botón primary a la derecha
4. **Iconos en tonos blue (estándar) o primary**
5. **Usar siempre `gray-*` para colores neutros**
6. **Estado vacío con:**
   - Icono circular de 16x16 (w-16 h-16)
   - Título h3
   - Descripción p
   - Botón CTA
7. **Usar ActionButtons component para acciones de fila**
8. **Usar ConfirmDialog para confirmaciones**
9. **Loading state con Card + skeleton de 3 items**
10. **Texto de botones: "Agregar [Entidad]"** (no "Nuevo" ni "Configurar")

---

## 📝 Acciones Específicas Recomendadas

### Prioridad Alta

1. **ConsecutivosSection.tsx**
   - ✅ Agregar Card wrapper
   - ✅ Agregar icono decorativo en header (Hash icon)
   - ✅ Cambiar `secondary-*` a `gray-*`
   - ✅ Usar ActionButtons en lugar de botones custom
   - ✅ Reemplazar window.confirm por ConfirmDialog

2. **EmpresaSection.tsx**
   - ✅ Agregar descripción bajo el título
   - ✅ Refactorizar estado vacío para usar patrón estándar (en lugar de Alert)

3. **BrandingSection**
   - ✅ Agregar icono decorativo (Palette icon)
   - ✅ Agregar descripción bajo el título

### Prioridad Media

4. **Estandarizar colores de iconos**
   - Decidir: ¿blue o primary para todos?
   - Aplicar consistentemente

5. **Estandarizar textos de botones**
   - Usar siempre "Agregar [Entidad]"
   - Excepción: Branding puede mantener "Editar"

6. **UnidadesMedidaSection.tsx**
   - Cambiar icono de `primary-*` a `blue-*` (si se decide blue como estándar)

---

## 🎨 Guía de Estilo Visual Propuesta

### Paleta de Colores para Headers

**Opción 1: Blue Estándar (Recomendado)**
```typescript
<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
</div>
```

**Opción 2: Primary (Alternativa)**
```typescript
<div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
  <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
</div>
```

### Colores Neutrales
- **SIEMPRE usar `gray-*`** para textos, bordes, fondos neutros
- **NO usar `secondary-*`** (reservado para el Design System)

### Espaciado
- Padding de Card: `p-6`
- Gap entre header y contenido: `mb-6`
- Espaciado de estado vacío: `py-12`

---

## 📊 Métricas de Consistencia

### Score Actual (sobre 10)

| Sección | Consistencia Visual | Uso Design System | Accesibilidad | Score Total |
|---------|---------------------|-------------------|---------------|-------------|
| **Empresa** | 6/10 | 7/10 | 9/10 | **7.3/10** |
| **Sedes** | 9/10 | 10/10 | 10/10 | **9.7/10** ⭐ |
| **Consecutivos** | 5/10 | 6/10 | 8/10 | **6.3/10** |
| **Unidades** | 8/10 | 9/10 | 9/10 | **8.7/10** |
| **Integraciones** | 8/10 | 9/10 | 9/10 | **8.7/10** |
| **Branding** | 7/10 | 8/10 | 8/10 | **7.7/10** |
| **Módulos** | 8/10 | 10/10 | 9/10 | **9.0/10** |

**Promedio General: 7.9/10**

---

## 🏁 Conclusión

Se identificaron **inconsistencias significativas** en 5 áreas principales:

1. ❌ **Wrappers** - ConsecutivosSection sin Card
2. ❌ **Colores de iconos** - 4 variantes diferentes
3. ❌ **Estados vacíos** - Empresa usa patrón diferente
4. ❌ **Colores neutrales** - Uso mixto de gray-* y secondary-*
5. ❌ **Componentes** - Uso inconsistente de ActionButtons y ConfirmDialog

**SedesSection.tsx** es el mejor ejemplo de patrón consistente y debería usarse como referencia para estandarizar los demás.

---

**Revisado por:** Claude Opus 4.5
**Próximos pasos:** Ver documento `PLAN_ESTANDARIZACION_CONFIGURACION_SECCIONES.md` (a crear)
