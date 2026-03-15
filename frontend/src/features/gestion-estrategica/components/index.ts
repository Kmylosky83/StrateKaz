/**
 * Index de componentes del módulo Gestión Estratégica
 */

// =============================================================================
// FUNDACIÓN (C1) — Tabs y Secciones
// =============================================================================

// Tabs de Fundación
export { MiEmpresaTab } from './MiEmpresaTab';
export { OrganizacionTab } from './OrganizacionTab';
export { MiSistemaGestionTab } from './MiSistemaGestionTab';

// Secciones autocontenidas — Mi Empresa
export { EmpresaSection } from './EmpresaSection';
export { MisionVisionSection } from './MisionVisionSection';
export { ValoresSection } from './ValoresSection';
export { SedesSection } from './SedesSection';

// Secciones autocontenidas — Mi Organización
export { AreasTab } from './AreasTab';
export { PILookupField } from './PILookupField';
export { CaracterizacionesSection } from './CaracterizacionesSection';
export { MapaProcesosSection } from './MapaProcesosSection';

// Secciones autocontenidas — Mi Sistema de Gestión
export { NormasISOSection } from './NormasISOSection';
export { AlcanceSIGSection } from './AlcanceSIGSection';
export { PoliticasSection } from './PoliticasSection';
export { ConsecutivosSection } from './ConsecutivosSection';
export { ModulosSection } from './ModulosSection';
export { IntegracionesSection } from './IntegracionesSection';

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
