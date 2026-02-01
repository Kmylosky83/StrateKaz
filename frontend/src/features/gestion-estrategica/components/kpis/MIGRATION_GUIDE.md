# Guía de Migración - KPI Analytics Enterprise

## 🔄 Migración de KPIsTab a KPIsTabPro

### Paso 1: Actualizar Imports

**Antes:**
```tsx
import { KPIsTab } from '@/features/gestion-estrategica/components/kpis';

<KPIsTab planId={planId} />
```

**Después:**
```tsx
import { KPIsTabPro } from '@/features/gestion-estrategica/components/kpis';

<KPIsTabPro planId={planId} />
```

### Paso 2: Sin Cambios en Props

La API es compatible, no requiere cambios en el componente padre.

### Paso 3: Beneficios Inmediatos

Al migrar a `KPIsTabPro` obtienes automáticamente:

- ✅ Dashboard Enterprise con Tremor + Nivo
- ✅ Velocímetros ECharts animados
- ✅ Vista 3D interactiva con Plotly
- ✅ Treemap jerárquico BSC
- ✅ Metric cards con sparklines
- ✅ Lazy loading y mejor performance
- ✅ 7 vistas diferentes vs 3 básicas

## 📦 Componentes Nuevos Disponibles

### 1. KPIGaugeChart

```tsx
import { KPIGaugeChart } from '@/features/gestion-estrategica/components/kpis/analytics';

<KPIGaugeChart
  kpi={kpi}
  size="lg"                // 'sm' | 'md' | 'lg' | 'xl'
  showThresholds={true}    // Mostrar umbrales
  animated={true}          // Animación de aguja
  className="custom-class"
/>
```

**Cuándo usar:**
- Dashboard de KPI individual
- Comparación lado a lado de métricas críticas
- Presentaciones ejecutivas

### 2. KPIMetricCards

```tsx
import { KPIMetricCards } from '@/features/gestion-estrategica/components/kpis/analytics';

<KPIMetricCards
  kpis={kpis}
  layout="grid"              // 'grid' | 'list'
  showSparkline={true}       // Gráfico inline
  showDelta={true}           // % de cambio
  onCardClick={(kpi) => {    // Click handler
    console.log(kpi);
  }}
/>
```

**Cuándo usar:**
- Dashboard principal con múltiples KPIs
- Vista resumida de estado general
- Navegación rápida entre KPIs

### 3. KPIScatter3D

```tsx
import { KPIScatter3D } from '@/features/gestion-estrategica/components/kpis/analytics';

<KPIScatter3D
  kpis={kpis}
  xAxis="target"                    // 'target' | 'progress' | 'measurements_count'
  yAxis="value"                     // 'value' | 'frequency_order'
  zAxis="objective"                 // 'objective' | 'responsible'
  colorBy="semaforo"                // 'semaforo' | 'bsc_perspective'
  height={700}
/>
```

**Cuándo usar:**
- Análisis de correlaciones complejas
- Presentaciones impactantes
- Identificar outliers y patrones

### 4. KPITreemap

```tsx
import { KPITreemap } from '@/features/gestion-estrategica/components/kpis/analytics';

<KPITreemap
  objectives={objectives}
  kpis={kpis}
  colorBy="semaforo"                // 'progress' | 'semaforo' | 'bsc_perspective'
  height={600}
/>
```

**Cuándo usar:**
- Vista jerárquica del BSC completo
- Identificar áreas de mayor impacto
- Priorización visual de objetivos

### 5. KPIDashboardPro

```tsx
import { KPIDashboardPro } from '@/features/gestion-estrategica/components/kpis/analytics';

<KPIDashboardPro
  planId={planId}
  objectiveId={objectiveId}  // Opcional: filtrar por objetivo
/>
```

**Cuándo usar:**
- Dashboard principal de KPIs
- Vista ejecutiva del plan estratégico
- Monitoreo continuo de desempeño

## 🎨 Uso de Colores (Design System)

### Paletas Disponibles

```tsx
import {
  CHART_COLOR_SCHEMES,
  SEMAFORO_COLORS,
  BSC_COLORS,
  formatValue,
  calculateDelta,
  getBSCColor,
  getProgressColor,
} from '@/features/gestion-estrategica/types/kpi.types';

// Colores de semáforo
const verde = SEMAFORO_COLORS.VERDE;      // #10b981
const amarillo = SEMAFORO_COLORS.AMARILLO; // #eab308
const rojo = SEMAFORO_COLORS.ROJO;        // #ef4444

// Colores BSC
const financiera = BSC_COLORS.FINANCIERA;  // #10b981 (verde)
const clientes = BSC_COLORS.CLIENTES;      // #3b82f6 (azul)
const procesos = BSC_COLORS.PROCESOS;      // #f59e0b (naranja)
const aprendizaje = BSC_COLORS.APRENDIZAJE; // #8b5cf6 (violeta)

// Gradientes
const gradientBlue = CHART_COLOR_SCHEMES.gradient_blue;
const rainbow = CHART_COLOR_SCHEMES.rainbow;
```

### Helpers de Formateo

```tsx
// Formatear valores
formatValue(95.5, '%')      // "95,5%"
formatValue(1500000, '$')   // "$1.500.000"
formatValue(75, 'clientes') // "75 clientes"

// Calcular delta
calculateDelta(100, 85)     // 17.65 (%)

// Obtener colores
getProgressColor('VERDE')    // "#10b981"
getBSCColor('FINANCIERA')    // "#10b981"
```

## 🚀 Performance Best Practices

### 1. Lazy Loading

Los componentes analytics ya vienen con lazy loading:

```tsx
// ✅ Correcto - Ya está optimizado
import { KPIsTabPro } from '@/features/gestion-estrategica/components/kpis';

// ❌ Evitar - No lazy load manual necesario
const KPIsTabPro = lazy(() => import('...'));
```

### 2. Memoización

```tsx
import { useMemo } from 'react';

const kpisFiltered = useMemo(() => {
  return kpis.filter(kpi => kpi.status_semaforo === 'ROJO');
}, [kpis]);
```

### 3. Virtualization (Listas Largas)

Si tienes >100 KPIs, considera usar virtualización:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// Implementar para KPIMetricCards con muchos items
```

## 🌙 Dark Mode

Todos los componentes soportan dark mode automáticamente:

```tsx
// No requiere configuración adicional
// Los colores se adaptan con Tailwind
<KPIDashboardPro planId={planId} />
```

## 📱 Responsive

Los componentes se adaptan automáticamente:

- **Mobile**: 1 columna
- **Tablet**: 2 columnas
- **Desktop**: 3-4 columnas
- **Ultra-wide**: 4+ columnas

```tsx
// Grid adaptativo automático
<KPIMetricCards kpis={kpis} layout="grid" />
```

## ⚠️ Breaking Changes

### No hay breaking changes

La migración es **100% compatible hacia atrás**:

- `KPIsTab` sigue funcionando (Recharts básico)
- `KPIsTabPro` es opt-in (Enterprise features)
- Todos los props son iguales
- Hooks no cambiaron
- Types no cambiaron

## 📊 Comparación de Features

| Feature | KPIsTab (Básico) | KPIsTabPro (Enterprise) |
|---------|------------------|-------------------------|
| Dashboard básico | ✅ | ✅ |
| Tabla TanStack | ✅ | ✅ |
| Gráficos de línea | ✅ (Recharts) | ✅ (Recharts) |
| Dashboard Pro | ❌ | ✅ (Tremor + Nivo) |
| Velocímetros | ❌ | ✅ (ECharts) |
| Vista 3D | ❌ | ✅ (Plotly) |
| Treemap | ❌ | ✅ (ECharts) |
| Sparklines | ❌ | ✅ (SVG) |
| Metric Cards | ❌ | ✅ (Tremor) |
| Lazy Loading | Parcial | ✅ Total |
| Performance | Bueno | Excelente |

## 🔮 Roadmap

### Próximamente

1. **KPIHeatmap**: Calendario tipo GitHub
2. **KPISurface3D**: Superficie 3D temporal
3. **KPICategoryBars**: Tremor category bars
4. **KPIDashboard3D**: Vista cube y galaxy

### Cómo Contribuir

1. Clonar el repositorio
2. Crear componente en `analytics/`
3. Seguir convenciones del README.md
4. Actualizar exports en `analytics/index.ts`
5. Documentar en MIGRATION_GUIDE.md
6. Pull request con screenshots

## 💡 Tips

### 1. Elegir el Chart Correcto

- **Tendencias temporales** → Line chart (Recharts/Nivo)
- **Comparaciones** → Bar chart (Recharts/Nivo/Tremor)
- **Distribuciones** → Pie/Donut (Nivo)
- **KPI individual** → Gauge (ECharts)
- **Jerarquías** → Treemap (ECharts)
- **Correlaciones** → Scatter 3D (Plotly)
- **Patrones temporales** → Calendar Heatmap (Nivo)

### 2. Colores Consistentes

Siempre usar las paletas del design system:

```tsx
// ✅ Correcto
import { SEMAFORO_COLORS } from '@/features/gestion-estrategica/types/kpi.types';
const color = SEMAFORO_COLORS.VERDE;

// ❌ Evitar hardcoding
const color = '#10b981';
```

### 3. Responsabilidades

- **KPIsTabPro**: Orquestador principal con tabs
- **KPIDashboardPro**: Dashboard completo standalone
- **Analytics individuales**: Usar según necesidad específica

## 🆘 Soporte

### Problemas Comunes

**1. Error: Cannot find module 'echarts-for-react'**

```bash
npm install echarts echarts-for-react
```

**2. Plotly no renderiza en dark mode**

Los colores se adaptan automáticamente, verificar theme provider.

**3. Performance lenta con muchos KPIs**

Implementar virtualización o paginación para >100 items.

### Contacto

- GitHub Issues: [StrateKaz/issues](https://github.com/...)
- Slack: #stratekaz-frontend
- Email: dev@stratekaz.com
