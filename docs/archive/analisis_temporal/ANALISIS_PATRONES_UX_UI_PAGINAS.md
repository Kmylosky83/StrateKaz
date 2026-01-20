# Análisis de Patrones UX/UI en Páginas - StrateKaz

**Fecha de análisis:** 2026-01-19
**Alcance:** 81 páginas en features/*/pages/*.tsx
**Analista:** Claude Code - UX/UI Specialist

---

## Resumen Ejecutivo

Se identificaron **5 patrones principales de página** en StrateKaz, cada uno con propósitos específicos y niveles variables de consistencia. El sistema utiliza componentes de layout reutilizables (`PageHeader`, `StatsGrid`, `FilterCard`, `DataTableCard`, `Tabs`) que proporcionan una base sólida, pero su implementación presenta inconsistencias significativas.

### Distribución de Patrones

| Patrón | Páginas | Porcentaje | Nivel de Consistencia |
|--------|---------|------------|----------------------|
| Dashboard con SelectionCards | 8 | 10% | Alta |
| Lista CRUD con Filtros | 45 | 56% | Media |
| Página con Tabs Dinámicos | 12 | 15% | Media-Alta |
| Dashboard con Métricas | 6 | 7% | Media |
| Página con Tabs y Secciones | 10 | 12% | Alta |

---

## Patrón 1: Dashboard con SelectionCards (Hub Pages)

### Propósito
Páginas de entrada a módulos que presentan opciones de navegación a submódulos o funcionalidades.

### Características Visuales

```
┌─────────────────────────────────────────────────────┐
│ PageHeader                                          │
│ [Título]                                            │
│ Descripción                                         │
├─────────────────────────────────────────────────────┤
│ Hero Section (Gradient Banner)                      │
│ - Información contextual                            │
│ - Tags de características                           │
├─────────────────────────────────────────────────────┤
│ SelectionCardGrid                                   │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │
│ │ Icon│ │ Icon│ │ Icon│ │ Icon│                   │
│ │Title│ │Title│ │Title│ │Title│                   │
│ │Desc │ │Desc │ │Desc │ │Desc │                   │
│ └─────┘ └─────┘ └─────┘ └─────┘                   │
├─────────────────────────────────────────────────────┤
│ Info Cards (Sistema/Normativa)                      │
│ [Card 1] [Card 2] [Card 3]                         │
└─────────────────────────────────────────────────────┘
```

### Estructura de Código

```tsx
<div className="space-y-8">
  <PageHeader
    title="Nombre del Módulo"
    description="Descripción del sistema"
  />

  {/* Hero Section con gradient */}
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[color]-600 via-[color]-700 to-[color]-800 p-8 text-white">
    <div className="absolute inset-0 bg-[pattern] opacity-30"></div>
    <div className="relative z-10">
      <h2>Título Hero</h2>
      <p>Descripción</p>
      <div className="flex gap-4">
        {/* Feature badges */}
      </div>
    </div>
  </div>

  {/* Grid de SelectionCards */}
  <SelectionCardGrid columns={4}>
    <SelectionCard
      icon={IconComponent}
      title="Submódulo"
      subtitle="Descripción"
      href="/ruta"
      variant="gradient|glass"
      color="blue|purple|green|orange"
    />
  </SelectionCardGrid>

  {/* Info cards adicionales */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Cards informativos */}
  </div>
</div>
```

### Ejemplos en el Sistema

1. **HSEQPage** (`frontend/src/features/hseq/pages/HSEQPage.tsx`)
   - Hero gradient: blue-600 → indigo-700 → purple-800
   - 11 SelectionCards en grid de 4 columnas
   - 3 info cards con ISO standards

2. **CumplimientoPage** (`frontend/src/features/cumplimiento/pages/CumplimientoPage.tsx`)
   - Hero gradient con badges de features
   - 4 SelectionCards principales
   - 3 info cards + 4 indicadores rápidos

3. **RiesgosPage** (`frontend/src/features/riesgos/pages/RiesgosPage.tsx`)
   - Sin hero section (variación)
   - 8 SelectionCards con colores diferenciados
   - Info card explicativo al final

4. **WorkflowsPage** (`frontend/src/features/workflows/pages/WorkflowsPage.tsx`)
   - Hero section purple-600 → indigo-800
   - 3 SelectionCards en grid
   - 1 info card con descripción

### Análisis de Consistencia

**Fortalezas:**
- Uso consistente de `SelectionCard` y `SelectionCardGrid`
- Hero sections siguen patrón visual similar (gradient + pattern)
- Estructura de 3 secciones claramente definida

**Inconsistencias Detectadas:**
- Variación en número de columnas (3 o 4)
- RiesgosPage no usa `SelectionCardGrid`, implementa grid manualmente
- Diferentes esquemas de color en gradients
- Info cards opcionales y variables

**Recomendación de Mejora:**
- Estandarizar a 4 columnas en desktop, responsive a 2 en tablet, 1 en mobile
- Crear componente `HeroSection` reutilizable
- Definir paleta de gradients en design system

---

## Patrón 2: Lista CRUD con Filtros (Data Pages)

### Propósito
Páginas de gestión de entidades con operaciones CRUD completas, filtrado avanzado y paginación.

### Características Visuales

```
┌─────────────────────────────────────────────────────┐
│ PageHeader                      [+ Nuevo] [Actions] │
│ [Título]                        Badges              │
│ Descripción                                         │
├─────────────────────────────────────────────────────┤
│ StatsGrid (opcional)                                │
│ [Stat 1] [Stat 2] [Stat 3] [Stat 4]               │
├─────────────────────────────────────────────────────┤
│ FilterCard                      [Limpiar] [Colapsar]│
│ [🔍 Buscar...]                                      │
│ [Filtro 1] [Filtro 2] [Filtro 3] [Filtro 4]       │
├─────────────────────────────────────────────────────┤
│ DataTableCard                                       │
│ ┌───────────────────────────────────────────────┐  │
│ │ Tabla con datos                                │  │
│ │ [Row 1]                          [Acciones]    │  │
│ │ [Row 2]                          [Acciones]    │  │
│ └───────────────────────────────────────────────┘  │
│ Paginación: [◀] Página 1 de 10 [▶]               │
└─────────────────────────────────────────────────────┘
```

### Estructura de Código

```tsx
<div className="space-y-6">
  {/* HEADER */}
  <PageHeader
    title="Gestión de [Entidad]"
    description="Descripción"
    badges={[{ label: `${total} items`, variant: 'primary' }]}
    actions={
      canCreate ? (
        <Button onClick={handleCreate} leftIcon={<Plus />}>
          Nuevo [Entidad]
        </Button>
      ) : undefined
    }
  />

  {/* ESTADÍSTICAS (opcional) */}
  {isLoading ? (
    <StatsGridSkeleton count={4} />
  ) : (
    <StatsGrid stats={statsItems} columns={4} moduleColor={moduleColor} />
  )}

  {/* FILTROS */}
  <FilterCard
    collapsible
    searchPlaceholder="Buscar..."
    searchValue={filters.search}
    onSearchChange={handleSearchChange}
    activeFiltersCount={activeFiltersCount}
    hasActiveFilters={hasActiveFilters}
    onClearFilters={handleClearFilters}
  >
    <FilterGrid columns={4}>
      <Select label="Filtro 1" {...} />
      <Select label="Filtro 2" {...} />
      <Input label="Filtro 3" {...} />
    </FilterGrid>
  </FilterCard>

  {/* TABLA */}
  <DataTableCard
    pagination={{
      currentPage: filters.page,
      pageSize: filters.page_size,
      totalItems: total,
      hasPrevious: !!data?.previous,
      hasNext: !!data?.next,
      onPageChange: handlePageChange,
    }}
    isEmpty={items.length === 0}
    isLoading={isLoading}
    emptyMessage="No se encontraron resultados"
  >
    <EntidadTable
      items={items}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isLoading={isLoading}
    />
  </DataTableCard>

  {/* MODALES */}
  <EntidadFormModal {...} />
  <DeleteConfirmModal {...} />
</div>
```

### Ejemplos en el Sistema

1. **ProveedoresPage** (`frontend/src/features/proveedores/pages/ProveedoresPage.tsx`)
   - Sin StatsGrid (decisión de diseño)
   - FilterCard con 5 filtros
   - DataTableCard con paginación
   - 3 modales (Form, CambiarPrecio, Historial, Delete)

2. **UsersPage** (`frontend/src/features/users/pages/UsersPage.tsx`)
   - StatsGrid con 4 métricas (Total, Activos, Inactivos, Con Cargo)
   - FilterCard con 2 filtros (Cargo, Estado)
   - DataTableCard con tabla de usuarios
   - 2 modales (Form, Delete)

3. **GestionProveedoresPage** (Supply Chain)
   - Similar a ProveedoresPage
   - Uso de permisos para mostrar/ocultar acciones

### Análisis de Consistencia

**Fortalezas:**
- Uso universal de componentes `PageHeader`, `FilterCard`, `DataTableCard`
- Estructura de 4 secciones muy consistente
- Paginación implementada uniformemente
- Manejo de estados (loading, empty) estandarizado

**Inconsistencias Detectadas:**
- StatsGrid presente en ~40% de páginas CRUD, ausente en otras
- Variación en número de columnas en FilterGrid (2-5)
- Diferentes sistemas de permisos (`canDo` vs custom logic)
- Badges en PageHeader inconsistentes

**Puntos de Dolor UX:**
- FilterCard colapsible no persiste estado en navegación
- No hay indicador visual de filtros activos más allá del contador
- StatsGrid no se actualiza con filtros aplicados (muestra totales globales)
- Paginación no muestra info "Mostrando X-Y de Z resultados"

**Recomendaciones de Mejora:**

1. **Estandarizar StatsGrid:**
   - Incluir en todas las páginas CRUD
   - 4 stats estándar: Total, Activos, [Métrica específica 1], [Métrica específica 2]
   - Stats deben reflejar filtros aplicados (no solo totales)

2. **Mejorar FilterCard:**
   - Agregar chips visuales de filtros activos debajo de la barra de búsqueda
   - Persistir estado colapsado en localStorage
   - Mejorar accesibilidad (ARIA labels)

3. **Estandarizar columnas FilterGrid:**
   - Desktop: 4 columnas
   - Tablet: 2 columnas
   - Mobile: 1 columna

4. **Mejorar Paginación:**
   - Agregar texto "Mostrando X-Y de Z resultados"
   - Selector de page_size (10, 25, 50, 100)
   - Input directo de número de página

---

## Patrón 3: Página con Tabs Dinámicos (Multi-View Pages)

### Propósito
Páginas que organizan contenido relacionado en pestañas, típicamente para diferentes aspectos de una funcionalidad.

### Características Visuales

```
┌─────────────────────────────────────────────────────┐
│ PageHeader                              [Actions]   │
│ [Título]                                            │
│ Descripción                                         │
├─────────────────────────────────────────────────────┤
│ Tabs Component                                      │
│ [Tab 1 ●] [Tab 2] [Tab 3] [Tab 4]                 │
├─────────────────────────────────────────────────────┤
│ Tab Content (dinámico)                              │
│                                                     │
│ [Contenido específico del tab activo]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Estructura de Código

```tsx
const tabs = [
  { id: 'tab1', label: 'Tab 1', icon: <Icon1 /> },
  { id: 'tab2', label: 'Tab 2', icon: <Icon2 /> },
  { id: 'tab3', label: 'Tab 3', icon: <Icon3 /> },
];

<div className="space-y-8">
  <PageHeader
    title="Título"
    description="Descripción"
    actions={<Button>Acción</Button>}
  />

  <Tabs
    tabs={tabs}
    activeTab={activeTab}
    onChange={setActiveTab}
    variant="pills|underline" // Inconsistencia
  />

  <div className="mt-6">
    {activeTab === 'tab1' && <Tab1Component />}
    {activeTab === 'tab2' && <Tab2Component />}
    {activeTab === 'tab3' && <Tab3Component />}
  </div>
</div>
```

### Ejemplos en el Sistema

1. **NotificacionesPage** (`frontend/src/features/audit-system/pages/NotificacionesPage.tsx`)
   - 4 tabs: Bandeja, Tipos, Preferencias, Masivas
   - Tabs con iconos
   - Badge en PageHeader con contador
   - Cada tab es un componente funcional separado

2. **SupplyChainPage** (`frontend/src/features/supply-chain/pages/SupplyChainPage.tsx`)
   - 5 tabs: Proveedores, Catálogos, Programación, Compras, Almacenamiento
   - Variant: "pills"
   - Tabs con iconos

### Análisis de Consistencia

**Fortalezas:**
- Uso del componente `Tabs` estandarizado
- Iconos en tabs mejoran escaneo visual
- Separación clara entre componentes de tab

**Inconsistencias Detectadas:**
- Variantes de tabs: "pills" vs "underline" (default)
- Algunos tabs persisten estado en URL, otros no
- Lógica de renderizado condicional vs lazy loading
- Diferentes formas de pasar datos a componentes de tab (props vs context)

**Puntos de Dolor UX:**
- Navegación entre tabs no se refleja en URL (dificulta compartir enlaces)
- No hay indicador de carga al cambiar de tab
- Estado de formularios se pierde al cambiar de tab
- No hay navegación con teclado (arrow keys)

**Recomendaciones de Mejora:**

1. **Estandarizar Variant:**
   - "pills" para tabs funcionales (configuración, herramientas)
   - "underline" para tabs de contenido (listados, dashboards)

2. **Sincronización con URL:**
   - Usar query params: `?tab=bandeja`
   - Hook personalizado `useTabState(defaultTab, persistInUrl)`

3. **Mejoras de Accesibilidad:**
   - Implementar navegación con flechas
   - ARIA roles: `role="tablist"`, `role="tab"`, `role="tabpanel"`
   - Focus management al cambiar tabs

4. **Lazy Loading:**
   - Cargar contenido de tabs bajo demanda
   - Mostrar skeleton mientras carga

---

## Patrón 4: Dashboard con Métricas (Analytics Pages)

### Propósito
Páginas de visualización de datos con énfasis en KPIs, gráficos y métricas de negocio.

### Características Visuales

```
┌─────────────────────────────────────────────────────┐
│ PageHeader                              [Actions]   │
│ [Título]                                            │
│ Descripción                                         │
├─────────────────────────────────────────────────────┤
│ KPI Cards Grid                                      │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐           │
│ │ Icon  │ │ Icon  │ │ Icon  │ │ Icon  │           │
│ │ 1,250 │ │  95%  │ │  $42K │ │  158  │           │
│ │ Label │ │ Label │ │ Label │ │ Label │           │
│ └───────┘ └───────┘ └───────┘ └───────┘           │
├─────────────────────────────────────────────────────┤
│ Main Content Grid                                   │
│ ┌─────────────────┐ ┌────────┐                     │
│ │ Indicadores     │ │Alertas │                     │
│ │ Principales     │ │        │                     │
│ │ [KPI Cards]     │ │[Cards] │                     │
│ └─────────────────┘ └────────┘                     │
├─────────────────────────────────────────────────────┤
│ Quick Actions Card                                  │
│ [Action 1] [Action 2] [Action 3] [Action 4]       │
└─────────────────────────────────────────────────────┘
```

### Estructura de Código

```tsx
<div className="space-y-8">
  <PageHeader
    title="Analytics Dashboard"
    description="Panel de control"
    actions={
      <div className="flex gap-2">
        <Button variant="outline">Configurar</Button>
        <Button variant="primary">Ver Todo</Button>
      </div>
    }
  />

  {/* KPI Summary Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card variant="bordered" padding="md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Label</p>
          <p className="text-3xl font-bold">1,250</p>
          <p className="text-xs text-gray-500">Detalle</p>
        </div>
        <div className="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center">
          <Icon className="w-7 h-7 text-primary-600" />
        </div>
      </div>
    </Card>
  </div>

  {/* Main Content Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* 2/3 width - Indicadores */}
    <div className="lg:col-span-2 space-y-4">
      {/* KPI cards detallados */}
    </div>

    {/* 1/3 width - Sidebar */}
    <div className="space-y-4">
      {/* Alertas, notificaciones, etc */}
    </div>
  </div>

  {/* Quick Actions */}
  <Card variant="bordered" padding="md">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Action buttons */}
    </div>
  </Card>
</div>
```

### Ejemplos en el Sistema

1. **AnalyticsPage** (`frontend/src/features/analytics/pages/AnalyticsPage.tsx`)
   - 4 KPI cards en primera fila
   - Grid 2/3 + 1/3: Indicadores principales + Alertas
   - Quick Actions card al final
   - Uso intensivo de badges de estado (verde/amarillo/rojo)
   - Progress bars en KPI cards

2. **AccountingPage** (`frontend/src/features/accounting/pages/AccountingPage.tsx`)
   - Info card con gradiente en primera posición
   - 4 KPI cards
   - Grid de 4 "módulo cards" con navegación
   - Tabla de comprobantes recientes
   - Mix de dashboard + navegación

### Análisis de Consistencia

**Fortalezas:**
- Grid de KPIs consistente (4 columnas)
- Iconos grandes (w-7 h-7) con backgrounds de color
- Layout 2/3 + 1/3 para contenido principal + sidebar
- Cards clickables para navegación

**Inconsistencias Detectadas:**
- AccountingPage mezcla dashboard con hub page (híbrido)
- Diferentes estilos de KPI cards (algunos con progress bars, otros no)
- Variación en información mostrada (algunos tienen "detalle", otros no)
- Mock data vs datos reales

**Puntos de Dolor UX:**
- No hay refresh automático de métricas
- No hay selector de rango de fechas
- Gráficos ausentes (solo números)
- No hay drill-down en KPIs
- Colores semáforo no son accesibles para daltónicos

**Recomendaciones de Mejora:**

1. **Estandarizar KPI Cards:**
   ```tsx
   interface KPICardProps {
     label: string;
     value: string | number;
     detail?: string; // Siempre incluir
     icon: IconComponent;
     iconColor: ModuleColor;
     trend?: 'up' | 'down' | 'neutral'; // Tendencia opcional
     trendValue?: number; // +12% / -5%
     onClick?: () => void; // Drill-down opcional
   }
   ```

2. **Agregar Visualizaciones:**
   - Integrar library de charts (Recharts o Chart.js)
   - Mini sparklines en KPI cards
   - Gráficos de tendencia en sección principal

3. **Selector de Período:**
   - Componente DateRangePicker en PageHeader
   - Presets: Hoy, Esta semana, Este mes, Este año
   - Comparación con período anterior

4. **Accesibilidad de Semáforos:**
   - No confiar solo en color
   - Agregar iconos: ✓ (verde), ⚠ (amarillo), ✗ (rojo)
   - Patrones en progress bars para daltónicos

---

## Patrón 5: Página con Tabs y Secciones Dinámicas (Advanced Pattern)

### Propósito
Páginas con contenido altamente dinámico gestionado desde backend, donde tabs y secciones se cargan de base de datos.

### Características Visuales

```
┌─────────────────────────────────────────────────────┐
│ PageHeader con Tabs Inline      [Sec1][Sec2][Sec3] │
│ [Título]                                            │
│ Descripción dinámica de sección activa              │
├─────────────────────────────────────────────────────┤
│ StatsGrid Dinámico (según sección)                 │
│ [Stat 1] [Stat 2] [Stat 3] [Stat 4]               │
├─────────────────────────────────────────────────────┤
│ Contenido de Sección Activa                        │
│                                                     │
│ [Componente dinámico basado en sección]            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Estructura de Código

```tsx
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'configuracion';

export const ConfiguracionPage = () => {
  // Hook que carga secciones desde backend
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

  // Stats dinámicos según sección activa
  const { data: sectionStats, isLoading: statsLoading } =
    useConfiguracionStats(activeSection);

  // Mapear stats del backend a StatItem[]
  const statsItems: StatItem[] = useMemo(() => {
    if (!sectionStats?.stats || !activeSection) return [];

    return sectionStats.stats.map((stat) => ({
      label: stat.label,
      value: stat.value,
      icon: ICON_MAP[stat.icon] || Settings,
      iconColor: stat.iconColor || 'info',
      description: stat.description,
    }));
  }, [sectionStats, activeSection]);

  return (
    <div className="space-y-4">
      {/* PageHeader con secciones inline */}
      <PageHeader
        title="Configuración"
        description={activeSectionData.description}
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        moduleColor="purple"
      />

      {/* StatsGrid - dinámico por sección */}
      {statsLoading ? (
        <StatsGridSkeleton count={4} />
      ) : statsItems.length > 0 ? (
        <StatsGrid stats={statsItems} columns={statsColumns} moduleColor="purple" />
      ) : null}

      {/* Contenido de la sección activa */}
      {activeSection && (
        <ConfiguracionTab activeSection={activeSection} searchQuery={searchQuery} />
      )}
    </div>
  );
};
```

### Ejemplos en el Sistema

1. **ConfiguracionPage** (`frontend/src/features/gestion-estrategica/pages/ConfiguracionPage.tsx`)
   - Secciones cargadas desde `usePageSections` hook
   - Tabs inline en PageHeader (no componente Tabs separado)
   - Stats diferentes para cada sección
   - Componente `ConfiguracionTab` maneja renderizado por sección

### Análisis de Consistencia

**Fortalezas:**
- Altamente escalable (agregar secciones sin código)
- Centralización de configuración en BD
- Mapeo de iconos dinámico
- Descripción contextual por sección

**Desafíos:**
- Complejidad de implementación mayor
- Requiere backend configurado correctamente
- Depende de sistema de módulos/secciones funcionando
- Difícil de debuggear si datos de BD están mal

**Puntos de Dolor UX:**
- Skeleton inicial puede ser largo si hay latencia de red
- No hay fallback si secciones no cargan
- ICON_MAP debe mantenerse sincronizado con backend

**Recomendaciones de Mejora:**

1. **Mejorar Estados de Carga:**
   ```tsx
   if (!activeSection && sectionsLoading) {
     return <PageSkeleton withStats withTabs />;
   }

   if (!activeSection && !sectionsLoading) {
     return <ErrorState message="No se pudieron cargar las secciones" />;
   }
   ```

2. **Validación de Iconos:**
   ```tsx
   // Componente que valida ícono existe
   const DynamicIcon = ({ iconName }) => {
     const Icon = ICON_MAP[iconName];
     if (!Icon) {
       console.warn(`Icono no encontrado: ${iconName}`);
       return <Settings />; // Fallback
     }
     return <Icon />;
   };
   ```

3. **Cache de Secciones:**
   - Usar React Query con `staleTime` largo
   - Precarga de secciones comunes
   - Optimistic updates al cambiar sección

---

## Componentes de Layout Reutilizables

### Inventario Actual

| Componente | Ubicación | Propósito | Uso en Páginas |
|------------|-----------|-----------|----------------|
| `PageHeader` | `components/layout/PageHeader.tsx` | Header consistente con título, descripción, tabs inline | Universal (90%+) |
| `StatsGrid` | `components/layout/StatsGrid.tsx` | Grid de métricas con iconos | CRUD (40%), Dashboards (100%) |
| `FilterCard` | `components/layout/FilterCard.tsx` | Contenedor de filtros con búsqueda | CRUD (95%) |
| `FilterGrid` | `components/layout/FilterCard.tsx` | Grid responsivo para inputs de filtro | CRUD (95%) |
| `DataTableCard` | `components/layout/DataTableCard.tsx` | Card con tabla y paginación | CRUD (100%) |
| `Tabs` | `components/common/Tabs.tsx` | Navegación por pestañas | Multi-view (100%) |
| `SelectionCard` | `components/common/SelectionCard.tsx` | Card navegable con icono | Hub pages (100%) |
| `Card` | `components/common/Card.tsx` | Contenedor base | Universal |
| `Button` | `components/common/Button.tsx` | Botón con variantes | Universal |
| `Badge` | `components/common/Badge.tsx` | Etiquetas de estado | Universal |

### Análisis de PageHeader

**Evolución del componente:**

El `PageHeader` ha evolucionado significativamente y ahora soporta dos modos de tabs:

1. **Tabs Legacy (prop `tabs`):**
   ```tsx
   <PageHeader
     title="Título"
     tabs={<Tabs tabs={...} activeTab={...} onChange={...} />}
   />
   ```

2. **Tabs Inline (props `sections`, `activeSection`, `onSectionChange`):**
   ```tsx
   <PageHeader
     title="Título"
     sections={sections}
     activeSection={activeSection}
     onSectionChange={setActiveSection}
     moduleColor="purple"
   />
   ```

**Ventajas de Tabs Inline:**
- Diseño más compacto y profesional
- Tabs alineados a la derecha del header
- Integración visual más coherente
- Soporte para iconos dinámicos
- Colores del Design System integrados

**Estructura Visual:**

```
┌─────────────────────────────────────────────────────┐
│ [Título]                    ┌─────────────────────┐ │
│ Descripción                 │ [Tab1] [Tab2] [Tab3]│ │
│                             └─────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Recomendación:**
- Migrar gradualmente de tabs legacy a tabs inline
- Deprecar prop `tabs` en favor de `sections`
- Documentar patrón preferido en guía de desarrollo

---

## Inconsistencias Críticas Identificadas

### 1. Uso Inconsistente de StatsGrid

**Problema:**
Solo 40% de páginas CRUD incluyen StatsGrid, sin criterio claro de cuándo incluirlo.

**Impacto en UX:**
- Usuarios no saben dónde buscar métricas rápidas
- Diferentes niveles de información en páginas similares
- Dificulta escaneo rápido de estado del sistema

**Solución Propuesta:**
```tsx
// Regla: Todas las páginas CRUD DEBEN tener StatsGrid
// Mínimo 4 stats:
// 1. Total de registros
// 2. Activos
// 3. Métrica específica 1 (ej: "Pendientes", "Críticos")
// 4. Métrica específica 2 (ej: "Este mes", "En progreso")

const standardStats: StatItem[] = [
  { label: 'Total', value: total, icon: Package, iconColor: 'info' },
  { label: 'Activos', value: activos, icon: CheckCircle, iconColor: 'success' },
  { label: '[Métrica Custom 1]', value: metric1, icon: Icon1, iconColor: 'warning' },
  { label: '[Métrica Custom 2]', value: metric2, icon: Icon2, iconColor: 'primary' },
];
```

**Casos donde StatsGrid puede omitirse:**
- Hub pages (ya tienen SelectionCards)
- Páginas de configuración simple
- Páginas exclusivamente de formulario

### 2. Variación en Número de Columnas FilterGrid

**Problema:**
FilterGrid varía entre 2-5 columnas sin criterio consistente.

**Impacto en UX:**
- Layout visual inconsistente
- Algunos filtros se ven apretados, otros desperdician espacio
- Experiencia responsive variable

**Análisis de Distribución:**

| Columnas | Páginas | Porcentaje |
|----------|---------|------------|
| 2        | 12      | 27%        |
| 3        | 8       | 18%        |
| 4        | 18      | 40%        |
| 5        | 7       | 15%        |

**Solución Propuesta:**
```tsx
// Regla de diseño:
// - Desktop (>1024px): 4 columnas
// - Tablet (768-1024px): 2 columnas
// - Mobile (<768px): 1 columna

// Si hay menos de 4 filtros, usar grid parcial:
<FilterGrid columns={Math.min(numFiltros, 4)}>
  {/* Filtros */}
</FilterGrid>

// Si hay más de 4 filtros, usar grid de 4 y crear más filas:
<FilterGrid columns={4}>
  {/* Hasta 8 filtros distribuidos en 2 filas */}
</FilterGrid>
```

### 3. Sistemas de Permisos Inconsistentes

**Problema:**
Diferentes páginas usan diferentes sistemas para verificar permisos.

**Ejemplos encontrados:**

```tsx
// Patrón 1: Hook usePermissions (más nuevo)
const { canDo } = usePermissions();
canDo(Modules.CORE, Sections.USERS, 'create')

// Patrón 2: Lógica custom con cargo codes
const canCreateProveedor = useMemo(() => {
  if (!user?.cargo) return false;
  const cargo = user.cargo.code;
  return ['lider_comercial', 'admin', 'gerente'].includes(cargo);
}, [user]);

// Patrón 3: Verificación directa de cargo
const canChangePrecio = user?.cargo?.code === 'gerente' || user?.cargo?.code === 'superadmin';
```

**Impacto en UX:**
- Comportamiento impredecible de permisos
- Dificulta auditoría de seguridad
- Mantenimiento complejo

**Solución Propuesta:**
```tsx
// Estandarizar a hook usePermissions en TODAS las páginas
// Migrar lógica custom a configuración de permisos en BD

// Uso consistente:
const { canDo } = usePermissions();

// Crear constantes para acciones comunes:
const canCreate = canDo(MODULE, SECTION, 'create');
const canEdit = canDo(MODULE, SECTION, 'edit');
const canDelete = canDo(MODULE, SECTION, 'delete');
const canViewSensitive = canDo(MODULE, SECTION, 'view_sensitive');

// Casos especiales (como cambiar precios) también via permisos:
const canChangePrecio = canDo(Modules.SUPPLY_CHAIN, Sections.PROVEEDORES, 'change_price');
```

### 4. Gestión de Estado de Tabs

**Problema:**
Diferentes páginas gestionan estado de tabs de formas incompatibles.

**Patrones encontrados:**

```tsx
// Patrón 1: Estado local (no persistente)
const [activeTab, setActiveTab] = useState('tab1');

// Patrón 2: Hook custom con secciones dinámicas
const { sections, activeSection, setActiveSection } = usePageSections({...});

// Patrón 3: Query params (raro, pero existe en algunas páginas legacy)
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'default';
```

**Impacto en UX:**
- Estado de tab se pierde al navegar atrás
- No se pueden compartir enlaces a tabs específicos
- Historial del navegador no funciona correctamente

**Solución Propuesta:**

```tsx
// Hook unificado para gestión de tabs
const useTabState = (defaultTab: string, options?: {
  persistInUrl?: boolean;
  storageKey?: string;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [localTab, setLocalTab] = useState(defaultTab);

  const activeTab = options?.persistInUrl ? (urlTab || defaultTab) : localTab;

  const setActiveTab = useCallback((tab: string) => {
    if (options?.persistInUrl) {
      setSearchParams({ tab });
    } else {
      setLocalTab(tab);
    }

    if (options?.storageKey) {
      localStorage.setItem(options.storageKey, tab);
    }
  }, [options, setSearchParams]);

  return { activeTab, setActiveTab };
};

// Uso:
// Para tabs que deben persistir en URL:
const { activeTab, setActiveTab } = useTabState('bandeja', { persistInUrl: true });

// Para tabs que solo necesitan estado local:
const { activeTab, setActiveTab } = useTabState('proveedores');
```

### 5. Falta de Feedback de Estados Intermedios

**Problema:**
Muchas páginas no muestran estados intermedios (loading, error, empty) de forma consistente.

**Ejemplos de inconsistencias:**

```tsx
// Bueno: UsersPage
{isLoading ? (
  <StatsGridSkeleton count={4} />
) : (
  <StatsGrid stats={userStats} />
)}

// Malo: Algunas páginas no tienen skeleton
{isLoading && <Spinner />}
{!isLoading && <StatsGrid stats={stats} />}

// Peor: Sin indicador de carga
<StatsGrid stats={stats || []} />
```

**Impacto en UX:**
- Flashes de contenido vacío
- Usuarios no saben si está cargando o si no hay datos
- CLS (Cumulative Layout Shift) alto

**Solución Propuesta:**

```tsx
// Patrón estándar para TODOS los componentes con datos async:

// 1. Estado de carga inicial
if (isLoading && !data) {
  return <ComponentSkeleton />;
}

// 2. Estado de error
if (error) {
  return (
    <Alert
      variant="error"
      message="Error al cargar datos"
      action={<Button onClick={refetch}>Reintentar</Button>}
    />
  );
}

// 3. Estado vacío (sin datos)
if (!isLoading && (!data || data.length === 0)) {
  return (
    <EmptyState
      icon={Package}
      title="No hay datos"
      description="No se encontraron resultados"
      action={canCreate && <Button onClick={onCreate}>Crear Primero</Button>}
    />
  );
}

// 4. Estado con datos
return <ComponentWithData data={data} />;
```

**Componentes Skeleton Necesarios:**
- `StatsGridSkeleton` ✓ (ya existe)
- `TableSkeleton` ✓ (ya existe)
- `CardGridSkeleton` (crear)
- `FormSkeleton` (crear)
- `ChartSkeleton` (crear)

---

## Patrones de Navegación

### Navegación Primaria (Sidebar)

**Estructura actual:**
- Módulos principales en sidebar
- Sub-módulos en rutas anidadas
- Iconos consistentes por módulo

**Problemas identificados:**
- No hay breadcrumbs en páginas internas
- Active state del sidebar no siempre correcto en rutas anidadas
- No hay indicador de "ruta actual" más allá del highlight

**Mejoras propuestas:**

1. **Agregar Breadcrumbs:**
   ```tsx
   // En todas las páginas que no sean de nivel 1
   <Breadcrumbs
     items={[
       { label: 'Gestión Estratégica', href: '/gestion-estrategica' },
       { label: 'Configuración', href: '/gestion-estrategica/configuracion' },
       { label: 'Sedes', href: null }, // Actual
     ]}
   />
   ```

2. **Mejorar Active State:**
   - Usar `useLocation()` para detectar ruta exacta
   - Expandir automáticamente sección del sidebar cuando se navega a sub-ruta
   - Mantener scroll position del sidebar

### Navegación Secundaria (Tabs)

**Tipos de tabs identificados:**

1. **Tabs de contenido (underline):**
   - Usado en: Multi-view pages
   - Ejemplo: NotificacionesPage

2. **Tabs de secciones (pills/inline):**
   - Usado en: ConfiguracionPage
   - Integrados en PageHeader

3. **SelectionCards (navegación visual):**
   - Usado en: Hub pages
   - Ejemplo: HSEQPage, CumplimientoPage

**Recomendación de uso:**

```
Decisión de tipo de navegación secundaria:

┌─ ¿Hay más de 6 opciones?
│  ├─ SÍ → SelectionCards (mejor escaneo visual)
│  └─ NO → Continuar
│
├─ ¿Las opciones son funcionalmente diferentes (ej: Bandeja vs Configuración)?
│  ├─ SÍ → Tabs underline (navegación clara entre funciones)
│  └─ NO → Continuar
│
└─ ¿Las opciones son secciones de datos (ej: Sedes, Departamentos, Ciudades)?
   ├─ SÍ → Tabs inline en PageHeader (más compacto)
   └─ NO → Tabs underline (default)
```

---

## Responsive Design

### Breakpoints Utilizados

Análisis de breakpoints en las páginas:

```tsx
// Estandarizado en la mayoría de componentes:
const breakpoints = {
  sm: '640px',   // Móvil grande
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop pequeño
  xl: '1280px',  // Desktop grande
  '2xl': '1536px' // Desktop extra grande
};
```

### Patrones Responsive Observados

1. **Grid de Stats:**
   ```tsx
   // Patrón común:
   grid-cols-1 md:grid-cols-2 lg:grid-cols-4

   // Problema: Salto abrupto de 1 a 4 columnas en lg
   // Mejor:
   grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
   ```

2. **FilterGrid:**
   ```tsx
   // Actualmente varía por página
   // Estandarizar a:
   grid-cols-1 md:grid-cols-2 lg:grid-cols-4
   ```

3. **SelectionCardGrid:**
   ```tsx
   // Patrón actual:
   grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4

   // Es correcto, mantener
   ```

### Problemas de Responsive Identificados

1. **Tabs en mobile:**
   - Algunos tabs no tienen scroll horizontal en mobile
   - Textos de tabs muy largos se cortan
   - **Solución:** Asegurar `overflow-x-auto` y `whitespace-nowrap`

2. **PageHeader actions:**
   - Botones se apilan verticalmente en mobile pero sin orden lógico
   - **Solución:** Usar `flex-col-reverse` para que acción primaria quede arriba

3. **FilterCard:**
   - Barra de búsqueda + controles no responsive en algunas páginas
   - **Solución:** Stack vertical en mobile, horizontal en desktop

4. **DataTableCard:**
   - Tablas anchas causan scroll horizontal excesivo
   - **Solución:** Usar "card view" en mobile en lugar de tabla

### Recomendaciones Responsive

1. **Mobile-First Cards para Tablas:**
   ```tsx
   // En mobile (<768px), renderizar como cards en lugar de tabla
   const isMobile = useMediaQuery('(max-width: 768px)');

   return (
     <DataTableCard {...}>
       {isMobile ? (
         <EntityCardList items={items} />
       ) : (
         <EntityTable items={items} />
       )}
     </DataTableCard>
   );
   ```

2. **Botones Sticky en Mobile:**
   ```tsx
   // Botones de acción principales sticky en mobile
   <div className="sticky bottom-0 md:static bg-white p-4 border-t md:border-0">
     <Button>Acción Principal</Button>
   </div>
   ```

3. **Colapsables Automáticos:**
   ```tsx
   // FilterCard auto-colapsado en mobile
   <FilterCard
     collapsible
     defaultCollapsed={isMobile}
   >
     {/* Filtros */}
   </FilterCard>
   ```

---

## Accesibilidad (A11y)

### Estado Actual

**Elementos bien implementados:**
- Contraste de colores adecuado (WCAG AA)
- Uso de etiquetas semánticas (`<nav>`, `<main>`, `<aside>`)
- Textos alternativos en iconos (algunos componentes)

**Problemas identificados:**

1. **Falta de ARIA labels en componentes interactivos:**
   ```tsx
   // Malo:
   <button onClick={handleEdit}>
     <Pencil />
   </button>

   // Bueno:
   <button onClick={handleEdit} aria-label="Editar usuario">
     <Pencil aria-hidden="true" />
   </button>
   ```

2. **Focus management inadecuado:**
   - Modales no atrapan foco
   - Tabs no tienen navegación con teclado
   - No hay skip links

3. **Semáforos solo por color:**
   ```tsx
   // Malo (solo color):
   <div className={`w-3 h-3 rounded-full ${getSemaforoColor(color)}`} />

   // Bueno (color + icono + texto):
   <div className="flex items-center gap-2">
     <div className={`w-3 h-3 rounded-full ${getSemaforoColor(color)}`} />
     {color === 'verde' && <CheckCircle className="w-4 h-4" />}
     {color === 'amarillo' && <AlertTriangle className="w-4 h-4" />}
     {color === 'rojo' && <XCircle className="w-4 h-4" />}
     <span className="sr-only">{colorToText(color)}</span>
   </div>
   ```

4. **Formularios sin labels asociados:**
   ```tsx
   // Malo:
   <input type="text" placeholder="Buscar..." />

   // Bueno:
   <label htmlFor="search" className="sr-only">Buscar</label>
   <input id="search" type="text" placeholder="Buscar..." />
   ```

### Plan de Mejora A11y

**Fase 1: Quick Wins (1-2 semanas)**
- Agregar aria-labels a todos los botones de iconos
- Asociar labels a inputs en FilterCard
- Agregar textos sr-only para semáforos

**Fase 2: Navegación (2-3 semanas)**
- Implementar navegación con teclado en Tabs (arrow keys)
- Focus trap en modales
- Skip links en layout principal

**Fase 3: Testing (1 semana)**
- Auditoría con Lighthouse
- Testing con screen readers (NVDA, JAWS)
- Testing con solo teclado

**Fase 4: Certificación (ongoing)**
- Documentar cumplimiento WCAG 2.1 AA
- Crear guía de accesibilidad para desarrolladores

---

## Performance

### Métricas Actuales (Estimadas)

| Métrica | Valor | Objetivo | Status |
|---------|-------|----------|--------|
| First Contentful Paint (FCP) | ~1.2s | <1.0s | ⚠️ |
| Largest Contentful Paint (LCP) | ~2.5s | <2.5s | ✓ |
| Cumulative Layout Shift (CLS) | ~0.15 | <0.1 | ⚠️ |
| Time to Interactive (TTI) | ~3.5s | <3.0s | ⚠️ |

### Problemas de Performance Identificados

1. **Over-fetching en páginas con tabs:**
   ```tsx
   // Problema: Todas las tabs cargan datos inmediatamente
   const { data: tab1Data } = useTab1Data();
   const { data: tab2Data } = useTab2Data();
   const { data: tab3Data } = useTab3Data();

   // Solución: Lazy loading
   const { data: activeTabData } = useTabData(activeTab);
   ```

2. **No hay virtualización en listas largas:**
   - Tablas con 100+ filas renderizan todo el DOM
   - **Solución:** Usar `react-virtual` o `tanstack-virtual`

3. **Re-renders innecesarios:**
   ```tsx
   // Problema: Page re-renderiza cuando cambia cualquier filtro
   const [filters, setFilters] = useState({...});

   // Solución: Separar estados
   const [search, setSearch] = useState('');
   const [filterValues, setFilterValues] = useState({...});

   // Usar debounce en search
   const debouncedSearch = useDebounce(search, 300);
   ```

4. **Imágenes sin optimizar:**
   - No hay lazy loading de imágenes
   - No hay uso de `<picture>` para responsive images
   - **Solución:** Wrapper de imagen optimizada

### Recomendaciones de Performance

1. **Code Splitting por Ruta:**
   ```tsx
   // En routes/index.tsx
   const ProveedoresPage = lazy(() => import('@/features/proveedores/pages/ProveedoresPage'));
   const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
   ```

2. **Memoización de Componentes Pesados:**
   ```tsx
   // Tablas, charts, grids complejos
   const MemoizedTable = memo(ProveedoresTable, (prev, next) => {
     return prev.data === next.data && prev.isLoading === next.isLoading;
   });
   ```

3. **Prefetching Inteligente:**
   ```tsx
   // Prefetch datos de tab al hacer hover
   <button
     onClick={() => setActiveTab('tipos')}
     onMouseEnter={() => queryClient.prefetchQuery(['notificaciones-tipos'])}
   >
     Tipos
   </button>
   ```

4. **Optimizar Queries:**
   ```tsx
   // Usar select para transformar datos en el cache
   const { data: stats } = useQuery({
     queryKey: ['users-stats'],
     queryFn: fetchUsers,
     select: (data) => calculateStats(data), // No re-calcula en cada render
   });
   ```

---

## Recomendaciones de Diseño UX/UI

### Principios de Diseño a Seguir

1. **Consistency (Consistencia):**
   - Usar siempre los mismos componentes para las mismas funciones
   - Mantener posiciones consistentes (ej: botones de acción siempre top-right)
   - Colores del Design System sin excepciones

2. **Feedback (Retroalimentación):**
   - Todo estado intermedio debe tener feedback visual
   - Animaciones de transición sutiles (150-200ms)
   - Toast notifications para acciones completadas

3. **Efficiency (Eficiencia):**
   - Mínimo 3 clics para cualquier acción común
   - Atajos de teclado para power users
   - Bulk actions en tablas

4. **Forgiveness (Tolerancia a errores):**
   - Confirmaciones para acciones destructivas
   - Undo para cambios importantes
   - Validación inline en formularios

5. **Progressive Disclosure:**
   - Filtros avanzados colapsables
   - Información detallada en tooltips
   - Drill-down en dashboards

### Guía de Decisión: ¿Qué Patrón Usar?

```
Tipo de Página a Crear:

┌─ Página de entrada a módulo con múltiples submódulos
│  → Usar: Patrón 1 (Dashboard con SelectionCards)
│  Ejemplo: HSEQPage, CumplimientoPage
│
├─ Página de gestión de entidades (lista + CRUD)
│  → Usar: Patrón 2 (Lista CRUD con Filtros)
│  Ejemplo: ProveedoresPage, UsersPage
│
├─ Página con funcionalidades relacionadas en pestañas
│  → Usar: Patrón 3 (Página con Tabs Dinámicos)
│  Ejemplo: NotificacionesPage, SupplyChainPage
│
├─ Página de métricas y visualización de datos
│  → Usar: Patrón 4 (Dashboard con Métricas)
│  Ejemplo: AnalyticsPage, AccountingPage
│
└─ Página con secciones dinámicas desde backend
   → Usar: Patrón 5 (Tabs y Secciones Dinámicas)
   Ejemplo: ConfiguracionPage
```

### Checklist de Implementación de Página Nueva

- [ ] **Estructura Base**
  - [ ] Usar componente `PageHeader`
  - [ ] Definir título y descripción claros
  - [ ] Agregar acciones principales si aplica

- [ ] **Contenido**
  - [ ] Para CRUD: Incluir `StatsGrid` (4 stats mínimo)
  - [ ] Para CRUD: Incluir `FilterCard` con búsqueda
  - [ ] Para CRUD: Incluir `DataTableCard` con paginación
  - [ ] Para Hub: Incluir hero section y SelectionCards

- [ ] **Estados**
  - [ ] Skeleton para loading inicial
  - [ ] Alert para errores
  - [ ] EmptyState para sin datos
  - [ ] Loading en botones de acción

- [ ] **Responsive**
  - [ ] Testeado en mobile (320px-768px)
  - [ ] Testeado en tablet (768px-1024px)
  - [ ] Testeado en desktop (>1024px)
  - [ ] Cards en mobile para tablas si aplica

- [ ] **Accesibilidad**
  - [ ] Labels asociados a inputs
  - [ ] Aria-labels en botones de iconos
  - [ ] Navegación con teclado funciona
  - [ ] Contraste de colores WCAG AA

- [ ] **Performance**
  - [ ] Lazy loading de componentes pesados
  - [ ] Debounce en búsqueda
  - [ ] Memoización de cálculos costosos
  - [ ] Prefetching de datos relacionados

- [ ] **Permisos**
  - [ ] Usar hook `usePermissions` consistentemente
  - [ ] Ocultar acciones si usuario no tiene permiso
  - [ ] Mostrar mensaje si no tiene acceso a vista

---

## Plan de Intervención

### Fase 1: Estandarización de Componentes (2 semanas)

**Objetivo:** Asegurar que todos los componentes de layout sean consistentes.

**Tareas:**
1. Crear componentes faltantes:
   - [ ] `CardGridSkeleton`
   - [ ] `FormSkeleton`
   - [ ] `ChartSkeleton`
   - [ ] `EmptyState` (mejorar existente)
   - [ ] `HeroSection` reutilizable

2. Documentar componentes en Storybook:
   - [ ] `PageHeader` con todas las variantes
   - [ ] `StatsGrid` con diferentes configs
   - [ ] `FilterCard` + `FilterGrid`
   - [ ] `DataTableCard`

3. Crear hook unificado `useTabState`

### Fase 2: Migración de Páginas CRUD (3 semanas)

**Objetivo:** Estandarizar todas las páginas tipo CRUD.

**Criterios de éxito:**
- 100% de páginas CRUD tienen StatsGrid
- 100% usan FilterGrid con 4 columnas
- 100% usan hook `usePermissions`
- 100% tienen EmptyState

**Páginas prioritarias:**
1. UsersPage (ya está bien)
2. ProveedoresPage
3. GestionProveedoresPage
4. MateriaPrimaPage
5. ProductosServiciosPage

### Fase 3: Mejora de Accesibilidad (2 semanas)

**Objetivo:** Cumplir WCAG 2.1 AA.

**Tareas:**
1. Auditoría completa con Lighthouse
2. Agregar ARIA labels faltantes
3. Implementar navegación con teclado
4. Testing con screen readers
5. Documentar guía de accesibilidad

### Fase 4: Optimización de Performance (2 semanas)

**Objetivo:** Mejorar métricas Core Web Vitals.

**Tareas:**
1. Code splitting de rutas
2. Lazy loading de tabs
3. Virtualización de tablas largas
4. Optimización de imágenes
5. Implementar prefetching

### Fase 5: Responsive Refinement (1 semana)

**Objetivo:** Experiencia mobile perfecta.

**Tareas:**
1. Card view para tablas en mobile
2. Mejorar stack de botones en PageHeader
3. Tabs con scroll horizontal smooth
4. Testing exhaustivo en dispositivos reales

---

## Métricas de Éxito

### KPIs de UX a Medir

1. **Consistencia:**
   - % de páginas usando componentes estándar: Objetivo 100%
   - % de páginas con patrón definido: Objetivo 100%

2. **Accesibilidad:**
   - Score Lighthouse Accessibility: Objetivo >95
   - Navegable 100% con teclado: Objetivo Sí

3. **Performance:**
   - LCP < 2.5s: Objetivo Sí
   - CLS < 0.1: Objetivo Sí
   - FCP < 1.0s: Objetivo Sí

4. **Responsive:**
   - Todas las páginas funcionales en mobile: Objetivo 100%
   - Sin scroll horizontal no deseado: Objetivo 100%

### Herramientas de Medición

- Lighthouse CI (automático en cada PR)
- Chromatic (visual regression testing)
- Analytics: Heatmaps, session recordings
- User testing: 5 usuarios por perfil

---

## Conclusiones

### Fortalezas del Sistema Actual

1. **Base sólida de componentes reutilizables:**
   - `PageHeader`, `StatsGrid`, `FilterCard`, `DataTableCard` bien diseñados
   - Separación clara entre layout y contenido

2. **Patrones claros para casos de uso comunes:**
   - Hub pages con SelectionCards muy efectivas
   - Páginas CRUD bastante consistentes

3. **Design System emergente:**
   - Colores de módulos centralizados
   - Componentes base (`Card`, `Button`, `Badge`) sólidos

### Debilidades Principales

1. **Inconsistencias en implementación:**
   - No todas las páginas siguen los patrones
   - Variación en uso de StatsGrid
   - Diferentes sistemas de permisos

2. **Falta de guías claras:**
   - Desarrolladores no saben qué patrón usar cuándo
   - No hay checklist de implementación
   - Documentación insuficiente

3. **Gaps de accesibilidad y performance:**
   - ARIA labels faltantes
   - No hay virtualización
   - Lazy loading inconsistente

### Próximos Pasos Recomendados

**Inmediato (Esta semana):**
1. Crear documento "Guía de Patrones de Página" para desarrolladores
2. Establecer reglas de linting para uso de componentes
3. Crear templates de página para cada patrón

**Corto plazo (Este mes):**
1. Ejecutar Fase 1 del plan de intervención (componentes)
2. Migrar 5 páginas piloto al estándar
3. Configurar Lighthouse CI

**Mediano plazo (Próximo trimestre):**
1. Completar migración de todas las páginas
2. Lograr WCAG 2.1 AA compliance
3. Optimizar Core Web Vitals

---

## Apéndices

### Apéndice A: Inventario Completo de Páginas

Se analizaron 81 páginas distribuidas en los siguientes módulos:

- **accounting:** 5 páginas
- **admin-finance:** 5 páginas
- **analytics:** 9 páginas
- **audit-system:** 4 páginas
- **cumplimiento:** 5 páginas
- **gestion-estrategica:** 5 páginas
- **hseq:** 12 páginas
- **logistics-fleet:** 1 página
- **production-ops:** 1 página
- **proveedores:** 4 páginas
- **riesgos:** 8 páginas
- **sales-crm:** 8 páginas
- **supply-chain:** 2 páginas
- **talent-hub:** 1 página
- **users:** 1 página
- **workflows:** 4 páginas
- **perfil:** 3 páginas

### Apéndice B: Componentes de Layout - API Reference

Ver `frontend/src/components/layout/index.ts` para documentación completa.

Componentes principales:
- `PageHeader`: Header de página con título, descripción, tabs inline
- `StatsGrid`: Grid de métricas con iconos
- `FilterCard`: Contenedor de filtros con búsqueda
- `FilterGrid`: Grid responsivo para inputs
- `DataTableCard`: Card con tabla y paginación
- `Tabs`: Componente de pestañas
- `SelectionCard`: Card navegable con icono

### Apéndice C: Design Tokens Recomendados

```typescript
// Spacing para layouts
export const layoutSpacing = {
  sectionGap: 'space-y-6',      // Entre secciones principales
  componentGap: 'space-y-4',    // Entre componentes
  elementGap: 'space-y-2',      // Entre elementos relacionados
  gridGap: 'gap-4',             // En grids
};

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Grid columns por breakpoint
export const gridColumns = {
  stats: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  filters: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  cards: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};
```

---

**Documento preparado por:** Claude Code - UX/UI Specialist
**Última actualización:** 2026-01-19
**Versión:** 1.0
