/**
 * Barrel export para componentes de MatrizPermisos
 */
export { MatrizPermisosSection } from './MatrizPermisosSection';
export { MatrizPermisosHeader } from './MatrizPermisosHeader';
export { CargoSelector } from './CargoSelector';
export { CargosResumenTable } from './CargosResumenTable';
export { ModuleRow } from './ModuleRow';
export { TabRow } from './TabRow';
export { SectionRow } from './SectionRow';
export { ChangesAlert } from './ChangesAlert';
export { exportMatrizToExcel } from './ExcelExporter';

// Re-export types
export type {
  SelectionState,
  MatrizPermisosStats,
  CargoResumen,
  MatrizPermisosHeaderProps,
  CargoSelectorProps,
  CargosResumenTableProps,
  ModuleRowProps,
  TabRowProps,
  SectionRowProps,
  ChangesAlertProps,
} from './types';
