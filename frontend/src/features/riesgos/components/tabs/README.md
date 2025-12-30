# Tabs del Módulo Motor de Riesgos

Este directorio contiene los componentes de tabs principales para el módulo de Motor de Riesgos.

## Componentes

### IPEVRTab

Tab principal para IPEVR (Identificación de Peligros, Evaluación y Valoración de Riesgos) según metodología GTC-45.

**Path:** `frontend/src/features/riesgos/components/tabs/IPEVRTab.tsx`

**Características:**

- 4 Subtabs dinámicos:
  1. **Resumen**: Cards estadísticos, riesgos críticos, distribuciones
  2. **Matriz IPEVR**: Tabla completa de valoraciones con filtros
  3. **Peligros**: Catálogo de 78 peligros GTC-45 organizados por categorías
  4. **Controles SST**: Jerarquía de controles (Eliminación → EPP)

**Componentes Integrados:**
- `ResumenIPEVRCards` - Cards de estadísticas
- `MatrizGTC45Table` - Tabla interactiva con ordenamiento y filtros
- `NivelRiesgoIndicator` - Indicador visual de nivel de riesgo

**Hooks Utilizados:**
- `useResumenIPEVR` - Resumen de matrices
- `useMatricesIPEVR` - Listado de matrices con filtros
- `useMatricesCriticos` - Matrices con NR I y II
- `useMatricesPorArea` - Distribución por área
- `useMatricesPorCargo` - Distribución por cargo
- `useMatricesPorPeligro` - Distribución por peligro
- `useClasificacionesPorCategoria` - Clasificaciones agrupadas
- `usePeligrosPorClasificacion` - Peligros de una clasificación
- `useControlesSST` - Controles SST
- `useControlesPorTipo` - Estadísticas de controles por tipo

**Props:**
```typescript
interface IPEVRTabProps {
  activeSection?: string; // Opcional, para usar con DynamicSections
}
```

**Uso Standalone:**
```tsx
import { IPEVRTab } from '@/features/riesgos/components/tabs';

<IPEVRTab />
```

**Uso con DynamicSections:**
```tsx
import { IPEVRTab } from '@/features/riesgos/components/tabs';

<IPEVRTab activeSection="resumen" />
<IPEVRTab activeSection="matriz" />
<IPEVRTab activeSection="peligros" />
<IPEVRTab activeSection="controles" />
```

**Secciones Disponibles:**
- `resumen` - Sección de resumen con estadísticas
- `matriz` - Tabla de matriz IPEVR completa
- `peligros` - Catálogo de peligros GTC-45
- `controles` - Jerarquía de controles SST

### ContextoOrganizacionalTab

Tab para la gestión del contexto organizacional (Partes Interesadas, Alcance, etc.).

**Path:** `frontend/src/features/riesgos/components/tabs/ContextoOrganizacionalTab.tsx`

## Estructura de Archivos

```
tabs/
├── IPEVRTab.tsx              # Tab principal IPEVR
├── ContextoOrganizacionalTab.tsx  # Tab contexto organizacional
├── index.ts                  # Barrel export
└── README.md                 # Esta documentación
```

## Patrones de Diseño

### 1. Tabs con Navegación Interna

Cada tab puede tener subtabs usando el componente `Tabs` de `@/components/common`:

```tsx
const [activeTab, setActiveTab] = useState('resumen');

const tabs = [
  { id: 'resumen', label: 'Resumen', icon: <Icon /> },
  { id: 'matriz', label: 'Matriz', icon: <Icon /> },
];

<Tabs
  tabs={tabs}
  activeTab={activeTab}
  onChange={setActiveTab}
/>

{activeTab === 'resumen' && <ResumenSection />}
{activeTab === 'matriz' && <MatrizSection />}
```

### 2. DynamicSections Compatible

Soporte para activeSection desde el sistema de DynamicSections:

```tsx
export const MyTab = ({ activeSection }: { activeSection?: string }) => {
  const SECTION_COMPONENTS = {
    'section-1': Section1Component,
    'section-2': Section2Component,
  };

  if (activeSection) {
    const ActiveComponent = SECTION_COMPONENTS[activeSection];
    return <ActiveComponent />;
  }

  // Renderizar con tabs internos
  return <InternalTabs />;
};
```

### 3. Composición de Secciones

Las secciones internas se definen como componentes separados:

```tsx
function ResumenSection({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Contenido */}
    </div>
  );
}
```

## Integración con el Backend

### Endpoints Utilizados

**IPEVR:**
- `GET /api/motor-riesgos/ipevr/matrices/` - Listado de matrices
- `GET /api/motor-riesgos/ipevr/matrices/resumen/` - Resumen
- `GET /api/motor-riesgos/ipevr/matrices/criticos/` - Riesgos críticos
- `GET /api/motor-riesgos/ipevr/clasificaciones/por_categoria/` - Clasificaciones
- `GET /api/motor-riesgos/ipevr/peligros/por_clasificacion/` - Peligros
- `GET /api/motor-riesgos/ipevr/controles/` - Controles SST
- `GET /api/motor-riesgos/ipevr/controles/por_tipo/` - Estadísticas controles

### TanStack Query

Todos los endpoints se consumen mediante hooks personalizados que usan TanStack Query:

```tsx
const { data, isLoading } = useResumenIPEVR();
const { data: matrices } = useMatricesIPEVR({ area: 'Producción' });
```

## Estilo y UI

### Design System

- **Tailwind CSS** - Estilos utility-first
- **Dark Mode** - Soporte completo con `dark:` variants
- **Componentes comunes** - Badge, Button, Card, Tabs
- **Iconos** - Lucide React

### Colores GTC-45

Definidos en `types/ipevr.types.ts`:

```typescript
export const CATEGORIA_COLORS: Record<CategoriaGTC45, string> = {
  biologico: '#10B981',   // green
  fisico: '#3B82F6',      // blue
  quimico: '#F59E0B',     // amber
  psicosocial: '#8B5CF6', // violet
  biomecanico: '#EC4899', // pink
  seguridad: '#EF4444',   // red
  fenomenos: '#6B7280',   // gray
};

export const INTERPRETACION_NR_COLORS: Record<InterpretacionNR, string> = {
  I: '#DC2626',   // red-600
  II: '#F97316',  // orange-500
  III: '#FBBF24', // amber-400
  IV: '#22C55E',  // green-500
};
```

## TODO / Mejoras Futuras

- [ ] Implementar modal de detalles de matriz
- [ ] Implementar modal de crear/editar matriz
- [ ] Implementar exportación a Excel
- [ ] Agregar filtros avanzados en Matriz IPEVR
- [ ] Implementar modal de detalles de control SST
- [ ] Agregar gráficos en sección de resumen (Recharts)
- [ ] Implementar paginación en tablas
- [ ] Agregar búsqueda global en catálogo de peligros
- [ ] Implementar arrastrar y soltar en controles SST

## Notas de Desarrollo

### NO Hardcoding

El componente está diseñado para ser 100% dinámico:

- Datos de API mediante hooks
- Categorías desde BD
- Peligros desde BD (78 peligros GTC-45)
- Controles desde BD
- Estados y labels desde types

### Performance

- TanStack Query con caché automático
- Lazy loading de modales
- Componentes memoizados donde sea necesario
- Virtual scrolling para listas grandes (futuro)

### Accesibilidad

- Labels semánticos
- ARIA attributes
- Keyboard navigation
- Focus management

---

**Última actualización:** 2024-12-26
**Autor:** Claude Opus 4.5
