/**
 * Index principal del módulo Gestión Estratégica
 * Sistema de Gestión StrateKaz — Arquitectura Cascada V2
 *
 * FUNDACIÓN (C1) — 4 tabs:
 * - MiEmpresaPage: Empresa, Sedes, Unidades de Negocio
 * - ContextoIdentidadPage: Stakeholders, Contexto, Misión, Valores, Normas, Alcance
 * - OrganizacionPage: Áreas, Cargos, Organigrama, Caracterizaciones, Mapa
 * - PoliticasReglamentosPage: Políticas Obligatorias, Reglamento Interno, Contratos Tipo
 *
 * PLANEACIÓN ESTRATÉGICA (C2):
 * - PlaneacionPage: Plan Estratégico, Objetivos BSC
 * - ProyectosPage: Gestión de Proyectos PMI
 *
 * INTELIGENCIA (C3):
 * - RevisionDireccionPage: Revisión por Dirección ISO 9.3
 */

// Páginas — Fundación (C1)
export { MiEmpresaPage } from './pages/MiEmpresaPage';
export { ContextoIdentidadPage } from './pages/ContextoIdentidadPage';
export { OrganizacionPage } from './pages/OrganizacionPage';
export { PoliticasReglamentosPage } from './pages/PoliticasReglamentosPage';

// Páginas — Planeación Estratégica (C2)
export { PlaneacionPage } from './pages/PlaneacionPage';
export { ProyectosPage } from './pages/ProyectosPage';

// Páginas — Inteligencia (C3)
export { RevisionDireccionPage } from './pages/RevisionDireccionPage';

// Wizard / Onboarding
export { FundacionChecklist } from './components';

// Componentes principales
export {
  // Tabs — Fundación
  MiEmpresaTab,
  ContextoIdentidadTab,
  OrganizacionTab,
  PoliticasReglamentosTab,
  PlaneacionTab,
  GestionProyectosTab,
  RevisionDireccionTab,
  CompromisosDashboard,
  GeneradorActaModal,
  // Secciones
  IntegracionesSection,
  IntegracionFormModal,
  IntegracionStatusBadge,
  TestConnectionButton,
  CredencialesEditor,
  NormasISOSection,
  AlcanceSIGSection,
  MisionVisionSection,
  ValoresSection,
  PoliticasSection,
  ModulosSection,
} from './components';

// Hooks - Strategic
export {
  useStrategicStats,
  useIdentities,
  useActiveIdentity,
  useValues,
  usePlans,
  useActivePlan,
  useBSCPerspectives,
  useISOStandards,
} from './hooks/useStrategic';

// Hooks - Tenant & Modules
export { useTenantConfig } from './hooks/useTenantConfig';
export { useModulesTree, useTabSections, useSidebarModules } from './hooks/useModules';

// Hooks - Areas
export {
  areaKeys,
  useAreas,
  useArea,
  useAreasTree,
  useAreasRoot,
  useAreaChildren,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
  useToggleArea,
} from './hooks/useAreas';

// Hooks - Proyectos
export {
  useProyectos,
  useProyecto,
  useProyectosDashboard,
  useCreateProyecto,
  useUpdateProyecto,
  useDeleteProyecto,
  useCambiarEstadoProyecto,
} from './hooks/useProyectos';

// Hooks - Portafolios
export { usePortafolios, usePortafolio } from './hooks/usePortafolios';

// Hooks - Revisión por Dirección
export {
  useRevisionDireccionStats,
  useProgramasRevision,
  useActasRevision,
} from './hooks/useRevisionDireccion';

// Hooks - Fundación Progress
export { useFundacionProgress } from './hooks/useFundacionProgress';
export type { FundacionProgress, FundacionStep } from './hooks/useFundacionProgress';
