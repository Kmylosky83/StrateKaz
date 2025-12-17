/**
 * Index de hooks del módulo Dirección Estratégica
 */
export * from './useStrategic';
export * from './useTenantConfig';
export * from './useModules';
export * from './useEmpresa';

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
