/**
 * Analytics Charts - Enterprise Edition
 * Componentes de visualización avanzada para el módulo de Inteligencia de Negocios
 *
 * Sistema de Gestión StrateKaz
 *
 * COMPONENTES DISPONIBLES:
 *
 * 1. BSCRadarChart - Radar de Balanced Scorecard
 *    - Visualiza las 4 perspectivas BSC en un gráfico radar
 *    - Compara valores actuales vs metas vs período anterior
 *    - Soporta proyecciones
 *
 * 2. KPITrendPrediction - Tendencias con Análisis Predictivo
 *    - Regresión lineal/polinomial para proyectar valores futuros
 *    - Muestra R² de ajuste
 *    - Calcula períodos para alcanzar la meta
 *
 * 3. KPIHeatmapCalendar - Mapa de Calor Temporal
 *    - Visualización tipo GitHub de actividad anual
 *    - Múltiples esquemas de color
 *    - Estadísticas agregadas
 *
 * 4. KPICorrelationMatrix - Matriz de Correlaciones
 *    - Calcula correlaciones entre KPIs usando Pearson
 *    - Identifica relaciones fuertes positivas/negativas
 *    - Top correlaciones destacadas
 *
 * 5. KPISankeyFlow - Flujo Causa-Efecto
 *    - Diagrama Sankey de relaciones BSC
 *    - Perspectiva → Objetivo → KPI → Resultado
 *    - Helper para generar datos desde estructura BSC
 *
 * 6. KPIGaugeAdvanced - Velocímetro Enterprise
 *    - Múltiples variantes de diseño
 *    - Anillo de predicción
 *    - Indicadores de tendencia y progreso
 *
 * TECNOLOGÍAS:
 * - Apache ECharts (echarts-for-react)
 * - simple-statistics (análisis estadístico)
 * - date-fns (manejo de fechas)
 */

// ==================== EXPORTS ====================

export { BSCRadarChart } from './BSCRadarChart';
export type { BSCRadarChartProps, BSCPerspectiveData } from './BSCRadarChart';

export { KPITrendPrediction } from './KPITrendPrediction';
export type {
  KPITrendPredictionProps,
  KPITrendData,
  KPIMeasurement,
  RegressionType,
} from './KPITrendPrediction';

export { KPIHeatmapCalendar } from './KPIHeatmapCalendar';
export type { KPIHeatmapCalendarProps, DailyKPIValue } from './KPIHeatmapCalendar';

export { KPICorrelationMatrix } from './KPICorrelationMatrix';
export type {
  KPICorrelationMatrixProps,
  KPIDataSeries,
  CorrelationResult,
} from './KPICorrelationMatrix';

export { KPISankeyFlow } from './KPISankeyFlow';
export type { KPISankeyFlowProps } from './KPISankeyFlow';
export { generateSankeyFromBSC } from './KPISankeyFlow.utils';
export type { SankeyNode, SankeyLink, BSCStructure } from './KPISankeyFlow.utils';

// KPIGaugeAdvanced migrado a componentes compartidos — re-export para compatibilidad
export { KPIGaugeAdvanced } from '@/components/data-display';
export type { KPIGaugeAdvancedProps, KPIGaugeData, GaugeVariant } from '@/components/data-display';
