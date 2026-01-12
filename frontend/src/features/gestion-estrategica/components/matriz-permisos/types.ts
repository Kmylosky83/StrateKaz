/**
 * Tipos para MatrizPermisosSection y sus sub-componentes
 */
import type { SystemModuleTree, ModuleTab, TabSection } from '../../types/modules.types';
import type { StatItem } from '@/components/layout';

// Estado de selección para módulos, tabs y secciones
export type SelectionState = 'none' | 'partial' | 'all';

// Stats de la matriz
export interface MatrizPermisosStats {
  totalSections: number;
  selectedCount: number;
  modulesWithoutSections: number;
  totalModules: number;
  totalTabs: number;
}

// Cargo resumido para la tabla
export interface CargoResumen {
  id: number;
  code?: string;
  name: string;
  area_nombre?: string;
  nivel_jerarquico: string;
  users_count?: number;
  permissions_count?: number;
  is_system?: boolean;
}

// Props del header
export interface MatrizPermisosHeaderProps {
  onExport: () => void;
  isLoading: boolean;
  cargoName?: string;
}

// Props del selector de cargo
export interface CargoSelectorProps {
  options: Array<{ value: number; label: string }>;
  selectedCargoId: number | null;
  onCargoChange: (value: string | number) => void;
  selectedCargo: CargoResumen | null;
  isLoadingCargos: boolean;
  isLoadingAccess: boolean;
  stats: MatrizPermisosStats;
}

// Props de la tabla de resumen
export interface CargosResumenTableProps {
  cargos: CargoResumen[];
  onCargoSelect: (cargoId: number) => void;
}

// Props de la fila de módulo
export interface ModuleRowProps {
  module: SystemModuleTree;
  isExpanded: boolean;
  selectionState: SelectionState;
  sectionsCount: number;
  onToggle: () => void;
  onToggleAll: () => void;
  children?: React.ReactNode;
}

// Props de la fila de tab
export interface TabRowProps {
  tab: ModuleTab;
  isExpanded: boolean;
  selectionState: SelectionState;
  onToggle: () => void;
  onToggleAll: () => void;
  children?: React.ReactNode;
}

// Props de la fila de sección
export interface SectionRowProps {
  section: TabSection;
  isSelected: boolean;
  onToggle: () => void;
}

// Props de la alerta de cambios
export interface ChangesAlertProps {
  hasChanges: boolean;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
}

// Re-export tipos necesarios
export type { SystemModuleTree, ModuleTab, TabSection, StatItem };
