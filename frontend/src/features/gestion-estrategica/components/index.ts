/**
 * Index de componentes del módulo Gestión Estratégica
 */

// =============================================================================
// FUNDACIÓN (C1) — Tabs y Secciones
// =============================================================================

// Tabs de Fundación (Cascada V2 — 4 tabs)
export { MiEmpresaTab } from './MiEmpresaTab';
export { ContextoIdentidadTab } from './ContextoIdentidadTab';
export { OrganizacionTab } from './OrganizacionTab';
export { PoliticasReglamentosTab } from './PoliticasReglamentosTab';

// Wizard/Onboarding
export { FundacionChecklist } from './FundacionChecklist';

// Secciones autocontenidas — Tab 1: Mi Empresa
export { EmpresaSection } from './EmpresaSection';
export { SedesSection } from './SedesSection';

// Secciones autocontenidas — Tab 2: Mi Contexto e Identidad
export { MisionVisionSection } from './MisionVisionSection';
export { ValoresSection } from './ValoresSection';
export { NormasISOSection } from './NormasISOSection';
export { AlcanceSIGSection } from './AlcanceSIGSection';

// Secciones autocontenidas — Tab 3: Mi Organización
export { AreasTab } from './AreasTab';
export { PILookupField } from './PILookupField';
export { CaracterizacionesSection } from './CaracterizacionesSection';
export { MapaProcesosSection } from './MapaProcesosSection';

// Secciones autocontenidas — Tab 4: Mis Políticas y Reglamentos
export { PoliticasSection } from './PoliticasSection';
export { ReglamentoInternoSection } from './ReglamentoInternoSection';
export { ReglamentoFormModal } from './ReglamentoFormModal';
export { ContratosTipoSection } from './ContratosTipoSection';
export { ContratoTipoFormModal } from './ContratoTipoFormModal';

// =============================================================================
// PLANEACIÓN ESTRATÉGICA (C2)
// =============================================================================

export { PlaneacionTab } from './PlaneacionTab';
export { ContextoTab } from './ContextoTab';

// Gestión de Proyectos PMI
export { GestionProyectosTab } from './proyectos';

// Revisión por Dirección (ISO 9.3)
export { GeneradorActaModal } from './revision-direccion/GeneradorActaModal';
export {
  RevisionDireccionTab,
  CompromisosDashboard,
  ProgramacionTab,
  ActasTab,
} from './revision-direccion';

// Modales
export * from './modals';

// Integraciones Externas
export { IntegracionFormModal } from './modals/IntegracionFormModal';
export { IntegracionStatusBadge, calculateHealthStatus } from './IntegracionStatusBadge';
export { TestConnectionButton } from './TestConnectionButton';
export { CredencialesEditor } from './CredencialesEditor';

// Normas ISO
export { NormaISOFormModal } from './modals/NormaISOFormModal';

// Contexto Organizacional (DOFA, PESTEL, Porter, TOWS)
export {
  EncuestasDofaSection,
  AnalisisDofaSection,
  AnalisisPestelSection,
  FuerzasPorterSection,
  EstrategiasTowsSection,
} from './contexto';

// Mapa Estratégico BSC (React Flow)
export {
  MapaEstrategicoTab,
  MapaEstrategicoCanvas,
  MapaToolbar,
  ObjetivoNode,
} from './mapa-estrategico';

// KPIs y Seguimiento
export { KPIDashboard, KPITable, KPIProgressChart, KPIsTab } from './kpis';

// Gestión del Cambio
export { GestionCambioTab } from './GestionCambioTab';
export { CambioFormModal } from './modals/CambioFormModal';

// Types
export type {
  IntegracionHealthStatus,
  IntegracionStatusBadgeProps,
} from './IntegracionStatusBadge';
export type { TestConnectionButtonProps } from './TestConnectionButton';
export type { MetodoAutenticacion, CredencialesData } from './CredencialesEditor';
