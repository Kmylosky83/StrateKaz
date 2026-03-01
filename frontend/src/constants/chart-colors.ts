/**
 * Centralized chart color palettes for consistent visualization across the app.
 * Use these instead of hardcoding hex colors in chart components.
 */

// Primary palette for general charts (10 colors)
export const CHART_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#14B8A6', // teal-500
  '#6366F1', // indigo-500
] as const;

// Extended palette for charts needing many colors (20+)
export const CHART_COLORS_EXTENDED = [
  ...CHART_COLORS,
  '#84CC16', // lime-500
  '#A855F7', // purple-500
  '#22D3EE', // cyan-400
  '#FB923C', // orange-400
  '#34D399', // emerald-400
  '#60A5FA', // blue-400
  '#FBBF24', // amber-400
  '#F87171', // red-400
  '#A78BFA', // violet-400
  '#F472B6', // pink-400
] as const;

// Semantic colors for status indicators
export const STATUS_COLORS = {
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  neutral: '#6B7280',
} as const;

// BSC (Balanced Scorecard) perspective colors
export const BSC_COLORS = {
  financiera: '#3B82F6',
  clientes: '#10B981',
  procesos: '#F59E0B',
  aprendizaje: '#8B5CF6',
} as const;

// Heatmap gradient colors — green (low to high)
export const HEATMAP_COLORS = [
  '#F0FDF4',
  '#BBF7D0',
  '#86EFAC',
  '#4ADE80',
  '#22C55E',
  '#16A34A',
  '#15803D',
] as const;

// Heatmap gradient colors — sky/blue (for KPI calendar heatmap)
export const HEATMAP_BLUE_COLORS = [
  '#E0F2FE', // sky-100
  '#7DD3FC', // sky-300
  '#0EA5E9', // sky-500
  '#0369A1', // sky-700
  '#0C4A6E', // sky-900
] as const;

// Risk matrix colors
export const RISK_COLORS = {
  bajo: '#22C55E',
  medio: '#F59E0B',
  alto: '#F97316',
  critico: '#EF4444',
  extremo: '#991B1B',
} as const;

// Correlation matrix gradient (negative → neutral → positive)
export const CORRELATION_COLORS = {
  positive: '#22C55E',
  neutral: '#F59E0B',
  negative: '#EF4444',
} as const;

// Semaforo (traffic light) colors for KPI state
export const SEMAFORO_COLORS = {
  verde: '#22C55E',
  amarillo: '#EAB308',
  rojo: '#EF4444',
} as const;

// Chart axis / grid neutral colors (ECharts compatible)
export const CHART_AXIS_COLORS = {
  axisLine: '#E5E7EB',
  axisLabel: '#6B7280',
  splitLine: '#F3F4F6',
  title: '#1F2937',
  subtitle: '#6B7280',
  tooltip: {
    bg: 'rgba(255, 255, 255, 0.98)',
    border: '#E5E7EB',
    text: '#374151',
  },
} as const;
