# KPI Analytics - Enterprise Edition

Sistema de visualización y análisis de KPIs más avanzado del ERP StrateKaz.

## 📊 Stack Enterprise

### Librerías de Visualización

- **ECharts** (`echarts-for-react`): Gráficos enterprise de alto rendimiento
  - Velocímetros (Gauges)
  - Treemaps jerárquicos
  - Heatmaps
  - Funnels
  - Sankey diagrams

- **Plotly.js** (`react-plotly.js`): Visualizaciones 3D científicas
  - Scatter 3D
  - Surface 3D
  - Bar 3D
  - Gráficos interactivos con rotación 360°

- **Nivo** (`@nivo/*`): Gráficos hermosos y personalizables
  - Pie/Donut charts
  - Calendar heatmaps (tipo GitHub)
  - Bar charts responsive
  - Line charts

- **Tremor** (`@tremor/react`): Componentes de dashboard enterprise
  - Metric cards con badges delta
  - Category bars
  - KPI grids
  - Progress rings

- **Recharts**: Gráficos básicos y línea base
- **Visx**: Componentes composables
- **Victory**: Gráficos para móviles
- **D3**: Escalas y transformaciones

## 🏗️ Arquitectura

```
kpis/
├── analytics/                    # Componentes Analytics Enterprise
│   ├── KPIGaugeChart.tsx        # ECharts Gauge (velocímetro)
│   ├── KPIMetricCards.tsx       # Tremor Cards con sparklines
│   ├── KPIDashboardPro.tsx      # Dashboard Enterprise completo
│   ├── KPIScatter3D.tsx         # Plotly 3D Scatter
│   ├── KPITreemap.tsx           # ECharts Treemap jerárquico
│   ├── KPIHeatmap.tsx           # [TODO] Nivo Calendar Heatmap
│   ├── KPISurface3D.tsx         # [TODO] Plotly Surface 3D
│   ├── KPICategoryBars.tsx      # [TODO] Tremor Category Bars
│   └── index.ts
├── KPIsTab.tsx                   # Tab clásico (Recharts)
├── KPIsTabPro.tsx               # Tab con Analytics Enterprise ⭐
├── KPIDashboard.tsx             # Dashboard básico
├── KPITable.tsx                 # Tabla con TanStack Table
├── KPIProgressChart.tsx         # Gráfico de línea básico
└── index.ts
```

## 🎨 Sistema de Tipos (Zero Hardcoding)

### Configuración Centralizada

Todos los colores, engines y configuraciones están en `types/kpi.types.ts`:

```typescript
// Paletas de colores
CHART_COLOR_SCHEMES.semaforo  // Verde, amarillo, rojo, gris
CHART_COLOR_SCHEMES.bsc       // Financiera, clientes, procesos, aprendizaje
CHART_COLOR_SCHEMES.rainbow   // Arcoíris para categorías
CHART_COLOR_SCHEMES.gradient_* // Gradientes profesionales

// Engines y capabilities
CHART_ENGINE_CONFIG  // Qué engine soporta qué tipo de gráfico
CHART_TYPE_CONFIG    // Casos de uso por tipo de gráfico

// Helpers
formatValue()        // Formato según unidad (%, $, USD, etc.)
calculateDelta()     // % de cambio entre valores
getProgressColor()   // Color según semáforo
getBSCColor()        // Color según perspectiva BSC
```

## 🚀 Uso

### KPIsTabPro (Recomendado)

```tsx
import { KPIsTabPro } from '@/features/gestion-estrategica/components/kpis';

<KPIsTabPro planId={planId} />
```

### Tabs Disponibles

1. **Dashboard Clásico**: Recharts básico
2. **Dashboard Enterprise**: Tremor + Nivo + ECharts ⭐
3. **Tabla**: TanStack Table con acciones
4. **Velocímetros**: Grid de gauges ECharts
5. **Gráficos**: Líneas de progreso temporal
6. **Vista 3D**: Plotly Scatter 3D interactivo ⭐
7. **Jerarquía**: Treemap BSC → Objetivos → KPIs ⭐

### Componentes Individuales

```tsx
// Gauge
<KPIGaugeChart
  kpi={kpi}
  size="lg"
  showThresholds
  animated
/>

// Metric Cards
<KPIMetricCards
  kpis={kpis}
  layout="grid"
  showDelta
  showSparkline
  onCardClick={(kpi) => console.log(kpi)}
/>

// 3D Scatter
<KPIScatter3D
  kpis={kpis}
  xAxis="target"
  yAxis="value"
  zAxis="objective"
  colorBy="semaforo"
  height={700}
/>

// Treemap
<KPITreemap
  objectives={objectives}
  kpis={kpis}
  colorBy="semaforo"
  height={600}
/>
```

## 🎯 Features Enterprise

### 1. Dashboard Pro (KPIDashboardPro)

- **Hero Stats**: 4 métricas clave con Tremor
- **Pie Chart**: Distribución por semáforo (Nivo)
- **Top Gauge**: Mejor KPI en velocímetro (ECharts)
- **Top/Bottom Lists**: Mejores y peores performers
- **Metric Cards Grid**: Todos los KPIs con sparklines

### 2. Velocímetros (KPIGaugeChart)

- Zonas de color según thresholds
- Animación de aguja
- Marcadores visuales en meta
- Tooltip con fórmula y responsable
- Responsive por size prop

### 3. Vista 3D (KPIScatter3D)

- Ejes configurables (X, Y, Z)
- Color por semáforo o BSC
- Tamaño según importancia
- Rotación 360° interactiva
- Camera controls (zoom, pan, rotate)

### 4. Jerarquía (KPITreemap)

- Drill-down: BSC → Objetivo → KPI
- Tamaño = importancia (target_value)
- Color configurable:
  - `progress`: Gradient según cumplimiento
  - `semaforo`: Estados actuales
  - `bsc_perspective`: Perspectivas BSC
- Breadcrumbs de navegación
- Tooltips informativos

## 📐 Design System Integration

### Componentes Comunes Creados

```tsx
// MetricCard: Cards con delta y sparkline
<MetricCard
  value="95%"
  label="Cumplimiento"
  delta={5.2}
  deltaType="increase"
  trend="up"
  color="success"
  sparkline={[85, 88, 90, 92, 95]}
  icon="TrendingUp"
  onClick={() => {}}
/>

// GaugeProgress: Gauge simple
<GaugeProgress
  value={75}
  max={100}
  size="lg"
  color="success"
  label="Progreso"
  showValue
/>

// ColorLegend: Leyenda de gráficos
<ColorLegend
  items={[
    { label: 'En Meta', color: '#10b981', value: 45 },
    { label: 'En Alerta', color: '#eab308', value: 12 },
  ]}
  orientation="horizontal"
  position="bottom"
/>
```

## 🔧 Performance

- **Lazy Loading**: Todos los analytics se cargan con Suspense
- **Code Splitting**: Componentes separados por engine
- **Memoization**: useMemo para cálculos pesados
- **React.memo**: Charts se memorizan
- **Responsive**: Todos los gráficos adaptativos

## 🌙 Dark Mode

- Todos los componentes soportan dark mode
- Colores adaptativos con Tailwind
- ECharts/Plotly con temas dinámicos

## ♿ Accesibilidad

- ARIA labels en charts
- Tooltips descriptivos
- Navegación por teclado
- Color + texto (no solo color)

## 📱 Responsive

- Mobile-first design
- Grid adaptativo (1/2/3/4 columnas)
- Charts con ResponsiveContainer
- Touch-friendly en móviles

## 🔮 Roadmap (Componentes Pendientes)

### KPIHeatmap (Nivo Calendar)
- Calendario tipo GitHub contributions
- Intensidad por cumplimiento diario
- Identificar patrones temporales

### KPISurface3D (Plotly)
- Superficie continua de evolución
- Eje X: Tiempo, Y: KPIs, Z: Valores
- Identificar correlaciones visuales

### KPICategoryBars (Tremor)
- Barras horizontales comparativas
- Agrupar por objetivo/frecuencia/responsable
- Porcentajes inline

### KPIDashboard3D
- Vista Cube BSC
- Vista Galaxy de objetivos
- Animación orbital

## 📝 Convenciones

1. **CERO HARDCODING**: Todos los valores desde types
2. **TypeScript Estricto**: Sin `any`
3. **Design System First**: Reutilizar componentes
4. **Responsive**: Mobile-first
5. **Dark Mode**: Todos los componentes
6. **Performance**: Lazy + Memo
7. **Accesibilidad**: ARIA + keyboard

## 🔗 Referencias

- [ECharts Examples](https://echarts.apache.org/examples/)
- [Plotly React](https://plotly.com/javascript/react/)
- [Nivo Docs](https://nivo.rocks/)
- [Tremor Components](https://www.tremor.so/docs/getting-started/introduction)
