/**
 * Analytics Components - Enterprise Edition
 * Índice principal de componentes del módulo de Inteligencia de Negocios
 *
 * Sistema de Gestión StrateKaz
 */

// ==================== CHARTS ====================
export * from './charts';

export {
  BSCRadarChart,
  KPITrendPrediction,
  KPIHeatmapCalendar,
  KPICorrelationMatrix,
  KPISankeyFlow,
  KPIGaugeAdvanced,
  generateSankeyFromBSC,
} from './charts';

// ==================== MODALS (Sprint 8) ====================
export { ValorKPIFormModal } from './ValorKPIFormModal';
export { HistorialValoresModal } from './HistorialValoresModal';
export { CatalogoKPIFormModal } from './CatalogoKPIFormModal';
export { FichaTecnicaFormModal } from './FichaTecnicaFormModal';
export { MetaKPIFormModal } from './MetaKPIFormModal';
export { SemaforoFormModal } from './SemaforoFormModal';
export { PlanAccionFormModal } from './PlanAccionFormModal';
export { ActividadPlanFormModal } from './ActividadPlanFormModal';
export { SeguimientoFormModal } from './SeguimientoFormModal';
export { PlantillaInformeFormModal } from './PlantillaInformeFormModal';
export { ProgramacionInformeFormModal } from './ProgramacionInformeFormModal';
export { ConfigExportacionFormModal } from './ConfigExportacionFormModal';

// ==================== WIDGETS (Sprint 10) ====================
export * from './widgets';

// ==================== DASHBOARD BUILDER MODALS (Sprint 10) ====================
export { VistaDashboardFormModal } from './VistaDashboardFormModal';
export { WidgetSelectorModal } from './WidgetSelectorModal';
