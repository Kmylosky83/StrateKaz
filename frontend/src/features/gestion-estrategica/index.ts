/**
 * Index principal del módulo Dirección Estratégica
 * Sistema de Gestión StrateKaz
 *
 * Arquitectura: Cada tab tiene su propia página (sin redundancia de tabs)
 * - ConfiguracionPage: Módulos, Branding, Consecutivos
 * - OrganizacionPage: Estructura, Cargos, Roles, Permisos
 * - IdentidadPage: Misión, Visión, Valores, Política
 * - PlaneacionPage: Plan Estratégico, Objetivos BSC
 * - ProyectosPage: Gestión de Proyectos PMI
 * - RevisionDireccionPage: Revisión por Dirección ISO 9.3
 */

// Páginas individuales por tab (cada tab = ruta separada)
export { ConfiguracionPage } from './pages/ConfiguracionPage';
export { OrganizacionPage } from './pages/OrganizacionPage';
export { IdentidadPage } from './pages/IdentidadPage';
export { PlaneacionPage } from './pages/PlaneacionPage';
export { ProyectosPage } from './pages/ProyectosPage';
export { RevisionDireccionPage } from './pages/RevisionDireccionPage';

// Componentes principales (exportaciones explícitas para evitar colisiones)
export {
  IdentidadTab,
  PlaneacionTab,
  OrganizacionTab,
  ConfiguracionTab,
  GestionProyectosTab,
  RevisionDireccionTab,
  CompromisosDashboard,
  GeneradorActaModal,
  IntegracionesSection,
  IntegracionFormModal,
  IntegracionStatusBadge,
  TestConnectionButton,
  CredencialesEditor,
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
export {
  usePortafolios,
  usePortafolio,
} from './hooks/usePortafolios';

// Hooks - Revisión por Dirección
export {
  useRevisionDireccionStats,
  useProgramasRevision,
  useActasRevision,
} from './hooks/useRevisionDireccion';

// Hooks - Políticas (Sistema Unificado v4.0 - simplificado)
export {
  politicaKeys,
  useTiposPolitica,
  useNormasISO,
  usePoliticas,
  usePolitica,
  usePoliticasVigentes,
  useCreatePolitica,
  useUpdatePolitica,
  useDeletePolitica,
  useEnviarAGestion,
  useCrearNuevaVersion,
  usePuedeEditarPolitica,
} from './hooks/usePoliticas';

// Componentes - Políticas
export { UnifiedPolicyModal, PoliciesList, PolicyDetailModal } from './components/politicas';

// Types - Políticas
export type {
  Politica,
  TipoPolitica,
  NormaISO,
  PoliticaFilters,
  CreatePoliticaDTO,
  UpdatePoliticaDTO,
  PoliticaStatus,
} from './types/policies.types';
