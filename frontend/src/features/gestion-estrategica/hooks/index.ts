/**
 * Index de hooks del módulo Dirección Estratégica
 */
export * from './useStrategic';
export * from './useTenantConfig';
export * from './useModules';
export * from './useEmpresa';

// Gestión de Proyectos PMI
export * from './useProyectos';
export * from './usePortafolios';

// Revisión por Dirección (ISO 9.3)
export * from './useRevisionDireccion';

// Valores Vividos (conexión valor-acción para BI)
export * from './useValoresVividos';

// Areas hooks - exportados explícitamente para evitar colisiones
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
