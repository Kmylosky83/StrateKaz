/**
 * Index de hooks del modulo Direccion Estrategica
 *
 * Organizacion:
 * 1. Core hooks (Strategic, TenantConfig, Modules, Empresa)
 * 2. Areas y Organizacion
 * 3. Roles y Permisos (RBAC)
 * 4. Gestion de Proyectos (PMI)
 * 5. Revision por Direccion (ISO 9.3)
 * 6. Identidad Corporativa (Politicas, Workflow, Valores)
 */

// ============================================================================
// CORE HOOKS
// ============================================================================
export * from './useStrategic';
export * from './useTenantConfig';
export * from './useModules';
export * from './useEmpresa';

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
// ROLES Y PERMISOS (RBAC)
// ============================================================================
export * from './useRolesPermisos';
export * from './useCargoSectionAccess';
export * from './useMatrizPermisos';

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
