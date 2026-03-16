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
export * from './useFundacionProgress';

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

// Caracterización de Procesos (SIPOC)
export * from './useCaracterizaciones';

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
// NOTA v4.0: usePoliticas eliminado. Políticas se gestionan desde Gestión Documental.

// Workflow de Firmas Digitales
export * from './useWorkflowFirmas';

// Valores Vividos (conexion valor-accion para BI)
export * from './useValoresVividos';

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
