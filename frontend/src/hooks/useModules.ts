/**
 * Re-export de hooks y tipos compartidos del sistema de módulos.
 *
 * Estos hooks/tipos son infraestructura core usada por:
 * - Sidebar.tsx (navegación)
 * - ModuleGuard.tsx (protección de rutas)
 * - DashboardPage.tsx (dashboard principal)
 * - usePageSections, usePageHeader, useModuleColor (hooks compartidos)
 * - PageHeader, HeaderTabs, DynamicSections, StatsGrid (componentes)
 *
 * Se re-exportan desde aquí para evitar imports cruzados entre features.
 * SIEMPRE importar desde '@/hooks/useModules', NUNCA desde features/.
 */

// Hooks
export {
  modulesKeys,
  useModulesTree,
  useSidebarModules,
  useModuleEnabled,
  useTabEnabled,
  useSectionEnabled,
  useTabSections,
  useModulesByCategory,
  useModulesStats,
  useModuleDependents,
  useToggleModule,
  useToggleTab,
  useToggleSection,
} from '@/features/gestion-estrategica/hooks/useModules';

// Tipos compartidos
export type {
  ModuleColor,
  ModuleCategory,
  SidebarModule,
  TabSection,
  TabSectionTree,
  ModuleTab,
  ModulesTree,
  SystemModuleTree,
  ToggleResponse,
  ModuleDependentsResponse,
} from '@/features/gestion-estrategica/types/modules.types';
