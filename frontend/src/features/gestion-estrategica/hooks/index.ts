/**
 * Index de hooks del modulo Direccion Estrategica
 *
 * Organizacion:
 * 1. Core hooks (Strategic, TenantConfig, Modules)
 * 2. Areas y Organizacion
 * 3. Gestion de Proyectos (PMI)
 * 4. Revision por Direccion (ISO 9.3)
 * 5. Identidad Corporativa (Politicas, Workflow, Valores)
 *
 * NOTA: RBAC hooks fueron movidos a configuracion/hooks/useCargos.ts
 * NOTA: Empresa hooks fueron eliminados (legacy) - datos de empresa se manejan via Admin Global
 */

// ============================================================================
// CORE HOOKS
// ============================================================================
export * from './useStrategic';
export * from './useTenantConfig';
export * from './useModules';

// ============================================================================
// AREAS Y ORGANIZACION
// ============================================================================
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
} from './useAreas';
export type { Area, AreaList, CreateAreaDTO, UpdateAreaDTO, AreaFilters } from './useAreas';

// ============================================================================
// GESTION DE PROYECTOS PMI
// ============================================================================
export * from './useProyectos';
export * from './usePortafolios';

// ============================================================================
// REVISION POR DIRECCION (ISO 9.3)
// ============================================================================
export * from './useRevisionDireccion';

// ============================================================================
// IDENTIDAD CORPORATIVA
// ============================================================================
// Politicas (Sistema Unificado v3.0)
export * from './usePoliticas';

// Workflow de Firmas Digitales
export * from './useWorkflowFirmas';

// Valores Vividos (conexion valor-accion para BI)
export * from './useValoresVividos';

// ============================================================================
// GESTION DOCUMENTAL (migrado de HSEQ a N1)
// ============================================================================
export * from './useGestionDocumental';

// ============================================================================
// PLANIFICACION DEL SISTEMA (migrado de HSEQ a N1)
// ============================================================================
export * from './usePlanificacionSistema';

// ============================================================================
// NORMAS ISO
// ============================================================================
export * from './useNormasISO';

// ============================================================================
// ENCUESTAS COLABORATIVAS DOFA
// ============================================================================
export * from './useEncuestas';

// ============================================================================
// CONTEXTO ORGANIZACIONAL (DOFA, PESTEL, Porter, TOWS)
// ============================================================================
export * from './useContexto';

// ============================================================================
// PARTES INTERESADAS (Stakeholders) - ISO 9001:2015 Cláusula 4.2
// ============================================================================
export * from './usePartesInteresadas';

// ============================================================================
// KPIs Y SEGUIMIENTO (Sprint 4)
// ============================================================================
export * from './useKPIs';

// ============================================================================
// GESTIÓN DEL CAMBIO
// ============================================================================
export * from './useGestionCambio';
