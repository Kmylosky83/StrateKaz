/**
 * Tipos TypeScript para el módulo de KPIs y Analytics Enterprise
 * Sistema de Gestión StrateKaz - Sprint 4 - Analytics Pro Edition
 */

// ==================== ENUMS Y TIPOS BASE ====================

export type FrequencyKPI =
  | 'DIARIO'
  | 'SEMANAL'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL';

export type TrendType = 'MAYOR_MEJOR' | 'MENOR_MEJOR' | 'EN_RANGO';

export type SemaforoStatus = 'VERDE' | 'AMARILLO' | 'ROJO' | 'SIN_DATOS';

// ==================== CHART ENGINE CONFIGURATION ====================

/**
 * Tipos de gráficos soportados por el sistema
 */
export type ChartType =
  | 'line'
  | 'bar'
  | 'area'
  | 'pie'
  | 'donut'
  | 'gauge'
  | 'heatmap'
  | 'calendar_heatmap'
  | 'scatter3d'
  | 'surface3d'
  | 'bar3d'
  | 'treemap'
  | 'sankey'
  | 'funnel'
  | 'radar'
  | 'scatter'
  | 'bubble';

/**
 * Engines de visualización disponibles
 */
export type ChartEngine = 'recharts' | 'echarts';

/**
 * Configuracion de capacidades por engine
 */
export const CHART_ENGINE_CONFIG: Record<
  ChartEngine,
  {
    label: string;
    capabilities: ChartType[];
    level: 'basic' | 'enterprise';
    description: string;
  }
> = {
  recharts: {
    label: 'Recharts',
    capabilities: ['line', 'bar', 'area', 'pie', 'radar', 'scatter'],
    level: 'basic',
    description: 'Graficos basicos y responsivos',
  },
  echarts: {
    label: 'Apache ECharts',
    capabilities: [
      'line',
      'bar',
      'area',
      'pie',
      'donut',
      'gauge',
      'heatmap',
      'calendar_heatmap',
      'scatter3d',
      'surface3d',
      'bar3d',
      'treemap',
      'sankey',
      'funnel',
      'radar',
      'scatter',
      'bubble',
    ],
    level: 'enterprise',
    description: 'Visualizaciones enterprise de alto rendimiento (incluye 3D via echarts-gl)',
  },
};

/**
 * Configuración de casos de uso por tipo de gráfico
 */
export const CHART_TYPE_CONFIG: Record<
  ChartType,
  {
    label: string;
    icon: string; // nombre del icono de lucide-react
    engines: ChartEngine[];
    use_case: string;
    complexity: 'simple' | 'medium' | 'advanced';
  }
> = {
  line: {
    label: 'Líneas',
    icon: 'TrendingUp',
    engines: ['recharts', 'echarts'],
    use_case: 'Tendencias temporales, evolución de KPIs',
    complexity: 'simple',
  },
  bar: {
    label: 'Barras',
    icon: 'BarChart3',
    engines: ['recharts', 'echarts'],
    use_case: 'Comparacion de valores categoricos',
    complexity: 'simple',
  },
  area: {
    label: 'Areas',
    icon: 'AreaChart',
    engines: ['recharts', 'echarts'],
    use_case: 'Volumenes acumulados en el tiempo',
    complexity: 'simple',
  },
  pie: {
    label: 'Pastel',
    icon: 'PieChart',
    engines: ['recharts', 'echarts'],
    use_case: 'Distribucion porcentual',
    complexity: 'simple',
  },
  donut: {
    label: 'Dona',
    icon: 'Donut',
    engines: ['echarts'],
    use_case: 'Distribucion con espacio central',
    complexity: 'simple',
  },
  gauge: {
    label: 'Velocímetro',
    icon: 'Gauge',
    engines: ['echarts'],
    use_case: 'Indicadores de rendimiento individuales',
    complexity: 'medium',
  },
  heatmap: {
    label: 'Mapa de Calor',
    icon: 'Grid3x3',
    engines: ['echarts'],
    use_case: 'Patrones en matrices de datos',
    complexity: 'medium',
  },
  calendar_heatmap: {
    label: 'Calendario de Calor',
    icon: 'Calendar',
    engines: ['echarts'],
    use_case: 'Actividad diaria tipo GitHub',
    complexity: 'medium',
  },
  scatter3d: {
    label: 'Dispersion 3D',
    icon: 'Box',
    engines: ['echarts'],
    use_case: 'Correlaciones multidimensionales',
    complexity: 'advanced',
  },
  surface3d: {
    label: 'Superficie 3D',
    icon: 'Layers',
    engines: ['echarts'],
    use_case: 'Superficies continuas en 3 dimensiones',
    complexity: 'advanced',
  },
  bar3d: {
    label: 'Barras 3D',
    icon: 'Box',
    engines: ['echarts'],
    use_case: 'Comparaciones tridimensionales',
    complexity: 'advanced',
  },
  treemap: {
    label: 'Mapa de Arbol',
    icon: 'GitBranch',
    engines: ['echarts'],
    use_case: 'Jerarquias y proporciones',
    complexity: 'medium',
  },
  sankey: {
    label: 'Sankey',
    icon: 'Workflow',
    engines: ['echarts'],
    use_case: 'Flujos y transferencias',
    complexity: 'advanced',
  },
  funnel: {
    label: 'Embudo',
    icon: 'Filter',
    engines: ['echarts'],
    use_case: 'Procesos de conversión',
    complexity: 'medium',
  },
  radar: {
    label: 'Radar',
    icon: 'Radar',
    engines: ['recharts', 'echarts'],
    use_case: 'Comparación multivariable',
    complexity: 'medium',
  },
  scatter: {
    label: 'Dispersión',
    icon: 'Scatter',
    engines: ['recharts', 'echarts'],
    use_case: 'Correlaciones entre variables',
    complexity: 'simple',
  },
  bubble: {
    label: 'Burbujas',
    icon: 'Circle',
    engines: ['echarts'],
    use_case: 'Tres variables simultaneas',
    complexity: 'medium',
  },
};

// ==================== COLOR SCHEMES ====================

/**
 * Paletas de colores enterprise (sin hardcoding)
 */
export const CHART_COLOR_SCHEMES = {
  // Paleta de semáforo (KPIs)
  semaforo: {
    verde: '#10b981',
    amarillo: '#eab308',
    rojo: '#ef4444',
    gris: '#6b7280',
  },

  // Perspectivas BSC
  bsc: {
    financiera: '#10b981', // verde
    clientes: '#3b82f6', // azul
    procesos: '#f59e0b', // naranja
    aprendizaje: '#8b5cf6', // violeta
  },

  // Gradientes
  gradient_blue: ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1e40af', '#1e3a8a'],
  gradient_green: ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857'],
  gradient_red: ['#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'],
  gradient_purple: ['#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce'],

  // Rainbow para categorías múltiples
  rainbow: [
    '#ef4444',
    '#f59e0b',
    '#eab308',
    '#84cc16',
    '#10b981',
    '#06b6d4',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
  ],

  // Tonos profesionales
  professional: [
    '#1e40af',
    '#7c3aed',
    '#db2777',
    '#dc2626',
    '#ea580c',
    '#ca8a04',
    '#65a30d',
    '#059669',
  ],

  // Tonos pasteles
  pastel: ['#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fb7185', '#fbbf24'],

  // Monocromáticos
  mono_blue: [
    '#eff6ff',
    '#dbeafe',
    '#bfdbfe',
    '#93c5fd',
    '#60a5fa',
    '#3b82f6',
    '#2563eb',
    '#1d4ed8',
  ],
  mono_gray: [
    '#f9fafb',
    '#f3f4f6',
    '#e5e7eb',
    '#d1d5db',
    '#9ca3af',
    '#6b7280',
    '#4b5563',
    '#374151',
  ],
} as const;

/**
 * Mapeo de colores según estado del semáforo
 */
export const SEMAFORO_COLORS: Record<SemaforoStatus, string> = {
  VERDE: CHART_COLOR_SCHEMES.semaforo.verde,
  AMARILLO: CHART_COLOR_SCHEMES.semaforo.amarillo,
  ROJO: CHART_COLOR_SCHEMES.semaforo.rojo,
  SIN_DATOS: CHART_COLOR_SCHEMES.semaforo.gris,
};

/**
 * Mapeo de colores según perspectiva BSC
 */
export const BSC_COLORS: Record<string, string> = {
  FINANCIERA: CHART_COLOR_SCHEMES.bsc.financiera,
  CLIENTES: CHART_COLOR_SCHEMES.bsc.clientes,
  PROCESOS: CHART_COLOR_SCHEMES.bsc.procesos,
  APRENDIZAJE: CHART_COLOR_SCHEMES.bsc.aprendizaje,
};

// ==================== INTERFACES PRINCIPALES ====================

export interface KPIObjetivo {
  id: number;
  objective: number;
  objective_code?: string;
  objective_name?: string;
  bsc_perspective?: string; // Para obtener el color BSC
  name: string;
  description?: string;
  formula: string;
  unit: string;
  frequency: FrequencyKPI;
  frequency_display?: string;
  trend_type: TrendType;
  trend_type_display?: string;
  target_value: string; // DecimalField → string en DRF
  warning_threshold: string; // DecimalField → string en DRF
  critical_threshold: string; // DecimalField → string en DRF
  min_value?: string | null; // DecimalField → string en DRF
  max_value?: string | null; // DecimalField → string en DRF
  data_source?: string;
  responsible?: number;
  responsible_name?: string;
  responsible_cargo?: number;
  responsible_cargo_name?: string;
  last_value?: string | null; // DecimalField → string en DRF
  last_measurement_date?: string | null;
  status_semaforo: SemaforoStatus;
  measurements_count?: number;
  recent_measurements?: MedicionKPI[];
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicionKPI {
  id: number;
  kpi: number;
  period: string;
  value: string; // DecimalField → string en DRF
  notes?: string;
  evidence_file?: string;
  measured_by: number;
  measured_by_name?: string;
  created_at: string;
}

// ==================== DTOs ====================

export interface CreateKPIObjetivoDTO {
  objective: number;
  name: string;
  description?: string;
  formula: string;
  unit: string;
  frequency: FrequencyKPI;
  trend_type: TrendType;
  target_value: number;
  warning_threshold: number;
  critical_threshold: number;
  min_value?: number;
  max_value?: number;
  data_source?: string;
  responsible?: number;
  responsible_cargo?: number;
  is_active?: boolean;
}

export interface UpdateKPIObjetivoDTO {
  name?: string;
  description?: string;
  formula?: string;
  unit?: string;
  frequency?: FrequencyKPI;
  trend_type?: TrendType;
  target_value?: number;
  warning_threshold?: number;
  critical_threshold?: number;
  min_value?: number;
  max_value?: number;
  data_source?: string;
  responsible?: number;
  responsible_cargo?: number;
  is_active?: boolean;
}

export interface CreateMedicionKPIDTO {
  kpi: number;
  period: string;
  value: number;
  notes?: string;
  evidence_file?: File;
}

export interface UpdateMedicionKPIDTO {
  period?: string;
  value?: number;
  notes?: string;
}

// ==================== FILTERS ====================

export interface KPIFilters {
  objective?: number;
  frequency?: FrequencyKPI;
  trend_type?: TrendType;
  status_semaforo?: SemaforoStatus;
  responsible?: number;
  is_active?: boolean;
  search?: string;
}

// ==================== CONFIGURACIONES ====================

export const FREQUENCY_CONFIG: Record<FrequencyKPI, { label: string; order: number }> = {
  DIARIO: { label: 'Diario', order: 1 },
  SEMANAL: { label: 'Semanal', order: 2 },
  QUINCENAL: { label: 'Quincenal', order: 3 },
  MENSUAL: { label: 'Mensual', order: 4 },
  BIMESTRAL: { label: 'Bimestral', order: 5 },
  TRIMESTRAL: { label: 'Trimestral', order: 6 },
  SEMESTRAL: { label: 'Semestral', order: 7 },
  ANUAL: { label: 'Anual', order: 8 },
};

export const TREND_TYPE_CONFIG: Record<
  TrendType,
  { label: string; icon: string; description: string }
> = {
  MAYOR_MEJOR: {
    label: 'Mayor es Mejor',
    icon: 'TrendingUp',
    description: 'Valores más altos son mejores (ej: Ventas, Satisfacción)',
  },
  MENOR_MEJOR: {
    label: 'Menor es Mejor',
    icon: 'TrendingDown',
    description: 'Valores más bajos son mejores (ej: Defectos, Costos)',
  },
  EN_RANGO: {
    label: 'En Rango',
    icon: 'Target',
    description: 'Debe mantenerse dentro de un rango específico',
  },
};

export const SEMAFORO_CONFIG: Record<
  SemaforoStatus,
  { label: string; color: string; bgColor: string; textColor: string; icon: string }
> = {
  VERDE: {
    label: 'En Meta',
    color: 'border-green-500',
    bgColor: 'bg-green-500',
    textColor: 'text-green-700',
    icon: 'CheckCircle',
  },
  AMARILLO: {
    label: 'En Alerta',
    color: 'border-yellow-500',
    bgColor: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    icon: 'AlertTriangle',
  },
  ROJO: {
    label: 'Crítico',
    color: 'border-red-500',
    bgColor: 'bg-red-500',
    textColor: 'text-red-700',
    icon: 'XCircle',
  },
  SIN_DATOS: {
    label: 'Sin Datos',
    color: 'border-gray-500',
    bgColor: 'bg-gray-500',
    textColor: 'text-gray-700',
    icon: 'HelpCircle',
  },
};

// ==================== UNIDADES COMUNES ====================

export const UNIT_OPTIONS = [
  { value: '%', label: 'Porcentaje (%)' },
  { value: '$', label: 'Pesos ($)' },
  { value: 'USD', label: 'Dólares (USD)' },
  { value: 'unidades', label: 'Unidades' },
  { value: 'horas', label: 'Horas' },
  { value: 'días', label: 'Días' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'empleados', label: 'Empleados' },
  { value: 'proyectos', label: 'Proyectos' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'puntos', label: 'Puntos' },
  { value: 'calificación', label: 'Calificación (1-10)' },
];

// ==================== HELPERS ====================

/**
 * Calcula el porcentaje de progreso hacia la meta
 */
export function calculateProgress(
  currentValue: number,
  targetValue: number,
  trendType: TrendType
): number {
  if (trendType === 'MAYOR_MEJOR') {
    return Math.min((currentValue / targetValue) * 100, 100);
  } else if (trendType === 'MENOR_MEJOR') {
    // Invertir: si currentValue es menor, el progreso es mayor
    return Math.min((targetValue / currentValue) * 100, 100);
  } else {
    // EN_RANGO: no aplica progreso lineal
    return 0;
  }
}

/**
 * Obtiene el color del progreso según el semáforo
 */
export function getProgressColor(status: SemaforoStatus): string {
  return SEMAFORO_COLORS[status];
}

/**
 * Obtiene el color según perspectiva BSC
 */
export function getBSCColor(perspective?: string): string {
  if (!perspective) return CHART_COLOR_SCHEMES.semaforo.gris;
  return BSC_COLORS[perspective] || CHART_COLOR_SCHEMES.semaforo.gris;
}

/**
 * Formatea un valor numérico según su unidad
 */
export function formatValue(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return 'N/A';

  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  if (unit === '%') return `${formatted}%`;
  if (unit === '$' || unit === 'USD') return `${unit === 'USD' ? 'US$' : '$'}${formatted}`;
  return `${formatted} ${unit}`;
}

/**
 * Calcula delta percentage entre dos valores
 */
export function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Determina si un delta es positivo según el trend type
 */
export function isDeltaPositive(delta: number, trendType: TrendType): boolean {
  if (trendType === 'MAYOR_MEJOR') return delta > 0;
  if (trendType === 'MENOR_MEJOR') return delta < 0;
  return false;
}
