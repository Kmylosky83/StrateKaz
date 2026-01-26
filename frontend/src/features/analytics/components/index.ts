/**
 * Analytics Components - Enterprise Edition
 * Índice principal de componentes del módulo de Inteligencia de Negocios
 *
 * Sistema de Gestión StrateKaz
 */

// ==================== CHARTS ====================
export * from './charts';

// Re-export con nombres específicos para facilitar imports
export {
  BSCRadarChart,
  KPITrendPrediction,
  KPIHeatmapCalendar,
  KPICorrelationMatrix,
  KPISankeyFlow,
  KPIGaugeAdvanced,
  generateSankeyFromBSC,
} from './charts';
