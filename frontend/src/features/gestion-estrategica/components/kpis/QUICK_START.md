# Quick Start - KPI Analytics Enterprise

## 🚀 En 3 Pasos

### Paso 1: Importar

```tsx
import { KPIsTabPro } from '@/features/gestion-estrategica/components/kpis';
```

### Paso 2: Usar

```tsx
<KPIsTabPro planId={planId} />
```

### Paso 3: Disfrutar

Ya tienes acceso a 7 vistas enterprise de KPIs.

---

## 📊 Ejemplos Rápidos

### 1. Dashboard Completo (Recomendado)

```tsx
import { KPIDashboardPro } from '@/features/gestion-estrategica/components/kpis/analytics';

function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard de KPIs</h1>
      <KPIDashboardPro planId={1} />
    </div>
  );
}
```

**Qué incluye:**
- Hero stats (4 métricas)
- Pie chart de distribución
- Gauge del mejor KPI
- Listas top/bottom 5
- Grid de metric cards

---

### 2. Velocímetro Individual

```tsx
import { KPIGaugeChart } from '@/features/gestion-estrategica/components/kpis/analytics';

function KPIDetailPage({ kpi }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">{kpi.name}</h2>
      <KPIGaugeChart
        kpi={kpi}
        size="xl"
        showThresholds
        animated
      />
    </div>
  );
}
```

**Resultado:**
- Velocímetro grande
- Zonas de color automáticas
- Animación suave
- Tooltips informativos

---

### 3. Grid de Métricas

```tsx
import { KPIMetricCards } from '@/features/gestion-estrategica/components/kpis/analytics';

function MetricsGrid({ kpis }) {
  const handleCardClick = (kpi) => {
    console.log('KPI seleccionado:', kpi.name);
    // Navegar a detalle o mostrar modal
  };

  return (
    <KPIMetricCards
      kpis={kpis}
      layout="grid"
      showDelta
      showSparkline
      onCardClick={handleCardClick}
    />
  );
}
```

**Resultado:**
- Grid responsive (1-4 cols)
- Delta indicators
- Sparklines inline
- Clickeable cards

---

### 4. Vista 3D Interactiva

```tsx
import { KPIScatter3D } from '@/features/gestion-estrategica/components/kpis/analytics';

function AnalysisPage({ kpis }) {
  return (
    <div className="h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Análisis 3D de KPIs</h1>
      <KPIScatter3D
        kpis={kpis}
        xAxis="target"
        yAxis="value"
        zAxis="objective"
        colorBy="semaforo"
        height={700}
      />
    </div>
  );
}
```

**Interacción:**
- Rotación 360° con mouse
- Zoom con scroll
- Pan con shift+drag
- Reset con double-click

---

### 5. Jerarquía BSC

```tsx
import { KPITreemap } from '@/features/gestion-estrategica/components/kpis/analytics';

function HierarchyPage({ objectives, kpis }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Jerarquía BSC</h1>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <button className="btn">Color por Progreso</button>
        <button className="btn">Color por Semáforo</button>
        <button className="btn">Color por BSC</button>
      </div>
      <KPITreemap
        objectives={objectives}
        kpis={kpis}
        colorBy="semaforo"
        height={600}
      />
    </div>
  );
}
```

**Navegación:**
- Click para drill-down
- Breadcrumbs automáticos
- Hover para tooltips
- Proporciones visuales

---

## 🎨 Usando Paletas de Colores

```tsx
import {
  CHART_COLOR_SCHEMES,
  SEMAFORO_COLORS,
  BSC_COLORS,
} from '@/features/gestion-estrategica/types/kpi.types';

// En tu componente
<div style={{ backgroundColor: SEMAFORO_COLORS.VERDE }}>
  En Meta
</div>

<div style={{ color: BSC_COLORS.FINANCIERA }}>
  Perspectiva Financiera
</div>

// Gradient
const colors = CHART_COLOR_SCHEMES.gradient_blue;
// ['#dbeafe', '#93c5fd', '#60a5fa', ...]
```

---

## 🔧 Helpers de Formateo

```tsx
import {
  formatValue,
  calculateDelta,
  getProgressColor,
  getBSCColor,
} from '@/features/gestion-estrategica/types/kpi.types';

// Formatear valores
const formatted = formatValue(95.5, '%');        // "95,5%"
const money = formatValue(1500000, '$');         // "$1.500.000"
const quantity = formatValue(75, 'clientes');    // "75 clientes"

// Delta
const delta = calculateDelta(100, 85);           // 17.65

// Colores
const color = getProgressColor('VERDE');         // "#10b981"
const bscColor = getBSCColor('FINANCIERA');      // "#10b981"
```

---

## 💡 Tips Rápidos

### 1. Lazy Loading Automático

No necesitas hacer nada, ya está configurado:

```tsx
// ✅ Esto ya hace lazy loading automático
<KPIsTabPro planId={planId} />
```

### 2. Responsive Automático

Los grids se adaptan solos:

```tsx
// ✅ Grid responsive automático
<KPIMetricCards kpis={kpis} layout="grid" />
// Mobile: 1 col, Tablet: 2 cols, Desktop: 3-4 cols
```

### 3. Dark Mode Automático

Detecta el tema del sistema:

```tsx
// ✅ Dark mode ya incluido
<KPIDashboardPro planId={planId} />
// Se adapta automáticamente al tema
```

### 4. Elegir Vista Según Caso

| Caso de Uso | Componente Recomendado |
|-------------|------------------------|
| Dashboard general | `KPIDashboardPro` |
| KPI individual | `KPIGaugeChart` |
| Lista de KPIs | `KPIMetricCards` |
| Análisis comparativo | `KPIScatter3D` |
| Vista jerárquica | `KPITreemap` |
| Todo incluido | `KPIsTabPro` ⭐ |

---

## 🐛 Troubleshooting

### "Module not found: echarts"

```bash
npm install echarts echarts-for-react
```

### "Module not found: plotly.js"

```bash
npm install plotly.js react-plotly.js
```

### "Module not found: @nivo/pie"

```bash
npm install @nivo/pie @nivo/core
```

### Charts no se renderizan

1. Verificar que el contenedor tenga altura:
```tsx
<div className="h-96">
  <KPIGaugeChart kpi={kpi} />
</div>
```

2. Verificar que los datos no estén vacíos:
```tsx
{kpis.length > 0 && <KPIMetricCards kpis={kpis} />}
```

### Dark mode no funciona

Verificar que el theme provider esté configurado en App.tsx.

---

## 🎯 Patrones Comunes

### Patrón 1: Dashboard con Filtros

```tsx
function FilteredDashboard() {
  const [selectedObjective, setSelectedObjective] = useState(null);

  return (
    <div>
      <Select
        value={selectedObjective}
        onChange={(e) => setSelectedObjective(e.target.value)}
      >
        <option value="">Todos</option>
        {objectives.map(obj => (
          <option key={obj.id} value={obj.id}>{obj.name}</option>
        ))}
      </Select>

      <KPIDashboardPro
        planId={planId}
        objectiveId={selectedObjective}
      />
    </div>
  );
}
```

### Patrón 2: Tabs de Visualización

```tsx
function KPIViews({ kpis }) {
  const [activeView, setActiveView] = useState('cards');

  return (
    <div>
      <Tabs
        tabs={[
          { id: 'cards', label: 'Cards' },
          { id: 'gauges', label: 'Velocímetros' },
          { id: '3d', label: 'Vista 3D' },
        ]}
        activeTab={activeView}
        onChange={setActiveView}
      />

      {activeView === 'cards' && <KPIMetricCards kpis={kpis} />}
      {activeView === 'gauges' && (
        <div className="grid grid-cols-3 gap-4">
          {kpis.map(kpi => (
            <KPIGaugeChart key={kpi.id} kpi={kpi} />
          ))}
        </div>
      )}
      {activeView === '3d' && <KPIScatter3D kpis={kpis} />}
    </div>
  );
}
```

### Patrón 3: Modal de Detalle

```tsx
function KPIModal({ kpi, onClose }) {
  return (
    <Modal isOpen onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">{kpi.name}</h2>
        <KPIGaugeChart kpi={kpi} size="lg" />
        <div className="mt-4">
          <p>Responsable: {kpi.responsible_name}</p>
          <p>Frecuencia: {kpi.frequency_display}</p>
          <p>Fórmula: {kpi.formula}</p>
        </div>
      </div>
    </Modal>
  );
}
```

---

## 📖 Siguiente Paso

Lee la [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) para ejemplos avanzados y best practices.

Lee el [README.md](./README.md) para documentación completa del sistema.

Lee [ARCHITECTURE.md](./ARCHITECTURE.md) para entender la arquitectura completa.

---

## 🎉 ¡Listo!

Con estos ejemplos ya puedes empezar a usar el sistema de KPI Analytics más avanzado del mercado.

**Happy coding!** 🚀
